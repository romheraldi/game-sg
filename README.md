# Papan Lomba 17 Agustus 🇮🇩

Mini web app buat mandu acara 17an: satu halaman untuk satu lomba, tampilannya besar supaya
enak dilihat di TV, dan semua data tersambung ke **Firebase Realtime Database** jadi panitia
bisa kolaborasi dari HP masing-masing sementara TV ikut berubah otomatis.

## Isi acara

| Halaman | Alamat | Isi |
| --- | --- | --- |
| Setting Kelompok | `#/setup` | Daftar nama kelompok (default 9), dipakai semua lomba |
| Fashion Show | `#/fashion-show` | Urutan tampil + panggilan kelompok satu per satu |
| Lomba Makan Kerupuk | `#/kerupuk` | Undian acak, **3 kelompok per match**, sistem gugur |
| Lomba Cantolin Galon | `#/galon` | Undian acak, 2 kelompok per match, sistem gugur |
| Lomba Oper Bola | `#/oper-bola` | Undian acak, 2 kelompok per match, sistem gugur |
| Lomba Rebut Gelas | `#/rebut-gelas` | 10 peserta (9 kelompok + Panitia), lawan **di-assign manual** |
| Rekap Juara | `#/rekap` | Juara 1 tiap lomba dalam satu layar |

## Cara pakai

1. **Buka `#/setup`** → klik *Buat 9 Kelompok*, lalu ganti namanya. Perubahan nama langsung
   muncul di semua halaman lain, termasuk di bagan yang sudah jadi.
2. **Fashion Show** → atur urutan (`↑` `↓` atau *Acak Urutan*), lalu pandu acara dengan tombol
   *Selesai → Panggil Berikutnya*. Tombol panah `←` / `→` juga bisa dipakai, cocok kalau pakai
   remote presenter.
3. **Lomba bersistem gugur** → di halaman lomba pilih peserta, jumlah kelompok per match, dan
   cara menentukan lawan, lalu klik *Undi & Buat Bagan*. Saat lomba berjalan, klik tombol
   **Menang** pada kelompok pemenang; kelompok itu otomatis masuk ke match babak berikutnya.
4. **Mode TV** → tombol di pojok kanan atas. Semua tombol panitia disembunyikan dan tulisan
   diperbesar. Setelan ini per perangkat, jadi TV bisa mode TV sementara HP panitia tetap mode
   panitia.

### Catatan tiap lomba

- **Makan kerupuk (9 kelompok, 3 per match).** Babak pertama jadi 3 match berisi 3 kelompok,
  pemenang tiap match langsung ketemu di final. Klik *Undi & Buat Bagan* lagi (setelah *Buat
  Ulang Bagan*) kalau mau undian ulang.
- **Cantolin galon / oper bola (9 kelompok, 2 per match).** Karena jumlahnya ganjil, satu
  kelompok otomatis dapat **BYE** dan langsung lolos. Klik *Loloskan otomatis* di kartu match
  bertanda BYE.
- **Rebut gelas.** Peserta tambahan "Panitia" sudah disiapkan sehingga totalnya 10. Baganya
  dibuat kosong, lalu panitia menentukan sendiri isi tiap slot lewat dropdown di kartu match.
  Slot bisa ditambah (`+ Slot`) atau dihapus (`✕`), jadi bentuk baganya bebas diatur — termasuk
  membuat satu kelompok bye langsung ke babak yang diinginkan.

Slot di babak mana pun bisa ditimpa manual, jadi kalau ada kelompok yang batal ikut atau
urutannya perlu ditukar, tinggal ganti lewat dropdown tanpa membongkar bagan.

## Menjalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil siap deploy ada di folder dist/
```

Tanpa konfigurasi Firebase, aplikasi tetap jalan dalam **mode lokal**: data disimpan di browser
dan sinkron antar tab di satu perangkat saja. Cocok buat latihan sebelum hari-H.

## Menyambungkan Firebase (biar realtime antar perangkat)

1. Buat project di [Firebase Console](https://console.firebase.google.com/), lalu aktifkan
   **Realtime Database** (bukan Firestore).
2. Tambahkan Web App di *Project settings → General → Your apps*, salin nilai konfigurasinya.
3. Salin `.env.example` jadi `.env`, isi semua variabel `VITE_FIREBASE_*` beserta
   `VITE_FIREBASE_DATABASE_URL`.
4. Aturan database. Selama acara berlangsung, aturan paling praktis adalah membuka akses ke
   satu ruangan saja dengan batas waktu:

   ```json
   {
     "rules": {
       "rooms": {
         "17an": {
           ".read": true,
           ".write": "now < 1755302400000"
         }
       }
     }
   }
   ```

   Angka `now < ...` adalah batas waktu tulis dalam milidetik (contoh di atas kira-kira
   17 Agustus 2025). Ganti sesuai tanggal acara, dan setelah acara selesai ubah `.write`
   jadi `false` supaya datanya tidak bisa diubah orang lain.

5. Ganti `VITE_ROOM_ID` kalau mau memakai nama ruangan lain (harus sama dengan nama di aturan
   database di atas).

Status koneksi terlihat di pojok kanan atas: **● Realtime** berarti sudah tersambung Firebase,
**● Mode lokal** berarti masih menyimpan data di browser.

## Deploy

Hasil `npm run build` adalah situs statis biasa, jadi bisa ditaruh di Vercel, Netlify, Firebase
Hosting, atau GitHub Pages. Routing memakai hash (`#/kerupuk`) sehingga tidak perlu konfigurasi
rewrite di server. Jangan lupa mengisi variabel `VITE_FIREBASE_*` di setelan environment
penyedia hosting sebelum build.

Sebelum acara, buka halaman lomba di TV lalu aktifkan **Mode TV** dan fullscreen browser (`F11`).
