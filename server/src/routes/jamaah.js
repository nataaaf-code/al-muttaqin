import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper untuk menyamarkan nomor telepon demi privasi jamaah biasa
function maskPhone(phone) {
  if (!phone || phone.length < 7) return '628******';
  return phone.slice(0, 5) + '****' + phone.slice(-4);
}

// 1. List Jamaah (dengan privacy masking untuk role JAMAAH)
router.get('/', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, user_id, name, phone, blok_rumah, no_rumah, rt_rw,
             status_warga, jumlah_keluarga, status_zakat, pekerjaan, created_at
      FROM jamaah
      ORDER BY blok_rumah ASC, no_rumah ASC
    `).all();

    const isPrivileged = ['ADMIN', 'DKM'].includes(req.user.role);

    const data = rows.map((j) => ({
      ...j,
      phone: isPrivileged ? j.phone : maskPhone(j.phone),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('[Get Jamaah Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mengambil data jamaah' });
  }
});

// 2. Tambah Jamaah (DKM & ADMIN)
router.post('/', authMiddleware, requireRole('DKM', 'ADMIN'), (req, res) => {
  try {
    const {
      name,
      phone,
      blok_rumah,
      no_rumah,
      rt_rw = '05/07',
      status_warga = 'Tetap',
      jumlah_keluarga = 4,
      status_zakat = 'Muzakki',
      pekerjaan = 'Warga',
    } = req.body;

    if (!name || !phone || !blok_rumah || !no_rumah) {
      return res.status(400).json({ success: false, error: 'Nama, telepon, blok, dan nomor rumah wajib diisi' });
    }

    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;

    const info = db.prepare(`
      INSERT INTO jamaah (name, phone, blok_rumah, no_rumah, rt_rw, status_warga, jumlah_keluarga, status_zakat, pekerjaan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      cleanPhone,
      blok_rumah.trim(),
      no_rumah.trim(),
      rt_rw.trim(),
      status_warga,
      Number(jumlah_keluarga) || 1,
      status_zakat,
      pekerjaan.trim()
    );

    const newJamaah = db.prepare('SELECT * FROM jamaah WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Data jamaah berhasil ditambahkan', data: newJamaah });
  } catch (error) {
    console.error('[Add Jamaah Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menambahkan data jamaah' });
  }
});

// 3. Edit Jamaah (DKM & ADMIN)
router.put('/:id', authMiddleware, requireRole('DKM', 'ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      blok_rumah,
      no_rumah,
      rt_rw,
      status_warga,
      jumlah_keluarga,
      status_zakat,
      pekerjaan,
    } = req.body;

    let cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
    if (cleanPhone && cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    if (cleanPhone && !cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;

    db.prepare(`
      UPDATE jamaah
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          blok_rumah = COALESCE(?, blok_rumah),
          no_rumah = COALESCE(?, no_rumah),
          rt_rw = COALESCE(?, rt_rw),
          status_warga = COALESCE(?, status_warga),
          jumlah_keluarga = COALESCE(?, jumlah_keluarga),
          status_zakat = COALESCE(?, status_zakat),
          pekerjaan = COALESCE(?, pekerjaan)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      cleanPhone,
      blok_rumah ? blok_rumah.trim() : null,
      no_rumah ? no_rumah.trim() : null,
      rt_rw ? rt_rw.trim() : null,
      status_warga,
      jumlah_keluarga ? Number(jumlah_keluarga) : null,
      status_zakat,
      pekerjaan ? pekerjaan.trim() : null,
      id
    );

    const updated = db.prepare('SELECT * FROM jamaah WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Data jamaah berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[Edit Jamaah Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal memperbarui data jamaah' });
  }
});

// 4. Hapus Jamaah (ADMIN)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM jamaah WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Data jamaah berhasil dihapus' });
  } catch (error) {
    console.error('[Delete Jamaah Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus data jamaah' });
  }
});

export default router;
