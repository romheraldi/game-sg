import { useState } from 'react'
import { Shell, EmptyState } from '../components/Shell'
import { useRoom } from '../lib/useRoom'
import { sortedGroups } from '../lib/bracket'
import { driver, hasFirebaseConfig } from '../lib/db'
import {
  DEFAULT_GROUP_COUNT,
  addGroup,
  removeGroup,
  renameGroup,
  resetAll,
  seedGroups,
} from '../lib/actions'

export default function SetupPage() {
  const { state } = useRoom()
  const groups = sortedGroups(state)
  const [title, setTitle] = useState<string | null>(null)

  const titleValue = title ?? state?.title ?? 'Lomba 17 Agustus'

  return (
    <Shell
      title="Setting Kelompok"
      subtitle="Nama kelompok di sini dipakai di semua lomba, dan langsung ikut berubah di layar lain"
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
            if (confirm('Timpa semua nama kelompok dengan nama default?')) seedGroups(DEFAULT_GROUP_COUNT)
          }}
        >
          Isi Ulang {DEFAULT_GROUP_COUNT} Kelompok
        </button>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('Hapus SEMUA data acara (kelompok, urutan, dan semua bagan lomba)?')) {
              resetAll()
            }
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
