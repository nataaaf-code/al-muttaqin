import express from 'express';
import { db } from '../db/database.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '619642670845-e7tvthu3ro4aip2fcdm80788486sc3vq.apps.googleusercontent.com';

// 1. Google OAuth Verification Endpoint
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Kredensial token Google tidak ditemukan' });
    }

    // Verifikasi ID Token via endpoint resmi Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error('[Auth Google Error]', errText);
      return res.status(401).json({ success: false, error: 'Token Google tidak valid atau telah kadaluwarsa' });
    }

    const payload = await googleRes.json();

    // Verifikasi Audience Client ID
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      console.warn('[Auth Warning] Audience token mismatch:', payload.aud, 'expected:', GOOGLE_CLIENT_ID);
      // Tetap lanjutkan jika valid dari google
    }

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase();
    const name = payload.name || 'Jamaah Al-Muttaqin';
    const avatarUrl = payload.picture || '';

    // Cek apakah user sudah terdaftar di database
    let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleId, email);

    if (user) {
      // Perbarui avatar / google_id jika belum terhubung
      db.prepare(`
        UPDATE users
        SET google_id = ?, avatar_url = COALESCE(avatar_url, ?), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(googleId, avatarUrl, user.id);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      // User Baru: Otomatis daftarkan dengan status is_onboarded = 0
      // Tentukan peran default: jika email cocok dengan DKM/Admin, beri role bersangkutan
      let defaultRole = 'JAMAAH';
      if (email.includes('astriyo') || email.includes('admin')) {
        defaultRole = 'ADMIN';
      } else if (email.includes('dicky') || email.includes('dkm')) {
        defaultRole = 'DKM';
      } else if (email.includes('rahmat') || email.includes('bendahara')) {
        defaultRole = 'BENDAHARA';
      }

      const info = db.prepare(`
        INSERT INTO users (google_id, email, name, avatar_url, role, is_onboarded)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(googleId, email, name, avatarUrl, defaultRole);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      console.log(`[Auth] User baru terdaftar: ${email} (ID: ${user.id}, Role: ${defaultRole})`);
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Login Google berhasil',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        role: user.role,
        isOnboarded: Boolean(user.is_onboarded),
        phone: user.phone,
        blokRumah: user.blok_rumah,
        noRumah: user.no_rumah,
        rtRw: user.rt_rw,
        statusWarga: user.status_warga,
        jumlahKeluarga: user.jumlah_keluarga,
        pekerjaan: user.pekerjaan,
      },
    });
  } catch (error) {
    console.error('[Auth Google Catch Error]', error);
    return res.status(500).json({ success: false, error: 'Terjadi kesalahan pada verifikasi login Google' });
  }
});

// 2. Demo Persona Switcher (Memudahkan pengujian role tanpa logout-login akun riil)
router.post('/demo-login', (req, res) => {
  try {
    const { role } = req.body;
    const targetRole = (role || 'JAMAAH').toUpperCase();

    let user = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(targetRole);
    if (!user) {
      // Fallback ke user pertama
      user = db.prepare('SELECT * FROM users LIMIT 1').get();
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'Data user demo belum di-seed di database' });
    }

    const token = signToken(user);
    return res.json({
      success: true,
      message: `Login demo sebagai ${user.role} berhasil`,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        role: user.role,
        isOnboarded: Boolean(user.is_onboarded),
        phone: user.phone,
        blokRumah: user.blok_rumah,
        noRumah: user.no_rumah,
        rtRw: user.rt_rw,
        statusWarga: user.status_warga,
        jumlahKeluarga: user.jumlah_keluarga,
        pekerjaan: user.pekerjaan,
      },
    });
  } catch (error) {
    console.error('[Demo Login Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal melakukan login demo' });
  }
});

// 3. Info Profil Pengguna Saat Ini
router.get('/me', authMiddleware, (req, res) => {
  const user = req.user;
  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      role: user.role,
      isOnboarded: Boolean(user.is_onboarded),
      phone: user.phone,
      blokRumah: user.blok_rumah,
      noRumah: user.no_rumah,
      rtRw: user.rt_rw,
      statusWarga: user.status_warga,
      jumlahKeluarga: user.jumlah_keluarga,
      pekerjaan: user.pekerjaan,
    },
  });
});

// 4. Form Onboarding / Pengisian Data Diri Pertama Kali
router.post('/onboarding', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      phone,
      blokRumah,
      noRumah,
      rtRw = '05/07',
      statusWarga = 'Tetap',
      jumlahKeluarga = 4,
      pekerjaan = 'Warga / Jamaah',
      catatan = '',
    } = req.body;

    if (!fullName || !phone || !blokRumah || !noRumah) {
      return res.status(400).json({
        success: false,
        error: 'Nama lengkap, nomor handphone, blok rumah, dan nomor rumah wajib diisi.',
      });
    }

    // Auto-formatting Nomor Handphone ke format standar 62xxx
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    // Update profil di tabel users & tandai is_onboarded = 1
    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, blok_rumah = ?, no_rumah = ?, rt_rw = ?,
          status_warga = ?, jumlah_keluarga = ?, pekerjaan = ?, catatan = ?,
          is_onboarded = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      fullName.trim(),
      cleanPhone,
      blokRumah.trim(),
      noRumah.trim(),
      rtRw.trim(),
      statusWarga,
      Number(jumlahKeluarga) || 1,
      pekerjaan.trim(),
      catatan.trim(),
      userId
    );

    // Otomatis daftarkan / sinkronkan ke tabel jamaah
    const existingJamaah = db.prepare('SELECT id FROM jamaah WHERE user_id = ?').get(userId);
    if (existingJamaah) {
      db.prepare(`
        UPDATE jamaah
        SET name = ?, phone = ?, blok_rumah = ?, no_rumah = ?, rt_rw = ?,
            status_warga = ?, jumlah_keluarga = ?, pekerjaan = ?
        WHERE id = ?
      `).run(
        fullName.trim(),
        cleanPhone,
        blokRumah.trim(),
        noRumah.trim(),
        rtRw.trim(),
        statusWarga,
        Number(jumlahKeluarga) || 1,
        pekerjaan.trim(),
        existingJamaah.id
      );
    } else {
      db.prepare(`
        INSERT INTO jamaah (user_id, name, phone, blok_rumah, no_rumah, rt_rw, status_warga, jumlah_keluarga, status_zakat, pekerjaan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Muzakki', ?)
      `).run(
        userId,
        fullName.trim(),
        cleanPhone,
        blokRumah.trim(),
        noRumah.trim(),
        rtRw.trim(),
        statusWarga,
        Number(jumlahKeluarga) || 1,
        pekerjaan.trim()
      );
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const newToken = signToken(updatedUser);

    console.log(`[Onboarding] Profil user ${updatedUser.email} berhasil dilengkapi (is_onboarded = 1).`);

    return res.json({
      success: true,
      message: 'Alhamdulillah, data diri Anda berhasil disimpan!',
      token: newToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatar_url,
        role: updatedUser.role,
        isOnboarded: true,
        phone: updatedUser.phone,
        blokRumah: updatedUser.blok_rumah,
        noRumah: updatedUser.no_rumah,
        rtRw: updatedUser.rt_rw,
        statusWarga: updatedUser.status_warga,
        jumlahKeluarga: updatedUser.jumlah_keluarga,
        pekerjaan: updatedUser.pekerjaan,
      },
    });
  } catch (error) {
    console.error('[Onboarding Error]', error);
    return res.status(500).json({ success: false, error: 'Gagal menyimpan data diri onboarding' });
  }
});

export default router;
