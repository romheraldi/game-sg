import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell, EmptyState } from '../components/Shell'
import { useRoom } from '../lib/useRoom'
import { sortedGroups } from '../lib/bracket'
import { driver, hasFirebaseConfig } from '../lib/db'
import { EMOJI_CHOICES, gamePath, listGames } from '../lib/games'
import {
  DEFAULT_GROUP_COUNT,
  addGroup,
  createGame,
  moveGame,
  removeGame,
  removeGroup,
  renameGroup,
  resetAll,
  seedDefaultGames,
  seedGroups,
  updateGame,
} from '../lib/actions'
import type { BracketMode, GameType } from '../lib/types'

export default function SetupPage() {
  const { state } = useRoom()
  const groups = sortedGroups(state)
  const games = listGames(state)
  const [title, setTitle] = useState<string | null>(null)

  const titleValue = title ?? state?.title ?? 'Lomba 17 Agustus'

  return (
    <Shell
      title="Setting Acara"
      subtitle="Atur kelompok dan daftar lomba. Semua perubahan langsung tampil di layar lain."
      emoji="⚙️"
    >
      <div className="panel">
        <label className="field">
          <span>Nama acara</span>
          <input
            value={titleValue}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => driver.set('title', titleValue.trim() || 'Lomba 17 Agustus')}
            placeholder="Lomba 17 Agustus"
          />
        </label>
      </div>

      {!hasFirebaseConfig && (
        <div className="notice">
          <strong>Mode lokal.</strong> Firebase belum dikonfigurasi, jadi data cuma tersimpan di
          browser ini. Isi file <code>.env</code> (lihat <code>.env.example</code>) supaya semua
          perangkat panitia sinkron realtime.
        </div>
      )}

      <h2 className="section-title">Kelompok ({groups.length})</h2>
      {groups.length === 0 ? (
        <EmptyState
          title="Belum ada kelompok"
          hint={`Bikin ${DEFAULT_GROUP_COUNT} kelompok sekaligus, lalu ganti namanya satu per satu.`}
          action={
            <button className="btn primary" onClick={() => seedGroups(DEFAULT_GROUP_COUNT)}>
              Buat {DEFAULT_GROUP_COUNT} Kelompok
            </button>
          }
        />
      ) : (
        <div className="group-list">
          {groups.map((group, index) => (
            <div className="group-row" key={group.id}>
              <span className="group-index">{index + 1}</span>
              <input
                className="group-input"
                value={group.name}
                onChange={(e) => renameGroup(group.id, e.target.value)}
                placeholder={`Kelompok ${index + 1}`}
              />
              <button
                className="btn danger small"
                onClick={() => {
                  if (confirm(`Hapus "${group.name}"?`)) removeGroup(group.id)
                }}
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="row gap wrap top-space">
        <button className="btn" onClick={() => addGroup(state)}>
          + Tambah Kelompok
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            if (confirm('Timpa semua nama kelompok dengan nama default?'))
              seedGroups(DEFAULT_GROUP_COUNT)
          }}
        >
          Isi Ulang {DEFAULT_GROUP_COUNT} Kelompok
        </button>
      </div>

      <h2 className="section-title">Daftar Lomba ({games.length})</h2>
      {games.length === 0 ? (
        <EmptyState
          title="Belum ada lomba"
          hint="Buat lomba sendiri di bawah, atau pakai susunan acara 17-an bawaan."
          action={
            <button className="btn primary" onClick={() => seedDefaultGames(state)}>
              Isi Lomba Bawaan 17-an
            </button>
          }
        />
      ) : (
        <div className="game-list">
          {games.map((game, index) => (
            <div className="game-row" key={game.id}>
              <div className="game-row-main">
                <select
                  className="emoji-select"
                  value={game.emoji || '🏆'}
                  onChange={(e) => updateGame(game.id, { emoji: e.target.value })}
                  title="Ikon lomba"
                >
                  {[game.emoji || '🏆', ...EMOJI_CHOICES.filter((e) => e !== game.emoji)].map(
                    (emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ),
                  )}
                </select>
                <input
                  className="group-input"
                  value={game.name}
                  onChange={(e) => updateGame(game.id, { name: e.target.value })}
                />
                <span className={`type-tag ${game.type}`}>
                  {game.type === 'urutan' ? 'Urutan tampil' : 'Sistem gugur'}
                </span>
              </div>

              <div className="game-row-config">
                {game.type === 'bracket' ? (
                  <>
                    <label className="inline-field">
                      <span>Per match</span>
                      <select
                        value={game.matchSize ?? 2}
                        onChange={(e) => updateGame(game.id, { matchSize: Number(e.target.value) })}
                      >
                        <option value={2}>2 kelompok</option>
                        <option value={3}>3 kelompok</option>
                        <option value={4}>4 kelompok</option>
                        <option value={5}>5 kelompok</option>
                        <option value={6}>6 kelompok</option>
                      </select>
                    </label>
                    <label className="inline-field">
                      <span>Lawan</span>
                      <select
                        value={game.mode ?? 'random'}
                        onChange={(e) =>
                          updateGame(game.id, { mode: e.target.value as BracketMode })
                        }
                      >
                        <option value="random">Undi acak</option>
                        <option value="manual">Diatur panitia</option>
                      </select>
                    </label>
                    {game.bracket && (
                      <span className="hint">
                        Bagan sudah dibuat — perubahan ini baru terpakai kalau bagannya dibuat
                        ulang.
                      </span>
                    )}
                  </>
                ) : (
                  <span className="hint">Kelompok dipanggil satu per satu sesuai urutan.</span>
                )}
              </div>

              <div className="game-row-actions">
                <Link className="btn ghost small" to={gamePath(game.id)}>
                  Buka
                </Link>
                <button
                  className="btn ghost tiny"
                  disabled={index === 0}
                  onClick={() => moveGame(state, game.id, -1)}
                >
                  ↑
                </button>
                <button
                  className="btn ghost tiny"
                  disabled={index === games.length - 1}
                  onClick={() => moveGame(state, game.id, 1)}
                >
                  ↓
                </button>
                <button
                  className="btn danger tiny"
                  onClick={() => {
                    if (confirm(`Hapus lomba "${game.name}" beserta bagannya?`)) removeGame(game.id)
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewGameForm />

      <div className="row gap wrap top-space">
        {games.length > 0 && (
          <button className="btn ghost" onClick={() => seedDefaultGames(state)}>
            Tambahkan Lomba Bawaan 17-an
          </button>
        )}
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('Hapus SEMUA data acara (kelompok, lomba, dan semua bagan)?')) resetAll()
          }}
        >
          Reset Semua Data
        </button>
      </div>

      <p className="hint top-space">
        Catatan: menghapus kelompok tidak otomatis membongkar bagan yang sudah dibuat. Kalau daftar
        kelompok berubah, buat ulang bagan di halaman lomba terkait.
      </p>
    </Shell>
  )
}

function NewGameForm() {
  const { state } = useRoom()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏆')
  const [type, setType] = useState<GameType>('bracket')
  const [matchSize, setMatchSize] = useState(2)
  const [mode, setMode] = useState<BracketMode>('random')

  return (
    <form
      className="panel new-game"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!name.trim()) return
        await createGame(state, { name, emoji, type, matchSize, mode })
        setName('')
        setEmoji('🏆')
      }}
    >
      <h3>Tambah Lomba Baru</h3>
      <div className="row gap wrap">
        <select
          className="emoji-select"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          title="Ikon lomba"
        >
          {EMOJI_CHOICES.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
        <input
          className="grow"
          placeholder="Nama lomba, mis. Lomba Balap Karung"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="row gap wrap top-space">
        <label className="field">
          <span>Jenis</span>
          <select value={type} onChange={(e) => setType(e.target.value as GameType)}>
            <option value="bracket">Sistem gugur (ada bagan)</option>
            <option value="urutan">Urutan tampil (seperti fashion show)</option>
          </select>
        </label>

        {type === 'bracket' && (
          <>
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
                <option value="manual">Diatur panitia</option>
              </select>
            </label>
          </>
        )}
      </div>

      <button className="btn primary top-space" type="submit" disabled={!name.trim()}>
        + Buat Lomba
      </button>
      <p className="hint">
        Bagannya dibuat otomatis dari jumlah peserta dan jumlah kelompok per match — kalau tidak
        pas, sisanya dapat <strong>bye</strong>.
      </p>
    </form>
  )
}
