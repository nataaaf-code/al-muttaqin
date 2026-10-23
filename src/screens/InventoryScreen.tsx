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
import { InventoryItem } from '../types';

export function InventoryScreen() {
  const { inventories, permissions, currentRole, addInventory, updateInventoryCondition } = useMushola();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal State Tambah Aset
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<InventoryItem['category']>('AUDIO_ELEKTRONIK');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState('Unit');
  const [itemCondition, setItemCondition] = useState<InventoryItem['condition']>('BAIK');
  const [itemLocation, setItemLocation] = useState('');
  const [isForLoan, setIsForLoan] = useState(false);
  const [itemNotes, setItemNotes] = useState('');

  const filteredItems = inventories.filter((inv) => {
    if (filterCategory === 'ALL') return true;
    return inv.category === filterCategory;
  });

  const handleSaveInventory = () => {
    if (!itemName.trim()) {
      alertMsg('Peringatan', 'Nama barang wajib diisi!');
      return;
    }
    const qty = parseInt(itemQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      alertMsg('Peringatan', 'Jumlah barang harus berupa angka positif!');
      return;
    }

    addInventory({
      name: itemName.trim(),
      category: itemCategory,
      quantity: qty,
      unit: itemUnit.trim() || 'Unit',
      condition: itemCondition,
      location: itemLocation.trim() || 'Gudang Mushola',
      isAvailableForLoan: isForLoan,
      notes: itemNotes.trim() || undefined,
    });

    setIsAddModalOpen(false);
    resetForm();
    alertMsg('Berhasil', 'Aset baru berhasil dicatatkan dalam sistem inventaris.');
  };

  const resetForm = () => {
    setItemName('');
    setItemCategory('AUDIO_ELEKTRONIK');
    setItemQuantity('1');
    setItemUnit('Unit');
    setItemCondition('BAIK');
    setItemLocation('');
    setIsForLoan(false);
    setItemNotes('');
  };

  const alertMsg = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.bannerBox}>
        <View style={styles.bannerHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Inventaris & Sarana Prasarana (Sarpras)</Text>
            <Text style={styles.bannerSubtitle}>
              Katalog aset fisik mushola, status kelayakan pakai, dan fasilitas yang dapat dipinjam warga.
            </Text>
          </View>
          {permissions.canManageInventory && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsAddModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>+ Tambah Aset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* RBAC Notice jika bukan Sarpras / Super Admin */}
      {!permissions.canManageInventory && (
        <View style={styles.rbacNoticeBox}>
          <Ionicons name="information-circle" size={20} color="#0284C7" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.rbacNoticeTitle}>Mode Transparansi Inventaris</Text>
            <Text style={styles.rbacNoticeText}>
              Sebagai <Text style={{ fontWeight: '700' }}>{permissions.roleTitle}</Text>, Anda melihat katalog fasilitas secara terbuka. Perubahan status kondisi fisik atau penambahan aset hanya dapat dilakukan oleh <Text style={{ fontWeight: '700' }}>Seksi Sarpras & Logistik</Text> atau <Text style={{ fontWeight: '700' }}>Ketua DKM</Text>.
            </Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {[
          { id: 'ALL', label: 'Semua Aset' },
          { id: 'AUDIO_ELEKTRONIK', label: 'Audio & Sound' },
          { id: 'PERLENGKAPAN_IBADAH', label: 'Perlengkapan Ibadah' },
          { id: 'FASILITAS_UMUM', label: 'Fasilitas Umum & Tenda' },
          { id: 'PERAWATAN_JENAZAH', label: 'Perawatan Jenazah' },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filterChip,
              filterCategory === f.id && styles.filterChipActive,
            ]}
            onPress={() => setFilterCategory(f.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterCategory === f.id && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List Inventaris */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Daftar Inventaris ({filteredItems.length})</Text>
        {permissions.canManageInventory && (
          <Text style={styles.sectionHint}>Ketuk status kondisi untuk mengubah</Text>
        )}
      </View>

      {filteredItems.map((item) => (
        <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category.replace('_', ' ')}</Text>
            </View>

            {/* Jika punya hak kelola inventory, berikan tombol toggle kondisi */}
            {permissions.canManageInventory ? (
              <View style={styles.conditionToggleGroup}>
                {(['BAIK', 'RUSAK_RINGAN', 'PERLU_DIGANTI'] as const).map((cond) => {
                  const isActive = item.condition === cond;
                  return (
                    <TouchableOpacity
                      key={cond}
                      style={[
                        styles.condBtn,
                        cond === 'BAIK' && (isActive ? styles.condBtnGoodActive : styles.condBtnGood),
                        cond === 'RUSAK_RINGAN' && (isActive ? styles.condBtnWarnActive : styles.condBtnWarn),
                        cond === 'PERLU_DIGANTI' && (isActive ? styles.condBtnDangerActive : styles.condBtnDanger),
                      ]}
                      onPress={() => updateInventoryCondition(item.id, cond)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.condBtnText,
                          cond === 'BAIK' && (isActive ? styles.condTextGoodActive : styles.condTextGood),
                          cond === 'RUSAK_RINGAN' && (isActive ? styles.condTextWarnActive : styles.condTextWarn),
                          cond === 'PERLU_DIGANTI' && (isActive ? styles.condTextDangerActive : styles.condTextDanger),
                        ]}
                      >
                        {cond === 'BAIK' ? 'Baik' : cond === 'RUSAK_RINGAN' ? 'Rusak Ringan' : 'Ganti'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View
                style={[
                  styles.conditionBadge,
                  item.condition === 'BAIK'
                    ? styles.badgeGood
                    : item.condition === 'RUSAK_RINGAN'
                    ? styles.badgeWarning
                    : styles.badgeDanger,
                ]}
              >
                <Text
                  style={[
                    styles.conditionBadgeText,
                    item.condition === 'BAIK'
                      ? styles.textGood
                      : item.condition === 'RUSAK_RINGAN'
                      ? styles.textWarning
                      : styles.textDanger,
                  ]}
                >
                  {item.condition}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="cube-outline" size={14} color="#64748B" />
              <Text style={styles.detailText}>
                Jumlah: <Text style={styles.boldText}>{item.quantity} {item.unit}</Text>
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.detailText}>
                Lokasi: <Text style={styles.boldText}>{item.location}</Text>
              </Text>
            </View>

            {item.notes ? (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={14} color="#64748B" />
                <Text style={styles.detailText}>
                  Catatan: <Text style={styles.boldText}>{item.notes}</Text>
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.itemFooter}>
            {item.isAvailableForLoan ? (
              <View style={styles.loanBadgeAvailable}>
                <Ionicons name="checkmark-circle-outline" size={13} color="#EF8354" />
                <Text style={styles.loanTextAvailable}>Bisa Dipinjam Warga (Hubungi Sie Sarpras)</Text>
              </View>
            ) : (
              <View style={styles.loanBadgeRestricted}>
                <Ionicons name="lock-closed-outline" size={13} color="#64748B" />
                <Text style={styles.loanTextRestricted}>Fasilitas Internal Mushola Saja</Text>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Modal Tambah Aset Inventaris */}
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
                <Ionicons name="cube" size={20} color="#EF8354" />
                <Text style={styles.modalTitle}>Tambah Aset Inventaris</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nama Barang / Aset *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth: Wireless Mic Shure, Tenda Tarup 4x6"
                value={itemName}
                onChangeText={setItemName}
              />

              <Text style={styles.inputLabel}>Kategori Aset</Text>
              <View style={styles.radioWrap}>
                {[
                  { id: 'AUDIO_ELEKTRONIK', label: 'Audio & Sound' },
                  { id: 'PERLENGKAPAN_IBADAH', label: 'Ibadah' },
                  { id: 'FASILITAS_UMUM', label: 'Fasilitas Umum' },
                  { id: 'PERAWATAN_JENAZAH', label: 'Jenazah' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.radioChip,
                      itemCategory === c.id && styles.radioChipActive,
                    ]}
                    onPress={() => setItemCategory(c.id as InventoryItem['category'])}
                  >
                    <Text
                      style={[
                        styles.radioChipText,
                        itemCategory === c.id && styles.radioChipTextActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Jumlah *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="1"
                    keyboardType="numeric"
                    value={itemQuantity}
                    onChangeText={setItemQuantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Satuan</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Unit / Set / Rol"
                    value={itemUnit}
                    onChangeText={setItemUnit}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Kondisi Fisik Awal</Text>
              <View style={styles.radioWrap}>
                {[
                  { id: 'BAIK', label: 'Baik & Layak' },
                  { id: 'RUSAK_RINGAN', label: 'Rusak Ringan' },
                  { id: 'PERLU_DIGANTI', label: 'Perlu Diganti' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.radioChip,
                      itemCondition === c.id && styles.radioChipActive,
                    ]}
                    onPress={() => setItemCondition(c.id as InventoryItem['condition'])}
                  >
                    <Text
                      style={[
                        styles.radioChipText,
                        itemCondition === c.id && styles.radioChipTextActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Lokasi Penyimpanan *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth: Ruang Sound, Gudang Sayap Kanan"
                value={itemLocation}
                onChangeText={setItemLocation}
              />

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsForLoan(!isForLoan)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isForLoan ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isForLoan ? '#EF8354' : '#94A3B8'}
                />
                <Text style={styles.checkboxLabel}>
                  Bisa dipinjam oleh warga lingkungan untuk hajat/keperluan pribadi
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Catatan / Merk / Spesifikasi (Opsional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="cth: Donasi Bapak H. Wahyu thn 2025"
                multiline
                value={itemNotes}
                onChangeText={setItemNotes}
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
                onPress={handleSaveInventory}
              >
                <Text style={styles.modalSubmitBtnText}>Simpan Aset</Text>
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
  rbacNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  rbacNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 2,
  },
  rbacNoticeText: {
    fontSize: 11,
    color: '#0C4A6E',
    lineHeight: 16,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionHint: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemCategory: {
    fontSize: 11,
    color: '#EF8354',
    fontWeight: '600',
    marginTop: 2,
  },
  conditionToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  condBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  condBtnText: {
    fontSize: 10,
  },
  condBtnGood: {
    backgroundColor: 'transparent',
  },
  condBtnGoodActive: {
    backgroundColor: '#DCFCE7',
  },
  condTextGood: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '500',
  },
  condTextGoodActive: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '700',
  },
  condBtnWarn: {
    backgroundColor: 'transparent',
  },
  condBtnWarnActive: {
    backgroundColor: '#FEF3C7',
  },
  condTextWarn: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
  },
  condTextWarnActive: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
  },
  condBtnDanger: {
    backgroundColor: 'transparent',
  },
  condBtnDangerActive: {
    backgroundColor: '#FEE2E2',
  },
  condTextDanger: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: '500',
  },
  condTextDangerActive: {
    fontSize: 10,
    color: '#B91C1C',
    fontWeight: '700',
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGood: {
    backgroundColor: '#DCFCE7',
  },
  textGood: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 10,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  textWarning: {
    color: '#B45309',
    fontWeight: '700',
    fontSize: 10,
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  textDanger: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 10,
  },
  conditionBadgeText: {
    fontSize: 10,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  boldText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  itemFooter: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 6,
  },
  loanBadgeAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loanTextAvailable: {
    fontSize: 11,
    color: '#EF8354',
    fontWeight: '600',
  },
  loanBadgeRestricted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loanTextRestricted: {
    fontSize: 11,
    color: '#94A3B8',
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
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

