import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { useRoom } from '../lib/useRoom'
import { GAMES } from '../lib/games'
import { championOf, participantName, readRounds } from '../lib/bracket'
import { fashionOrder } from '../lib/actions'

export default function RecapPage() {
  const { state } = useRoom()
  const order = fashionOrder(state)

  return (
    <Shell title="Rekap Juara" subtitle="Ringkasan pemenang semua lomba" emoji="🏆">
      <div className="recap-grid">
        <div className="recap-card">
          <div className="recap-emoji">👗</div>
          <div className="recap-game">Fashion Show</div>
          <div className="recap-winner muted">
            {order.length ? `${order.length} kelompok tampil` : 'Belum ada peserta'}
          </div>
          <Link className="btn ghost small" to="/fashion-show">
            Buka halaman
          </Link>
        </div>

        {GAMES.map((game) => {
          const rounds = readRounds(state?.games?.[game.id]?.bracket ?? null)
          const champion = championOf(rounds)
          return (
            <div className={`recap-card ${champion ? 'done' : ''}`} key={game.id}>
              <div className="recap-emoji">{game.emoji}</div>
              <div className="recap-game">{game.name}</div>
              <div className={`recap-winner ${champion ? '' : 'muted'}`}>
                {champion ? participantName(state, game.id, champion) : 'Belum ada juara'}
              </div>
              <Link className="btn ghost small" to={game.path}>
                Buka halaman
              </Link>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
