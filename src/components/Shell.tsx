import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { driver, onDbError, ROOM_ID } from '../lib/db'
import { useTvMode } from '../lib/useRoom'

/** Peringatan kalau database menolak simpanan — paling sering karena Rules belum dipasang. */
function DbErrorBanner() {
  const [error, setError] = useState<string | null>(null)
  useEffect(() => onDbError(setError), [])

  if (!error) return null
  const denied = /permission|denied/i.test(error)

  return (
    <div className="db-error">
      <strong>⚠️ Perubahan tidak tersimpan.</strong>{' '}
      {denied ? (
        <>
          Firebase menolak akses ke ruangan <code>{ROOM_ID}</code>. Buka Firebase Console →
          Realtime Database → tab <strong>Rules</strong>, pasang aturan dari file{' '}
          <code>database.rules.json</code>, lalu klik Publish. Setelah itu muat ulang halaman ini.
        </>
      ) : (
        <>Sambungan ke database bermasalah. Cek koneksi internet, lalu muat ulang halaman.</>
      )}
      <div className="db-error-detail">{error}</div>
    </div>
  )
}

type Props = {
  title: string
  subtitle?: string
  emoji?: string
  children: ReactNode
  /** Panel kontrol panitia; otomatis disembunyikan di mode TV. */
  controls?: ReactNode
  back?: boolean
}

export function Shell({ title, subtitle, emoji, children, controls, back = true }: Props) {
  const [tv, setTv] = useTvMode()

  return (
    <div className={`shell ${controls ? 'has-controls' : ''}`}>
      <div className="flag-strip" aria-hidden />
      <header className="shell-head">
        <div className="shell-head-left">
          {back && (
            <Link to="/" className="btn ghost small">
              ← Menu
            </Link>
          )}
          <div>
            <h1 className="shell-title">
              {emoji && <span className="shell-emoji">{emoji}</span>}
              {title}
            </h1>
            {subtitle && <p className="shell-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="shell-head-right">
          <span className={`badge ${driver.mode === 'firebase' ? 'ok' : 'warn'}`}>
            {driver.mode === 'firebase' ? `● Realtime · ${ROOM_ID}` : '● Mode lokal'}
          </span>
          <button className="btn ghost small" onClick={() => setTv(!tv)}>
            {tv ? 'Mode Panitia' : 'Mode TV'}
          </button>
        </div>
      </header>

      <DbErrorBanner />

      <main className="shell-body">{children}</main>

      {controls && <section className="control-panel admin-only">{controls}</section>}
    </div>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  )
}
