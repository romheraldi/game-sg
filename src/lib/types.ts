export type Group = {
  id: string
  name: string
  order: number
}

/** Satu kursi di dalam sebuah match. */
export type Slot = {
  /** Peserta yang di-assign manual (menang telak dari panitia). */
  pick?: string | null
  /** Kalau diisi, peserta = pemenang match dengan id ini. */
  src?: string | null
}

export type Match = {
  id: string
  slots: Record<string, Slot>
  winner?: string | null
}

export type Round = {
  name: string
  matches: Record<string, Match>
}

export type Bracket = {
  matchSize: number
  mode: BracketMode
  createdAt: number
  rounds: Record<string, Round>
}

export type BracketMode = 'random' | 'manual'

export type GameState = {
  /** id peserta: id kelompok, atau id peserta tambahan (mis. panitia). */
  participants?: string[]
  /** Peserta tambahan di luar daftar kelompok. */
  extras?: Record<string, { id: string; name: string }>
  /** Penanda bahwa peserta tambahan bawaan sudah pernah dibuat (biar tidak muncul lagi kalau dihapus). */
  extrasSeeded?: boolean
  /** Match yang lagi disorot di layar TV. */
  focus?: string | null
  bracket?: Bracket | null
}

export type FashionState = {
  /** Urutan tampil, isinya id kelompok. */
  order?: string[]
  currentIndex?: number
  /** id kelompok -> true kalau sudah selesai tampil. */
  done?: Record<string, boolean>
}

export type RoomState = {
  title?: string
  groups?: Record<string, Group>
  fashion?: FashionState
  games?: Record<string, GameState>
}
