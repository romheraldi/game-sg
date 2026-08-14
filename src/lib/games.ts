import type { BracketMode, Game, GameType, RoomState } from './types'

/** Lomba bawaan, dipakai sebagai isian cepat lewat tombol "Isi Lomba Bawaan". */
export type GameTemplate = {
  id: string
  name: string
  emoji: string
  type: GameType
  matchSize?: number
  mode?: BracketMode
  /** Peserta tambahan di luar kelompok, mis. panitia. */
  extras?: string[]
}

export const GAME_TEMPLATES: GameTemplate[] = [
  { id: 'fashion-show', name: 'Fashion Show', emoji: '👗', type: 'urutan' },
  { id: 'kerupuk', name: 'Lomba Makan Kerupuk', emoji: '🍘', type: 'bracket', matchSize: 3, mode: 'random' },
  { id: 'galon', name: 'Lomba Cantolin Galon', emoji: '💧', type: 'bracket', matchSize: 2, mode: 'random' },
  { id: 'oper-bola', name: 'Lomba Oper Bola', emoji: '⚽', type: 'bracket', matchSize: 2, mode: 'random' },
  {
    id: 'rebut-gelas',
    name: 'Lomba Rebut Gelas',
    emoji: '🥤',
    type: 'bracket',
    matchSize: 2,
    mode: 'manual',
    extras: ['Panitia'],
  },
]

export const EMOJI_CHOICES = [
  '🏆', '🎯', '⚽', '🏐', '🥤', '💧', '🍘', '👗', '🎤', '🪢', '🥁', '🎨',
  '🏃', '🧦', '🪣', '🥄', '🎈', '🧗', '🚩', '🎳',
]

export function listGames(state: RoomState | null): Game[] {
  return Object.values(state?.games ?? {})
    .filter((g): g is Game => Boolean(g?.id && g?.name))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
}

export function getGame(state: RoomState | null, gameId: string | undefined): Game | null {
  if (!gameId) return null
  const game = state?.games?.[gameId]
  return game?.id && game?.name ? game : null
}

export function gamePath(gameId: string) {
  return `/g/${gameId}`
}

/** Ubah nama lomba jadi id yang aman dipakai sebagai key database. */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'lomba'
}

export function uniqueGameId(state: RoomState | null, name: string): string {
  const base = slugify(name)
  let id = base
  let n = 2
  while (state?.games?.[id]) id = `${base}-${n++}`
  return id
}

/** Keterangan singkat untuk kartu menu, dirangkai dari setelan lomba. */
export function gameSummary(game: Game): string {
  if (game.type === 'urutan') return 'Urutan tampil tiap kelompok'
  const size = game.bracket?.matchSize ?? game.matchSize ?? 2
  const mode = game.bracket?.mode ?? game.mode ?? 'random'
  const lawan = size === 2 ? '2 kelompok (head to head)' : `${size} kelompok sekaligus`
  const cara = mode === 'random' ? 'undi acak' : 'lawan diatur panitia'
  return `${lawan} · ${cara} · sistem gugur`
}
