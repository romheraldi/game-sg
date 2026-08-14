import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { gamePath, gameSummary, listGames } from '../lib/games'
import { useRoom } from '../lib/useRoom'
import { sortedGroups } from '../lib/bracket'
import { championOf, participantName, readRounds } from '../lib/bracket'

export default function HomePage() {
  const { state } = useRoom()
  const groups = sortedGroups(state)
  const games = listGames(state)

  return (
    <Shell
      title={state?.title || 'Lomba 17 Agustus'}
      subtitle="Papan lomba — pilih halaman untuk ditampilkan di TV"
      emoji="🇮🇩"
      back={false}
    >
      <div className="menu-grid">
        <Link className="menu-card setup" to="/setup">
          <span className="menu-emoji">⚙️</span>
          <span className="menu-name">Setting Acara</span>
          <span className="menu-note">
            {groups.length ? `${groups.length} kelompok` : 'Belum ada kelompok'} ·{' '}
            {games.length ? `${games.length} lomba` : 'belum ada lomba'}
          </span>
        </Link>

        {games.map((game) => {
          const champion =
            game.type === 'bracket' ? championOf(readRounds(game.bracket ?? null)) : null
          return (
            <Link className="menu-card" key={game.id} to={gamePath(game.id)}>
              <span className="menu-emoji">{game.emoji || '🏆'}</span>
              <span className="menu-name">{game.name}</span>
              <span className="menu-note">{gameSummary(game)}</span>
              {champion && (
                <span className="menu-champion">
                  🏆 {participantName(state, game.id, champion)}
                </span>
              )}
            </Link>
          )
        })}

        <Link className="menu-card juara" to="/rekap">
          <span className="menu-emoji">🏆</span>
          <span className="menu-name">Rekap Juara</span>
          <span className="menu-note">Pemenang semua lomba</span>
        </Link>
      </div>

      {!games.length && (
        <p className="hint">
          Belum ada lomba. Buka <Link to="/setup">Setting Acara</Link> untuk membuat lomba sendiri
          atau memakai susunan 17-an bawaan.
        </p>
      )}
    </Shell>
  )
}
