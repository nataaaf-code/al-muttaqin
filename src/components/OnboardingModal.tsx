import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';

export function OnboardingModal() {
  const { currentUser, isOnboardingModalVisible, submitOnboarding } = useMushola();

  // Form states
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [blokRumah, setBlokRumah] = useState(currentUser?.blokRumah || 'Blok H');
  const [nomorBlok, setNomorBlok] = useState(currentUser?.nomorBlok || '7');
  const [noRumah, setNoRumah] = useState(currentUser?.noRumah || '');
  const [rtRw, setRtRw] = useState(currentUser?.rtRw || '05/07');
  const [statusWarga, setStatusWarga] = useState<'Tetap' | 'Kontrak'>(
    (currentUser?.statusWarga as any) || 'Tetap'
  );
  const [jumlahKeluarga, setJumlahKeluarga] = useState(
    currentUser?.jumlahKeluarga ? String(currentUser.jumlahKeluarga) : '4'
  );
  const [pekerjaan, setPekerjaan] = useState(currentUser?.pekerjaan || 'Wiraswasta / Karyawan');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync saat data currentUser tersedia
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !fullName) setFullName(currentUser.name);
      if (currentUser.phone && !phone) setPhone(currentUser.phone);
      if (currentUser.blokRumah) setBlokRumah(currentUser.blokRumah);
      if (currentUser.nomorBlok) setNomorBlok(currentUser.nomorBlok);
      if (currentUser.noRumah) setNoRumah(currentUser.noRumah);
      if (currentUser.rtRw) setRtRw(currentUser.rtRw);
      if (currentUser.statusWarga) setStatusWarga(currentUser.statusWarga as any);
      if (currentUser.jumlahKeluarga) setJumlahKeluarga(String(currentUser.jumlahKeluarga));
      if (currentUser.pekerjaan) setPekerjaan(currentUser.pekerjaan);
    }
  }, [currentUser]);

  // Blok perumahan Mutiara Puri Harmoni
  const availableBlocks = ['Blok H', 'Blok A', 'Blok B', 'Blok C', 'Blok D', 'Blok E', 'Blok F', 'Blok G'];

  // Pilihan keahlian/profesi untuk data sosial DKM
  const jobOptions = [
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

  // Helper auto-format nomor handphone ke 62xxx
  const handlePhoneChange = (input: string) => {
    let clean = input.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.length > 0 && !clean.startsWith('62')) {
      clean = '62' + clean;
    }
    setPhone(clean);
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      alertMsg('Nama lengkap wajib diisi');
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      alertMsg('Nomor handphone tidak valid (minimal 8 digit)');
      return;
    }
    if (!noRumah.trim()) {
      alertMsg('Nomor rumah wajib diisi');
      return;
    }

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
      alertMsg('Alhamdulillah, profil data diri Anda berhasil dilengkapi!');
    } catch (err: any) {
      alertMsg(err.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const alertMsg = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Informasi', msg);
    }
  };

  if (!isOnboardingModalVisible) return null;

  return (
    <Modal visible={isOnboardingModalVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header Onboarding */}
          <View style={styles.header}>
            <View style={styles.badgeTop}>
              <Ionicons name="sparkles" size={16} color="#EF8354" />
              <Text style={styles.badgeTopText}>Pendaftaran Jamaah Baru</Text>
            </View>
            <Text style={styles.title}>Lengkapi Data Diri Jamaah</Text>
            <Text style={styles.subTitle}>
              Selamat datang di Musholla Al-Muttaqin! Mohon lengkapi data kependudukan untuk pendataan warga dan komunikasi DKM.
            </Text>

            {currentUser?.email && (
              <View style={styles.emailPill}>
                <Ionicons name="mail-outline" size={14} color="#4F5D75" />
                <Text style={styles.emailPillText}>{currentUser.email}</Text>
              </View>
            )}
          </View>

          {/* Form Scrollable */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 1. Nama Lengkap */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Nama Lengkap Sesuai KTP <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Contoh: Bpk. Ahmad Fauzi"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* 2. No Handphone WhatsApp (Auto 62xxx) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Nomor WhatsApp Aktif (Auto 62xxx) <Text style={styles.req}>*</Text>
              </Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>ID +62</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  value={phone.startsWith('62') ? phone.slice(2) : phone}
                  onChangeText={(val) => handlePhoneChange(val ? '62' + val : '')}
                  keyboardType="phone-pad"
                  placeholder="857-XXXX-XXXX"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.hint}>Tersimpan di database sebagai: {phone || '62...'}</Text>
            </View>

            {/* 3. Blok & Nomor Blok Rumah */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Pilihan Blok Rumah (Mutiara Puri Harmoni) <Text style={styles.req}>*</Text>
              </Text>
              <View style={styles.chipsRow}>
                {availableBlocks.map((b) => {
                  const isSelected = blokRumah === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setBlokRumah(b)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{b}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Nomor Blok & Nomor Rumah */}
            <View style={styles.twoColsRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Nomor Blok (Contoh: 7) <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={nomorBlok}
                  onChangeText={setNomorBlok}
                  placeholder="Contoh: 7"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>
                  Nomor Rumah <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={noRumah}
                  onChangeText={setNoRumah}
                  placeholder="Contoh: 31"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Preview Alamat Terformat */}
            <View style={styles.addressPreviewBox}>
              <Ionicons name="location" size={16} color="#EF8354" />
              <Text style={styles.addressPreviewText}>
                Format Alamat: <Text style={{ fontWeight: '800', color: '#2D3142' }}>{blokRumah}{nomorBlok ? nomorBlok : ''} No.{noRumah || '...'}</Text>
              </Text>
            </View>

            {/* 4. RT / RW */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>RT / RW (Default 05/07)</Text>
              <TextInput
                style={styles.input}
                value={rtRw}
                onChangeText={setRtRw}
                placeholder="05/07"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* 5. Status Kependudukan */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Status Kependudukan</Text>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  style={[styles.statusBtn, statusWarga === 'Tetap' && styles.statusBtnActive]}
                  onPress={() => setStatusWarga('Tetap')}
                >
                  <Ionicons
                    name="home"
                    size={16}
                    color={statusWarga === 'Tetap' ? '#EF8354' : '#4F5D75'}
                  />
                  <Text
                    style={[
                      styles.statusBtnText,
                      statusWarga === 'Tetap' && styles.statusBtnTextActive,
                    ]}
                  >
                    Warga Tetap
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, statusWarga === 'Kontrak' && styles.statusBtnActive]}
                  onPress={() => setStatusWarga('Kontrak')}
                >
                  <Ionicons
                    name="business"
                    size={16}
                    color={statusWarga === 'Kontrak' ? '#EF8354' : '#4F5D75'}
                  />
                  <Text
                    style={[
                      styles.statusBtnText,
                      statusWarga === 'Kontrak' && styles.statusBtnTextActive,
                    ]}
                  >
                    Warga Kontrak
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 6. Jumlah Anggota Keluarga */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Jumlah Jiwa / Anggota Keluarga di Rumah</Text>
              <View style={styles.chipsRow}>
                {['1', '2', '3', '4', '5', '6+'].map((num) => {
                  const isSel = jumlahKeluarga === num;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[styles.chip, isSel && styles.chipActive]}
                      onPress={() => setJumlahKeluarga(num)}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{num} Orang</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 7. Profesi / Bidang Keahlian */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bidang Profesi / Minat Kontribusi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {jobOptions.map((opt) => {
                  const isSel = pekerjaan === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.jobChip, isSel && styles.jobChipActive]}
                      onPress={() => setPekerjaan(opt)}
                    >
                      <Text style={[styles.jobChipText, isSel && styles.jobChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 8. Catatan / Usulan untuk Musholla */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Pesan / Usulan untuk Kemakmuran Musholla (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={catatan}
                onChangeText={setCatatan}
                placeholder="Tuliskan aspirasi, usulan kajian, atau bantuan untuk musholla..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Footer Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Simpan Data & Masuk ke Dashboard</Text>
                </>
              )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
    alignItems: 'center',
  },
  badgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  badgeTopText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF8354',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3142',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 10,
    gap: 6,
    marginTop: 10,
  },
  emailPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D3723',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  req: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonePrefix: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRightWidth: 0,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  hint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  twoColsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#EF8354',
    borderColor: '#EF8354',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  jobChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  jobChipActive: {
    backgroundColor: '#EF8354',
    borderColor: '#EF8354',
  },
  jobChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  jobChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  statusBtnActive: {
    backgroundColor: '#FDF1EB',
    borderColor: '#EF8354',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  statusBtnTextActive: {
    color: '#EF8354',
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  addressPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF1EB',
    borderWidth: 1,
    borderColor: '#BFC0C0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  addressPreviewText: {
    fontSize: 12,
    color: '#2D3142',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF8354',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#EF8354',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
