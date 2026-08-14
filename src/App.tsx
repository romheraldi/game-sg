import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SetupPage from './pages/SetupPage'
import BracketPage from './pages/BracketPage'
import UrutanPage from './pages/UrutanPage'
import RecapPage from './pages/RecapPage'
import { Shell, EmptyState } from './components/Shell'
import { getGame } from './lib/games'
import { useRoom } from './lib/useRoom'

function GameRoute() {
  const { gameId } = useParams()
  const { state, loading } = useRoom()
  const game = getGame(state, gameId)

  if (loading) {
    return (
      <Shell title="Memuat…" back={false}>
        <div className="empty">Mengambil data acara…</div>
      </Shell>
    )
  }

  if (!game) {
    return (
      <Shell title="Lomba tidak ditemukan">
        <EmptyState
          title="Lomba ini sudah tidak ada"
          hint="Mungkin sudah dihapus atau tautannya salah."
          action={
            <Link className="btn primary" to="/setup">
              Kelola Daftar Lomba
            </Link>
          }
        />
      </Shell>
    )
  }

  return game.type === 'urutan' ? <UrutanPage game={game} /> : <BracketPage game={game} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/rekap" element={<RecapPage />} />
      <Route path="/g/:gameId" element={<GameRoute />} />
      {/* Tautan versi lama seperti /kerupuk tetap bisa dibuka. */}
      <Route path="/:gameId" element={<GameRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
