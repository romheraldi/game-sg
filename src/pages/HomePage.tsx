import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { GAMES } from '../lib/games'
import { useRoom } from '../lib/useRoom'
import { sortedGroups } from '../lib/bracket'

export default function HomePage() {
  const { state } = useRoom()
  const groups = sortedGroups(state)

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
          <span className="menu-name">Setting Kelompok</span>
          <span className="menu-note">
            {groups.length ? `${groups.length} kelompok terdaftar` : 'Belum ada kelompok — mulai di sini'}
          </span>
        </Link>

        <Link className="menu-card" to="/fashion-show">
          <span className="menu-emoji">👗</span>
          <span className="menu-name">Fashion Show</span>
          <span className="menu-note">Urutan tampil tiap kelompok</span>
        </Link>

        {GAMES.map((game) => (
          <Link key={game.id} className="menu-card" to={game.path}>
            <span className="menu-emoji">{game.emoji}</span>
            <span className="menu-name">{game.name}</span>
            <span className="menu-note">{game.note}</span>
          </Link>
        ))}

        <Link className="menu-card juara" to="/rekap">
          <span className="menu-emoji">🏆</span>
          <span className="menu-name">Rekap Juara</span>
          <span className="menu-note">Pemenang semua lomba</span>
        </Link>
      </div>
    </Shell>
  )
}
