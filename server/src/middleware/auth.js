import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

// Tanpa fallback: secret yang tertulis di repo bisa dipakai siapa pun untuk memalsukan token login.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET belum diisi. Set di file .env (lihat .env.example).');
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      isOnboarded: Boolean(user.is_onboarded),
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Akses ditolak: Token autentikasi diperlukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Verifikasi user masih ada di database
    const user = db.prepare('SELECT id, email, name, role, is_onboarded, avatar_url, phone, blok_rumah, no_rumah, rt_rw, status_warga, jumlah_keluarga, pekerjaan FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User tidak ditemukan atau sesi telah kadaluwarsa' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Sesi autentikasi tidak valid atau telah berakhir' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Silakan login terlebih dahulu' });
    }
    if (allowedRoles.includes('ALL') || allowedRoles.includes(req.user.role) || req.user.role === 'ADMIN') {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Akses ditolak: Fitur ini hanya untuk peran [${allowedRoles.join(', ')}]. Peran Anda saat ini: [${req.user.role}]`,
    });
  };
}
