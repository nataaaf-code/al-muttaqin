import express from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. Ambil Laporan Ringkasan Kas & Daftar Mutasi
router.get('/', authMiddleware, (req, res) => {
  try {
    const { unit } = req.query;
    let query = 'SELECT * FROM transactions';
    const params = [];
    if (unit && unit !== 'ALL') {
      query += ' WHERE sub_org = ?';
      params.push(unit);
    }
    query += ' ORDER BY date DESC, id DESC';
    const transactions = db.prepare(query).all(...params);

    // Hitung akumulasi
    let totalIncome = 0;
    let totalExpense = 0;
    let dkmIncome = 0;
    let dkmExpense = 0;
    let tpaIncome = 0;
    let tpaExpense = 0;
    const pocketMap = {};

    for (const tx of transactions) {
      pocketMap[tx.pocket] = pocketMap[tx.pocket] || 0;
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
        pocketMap[tx.pocket] += tx.amount;
        if (tx.sub_org === 'TPA') tpaIncome += tx.amount;
        else dkmIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        pocketMap[tx.pocket] -= tx.amount;
        if (tx.sub_org === 'TPA') tpaExpense += tx.amount;
        else dkmExpense += tx.amount;
      }
    }

    const currentBalance = totalIncome - totalExpense;
    const dkmBalance = dkmIncome - dkmExpense;
    const tpaBalance = tpaIncome - tpaExpense;

    return res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          currentBalance,
          dkm: { income: dkmIncome, expense: dkmExpense, balance: dkmBalance },
          tpa: { income: tpaIncome, expense: tpaExpense, balance: tpaBalance },
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
      sub_org,
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

    // Tentukan unit sub_org otomatis jika tidak dikirim
    let targetSubOrg = sub_org || 'DKM';
    if (!sub_org) {
      const isTpa = String(pocket).toUpperCase().includes('TPA') ||
                    String(category).toUpperCase().includes('SPP') ||
                    String(category).toUpperCase().includes('TPA') ||
                    String(category).toUpperCase().includes('SANTRI') ||
                    String(title).toUpperCase().includes('TPA') ||
                    String(title).toUpperCase().includes('SANTRI');
      if (isTpa) targetSubOrg = 'TPA';
    }

    const recordedBy = req.user.name || 'Bendahara DKM';

    const info = db.prepare(`
      INSERT INTO transactions (title, type, amount, category, pocket, sub_org, date, recorded_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      type.toUpperCase(),
      numAmount,
      category.trim(),
      pocket.trim(),
      targetSubOrg,
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
