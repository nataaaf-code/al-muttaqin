import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleLoginButton } from './GoogleLoginButton';
import { useMushola } from '../store/useMusholaStore';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBrand}>
              <View style={styles.brandBadge}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.modalLogoImg}
                  resizeMode="contain"
                />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.brandTitle}>E-MUSHOLA AL MUTTAQIN</Text>
                <Text style={styles.brandSubtitle}>Perumahan Mutiara Puri Harmoni Blok H, Rajeg</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Title & Description */}
            <View style={styles.titleSection}>
              <Text style={styles.mainHeading}>Masuk Akun Jamaah & Pengurus</Text>
              <Text style={styles.subHeading}>
                Silakan masuk dengan akun Google Anda. Warga baru akan langsung dipandu melengkapi data diri (Blok & No. Rumah) secara otomatis.
              </Text>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Google Login Section */}
            <View style={styles.googleSection}>
              <Text style={styles.sectionLabel}>MASUK RESMI DENGAN GOOGLE</Text>
              <View style={styles.googleBtnWrapper}>
                <GoogleLoginButton
                  onSuccess={handleGoogleSuccess}
                  onError={(err) => setErrorMessage(err?.message || 'Login Google dibatalkan')}
                  loading={loading}
                />
              </View>
              <Text style={styles.securityNote}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#EF8354" /> Terenkripsi aman via Google Identity Services (OAuth 2.0)
              </Text>

              <View style={styles.oauthHintBox}>
                <Ionicons name="information-circle-outline" size={15} color="#0369A1" />
                <Text style={styles.oauthHintText}>
                  Tips: Jika muncul <Text style={{ fontWeight: '700' }}>Error 401: invalid_client</Text>, pastikan domain <Text style={{ fontWeight: '700' }}>https://al-muttaqin.natsuko.ai.id</Text> sudah ditambahkan di Authorized JavaScript Origins pada Google Cloud Console.
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ATAU SIMULASI ROLE (DEMO)</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Fast Demo Accounts */}
            <View style={styles.demoSection}>
              <Text style={styles.demoIntro}>
                Pilih profil di bawah untuk menguji sistem sesuai hak akses (database SQLite riil):
              </Text>

              <View style={styles.demoGrid}>
                <TouchableOpacity
                  style={[styles.demoCard, styles.demoSuperAdmin]}
                  onPress={() => handleDemoLogin('SUPER_ADMIN')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.demoIconWrap, { backgroundColor: '#EDE9FE' }]}>
                    <Ionicons name="shield-half" size={18} color="#7C3AED" />
                  </View>
                  <View style={styles.demoInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.demoRole, { color: '#7C3AED', fontWeight: '800' }]}>👑 Super User (System)</Text>
                      <View style={styles.superBadgePill}>
                        <Text style={styles.superBadgePillText}>AKSES PENUH</Text>
                      </View>
                    </View>
                    <Text style={styles.demoName}>Fahri Adjie (fahriadjie99@gmail.com)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoCard, styles.demoAdmin]}
                  onPress={() => handleDemoLogin('ADMIN')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.demoIconWrap, { backgroundColor: '#ECEEF2' }]}>
                    <Ionicons name="shield-checkmark" size={18} color="#2D3142" />
                  </View>
                  <View style={styles.demoInfo}>
                    <Text style={styles.demoRole}>Ketua DKM (Admin)</Text>
                    <Text style={styles.demoName}>Ustadz Astriyo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoCard, styles.demoBendahara]}
                  onPress={() => handleDemoLogin('BENDAHARA')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.demoIconWrap, { backgroundColor: '#CCFBF1' }]}>
                    <Ionicons name="wallet" size={18} color="#0D9488" />
                  </View>
                  <View style={styles.demoInfo}>
                    <Text style={styles.demoRole}>Bendahara Keuangan</Text>
                    <Text style={styles.demoName}>H. Rahmat Hidayat</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoCard, styles.demoDkm]}
                  onPress={() => handleDemoLogin('DKM')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.demoIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="business" size={18} color="#D97706" />
                  </View>
                  <View style={styles.demoInfo}>
                    <Text style={styles.demoRole}>Pengurus DKM</Text>
                    <Text style={styles.demoName}>Ustadz Dicky</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoCard, styles.demoJamaah]}
                  onPress={() => handleDemoLogin('JAMAAH')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.demoIconWrap, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="people" size={18} color="#0284C7" />
                  </View>
                  <View style={styles.demoInfo}>
                    <Text style={styles.demoRole}>Warga / Jamaah</Text>
                    <Text style={styles.demoName}>Bpk. Joko Susanto (Blok H/15)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#EF8354" />
                <Text style={styles.loadingOverlayText}>Memproses autentikasi...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Batal / Lanjut sebagai Tamu Publik</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFDFB',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  modalLogoImg: {
    width: 40,
    height: 40,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D3142',
    letterSpacing: 0.6,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#4F5D75',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxHeight: 520,
  },
  bodyContent: {
    padding: 24,
  },
  titleSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  mainHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  googleSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  googleBtnWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  securityNote: {
    fontSize: 11,
    color: '#059669',
    marginTop: 10,
    fontWeight: '500',
  },
  oauthHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 6,
  },
  oauthHintText: {
    flex: 1,
    fontSize: 10.5,
    color: '#0369A1',
    lineHeight: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
    paddingHorizontal: 12,
  },
  demoSection: {
    marginTop: 4,
  },
  demoIntro: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoGrid: {
    gap: 10,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  demoSuperAdmin: {
    borderColor: '#C4B5FD',
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
  },
  superBadgePill: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  superBadgePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoAdmin: {
    borderColor: '#BFC0C0',
  },
  demoBendahara: {
    borderColor: '#BFC0C0',
  },
  demoDkm: {
    borderColor: '#BFC0C0',
  },
  demoJamaah: {
    borderColor: '#BFC0C0',
  },
  demoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoInfo: {
    flex: 1,
  },
  demoRole: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  demoName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 10,
    backgroundColor: '#FDF1EB',
    borderRadius: 8,
  },
  loadingOverlayText: {
    fontSize: 12,
    color: '#EF8354',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFDFB',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
