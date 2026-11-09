# Musholla Al Muttaqin: Sistem Desain "Hijau Kartu"

Satu-satunya acuan visual untuk web, mobile, dan layar TV Musholla Al Muttaqin (Perumahan Mutiara Puri Harmoni, Blok H, Sukamanah, Rajeg, Kab. Tangerang). Berlaku sejak November 2026 dan menggantikan arah "Mihrab Flat" serta palet Gunmetal/Coral.

Kode sumber kebenaran:
- Token: `src/theme/colors.ts` (`C`, `F`, `TYPE`, `R`, `SP`, `BP`, `HERO_GRADIENT`)
- Gerak: `src/theme/motion.tsx` (`Press`, `Rise`, `Sheet`, `springTo`, `dur`)
- Komponen: `src/ui/kit.tsx`

Aturan emas: **layar tidak menulis hex, ukuran font, atau `fontWeight` sendiri.** Semua lewat token dan kit. Kalau kit belum punya yang dibutuhkan, tambah ke kit, bukan ke layar.

---

## 1. Design Read

Aplikasi operasional mushola untuk warga dan pengurus perumahan, bahasa visual **dasbor kartu putih membulat di atas kanvas abu-hijau, satu kartu hijau gradien sebagai titik fokus**. Dial: `ENERGY 2 / RHYTHM 2 / MOTION 3`.

Referensi rasa: dasbor kartu modern dengan hijau sebagai satu-satunya warna merek. Identitas Al Muttaqin datang dari hijau logo `#0D3723`, data ibadah nyata (jadwal sholat, kas, petugas Jumat), dan arsir diagonal yang selalu berarti "kosong/tertunda".

---

## 2. Warna

| Token | Hex | Peruntukan |
|---|---|---|
| `C.page` | `#F1F3F0` | Kanvas di belakang kartu |
| `C.card` | `#FFFFFF` | Kartu, sidebar, top bar, sheet |
| `C.sunken` | `#F6F7F5` | Isian input, track, baris hover |
| `C.line` | `#E4E7E3` | Tepi kartu 1px, pemisah baris |
| `C.ink` | `#101A14` | Teks utama |
| `C.inkMuted` | `#56615A` | Teks sekunder, label, keterangan |
| `C.inkFaint` | `#8B948E` | Hanya placeholder & ikon non-esensial. **Bukan untuk teks yang harus dibaca.** |
| `C.g900` | `#0D3723` | Hijau logo; ujung gelap gradien, latar kartu gelap |
| `C.g800` | `#14512F` | Hover tombol utama, avatar gelap |
| `C.g700` | `#1B6B3F` | Tombol utama, link, ikon & label aktif, cincin fokus |
| `C.g500` | `#2E8B57` | Batang grafik, segmen data utama |
| `C.g300` | `#7CC49B` | Segmen data sekunder |
| `C.g100` | `#E3F2E8` | Latar ikon tile, avatar terang |
| `C.g50` | `#F1F8F3` | Hover ringan, latar badge sukses |
| `C.onDark` / `C.onDarkMuted` | `#FFFFFF` / `#C4DDCD` | Teks di atas hijau gelap/gradien |
| `C.warnFg` / `C.warnBg` | `#8A5300` / `#FFF1D9` | Status "perlu perhatian" |
| `C.dangerFg` / `C.dangerBg` | `#B42318` / `#FDE8E6` | Status buruk, aksi merusak (hapus, keluar) |
| `C.hatchLine` / `C.hatchBg` | `#A3ADA6` / `#F1F3F0` | Arsir diagonal |

Aturan:
- **Satu kartu `tone="hero"` (gradien `g700 → g900`) per layar.** Itu titik fokus layar. Boleh ada satu kartu gelap kedua bila isinya hitung mundur/aksi waktu (seperti Time Tracker).
- Hijau adalah satu-satunya warna merek. Kuning dan merah hanya muncul sebagai status nyata (badge, teks error), tidak pernah dekoratif.
- Kategori/kantong dibedakan dengan nada hijau (`g900, g700, g500, g300, g100`) + label teks, bukan warna pelangi.
- Semua pasangan teks lolos WCAG AA (lihat bagian 9).

## 3. Tipografi

Font: **Plus Jakarta Sans** (OFL, `assets/fonts/`), dimuat di `App.tsx`. Dipilih karena geometris dan tenang seperti referensi, dan dirancang di Jakarta.

| Token | Keluarga | Ukuran / tinggi baris | Tracking | Pakai untuk |
|---|---|---|---|---|
| `TYPE.display` | SemiBold | 44 / 50 | -1.2 | Angka besar kartu ringkasan, hitung mundur |
| `TYPE.h1` | SemiBold | 30 / 36 | -0.6 | Judul halaman (satu per layar) |
| `TYPE.h2` | SemiBold | 18 / 24 | -0.2 | Judul kartu, judul sheet (20) |
| `TYPE.h3` | SemiBold | 15 / 20 | 0 | Label kartu ringkasan, judul sub-bagian |
| `TYPE.body` | Regular | 14 / 20 | 0 | Teks isi |
| `TYPE.bodyStrong` | Medium | 14 / 20 | 0 | Judul baris daftar, nama |
| `TYPE.label` | Medium | 13 / 18 | 0 | Label field, label nav |
| `TYPE.small` | Regular | 12 / 16 | 0 | Keterangan, tanggal, meta |
| `TYPE.smallStrong` | Medium | 12 / 16 | 0 | Meta yang perlu ditekankan |
| `TYPE.num` | SemiBold, tabular | (ikut konteks) | 0 | Uang, jam, persen di daftar |

- Bobot dipilih lewat `fontFamily` (`F.r/m/s/b`), bukan `fontWeight`, supaya sama di Android, iOS, dan web.
- Angka uang/waktu selalu `tabular-nums` agar tidak "menari".
- Tidak ada label HURUF KAPITAL bertracking lebar. Label kelompok memakai huruf kalimat (`Menu`, `Umum`).
- Rupiah ditulis `Rp 1.250.000` lewat `formatRupiah`.

## 4. Bentuk, ruang, elevasi

| Token | Nilai | Pakai untuk |
|---|---|---|
| `R.card` | 22 | Kartu, sheet |
| `R.inner` | 14 | Input, ikon tile, blok di dalam kartu |
| `R.chip` | 8 | Badge (6), segmen kecil |
| `R.pill` | 999 | Tombol, kolom cari, tab segmented, batang grafik |

- Variasi radius disengaja: kartu 22, isi 14, tombol pil. Kartu **tidak** pil.
- Spasi `SP`: 4, 8, 12, 16, 20, 28. Jarak antar kartu 16. Padding kartu 20. Padding halaman 28 (desktop/tablet), 16 (HP).
- **Tanpa bayangan.** Kartu dipisah dari kanvas oleh warna (`page` vs `card`) dan tepi 1px `line`. Sheet modal memakai scrim, bukan bayangan.
- Tidak ada glassmorphism, glow, atau grid latar.

## 5. Komponen (src/ui/kit.tsx)

| Komponen | Anatomi | Catatan |
|---|---|---|
| `Screen` | ScrollView, padding responsif, `maxWidth 1320`, jarak 16 | Wajib jadi akar tiap layar tab |
| `PageHeader` | Judul `h1` + subjudul `body/inkMuted` kiri, aksi kanan (wrap di HP) | Aksi: maks 1 `primary` + 1 `outline` |
| `Row` / `Col` | Baris kolom berjarak 16; ditumpuk vertikal di bawah `stackBelow` | Grid responsif semua layar |
| `Card` | Putih, radius 22, tepi 1px, padding 20, animasi `Rise` | `tone="hero"` = gradien hijau; `sunken` = abu |
| `CardHeader` | Judul `h2` + sub `small`, aksi kanan | Aksi: `ArrowButton` atau `Button compact` |
| `Stat` | Label `h3` + `ArrowButton`, angka `display`, keterangan `small` | Keterangan dari data nyata, tanpa delta karangan |
| `ArrowButton` | Lingkaran 40 bertepi, ikon panah serong ↗ | Hanya jika membuka halaman rinci yang ada |
| `Button` | Pil 44px (compact 36 + hitSlop) | Varian `primary`, `outline`, `ghost`, `danger`, `onDark`, `onDarkOutline` |
| `IconButton` | Lingkaran 44, wajib `label` | `filled` untuk aksi utama di kartu gelap |
| `Segmented` | Pil abu berisi tab; aktif = pil hijau penuh | Filter & sub-tab |
| `Badge` | Kotak radius 6, teks 11 Medium, tepi tipis | Tone `success` (Selesai/Baik), `warn` (Berjalan/Rusak ringan), `danger` (Tertunda/Perlu diganti), `neutral` |
| `Avatar` | Lingkaran inisial, `g100`/`g800` | Tidak pernah foto atau karakter karangan |
| `IconTile` | Kotak radius 12, ikon 48% | Ikon pembuka baris daftar |
| `ListRow` | Tile/avatar, judul `bodyStrong`, sub `small`, trailing kanan, garis bawah | Bisa ditekan jika `onPress` |
| `Hatch` | Arsir diagonal 45° | **Selalu** berarti kosong/tertunda; jelaskan di legenda |
| `EmptyState` / `Loading` | Ikon tile netral, judul, kalimat sebab + langkah berikutnya | Wajib untuk setiap daftar/data |
| `Field` | Label di atas, input radius 14 abu, fokus = tepi hijau + latar putih, error merah di bawah | Label selalu terlihat |
| `Sheet` | Panel putih radius 22: naik dari bawah di HP, tengah di layar lebar; Escape menutup | Untuk form tambah/ubah & pilihan |

Pola grafik:
- **Batang pil**: batang `R.pill`, batang tertinggi `g900`, lainnya `g500`/`g300`, hari tanpa data = `Hatch`. Judul kartu menyebut pertanyaannya ("Pemasukan per hari, 7 hari terakhir tercatat").
- **Gauge setengah lingkaran**: segmen `g700`, `g900`, arsir; angka `display` di tengah; legenda bertitik di bawah.

## 6. Tata letak & responsif

Titik patah (`BP`): **HP < 760 ≤ tablet < 1180 ≤ desktop**.

| | HP | Tablet | Desktop |
|---|---|---|---|
| Navigasi | Top bar hijau tua (logo, cari, profil) + tab bawah (maks 5, sisanya di "Lainnya") | Sidebar 232 | Sidebar 260 |
| Top bar konten | Di dalam header hijau | Kolom cari pil + profil | Sama |
| Kartu ringkasan | 2 kolom (hero selebar penuh) | 2 kolom | 4 kolom |
| Isi | 1 kolom | 2 kolom | 3 + 1 kolom (kolom kanan sempit untuk daftar & aksi waktu) |
| Padding halaman | 16 | 28 | 28 |

Sidebar (urutan tetap): logo + nama → kelompok **Menu** (tab sesuai peran; aktif = bar hijau 4px di tepi kiri + ikon & teks `g700`; terkunci = ikon gembok) → kelompok **Umum** (Mode TV, Keluar) → kartu gelap **Infaq QRIS** di bawah.

Top bar desktop/tablet: kolom cari pil (`Cari agenda, warga, aset, transaksi`, pintasan Ctrl/⌘+K), lalu kanan: tombol `Infaq QRIS` dan profil (avatar inisial, nama, peran) yang membuka sheet ganti peran/keluar. Tamu melihat tombol `Masuk dengan Google`.

Pencarian bekerja lintas agenda, warga, inventaris, dan transaksi; memilih hasil membuka tab terkait. Di HP, ikon cari membuka sheet pencarian.

## 7. Gerak (MOTION 3)

| Gerak | Implementasi | Tujuan |
|---|---|---|
| Kartu masuk naik 14px + muncul, berjenjang 40-60ms | `Card delay` / `Rise` | Menandai perpindahan layar, urutan baca kiri-atas ke kanan-bawah |
| Penanda nav meluncur (spring) | sidebar & tab bawah | Memperlihatkan arah perpindahan |
| Batang grafik tumbuh dari bawah, gauge menyapu | `Animated.timing` 700ms | Proporsi terbaca sebelum angka |
| Hitung mundur berdetak per detik | state 1s | Waktu sholat nyata |
| Tombol mengecil 4% saat ditekan, memantul | `Press` | Umpan balik sentuh |
| Sheet naik spring, scrim memudar | `Sheet` | Menjaga konteks |
| Konfirmasi singkat memudar setelah ±2 detik | `Animated.Text` | Status tanpa dialog |

Durasi: 50-100ms umpan balik, 150ms status, 200-300ms sheet, 300-500ms layar. Semua lewat `dur()` sehingga 0ms saat reduced-motion. **Tidak ada animasi berulang tanpa pemicu.**

## 8. Konten & copy

- Bahasa Indonesia santun dan langsung. Kalimat biasa, bukan slogan.
- Tanpa em dash (`—`), tanpa emoji, tanpa kata "canggih/revolusioner/seamless".
- Angka harus dari data. Tidak ada "naik 12% dari bulan lalu" kecuali dihitung dari transaksi nyata dengan periode yang disebut.
- Tombol menyebut aksinya: `Catat pemasukan`, `Tambah agenda`, `Bagikan jadwal`, bukan `Submit`/`Lihat`.
- State kosong menyebut sebab dan langkah: "Belum ada transaksi bulan ini. Bendahara bisa mencatat lewat tombol Catat transaksi."

## 9. Aksesibilitas

- Kontras terukur: `ink/card` 17.8:1, `inkMuted/card` 6.5:1, `inkMuted/page` 5.8:1, `g700/card` 6.5:1, `onDark/g700` 6.5:1, `onDarkMuted` di ujung terang gradien (`g700`) 4.5:1 dan di `g900` 9.2:1, `warnFg/warnBg` 5.7:1, `dangerFg/dangerBg` 5.6:1. `inkFaint` tidak lolos untuk teks isi, karena itu hanya untuk placeholder.
- Target sentuh ≥ 44px. Fokus keyboard: cincin 2px `g700` (putih di atas hijau gelap), dari `Press`.
- Kontrol ikon wajib `accessibilityLabel`; ikon `aria-hidden`. Gambar punya `alt`.
- Warna tidak pernah satu-satunya pembeda: status selalu berlabel teks, arsir dijelaskan di legenda.

## 10. Layar TV signage

Layar 16:9 untuk ruang sholat memakai token yang sama dengan skala TV: kanvas `page`, kartu putih radius 22, kartu jadwal berikutnya `hero`, angka jam `display` diperbesar (×2 sampai ×3), Plus Jakarta Sans. Jam berdetak per detik tanpa animasi lain. Running text boleh bergerak terus karena itu fungsi utamanya, dan berhenti saat reduced-motion.

## 11. Pemeriksaan sebelum rilis

- `npx tsc --noEmit` lolos.
- `grep` tidak menemukan `#` hex, `fontWeight`, atau `THEME` di `src/screens` dan `src/components` (kecuali aset pihak ketiga seperti warna logo Google).
- Tidak ada em dash dan emoji di teks UI.
- Diklik di 390px dan 1440px: semua tombol punya akibat nyata, sheet tertutup dengan Escape, fokus terlihat.
