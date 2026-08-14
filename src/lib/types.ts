export type Group = {
  id: string
  name: string
  order: number
}

/** Satu kursi di dalam sebuah match. */
export type Slot = {
  /**
   * Nomor urut slot. Wajib ada dan tidak pernah null: Firebase membuang nilai null
   * dan menghapus node yang jadi kosong, sehingga slot yang masih kosong akan lenyap
   * kalau seluruh isinya null.
   */
  i?: number
  /** Peserta yang di-assign manual oleh panitia. */
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

/**
 * `bracket` = lomba sistem gugur.
 * `urutan`  = acara yang cuma butuh urutan tampil, mis. fashion show.
 */
export type GameType = 'bracket' | 'urutan'

export type UrutanState = {
  /** Urutan tampil, isinya id kelompok. */
  order?: string[]
  currentIndex?: number
  /** id kelompok -> true kalau sudah selesai tampil. */
  done?: Record<string, boolean>
}

export type Game = {
  id: string
  name: string
  emoji?: string
  type: GameType
  /** Posisi di menu. */
  order: number

  /* --- khusus tipe bracket --- */
  /** Jumlah kelompok yang tanding barengan dalam satu match. */
  matchSize?: number
  mode?: BracketMode
  /** id peserta: id kelompok, atau id peserta tambahan (mis. panitia). */
  participants?: string[]
  /** Peserta tambahan di luar daftar kelompok. */
  extras?: Record<string, { id: string; name: string }>
  /** Match yang lagi disorot di layar TV. */
  focus?: string | null
  bracket?: Bracket | null

  /* --- khusus tipe urutan --- */
  urutan?: UrutanState
}

export type RoomState = {
  title?: string
  groups?: Record<string, Group>
  games?: Record<string, Game>
  /** Data fashion show dari versi lama, dipindahkan otomatis saat lomba bawaan dibuat. */
  fashion?: UrutanState
}
