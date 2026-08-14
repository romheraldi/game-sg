import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell, EmptyState } from '../components/Shell'
import { useRoom } from '../lib/useRoom'
import { gamePath, listGames } from '../lib/games'
import { championOf, participantName, readRounds } from '../lib/bracket'
import { urutanOrder } from '../lib/actions'
import type { Game } from '../lib/types'

export default function RecapPage() {
  const { state } = useRoom()
  const games = listGames(state)
  // Layar juara: bawaannya hanya lomba yang sudah ketahuan pemenangnya.
  const [onlyWinners, setOnlyWinners] = useState(true)

  /**
   * Isi layar juara: lomba sistem gugur hanya muncul kalau juaranya sudah ada,
   * sedangkan lomba urutan tampil (mis. fashion show) selalu muncul berisi
   * daftar kelompok yang sudah naik panggung.
   */
  const highlights = games
    .map((game: Game) => {
      if (game.type === 'urutan') {
        const done = urutanOrder(state, game.id).filter((id) => game.urutan?.done?.[id])
        return { game, champion: null, performed: done }
      }
      return {
        game,
        champion: championOf(readRounds(game.bracket ?? null)),
        performed: null as string[] | null,
      }
    })
    .filter((entry) => entry.champion || entry.performed)

  if (!games.length) {
    return (
      <Shell title="Rekap Juara" emoji="🏆">
        <EmptyState
          title="Belum ada lomba"
          hint="Buat dulu daftar lombanya di halaman setting."
          action={
            <Link className="btn primary" to="/setup">
              Ke Setting Acara
            </Link>
          }
        />
      </Shell>
    )
  }

  const controls = (
    <div className="row gap wrap">
      <button className="btn" onClick={() => setOnlyWinners(!onlyWinners)}>
        {onlyWinners ? 'Tampilkan Semua Lomba' : 'Tampilkan Juara Saja'}
      </button>
      <span className="hint">
        {onlyWinners
          ? 'Layar hanya menampilkan lomba yang sudah ada juaranya — cocok untuk pengumuman di TV.'
          : 'Menampilkan semua lomba beserta yang belum selesai.'}
      </span>
    </div>
  )

  if (onlyWinners) {
    return (
      <Shell
        title="Juara Lomba"
        subtitle={`${highlights.filter((h) => h.champion).length} dari ${
          games.filter((g) => g.type === 'bracket').length
        } lomba sudah ada juaranya`}
        emoji="🏆"
        controls={controls}
      >
        {highlights.length === 0 ? (
          <div className="champion-wait">
            <div className="champion-label">🏆 DAFTAR JUARA</div>
            <div className="champion-wait-text">Belum ada juara yang ditetapkan</div>
          </div>
        ) : (
          <div className="winner-list">
            {highlights.map(({ game, champion, performed }) => (
              <div className={`winner-card ${performed ? 'roster' : ''}`} key={game.id}>
                <div className="winner-emoji">{game.emoji || '🏆'}</div>
                <div className="winner-body">
                  <div className="winner-game">{game.name}</div>
                  {performed ? (
                    performed.length ? (
                      <div className="performed">
                        {performed.map((id) => (
                          <span className="performed-chip" key={id}>
                            {state?.groups?.[id]?.name ?? id}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="winner-name muted">Belum ada yang tampil</div>
                    )
                  ) : (
                    <div className="winner-name">{participantName(state, game.id, champion)}</div>
                  )}
                </div>
                <div className="winner-medal">{performed ? '🎤' : '🏅'}</div>
              </div>
            ))}
          </div>
        )}
      </Shell>
    )
  }

  return (
    <Shell
      title="Rekap Juara"
      subtitle="Ringkasan pemenang semua lomba"
      emoji="🏆"
      controls={controls}
    >
      <div className="recap-grid">
        {games.map((game) => {
          if (game.type === 'urutan') {
            const order = urutanOrder(state, game.id)
            const done = Object.keys(game.urutan?.done ?? {}).length
            return (
              <div className="recap-card" key={game.id}>
                <div className="recap-emoji">{game.emoji || '🎤'}</div>
                <div className="recap-game">{game.name}</div>
                <div className="recap-winner muted">
                  {order.length
                    ? `${done} dari ${order.length} kelompok sudah tampil`
                    : 'Belum ada peserta'}
                </div>
                <Link className="btn ghost small admin-only" to={gamePath(game.id)}>
                  Buka halaman
                </Link>
              </div>
            )
          }

          const champion = championOf(readRounds(game.bracket ?? null))
          return (
            <div className={`recap-card ${champion ? 'done' : ''}`} key={game.id}>
              <div className="recap-emoji">{game.emoji || '🏆'}</div>
              <div className="recap-game">{game.name}</div>
              <div className={`recap-winner ${champion ? '' : 'muted'}`}>
                {champion ? participantName(state, game.id, champion) : 'Belum ada juara'}
              </div>
              <Link className="btn ghost small admin-only" to={gamePath(game.id)}>
                Buka halaman
              </Link>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
