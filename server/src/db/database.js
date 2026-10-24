import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tentukan lokasi file database
const defaultDbDir = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(defaultDbDir)) {
  fs.mkdirSync(defaultDbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(defaultDbDir, 'mushola.db');
console.log(`[DB] Menggunakan database SQLite pada: ${dbPath}`);

export const db = new DatabaseSync(dbPath);

// Konfigurasi performa dan integritas ACID
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
`);

// Inisialisasi skema tabel database
export function initDatabase() {
  db.exec(`
    -- 1. Tabel Users & Autentikasi
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'JAMAAH',
      is_onboarded INTEGER NOT NULL DEFAULT 0,
      phone TEXT,
      blok_rumah TEXT,
      no_rumah TEXT,
      rt_rw TEXT,
      status_warga TEXT,
      jumlah_keluarga INTEGER DEFAULT 1,
      pekerjaan TEXT,
      catatan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Tabel Data Jamaah / Warga Musholla
    CREATE TABLE IF NOT EXISTS jamaah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      blok_rumah TEXT NOT NULL,
      no_rumah TEXT NOT NULL,
      rt_rw TEXT NOT NULL DEFAULT '05/07',
      status_warga TEXT NOT NULL DEFAULT 'Tetap',
      jumlah_keluarga INTEGER NOT NULL DEFAULT 4,
      status_zakat TEXT NOT NULL DEFAULT 'Muzakki',
      pekerjaan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Tabel Mutasi Kas Keuangan Musholla
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      pocket TEXT NOT NULL DEFAULT 'Kas Utama',
      sub_org TEXT NOT NULL DEFAULT 'DKM',
      date TEXT NOT NULL,
      recorded_by TEXT NOT NULL DEFAULT 'Bendahara DKM',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Tabel Agenda & Kegiatan Musholla
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      speaker TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT 'Musholla Al Muttaqin',
      description TEXT,
      target_jamaah TEXT DEFAULT 'Semua Jamaah & Warga',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Tabel Inventaris Musholla
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Unit',
      condition TEXT NOT NULL DEFAULT 'Baik',
      location TEXT NOT NULL DEFAULT 'Ruang Utama',
      pic TEXT NOT NULL DEFAULT 'Seksi Perlengkapan',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Tabel Pengurus DKM & Unit Otonom TPA
    CREATE TABLE IF NOT EXISTS organization (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit TEXT NOT NULL DEFAULT 'DKM',
      position TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      period TEXT NOT NULL DEFAULT '2024 - 2027',
      order_index INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Tabel Profil & Konfigurasi Sholat Musholla
    CREATE TABLE IF NOT EXISTS prayer_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosque_name TEXT NOT NULL DEFAULT 'Musholla Al Muttaqin',
      mosque_address TEXT NOT NULL,
      contact_person_1 TEXT NOT NULL,
      contact_person_2 TEXT NOT NULL,
      iqomah_subuh_mins INTEGER NOT NULL DEFAULT 12,
      iqomah_dzuhur_mins INTEGER NOT NULL DEFAULT 13,
      iqomah_ashar_mins INTEGER NOT NULL DEFAULT 13,
      iqomah_maghrib_mins INTEGER NOT NULL DEFAULT 11,
      iqomah_isya_mins INTEGER NOT NULL DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[DB] Skema tabel berhasil diinisialisasi.');
  seedInitialData();
}

// Seeding 4 contoh data riil per entitas sesuai instruksi
function seedInitialData() {
  // Cek apakah tabel users sudah memiliki data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('[DB] Mengisi data awal (4 contoh data per entitas)...');

    // 1. Seed 4 Users (Role: ADMIN, DKM, BENDAHARA, JAMAAH)
    const insertUser = db.prepare(`
      INSERT INTO users (id, google_id, email, name, role, is_onboarded, phone, blok_rumah, no_rumah, rt_rw, status_warga, jumlah_keluarga, pekerjaan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(1, 'google-demo-admin-01', 'admin@mushola-almuttaqin.id', 'Ustadz Astriyo', 'ADMIN', 1, '6285777900383', 'Blok H', '01', '05/07', 'Tetap', 4, 'Pembina Keagamaan');
    insertUser.run(2, 'google-demo-dkm-02', 'dkm@mushola-almuttaqin.id', 'Ustadz Dicky', 'DKM', 1, '628174958342', 'Blok H', '02', '05/07', 'Tetap', 3, 'Ketua DKM / Pengajar');
    insertUser.run(3, 'google-demo-bendahara-03', 'bendahara@mushola-almuttaqin.id', 'H. Rahmat Hidayat', 'BENDAHARA', 1, '6281234567890', 'Blok H', '08', '05/07', 'Tetap', 5, 'Bendahara / Akuntan');
    insertUser.run(4, 'google-demo-jamaah-04', 'jamaah@mushola-almuttaqin.id', 'Bpk. Joko Susanto', 'JAMAAH', 1, '6281398765432', 'Blok H', '15', '05/07', 'Kontrak', 4, 'Karyawan Swasta');

    // 2. Seed 4 Jamaah
    const insertJamaah = db.prepare(`
      INSERT INTO jamaah (id, user_id, name, phone, blok_rumah, no_rumah, rt_rw, status_warga, jumlah_keluarga, status_zakat, pekerjaan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertJamaah.run(1, 1, 'Ustadz Astriyo', '6285777900383', 'Blok H', '01', '05/07', 'Tetap', 4, 'Muzakki', 'Pembina Keagamaan');
    insertJamaah.run(2, 2, 'Ustadz Dicky', '628174958342', 'Blok H', '02', '05/07', 'Tetap', 3, 'Muzakki', 'Dosen & Pengajar');
    insertJamaah.run(3, 3, 'H. Rahmat Hidayat', '6281234567890', 'Blok H', '08', '05/07', 'Tetap', 5, 'Muzakki', 'Wiraswasta');
    insertJamaah.run(4, 4, 'Bpk. Joko Susanto', '6281398765432', 'Blok H', '15', '05/07', 'Kontrak', 4, 'Mustahik', 'Karyawan Swasta');

    // 3. Seed 4 Transaksi Keuangan
    const insertTx = db.prepare(`
      INSERT INTO transactions (id, title, type, amount, category, pocket, date, recorded_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTx.run(1, 'Infaq Kotak Jumat Pekan 3 Oktober', 'INCOME', 1450000, 'Kotak Infaq Jumat', 'Kas Utama', '2026-10-16', 'H. Rahmat Hidayat', 'Infaq sholat jumat jamaah');
    insertTx.run(2, 'Sedekah Subuh Jamaah Blok H', 'INCOME', 650000, 'Sedekah Subuh', 'Kas Utama', '2026-10-20', 'H. Rahmat Hidayat', 'Titipan sedekah subuh warga');
    insertTx.run(3, 'Pembayaran Listrik & Kebersihan', 'EXPENSE', 420000, 'Operasional & Listrik', 'Kas Utama', '2026-10-21', 'H. Rahmat Hidayat', 'Token listrik PLN & iuran kebersihan musholla');
    insertTx.run(4, 'Pengadaan Karpet Shaf Tambahan', 'EXPENSE', 1200000, 'Perlengkapan', 'Kas Utama', '2026-10-22', 'H. Rahmat Hidayat', 'Pembelian 2 roll karpet shaf tebal');

    // 4. Seed 4 Agenda & Kegiatan
    const insertEvent = db.prepare(`
      INSERT INTO events (id, title, speaker, date, time, category, location, description, target_jamaah)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertEvent.run(1, 'Kajian Rutin Fiqih Ibadah Sehari-Hari', 'Ustadz Astriyo', '2026-10-24', '18:30 WIB', 'Kajian Rutin', 'Musholla Al Muttaqin', 'Pembahasan rukun sholat dan thaharah', 'Seluruh Jamaah & Warga');
    insertEvent.run(2, 'Tahsin & Tahfidz Al-Qur\'an Santri Cilik', 'Ustadz Dicky', '2026-10-25', '08:00 WIB', 'Tahsin Al-Qur\'an', 'Musholla Al Muttaqin', 'Bimbingan makhraj huruf dan hafalan Juz 30', 'Anak-anak & Remaja');
    insertEvent.run(3, 'Kerja Bakti Bersih Musholla & Lingkungan RT 05', 'Bpk. Joko Susanto & DKM', '2026-10-25', '06:30 WIB', 'Kerja Bakti', 'Area Musholla & Fasum Blok H', 'Gotong royong membersihkan karpet dan tempat wudhu', 'Seluruh Warga RT 05/RW 07');
    insertEvent.run(4, 'Peringatan Maulid Nabi & Tabligh Akbar', 'Ustadz Astriyo & Dai Tamu', '2026-10-31', '19:45 WIB', 'PHBI', 'Musholla Al Muttaqin', 'Meneladani akhlak Rasulullah SAW dalam kehidupan bertetangga', 'Umum & Warga Perumahan');

    // 5. Seed 4 Inventaris
    const insertInv = db.prepare(`
      INSERT INTO inventory (id, item_name, quantity, unit, condition, location, pic, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertInv.run(1, 'Sound System Wireless TOA + 2 Mic Pegang', 1, 'Set', 'Baik', 'Ruang Imaman', 'Marbot / Sie Ibadah', 'Kondisi suara jernih untuk adzan dan kajian');
    insertInv.run(2, 'Karpet Shaf Sajadah Tebal Turki', 6, 'Roll', 'Baik', 'Ruang Utama', 'Marbot', 'Bersih dan wangi');
    insertInv.run(3, 'AC Split Sharp 2 PK', 2, 'Unit', 'Baik', 'Ruang Utama', 'Sie Perlengkapan', 'Rutin dicuci berkala setiap 2 bulan');
    insertInv.run(4, 'Genset Portabel 3000 Watt', 1, 'Unit', 'Baik', 'Gudang Musholla', 'Sie Perlengkapan', 'Cadangan daya darurat saat pemadaman listrik');

    // 6. Seed Pengurus Organisasi (DKM & TPA Otonom)
    const insertOrg = db.prepare(`
      INSERT INTO organization (id, unit, position, name, phone, period, order_index, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    // DKM
    insertOrg.run(1, 'DKM', 'Penasehat DKM', 'Ustadz Astriyo', '6285777900383', '2024 - 2027', 1, 'Pembina Keagamaan');
    insertOrg.run(2, 'DKM', 'Ketua DKM', 'Ustadz Dicky', '628174958342', '2024 - 2027', 2, 'Ketua Takmir');
    insertOrg.run(3, 'DKM', 'Bendahara DKM', 'H. Rahmat Hidayat', '6281234567890', '2024 - 2027', 3, 'Bendahara Utama');
    insertOrg.run(4, 'DKM', 'Marbot & Koordinator Ibadah', 'Bpk. Joko Susanto', '6281398765432', '2024 - 2027', 4, 'Sie Peribadatan');
    // TPA
    insertOrg.run(5, 'TPA', 'Kepala Sekolah / Direktur TPA', 'Ustadzah Maryam, S.Pd.I', '6285799001122', '2024 - 2027', 1, 'Kelas Tahfidz Juz 30 & Hadits');
    insertOrg.run(6, 'TPA', 'Sekretaris & Tata Usaha Santri', 'Ustadzah Siti Aisyah, S.Pd', '6281299887766', '2024 - 2027', 2, 'Administrasi Santri & Raport');
    insertOrg.run(7, 'TPA', 'Bendahara Keuangan Otonom', 'Ustadzah Fitri Handayani, S.E', '6281311223344', '2024 - 2027', 3, 'Pengelola Kas SPP, Honor & Modul');
    insertOrg.run(8, 'TPA', 'Koordinator Kurikulum & Tahsin', 'Ustadz Hafiz Al-Faruq, S.Ag', '6285644332211', '2024 - 2027', 4, 'Penjamin Mutu Tahsin & Tartil');
    insertOrg.run(9, 'TPA', 'Guru Pengajar Kelas Iqro 1 - 2', 'Ustadzah Nurul Fatimah', '6287755667788', '2024 - 2027', 5, 'Wali Kelas Pemula / Pra-TK');
    insertOrg.run(10, 'TPA', 'Guru Pengajar Kelas Iqro 3 - 4', 'Ustadzah Khadijah Al-Kubro', '6281899001144', '2024 - 2027', 6, 'Wali Kelas Menengah');
    insertOrg.run(11, 'TPA', 'Guru Pengajar Kelas Iqro 5 - 6', 'Ustadz Ahmad Fauzi', '6289912345678', '2024 - 2027', 7, 'Wali Kelas Lanjutan');

    // 7. Seed Profil & Konfigurasi Sholat Musholla
    const insertSettings = db.prepare(`
      INSERT INTO prayer_settings (id, mosque_name, mosque_address, contact_person_1, contact_person_2, iqomah_subuh_mins, iqomah_dzuhur_mins, iqomah_ashar_mins, iqomah_maghrib_mins, iqomah_isya_mins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSettings.run(
      1,
      'Musholla Al Muttaqin',
      'Perumahan Mutiara Puri Harmoni, Blok H, Sukamanah, Rajeg, Kabupaten Tangerang, Banten',
      'Ustadz Astriyo 6285777900383',
      'Ustadz Dicky 628174958342',
      12, 13, 13, 11, 10
    );

    console.log('[DB] Seeding selesai: 4 records per entitas berhasil dibuat.');
  }
}
