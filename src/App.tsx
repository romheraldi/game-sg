import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SetupPage from './pages/SetupPage'
import FashionShowPage from './pages/FashionShowPage'
import GamePage from './pages/GamePage'
import RecapPage from './pages/RecapPage'
import { GAMES } from './lib/games'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/fashion-show" element={<FashionShowPage />} />
      {GAMES.map((game) => (
        <Route key={game.id} path={game.path} element={<GamePage gameId={game.id} />} />
      ))}
      <Route path="/rekap" element={<RecapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
