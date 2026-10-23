import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Hanya SUPER_ADMIN dan ADMIN yang dapat mengakses modul Manajemen User
router.use(authMiddleware);
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));

// 1. Ambil Semua User Beserta Statistik Kategori Terkelompok
router.get('/', (req, res) => {
  try {
    const { search, role, status } = req.query;

    let query = `
      SELECT id, google_id, email, name, avatar_url, role, is_onboarded,
             phone, blok_rumah, nomor_blok, no_rumah, rt_rw, status_warga,
             jumlah_keluarga, pekerjaan, catatan, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR blok_rumah LIKE ? OR nomor_blok LIKE ? OR no_rumah LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    if (role && role !== 'ALL') {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (status === 'ONBOARDED') {
      query += ` AND is_onboarded = 1`;
    } else if (status === 'PENDING') {
      query += ` AND is_onboarded = 0`;
    }

    query += ` ORDER BY CASE role WHEN 'SUPER_ADMIN' THEN 1 WHEN 'ADMIN' THEN 2 WHEN 'DKM' THEN 3 WHEN 'BENDAHARA' THEN 4 ELSE 5 END, id DESC`;

    const users = db.prepare(query).all(...params);

    // Hitung KPI & Statistik Terkelompok
    const allUsers = db.prepare(`SELECT role, is_onboarded FROM users`).all();
    const stats = {
      total: allUsers.length,
      superAdmin: allUsers.filter((u) => u.role === 'SUPER_ADMIN').length,
      admin: allUsers.filter((u) => u.role === 'ADMIN').length,
      dkm: allUsers.filter((u) => ['DKM', 'SEKRETARIS'].includes(u.role)).length,
      bendahara: allUsers.filter((u) => ['BENDAHARA', 'BENDAHARA_DKM', 'BENDAHARA_SUB'].includes(u.role)).length,
      sarpras: allUsers.filter((u) => ['PENGURUS_SEKSI', 'MARBOT'].includes(u.role)).length,
      jamaah: allUsers.filter((u) => u.role === 'JAMAAH').length,
      pendingOnboarding: allUsers.filter((u) => !u.is_onboarded).length,
      completedOnboarding: allUsers.filter((u) => Boolean(u.is_onboarded)).length,
    };

    return res.json({
      success: true,
      data: {
        stats,
        users: users.map((u) => ({
          id: u.id,
          googleId: u.google_id,
          email: u.email,
          name: u.name,
          avatarUrl: u.avatar_url,
          role: u.role,
          isOnboarded: Boolean(u.is_onboarded),
          phone: u.phone,
          blokRumah: u.blok_rumah,
          nomorBlok: u.nomor_blok || '',
          noRumah: u.no_rumah,
          fullAddress: `${u.blok_rumah || 'Blok H'}${u.nomor_blok ? u.nomor_blok : ''} No.${u.no_rumah || '-'}`,
          rtRw: u.rt_rw || '05/07',
          statusWarga: u.status_warga || 'Tetap',
          jumlahKeluarga: u.jumlah_keluarga || 1,
          pekerjaan: u.pekerjaan || '',
          catatan: u.catatan || '',
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error('[User Management Get Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mengambil data manajemen pengguna' });
  }
});

// 2. Tambah User Baru Manual oleh Pengurus / Super Admin
router.post('/', (req, res) => {
  try {
    const {
      email,
      name,
      role = 'JAMAAH',
      phone = '',
      blokRumah = 'Blok H',
      nomorBlok = '',
      noRumah = '',
      rtRw = '05/07',
      statusWarga = 'Tetap',
      jumlahKeluarga = 4,
      pekerjaan = '',
      catatan = '',
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Email dan Nama Lengkap wajib diisi.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: `User dengan email ${cleanEmail} sudah terdaftar.` });
    }

    // Auto format phone ke 62xxx
    let cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    else if (cleanPhone.length > 0 && !cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;

    const assignedRole = cleanEmail === 'fahriadjie99@gmail.com' ? 'SUPER_ADMIN' : role;

    const result = db.prepare(`
      INSERT INTO users (email, name, role, is_onboarded, phone, blok_rumah, nomor_blok, no_rumah, rt_rw, status_warga, jumlah_keluarga, pekerjaan, catatan)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cleanEmail,
      name.trim(),
      assignedRole,
      cleanPhone,
      blokRumah.trim(),
      nomorBlok.trim(),
      noRumah.trim(),
      rtRw.trim(),
      statusWarga,
      Number(jumlahKeluarga) || 1,
      pekerjaan.trim(),
      catatan.trim()
    );

    const newUserId = result.lastInsertRowid;

    // Otomatis sinkronkan ke tabel jamaah
    db.prepare(`
      INSERT INTO jamaah (user_id, name, phone, blok_rumah, nomor_blok, no_rumah, rt_rw, status_warga, jumlah_keluarga, status_zakat, pekerjaan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Muzakki', ?)
    `).run(
      newUserId,
      name.trim(),
      cleanPhone || '628000000000',
      blokRumah.trim(),
      nomorBlok.trim(),
      noRumah.trim(),
      rtRw.trim(),
      statusWarga,
      Number(jumlahKeluarga) || 1,
      pekerjaan.trim()
    );

    const createdUser = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);

    return res.status(201).json({
      success: true,
      message: `User ${createdUser.name} (${createdUser.role}) berhasil ditambahkan.`,
      data: createdUser,
    });
  } catch (error) {
    console.error('[Create User Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal membuat pengguna baru.' });
  }
});

// 3. Ubah Role Pengguna
router.put('/:id/role', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, error: 'Peran (role) baru wajib disertakan.' });
    }

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
    }

    // Proteksi: fahriadjie99@gmail.com tidak boleh diturunkan dari SUPER_ADMIN
    if (targetUser.email.toLowerCase() === 'fahriadjie99@gmail.com' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Peran akun Super User utama (fahriadjie99@gmail.com) tidak dapat diubah.' });
    }

    // Hanya SUPER_ADMIN yang bisa menunjuk SUPER_ADMIN lain
    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Hanya Super User yang dapat memberikan peran Super Admin.' });
    }

    db.prepare(`UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(role, userId);

    return res.json({
      success: true,
      message: `Peran untuk ${targetUser.name} berhasil diperbarui menjadi ${role}.`,
    });
  } catch (error) {
    console.error('[Update Role Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mengubah peran pengguna.' });
  }
});

// 4. Update Data Lengkap Pengguna & Sinkronkan ke Jamaah
router.put('/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const {
      name,
      role,
      phone,
      blokRumah,
      nomorBlok,
      noRumah,
      rtRw,
      statusWarga,
      jumlahKeluarga,
      pekerjaan,
      catatan,
      isOnboarded,
    } = req.body;

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
    }

    let cleanPhone = phone ? String(phone).replace(/\D/g, '') : targetUser.phone;
    if (cleanPhone && cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    else if (cleanPhone && !cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;

    let finalRole = role || targetUser.role;
    if (targetUser.email.toLowerCase() === 'fahriadjie99@gmail.com') {
      finalRole = 'SUPER_ADMIN';
    }

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          role = ?,
          phone = ?,
          blok_rumah = COALESCE(?, blok_rumah),
          nomor_blok = COALESCE(?, nomor_blok),
          no_rumah = COALESCE(?, no_rumah),
          rt_rw = COALESCE(?, rt_rw),
          status_warga = COALESCE(?, status_warga),
          jumlah_keluarga = COALESCE(?, jumlah_keluarga),
          pekerjaan = COALESCE(?, pekerjaan),
          catatan = COALESCE(?, catatan),
          is_onboarded = COALESCE(?, is_onboarded),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      finalRole,
      cleanPhone,
      blokRumah ? blokRumah.trim() : null,
      nomorBlok !== undefined ? String(nomorBlok).trim() : null,
      noRumah ? noRumah.trim() : null,
      rtRw ? rtRw.trim() : null,
      statusWarga || null,
      jumlahKeluarga !== undefined ? Number(jumlahKeluarga) : null,
      pekerjaan ? pekerjaan.trim() : null,
      catatan !== undefined ? catatan.trim() : null,
      isOnboarded !== undefined ? (isOnboarded ? 1 : 0) : null,
      userId
    );

    // Sinkronkan ke tabel jamaah jika ada
    const existingJamaah = db.prepare('SELECT id FROM jamaah WHERE user_id = ?').get(userId);
    if (existingJamaah) {
      db.prepare(`
        UPDATE jamaah
        SET name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            blok_rumah = COALESCE(?, blok_rumah),
            nomor_blok = COALESCE(?, nomor_blok),
            no_rumah = COALESCE(?, no_rumah),
            rt_rw = COALESCE(?, rt_rw),
            status_warga = COALESCE(?, status_warga),
            jumlah_keluarga = COALESCE(?, jumlah_keluarga),
            pekerjaan = COALESCE(?, pekerjaan)
        WHERE id = ?
      `).run(
        name ? name.trim() : null,
        cleanPhone,
        blokRumah ? blokRumah.trim() : null,
        nomorBlok !== undefined ? String(nomorBlok).trim() : null,
        noRumah ? noRumah.trim() : null,
        rtRw ? rtRw.trim() : null,
        statusWarga || null,
        jumlahKeluarga !== undefined ? Number(jumlahKeluarga) : null,
        pekerjaan ? pekerjaan.trim() : null,
        existingJamaah.id
      );
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    return res.json({
      success: true,
      message: `Data ${updated.name} berhasil diperbarui.`,
      data: updated,
    });
  } catch (error) {
    console.error('[Update User Full Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal memperbarui data pengguna.' });
  }
});

// 5. Reset Status Onboarding (Paksa User Lengkapi Data Saat Login)
router.post('/:id/reset-onboarding', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });

    db.prepare('UPDATE users SET is_onboarded = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    return res.json({
      success: true,
      message: `Status onboarding ${user.name} berhasil di-reset. Pengguna akan diminta mengisi ulang profil saat login berikutnya.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Gagal mereset status onboarding.' });
  }
});

// 6. Hapus Pengguna
router.delete('/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!targetUser) return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });

    // Proteksi: Tidak bisa menghapus akun Super User utama
    if (targetUser.email.toLowerCase() === 'fahriadjie99@gmail.com') {
      return res.status(403).json({ success: false, error: 'Akun Super User utama (fahriadjie99@gmail.com) tidak dapat dihapus.' });
    }

    // Proteksi: Tidak bisa menghapus diri sendiri
    if (req.user.id === userId) {
      return res.status(400).json({ success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.' });
    }

    // Unlink / Hapus relasi jamaah
    db.prepare('DELETE FROM jamaah WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    return res.json({
      success: true,
      message: `Pengguna ${targetUser.name} (${targetUser.email}) berhasil dihapus.`,
    });
  } catch (error) {
    console.error('[Delete User Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus pengguna.' });
  }
});

export default router;
