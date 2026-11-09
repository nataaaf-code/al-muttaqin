/**
 * Sistem desain "Hijau Kartu" (redesign 2026-11). Spesifikasi lengkap & alasan: DESIGN.md.
 * Semua layar memakai token di file ini; jangan menulis hex atau fontWeight langsung di layar.
 */

export const C = {
  // Kanvas & permukaan
  page: '#F1F3F0', // latar aplikasi di belakang kartu
  card: '#FFFFFF', // kartu, sidebar, top bar
  sunken: '#F6F7F5', // isian input, baris terpilih ringan, track
  line: '#E4E7E3', // garis tepi kartu & pemisah
  // Teks
  ink: '#101A14', // teks utama
  inkMuted: '#56615A', // teks sekunder (lolos AA di card & page)
  inkFaint: '#8B948E', // hanya ikon non-esensial & placeholder, bukan teks penting
  // Hijau inti (diturunkan dari logo #0D3723)
  g900: '#0D3723',
  g800: '#14512F',
  g700: '#1B6B3F', // tombol utama, ikon aktif, link
  g500: '#2E8B57',
  g300: '#7CC49B',
  g100: '#E3F2E8',
  g50: '#F1F8F3',
  // Di atas hijau gelap
  onDark: '#FFFFFF',
  onDarkMuted: '#C4DDCD',
  // Status (hanya untuk status nyata)
  warnFg: '#8A5300',
  warnBg: '#FFF1D9',
  warnLine: '#FBE2B5',
  dangerFg: '#B42318',
  dangerBg: '#FDE8E6',
  dangerLine: '#F9CFCA',
  // Arsir: data kosong / tertunda
  hatchLine: '#A3ADA6',
  hatchBg: '#F1F3F0',
  scrim: 'rgba(16, 26, 20, 0.5)',
} as const;

/** Gradien kartu fokus (satu per layar): atas-kiri ke bawah-kanan. */
export const HERO_GRADIENT = [C.g700, C.g900] as const;

/** Nama keluarga font; dimuat di App.tsx lewat useFonts. Pakai lewat TYPE, bukan fontWeight. */
export const F = {
  r: 'PJS-Regular',
  m: 'PJS-Medium',
  s: 'PJS-SemiBold',
  b: 'PJS-Bold',
} as const;

export const TYPE = {
  display: { fontFamily: F.s, fontSize: 44, lineHeight: 50, letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  h1: { fontFamily: F.s, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontFamily: F.s, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  h3: { fontFamily: F.s, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: F.r, fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: F.m, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: F.r, fontSize: 12, lineHeight: 16 },
  smallStrong: { fontFamily: F.m, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: F.m, fontSize: 13, lineHeight: 18 },
  num: { fontFamily: F.s, fontVariant: ['tabular-nums'] },
} as const;

export const R = { chip: 8, inner: 14, card: 22, pill: 999 } as const;

export const SP = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 28 } as const;

/** Titik patah layout. Lebar diukur dari window. */
export const BP = { tablet: 760, desktop: 1180 } as const;
