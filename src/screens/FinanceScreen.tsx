import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { formatRupiah, formatShortDateIndo } from '../utils/formatters';
import { TransactionType } from '../types';

const NOMINAL_ADDERS = [50000, 100000, 500000, 1000000, 5000000];

export function FinanceScreen() {
  const { pockets, transactions, addTransaction, getTotalBalance, currentRole, permissions } = useMushola();
  const [selectedPocketId, setSelectedPocketId] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'TRANSAKSI' | 'LAPORAN_JUMAT'>('TRANSAKSI');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('INCOME');

  // Kantong kas yang dapat dipilih berdasarkan otorisasi peran
  const availableFormPockets = pockets.filter((p) => {
    if (currentRole === 'BENDAHARA_SUB') {
      return p.subOrgId !== 'org-dkm';
    }
    return true;
  });

  const [formPocketId, setFormPocketId] = useState(availableFormPockets[0]?.id || pockets[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCategory, setFormCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const filteredTransactions = transactions.filter((t) => {
    const matchPocket = selectedPocketId === 'ALL' || t.pocketId === selectedPocketId;
    const matchType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.donorName && t.donorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchPocket && matchType && matchSearch;
  });

  const selectedPocket = pockets.find((p) => p.id === selectedPocketId);
  const displayBalance = selectedPocketId === 'ALL' ? getTotalBalance() : selectedPocket?.balance || 0;

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddNominal = (val: number) => {
    setFormAmount((prev) => prev + val);
  };

  const handleResetNominal = () => {
    setFormAmount(0);
  };

  const handleSaveTransaction = () => {
    if (!permissions.canAddTransaction) {
      alertMsg('Akses Ditolak', `Peran ${permissions.roleTitle} tidak memiliki izin mencatat transaksi kas.`);
      return;
    }
    if (!formTitle.trim()) {
      alertMsg('Peringatan', 'Judul transaksi wajib diisi');
      return;
    }
    if (!formAmount || formAmount <= 0) {
      alertMsg('Peringatan', 'Nominal harus lebih dari 0');
      return;
    }

    const targetPocket = pockets.find((p) => p.id === formPocketId);
    const recorderName =
      currentRole === 'SUPER_ADMIN'
        ? 'Ketua DKM (Super Admin)'
        : currentRole === 'BENDAHARA_DKM'
        ? 'Bendahara Utama DKM'
        : currentRole === 'BENDAHARA_SUB'
        ? 'Bendahara Sub-Organisasi'
        : 'Pengurus Mushola';

    addTransaction({
      pocketId: formPocketId,
      subOrgId: targetPocket?.subOrgId || 'org-dkm',
      type: txType,
      amount: formAmount,
      title: formTitle.trim(),
      category: formCategory.trim() || (txType === 'INCOME' ? 'Infak Kas' : 'Operasional'),
      date: new Date().toISOString().split('T')[0],
      recordedBy: recorderName,
      notes: formNotes.trim(),
    });

    setFormTitle('');
    setFormAmount(0);
    setFormCategory('');
    setFormNotes('');
    setModalVisible(false);
    alertMsg('Berhasil', 'Transaksi kas berhasil dicatat dan saldo telah diperbarui!');
  };

  const alertMsg = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const generateFridayReportText = () => {
    const operasional = pockets.find((p) => p.id === 'pocket-operasional');
    const pembangunan = pockets.find((p) => p.id === 'pocket-pembangunan');
    const yatim = pockets.find((p) => p.id === 'pocket-yatim');

    return `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Kaum muslimin jamaah sholat Jumat rahimakumullah, berikut kami laporkan posisi kas Musholla Al Muttaqin pekan ini:
Lokasi: Perumahan Mutiara Puri Harmoni Blok H, Sukamanah, Rajeg, Kab. Tangerang, Banten

1. KAS OPERASIONAL DKM:
   • Saldo Saat Ini: ${formatRupiah(operasional?.balance || 0)}
   • Alokasi: Bisyarah marbot, imam, token listrik, air & operasional peribadatan

2. KAS PEMBANGUNAN & RENOVASI:
   • Saldo Saat Ini: ${formatRupiah(pembangunan?.balance || 0)}
   • Alokasi: Proyek kanopi & tempat wudhu wanita

3. KAS SOSIAL YATIM & DHUAFA:
   • Saldo Saat Ini: ${formatRupiah(yatim?.balance || 0)}
   • Penerima Manfaat: Anak yatim & dhuafa lingkungan sekitar

TOTAL KAS GABUNGAN: ${formatRupiah(getTotalBalance())}

Infaq Digital QRIS Resmi (Bebas Nominal):
Merchant: FAHRIAJI ANJASTRIVINATA (NMID: ID1026504038674)
(Scan via GoPay, BCA, Livin Mandiri, BNI, BRI, BSI, OVO, Dana)

Kontak Layanan DKM & Konfirmasi Infaq:
• Ustadz Astriyo: 0857-7790-0383
• Ustadz Dicky: 0817-4958-342

Jazakumullahu khairan katsiran kepada seluruh kaum muslimin atas infak, sedekah, dan wakaf yang disalurkan. Semoga menjadi amal jariyah yang berlipat ganda di sisi Allah SWT. Aamiin ya Rabbal 'Alamin.`;
  };

  const handleCopyWarta = () => {
    const text = generateFridayReportText();
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } else {
      alertMsg('Teks Laporan', text);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Segment Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'TRANSAKSI' && styles.tabButtonActive]}
          onPress={() => setActiveSubTab('TRANSAKSI')}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeSubTab === 'TRANSAKSI' ? '#047857' : '#64748B'}
          />
          <Text
            style={[styles.tabButtonText, activeSubTab === 'TRANSAKSI' && styles.tabButtonTextActive]}
          >
            Buku Kas & Transaksi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'LAPORAN_JUMAT' && styles.tabButtonActive]}
          onPress={() => setActiveSubTab('LAPORAN_JUMAT')}
        >
          <Ionicons
            name="megaphone-outline"
            size={16}
            color={activeSubTab === 'LAPORAN_JUMAT' ? '#047857' : '#64748B'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeSubTab === 'LAPORAN_JUMAT' && styles.tabButtonTextActive,
            ]}
          >
            Warta Kas Jumat
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'TRANSAKSI' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Pocket Filter Carousel */}
          <Text style={styles.filterSectionTitle}>Kantong Kas Amanah:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pocketFilterRow}>
            <TouchableOpacity
              style={[
                styles.pocketPill,
                selectedPocketId === 'ALL' && styles.pocketPillActive,
              ]}
              onPress={() => setSelectedPocketId('ALL')}
            >
              <Text
                style={[
                  styles.pocketPillText,
                  selectedPocketId === 'ALL' && styles.pocketPillTextActive,
                ]}
              >
                Semua Kantong Kas
              </Text>
            </TouchableOpacity>

            {pockets.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.pocketPill,
                  selectedPocketId === p.id && styles.pocketPillActive,
                ]}
                onPress={() => setSelectedPocketId(p.id)}
              >
                <Text
                  style={[
                    styles.pocketPillText,
                    selectedPocketId === p.id && styles.pocketPillTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Interactive Balance Card */}
          <View style={styles.heroBalanceCard}>
            <View style={styles.heroBalanceTop}>
              <View>
                <Text style={styles.heroBalanceLabel}>
                  {selectedPocketId === 'ALL' ? 'SALDO GABUNGAN' : selectedPocket?.name.toUpperCase()}
                </Text>
                <Text style={styles.heroBalanceAmount}>{formatRupiah(displayBalance)}</Text>
              </View>

              <View style={styles.txStatsCol}>
                <View style={styles.statIncomePill}>
                  <Ionicons name="arrow-down" size={12} color="#15803D" />
                  <Text style={styles.statIncomeText}>+{formatRupiah(totalIncome)}</Text>
                </View>
                <View style={styles.statExpensePill}>
                  <Ionicons name="arrow-up" size={12} color="#B91C1C" />
                  <Text style={styles.statExpenseText}>-{formatRupiah(totalExpense)}</Text>
                </View>
              </View>
            </View>

            {/* Quick Action Buttons or RBAC Restriction Notice */}
            {permissions.canAddTransaction ? (
              <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, styles.incomeActionBtn]}
                  onPress={() => {
                    setTxType('INCOME');
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Catat Pemasukan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, styles.expenseActionBtn]}
                  onPress={() => {
                    setTxType('EXPENSE');
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Catat Pengeluaran</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.rbacNoticeCard}>
                <View style={styles.rbacNoticeIconCircle}>
                  <Ionicons name="lock-closed" size={16} color="#64748B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rbacNoticeTitle}>Mode Transparansi Kas (Hanya Baca)</Text>
                  <Text style={styles.rbacNoticeText}>
                    Peran aktif:{' '}
                    <Text style={{ fontWeight: '800', color: permissions.roleBadgeColor }}>
                      {permissions.roleTitle}
                    </Text>
                    . Pencatatan transaksi baru dibatasi khusus untuk Bendahara dan Ketua DKM.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Search & Type Filter Bar */}
          <View style={styles.filterControlBar}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari transaksi atau donatur..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.typeFilterGroup}>
              {(['ALL', 'INCOME', 'EXPENSE'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, typeFilter === t && styles.typeBtnActive]}
                  onPress={() => setTypeFilter(t)}
                >
                  <Text style={[styles.typeBtnText, typeFilter === t && styles.typeBtnTextActive]}>
                    {t === 'ALL' ? 'Semua' : t === 'INCOME' ? 'Masuk' : 'Keluar'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Transaction Ledger Cards */}
          <Text style={styles.ledgerHeader}>
            Mutasi Transaksi ({filteredTransactions.length})
          </Text>

          {filteredTransactions.map((tx) => (
            <View key={tx.id} style={styles.interactiveTxItem}>
              <View
                style={[
                  styles.txIconBubble,
                  { backgroundColor: tx.type === 'INCOME' ? '#DCFCE7' : '#FEE2E2' },
                ]}
              >
                <Ionicons
                  name={tx.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={tx.type === 'INCOME' ? '#15803D' : '#DC2626'}
                />
              </View>

              <View style={styles.txMainCol}>
                <Text style={styles.txTitleText}>{tx.title}</Text>
                <View style={styles.txMetaLine}>
                  <Text style={styles.txCategoryTag}>{tx.category}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.txDateText}>{formatShortDateIndo(tx.date)}</Text>
                  {tx.donorName ? (
                    <>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Text style={styles.txDonorText}>Oleh: {tx.donorName}</Text>
                    </>
                  ) : null}
                </View>
                {tx.notes ? <Text style={styles.txNotesText}>Catatan: {tx.notes}</Text> : null}
              </View>

              <View style={styles.txRightCol}>
                <Text
                  style={[
                    styles.txAmountDisplay,
                    { color: tx.type === 'INCOME' ? '#15803D' : '#B91C1C' },
                  ]}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatRupiah(tx.amount)}
                </Text>
                <Text style={styles.txAuthor}>{tx.recordedBy}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        /* Tab Laporan Jumat */
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.wartaCard}>
            <View style={styles.wartaTop}>
              <View style={styles.wartaIconCircle}>
                <Ionicons name="document-text" size={24} color="#047857" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.wartaTitle}>Teks Warta Kas Sholat Jumat</Text>
                <Text style={styles.wartaSub}>Format pembacaan resmi takmir sebelum khutbah</Text>
              </View>
            </View>

            <View style={styles.wartaTextArea}>
              <Text style={styles.wartaBody}>{generateFridayReportText()}</Text>
            </View>

            <TouchableOpacity style={styles.copyWartaBtn} onPress={handleCopyWarta}>
              <Ionicons
                name={copiedSuccess ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.copyWartaBtnText}>
                {copiedSuccess ? 'Tersalin ke Clipboard!' : 'Salin Teks Warta Jumat'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Modal Input Transaksi dengan Quick Denomination Adder */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {txType === 'INCOME' ? '📥 Catat Pemasukan Kas' : '📤 Catat Pengeluaran Kas'}
                </Text>
                <Text style={styles.modalSub}>Perbarui mutasi dan saldo amanah</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }}>
              {/* Pocket Target */}
              <Text style={styles.fieldLabel}>
                Alokasi Kantong Kas {currentRole === 'BENDAHARA_SUB' ? '(Khusus Unit Otonom)' : ''}:
              </Text>
              <View style={styles.pocketSelectorRow}>
                {availableFormPockets.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.pocketOption,
                      formPocketId === p.id && styles.pocketOptionActive,
                    ]}
                    onPress={() => setFormPocketId(p.id)}
                  >
                    <Text
                      style={[
                        styles.pocketOptionText,
                        formPocketId === p.id && styles.pocketOptionTextActive,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title Input */}
              <Text style={styles.fieldLabel}>Uraian / Judul Transaksi:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="cth: Kotak Infak Jumat / Tagihan Listrik PLN"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              {/* Amount Display & Quick Adders */}
              <Text style={styles.fieldLabel}>Nominal Rupiah (Rp):</Text>
              <View style={styles.amountDisplayBox}>
                <Text style={styles.amountDisplayVal}>{formatRupiah(formAmount)}</Text>
                {formAmount > 0 && (
                  <TouchableOpacity onPress={handleResetNominal}>
                    <Text style={styles.resetAmountText}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Interactive Adder Chips */}
              <View style={styles.adderChipRow}>
                {NOMINAL_ADDERS.map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={styles.adderChip}
                    onPress={() => handleAddNominal(val)}
                  >
                    <Text style={styles.adderChipText}>+{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000} Rb`}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category */}
              <Text style={styles.fieldLabel}>Kategori:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="cth: Infak Jumat / Token Listrik / Bisyarah"
                value={formCategory}
                onChangeText={setFormCategory}
              />

              {/* Notes */}
              <Text style={styles.fieldLabel}>Catatan Tambahan (Opsional):</Text>
              <TextInput
                style={[styles.inputField, { height: 60 }]}
                placeholder="Keterangan saksi atau nomor nota kuitansi"
                multiline
                value={formNotes}
                onChangeText={setFormNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnSave,
                  { backgroundColor: txType === 'INCOME' ? '#047857' : '#DC2626' },
                ]}
                onPress={handleSaveTransaction}
              >
                <Text style={styles.btnSaveText}>Simpan Transaksi</Text>
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
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#047857',
  },
  tabButtonText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#047857',
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  pocketFilterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pocketPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  pocketPillActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  pocketPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  pocketPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroBalanceCard: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  heroBalanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 10,
  },
  heroBalanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  heroBalanceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  txStatsCol: {
    flexDirection: 'row',
    gap: 6,
  },
  statIncomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.25)',
    borderWidth: 1,
    borderColor: '#4ADE80',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statIncomeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BBF7D0',
  },
  statExpensePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderWidth: 1,
    borderColor: '#F87171',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statExpenseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FECACA',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  incomeActionBtn: {
    backgroundColor: '#059669',
  },
  expenseActionBtn: {
    backgroundColor: '#DC2626',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  filterControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
  },
  typeFilterGroup: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
  },
  typeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  typeBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#047857',
    fontWeight: '800',
  },
  ledgerHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  interactiveTxItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txMainCol: {
    flex: 1,
  },
  txTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  txMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
    flexWrap: 'wrap',
  },
  txCategoryTag: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '700',
  },
  dotSeparator: {
    fontSize: 10,
    color: '#94A3B8',
  },
  txDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  txDonorText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
  txNotesText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txRightCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  txAmountDisplay: {
    fontSize: 13,
    fontWeight: '900',
  },
  txAuthor: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  wartaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wartaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  wartaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wartaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  wartaSub: {
    fontSize: 12,
    color: '#64748B',
  },
  wartaTextArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  wartaBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 22,
    fontFamily: Platform.select({ web: 'monospace', default: 'normal' }),
  },
  copyWartaBtn: {
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyWartaBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  pocketSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  pocketOption: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
  },
  pocketOptionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  pocketOptionText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  pocketOptionTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
  },
  amountDisplayBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  amountDisplayVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#047857',
  },
  resetAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  adderChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  adderChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adderChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  btnSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  rbacNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  rbacNoticeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rbacNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
  },
  rbacNoticeText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 1,
  },
});
