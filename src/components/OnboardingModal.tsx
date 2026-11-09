import React, { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { C, R, SP, TYPE } from '../theme/colors';
import { springTo } from '../theme/motion';
import { Button, Field, Segmented, T } from '../ui/kit';

// Blok perumahan Mutiara Puri Harmoni
const AVAILABLE_BLOCKS = ['Blok H', 'Blok A', 'Blok B', 'Blok C', 'Blok D', 'Blok E', 'Blok F', 'Blok G'];

// Pilihan keahlian/profesi untuk data sosial DKM
const JOB_OPTIONS = [
  'Pendidikan / Guru / Ustadz',
  'Teknologi & Media Informasi',
  'Kesehatan / Medis',
  'Wiraswasta / Perdagangan',
  'Teknik / Sipil & Bangunan',
  'Karyawan Swasta',
  'PNS / ASN / BUMN',
  'Ibu Rumah Tangga',
  'Lainnya',
];

const FAMILY_OPTIONS = ['1', '2', '3', '4', '5', '6+'];

type FieldKey = 'fullName' | 'phone' | 'noRumah';

/** Normalisasi nomor HP ke format 62xxx (sama seperti versi sebelumnya). */
function normalizePhone(input: string) {
  let clean = input.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.length > 0 && !clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Formulir wajib untuk pengguna baru. Mereplikasi perilaku `Sheet` (scrim, radius kartu, naik dengan spring,
 * di tengah pada layar lebar) tanpa tombol tutup, karena data diri wajib dilengkapi sebelum memakai aplikasi.
 */
export function OnboardingModal() {
  const { currentUser, isOnboardingModalVisible, submitOnboarding, logout } = useMushola();
  const { width } = useWindowDimensions();
  const wide = width >= 640;

  // Form states
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');
  const [blokRumah, setBlokRumah] = useState(currentUser?.blokRumah || 'Blok H');
  const [nomorBlok, setNomorBlok] = useState(currentUser?.nomorBlok || '7');
  const [noRumah, setNoRumah] = useState(currentUser?.noRumah || '');
  const [rtRw, setRtRw] = useState(currentUser?.rtRw || '05/07');
  const [statusWarga, setStatusWarga] = useState<'Tetap' | 'Kontrak'>((currentUser?.statusWarga as any) || 'Tetap');
  const [jumlahKeluarga, setJumlahKeluarga] = useState(
    currentUser?.jumlahKeluarga ? String(currentUser.jumlahKeluarga) : '4'
  );
  const [pekerjaan, setPekerjaan] = useState(currentUser?.pekerjaan || '');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sinkron saat data currentUser tersedia
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !fullName) setFullName(currentUser.name);
      if (currentUser.phone && !phoneInput) setPhoneInput(currentUser.phone);
      if (currentUser.blokRumah) setBlokRumah(currentUser.blokRumah);
      if (currentUser.nomorBlok) setNomorBlok(currentUser.nomorBlok);
      if (currentUser.noRumah) setNoRumah(currentUser.noRumah);
      if (currentUser.rtRw) setRtRw(currentUser.rtRw);
      if (currentUser.statusWarga) setStatusWarga(currentUser.statusWarga as any);
      if (currentUser.jumlahKeluarga) setJumlahKeluarga(String(currentUser.jumlahKeluarga));
      if (currentUser.pekerjaan) setPekerjaan(currentUser.pekerjaan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Animasi masuk panel (sama dengan Sheet): spring naik, scrim memudar.
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (isOnboardingModalVisible) {
      v.setValue(0);
      springTo(v, 1).start();
    }
  }, [isOnboardingModalVisible, v]);

  const phone = normalizePhone(phoneInput);
  const familyValue = FAMILY_OPTIONS.includes(jumlahKeluarga) ? jumlahKeluarga : Number(jumlahKeluarga) >= 6 ? '6+' : '4';

  const clearError = (k: FieldKey) => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));

  const handleSubmit = async () => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!fullName.trim()) next.fullName = 'Nama lengkap wajib diisi.';
    if (!phone.trim() || phone.length < 8) next.phone = 'Nomor WhatsApp belum valid. Isi minimal 8 digit, misalnya 0857xxxxxxxx.';
    if (!noRumah.trim()) next.noRumah = 'Nomor rumah wajib diisi.';
    setErrors(next);
    setSubmitError(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await submitOnboarding({
        fullName: fullName.trim(),
        phone: phone.trim(),
        blokRumah: blokRumah.trim(),
        nomorBlok: nomorBlok.trim(),
        noRumah: noRumah.trim(),
        rtRw: rtRw.trim(),
        statusWarga,
        jumlahKeluarga: parseInt(jumlahKeluarga, 10) || 1,
        pekerjaan: pekerjaan.trim(),
        catatan: catatan.trim(),
      });
    } catch (err: any) {
      setSubmitError(err?.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOnboardingModalVisible) return null;

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [wide ? 40 : 520, 0] });
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    // Tidak bisa ditutup dengan Escape/back: data diri wajib. Jalan keluar: tombol "Keluar dari akun".
    <Modal transparent visible animationType="none" onRequestClose={() => {}}>
      <Animated.View style={[styles.scrim, { opacity: v }]} />
      <View style={[styles.wrap, wide && styles.wrapWide]} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[styles.sheet, wide && styles.sheetWide, { opacity: wide ? v : 1, transform: [{ translateY }] }]}
        >
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header">
              Lengkapi data diri
            </Text>
            <T color={C.inkMuted}>
              Data ini dipakai DKM untuk pendataan warga dan komunikasi. Kolom bertanda wajib harus diisi.
            </T>
            {currentUser?.email ? (
              <View style={styles.emailPill}>
                <Ionicons name="mail-outline" size={14} color={C.inkMuted} aria-hidden />
                <T v="small" color={C.inkMuted} numberOfLines={1}>
                  Masuk sebagai {currentUser.email}
                </T>
              </View>
            ) : null}
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Field
              label="Nama lengkap sesuai KTP (wajib)"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                clearError('fullName');
              }}
              placeholder="Contoh: Ahmad Fauzi"
              error={errors.fullName}
            />

            <Field
              label="Nomor WhatsApp aktif (wajib)"
              value={phoneInput}
              onChangeText={(t) => {
                setPhoneInput(t);
                clearError('phone');
              }}
              keyboardType="phone-pad"
              placeholder="0857xxxxxxxx"
              error={errors.phone}
              hint={`Disimpan sebagai ${phone || '62...'}`}
            />

            <View style={styles.group}>
              <T v="label">Blok rumah (Mutiara Puri Harmoni)</T>
              <Segmented
                label="Blok rumah"
                options={AVAILABLE_BLOCKS.map((b) => ({ key: b, label: b }))}
                value={blokRumah}
                onChange={setBlokRumah}
              />
            </View>

            <View style={styles.twoCols}>
              <Field
                style={styles.col}
                label="Nomor blok"
                value={nomorBlok}
                onChangeText={setNomorBlok}
                placeholder="7"
                hint="Misal H7, isi 7"
              />
              <Field
                style={styles.col}
                label="Nomor rumah (wajib)"
                value={noRumah}
                onChangeText={(t) => {
                  setNoRumah(t);
                  clearError('noRumah');
                }}
                placeholder="31"
                error={errors.noRumah}
              />
            </View>

            <View style={styles.addressBox}>
              <Ionicons name="location-outline" size={16} color={C.g700} aria-hidden />
              <T v="small" color={C.inkMuted} style={{ flex: 1 }}>
                Alamat tercatat:{' '}
                <T v="smallStrong">
                  {blokRumah}
                  {nomorBlok || ''} No.{noRumah || '...'}
                </T>
              </T>
            </View>

            <Field label="RT / RW" value={rtRw} onChangeText={setRtRw} placeholder="05/07" />

            <View style={styles.group}>
              <T v="label">Status kependudukan</T>
              <Segmented
                label="Status kependudukan"
                options={[
                  { key: 'Tetap', label: 'Warga tetap' },
                  { key: 'Kontrak', label: 'Warga kontrak' },
                ]}
                value={statusWarga}
                onChange={setStatusWarga}
              />
            </View>

            <View style={styles.group}>
              <T v="label">Jumlah anggota keluarga di rumah</T>
              <Segmented
                label="Jumlah anggota keluarga"
                options={FAMILY_OPTIONS.map((n) => ({ key: n, label: `${n} orang` }))}
                value={familyValue}
                onChange={setJumlahKeluarga}
              />
            </View>

            <View style={styles.group}>
              <T v="label">Bidang profesi atau minat kontribusi</T>
              <Segmented
                label="Bidang profesi"
                options={JOB_OPTIONS.map((o) => ({ key: o, label: o }))}
                value={pekerjaan}
                onChange={setPekerjaan}
              />
              <T v="small" color={C.inkMuted}>
                {pekerjaan ? `Dipilih: ${pekerjaan}` : 'Opsional. Geser untuk melihat pilihan lain.'}
              </T>
            </View>

            <Field
              label="Pesan atau usulan untuk musholla (opsional)"
              value={catatan}
              onChangeText={setCatatan}
              placeholder="Usulan kajian, bantuan, atau aspirasi lain"
              multiline
            />
          </ScrollView>

          <View style={styles.footer}>
            {submitError ? (
              <View style={styles.errorBox} accessibilityLiveRegion="assertive" accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={18} color={C.dangerFg} aria-hidden />
                <T v="small" color={C.dangerFg} style={{ flex: 1 }}>
                  {submitError} Periksa koneksi lalu tekan Simpan data diri lagi.
                </T>
              </View>
            ) : hasErrors ? (
              <T v="small" color={C.dangerFg}>
                Ada kolom yang perlu diperbaiki. Lihat pesan merah di atas.
              </T>
            ) : null}
            <Button label="Simpan data diri" icon="checkmark-circle-outline" onPress={handleSubmit} loading={loading} />
            <Button label="Keluar dari akun" variant="ghost" onPress={logout} disabled={loading} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.scrim,
  },
  wrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  wrapWide: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SP.xl,
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: R.card,
    borderTopRightRadius: R.card,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  sheetWide: {
    width: '100%',
    maxWidth: 620,
    borderRadius: R.card,
  },
  head: {
    paddingHorizontal: SP.xl,
    paddingTop: SP.xl,
    paddingBottom: SP.l,
    gap: SP.s,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  title: {
    ...TYPE.h2,
    fontSize: 20,
    color: C.ink,
  } as TextStyle,
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: SP.m,
    paddingVertical: 6,
    borderRadius: R.pill,
    backgroundColor: C.sunken,
    borderWidth: 1,
    borderColor: C.line,
  },
  scroll: {
    flexShrink: 1,
  },
  form: {
    padding: SP.xl,
    gap: SP.l,
  },
  group: {
    gap: 6,
  },
  twoCols: {
    flexDirection: 'row',
    gap: SP.m,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.s,
    padding: SP.m,
    borderRadius: R.inner,
    backgroundColor: C.g50,
  },
  footer: {
    paddingHorizontal: SP.xl,
    paddingTop: SP.m,
    paddingBottom: SP.xl,
    gap: SP.s,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.s,
    padding: SP.m,
    borderRadius: R.inner,
    backgroundColor: C.dangerBg,
  },
});
