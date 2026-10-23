# Musholla Al-Muttaqin Design System & Craft Rules

Dokumen acuan standar desain UI/UX, tipografi, animasi, dan prinsip anti-slop untuk ekosistem aplikasi dan Digital Signage Smart TV **Musholla Al Muttaqin**.

---

## 1. Brand Identity & Aesthetic Personality

- **Institusi**: Musholla Al Muttaqin, Perumahan Mutiara Puri Harmoni, Blok H, Sukamanah, Rajeg, Kabupaten Tangerang, Banten.
- **Karakter Desain**: *Islamic Architectural Heritage meets Precision Typography*.
  - Menghindari tampilan murahan/template AI generik (*anti-AI slop*).
  - Mengedepankan ketenangan, kejelasan informasi ibadah, kontras optik yang nyaman di mata jamaah, dan presisi tinggi pada layar Smart TV 1920×1080 maupun mobile app.
- **Signature Craft Move (20% Distinctive Choice)**:
  - Jam analog vektor murni 356px bergaya stasiun Swiss/Bavaria dengan jarum *counterweight* dan poros solid.
  - Kapsul hijau zamrud `#0D3723` dengan sudut lengkung 72px yang memotong belahan kanan jam analog secara asimetris.
  - *Floating Pills* aerodinamis bertengger di atas setiap kartu jadwal sholat dengan ikon astronomi/monoline SVG khusus.
  - Latar belakang ambient foto resolusi tinggi Masjidil Haram / Makkah dengan opasitas lembut 0.38 dan siluet arsitektur masjid bertingkat.

---

## 2. Color Tokens & Semantic Palette

Dilarang keras menggunakan warna ungu/indigo Tailwind default (`#6366f1`, `#4f46e5`, dll) atau gradien 2-stop generik.

| Token | Nilai Hex | Peruntukan |
|---|---|---|
| `--surface-canvas` | `#DBEAE5` | Latar belakang dasar kanvas TV (Mint-Sage tenang) |
| `--surface-card` | `#FFFFFF` | Permukaan kartu jadwal, kartu Jumat, dan kartu QRIS |
| `--accent-hero` | `#0D3723` | Kapsul hijau zamrud sholat berikutnya |
| `--dial-bezel` | `#264B3C` | Bezel tebal jam analog dan jarum jam/menit |
| `--accent-gold` | `#E5B96F` / `#E09B3E` | Border kartu aktif sholat, teks aktif, dan aksen premium |
| `--gold-countdown` | `#C8B55B` | Teks hitung mundur waktu sholat |
| `--text-primary` | `#2D3834` / `#3D403E` | Judul, angka jam primer, nama sholat |
| `--text-secondary` | `#8F9492` / `#A2A6A4` | Label Adzan/Iqomah, unit waktu, keterangan |
| `--text-subtle` | `#64748B` | Alamat musholla dan metadata sekunder |
| `--silhouette-mid` | `#C4DFD8` | Siluet kubah dan menara masjid lapis tengah |
| `--silhouette-front`| `#BFD8D2` | Siluet dinding dan teras masjid lapis depan |

---

## 3. Typography Hierarchy & Craft Rules

### A. Tiga Tingkat Bobot (Three-Weight System)
Hindari menumpuk `fontWeight: '700'`, `'800'`, dan `'900'` di semua tempat. Gunakan sistem 3 bobot terarah:
1. **Read (`400`)**: Teks isi, alamat, tanggal masehi/hijriyah sekunder, catatan kaki.
2. **Emphasize (`500`)**: Label UI (`Adzan`, `Iqomah`, `Terbit`), hitung mundur kapsul, navigasi.
3. **Announce (`600`)**: Judul utama, angka waktu sholat, nama musholla, angka jam analog.

### B. Aturan Letter-Spacing (Tracking)
Aturan baku untuk memastikan tipografi berkarakter profesional:
- **ALL CAPS (Wajib `0.06em` s.d. `0.1em`)**:
  - Teks kapital seperti `WIB`, `ADZAN`, `IQOMAH` wajib memiliki tracking positif (`letterSpacing: 1.5` s.d. `2.0`). Tanpa tracking positif, huruf kapital akan terlihat sempit dan amatir.
- **Display Text (≥48px)**:
  - Wajib memiliki tracking negatif **`-0.02em` s.d. `-0.03em`** (misal `-1.0` s.d. `-1.5px`) agar angka jam besar terlihat kokoh, padat, dan menyatu.
- **Headings (32px+)**:
  - Tracking sedikit negatif **`-0.01em` s.d. `-0.02em`** (`-0.5px` s.d. `-0.8px`).
- **UI Labels & Body (14px–18px)**:
  - Tracking default atau sedikit positif `0.01em` s.d. `0.02em` (`0.2px` s.d. `0.5px`).

### C. Hirarki Visual & Dominant Entry Point
- **Dominant Entry Point**: Kapsul hijau hero dan jam analog 356px di pusat layar menguasai pandangan pertama.
- **Skala Rasional (Multiplicative Scale)**:
  - Display Utama: `66px` (Jam Iqomah pada kartu sholat).
  - Display Hero: `50px` (Nama Sholat Hero), `46px` (Hitung Mundur).
  - Heading 1: `46px`–`48px` (Jam Adzan pada kartu sholat).
  - Heading 2: `32px`–`38px` (Nama Musholla, Jam Terbit).
  - Sub-heading: `24px`–`27px` (Label Adzan/Iqomah, Terbit).
  - Keterangan & Unit: `16px`–`20px` (`WIB`, alamat).

---

## 4. Animation & Motion Discipline

Berdasarkan *universal craft guidelines*:
- **Tujuan Animasi**: Hanya jalankan animasi saat ada perubahan ruang, waktu, atau status (transisi layar, perpindahan waktu sholat, konfirmasi tombol). Dilarang membuat animasi semata-mata untuk dekorasi atau sekadar mengisi kekosongan.
- **Batas Durasi (Duration Thresholds)**:
  - `50–100 ms`: Respon umpan balik instan (*button press, touch feedback*).
  - `150 ms`: Standar konfirmasi perubahan status (*state-confirmation*).
  - `200–300 ms`: Munculnya UI (*modal sheet, dropdown, dialog*).
  - `300–500 ms`: Transisi antar layar.
- **Curve vs Spring**:
  - Gunakan *easing curve* untuk nilai opasitas dan warna.
  - Gunakan *spring physics* untuk posisi, skala, dan rotasi fisik.
- **Aksesibilitas & Reduced Motion**:
  - Seluruh interaksi menghormati preferensi `prefers-reduced-motion`.
  - Tidak ada elemen yang berkedip lebih dari 3 kali per detik (WCAG 2.3.1 / 2.3.2 anti-epilepsi).
  - Jam analog bergerak presisi setiap detik (*discrete 1s tick*) tanpa animasi berputar liar.

---

## 5. Anti-AI-Slop Checklist

Pastikan seluruh implementasi lolos verifikasi berikut:
- [x] **Bebas Tailwind Indigo**: Tidak menggunakan warna ungu/indigo template AI.
- [x] **Bebas Gradien Murahan**: Hero kapsul menggunakan solid emerald `#0D3723` dengan pola vektor presisi.
- [x] **Bebas Emoji Feature Icon**: Seluruh ikon menggunakan SVG monoline garis 2px konsisten (`currentColor`), bukan emoji seperti `✨`, `🚀`, `📥`, `📤`.
- [x] **Bebas Metrik Palsu**: Waktu sholat bersumber aktual dari Bimas Islam Kemenag untuk Rajeg, Kabupaten Tangerang.
- [x] **Bebas Teks Sampel / Lorem Ipsum**: Menggunakan data riil Musholla Al-Muttaqin dan hadits shahih.
- [x] **Bebas Border Kiri Warna-Warni pada Kartu**: Desain kartu menggunakan arsitektur *floating pill* dan kontur bersih.
