import type { BracketMode } from './types'

export type GameConfig = {
  id: string
  path: string
  name: string
  short: string
  emoji: string
  /** Berapa kelompok yang tanding barengan dalam satu match. */
  defaultMatchSize: number
  defaultMode: BracketMode
  /** Peserta tambahan di luar kelompok, dibuat otomatis waktu bikin bagan. */
  defaultExtras: string[]
  note: string
}

export const GAMES: GameConfig[] = [
  {
    id: 'kerupuk',
    path: '/kerupuk',
    name: 'Lomba Makan Kerupuk',
    short: 'Makan Kerupuk',
    emoji: '🍘',
    defaultMatchSize: 3,
    defaultMode: 'random',
    defaultExtras: [],
    note: '3 kelompok tanding barengan, diundi acak. Pemenang tiap match lanjut sampai final.',
  },
  {
    id: 'galon',
    path: '/galon',
    name: 'Lomba Cantolin Galon',
    short: 'Cantolin Galon',
    emoji: '💧',
    defaultMatchSize: 2,
    defaultMode: 'random',
    defaultExtras: [],
    note: '2 kelompok per match, diundi acak. Sistem gugur sampai juara 1.',
  },
  {
    id: 'oper-bola',
    path: '/oper-bola',
    name: 'Lomba Oper Bola',
    short: 'Oper Bola',
    emoji: '⚽',
    defaultMatchSize: 2,
    defaultMode: 'random',
    defaultExtras: [],
    note: '2 kelompok per match, diundi acak. Sistem gugur sampai juara 1.',
  },
  {
    id: 'rebut-gelas',
    path: '/rebut-gelas',
    name: 'Lomba Rebut Gelas',
    short: 'Rebut Gelas',
    emoji: '🥤',
    defaultMatchSize: 2,
    defaultMode: 'manual',
    defaultExtras: ['Panitia'],
    note: '10 peserta (9 kelompok + Panitia). Lawan ditentukan manual oleh panitia, bisa diatur siapa yang bye ke babak berikutnya.',
  },
]

export const GAME_BY_ID: Record<string, GameConfig> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
)
