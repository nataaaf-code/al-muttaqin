import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. Ambil Laporan Ringkasan Kas & Daftar Mutasi
router.get('/', authMiddleware, (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions
      ORDER BY date DESC, id DESC
    `).all();

    // Hitung akumulasi
    let totalIncome = 0;
    let totalExpense = 0;
    const pocketMap = {
      'Kas Utama': 0,
      'Kas Anak Yatim': 0,
      'Kas Pembangunan': 0,
    };

    for (const tx of transactions) {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
        pocketMap[tx.pocket] = (pocketMap[tx.pocket] || 0) + tx.amount;
      } else {
        totalExpense += tx.amount;
        pocketMap[tx.pocket] = (pocketMap[tx.pocket] || 0) - tx.amount;
      }
    }

    const currentBalance = totalIncome - totalExpense;

    return res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          currentBalance,
          pocketBalances: pocketMap,
        },
        transactions,
      },
    });
  } catch (error) {
    console.error('[Get Finance Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mengambil data keuangan' });
  }
});

// 2. Catat Transaksi Baru (BENDAHARA & ADMIN)
router.post('/', authMiddleware, requireRole('BENDAHARA', 'ADMIN'), (req, res) => {
  try {
    const {
      title,
      type,
      amount,
      category,
      pocket = 'Kas Utama',
      date = new Date().toISOString().split('T')[0],
      notes = '',
    } = req.body;

    if (!title || !type || !amount || !category) {
      return res.status(400).json({ success: false, error: 'Judul, tipe (INCOME/EXPENSE), nominal, dan kategori wajib diisi' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Nominal transaksi harus berupa angka positif' });
    }

    const recordedBy = req.user.name || 'Bendahara DKM';

    const info = db.prepare(`
      INSERT INTO transactions (title, type, amount, category, pocket, date, recorded_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      type.toUpperCase(),
      numAmount,
      category.trim(),
      pocket.trim(),
      date,
      recordedBy,
      notes.trim()
    );

    const newTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Transaksi kas berhasil dicatat', data: newTx });
  } catch (error) {
    console.error('[Add Transaction Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal mencatat transaksi kas' });
  }
});

// 3. Hapus Transaksi (BENDAHARA & ADMIN)
router.delete('/:id', authMiddleware, requireRole('BENDAHARA', 'ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('[Delete Transaction Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menghapus transaksi' });
  }
});

export default router;
