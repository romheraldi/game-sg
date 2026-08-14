import type { Bracket, BracketMode, Match, Round, RoomState } from './types'

/** Firebase mengembalikan objek berkunci angka sebagai array. Samakan jadi array. */
export function toArray<T>(value: Record<string, T> | T[] | undefined | null): T[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v) => v != null) as T[]
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => (value as Record<string, T>)[k])
    .filter((v) => v != null)
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Bagi `total` peserta ke `groups` match sedatar mungkin.
 * Contoh: 9 peserta, 5 match -> [2, 2, 2, 2, 1] (yang dapat 1 = bye).
 */
function distribute(total: number, groups: number): number[] {
  const base = Math.floor(total / groups)
  const rest = total % groups
  return Array.from({ length: groups }, (_, i) => base + (i < rest ? 1 : 0))
}

function roundName(index: number, totalRounds: number): string {
  const fromEnd = totalRounds - 1 - index
  if (fromEnd === 0) return 'FINAL'
  if (fromEnd === 1) return 'SEMIFINAL'
  if (fromEnd === 2) return 'PEREMPAT FINAL'
  return `BABAK ${index + 1}`
}

/** Berapa match tiap babak, dari jumlah peserta sampai tersisa satu match. */
function roundSizes(participantCount: number, matchSize: number): number[] {
  const sizes: number[] = []
  let remaining = Math.max(participantCount, 1)
  while (remaining > 1) {
    const matches = Math.ceil(remaining / matchSize)
    sizes.push(matches)
    remaining = matches
  }
  return sizes.length ? sizes : [1]
}

export function generateBracket(
  participantIds: string[],
  matchSize: number,
  mode: BracketMode,
): Bracket {
  const size = Math.max(2, Math.min(6, Math.floor(matchSize) || 2))
  const seeded = mode === 'random' ? shuffle(participantIds) : participantIds
  const sizes = roundSizes(participantIds.length, size)
  const rounds: Record<string, Round> = {}

  sizes.forEach((matchCount, roundIndex) => {
    const incoming = roundIndex === 0 ? participantIds.length : sizes[roundIndex - 1]
    const slotCounts = distribute(incoming, matchCount)
    const matches: Record<string, Match> = {}
    let cursor = 0

    slotCounts.forEach((slotCount, matchIndex) => {
      const slots: Record<string, { pick: string | null; src: string | null }> = {}
      for (let s = 0; s < slotCount; s++) {
        if (roundIndex === 0) {
          slots[s] = {
            pick: mode === 'random' ? seeded[cursor] ?? null : null,
            src: null,
          }
        } else {
          slots[s] = { pick: null, src: `r${roundIndex - 1}m${cursor}` }
        }
        cursor++
      }
      matches[matchIndex] = { id: `r${roundIndex}m${matchIndex}`, slots, winner: null }
    })

    rounds[roundIndex] = { name: roundName(roundIndex, sizes.length), matches }
  })

  return { matchSize: size, mode, createdAt: Date.now(), rounds }
}

/* ------------------------------------------------------------------ */
/* Pembacaan bagan                                                     */
/* ------------------------------------------------------------------ */

export type ResolvedSlot = {
  key: string
  participantId: string | null
  /** Label penampung kalau peserta belum ketahuan, mis. "Pemenang Match 2". */
  placeholder: string | null
}

export type ResolvedMatch = {
  id: string
  roundIndex: number
  matchIndex: number
  label: string
  slots: ResolvedSlot[]
  winner: string | null
  /** Cuma satu peserta -> otomatis lolos. */
  isBye: boolean
  ready: boolean
}

export type ResolvedRound = {
  index: number
  name: string
  matches: ResolvedMatch[]
}

export function readRounds(bracket: Bracket | null | undefined): ResolvedRound[] {
  if (!bracket?.rounds) return []
  const rawRounds = toArray<Round>(bracket.rounds as Record<string, Round>)
  const winners = new Map<string, string | null>()
  const labels = new Map<string, string>()

  // Pass 1: kumpulkan pemenang tiap match supaya slot babak berikutnya bisa dihitung.
  rawRounds.forEach((round, roundIndex) => {
    toArray<Match>(round?.matches as Record<string, Match>).forEach((match, matchIndex) => {
      const id = match?.id || `r${roundIndex}m${matchIndex}`
      winners.set(id, match?.winner ?? null)
      labels.set(id, `Match ${matchIndex + 1}`)
    })
  })

  return rawRounds.map((round, roundIndex) => {
    const matches = toArray<Match>(round?.matches as Record<string, Match>).map(
      (match, matchIndex) => {
        const rawSlots = match?.slots ?? {}
        const slotKeys = Object.keys(rawSlots).sort((a, b) => Number(a) - Number(b))
        const slots: ResolvedSlot[] = slotKeys.map((key) => {
          const slot = (rawSlots as Record<string, { pick?: string | null; src?: string | null }>)[key]
          const fromSrc = slot?.src ? winners.get(slot.src) ?? null : null
          const participantId = slot?.pick ?? fromSrc ?? null
          const placeholder =
            !participantId && slot?.src
              ? `Pemenang ${labels.get(slot.src) ?? slot.src}`
              : null
          return { key, participantId, placeholder }
        })
        const filled = slots.filter((s) => s.participantId).length
        return {
          id: match?.id || `r${roundIndex}m${matchIndex}`,
          roundIndex,
          matchIndex,
          label: `Match ${matchIndex + 1}`,
          slots,
          winner: match?.winner ?? null,
          isBye: slots.length === 1,
          ready: filled >= 1 && filled === slots.length,
        }
      },
    )
    return { index: roundIndex, name: round?.name || `BABAK ${roundIndex + 1}`, matches }
  })
}

/** Match berikutnya yang belum ada pemenangnya, dibaca dari babak paling awal. */
export function nextPendingMatch(rounds: ResolvedRound[]): ResolvedMatch | null {
  for (const round of rounds) {
    for (const match of round.matches) {
      if (!match.winner && match.slots.some((s) => s.participantId)) return match
    }
  }
  return null
}

export function championOf(rounds: ResolvedRound[]): string | null {
  const final = rounds[rounds.length - 1]
  if (!final || final.matches.length !== 1) return null
  return final.matches[0].winner ?? null
}

/* ------------------------------------------------------------------ */
/* Nama peserta                                                        */
/* ------------------------------------------------------------------ */

export function participantName(
  state: RoomState | null,
  gameId: string,
  participantId: string | null | undefined,
): string {
  if (!participantId) return '—'
  const group = state?.groups?.[participantId]
  if (group?.name) return group.name
  const extra = state?.games?.[gameId]?.extras?.[participantId]
  if (extra?.name) return extra.name
  return participantId
}

export function sortedGroups(state: RoomState | null) {
  return Object.values(state?.groups ?? {}).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
  )
}
