# Papan Lomba 17 Agustus 🇮🇩

Mini web app buat mandu acara lomba: satu halaman untuk satu lomba, tampilannya besar supaya
enak dilihat di TV, dan semua data tersambung ke **Firebase Realtime Database** jadi panitia
bisa kolaborasi dari HP masing-masing sementara TV ikut berubah otomatis.

Daftar lombanya tidak dikunci di dalam kode — semuanya dibuat sendiri lewat halaman setting,
jadi aplikasi yang sama bisa dipakai lagi untuk acara-acara berikutnya.

**Live: https://papan-lomba-17an.vercel.app**

## Halaman

| Halaman | Alamat | Isi |
| --- | --- | --- |
| Menu | `#/` | Daftar semua lomba, tinggal klik untuk ditampilkan di TV |
| Setting Acara | `#/setup` | Nama acara, daftar kelompok, dan daftar lomba |
| Halaman lomba | `#/g/<id-lomba>` | Bagan sistem gugur atau urutan tampil, sesuai jenis lombanya |
| Rekap Juara | `#/rekap` | Juara 1 tiap lomba dalam satu layar |

## Bikin lomba sendiri

Di `#/setup` bagian **Daftar Lomba**, tiap lomba punya tiga setelan:

1. **Nama + ikon** — bebas, mis. "Lomba Balap Karung" 🏃.
2. **Jenis lomba**
   - *Sistem gugur* — dibuatkan bagan otomatis sampai tersisa satu juara.
   - *Urutan tampil* — kelompok dipanggil satu per satu, seperti fashion show.
3. **Untuk lomba sistem gugur:**
   - **Jumlah kelompok per match** — 2 (head to head), 3, 4, 5, atau 6 kelompok tanding barengan.
   - **Cara menentukan lawan** — *undi acak* atau *diatur panitia* (bagan dibuat kosong, lawan
     diisi manual lewat dropdown).

Bagannya dihitung otomatis dari jumlah peserta dan jumlah kelompok per match, terus dilanjutkan
babak demi babak sampai tersisa satu pemenang. Contoh dengan 9 kelompok:

| Per match | Bentuk bagan |
| --- | --- |
| 2 kelompok | 5 match (satu kelompok dapat **BYE**) → 3 → 2 → final |
| 3 kelompok | 3 match berisi 3 kelompok → final berisi 3 kelompok |
| 4 kelompok | 3 match berisi 3 kelompok → final berisi 3 kelompok |

Peserta dibagi rata ke tiap match, jadi 9 kelompok dengan setelan 4 per match jadi 3+3+3, bukan
4+4+1. Kalau jumlahnya tetap tidak pas, sisanya otomatis dapat **BYE** dan tinggal diloloskan
lewat tombol *Loloskan otomatis*.

Tombol **Isi Lomba Bawaan 17-an** menyiapkan susunan acara 17-an lengkap sekali klik: Fashion
Show, Makan Kerupuk (3 kelompok per match), Cantolin Galon, Oper Bola, dan Rebut Gelas (lawan
diatur panitia, plus peserta tambahan "Panitia" sehingga total 10 peserta).

## Cara pakai saat acara

1. **`#/setup`** → klik *Buat 9 Kelompok*, ganti namanya, lalu susun daftar lombanya. Perubahan
   nama langsung muncul di semua halaman lain, termasuk di bagan yang sudah jalan.
2. **Lomba urutan tampil** → atur urutan (`↑` `↓` atau *Acak Urutan*), lalu pandu acara dengan
   tombol *Selesai → Panggil Berikutnya*. Tombol panah `←` / `→` juga bisa dipakai, cocok kalau
   pakai remote presenter.
3. **Lomba sistem gugur** → pilih peserta lalu klik *Undi & Buat Bagan*. Saat lomba berjalan,
   klik tombol **Menang** pada kelompok pemenang; kelompok itu otomatis masuk ke match babak
   berikutnya. Banner besar di atas selalu menunjukkan match yang sedang berjalan, dan tombol
   *Sorot di TV* dipakai kalau mau menentukan sendiri match mana yang ditampilkan.
4. **Mode TV** → tombol di pojok kanan atas. Semua tombol panitia disembunyikan dan tulisan
   diperbesar. Setelan ini per perangkat, jadi TV bisa mode TV sementara HP panitia tetap mode
   panitia.

Slot di babak mana pun bisa ditimpa manual lewat dropdown, dan slot bisa ditambah (`+ Slot`)
atau dihapus (`✕`). Jadi kalau ada kelompok yang batal ikut, mau ditukar lawannya, atau mau ada
satu kelompok yang bye langsung ke babak tertentu, bagannya tinggal disesuaikan tanpa dibongkar
dari awal.

## Menjalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil siap deploy ada di folder dist/
```

## Firebase

Project Firebase acara ini **sudah tertanam di aplikasi** (`DEFAULT_FIREBASE` di
`src/lib/db.ts`), jadi setelah `npm install` aplikasi langsung tersambung ke
`game-sg-580fd` tanpa setup tambahan. Data acara disimpan di
`rooms/<VITE_ROOM_ID>` — defaultnya `rooms/17an`.

Status koneksi terlihat di pojok kanan atas: **● Realtime** berarti tersambung Firebase,
**● Mode lokal** berarti data hanya disimpan di browser.

### Satu langkah yang wajib: pasang Database Rules

Tanpa ini, semua tulisan akan ditolak Firebase dan datanya tidak akan tersimpan.

1. Buka [Firebase Console](https://console.firebase.google.com/) → project **game-sg-580fd**
   → **Realtime Database** → tab **Rules**.
2. Tempel isi file [`database.rules.json`](./database.rules.json), lalu **Publish**:

   ```json
   {
     "rules": {
       "rooms": {
         "$room": {
           ".read": true,
           ".write": "now < 1786986000000"
         }
       }
     }
   }
   ```

   Angka `now < ...` adalah batas waktu boleh menulis dalam milidetik; nilai di atas =
   **18 Agustus 2026 00:00 WIB**. Ganti sesuai tanggal acara —
   `new Date('2027-08-18T00:00:00+07:00').getTime()` di console browser untuk menghitungnya.
   Setelah acara selesai, ubah `.write` jadi `false` supaya hasil lombanya tidak bisa diubah
   orang lain. Data tetap bisa dibaca karena `.read` masih `true`.

Aturan di atas sengaja dibuat terbuka selama acara: tidak ada login, siapa pun yang tahu
alamat situsnya bisa ikut mengubah data. Itu memang yang dibutuhkan supaya panitia bisa
kolaborasi tanpa ribet, tapi jangan pakai project ini untuk data yang sifatnya rahasia, dan
pastikan `.write` dimatikan setelah acara kelar.

Kunci `apiKey` di konfigurasi memang ikut terkirim ke browser — itu normal untuk Firebase web,
bukan kredensial rahasia. Yang menentukan siapa boleh baca/tulis adalah Rules di atas.

### Cara memastikan sudah tersambung

```bash
npm run dev
```

Buka halaman `#/setup`, ubah satu nama kelompok, lalu buka halaman yang sama di HP atau tab
incognito. Kalau namanya ikut berubah tanpa refresh, sambungan realtime sudah jalan. Kalau
badge masih **● Mode lokal**, berarti `VITE_LOCAL_MODE` sedang diisi di `.env`.

### Acara berikutnya

Ganti `VITE_ROOM_ID` di `.env` (mis. `agustusan-2027`) supaya datanya mulai bersih tanpa
menghapus data acara lama. Aturan `$room` di atas berlaku untuk semua nama ruangan, jadi tidak
perlu ubah Rules lagi selain tanggal batas tulisnya.

Untuk latihan tanpa menyentuh database sama sekali, isi `VITE_LOCAL_MODE=1` di `.env` — data
disimpan di browser dan tetap sinkron antar tab di satu perangkat.

## Deploy

Sudah live di **https://papan-lomba-17an.vercel.app** (project Vercel `papan-lomba-17an`,
target production, Vercel Authentication dimatikan supaya bisa dibuka panitia tanpa login).

Deployment pertama diunggah langsung dari file, **belum tersambung ke repo GitHub**, jadi
`git push` tidak otomatis men-deploy ulang. Untuk mengaktifkan deploy otomatis, hubungkan
repo `romheraldi/game-sg` di dashboard Vercel (*Project → Settings → Git*) dan pastikan
branch produksinya berisi kode terbaru.

Hasil `npm run build` adalah situs statis biasa, jadi bisa juga ditaruh di Netlify, Firebase
Hosting, atau GitHub Pages. Routing memakai hash (`#/g/kerupuk`) sehingga tidak perlu
konfigurasi rewrite di server. Kalau memakai project Firebase lain, isi variabel
`VITE_FIREBASE_*` di setelan environment penyedia hosting sebelum build.

Sebelum acara, buka halaman lomba di TV lalu aktifkan **Mode TV** dan fullscreen browser (`F11`).
