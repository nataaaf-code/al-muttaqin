import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { JamaahResident } from '../types';

export function JamaahScreen() {
  const { jamaahList, permissions, currentRole, addJamaah } = useMushola();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Tambah Data Warga State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [headOfFamily, setHeadOfFamily] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [address, setAddress] = useState('');
  const [memberCount, setMemberCount] = useState('3');
  const [phone, setPhone] = useState('');
  const [economicStatus, setEconomicStatus] = useState<JamaahResident['economicStatus']>('MAMPU');
  const [takmirNotes, setTakmirNotes] = useState('');

  // Aspirasi Form State
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionContent, setSuggestionContent] = useState('');
  const [sentSuggestions, setSentSuggestions] = useState<
    Array<{ id: string; name: string; content: string; date: string }>
  >([
    {
      id: 'sug-1',
      name: 'H. Sudarsono (Warga RT 02)',
      content:
        'Mohon volume speaker luar saat adzan subuh diposisikan presisi agar tidak pecah suaranya.',
      date: '22 Okt 2026',
    },
    {
      id: 'sug-2',
      name: 'Ibu Ratna (Majelis Taklim)',
      content:
        'Alhamdulillah program kajian parenting sangat bermanfaat, mohon diadakan sebulan sekali.',
      date: '20 Okt 2026',
    },
  ]);

  const maskPhoneNumber = (rawPhone: string) => {
    if (!rawPhone) return '-';
    // Format e.g. 0812-****-7890
    const clean = rawPhone.replace(/\D/g, '');
    if (clean.length >= 8) {
      const prefix = clean.slice(0, 4);
      const suffix = clean.slice(-4);
      return `${prefix}-****-${suffix}`;
    }
    return '08**-****-****';
  };

  const handleSaveResident = () => {
    if (!headOfFamily.trim()) {
      alertMsg('Peringatan', 'Nama Kepala Keluarga wajib diisi!');
      return;
    }
    if (!address.trim()) {
      alertMsg('Peringatan', 'Alamat/Blok rumah wajib diisi!');
      return;
    }
    const count = parseInt(memberCount, 10);
    if (isNaN(count) || count <= 0) {
      alertMsg('Peringatan', 'Jumlah anggota keluarga harus minimal 1!');
      return;
    }

    addJamaah({
      headOfFamily: headOfFamily.trim(),
      rtRw: rtRw.trim() || 'RT 04 / RW 08',
      address: address.trim(),
      memberCount: count,
      phone: phone.trim() || '-',
      economicStatus: economicStatus,
      notes: takmirNotes.trim() || undefined,
    });

    setIsAddModalOpen(false);
    resetForm();
    alertMsg('Berhasil', 'Data warga jamaah berhasil ditambahkan ke direktori DKM.');
  };

  const resetForm = () => {
    setHeadOfFamily('');
    setRtRw('');
    setAddress('');
    setMemberCount('3');
    setPhone('');
    setEconomicStatus('MAMPU');
    setTakmirNotes('');
  };

  const handleSendSuggestion = () => {
    if (!suggestionContent.trim()) {
      alertMsg('Peringatan', 'Isi saran atau aspirasi tidak boleh kosong');
      return;
    }

    const newSuggestion = {
      id: `sug-${Date.now()}`,
      name: suggestionName.trim() || 'Hamba Allah (Anonim)',
      content: suggestionContent.trim(),
      date: 'Hari ini',
    };

    setSentSuggestions([newSuggestion, ...sentSuggestions]);
    setSuggestionName('');
    setSuggestionContent('');
    alertMsg('Terkirim', 'Terima kasih, aspirasi Anda telah disampaikan ke pengurus DKM.');
  };

  const alertMsg = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const openWhatsApp = (phoneNum: string, name: string) => {
    const clean = phoneNum.replace(/\D/g, '');
    const waNumber = clean.startsWith('0') ? `62${clean.slice(1)}` : clean;
    const url = `https://wa.me/${waNumber}?text=Assalamu%27alaikum%20Bapak%2FIbu%20${encodeURIComponent(name)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const filteredResidents = jamaahList.filter((item) => {
    const matchCategory =
      filterStatus === 'ALL' || item.economicStatus === filterStatus;
    const matchSearch =
      item.headOfFamily.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rtRw.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.bannerBox}>
        <View style={styles.bannerHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Direktori Jamaah & Pemetaan Sosial</Text>
            <Text style={styles.bannerSubtitle}>
              Basis data warga lingkungan mushola untuk pemerataan zakat, infak, santunan yatim, dan
              silaturahmi warga.
            </Text>
          </View>
          {permissions.canManageJamaah && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsAddModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={17} color="#FFFFFF" />
              <Text style={styles.addBtnText}>+ Tambah Warga</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* RBAC Notice Perlindungan Privasi */}
      {!permissions.canManageJamaah ? (
        <View style={styles.privacyNoticeBox}>
          <Ionicons name="shield-checkmark" size={20} color="#EF8354" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.privacyNoticeTitle}>Perlindungan Privasi Warga Aktif</Text>
            <Text style={styles.privacyNoticeText}>
              Sebagai <Text style={{ fontWeight: '700' }}>{permissions.roleTitle}</Text>, nomor telepon disamarkan dan catatan takmir dilindungi. Pengurus DKM & Sekretaris memiliki wewenang penuh untuk verifikasi mustahik ZIS & penyaluran santunan.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.adminAccessBadge}>
          <Ionicons name="lock-open-outline" size={16} color="#EF8354" />
          <Text style={styles.adminAccessBadgeText}>
            Akses Penuh Pengurus: Menampilkan nomor kontak lengkap dan catatan khusus takmir untuk distribusi santunan.
          </Text>
        </View>
      )}

      {/* Filter Tabs & Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama kepala keluarga, RT, atau alamat..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {[
          { id: 'ALL', label: 'Semua Warga' },
          { id: 'YATIM_DHUAFA', label: 'Yatim & Dhuafa' },
          { id: 'MUSTAHIK', label: 'Mustahik ZIS' },
          { id: 'MAMPU', label: 'Warga Mampu / Muzakki' },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filterChip,
              filterStatus === f.id && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus(f.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStatus === f.id && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Daftar Warga */}
      <Text style={styles.sectionHeading}>
        Daftar Kepala Keluarga ({filteredResidents.length})
      </Text>

      {filteredResidents.map((item) => (
        <View key={item.id} style={styles.residentCard}>
          <View style={styles.residentTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headName}>{item.headOfFamily}</Text>
              <Text style={styles.addressText}>
                {item.address} ({item.rtRw})
              </Text>
            </View>

            {/* Economic Status Badge */}
            {permissions.canManageJamaah ? (
              <View
                style={[
                  styles.statusBadge,
                  item.economicStatus === 'YATIM_DHUAFA'
                    ? styles.badgeYatim
                    : item.economicStatus === 'MUSTAHIK'
                    ? styles.badgeMustahik
                    : styles.badgeMampu,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.economicStatus === 'YATIM_DHUAFA'
                      ? styles.textYatim
                      : item.economicStatus === 'MUSTAHIK'
                      ? styles.textMustahik
                      : styles.textMampu,
                  ]}
                >
                  {item.economicStatus.replace('_', ' ')}
                </Text>
              </View>
            ) : (
              <View style={styles.badgeGeneral}>
                <Ionicons name="checkmark-circle" size={11} color="#EF8354" />
                <Text style={styles.textGeneral}>Warga Terdaftar</Text>
              </View>
            )}
          </View>

          <View style={styles.residentBottom}>
            <View style={styles.metaCol}>
              <Ionicons name="people-outline" size={14} color="#64748B" />
              <Text style={styles.metaColText}>{item.memberCount} Jiwa Tanggungan</Text>
            </View>

            <View style={styles.metaCol}>
              <Ionicons name="call-outline" size={14} color="#64748B" />
              <Text style={styles.metaColText}>
                {permissions.canManageJamaah ? item.phone : maskPhoneNumber(item.phone)}
              </Text>
              {permissions.canManageJamaah && item.phone && item.phone !== '-' && (
                <TouchableOpacity
                  style={styles.inlineWaBtn}
                  onPress={() => openWhatsApp(item.phone, item.headOfFamily)}
                >
                  <Ionicons name="logo-whatsapp" size={12} color="#EF8354" />
                  <Text style={styles.inlineWaText}>Chat</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Catatan Takmir: Hanya terlihat oleh pengurus yang punya hak akses */}
          {permissions.canManageJamaah && item.notes ? (
            <View style={styles.notesBox}>
              <Ionicons name="bookmark-outline" size={13} color="#B45309" />
              <Text style={styles.notesText}>Catatan Takmir: {item.notes}</Text>
            </View>
          ) : null}
        </View>
      ))}

      {/* Kotak Saran & Aspirasi Jamaah */}
      <View style={styles.suggestionBox}>
        <View style={styles.suggestionHeader}>
          <Ionicons name="chatbubbles-outline" size={22} color="#EF8354" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.suggestionTitle}>Kotak Saran & Aspirasi Jamaah</Text>
            <Text style={styles.suggestionDesc}>
              Sampaikan kritik, saran, atau usulan kegiatan untuk kemajuan mushola.
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.suggestionInputSmall}
          placeholder="Nama Anda (Kosongkan jika ingin anonim)"
          value={suggestionName}
          onChangeText={setSuggestionName}
        />

        <TextInput
          style={styles.suggestionInputLarge}
          placeholder="Tulis masukan, ide kajian, atau masukan kebersihan..."
          multiline
          value={suggestionContent}
          onChangeText={setSuggestionContent}
        />

        <TouchableOpacity style={styles.sendBtn} onPress={handleSendSuggestion}>
          <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
          <Text style={styles.sendBtnText}>Kirimkan Aspirasi</Text>
        </TouchableOpacity>

        {/* Riwayat Aspirasi Terkini */}
        <Text style={[styles.sectionHeading, { marginTop: 18, marginBottom: 8 }]}>
          Aspirasi Jamaah Terkini:
        </Text>
        {sentSuggestions.map((s) => (
          <View key={s.id} style={styles.suggestionItem}>
            <View style={styles.sugTop}>
              <Text style={styles.sugAuthor}>{s.name}</Text>
              <Text style={styles.sugDate}>{s.date}</Text>
            </View>
            <Text style={styles.sugContent}>"{s.content}"</Text>
          </View>
        ))}
      </View>

      {/* Modal Tambah Data Warga */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="person-add" size={20} color="#EF8354" />
                <Text style={styles.modalTitle}>Tambah Data Warga Jamaah</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nama Kepala Keluarga *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth: Bapak Ahmad Fauzi"
                value={headOfFamily}
                onChangeText={setHeadOfFamily}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>RT / RW *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="cth: RT 04 / RW 08"
                    value={rtRw}
                    onChangeText={setRtRw}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Jumlah Jiwa</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="3"
                    keyboardType="numeric"
                    value={memberCount}
                    onChangeText={setMemberCount}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Alamat / Blok Rumah *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth: Blok H5 No. 12"
                value={address}
                onChangeText={setAddress}
              />

              <Text style={styles.inputLabel}>No. HP / WhatsApp (Aktif)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth: 081234567890"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.inputLabel}>Kategori Sosial / ZIS</Text>
              <View style={styles.radioWrap}>
                {[
                  { id: 'MAMPU', label: 'Muzakki / Mampu' },
                  { id: 'MUSTAHIK', label: 'Mustahik ZIS' },
                  { id: 'YATIM_DHUAFA', label: 'Yatim & Dhuafa' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.radioChip,
                      economicStatus === c.id && styles.radioChipActive,
                    ]}
                    onPress={() => setEconomicStatus(c.id as JamaahResident['economicStatus'])}
                  >
                    <Text
                      style={[
                        styles.radioChipText,
                        economicStatus === c.id && styles.radioChipTextActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Catatan Khusus Takmir (Kebutuhan santunan, lansia, dll)</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="cth: Lansia tinggal bersama cucu, perlu prioritas paket sembako"
                multiline
                value={takmirNotes}
                onChangeText={setTakmirNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveResident}
              >
                <Text style={styles.modalSubmitBtnText}>Simpan Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF8354',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  privacyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FDF1EB',
    borderWidth: 1,
    borderColor: '#BFC0C0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  privacyNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  privacyNoticeText: {
    fontSize: 11,
    color: '#EF8354',
    lineHeight: 16,
  },
  adminAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  adminAccessBadgeText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#EF8354',
    borderColor: '#EF8354',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  residentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  residentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeYatim: {
    backgroundColor: '#FEE2E2',
  },
  textYatim: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 10,
  },
  badgeMustahik: {
    backgroundColor: '#FEF3C7',
  },
  textMustahik: {
    color: '#B45309',
    fontWeight: '700',
    fontSize: 10,
  },
  badgeMampu: {
    backgroundColor: '#DCFCE7',
  },
  textMampu: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 10,
  },
  badgeGeneral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  textGeneral: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  statusBadgeText: {
    fontSize: 10,
  },
  residentBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaColText: {
    fontSize: 12,
    color: '#64748B',
  },
  inlineWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FDF1EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  inlineWaText: {
    fontSize: 10,
    color: '#EF8354',
    fontWeight: '700',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  notesText: {
    fontSize: 11,
    color: '#B45309',
    fontStyle: 'italic',
    flex: 1,
  },
  suggestionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  suggestionDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  suggestionInputSmall: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 12,
    marginBottom: 8,
  },
  suggestionInputLarge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 12,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  sendBtn: {
    backgroundColor: '#EF8354',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  suggestionItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF8354',
  },
  sugTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sugAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  sugDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  sugContent: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingBottom: 14,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  radioWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  radioChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radioChipActive: {
    backgroundColor: '#FDF1EB',
    borderColor: '#EF8354',
  },
  radioChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  radioChipTextActive: {
    color: '#EF8354',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 14,
  },
  modalCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    backgroundColor: '#EF8354',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

