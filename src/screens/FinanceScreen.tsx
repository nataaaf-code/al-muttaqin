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
import { THEME } from '../theme/colors';

const NOMINAL_ADDERS = [50000, 100000, 500000, 1000000, 5000000];

const TPA_QUICK_CATEGORIES = [
  'SPP Santri',
  'Honor Guru Pengajar',
  'Modul & Buku Iqro',
  'Donasi Wisuda',
  'Sarana TPA',
];

const DKM_QUICK_CATEGORIES = [
  'Infak Jumat',
  'Sedekah Subuh',
  'Honor Khotib',
  'Operasional & Listrik',
  'Pembangunan & Renovasi',
];

export function FinanceScreen() {
  const {
    pockets,
    transactions,
    addTransaction,
    getTotalBalance,
    getDKMBalance,
    getTPABalance,
    currentRole,
    permissions,
  } = useMushola();

  // Entitas Pemisah: DKM vs TPA Otonom vs SEMUA
  const [entityFilter, setEntityFilter] = useState<'DKM' | 'TPA' | 'ALL'>('DKM');
  const [selectedPocketId, setSelectedPocketId] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'TRANSAKSI' | 'LAPORAN'>('TRANSAKSI');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('INCOME');

  // Filter kantong kas berdasarkan entitas aktif
  const entityPockets = pockets.filter((p) => {
    if (entityFilter === 'TPA') return p.subOrgId === 'org-tpa';
    if (entityFilter === 'DKM') return p.subOrgId !== 'org-tpa';
    return true; // ALL
  });

  // Kantong kas yang dapat dipilih di form input
  const availableFormPockets = pockets.filter((p) => {
    if (currentRole === 'BENDAHARA_SUB') {
      return p.subOrgId !== 'org-dkm';
    }
    if (entityFilter === 'TPA') {
      return p.subOrgId === 'org-tpa';
    }
    if (entityFilter === 'DKM') {
      return p.subOrgId !== 'org-tpa';
    }
    return true;
  });

  const defaultPocketId = availableFormPockets[0]?.id || pockets[0]?.id || '';
  const [formPocketId, setFormPocketId] = useState(defaultPocketId);
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCategory, setFormCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Filter transaksi berdasarkan entitas & kriteria
  const filteredTransactions = transactions.filter((t) => {
    // 1. Filter entitas (DKM vs TPA)
    if (entityFilter === 'TPA' && t.subOrgId !== 'org-tpa') return false;
    if (entityFilter === 'DKM' && t.subOrgId === 'org-tpa') return false;

    // 2. Filter pocket
    const matchPocket = selectedPocketId === 'ALL' || t.pocketId === selectedPocketId;

    // 3. Filter tipe
    const matchType = typeFilter === 'ALL' || t.type === typeFilter;

    // 4. Filter search query
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.donorName && t.donorName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchPocket && matchType && matchSearch;
  });

  const selectedPocket = pockets.find((p) => p.id === selectedPocketId);

  // Hitung display saldo dinamis
  const displayBalance =
    selectedPocketId !== 'ALL'
      ? selectedPocket?.balance || 0
      : entityFilter === 'TPA'
      ? getTPABalance()
      : entityFilter === 'DKM'
      ? getDKMBalance()
      : getTotalBalance();

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
    const isTargetTpa = targetPocket?.subOrgId === 'org-tpa';

    let recorderName = 'Pengurus Mushola';
    if (isTargetTpa) {
      recorderName = 'Ustadzah Fitri Handayani (Bendahara TPA)';
    } else if (currentRole === 'SUPER_ADMIN') {
      recorderName = 'Ketua DKM (Super Admin)';
    } else if (currentRole === 'BENDAHARA_DKM' || currentRole === 'BENDAHARA') {
      recorderName = 'H. Rahmat Hidayat (Bendahara DKM)';
    }

    addTransaction({
      pocketId: formPocketId,
      subOrgId: targetPocket?.subOrgId || (isTargetTpa ? 'org-tpa' : 'org-dkm'),
      type: txType,
      amount: formAmount,
      title: formTitle.trim(),
      category: formCategory.trim() || (isTargetTpa ? (txType === 'INCOME' ? 'SPP Santri' : 'Honor Guru') : (txType === 'INCOME' ? 'Infak Kas' : 'Operasional')),
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

  // 1. Teks Laporan DKM Sholat Jumat
  const generateFridayReportText = () => {
    const operasional = pockets.find((p) => p.id === 'pocket-operasional');
    const pembangunan = pockets.find((p) => p.id === 'pocket-pembangunan');
    const yatim = pockets.find((p) => p.id === 'pocket-yatim');

    return `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Kaum muslimin jamaah sholat Jumat rahimakumullah, berikut kami laporkan posisi kas utama Musholla Al Muttaqin pekan ini:
Lokasi: Perumahan Mutiara Puri Harmoni Blok H, Sukamanah, Rajeg, Kab. Tangerang, Banten

1. KAS OPERASIONAL DKM:
   • Saldo Saat Ini: ${formatRupiah(operasional?.balance || 0)}
   • Alokasi: Bisyarah marbot, imam, token listrik, air & operasional peribadatan

2. KAS PEMBANGUNAN & RENOVASI:
   • Saldo Saat Ini: ${formatRupiah(pembangunan?.balance || 0)}
   • Alokasi: Proyek kanopi & tempat wudhu wanita

3. KAS SOSIAL YATIM & DHUAFA:
   • Saldo Saat Ini: ${formatRupiah(yatim?.balance || 0)}
   • Penerima Manfaat: 12 Anak yatim & dhuafa lingkungan sekitar

TOTAL KAS DKM UTAMA: ${formatRupiah(getDKMBalance())}

Infaq Digital QRIS Resmi (Bebas Nominal):
Merchant: FAHRIAJI ANJASTRIVINATA (NMID: ID1026504038674)
(Scan via GoPay, BCA, Livin Mandiri, BNI, BRI, BSI, OVO, Dana)

Kontak Layanan DKM & Konfirmasi Infaq:
• Ustadz Astriyo: 0857-7790-0383
• Ustadz Dicky: 0817-4958-342

Jazakumullahu khairan katsiran kepada seluruh kaum muslimin atas infak, sedekah, dan wakaf yang disalurkan. Semoga menjadi amal jariyah yang berlipat ganda di sisi Allah SWT. Aamiin ya Rabbal 'Alamin.`;
  };

  // 2. Teks Laporan Kas Otonom TPA untuk Wali Santri
  const generateTPAReportText = () => {
    const tpaOperasional = pockets.find((p) => p.id === 'pocket-tpa-operasional');
    const tpaSpp = pockets.find((p) => p.id === 'pocket-tpa-spp');
    const tpaModul = pockets.find((p) => p.id === 'pocket-tpa-modul');
    const tpaKegiatan = pockets.find((p) => p.id === 'pocket-tpa-kegiatan');

    return `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Bapak/Ibu Wali Santri & Dewan Takmir yang kami hormati, berikut kami sampaikan Laporan Kas Otonom TPA / TPQ Nurul Ilmi Musholla Al-Muttaqin:
Periode: Bulan Berjalan • 42 Santri Terdaftar

1. KAS SPP SANTRI & INFAQ PENDIDIKAN:
   • Saldo Saat Ini: ${formatRupiah(tpaSpp?.balance || 0)}
   • Keterangan: Iuran bulanan 42 santri @Rp 35.000 & pendaftaran baru

2. KAS OPERASIONAL & HONOR ASATIDZ TPA:
   • Saldo Saat Ini: ${formatRupiah(tpaOperasional?.balance || 0)}
   • Keterangan: Bisyarah 5 guru pengajar kelas Iqro 1-6 s.d Tahfidz

3. KAS BUKU IQRO & MODUL SANTRI:
   • Saldo Saat Ini: ${formatRupiah(tpaModul?.balance || 0)}
   • Keterangan: Pengadaan buku metode Iqro 1-6 & buku prestasi santri

4. KAS IMTIHAN & WISUDA KHOTMIL QUR'AN:
   • Saldo Saat Ini: ${formatRupiah(tpaKegiatan?.balance || 0)}
   • Keterangan: Tabungan wisuda santri, festival anak sholeh, & rihla

TOTAL KAS OTONOM TPA: ${formatRupiah(getTPABalance())}

Kontak Administrasi & Keuangan TPA:
• Bendahara TPA: Ustadzah Fitri Handayani (0813-1122-3344)
• Kepala Sekolah TPA: Ustadzah Maryam, S.Pd.I (0857-9900-1122)
• Sekretaris Tata Usaha: Ustadzah Siti Aisyah (0812-9988-7766)

Terima kasih atas kepercayaan seluruh wali santri. Semoga putra-putri kita menjadi generasi Qur'ani yang sholeh & sholehah. Aamiin.`;
  };

  const handleCopyReport = () => {
    const text = entityFilter === 'TPA' ? generateTPAReportText() : generateFridayReportText();
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
      {/* 1. ENTITY SELECTOR BAR (DKM vs TPA OTONOM vs SEMUA) */}
      <View style={styles.entitySelectorContainer}>
        <View style={styles.entitySegmentWrap}>
          <TouchableOpacity
            style={[
              styles.entitySegmentBtn,
              entityFilter === 'DKM' && styles.entitySegmentBtnActive,
            ]}
            onPress={() => {
              setEntityFilter('DKM');
              setSelectedPocketId('ALL');
            }}
          >
            <Ionicons
              name="business-outline"
              size={15}
              color={entityFilter === 'DKM' ? THEME.white : THEME.paynesGray}
            />
            <Text
              style={[
                styles.entitySegmentText,
                entityFilter === 'DKM' && styles.entitySegmentTextActive,
              ]}
            >
              Kas DKM Musholla
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.entitySegmentBtn,
              entityFilter === 'TPA' && styles.entitySegmentBtnActiveTpa,
            ]}
            onPress={() => {
              setEntityFilter('TPA');
              setSelectedPocketId('ALL');
            }}
          >
            <Ionicons
              name="school-outline"
              size={15}
              color={entityFilter === 'TPA' ? THEME.white : THEME.paynesGray}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={[
                  styles.entitySegmentText,
                  entityFilter === 'TPA' && styles.entitySegmentTextActive,
                ]}
              >
                Kas Otonom TPA
              </Text>
              <View style={styles.tpaTinyBadge}>
                <Text style={styles.tpaTinyBadgeText}>Mandiri</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.entitySegmentBtn,
              entityFilter === 'ALL' && styles.entitySegmentBtnActive,
            ]}
            onPress={() => {
              setEntityFilter('ALL');
              setSelectedPocketId('ALL');
            }}
          >
            <Ionicons
              name="pie-chart-outline"
              size={15}
              color={entityFilter === 'ALL' ? THEME.white : THEME.paynesGray}
            />
            <Text
              style={[
                styles.entitySegmentText,
                entityFilter === 'ALL' && styles.entitySegmentTextActive,
              ]}
            >
              Semua Kas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. SUB-TABS: BUKU KAS vs WARTA LAPORAN */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'TRANSAKSI' && styles.tabButtonActive]}
          onPress={() => setActiveSubTab('TRANSAKSI')}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeSubTab === 'TRANSAKSI' ? THEME.coral : THEME.paynesGray}
          />
          <Text
            style={[styles.tabButtonText, activeSubTab === 'TRANSAKSI' && styles.tabButtonTextActive]}
          >
            Buku Kas & Mutasi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'LAPORAN' && styles.tabButtonActive]}
          onPress={() => setActiveSubTab('LAPORAN')}
        >
          <Ionicons
            name={entityFilter === 'TPA' ? 'school-outline' : 'megaphone-outline'}
            size={16}
            color={activeSubTab === 'LAPORAN' ? THEME.coral : THEME.paynesGray}
          />
          <Text
            style={[styles.tabButtonText, activeSubTab === 'LAPORAN' && styles.tabButtonTextActive]}
          >
            {entityFilter === 'TPA' ? 'Laporan Kas TPA' : 'Warta Kas Jumat'}
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'TRANSAKSI' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* TPA BANNER EXPLANATION (IF TPA SELECTED) */}
          {entityFilter === 'TPA' && (
            <View style={styles.tpaFinanceNotice}>
              <View style={styles.tpaNoticeTop}>
                <Ionicons name="shield-checkmark" size={18} color={THEME.coral} />
                <Text style={styles.tpaNoticeTitle}>Sistem Pembukuan Otonom TPA Nurul Ilmi</Text>
              </View>
              <Text style={styles.tpaNoticeDesc}>
                Keuangan TPA dikelola terpisah penuh oleh Bendahara TPA (Ustadzah Fitri Handayani) untuk iuran SPP santri, bisyarah asatidz, pengadaan modul belajar, dan tabungan imtihan/wisuda.
              </Text>
            </View>
          )}

          {/* ALL ENTITIES BREAKDOWN CARD (IF ALL SELECTED) */}
          {entityFilter === 'ALL' && (
            <View style={styles.allBreakdownCard}>
              <View style={styles.allBreakdownHeader}>
                <Ionicons name="pie-chart" size={15} color={THEME.coral} />
                <Text style={styles.allBreakdownTitle}>Komposisi Kas Lintas Entitas</Text>
              </View>
              <View style={styles.allBreakdownRibbon}>
                <View style={styles.breakdownSegment}>
                  <Text style={styles.breakdownLabel}>🏛️ DKM Musholla</Text>
                  <Text style={styles.breakdownValue}>{formatRupiah(getDKMBalance())}</Text>
                  <Text style={styles.breakdownSub}>Operasional • Pembangunan • Yatim</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownSegment}>
                  <Text style={styles.breakdownLabel}>📖 Otonom TPA</Text>
                  <Text style={[styles.breakdownValue, { color: THEME.coral }]}>
                    {formatRupiah(getTPABalance())}
                  </Text>
                  <Text style={styles.breakdownSub}>SPP Santri • Honor Guru • Modul</Text>
                </View>
              </View>
            </View>
          )}

          {/* Pocket Filter Carousel */}
          <Text style={styles.filterSectionTitle}>
            {entityFilter === 'TPA' ? 'Kantong Kas Otonom TPA:' : 'Kantong Kas Amanah:'}
          </Text>
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
                {entityFilter === 'TPA' ? 'Semua Kas TPA' : entityFilter === 'DKM' ? 'Semua Kas DKM' : 'Semua Kantong Kas'}
              </Text>
            </TouchableOpacity>

            {entityPockets.map((p) => (
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

          {/* Seamless Hero Balance Surface */}
          <View style={styles.heroBalanceCard}>
            <View style={styles.heroBalanceTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.heroBalanceBadgeRow}>
                  <View style={styles.heroSubOrgIndicator} />
                  <Text style={styles.heroBalanceLabel}>
                    {selectedPocketId === 'ALL'
                      ? entityFilter === 'TPA'
                        ? 'TOTAL SALDO KAS OTONOM TPA'
                        : entityFilter === 'DKM'
                        ? 'TOTAL SALDO KAS UTAMA DKM'
                        : 'SALDO KAS GABUNGAN MUSHOLLA'
                      : selectedPocket?.name.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.heroBalanceAmount}>{formatRupiah(displayBalance)}</Text>
                {entityFilter === 'TPA' && (
                  <Text style={styles.heroBalanceSub}>42 Santri Aktif • SPP Rp 35.000 / Bulan</Text>
                )}
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
                    // auto select appropriate pocket
                    if (entityFilter === 'TPA') {
                      setFormPocketId('pocket-tpa-spp');
                      setFormCategory('SPP Santri');
                    } else {
                      setFormPocketId('pocket-operasional');
                      setFormCategory('Infak Jumat');
                    }
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={18} color={THEME.white} />
                  <Text style={styles.primaryActionBtnText}>
                    {entityFilter === 'TPA' ? 'Catat Pemasukan TPA' : 'Catat Pemasukan'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, styles.expenseActionBtn]}
                  onPress={() => {
                    setTxType('EXPENSE');
                    if (entityFilter === 'TPA') {
                      setFormPocketId('pocket-tpa-operasional');
                      setFormCategory('Honor Guru Pengajar');
                    } else {
                      setFormPocketId('pocket-operasional');
                      setFormCategory('Operasional & Listrik');
                    }
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove-circle" size={18} color={THEME.white} />
                  <Text style={styles.primaryActionBtnText}>
                    {entityFilter === 'TPA' ? 'Catat Pengeluaran TPA' : 'Catat Pengeluaran'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.rbacNoticeCard}>
                <View style={styles.rbacNoticeIconCircle}>
                  <Ionicons name="lock-closed" size={16} color={THEME.paynesGray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rbacNoticeTitle}>Mode Transparansi Kas (Hanya Baca)</Text>
                  <Text style={styles.rbacNoticeText}>
                    Peran aktif:{' '}
                    <Text style={{ fontWeight: '800', color: permissions.roleBadgeColor }}>
                      {permissions.roleTitle}
                    </Text>
                    . Pencatatan transaksi baru dibatasi khusus untuk Bendahara dan DKM.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Search & Type Filter Bar */}
          <View style={styles.filterControlBar}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={THEME.paynesGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari transaksi, SPP, modul..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={THEME.paynesGray}
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
          <View style={styles.ledgerHeaderRow}>
            <Text style={styles.ledgerHeader}>
              Mutasi Transaksi {entityFilter === 'TPA' ? 'Kas TPA' : entityFilter === 'DKM' ? 'Kas DKM' : 'Seluruh Unit'} ({filteredTransactions.length})
            </Text>
            {entityFilter === 'TPA' && (
              <View style={styles.tpaTinyBadge}>
                <Text style={styles.tpaTinyBadgeText}>Otonom</Text>
              </View>
            )}
          </View>

          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={32} color={THEME.paynesGray} />
              <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
              <Text style={styles.emptySubtitle}>Tidak ada transaksi yang cocok dengan filter yang dipilih.</Text>
            </View>
          ) : (
            <View style={styles.unifiedLedgerCanvas}>
              {filteredTransactions.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.ledgerStreamRow,
                    idx === filteredTransactions.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View
                    style={[
                      styles.txIconBubble,
                      { backgroundColor: tx.type === 'INCOME' ? 'rgba(21, 128, 61, 0.12)' : 'rgba(220, 38, 38, 0.12)' },
                    ]}
                  >
                    <Ionicons
                      name={tx.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}
                      size={17}
                      color={tx.type === 'INCOME' ? '#15803D' : '#DC2626'}
                    />
                  </View>

                  <View style={styles.txMainCol}>
                    <Text style={styles.txTitleText}>{tx.title}</Text>
                    <View style={styles.txMetaLine}>
                      <Text style={styles.txCategoryTag}>{tx.category}</Text>
                      {tx.subOrgId === 'org-tpa' && (
                        <View style={styles.tpaMicroBadge}>
                          <Text style={styles.tpaMicroBadgeText}>TPA</Text>
                        </View>
                      )}
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
            </View>
          )}
        </ScrollView>
      ) : (
        /* Tab Laporan / Warta */
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.wartaCard}>
            <View style={styles.wartaTop}>
              <View style={styles.wartaIconCircle}>
                <Ionicons
                  name={entityFilter === 'TPA' ? 'school' : 'document-text'}
                  size={24}
                  color={THEME.coral}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.wartaTitle}>
                  {entityFilter === 'TPA'
                    ? 'Laporan Keuangan TPA Nurul Ilmi'
                    : 'Teks Warta Kas Sholat Jumat'}
                </Text>
                <Text style={styles.wartaSub}>
                  {entityFilter === 'TPA'
                    ? 'Format laporan resmi wali santri & dewan pembina TPA'
                    : 'Format pembacaan resmi takmir sebelum khutbah Jumat'}
                </Text>
              </View>
            </View>

            <View style={styles.wartaTextArea}>
              <Text style={styles.wartaBody}>
                {entityFilter === 'TPA' ? generateTPAReportText() : generateFridayReportText()}
              </Text>
            </View>

            <TouchableOpacity style={styles.copyWartaBtn} onPress={handleCopyReport}>
              <Ionicons
                name={copiedSuccess ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color={THEME.white}
              />
              <Text style={styles.copyWartaBtnText}>
                {copiedSuccess
                  ? 'Tersalin ke Clipboard!'
                  : entityFilter === 'TPA'
                  ? 'Salin Laporan Wali Santri'
                  : 'Salin Teks Warta Jumat'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Modal Input Transaksi dengan Quick Denomination Adder & Quick Category */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons
                    name={txType === 'INCOME' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                    size={22}
                    color={txType === 'INCOME' ? '#10B981' : '#EF4444'}
                  />
                  <Text style={styles.modalTitle}>
                    {txType === 'INCOME' ? 'Catat Pemasukan Kas' : 'Catat Pengeluaran Kas'}
                  </Text>
                </View>
                <Text style={styles.modalSub}>
                  {entityFilter === 'TPA' ? 'Kas Otonom TPA Nurul Ilmi' : 'Kas Utama DKM Musholla'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={THEME.paynesGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }}>
              {/* Pocket Target */}
              <Text style={styles.fieldLabel}>Alokasi Kantong Kas:</Text>
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
                placeholder={
                  entityFilter === 'TPA'
                    ? 'cth: SPP Santri Okt (42 Anak) / Bisyarah Guru'
                    : 'cth: Kotak Infak Jumat / Tagihan Listrik PLN'
                }
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
                    <Text style={styles.adderChipText}>
                      +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000} Rb`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Category Chips */}
              <Text style={styles.fieldLabel}>Kategori Cepat:</Text>
              <View style={styles.quickCategoryRow}>
                {(entityFilter === 'TPA' ? TPA_QUICK_CATEGORIES : DKM_QUICK_CATEGORIES).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.quickCategoryChip,
                      formCategory === cat && styles.quickCategoryChipActive,
                    ]}
                    onPress={() => setFormCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.quickCategoryText,
                        formCategory === cat && styles.quickCategoryTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.inputField, { marginTop: 6 }]}
                placeholder="Ketik kategori manual..."
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
                  { backgroundColor: txType === 'INCOME' ? THEME.coral : '#DC2626' },
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
    backgroundColor: THEME.background,
  },

  // ENTITY SELECTOR
  entitySelectorContainer: {
    backgroundColor: THEME.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: THEME.silverBorder,
  },
  entitySegmentWrap: {
    flexDirection: 'row',
    backgroundColor: THEME.silverLight,
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  entitySegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 20,
  },
  entitySegmentBtnActive: {
    backgroundColor: THEME.gunmetal,
  },
  entitySegmentBtnActiveTpa: {
    backgroundColor: THEME.coral,
  },
  entitySegmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.paynesGray,
  },
  entitySegmentTextActive: {
    color: THEME.white,
  },
  tpaTinyBadge: {
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tpaTinyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.coral,
  },

  // TABS
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderColor: THEME.silverBorder,
    paddingHorizontal: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: THEME.coral,
  },
  tabButtonText: {
    fontSize: 13,
    color: THEME.paynesGray,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: THEME.coral,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // TPA NOTICE
  tpaFinanceNotice: {
    backgroundColor: THEME.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: THEME.coral,
  },
  tpaNoticeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tpaNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  tpaNoticeDesc: {
    fontSize: 11,
    color: THEME.paynesGray,
    lineHeight: 17,
  },

  // ALL BREAKDOWN CARD (SEAMLESS DUAL RIBBON)
  allBreakdownCard: {
    backgroundColor: THEME.white,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  allBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  allBreakdownTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  allBreakdownRibbon: {
    flexDirection: 'row',
    backgroundColor: THEME.silverLight,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  breakdownSegment: {
    flex: 1,
  },
  breakdownDivider: {
    width: 1,
    height: 36,
    backgroundColor: THEME.silverLine,
    marginHorizontal: 12,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.paynesGray,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.gunmetal,
    marginVertical: 2,
  },
  breakdownSub: {
    fontSize: 9.5,
    color: THEME.paynesGray,
  },

  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginBottom: 8,
  },
  pocketFilterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pocketPill: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  pocketPillActive: {
    backgroundColor: THEME.coral,
    borderColor: THEME.coral,
  },
  pocketPillText: {
    fontSize: 12,
    color: THEME.paynesGray,
    fontWeight: '600',
  },
  pocketPillTextActive: {
    color: THEME.white,
    fontWeight: '800',
  },
  heroBalanceCard: {
    backgroundColor: THEME.gunmetal,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: THEME.gunmetal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBalanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroSubOrgIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.coral,
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
    fontSize: 10,
    fontWeight: '800',
    color: THEME.silver,
    letterSpacing: 0.5,
  },
  heroBalanceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.white,
    marginTop: 2,
  },
  heroBalanceSub: {
    fontSize: 11,
    color: THEME.coral,
    fontWeight: '600',
    marginTop: 3,
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
    backgroundColor: THEME.coral,
  },
  expenseActionBtn: {
    backgroundColor: '#DC2626',
  },
  primaryActionBtnText: {
    color: THEME.white,
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
    backgroundColor: THEME.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: THEME.gunmetal,
  },
  typeFilterGroup: {
    flexDirection: 'row',
    backgroundColor: THEME.silverLight,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: THEME.silverLine,
  },
  typeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: THEME.white,
  },
  typeBtnText: {
    fontSize: 11,
    color: THEME.paynesGray,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: THEME.coral,
    fontWeight: '800',
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ledgerHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  unifiedLedgerCanvas: {
    backgroundColor: THEME.white,
    borderRadius: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    marginBottom: 20,
    shadowColor: THEME.gunmetal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ledgerStreamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: THEME.silverLine,
  },
  interactiveTxItem: {
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  txIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txMainCol: {
    flex: 1,
  },
  txTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
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
    color: THEME.coral,
    fontWeight: '700',
  },
  tpaMicroBadge: {
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tpaMicroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.coral,
  },
  dotSeparator: {
    fontSize: 10,
    color: THEME.paynesGray,
  },
  txDateText: {
    fontSize: 11,
    color: THEME.paynesGray,
  },
  txDonorText: {
    fontSize: 11,
    color: THEME.paynesGray,
    fontStyle: 'italic',
  },
  txNotesText: {
    fontSize: 11,
    color: THEME.paynesGray,
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
    color: THEME.paynesGray,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.paynesGray,
    textAlign: 'center',
    marginTop: 4,
  },
  wartaCard: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
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
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wartaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  wartaSub: {
    fontSize: 12,
    color: THEME.paynesGray,
  },
  wartaTextArea: {
    backgroundColor: THEME.silverLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    marginBottom: 14,
  },
  wartaBody: {
    fontSize: 12.5,
    color: THEME.gunmetal,
    lineHeight: 21,
    fontFamily: Platform.select({ web: 'monospace', default: 'normal' }),
  },
  copyWartaBtn: {
    backgroundColor: THEME.coral,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyWartaBtnText: {
    color: THEME.white,
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 66, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: THEME.white,
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
    color: THEME.gunmetal,
  },
  modalSub: {
    fontSize: 11,
    color: THEME.coral,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: THEME.silverLight,
    borderRadius: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gunmetal,
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
    borderColor: THEME.silverBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: THEME.silverLight,
  },
  pocketOptionActive: {
    backgroundColor: THEME.coralSoftBg,
    borderColor: THEME.coral,
  },
  pocketOptionText: {
    fontSize: 11,
    color: THEME.paynesGray,
    fontWeight: '600',
  },
  pocketOptionTextActive: {
    color: THEME.coral,
    fontWeight: '800',
  },
  inputField: {
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: THEME.white,
    color: THEME.gunmetal,
  },
  amountDisplayBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.coralSoftBg,
    borderWidth: 1,
    borderColor: THEME.coralBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  amountDisplayVal: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.coral,
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
    backgroundColor: THEME.silverLight,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  adderChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.coral,
  },
  quickCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  quickCategoryChip: {
    backgroundColor: THEME.silverLight,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  quickCategoryChipActive: {
    backgroundColor: THEME.coralSoftBg,
    borderColor: THEME.coral,
  },
  quickCategoryText: {
    fontSize: 11,
    color: THEME.paynesGray,
    fontWeight: '600',
  },
  quickCategoryTextActive: {
    color: THEME.coral,
    fontWeight: '700',
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
    borderColor: THEME.silverBorder,
    alignItems: 'center',
  },
  btnCancelText: {
    color: THEME.paynesGray,
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
    color: THEME.white,
    fontWeight: '800',
    fontSize: 13,
  },
  rbacNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    marginTop: 10,
  },
  rbacNoticeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.silverLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rbacNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  rbacNoticeText: {
    fontSize: 11,
    color: THEME.paynesGray,
    lineHeight: 16,
    marginTop: 1,
  },
});
