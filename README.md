# 🕌 E-Mushola Management System (React Native Web & Mobile)

Aplikasi manajemen operasional mushola modern, transparan, dan akuntabel yang dirancang untuk **Web Admin (Desktop/Tablet)**, **Mobile App (Android/iOS)**, dan **Mode Digital Signage TV Mushola**.

---

## 🌟 Fitur Utama

1. **Dashboard & Jadwal Sholat Real-Time**:
   - Perhitungan hisab astronomis jadwal sholat harian (Imsak, Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya).
   - Penanda sholat berikutnya beserta hitung mundur (*countdown*).
   - Kalender Masehi & konversi penanggalan Hijriyah otomatis.
   - Ringkasan total kas dari seluruh kantong kas.

2. **Manajemen Keuangan Multi-Kantong (Multi-Pocket Cash)**:
   - Pemisahan kantong kas amanah:
     - *Kas Operasional DKM* (listrik, kebersihan, bisyarah marbot/imam)
     - *Kas Pembangunan & Renovasi* (proyek fisik)
     - *Kas Sosial Yatim & Dhuafa* (santunan berkala)
     - *Kas Majelis Taklim Ibu-Ibu*
     - *Kas Remaja Islam (RISMA)*
   - Pencatatan pemasukan dan pengeluaran secara real-time dengan pembaruan saldo instan.
   - **Generator Teks Warta Jumat**: Menghasilkan teks laporan keuangan otomatis yang siap dibacakan oleh petugas takmir sebelum khutbah sholat Jumat.

3. **Struktur Organisasi & Badan Otonom**:
   - Takmir Inti DKM, RISMA Pemuda, Majelis Taklim Khadijah, TPA/TPQ Nurul Ilmi, dan Panitia Qurban & ZISWAF.
   - Rincian pengurus, kontak PIC, alokasi dana per unit, dan matriks hak akses (*Role-Based Access Control*).

4. **Kalender Kegiatan, Dakwah & Sholat Jumat**:
   - Jadwal Petugas Sholat Jumat pekan ini (Khotib, Imam, Muadzin, Bilal, dan Tema Khutbah).
   - Kalender kajian rutin (Ahad Shubuh, Selasa Muslimah, Mabit Pemuda).
   - Formulir pendaftaran dan tambah agenda kajian baru.

5. **Direktori Jamaah, Warga & Aspirasi**:
   - Pendataan warga lingkungan sekitar mushola berdasarkan RT/RW.
   - Klasifikasi kesejahteraan: *Warga Mampu*, *Mustahik*, dan *Yatim/Dhuafa* untuk pemerataan santunan.
   - Kotak Saran & Aspirasi digital untuk menampung ide dan masukan warga secara terbuka maupun anonim.

6. **Inventaris & Sarana Prasarana (Sarpras)**:
   - Katalog aset (sound system, karpet Turki, AC, keranda jenazah, tenda & kursi).
   - Status kelayakan kondisi (Baik, Rusak Ringan, Perlu Diganti).
   - Label izin peminjaman fasilitas oleh warga untuk keperluan hajatan warga sekitar.

7. **Mode Digital Signage TV Mushola**:
   - Tampilan layar penuh 16:9 ramah Smart TV di ruang sholat mushola.
   - Jam digital raksasa berdetik setiap detik + kalender Hijriyah.
   - Hitung mundur menuju waktu sholat dan jeda iqomah.
   - Mutiara hadits harian dan running text berjalan (laporan kas pekanan & himbauan ketertiban ponsel).

---

## 🚀 Cara Menjalankan Proyek

Pastikan Anda berada di direktori proyek:
```bash
cd /home/natsuko/.gemini/antigravity-cli/scratch/mushola-management
```

### 1. Menjalankan di Web Browser (Chrome, Firefox, Safari):
```bash
npm run web
# atau
npx expo start --web
```
Aplikasi akan terbuka otomatis di `http://localhost:8081`. Tampilan web menyediakan sidebar navigasi yang responsif untuk desktop dan tablet.

### 2. Menjalankan di Android:
```bash
npm run android
```
*(Bisa menggunakan emulator Android Studio atau Expo Go di HP fisik Anda)*.

### 3. Menjalankan di iOS:
```bash
npm run ios
```
*(Memerlukan macOS dengan Xcode atau Expo Go di iPhone)*.

### 4. Build Static Web untuk Hosting:
```bash
npx expo export -p web
```
Output static web siap dideploy (misal ke Vercel, Netlify, atau Firebase Hosting) di folder `dist/`.

---

## 📁 Struktur Direktori

```
mushola-management/
├── App.tsx                     # Entry point, responsive layout & tab navigation
├── app.json                    # Konfigurasi Expo & metadata aplikasi
├── package.json                # Dependencies Expo 58, React 19, react-native-web
├── dist/                       # Output bundle web siap produksi
└── src/
    ├── types/                  # TypeScript data interfaces & roles
    ├── utils/                  # Currency (Rupiah), Date, and Hijri converters
    ├── services/               # Astronomical prayer times calculation service
    ├── store/
    │   ├── mockData.ts         # Mock data awal (transaksi, jamaah, aset, DKM)
    │   └── useMusholaStore.tsx # State management konteks (keuangan, kegiatan, TV mode)
    └── screens/
        ├── DashboardScreen.tsx    # Ringkasan utama, saldo kas & jadwal sholat
        ├── FinanceScreen.tsx      # Manajemen buku kas & teks warta Jumat
        ├── OrganizationScreen.tsx # Struktur DKM & badan otonom (RISMA, Taklim, TPA)
        ├── EventsScreen.tsx       # Kalender kajian & petugas sholat Jumat
        ├── JamaahScreen.tsx       # Direktori KK warga, mustahik, & aspirasi
        ├── InventoryScreen.tsx    # Katalog aset & peminjaman fasilitas
        └── SignageTVScreen.tsx    # Digital signage mode untuk Smart TV Mushola
```

---

## 🛠️ Roadmap Fase Pengembangan Lanjutan

Dokumentasi lengkap desain sistem, skema database relasional (ERD), dan rincian fase 1 s.d. 5 dapat dilihat pada berkas blueprint:
`mushola_architecture_and_roadmap.md`.
