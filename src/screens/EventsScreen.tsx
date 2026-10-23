import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { formatDateIndo } from '../utils/formatters';
import { EventItem } from '../types';

export function EventsScreen() {
  const { events, addEvent, fridaySchedule, updateFridaySchedule, subOrgs, currentRole, permissions } = useMushola();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal Tambah Agenda
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [theme, setTheme] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeStart, setTimeStart] = useState('05:00');
  const [timeEnd, setTimeEnd] = useState('06:30');
  const [location, setLocation] = useState('Ruang Utama Mushola Al-Muttaqin');

  // Sub-org yang dapat dipilih (jika Bendahara Sub, hanya unitnya)
  const availableSubOrgs = subOrgs.filter((s) => {
    if (currentRole === 'BENDAHARA_SUB') {
      return s.id !== 'org-dkm';
    }
    return true;
  });

  const [subOrgId, setSubOrgId] = useState(availableSubOrgs[0]?.id || 'org-dkm');

  // Modal Edit Petugas Jumat
  const [fridayModalVisible, setFridayModalVisible] = useState(false);
  const [editKhotib, setEditKhotib] = useState(fridaySchedule.khotib);
  const [editImam, setEditImam] = useState(fridaySchedule.imam);
  const [editMuadzin, setEditMuadzin] = useState(fridaySchedule.muadzin);
  const [editBilal, setEditBilal] = useState(fridaySchedule.bilal);
  const [editTheme, setEditTheme] = useState(fridaySchedule.theme);

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory === 'ALL') return true;
    return ev.category === selectedCategory;
  });

  const handleSaveEvent = () => {
    if (!permissions.canAddEvent) {
      alertMsg('Akses Ditolak', `Peran ${permissions.roleTitle} tidak memiliki izin menambah agenda.`);
      return;
    }
    if (!title.trim()) {
      alertMsg('Peringatan', 'Judul agenda / kajian wajib diisi');
      return;
    }

    addEvent({
      subOrgId,
      title: title.trim(),
      category: 'KAJIAN_RUTIN',
      date,
      timeStart,
      timeEnd,
      speakerOrOfficer: speaker.trim(),
      theme: theme.trim(),
      location,
      isPublic: true,
    });

    // Reset
    setTitle('');
    setSpeaker('');
    setTheme('');
    setModalVisible(false);
    alertMsg('Berhasil', 'Agenda kajian baru telah ditambahkan!');
  };

  const handleSaveFridaySchedule = () => {
    if (!permissions.canEditFridaySchedule) {
      alertMsg('Akses Ditolak', 'Hanya Sekretaris dan Ketua DKM yang dapat mengedit petugas Jumat.');
      return;
    }
    updateFridaySchedule({
      ...fridaySchedule,
      khotib: editKhotib.trim() || fridaySchedule.khotib,
      imam: editImam.trim() || fridaySchedule.imam,
      muadzin: editMuadzin.trim() || fridaySchedule.muadzin,
      bilal: editBilal.trim() || fridaySchedule.bilal,
      theme: editTheme.trim() || fridaySchedule.theme,
    });
    setFridayModalVisible(false);
    alertMsg('Berhasil', 'Jadwal petugas sholat Jumat telah diperbarui!');
  };

  const alertMsg = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Banner Sholat Jumat */}
        <View style={styles.fridayBanner}>
          <View style={styles.fridayBadge}>
            <Ionicons name="sparkles" size={14} color="#047857" />
            <Text style={styles.fridayBadgeText}>JADWAL SHOLAT JUMAT PEKAN INI</Text>
          </View>
          <Text style={styles.fridayDate}>{fridaySchedule.date}</Text>
          <Text style={styles.fridayTheme}>"{fridaySchedule.theme}"</Text>

          <View style={styles.officerRow}>
            <View style={styles.officerPill}>
              <Text style={styles.officerRoleLabel}>Khotib</Text>
              <Text style={styles.officerNameText}>{fridaySchedule.khotib}</Text>
            </View>
            <View style={styles.officerPill}>
              <Text style={styles.officerRoleLabel}>Imam</Text>
              <Text style={styles.officerNameText}>{fridaySchedule.imam}</Text>
            </View>
          </View>

          <View style={[styles.officerRow, { marginTop: 6 }]}>
            <View style={styles.officerPill}>
              <Text style={styles.officerRoleLabel}>Muadzin</Text>
              <Text style={styles.officerNameText}>{fridaySchedule.muadzin}</Text>
            </View>
            <View style={styles.officerPill}>
              <Text style={styles.officerRoleLabel}>Bilal</Text>
              <Text style={styles.officerNameText}>{fridaySchedule.bilal}</Text>
            </View>
          </View>

          {permissions.canEditFridaySchedule && (
            <TouchableOpacity
              style={styles.editFridayBtn}
              onPress={() => setFridayModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={13} color="#047857" />
              <Text style={styles.editFridayBtnText}>Edit Petugas Sholat Jumat</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Header Agenda */}
        <View style={styles.actionHeader}>
          <Text style={styles.actionHeaderTitle}>Kalender Kajian & Kegiatan</Text>
          {permissions.canAddEvent ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Tambah Agenda</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.readOnlyRoleBadge}>
              <Ionicons name="eye-outline" size={13} color="#64748B" />
              <Text style={styles.readOnlyRoleText}>
                Mode Terbuka Umum ({permissions.roleTitle})
              </Text>
            </View>
          )}
        </View>

        {/* Filter Kategori */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { id: 'ALL', label: 'Semua Kegiatan' },
            { id: 'KAJIAN_RUTIN', label: 'Kajian Rutin' },
            { id: 'KAJIAN_AKBAR', label: 'Kajian Akbar' },
            { id: 'KERJA_BAKTI', label: 'Kerja Bakti' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                selectedCategory === cat.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat.id && styles.filterChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Daftar Agenda */}
        {filteredEvents.map((item) => (
          <View key={item.id} style={styles.eventCard}>
            <View style={styles.cardHeader}>
              <View style={styles.dateTag}>
                <Ionicons name="calendar-outline" size={13} color="#047857" />
                <Text style={styles.dateTagText}>{formatDateIndo(item.date)}</Text>
              </View>
              <View style={styles.timeTag}>
                <Ionicons name="time-outline" size={13} color="#475569" />
                <Text style={styles.timeTagText}>
                  {item.timeStart} - {item.timeEnd} WIB
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>

            {item.theme ? (
              <Text style={styles.cardTheme}>Tema: "{item.theme}"</Text>
            ) : null}

            {item.speakerOrOfficer ? (
              <View style={styles.speakerBox}>
                <Ionicons name="mic-outline" size={14} color="#047857" />
                <Text style={styles.speakerText}>Narasumber: {item.speakerOrOfficer}</Text>
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <View style={styles.locationBox}>
                <Ionicons name="location-outline" size={13} color="#64748B" />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal Tambah Agenda */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Agenda / Kajian Baru</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Judul Agenda:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cth: Kajian Ahad Shubuh: Tazkiyatun Nafs"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Narasumber / Penceramah:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cth: Ustadz Dr. H. Khalid Basalamah, M.A."
                value={speaker}
                onChangeText={setSpeaker}
              />

              <Text style={styles.inputLabel}>Tema / Pembahasan:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cth: Meraih Ketenangan Hati dalam Sholat"
                value={theme}
                onChangeText={setTheme}
              />

              <Text style={styles.inputLabel}>Tanggal (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2026-10-25"
                value={date}
                onChangeText={setDate}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Jam Mulai:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="05:00"
                    value={timeStart}
                    onChangeText={setTimeStart}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Jam Selesai:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="06:30"
                    value={timeEnd}
                    onChangeText={setTimeEnd}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Lokasi:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ruang Utama Mushola Al-Muttaqin"
                value={location}
                onChangeText={setLocation}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEvent}>
                <Text style={styles.submitBtnText}>Simpan Agenda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Edit Petugas Sholat Jumat (Khusus Sekretaris & Ketua DKM) */}
      <Modal visible={fridayModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Petugas Sholat Jumat</Text>
              <TouchableOpacity onPress={() => setFridayModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Tema Khutbah Jumat:</Text>
              <TextInput
                style={styles.textInput}
                value={editTheme}
                onChangeText={setEditTheme}
                placeholder="Tema Khutbah"
              />

              <Text style={styles.inputLabel}>Nama Khotib:</Text>
              <TextInput
                style={styles.textInput}
                value={editKhotib}
                onChangeText={setEditKhotib}
                placeholder="Nama Khotib"
              />

              <Text style={styles.inputLabel}>Nama Imam:</Text>
              <TextInput
                style={styles.textInput}
                value={editImam}
                onChangeText={setEditImam}
                placeholder="Nama Imam"
              />

              <Text style={styles.inputLabel}>Nama Muadzin:</Text>
              <TextInput
                style={styles.textInput}
                value={editMuadzin}
                onChangeText={setEditMuadzin}
                placeholder="Nama Muadzin"
              />

              <Text style={styles.inputLabel}>Nama Bilal:</Text>
              <TextInput
                style={styles.textInput}
                value={editBilal}
                onChangeText={setEditBilal}
                placeholder="Nama Bilal"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setFridayModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveFridaySchedule}>
                <Text style={styles.submitBtnText}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fridayBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 18,
  },
  fridayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  fridayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  fridayDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 4,
  },
  fridayTheme: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#1E293B',
    marginBottom: 12,
  },
  officerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  officerPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  officerRoleLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  officerNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  editFridayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 10,
  },
  editFridayBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#047857',
  },
  readOnlyRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  readOnlyRoleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  addBtn: {
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
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
    backgroundColor: '#047857',
    borderColor: '#047857',
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
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardTheme: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  speakerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    gap: 6,
    marginBottom: 8,
  },
  speakerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#047857',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
