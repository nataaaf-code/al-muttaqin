import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. List Semua Inventaris
router.get('/', authMiddleware, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT * FROM inventory
      ORDER BY location ASC, item_name ASC
    `).all();
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('[Get Inventory Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mengambil data inventaris' });
  }
});

// 2. Tambah Barang Inventaris (DKM, MARBOT, ADMIN)
router.post('/', authMiddleware, requireRole('DKM', 'MARBOT', 'ADMIN'), (req, res) => {
  try {
    const {
      item_name,
      quantity = 1,
      unit = 'Unit',
      condition = 'Baik',
      location = 'Ruang Utama',
      pic = 'Seksi Perlengkapan',
      notes = '',
    } = req.body;

    if (!item_name) {
      return res.status(400).json({ success: false, error: 'Nama barang inventaris wajib diisi' });
    }

    const info = db.prepare(`
      INSERT INTO inventory (item_name, quantity, unit, condition, location, pic, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      item_name.trim(),
      Number(quantity) || 1,
      unit.trim(),
      condition.trim(),
      location.trim(),
      pic.trim(),
      notes.trim()
    );

    const newItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Barang inventaris berhasil dicatat', data: newItem });
  } catch (error) {
    console.error('[Add Inventory Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menambahkan inventaris' });
  }
});

// 3. Edit Status / Kondisi Inventaris (DKM, MARBOT, ADMIN)
router.put('/:id', authMiddleware, requireRole('DKM', 'MARBOT', 'ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, quantity, unit, condition, location, pic, notes } = req.body;

    db.prepare(`
      UPDATE inventory
      SET item_name = COALESCE(?, item_name),
          quantity = COALESCE(?, quantity),
          unit = COALESCE(?, unit),
          condition = COALESCE(?, condition),
          location = COALESCE(?, location),
          pic = COALESCE(?, pic),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      item_name ? item_name.trim() : null,
      quantity ? Number(quantity) : null,
      unit ? unit.trim() : null,
      condition ? condition.trim() : null,
      location ? location.trim() : null,
      pic ? pic.trim() : null,
      notes ? notes.trim() : null,
      id
    );

    const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Data inventaris berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[Edit Inventory Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal memperbarui inventaris' });
  }
});

// 4. Hapus Inventaris (ADMIN)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Barang inventaris berhasil dihapus' });
  } catch (error) {
    console.error('[Delete Inventory Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus inventaris' });
  }
});

export default router;
