import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shell, EmptyState } from '../components/Shell'
import { useRoom } from '../lib/useRoom'
import {
  markUrutanDone,
  moveUrutanEntry,
  resetUrutan,
  setUrutanIndex,
  shuffleUrutan,
  urutanOrder,
} from '../lib/actions'
import type { Game } from '../lib/types'

export default function UrutanPage({ game }: { game: Game }) {
  const { state } = useRoom()
  const order = urutanOrder(state, game.id)
  const currentIndex = Math.min(
    game.urutan?.currentIndex ?? 0,
    Math.max(order.length - 1, 0),
  )
  const done = game.urutan?.done ?? {}

  const nameOf = (id: string) => state?.groups?.[id]?.name ?? id
  const currentId = order[currentIndex]
  const nextId = order[currentIndex + 1]

  const go = (delta: number) => {
    const next = currentIndex + delta
    if (next < 0 || next >= order.length) return
    setUrutanIndex(game.id, next)
  }

  // Panah kiri/kanan biar gampang dikendalikan dari remote presenter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!order.length) {
    return (
      <Shell title={game.name} emoji={game.emoji}>
        <EmptyState
          title="Belum ada kelompok"
          hint="Daftarkan kelompoknya dulu di halaman setting."
          action={
            <Link className="btn primary" to="/setup">
              Ke Setting Acara
            </Link>
          }
        />
      </Shell>
    )
  }

  return (
    <Shell
      title={game.name}
      subtitle={`Urutan tampil · ${currentIndex + 1} dari ${order.length}`}
      emoji={game.emoji}
      controls={
        <>
          <div className="row gap wrap">
            <button className="btn" onClick={() => go(-1)} disabled={currentIndex === 0}>
              ← Sebelumnya
            </button>
            <button
              className="btn primary"
              onClick={() => {
                if (currentId) markUrutanDone(game.id, currentId, true)
                go(1)
              }}
              disabled={currentIndex >= order.length - 1}
            >
              Selesai → Panggil Berikutnya
            </button>
            <button
              className="btn"
              onClick={() => go(1)}
              disabled={currentIndex >= order.length - 1}
            >
              Lewati →
            </button>
            {currentId && (
              <button
                className="btn ghost"
                onClick={() => markUrutanDone(game.id, currentId, !done[currentId])}
              >
                {done[currentId] ? 'Batalkan tanda selesai' : 'Tandai sudah tampil'}
              </button>
            )}
          </div>
          <div className="row gap wrap">
            <button className="btn ghost small" onClick={() => shuffleUrutan(state, game.id)}>
              🔀 Acak Urutan
            </button>
            <button className="btn ghost small" onClick={() => resetUrutan(game.id)}>
              Mulai Ulang dari Kelompok Pertama
            </button>
            <span className="hint">Tips: tombol panah ←/→ juga bisa dipakai.</span>
          </div>
        </>
      }
    >
      <div className="stage">
        <div className="stage-label">GILIRAN TAMPIL SEKARANG</div>
        <div className="stage-number">Urutan {currentIndex + 1}</div>
        <div className="stage-name">{currentId ? nameOf(currentId) : '—'}</div>
        {nextId && (
          <div className="stage-next">
            Berikutnya: <strong>{nameOf(nextId)}</strong>
          </div>
        )}
      </div>

      {/* Di mode TV cukup panel besar di atas; daftar lengkapnya untuk panitia. */}
      <ol className="order-list admin-only">
        {order.map((id, index) => (
          <li
            key={id}
            className={`order-item ${index === currentIndex ? 'active' : ''} ${
              done[id] ? 'done' : ''
            }`}
          >
            <span className="order-index">{index + 1}</span>
            <span className="order-name">{nameOf(id)}</span>
            <span className="order-status">
              {index === currentIndex ? 'TAMPIL' : done[id] ? 'Selesai' : ''}
            </span>
            <span className="order-actions admin-only">
              <button
                className="btn ghost tiny"
                onClick={() => moveUrutanEntry(state, game.id, id, -1)}
              >
                ↑
              </button>
              <button
                className="btn ghost tiny"
                onClick={() => moveUrutanEntry(state, game.id, id, 1)}
              >
                ↓
              </button>
              <button className="btn ghost tiny" onClick={() => setUrutanIndex(game.id, index)}>
                Panggil
              </button>
            </span>
          </li>
        ))}
      </ol>
    </Shell>
  )
}
