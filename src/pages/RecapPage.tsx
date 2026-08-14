import { Link } from 'react-router-dom'
import { Shell, EmptyState } from '../components/Shell'
import { useRoom } from '../lib/useRoom'
import { gamePath, listGames } from '../lib/games'
import { championOf, participantName, readRounds } from '../lib/bracket'
import { urutanOrder } from '../lib/actions'

export default function RecapPage() {
  const { state } = useRoom()
  const games = listGames(state)

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

  return (
    <Shell title="Rekap Juara" subtitle="Ringkasan pemenang semua lomba" emoji="🏆">
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
                  {order.length ? `${done} dari ${order.length} kelompok sudah tampil` : 'Belum ada peserta'}
                </div>
                <Link className="btn ghost small" to={gamePath(game.id)}>
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
              <Link className="btn ghost small" to={gamePath(game.id)}>
                Buka halaman
              </Link>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
