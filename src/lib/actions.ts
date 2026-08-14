import { driver } from './db'
import { generateBracket, shuffle, sortedGroups, toArray } from './bracket'
import { GAME_TEMPLATES, listGames, uniqueGameId } from './games'
import type { BracketMode, Game, GameType, RoomState } from './types'

export const DEFAULT_GROUP_COUNT = 9

const groupId = (index: number) => `k${index + 1}`

export async function seedGroups(count = DEFAULT_GROUP_COUNT) {
  const groups: Record<string, { id: string; name: string; order: number }> = {}
  for (let i = 0; i < count; i++) {
    groups[groupId(i)] = { id: groupId(i), name: `Kelompok ${i + 1}`, order: i }
  }
  await driver.set('groups', groups)
}

export async function addGroup(state: RoomState | null) {
  const existing = sortedGroups(state)
  let index = existing.length
  let id = groupId(index)
  while (state?.groups?.[id]) {
    index += 1
    id = groupId(index)
  }
  await driver.set(`groups/${id}`, {
    id,
    name: `Kelompok ${existing.length + 1}`,
    order: existing.length,
  })
}

export async function renameGroup(id: string, name: string) {
  await driver.set(`groups/${id}/name`, name)
}

export async function removeGroup(id: string) {
  await driver.set(`groups/${id}`, null)
}

/* ------------------------------ Daftar lomba ------------------------------ */

export type NewGameInput = {
  name: string
  emoji?: string
  type: GameType
  matchSize?: number
  mode?: BracketMode
}

export async function createGame(state: RoomState | null, input: NewGameInput): Promise<string> {
  const id = uniqueGameId(state, input.name)
  const order = listGames(state).length
  const game: Game = {
    id,
    name: input.name.trim(),
    emoji: input.emoji || (input.type === 'urutan' ? '🎤' : '🏆'),
    type: input.type,
    order,
  }
  if (input.type === 'bracket') {
    game.matchSize = input.matchSize ?? 2
    game.mode = input.mode ?? 'random'
  }
  await driver.set(`games/${id}`, game)
  return id
}

export async function updateGame(gameId: string, patch: Partial<Game>) {
  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    updates[`games/${gameId}/${key}`] = value ?? null
  }
  await driver.update(updates)
}

export async function removeGame(gameId: string) {
  await driver.set(`games/${gameId}`, null)
}

export async function moveGame(state: RoomState | null, gameId: string, delta: number) {
  const games = listGames(state)
  const from = games.findIndex((g) => g.id === gameId)
  const to = from + delta
  if (from < 0 || to < 0 || to >= games.length) return
  const updates: Record<string, unknown> = {}
  ;[games[from], games[to]] = [games[to], games[from]]
  games.forEach((game, index) => {
    updates[`games/${game.id}/order`] = index
  })
  await driver.update(updates)
}

/** Isi cepat dengan susunan acara 17-an bawaan. */
export async function seedDefaultGames(state: RoomState | null) {
  const updates: Record<string, unknown> = {}
  GAME_TEMPLATES.forEach((template, index) => {
    const game: Game = {
      id: template.id,
      name: template.name,
      emoji: template.emoji,
      type: template.type,
      order: index,
    }
    if (template.type === 'bracket') {
      game.matchSize = template.matchSize ?? 2
      game.mode = template.mode ?? 'random'
      if (template.extras?.length) {
        game.extras = Object.fromEntries(
          template.extras.map((name, i) => {
            const id = `x_${template.id}_${i}`
            return [id, { id, name }]
          }),
        )
      }
    }
    // Pertahankan data yang sudah ada supaya bagan yang jalan tidak hilang.
    const existing = state?.games?.[template.id]
    if (existing) {
      updates[`games/${template.id}`] = { ...game, ...existing, name: existing.name || game.name }
      return
    }
    // Pindahkan data fashion show dari versi lama yang menyimpannya di luar daftar lomba.
    if (template.id === 'fashion-show' && state?.fashion) {
      game.urutan = state.fashion
      updates['fashion'] = null
    }
    updates[`games/${template.id}`] = game
  })
  await driver.update(updates)
}

/* -------------------------------- Urutan ---------------------------------- */

export function urutanOrder(state: RoomState | null, gameId: string): string[] {
  const stored = toArray<string>(state?.games?.[gameId]?.urutan?.order)
  const groups = sortedGroups(state).map((g) => g.id)
  const valid = stored.filter((id) => groups.includes(id))
  const missing = groups.filter((id) => !valid.includes(id))
  return [...valid, ...missing]
}

export async function setUrutanOrder(gameId: string, order: string[]) {
  await driver.set(`games/${gameId}/urutan/order`, order)
}

export async function shuffleUrutan(state: RoomState | null, gameId: string) {
  await setUrutanOrder(gameId, shuffle(urutanOrder(state, gameId)))
}

export async function moveUrutanEntry(
  state: RoomState | null,
  gameId: string,
  id: string,
  delta: number,
) {
  const order = urutanOrder(state, gameId)
  const from = order.indexOf(id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= order.length) return
  ;[order[from], order[to]] = [order[to], order[from]]
  await setUrutanOrder(gameId, order)
}

export async function setUrutanIndex(gameId: string, index: number) {
  await driver.set(`games/${gameId}/urutan/currentIndex`, Math.max(0, index))
}

export async function markUrutanDone(gameId: string, groupIdValue: string, done: boolean) {
  await driver.set(`games/${gameId}/urutan/done/${groupIdValue}`, done ? true : null)
}

export async function resetUrutan(gameId: string) {
  await driver.update({
    [`games/${gameId}/urutan/currentIndex`]: 0,
    [`games/${gameId}/urutan/done`]: null,
  })
}

/* --------------------------------- Bagan ---------------------------------- */

/** Daftar peserta sebuah lomba; default-nya semua kelompok + peserta tambahan. */
export function gameParticipants(state: RoomState | null, gameId: string): string[] {
  const game = state?.games?.[gameId]
  const groups = sortedGroups(state).map((g) => g.id)
  const extras = Object.keys(game?.extras ?? {})
  const stored = toArray<string>(game?.participants)
  if (stored.length) return stored.filter((id) => groups.includes(id) || extras.includes(id))
  return [...groups, ...extras]
}

export async function setGameParticipants(gameId: string, ids: string[]) {
  await driver.set(`games/${gameId}/participants`, ids)
}

export async function addExtra(gameId: string, name: string) {
  const id = `x_${gameId}_${Date.now().toString(36)}`
  await driver.set(`games/${gameId}/extras/${id}`, { id, name })
}

export async function removeExtra(gameId: string, extraId: string, participants: string[]) {
  await driver.update({
    [`games/${gameId}/extras/${extraId}`]: null,
    [`games/${gameId}/participants`]: participants.filter((p) => p !== extraId),
  })
}

export async function createBracket(
  gameId: string,
  participants: string[],
  matchSize: number,
  mode: BracketMode,
) {
  const bracket = generateBracket(participants, matchSize, mode)
  await driver.update({
    [`games/${gameId}/participants`]: participants,
    [`games/${gameId}/matchSize`]: matchSize,
    [`games/${gameId}/mode`]: mode,
    [`games/${gameId}/bracket`]: bracket,
    [`games/${gameId}/focus`]: null,
  })
}

export async function clearBracket(gameId: string) {
  await driver.update({ [`games/${gameId}/bracket`]: null, [`games/${gameId}/focus`]: null })
}

export async function setWinner(
  gameId: string,
  roundIndex: number,
  matchIndex: number,
  participantId: string | null,
) {
  await driver.set(
    `games/${gameId}/bracket/rounds/${roundIndex}/matches/${matchIndex}/winner`,
    participantId,
  )
}

export async function assignSlot(
  gameId: string,
  roundIndex: number,
  matchIndex: number,
  slotKey: string,
  participantId: string | null,
) {
  await driver.set(
    `games/${gameId}/bracket/rounds/${roundIndex}/matches/${matchIndex}/slots/${slotKey}/pick`,
    participantId,
  )
}

export async function addSlot(
  gameId: string,
  roundIndex: number,
  matchIndex: number,
  nextKey: number,
) {
  // `i` wajib ada, kalau tidak slot kosong ini langsung hilang lagi di Firebase.
  await driver.set(
    `games/${gameId}/bracket/rounds/${roundIndex}/matches/${matchIndex}/slots/${nextKey}`,
    { i: nextKey },
  )
}

export async function removeSlot(
  gameId: string,
  roundIndex: number,
  matchIndex: number,
  slotKey: string,
) {
  await driver.set(
    `games/${gameId}/bracket/rounds/${roundIndex}/matches/${matchIndex}/slots/${slotKey}`,
    null,
  )
}

export async function setFocus(gameId: string, matchId: string | null) {
  await driver.set(`games/${gameId}/focus`, matchId)
}

export async function resetAll() {
  await driver.set('', { title: 'Lomba 17 Agustus' })
}
