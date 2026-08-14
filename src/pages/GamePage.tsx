import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell, EmptyState } from '../components/Shell'
import { useRoom, useTvMode } from '../lib/useRoom'
import { GAME_BY_ID } from '../lib/games'
import {
  championOf,
  nextPendingMatch,
  participantName,
  readRounds,
  sortedGroups,
  type ResolvedMatch,
} from '../lib/bracket'
import {
  addExtra,
  addSlot,
  assignSlot,
  clearBracket,
  createBracket,
  ensureExtras,
  gameParticipants,
  removeExtra,
  removeSlot,
  setFocus,
  setGameParticipants,
  setWinner,
} from '../lib/actions'
import type { BracketMode } from '../lib/types'

export default function GamePage({ gameId }: { gameId: string }) {
  const game = GAME_BY_ID[gameId]
  const { state } = useRoom()
  const [tv] = useTvMode()

  const bracket = state?.games?.[gameId]?.bracket ?? null
  const rounds = useMemo(() => readRounds(bracket), [bracket])
  const participants = gameParticipants(state, gameId)
  const champion = championOf(rounds)
  const nameOf = (id: string | null | undefined) => participantName(state, gameId, id)

  const focusId = state?.games?.[gameId]?.focus ?? null
  const focusMatch =
    rounds.flatMap((r) => r.matches).find((m) => m.id === focusId) ?? nextPendingMatch(rounds)

  const loaded = state !== null
  useEffect(() => {
    if (loaded) ensureExtras(game, state)
    // Cukup sekali per lomba begitu data ruangan masuk; ensureExtras sendiri
    // yang menjaga agar peserta bawaan tidak dibuat ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, loaded])

  if (!game) return null

  if (!bracket) {
    return (
      <Shell title={game.name} subtitle={game.note} emoji={game.emoji}>
        <BracketSetup gameId={gameId} />
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
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Hapus bagan dan susun ulang dari awal?')) clearBracket(gameId)
            }}
          >
            Buat Ulang Bagan
          </button>
          <span className="hint">
            Klik nama peserta lalu tombol <strong>Menang</strong> untuk meloloskan ke babak
            berikutnya. Pemenang otomatis masuk ke match selanjutnya.
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
          <NowPlaying match={focusMatch} rounds={rounds} nameOf={nameOf} gameId={gameId} tv={tv} />
        )
      )}

      <div className="bracket">
        {rounds.map((round) => (
          <div className="round" key={round.index}>
            <div className="round-head">{round.name}</div>
            {round.matches.map((match) => (
              <MatchCard
                key={match.id}
                gameId={gameId}
                match={match}
                usedInRound={round.matches
                  .filter((m) => m.id !== match.id)
                  .flatMap((m) => m.slots.map((s) => s.participantId))
                  .filter(Boolean) as string[]}
                participants={participants}
                nameOf={nameOf}
                focused={focusMatch?.id === match.id}
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
  rounds: ReturnType<typeof readRounds>
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
              onClick={() => setWinner(gameId, match.roundIndex, match.matchIndex, slot.participantId)}
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
}: {
  gameId: string
  match: ResolvedMatch
  participants: string[]
  usedInRound: string[]
  nameOf: (id: string | null | undefined) => string
  focused: boolean
}) {
  const filled = match.slots.filter((s) => s.participantId)

  return (
    <div className={`match ${focused ? 'focused' : ''} ${match.winner ? 'settled' : ''}`}>
      <div className="match-head">
        <span>{match.label}</span>
        {match.isBye && <span className="tag">BYE</span>}
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
                  onClick={() => setWinner(gameId, match.roundIndex, match.matchIndex, slot.participantId)}
                >
                  Menang
                </button>
              )}
              <select
                className="slot-select"
                value={slot.participantId ?? ''}
                onChange={(e) =>
                  assignSlot(gameId, match.roundIndex, match.matchIndex, slot.key, e.target.value || null)
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
        <button className="btn tiny ghost" onClick={() => setFocus(gameId, match.id)}>
          Sorot di TV
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function BracketSetup({ gameId }: { gameId: string }) {
  const game = GAME_BY_ID[gameId]
  const { state } = useRoom()
  const groups = sortedGroups(state)
  const extras = Object.values(state?.games?.[gameId]?.extras ?? {})
  const [selected, setSelected] = useState<string[] | null>(null)
  const [matchSize, setMatchSize] = useState(game.defaultMatchSize)
  const [mode, setMode] = useState<BracketMode>(game.defaultMode)
  const [extraName, setExtraName] = useState('')

  const all = [...groups.map((g) => g.id), ...extras.map((e) => e.id)]
  const picked = selected ?? all
  const nameOf = (id: string) => participantName(state, gameId, id)

  if (!groups.length) {
    return (
      <EmptyState
        title="Belum ada kelompok"
        hint="Daftarkan kelompoknya dulu di halaman setting."
        action={
          <Link className="btn primary" to="/setup">
            Ke Setting Kelompok
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
      <p className="hint">{game.note}</p>

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
                  removeExtra(gameId, id, picked)
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
            await addExtra(gameId, extraName.trim())
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
          await setGameParticipants(gameId, picked)
          await createBracket(gameId, picked, matchSize, mode)
        }}
      >
        {mode === 'random' ? '🎲 Undi & Buat Bagan' : 'Buat Bagan Kosong'}
      </button>
      <p className="hint">
        Bagan dibuat sampai tersisa satu pemenang. Kalau jumlah peserta tidak pas, sisanya otomatis
        dapat <strong>bye</strong> ke babak berikutnya. Slot mana pun tetap bisa diubah manual
        setelah bagan jadi.
      </p>
    </div>
  )
}
