import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleLoginButton } from './GoogleLoginButton';
import { useMushola } from '../store/useMusholaStore';
import { C, R, SP } from '../theme/colors';
import { Sheet } from '../theme/motion';
import { Button, IconName, IconTile, ListRow, Loading, T } from '../ui/kit';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

/** Akun demo yang disediakan server (lihat authApi.loginWithDemo). */
const DEMO_ACCOUNTS: { role: string; title: string; name: string; icon: IconName }[] = [
  { role: 'SUPER_ADMIN', title: 'Super user', name: 'Fahri Adjie (fahriadjie99@gmail.com)', icon: 'shield-half-outline' },
  { role: 'ADMIN', title: 'Ketua DKM (admin)', name: 'Ustadz Astriyo', icon: 'shield-checkmark-outline' },
  { role: 'BENDAHARA', title: 'Bendahara keuangan', name: 'H. Rahmat Hidayat', icon: 'wallet-outline' },
  { role: 'DKM', title: 'Pengurus DKM', name: 'Ustadz Dicky', icon: 'business-outline' },
  { role: 'JAMAAH', title: 'Warga atau jamaah', name: 'Bpk. Joko Susanto (Blok H/15)', icon: 'people-outline' },
];

export function LoginModal({ visible, onClose }: LoginModalProps) {
  const { loginWithGoogle, loginWithDemo } = useMushola();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle(credential);
      onClose();
    } catch (err: any) {
      console.error('[LoginModal] Gagal login Google:', err);
      setErrorMessage(err?.message || 'Login dengan Google gagal. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithDemo(role);
      onClose();
    } catch (err: any) {
      console.error('[LoginModal] Gagal demo login:', err);
      setErrorMessage(err?.message || 'Gagal login sebagai akun demo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrorMessage(null);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Masuk ke aplikasi"
      subtitle="Untuk jamaah dan pengurus Musholla Al Muttaqin"
    >
      <View style={styles.body}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            alt="Logo Musholla Al Muttaqin"
            accessibilityLabel="Logo Musholla Al Muttaqin"
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="bodyStrong">Musholla Al Muttaqin</T>
            <T v="small" color={C.inkMuted}>
              Perumahan Mutiara Puri Harmoni Blok H, Rajeg
            </T>
          </View>
        </View>

        <T color={C.inkMuted}>
          Masuk dengan akun Google Anda. Warga baru akan diminta melengkapi data diri (blok dan nomor rumah) setelah
          masuk.
        </T>

        {errorMessage ? (
          <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color={C.dangerFg} aria-hidden />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="bodyStrong" color={C.dangerFg}>
                Belum berhasil masuk
              </T>
              <T v="small" color={C.dangerFg}>
                {errorMessage}
              </T>
              <T v="small" color={C.dangerFg}>
                Coba lagi, atau pakai akun demo di bawah.
              </T>
            </View>
          </View>
        ) : null}

        <View style={styles.googleBox}>
          <T v="label">Masuk dengan Google</T>
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setErrorMessage(err?.message || 'Login Google dibatalkan.')}
            loading={loading}
          />
          <T v="small" color={C.inkMuted} style={styles.center}>
            Lewat Google Identity Services. Aplikasi ini tidak menerima kata sandi Google Anda.
          </T>
          <T v="small" color={C.inkMuted} style={styles.center}>
            Jika Google menampilkan Error 401: invalid_client, domain ini belum terdaftar di Authorized JavaScript
            origins pada Google Cloud Console. Hubungi pengelola aplikasi.
          </T>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <T v="small" color={C.inkMuted}>
            atau coba akun demo
          </T>
          <View style={styles.dividerLine} />
        </View>

        <View>
          <T v="small" color={C.inkMuted}>
            Pilih peran untuk mencoba hak akses masing-masing. Akun demo memakai basis data server yang sama.
          </T>
          {loading ? (
            <Loading label="Memproses masuk..." />
          ) : (
            DEMO_ACCOUNTS.map((a, i) => (
              <ListRow
                key={a.role}
                leading={<IconTile icon={a.icon} size={40} />}
                title={a.title}
                subtitle={a.name}
                trailing={<Ionicons name="chevron-forward" size={18} color={C.inkMuted} aria-hidden />}
                onPress={() => handleDemoLogin(a.role)}
                accessibilityLabel={`Masuk sebagai ${a.title}, ${a.name}`}
                last={i === DEMO_ACCOUNTS.length - 1}
              />
            ))
          )}
        </View>

        <Button label="Lanjut sebagai tamu" variant="ghost" onPress={handleClose} disabled={loading} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: SP.l,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.m,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.s,
    padding: SP.m,
    borderRadius: R.inner,
    backgroundColor: C.dangerBg,
  },
  googleBox: {
    alignItems: 'center',
    gap: SP.s,
    padding: SP.l,
    borderRadius: R.inner,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.sunken,
  },
  center: {
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.m,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.line,
  },
});
