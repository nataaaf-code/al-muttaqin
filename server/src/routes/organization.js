import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. List Pengurus DKM & TPA Otonom
router.get('/', (req, res) => {
  try {
    const { unit } = req.query;
    let query = 'SELECT * FROM organization';
    const params = [];
    if (unit && unit !== 'ALL') {
      query += ' WHERE unit = ?';
      params.push(unit);
    }
    query += ' ORDER BY order_index ASC, id ASC';
    const list = db.prepare(query).all(...params);

    const dkmList = list.filter((o) => o.unit === 'DKM');
    const tpaList = list.filter((o) => o.unit === 'TPA');

    return res.json({
      success: true,
      data: list,
      grouped: {
        dkm: dkmList,
        tpa: tpaList,
      },
    });
  } catch (error) {
    console.error('[Get Org Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mengambil data pengurus organisasi' });
  }
});

// 2. Tambah Pengurus DKM / TPA (DKM & ADMIN)
router.post('/', authMiddleware, requireRole('DKM', 'ADMIN'), (req, res) => {
  try {
    const { position, name, phone, period = '2024 - 2027', order_index = 10, unit = 'DKM', notes = '' } = req.body;
    if (!position || !name || !phone) {
      return res.status(400).json({ success: false, error: 'Jabatan, nama pengurus, dan nomor telepon wajib diisi' });
    }

    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;

    const info = db.prepare(`
      INSERT INTO organization (unit, position, name, phone, period, order_index, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(unit.trim().toUpperCase(), position.trim(), name.trim(), cleanPhone, period.trim(), Number(order_index) || 10, notes.trim());

    const newOrg = db.prepare('SELECT * FROM organization WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Data pengurus berhasil ditambahkan', data: newOrg });
  } catch (error) {
    console.error('[Add Org Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menambahkan data pengurus' });
  }
});

// 3. Edit Pengurus (DKM & ADMIN)
router.put('/:id', authMiddleware, requireRole('DKM', 'ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { position, name, phone, period, order_index, unit, notes } = req.body;

    let cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
    if (cleanPhone && cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    if (cleanPhone && !cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;

    db.prepare(`
      UPDATE organization
      SET position = COALESCE(?, position),
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          period = COALESCE(?, period),
          order_index = COALESCE(?, order_index),
          unit = COALESCE(?, unit),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      position ? position.trim() : null,
      name ? name.trim() : null,
      cleanPhone,
      period ? period.trim() : null,
      order_index ? Number(order_index) : null,
      unit ? unit.trim().toUpperCase() : null,
      notes ? notes.trim() : null,
      id
    );

    const updated = db.prepare('SELECT * FROM organization WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Data pengurus berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[Edit Org Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal memperbarui data pengurus' });
  }
});

// 4. Hapus Pengurus (ADMIN)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM organization WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Pengurus DKM berhasil dihapus' });
  } catch (error) {
    console.error('[Delete Org Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus pengurus DKM' });
  }
});

export default router;
