import express from 'express';
import { db } from '../db/database.js';

const router = express.Router();

// Ringkasan Publik untuk Pengunjung Tanpa Login (Tamu / TV Mode)
router.get('/summary', (req, res) => {
  try {
    // 1. Profil & Kontak Musholla
    let settings = db.prepare('SELECT * FROM prayer_settings LIMIT 1').get();
    if (!settings) {
      settings = {
        mosque_name: 'Musholla Al Muttaqin',
        mosque_address: 'Perumahan Mutiara Puri Harmoni, Blok H, Sukamanah, Rajeg, Kabupaten Tangerang, Banten',
        contact_person_1: 'Ustadz Astriyo 6285777900383',
        contact_person_2: 'Ustadz Dicky 628174958342',
        iqomah_subuh_mins: 12,
        iqomah_dzuhur_mins: 13,
        iqomah_ashar_mins: 13,
        iqomah_maghrib_mins: 11,
        iqomah_isya_mins: 10,
      };
    }

    // 2. Transparansi Kas Publik (Hanya ringkasan angka)
    const incomeRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'INCOME'").get();
    const expenseRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'EXPENSE'").get();
    const totalIncome = incomeRow ? incomeRow.total : 0;
    const totalExpense = expenseRow ? expenseRow.total : 0;
    const currentBalance = totalIncome - totalExpense;

    // 3. Agenda Kegiatan Mendatang
    const events = db.prepare(`
      SELECT id, title, speaker, date, time, category, location, description, target_jamaah
      FROM events
      ORDER BY date ASC, time ASC
      LIMIT 4
    `).all();

    // 4. Struktur DKM
    const organization = db.prepare(`
      SELECT id, position, name, phone, period, order_index
      FROM organization
      ORDER BY order_index ASC
      LIMIT 4
    `).all();

    // 5. Statistik Jamaah
    const jamaahCount = db.prepare('SELECT COUNT(*) as count FROM jamaah').get().count;

    return res.json({
      success: true,
      data: {
        profile: settings,
        financeSummary: {
          totalIncome,
          totalExpense,
          currentBalance,
        },
        events,
        organization,
        jamaahCount,
      },
    });
  } catch (error) {
    console.error('[Public Summary Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mengambil data ringkasan publik' });
  }
});

export default router;
