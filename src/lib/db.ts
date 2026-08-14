/**
 * Abstraksi database realtime.
 *
 * - Kalau env Firebase diisi -> pakai Firebase Realtime Database (sinkron antar perangkat).
 * - Kalau kosong -> mode lokal (localStorage + BroadcastChannel), tetap realtime antar tab
 *   di satu perangkat. Berguna buat coba-coba sebelum Firebase disiapkan.
 */

export type Unsubscribe = () => void

/* ------------------------------------------------------------------ */
/* Pelaporan kegagalan baca/tulis                                      */
/* ------------------------------------------------------------------ */

type ErrorListener = (message: string | null) => void

const errorListeners = new Set<ErrorListener>()
let lastError: string | null = null

/** Dengarkan kegagalan menyimpan/membaca supaya bisa ditampilkan ke panitia. */
export function onDbError(cb: ErrorListener): Unsubscribe {
  errorListeners.add(cb)
  cb(lastError)
  return () => errorListeners.delete(cb)
}

function emitError(message: string | null) {
  lastError = message
  errorListeners.forEach((cb) => cb(message))
}

function reportError(err: unknown) {
  emitError(err instanceof Error ? err.message : String(err))
}

/** Dipanggil setiap operasi berhasil supaya peringatan lama hilang sendiri. */
function reportOk() {
  if (lastError !== null) emitError(null)
}

export interface Driver {
  mode: 'firebase' | 'local'
  /** Dengarkan seluruh isi ruangan. */
  subscribe(cb: (value: any) => void): Unsubscribe
  /** Tulis banyak path sekaligus, relatif terhadap root ruangan. */
  update(updates: Record<string, unknown>): Promise<void>
  /** Timpa satu path. Kirim null untuk menghapus. */
  set(path: string, value: unknown): Promise<void>
}

const env = import.meta.env

export const ROOM_ID: string = env.VITE_ROOM_ID || '17an'

/**
 * Konfigurasi bawaan project Firebase acara ini.
 *
 * Nilai-nilai ini memang ikut terkirim ke browser — konfigurasi web Firebase bukan rahasia,
 * dan pengamanannya ada di Realtime Database Rules (lihat `database.rules.json`), bukan di
 * penyembunyian kunci. Semuanya tetap bisa ditimpa lewat file `.env` kalau mau pakai project
 * Firebase lain.
 */
const DEFAULT_FIREBASE = {
  apiKey: 'AIzaSyDxzNQbes6g1AotOlM8-JIDE1uM82IDsl8',
  authDomain: 'game-sg-580fd.firebaseapp.com',
  databaseURL: 'https://game-sg-580fd-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'game-sg-580fd',
  storageBucket: 'game-sg-580fd.firebasestorage.app',
  messagingSenderId: '7440163515',
  appId: '1:7440163515:web:e983f944ff6cd185643f9e',
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE.authDomain,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE.databaseURL,
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE.appId,
}

/** Set VITE_LOCAL_MODE=1 kalau mau latihan tanpa menyentuh database sama sekali. */
const forceLocal = env.VITE_LOCAL_MODE === '1' || env.VITE_LOCAL_MODE === 'true'

export const hasFirebaseConfig =
  !forceLocal &&
  Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId)

/* ------------------------------------------------------------------ */
/* Driver lokal                                                        */
/* ------------------------------------------------------------------ */

function getIn(obj: any, path: string[]): any {
  return path.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

function setIn(obj: any, path: string[], value: unknown): any {
  if (path.length === 0) return value
  const [head, ...rest] = path
  const base = typeof obj === 'object' && obj !== null ? { ...obj } : {}
  if (rest.length === 0) {
    if (value === null || value === undefined) delete base[head]
    else base[head] = value
  } else {
    base[head] = setIn(base[head], rest, value)
  }
  return base
}

const splitPath = (path: string) => path.split('/').filter(Boolean)

/**
 * Tiru perilaku Firebase: nilai null dibuang, dan node yang jadi tanpa isi ikut hilang.
 * Dipakai di driver lokal supaya latihan tanpa Firebase berperilaku sama dengan aslinya.
 */
function stripNulls(value: unknown): unknown {
  if (value === null || value === undefined) return undefined
  if (Array.isArray(value) || typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const cleaned = stripNulls(item)
    if (cleaned !== undefined) out[key] = cleaned
  }
  return Object.keys(out).length ? out : undefined
}

function createLocalDriver(room: string): Driver {
  const storageKey = `game17an:${room}`
  const listeners = new Set<(value: any) => void>()
  const channel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(storageKey) : null

  const read = (): any => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}')
    } catch {
      return {}
    }
  }

  const emit = () => {
    const value = read()
    listeners.forEach((cb) => cb(value))
  }

  const write = (next: any) => {
    localStorage.setItem(storageKey, JSON.stringify(next ?? {}))
    channel?.postMessage('changed')
    emit()
  }

  channel?.addEventListener('message', emit)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === storageKey) emit()
    })
  }

  return {
    mode: 'local',
    subscribe(cb) {
      listeners.add(cb)
      cb(read())
      return () => listeners.delete(cb)
    },
    async set(path, value) {
      write(setIn(read(), splitPath(path), stripNulls(value) ?? null))
    },
    async update(updates) {
      let next = read()
      for (const [path, value] of Object.entries(updates)) {
        next = setIn(next, splitPath(path), stripNulls(value) ?? null)
      }
      write(next)
    },
  }
}

/* ------------------------------------------------------------------ */
/* Driver Firebase                                                     */
/* ------------------------------------------------------------------ */

function createFirebaseDriver(room: string): Driver {
  // Import statis: bundler tetap tree-shake kalau tidak dipakai lewat dynamic flag,
  // tapi di sini memang selalu dibutuhkan saat konfigurasi ada.
  const rootPromise = (async () => {
    const { initializeApp } = await import('firebase/app')
    const { getDatabase, ref } = await import('firebase/database')
    const app = initializeApp(firebaseConfig as Record<string, string>)
    const db = getDatabase(app)
    return { db, root: ref(db, `rooms/${room}`), ref }
  })()

  return {
    mode: 'firebase',
    subscribe(cb) {
      let stop: Unsubscribe | null = null
      let cancelled = false
      ;(async () => {
        try {
          const { onValue } = await import('firebase/database')
          const { root } = await rootPromise
          if (cancelled) return
          stop = onValue(
            root,
            (snap) => {
              reportOk()
              cb(snap.val() ?? {})
            },
            (err) => {
              reportError(err)
              // Tetap kirim data kosong supaya halaman tidak menggantung di "Memuat…".
              cb({})
            },
          )
        } catch (err) {
          reportError(err)
          cb({})
        }
      })()
      return () => {
        cancelled = true
        stop?.()
      }
    },
    async set(path, value) {
      try {
        const { set } = await import('firebase/database')
        const { db, root, ref } = await rootPromise
        const target = path ? ref(db, `rooms/${room}/${path}`) : root
        await set(target, value ?? null)
        reportOk()
      } catch (err) {
        reportError(err)
      }
    },
    async update(updates) {
      try {
        const { update } = await import('firebase/database')
        const { root } = await rootPromise
        const clean: Record<string, unknown> = {}
        for (const [path, value] of Object.entries(updates)) {
          clean[path] = value === undefined ? null : value
        }
        await update(root, clean)
        reportOk()
      } catch (err) {
        reportError(err)
      }
    },
  }
}

export const driver: Driver = hasFirebaseConfig
  ? createFirebaseDriver(ROOM_ID)
  : createLocalDriver(ROOM_ID)

export { getIn }
