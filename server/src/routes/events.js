import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. List Semua Agenda & Kegiatan
router.get('/', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT * FROM events
      ORDER BY date ASC, time ASC
    `).all();
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('[Get Events Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mengambil agenda kegiatan' });
  }
});

// 2. Tambah Agenda Kegiatan (DKM & ADMIN)
router.post('/', authMiddleware, requireRole('DKM', 'ADMIN'), (req, res) => {
  try {
    const {
      title,
      speaker,
      date,
      time,
      category = 'Kajian Rutin',
      location = 'Musholla Al Muttaqin',
      description = '',
      target_jamaah = 'Semua Jamaah & Warga',
    } = req.body;

    if (!title || !speaker || !date || !time) {
      return res.status(400).json({ success: false, error: 'Judul, pemateri/PIC, tanggal, dan waktu wajib diisi' });
    }

    const info = db.prepare(`
      INSERT INTO events (title, speaker, date, time, category, location, description, target_jamaah)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      speaker.trim(),
      date.trim(),
      time.trim(),
      category.trim(),
      location.trim(),
      description.trim(),
      target_jamaah.trim()
    );

    const newEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Agenda kegiatan berhasil dibuat', data: newEvent });
  } catch (error) {
    console.error('[Add Event Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menambahkan agenda kegiatan' });
  }
});

// 3. Edit Agenda (DKM & ADMIN)
router.put('/:id', authMiddleware, requireRole('DKM', 'ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, speaker, date, time, category, location, description, target_jamaah } = req.body;

    db.prepare(`
      UPDATE events
      SET title = COALESCE(?, title),
          speaker = COALESCE(?, speaker),
          date = COALESCE(?, date),
          time = COALESCE(?, time),
          category = COALESCE(?, category),
          location = COALESCE(?, location),
          description = COALESCE(?, description),
          target_jamaah = COALESCE(?, target_jamaah)
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      speaker ? speaker.trim() : null,
      date ? date.trim() : null,
      time ? time.trim() : null,
      category ? category.trim() : null,
      location ? location.trim() : null,
      description ? description.trim() : null,
      target_jamaah ? target_jamaah.trim() : null,
      id
    );

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Agenda berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[Edit Event Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal memperbarui agenda kegiatan' });
  }
});

// 4. Hapus Agenda (DKM & ADMIN)
router.delete('/:id', authMiddleware, requireRole('DKM', 'ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Agenda berhasil dihapus' });
  } catch (error) {
    console.error('[Delete Event Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus agenda kegiatan' });
  }
});

export default router;
