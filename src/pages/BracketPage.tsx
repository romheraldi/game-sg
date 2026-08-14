import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell, EmptyState } from '../components/Shell'
import { useRoom, useTvMode } from '../lib/useRoom'
import { gameSummary } from '../lib/games'
import {
  championOf,
  nextPendingMatch,
  participantName,
  readRounds,
  sortedGroups,
  type ResolvedMatch,
  type ResolvedRound,
} from '../lib/bracket'
import {
  addExtra,
  addSlot,
  assignSlot,
  clearBracket,
  createBracket,
  gameParticipants,
  removeExtra,
  removeSlot,
  setFocus,
  setGameParticipants,
  setWinner,
} from '../lib/actions'
import type { BracketMode, Game } from '../lib/types'

export default function BracketPage({ game }: { game: Game }) {
  const { state } = useRoom()
  const [tv] = useTvMode()

  const bracket = game.bracket ?? null
  const rounds = useMemo(() => readRounds(bracket), [bracket])
  const participants = gameParticipants(state, game.id)
  const champion = championOf(rounds)
  const nameOf = (id: string | null | undefined) => participantName(state, game.id, id)

  // Sorotan manual menang atas pilihan otomatis; kalau tidak ada, ikut match yang belum selesai.
  const pinnedMatch = rounds.flatMap((r) => r.matches).find((m) => m.id === game.focus) ?? null
  const focusMatch = pinnedMatch ?? nextPendingMatch(rounds)

  if (!bracket) {
    return (
      <Shell title={game.name} subtitle={gameSummary(game)} emoji={game.emoji}>
        <BracketSetup game={game} />
      </Shell>
    )
  }

  return (
    <Shell
      title={game.name}
      subtitle={`${participants.length} peserta · ${bracket.matchSize} kelompok per match · sistem gugur`}
      emoji={game.emoji}
      controls={
        <div className="row gap wrap">
          {pinnedMatch && (
            <button className="btn" onClick={() => setFocus(game.id, null)}>
              ✕ Batal Sorot ({pinnedMatch.label})
            </button>
          )}
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Hapus bagan dan susun ulang dari awal?')) clearBracket(game.id)
            }}
          >
            Buat Ulang Bagan
          </button>
          <span className="hint">
            Klik nama peserta lalu tombol <strong>Menang</strong> untuk meloloskan ke babak
            berikutnya. Pemenang otomatis masuk ke match selanjutnya.
            {pinnedMatch
              ? ' Sorotan sedang dikunci manual — batalkan supaya kembali mengikuti match berjalan.'
              : ''}
          </span>
        </div>
      }
    >
      {champion ? (
        <div className="champion">
          <div className="champion-label">🏆 JUARA 1 — {game.name.toUpperCase()}</div>
          <div className="champion-name">{nameOf(champion)}</div>
        </div>
      ) : (
        focusMatch && (
          <NowPlaying
            match={focusMatch}
            rounds={rounds}
            nameOf={nameOf}
            gameId={game.id}
            tv={tv}
          />
        )
      )}

      <div className="bracket">
        {rounds.map((round) => (
          <div className="round" key={round.index}>
            <div className="round-head">{round.name}</div>
            {round.matches.map((match) => (
              <MatchCard
                key={match.id}
                gameId={game.id}
                match={match}
                usedInRound={round.matches
                  .filter((m) => m.id !== match.id)
                  .flatMap((m) => m.slots.map((s) => s.participantId))
                  .filter(Boolean) as string[]}
                participants={participants}
                nameOf={nameOf}
                focused={focusMatch?.id === match.id}
                pinned={pinnedMatch?.id === match.id}
              />
            ))}
          </div>
        ))}
      </div>
    </Shell>
  )
}

/* ------------------------------------------------------------------ */

function NowPlaying({
  match,
  rounds,
  nameOf,
  gameId,
  tv,
}: {
  match: ResolvedMatch
  rounds: ResolvedRound[]
  nameOf: (id: string | null | undefined) => string
  gameId: string
  tv: boolean
}) {
  const roundName = rounds[match.roundIndex]?.name ?? ''
  const players = match.slots.filter((s) => s.participantId)

  return (
    <div className="now-playing">
      <div className="now-label">
        {roundName} · {match.label}
      </div>
      <div className="now-players">
        {players.length ? (
          players.map((slot, i) => (
            <div className="now-player" key={slot.key}>
              {i > 0 && <span className="vs">VS</span>}
              <span className="now-name">{nameOf(slot.participantId)}</span>
            </div>
          ))
        ) : (
          <div className="now-name muted">Menunggu peserta</div>
        )}
      </div>
      {!tv && (
        <div className="row gap wrap center admin-only">
          {players.map((slot) => (
            <button
              key={slot.key}
              className="btn primary"
              onClick={() =>
                setWinner(gameId, match.roundIndex, match.matchIndex, slot.participantId)
              }
            >
              🏅 {nameOf(slot.participantId)} Menang
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MatchCard({
  gameId,
  match,
  participants,
  usedInRound,
  nameOf,
  focused,
  pinned,
}: {
  gameId: string
  match: ResolvedMatch
  participants: string[]
  usedInRound: string[]
  nameOf: (id: string | null | undefined) => string
  focused: boolean
  /** Disorot manual lewat tombol, bukan karena kebetulan match berjalan. */
  pinned: boolean
}) {
  const filled = match.slots.filter((s) => s.participantId)

  return (
    <div className={`match ${focused ? 'focused' : ''} ${match.winner ? 'settled' : ''}`}>
      <div className="match-head">
        <span>{match.label}</span>
        <span className="row gap">
          {pinned && <span className="tag pin">DISOROT</span>}
          {match.isBye && <span className="tag">BYE</span>}
        </span>
      </div>

      {match.slots.map((slot) => {
        const isWinner = !!slot.participantId && slot.participantId === match.winner
        const options = participants.filter(
          (p) => !usedInRound.includes(p) || p === slot.participantId,
        )
        return (
          <div className={`slot ${isWinner ? 'winner' : ''}`} key={slot.key}>
            <span className="slot-name">
              {slot.participantId ? nameOf(slot.participantId) : slot.placeholder ?? 'Belum diisi'}
            </span>
            {isWinner && <span className="slot-trophy">🏅</span>}
            <span className="slot-actions admin-only">
              {slot.participantId && !isWinner && (
                <button
                  className="btn tiny primary"
                  onClick={() =>
                    setWinner(gameId, match.roundIndex, match.matchIndex, slot.participantId)
                  }
                >
                  Menang
                </button>
              )}
              <select
                className="slot-select"
                value={slot.participantId ?? ''}
                onChange={(e) =>
                  assignSlot(
                    gameId,
                    match.roundIndex,
                    match.matchIndex,
                    slot.key,
                    e.target.value || null,
                  )
                }
                title="Atur peserta di slot ini"
              >
                <option value="">{slot.placeholder ?? '— kosong —'}</option>
                {options.map((p) => (
                  <option key={p} value={p}>
                    {nameOf(p)}
                  </option>
                ))}
              </select>
              <button
                className="btn tiny ghost"
                title="Hapus slot"
                onClick={() => removeSlot(gameId, match.roundIndex, match.matchIndex, slot.key)}
              >
                ✕
              </button>
            </span>
          </div>
        )
      })}

      <div className="match-foot admin-only">
        {match.isBye && filled.length === 1 && !match.winner && (
          <button
            className="btn tiny primary"
            onClick={() =>
              setWinner(gameId, match.roundIndex, match.matchIndex, filled[0].participantId)
            }
          >
            Loloskan otomatis
          </button>
        )}
        {match.winner && (
          <button
            className="btn tiny ghost"
            onClick={() => setWinner(gameId, match.roundIndex, match.matchIndex, null)}
          >
            Batalkan pemenang
          </button>
        )}
        <button
          className="btn tiny ghost"
          onClick={() =>
            addSlot(
              gameId,
              match.roundIndex,
              match.matchIndex,
              Math.max(-1, ...match.slots.map((s) => Number(s.key))) + 1,
            )
          }
        >
          + Slot
        </button>
        {pinned ? (
          <button className="btn tiny primary" onClick={() => setFocus(gameId, null)}>
            ✕ Batal sorot
          </button>
        ) : (
          <button className="btn tiny ghost" onClick={() => setFocus(gameId, match.id)}>
            Sorot di TV
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function BracketSetup({ game }: { game: Game }) {
  const { state } = useRoom()
  const groups = sortedGroups(state)
  const extras = Object.values(game.extras ?? {})
  const [selected, setSelected] = useState<string[] | null>(null)
  const [matchSize, setMatchSize] = useState(game.matchSize ?? 2)
  const [mode, setMode] = useState<BracketMode>(game.mode ?? 'random')
  const [extraName, setExtraName] = useState('')

  const all = [...groups.map((g) => g.id), ...extras.map((e) => e.id)]
  const picked = selected ?? all
  const nameOf = (id: string) => participantName(state, game.id, id)

  if (!groups.length) {
    return (
      <EmptyState
        title="Belum ada kelompok"
        hint="Daftarkan kelompoknya dulu di halaman setting."
        action={
          <Link className="btn primary" to="/setup">
            Ke Setting Acara
          </Link>
        }
      />
    )
  }

  const toggle = (id: string) =>
    setSelected(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id])

  return (
    <div className="panel setup-panel">
      <h2>Susun Bagan</h2>
      <p className="hint">
        Bagan dibuat otomatis sampai tersisa satu pemenang, mengikuti jumlah peserta dan jumlah
        kelompok per match di bawah.
      </p>

      <h3>Peserta ({picked.length})</h3>
      <div className="checklist">
        {all.map((id) => (
          <label key={id} className={`check ${picked.includes(id) ? 'on' : ''}`}>
            <input type="checkbox" checked={picked.includes(id)} onChange={() => toggle(id)} />
            <span>{nameOf(id)}</span>
            {extras.some((e) => e.id === id) && (
              <button
                type="button"
                className="btn tiny ghost"
                onClick={(e) => {
                  e.preventDefault()
                  removeExtra(game.id, id, picked)
                  setSelected(picked.filter((p) => p !== id))
                }}
              >
                ✕
              </button>
            )}
          </label>
        ))}
      </div>

      <div className="row gap wrap">
        <input
          className="grow"
          placeholder="Tambah peserta non-kelompok (mis. Panitia)"
          value={extraName}
          onChange={(e) => setExtraName(e.target.value)}
        />
        <button
          className="btn"
          disabled={!extraName.trim()}
          onClick={async () => {
            await addExtra(game.id, extraName.trim())
            setExtraName('')
            setSelected(null)
          }}
        >
          + Tambah
        </button>
      </div>

      <div className="row gap wrap top-space">
        <label className="field">
          <span>Jumlah kelompok per match</span>
          <select value={matchSize} onChange={(e) => setMatchSize(Number(e.target.value))}>
            <option value={2}>2 kelompok (head to head)</option>
            <option value={3}>3 kelompok sekaligus</option>
            <option value={4}>4 kelompok sekaligus</option>
            <option value={5}>5 kelompok sekaligus</option>
            <option value={6}>6 kelompok sekaligus</option>
          </select>
        </label>
        <label className="field">
          <span>Cara menentukan lawan</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as BracketMode)}>
            <option value="random">Undi acak</option>
            <option value="manual">Atur manual oleh panitia</option>
          </select>
        </label>
      </div>

      <button
        className="btn primary big top-space"
        disabled={picked.length < 2}
        onClick={async () => {
          await setGameParticipants(game.id, picked)
          await createBracket(game.id, picked, matchSize, mode)
        }}
      >
        {mode === 'random' ? '🎲 Undi & Buat Bagan' : 'Buat Bagan Kosong'}
      </button>
      <p className="hint">
        Kalau jumlah peserta tidak pas dibagi, sisanya otomatis dapat <strong>bye</strong> ke babak
        berikutnya. Slot mana pun tetap bisa diubah manual setelah bagan jadi.
      </p>
    </div>
  )
}
