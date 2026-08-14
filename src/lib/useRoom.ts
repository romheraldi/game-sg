import { useEffect, useState } from 'react'
import { driver } from './db'
import type { RoomState } from './types'

/** Berlangganan seluruh isi ruangan; ikut update begitu panitia lain mengubah data. */
export function useRoom() {
  const [state, setState] = useState<RoomState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const off = driver.subscribe((value) => {
      setState((value ?? {}) as RoomState)
      setLoading(false)
    })
    return off
  }, [])

  return { state, loading, driver }
}

const TV_KEY = 'game17an:tv'

/** Mode TV disimpan per perangkat, bukan di database: TV dan HP panitia beda tampilan. */
export function useTvMode(): [boolean, (value: boolean) => void] {
  const [tv, setTv] = useState(() => localStorage.getItem(TV_KEY) === '1')

  useEffect(() => {
    document.body.classList.toggle('tv-mode', tv)
    return () => document.body.classList.remove('tv-mode')
  }, [tv])

  const update = (value: boolean) => {
    localStorage.setItem(TV_KEY, value ? '1' : '0')
    setTv(value)
  }

  return [tv, update]
}
