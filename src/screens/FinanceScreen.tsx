import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Share, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useMushola } from '../store/useMusholaStore';
import { formatRupiah, formatShortDateIndo } from '../utils/formatters';
import { CashPocket, Transaction, TransactionType } from '../types';
import { C, R, SP, TYPE } from '../theme/colors';
import { EASE_OUT, Press, Sheet, dur } from '../theme/motion';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Col,
  EmptyState,
  Field,
  Hatch,
  IconTile,
  ListRow,
  PageHeader,
  Row,
  Screen,
  Segmented,
  T,
  useBreakpoint,
} from '../ui/kit';

const NOMINAL_ADDERS = [50000, 100000, 500000, 1000000, 5000000];

const TPA_QUICK_CATEGORIES = ['SPP Santri', 'Honor Guru Pengajar', 'Modul & Buku Iqro', 'Donasi Wisuda', 'Sarana TPA'];

const DKM_QUICK_CATEGORIES = [
  'Infak Jumat',
  'Sedekah Subuh',
  'Honor Khotib',
  'Operasional & Listrik',
  'Pembangunan & Renovasi',
];

/** Nada hijau untuk membedakan kantong (selalu disertai label teks). */
const POCKET_TONES = [C.g900, C.g700, C.g500, C.g300, C.g100];

const PAGE_SIZE = 25;

type Entity = 'DKM' | 'TPA' | 'ALL';
type SubTab = 'TRANSAKSI' | 'LAPORAN';
type TypeFilter = 'ALL' | TransactionType;

const isTpa = (subOrgId: string) => subOrgId === 'org-tpa';

/** "6285777900383" menjadi "0857-7790-0383". */
function formatPhone(raw: string) {
  const local = raw.replace(/^62/, '0').replace(/\D/g, '');
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');
}

function shortNominal(val: number) {
  return val >= 1000000 ? `${val / 1000000} jt` : `${val / 1000} rb`;
}

/* ---------- Komponen lokal ---------- */

/** Pil pilihan kecil (kantong & kategori di form). */
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      hitSlop={4}
      style={[st.chip, active && st.chipActive]}
      hoverStyle={active ? undefined : { backgroundColor: C.g50 }}
    >
      <Text style={[st.chipText, active && st.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Press>
  );
}

/** Konfirmasi singkat yang memudar setelah sekitar 2 detik (DESIGN.md bagian 7). */
function useFlash() {
  const [msg, setMsg] = useState<string | null>(null);
  const opacity = useState(() => new Animated.Value(0))[0];
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(text);
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: dur(150), easing: EASE_OUT, useNativeDriver: false }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: dur(300), useNativeDriver: false }).start(() => setMsg(null));
    }, 2200);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const node = msg ? (
    <Animated.Text style={[st.flash, { opacity }]} accessibilityLiveRegion="polite">
      {msg}
    </Animated.Text>
  ) : null;

  return { show, node };
}

/** Batang pil pemasukan harian; hari tanpa pemasukan = arsir. */
function DailyIncomeChart({ txs, days }: { txs: Transaction[]; days: number }) {
  const grow = useState(() => new Animated.Value(0))[0];

  const data = useMemo(() => {
    const income = txs.filter((t) => t.type === 'INCOME');
    if (income.length === 0) return null;
    const latest = income.reduce((m, t) => (t.date > m ? t.date : m), income[0].date);
    const end = new Date(`${latest}T00:00:00Z`);
    const list: { iso: string; day: number; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setUTCDate(end.getUTCDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const value = income.filter((t) => t.date === iso).reduce((s, t) => s + t.amount, 0);
      list.push({ iso, day: d.getUTCDate(), value });
    }
    const max = Math.max(...list.map((x) => x.value));
    const total = list.reduce((s, x) => s + x.value, 0);
    return { list, max, total, latest, filled: list.filter((x) => x.value > 0).length };
  }, [txs, days]);

  const dataKey = data ? data.list.map((x) => x.value).join(',') : '';
  useEffect(() => {
    grow.setValue(0);
    Animated.timing(grow, { toValue: 1, duration: dur(700), easing: EASE_OUT, useNativeDriver: false }).start();
  }, [dataKey, grow]);

  if (!data) {
    return (
      <EmptyState
        icon="bar-chart-outline"
        title="Belum ada pemasukan tercatat"
        text="Grafik muncul setelah ada transaksi pemasukan di kantong ini. Bendahara bisa mencatat lewat tombol Catat pemasukan."
      />
    );
  }

  const summary = `Total ${formatRupiah(data.total)} pada ${data.filled} dari ${days} hari, sampai ${formatShortDateIndo(data.latest)}.`;

  return (
    <View accessible accessibilityLabel={`Grafik pemasukan per hari. ${summary}`}>
      <T v="small" color={C.inkMuted}>
        {summary}
      </T>
      <View style={st.chartTrack}>
        {data.list.map((d) => {
          const ratio = data.max > 0 ? d.value / data.max : 0;
          const top = d.value > 0 && d.value === data.max;
          return (
            <View key={d.iso} style={st.chartCol}>
              <View style={st.chartBarArea}>
                {d.value > 0 ? (
                  <Animated.View
                    style={[
                      st.chartBar,
                      {
                        backgroundColor: top ? C.g900 : C.g500,
                        height: grow.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${Math.max(8, ratio * 100)}%`],
                        }),
                      },
                    ]}
                  />
                ) : (
                  <Hatch style={st.chartHatch} />
                )}
              </View>
              <Text style={st.chartDay}>{d.day}</Text>
            </View>
          );
        })}
      </View>
      <View style={st.legend}>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: C.g900 }]} />
          <T v="small" color={C.inkMuted}>
            Tertinggi
          </T>
        </View>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: C.g500 }]} />
          <T v="small" color={C.inkMuted}>
            Ada pemasukan
          </T>
        </View>
        <View style={st.legendItem}>
          <Hatch style={st.legendHatch} radius={4} />
          <T v="small" color={C.inkMuted}>
            Tidak ada pemasukan
          </T>
        </View>
      </View>
    </View>
  );
}

/** Bilah proporsi saldo per kantong. */
function PocketShareBar({ pockets }: { pockets: CashPocket[] }) {
  const total = pockets.reduce((s, p) => s + Math.max(0, p.balance), 0);
  if (total <= 0) return <Hatch style={st.shareBar} />;
  return (
    <View style={st.shareBar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pockets.map((p, i) =>
        p.balance > 0 ? (
          <View
            key={p.id}
            style={{ flex: p.balance / total, backgroundColor: POCKET_TONES[i % POCKET_TONES.length] }}
          />
        ) : null
      )}
    </View>
  );
}

/* ---------- Layar ---------- */

export function FinanceScreen() {
  const {
    pockets,
    transactions,
    addTransaction,
    getTotalBalance,
    getDKMBalance,
    getTPABalance,
    currentRole,
    currentUser,
    permissions,
    tpaSummary,
    tpaStaff,
  } = useMushola();
  const { isPhone, isDesktop } = useBreakpoint();
  const flash = useFlash();

  const [entityFilter, setEntityFilter] = useState<Entity>('DKM');
  const [selectedPocketId, setSelectedPocketId] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('TRANSAKSI');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Form
  const [sheetOpen, setSheetOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('INCOME');
  const [formPocketId, setFormPocketId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [errors, setErrors] = useState<{ title?: string; amount?: string; pocket?: string; submit?: string }>({});
  const [saving, setSaving] = useState(false);

  const changeEntity = (e: Entity) => {
    setEntityFilter(e);
    setSelectedPocketId('ALL');
    setVisibleCount(PAGE_SIZE);
  };

  const entityPockets = pockets.filter((p) => {
    if (entityFilter === 'TPA') return isTpa(p.subOrgId);
    if (entityFilter === 'DKM') return !isTpa(p.subOrgId);
    return true;
  });

  const availableFormPockets = pockets.filter((p) => {
    if (currentRole === 'BENDAHARA_SUB') return p.subOrgId !== 'org-dkm';
    if (entityFilter === 'TPA') return isTpa(p.subOrgId);
    if (entityFilter === 'DKM') return !isTpa(p.subOrgId);
    return true;
  });

  // Transaksi dalam lingkup entitas + kantong (dasar grafik & daftar)
  const scopedTransactions = transactions.filter((t) => {
    if (entityFilter === 'TPA' && !isTpa(t.subOrgId)) return false;
    if (entityFilter === 'DKM' && isTpa(t.subOrgId)) return false;
    return selectedPocketId === 'ALL' || t.pocketId === selectedPocketId;
  });

  const q = searchQuery.trim().toLowerCase();
  const filteredTransactions = scopedTransactions.filter((t) => {
    const matchType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (!!t.donorName && t.donorName.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  const selectedPocket = pockets.find((p) => p.id === selectedPocketId);

  const displayBalance =
    selectedPocketId !== 'ALL'
      ? selectedPocket?.balance || 0
      : entityFilter === 'TPA'
        ? getTPABalance()
        : entityFilter === 'DKM'
          ? getDKMBalance()
          : getTotalBalance();

  const totalIncome = filteredTransactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  const scopeLabel =
    selectedPocket?.name ??
    (entityFilter === 'TPA' ? 'Saldo kas otonom TPA' : entityFilter === 'DKM' ? 'Saldo kas DKM' : 'Saldo seluruh kas');
  const entityLabel = entityFilter === 'TPA' ? 'kas TPA' : entityFilter === 'DKM' ? 'kas DKM' : 'seluruh kas';

  /* ----- Form ----- */

  const openForm = (type: TransactionType) => {
    const preferred =
      entityFilter === 'TPA'
        ? type === 'INCOME'
          ? 'pocket-tpa-spp'
          : 'pocket-tpa-operasional'
        : 'pocket-operasional';
    const pocketId =
      (selectedPocketId !== 'ALL' && availableFormPockets.some((p) => p.id === selectedPocketId) && selectedPocketId) ||
      (availableFormPockets.some((p) => p.id === preferred) ? preferred : availableFormPockets[0]?.id) ||
      '';
    setTxType(type);
    setFormPocketId(pocketId);
    setFormCategory(
      entityFilter === 'TPA'
        ? type === 'INCOME'
          ? 'SPP Santri'
          : 'Honor Guru Pengajar'
        : type === 'INCOME'
          ? 'Infak Jumat'
          : 'Operasional & Listrik'
    );
    setErrors({});
    setSheetOpen(true);
  };

  const amountNumber = parseInt(formAmount.replace(/\D/g, ''), 10) || 0;

  const handleSaveTransaction = async () => {
    if (!permissions.canAddTransaction) {
      setErrors({ submit: `Peran ${permissions.roleTitle} tidak punya izin mencatat transaksi kas.` });
      return;
    }
    const next: typeof errors = {};
    if (!formPocketId) next.pocket = 'Pilih kantong kas tujuan.';
    if (!formTitle.trim()) next.title = 'Tulis uraian transaksi, misalnya Kotak infak Jumat.';
    if (amountNumber <= 0) next.amount = 'Nominal harus lebih dari Rp 0.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const targetPocket = pockets.find((p) => p.id === formPocketId);
    const targetTpa = targetPocket ? isTpa(targetPocket.subOrgId) : entityFilter === 'TPA';

    setSaving(true);
    try {
      await addTransaction({
        pocketId: formPocketId,
        subOrgId: targetPocket?.subOrgId || (targetTpa ? 'org-tpa' : 'org-dkm'),
        type: txType,
        amount: amountNumber,
        title: formTitle.trim(),
        category:
          formCategory.trim() ||
          (targetTpa ? (txType === 'INCOME' ? 'SPP Santri' : 'Honor Guru') : txType === 'INCOME' ? 'Infak Kas' : 'Operasional'),
        date: new Date().toISOString().split('T')[0],
        recordedBy: currentUser?.name || permissions.roleTitle,
        notes: formNotes.trim(),
      });
      setFormTitle('');
      setFormAmount('');
      setFormCategory('');
      setFormNotes('');
      setSheetOpen(false);
      flash.show(`${txType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'} ${formatRupiah(amountNumber)} tercatat. Saldo sudah diperbarui.`);
    } catch {
      setErrors({ submit: 'Transaksi belum tersimpan. Periksa koneksi lalu coba simpan lagi.' });
    } finally {
      setSaving(false);
    }
  };

  /* ----- Laporan ----- */

  const reportPockets = entityFilter === 'TPA' ? pockets.filter((p) => isTpa(p.subOrgId)) : pockets.filter((p) => !isTpa(p.subOrgId));
  const reportTotal = reportPockets.reduce((s, p) => s + p.balance, 0);

  const generateFridayReportText = () => {
    const lines = reportPockets
      .map((p, i) => `${i + 1}. ${p.name}\n   • Saldo saat ini: ${formatRupiah(p.balance)}\n   • Alokasi: ${p.description}`)
      .join('\n\n');
    return `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Kaum muslimin jamaah sholat Jumat rahimakumullah, berikut kami laporkan posisi kas Musholla Al Muttaqin pekan ini:
Lokasi: Perumahan Mutiara Puri Harmoni Blok H, Sukamanah, Rajeg, Kab. Tangerang, Banten

${lines}

Total kas DKM: ${formatRupiah(reportTotal)}

Infaq digital QRIS resmi (bebas nominal):
Merchant: FAHRIAJI ANJASTRIVINATA (NMID: ID1026504038674)
(Scan via GoPay, BCA, Livin Mandiri, BNI, BRI, BSI, OVO, Dana)

Kontak layanan DKM & konfirmasi infaq:
• Ustadz Astriyo: 0857-7790-0383
• Ustadz Dicky: 0817-4958-342

Jazakumullahu khairan katsiran kepada seluruh kaum muslimin atas infak, sedekah, dan wakaf yang disalurkan. Semoga menjadi amal jariyah yang berlipat ganda di sisi Allah SWT. Aamiin ya Rabbal 'Alamin.`;
  };

  const generateTPAReportText = () => {
    const lines = reportPockets
      .map((p, i) => `${i + 1}. ${p.name}\n   • Saldo saat ini: ${formatRupiah(p.balance)}\n   • Keterangan: ${p.description}`)
      .join('\n\n');
    const contacts = tpaStaff
      .filter((m) => ['BENDAHARA', 'KEPALA_TPA', 'SEKRETARIS'].includes(m.roleCategory))
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((m) => `• ${m.role}: ${m.name} (${formatPhone(m.phone)})`)
      .join('\n');
    return `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Bapak/Ibu wali santri & dewan takmir yang kami hormati, berikut kami sampaikan laporan kas otonom TPA/TPQ Nurul Ilmi Musholla Al Muttaqin:
Periode: bulan berjalan, ${tpaSummary.totalSantri} santri terdaftar, SPP ${formatRupiah(tpaSummary.sppNominalPerSantri)} per bulan

${lines}

Total kas otonom TPA: ${formatRupiah(reportTotal)}

Kontak administrasi & keuangan TPA:
${contacts}

Terima kasih atas kepercayaan seluruh wali santri. Semoga putra-putri kita menjadi generasi Qur'ani yang sholeh & sholehah. Aamiin.`;
  };

  const reportText = entityFilter === 'TPA' ? generateTPAReportText() : generateFridayReportText();

  const handleCopyReport = async () => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(reportText);
        flash.show('Teks laporan tersalin. Tempel di grup WhatsApp atau naskah pengumuman.');
      } catch {
        flash.show('Browser menolak akses salin. Blok teks laporan lalu salin manual.');
      }
    } else {
      try {
        await Share.share({ message: reportText });
      } catch {
        flash.show('Lembar bagikan tidak terbuka. Coba lagi.');
      }
    }
  };

  /* ----- Render ----- */

  const canAdd = permissions.canAddTransaction;
  const reportName = entityFilter === 'TPA' ? 'Laporan TPA' : 'Warta Jumat';
  const visibleTx = filteredTransactions.slice(0, visibleCount);

  const heroCard = (
    <Card tone="hero" style={st.hero}>
      <View style={st.heroTop}>
        <T v="h3" color={C.onDark} style={{ flex: 1 }}>
          {scopeLabel}
        </T>
        {selectedPocketId !== 'ALL' ? (
          <Button
            compact
            variant="onDarkOutline"
            label="Semua kantong"
            icon="close"
            onPress={() => setSelectedPocketId('ALL')}
            accessibilityLabel="Hapus filter kantong"
          />
        ) : null}
      </View>
      <Text style={isDesktop ? st.heroValue : st.heroValuePhone} numberOfLines={1} adjustsFontSizeToFit>
        {formatRupiah(displayBalance)}
      </Text>
      {entityFilter === 'ALL' && selectedPocketId === 'ALL' ? (
        <T v="small" color={C.onDarkMuted}>
          DKM {formatRupiah(getDKMBalance())} · TPA {formatRupiah(getTPABalance())}
        </T>
      ) : null}
      {entityFilter === 'TPA' ? (
        <T v="small" color={C.onDarkMuted}>
          {tpaSummary.totalSantri} santri aktif · SPP {formatRupiah(tpaSummary.sppNominalPerSantri)} per bulan
        </T>
      ) : null}
      <View style={st.heroSplit}>
        <View style={st.heroSplitItem}>
          <T v="small" color={C.onDarkMuted}>
            Pemasukan tampil
          </T>
          <Text style={st.heroSplitNum}>+{formatRupiah(totalIncome)}</Text>
        </View>
        <View style={st.heroSplitItem}>
          <T v="small" color={C.onDarkMuted}>
            Pengeluaran tampil
          </T>
          <Text style={st.heroSplitNum}>-{formatRupiah(totalExpense)}</Text>
        </View>
      </View>
      <T v="small" color={C.onDarkMuted}>
        Dihitung dari {filteredTransactions.length} transaksi sesuai filter.
      </T>
    </Card>
  );

  const pocketCard = (
    <Card delay={60}>
      <CardHeader
        title="Kantong kas"
        subtitle={`Pembagian saldo ${entityLabel}. Pilih kantong untuk menyaring.`}
      />
      {entityPockets.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="Belum ada kantong kas"
          text="Kantong untuk entitas ini belum dibuat. Ketua DKM bisa menambahkannya di menu Organisasi."
        />
      ) : (
        <>
          <PocketShareBar pockets={entityPockets} />
          <View style={{ marginTop: SP.s }}>
            <ListRow
              leading={<IconTile icon="layers-outline" size={36} tone="neutral" />}
              title={entityFilter === 'TPA' ? 'Semua kas TPA' : entityFilter === 'DKM' ? 'Semua kas DKM' : 'Semua kantong'}
              trailing={selectedPocketId === 'ALL' ? <Badge label="Dipilih" tone="success" /> : undefined}
              onPress={() => setSelectedPocketId('ALL')}
              accessibilityLabel="Tampilkan semua kantong"
            />
            {entityPockets.map((p, i) => (
              <ListRow
                key={p.id}
                last={i === entityPockets.length - 1}
                leading={
                  <View
                    style={[
                      st.swatch,
                      { backgroundColor: POCKET_TONES[i % POCKET_TONES.length] },
                      POCKET_TONES[i % POCKET_TONES.length] === C.g100 && st.swatchLight,
                    ]}
                  />
                }
                title={p.name}
                subtitle={formatRupiah(p.balance)}
                trailing={selectedPocketId === p.id ? <Badge label="Dipilih" tone="success" /> : undefined}
                onPress={() => {
                  setSelectedPocketId(p.id);
                  setVisibleCount(PAGE_SIZE);
                }}
                accessibilityLabel={`Saring transaksi ${p.name}, saldo ${formatRupiah(p.balance)}`}
              />
            ))}
          </View>
        </>
      )}
    </Card>
  );

  const ledgerCard = (
    <Card delay={120}>
      <CardHeader
        title={`Mutasi ${entityLabel}`}
        subtitle={`${filteredTransactions.length} transaksi${selectedPocket ? ` di ${selectedPocket.name}` : ''}`}
      />
      <View style={st.filters}>
        <Field
          label="Cari transaksi"
          value={searchQuery}
          onChangeText={(t) => {
            setSearchQuery(t);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Judul, kategori, atau nama donatur"
          style={{ flexGrow: 1, flexBasis: 220 }}
        />
        <View style={{ justifyContent: 'flex-end' }}>
          <Segmented<TypeFilter>
            label="Jenis transaksi"
            value={typeFilter}
            onChange={(k) => {
              setTypeFilter(k);
              setVisibleCount(PAGE_SIZE);
            }}
            options={[
              { key: 'ALL', label: 'Semua' },
              { key: 'INCOME', label: 'Masuk' },
              { key: 'EXPENSE', label: 'Keluar' },
            ]}
          />
        </View>
      </View>

      {filteredTransactions.length === 0 ? (
        scopedTransactions.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Belum ada transaksi"
            text={
              canAdd
                ? 'Kantong ini belum punya catatan. Catat transaksi pertama lewat tombol Catat pemasukan.'
                : 'Kantong ini belum punya catatan. Bendahara akan mencatat transaksi setelah ada kas masuk atau keluar.'
            }
          />
        ) : (
          <EmptyState
            icon="search-outline"
            title="Tidak ada yang cocok"
            text="Tidak ada transaksi dengan kata kunci dan jenis ini. Ubah kata kunci atau pilih Semua."
            action={
              <Button
                compact
                variant="outline"
                label="Hapus filter"
                onPress={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                }}
              />
            }
          />
        )
      ) : (
        <View>
          {visibleTx.map((tx, idx) => {
            const income = tx.type === 'INCOME';
            const meta = [
              tx.category,
              formatShortDateIndo(tx.date),
              tx.donorName ? `Oleh ${tx.donorName}` : null,
              entityFilter === 'ALL' && isTpa(tx.subOrgId) ? 'TPA' : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <ListRow
                key={tx.id}
                last={idx === visibleTx.length - 1}
                leading={
                  <IconTile icon={income ? 'arrow-down-outline' : 'arrow-up-outline'} size={40} tone={income ? 'green' : 'neutral'} />
                }
                title={tx.title}
                subtitle={tx.notes ? `${meta}\nCatatan: ${tx.notes}` : meta}
                trailing={
                  <View style={st.txRight}>
                    <Text style={[st.txAmount, { color: income ? C.g700 : C.dangerFg }]} numberOfLines={1}>
                      {income ? '+' : '-'}
                      {formatRupiah(tx.amount)}
                    </Text>
                    {!isPhone ? (
                      <T v="small" color={C.inkMuted} numberOfLines={1} style={{ maxWidth: 180, textAlign: 'right' }}>
                        {tx.recordedBy}
                      </T>
                    ) : null}
                  </View>
                }
              />
            );
          })}
          {filteredTransactions.length > visibleCount ? (
            <Button
              variant="ghost"
              label={`Tampilkan ${Math.min(PAGE_SIZE, filteredTransactions.length - visibleCount)} transaksi lagi`}
              onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
              style={{ marginTop: SP.s, alignSelf: 'center' }}
            />
          ) : null}
        </View>
      )}
    </Card>
  );

  const chartCard = (
    <Card delay={180}>
      <CardHeader title={`Pemasukan per hari, ${isPhone ? 7 : 14} hari terakhir tercatat`} subtitle={`Lingkup: ${selectedPocket?.name ?? entityLabel}`} />
      <DailyIncomeChart txs={scopedTransactions} days={isPhone ? 7 : 14} />
    </Card>
  );

  const readOnlyNotice = !canAdd ? (
    <Card tone="sunken" style={st.notice}>
      <IconTile icon="lock-closed-outline" size={40} tone="neutral" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="bodyStrong">Mode baca saja</T>
        <T v="small" color={C.inkMuted}>
          Peran aktif: {permissions.roleTitle}. Pencatatan transaksi hanya untuk bendahara dan ketua DKM.
        </T>
      </View>
    </Card>
  ) : null;

  const tpaNotice =
    entityFilter === 'TPA' ? (
      <Card tone="sunken" style={st.notice}>
        <IconTile icon="school-outline" size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="bodyStrong">Pembukuan otonom TPA Nurul Ilmi</T>
          <T v="small" color={C.inkMuted}>
            Dikelola terpisah oleh bendahara TPA ({tpaSummary.treasurer}) untuk SPP santri, bisyarah asatidz, modul belajar, dan
            tabungan imtihan.
          </T>
        </View>
      </Card>
    ) : null;

  return (
    <Screen>
      <PageHeader
        title="Keuangan"
        subtitle="Kas DKM dan kas otonom TPA, dicatat per kantong."
        actions={
          canAdd ? (
            <>
              <Button
                icon="add"
                label={entityFilter === 'TPA' ? 'Catat pemasukan TPA' : 'Catat pemasukan'}
                onPress={() => openForm('INCOME')}
              />
              <Button
                variant="outline"
                icon="remove"
                label={entityFilter === 'TPA' ? 'Catat pengeluaran TPA' : 'Catat pengeluaran'}
                onPress={() => openForm('EXPENSE')}
              />
            </>
          ) : undefined
        }
      />

      <View style={st.toolbar}>
        <Segmented<Entity>
          label="Entitas kas"
          value={entityFilter}
          onChange={changeEntity}
          options={[
            { key: 'DKM', label: 'Kas DKM' },
            { key: 'TPA', label: 'Kas TPA' },
            { key: 'ALL', label: 'Semua kas' },
          ]}
        />
        <Segmented<SubTab>
          label="Tampilan"
          value={activeSubTab}
          onChange={setActiveSubTab}
          options={[
            { key: 'TRANSAKSI', label: 'Buku kas' },
            { key: 'LAPORAN', label: reportName },
          ]}
        />
      </View>

      {flash.node}
      {readOnlyNotice}
      {tpaNotice}

      {activeSubTab === 'TRANSAKSI' ? (
        isDesktop ? (
          <Row>
            <Col flex={3}>
              {heroCard}
              {ledgerCard}
            </Col>
            <Col flex={1.3}>
              {pocketCard}
              {chartCard}
            </Col>
          </Row>
        ) : (
          <>
            <Row>
              <Col flex={1.2}>{heroCard}</Col>
              <Col flex={1}>{pocketCard}</Col>
            </Row>
            {ledgerCard}
            {chartCard}
          </>
        )
      ) : (
        <Row stackBelow={1000}>
          <Col flex={2}>
            <Card>
              <CardHeader
                title={entityFilter === 'TPA' ? 'Laporan keuangan TPA Nurul Ilmi' : 'Teks warta kas sholat Jumat'}
                subtitle={
                  entityFilter === 'TPA'
                    ? 'Untuk wali santri dan dewan pembina TPA. Saldo diambil dari kantong kas saat ini.'
                    : 'Dibacakan takmir sebelum khutbah Jumat. Saldo diambil dari kantong kas saat ini.'
                }
              />
              {entityFilter === 'ALL' ? (
                <T v="small" color={C.inkMuted} style={{ marginBottom: SP.m }}>
                  Mode Semua kas memakai format warta Jumat untuk kantong DKM. Pilih Kas TPA untuk laporan wali santri.
                </T>
              ) : null}
              <View style={st.reportBox}>
                <Text style={st.reportText} selectable>
                  {reportText}
                </Text>
              </View>
              <Button
                icon={Platform.OS === 'web' ? 'copy-outline' : 'share-outline'}
                label={
                  Platform.OS === 'web'
                    ? entityFilter === 'TPA'
                      ? 'Salin laporan wali santri'
                      : 'Salin teks warta Jumat'
                    : entityFilter === 'TPA'
                      ? 'Bagikan laporan wali santri'
                      : 'Bagikan teks warta Jumat'
                }
                onPress={handleCopyReport}
                style={{ marginTop: SP.l, alignSelf: isPhone ? 'stretch' : 'flex-start' }}
              />
            </Card>
          </Col>
          <Col flex={1}>
            <Card delay={60}>
              <CardHeader title="Saldo dalam laporan" subtitle={`${reportPockets.length} kantong`} />
              {reportPockets.length === 0 ? (
                <EmptyState
                  icon="wallet-outline"
                  title="Belum ada kantong kas"
                  text="Laporan kosong karena belum ada kantong. Ketua DKM bisa menambahkannya di menu Organisasi."
                />
              ) : (
                <>
                  {reportPockets.map((p, i) => (
                    <ListRow
                      key={p.id}
                      leading={
                        <View
                          style={[
                            st.swatch,
                            { backgroundColor: POCKET_TONES[i % POCKET_TONES.length] },
                            POCKET_TONES[i % POCKET_TONES.length] === C.g100 && st.swatchLight,
                          ]}
                        />
                      }
                      title={p.name}
                      trailing={<Text style={st.pocketAmount}>{formatRupiah(p.balance)}</Text>}
                    />
                  ))}
                  <ListRow
                    last
                    title="Total"
                    trailing={<Text style={[st.pocketAmount, { color: C.g700 }]}>{formatRupiah(reportTotal)}</Text>}
                  />
                </>
              )}
            </Card>
          </Col>
        </Row>
      )}

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={txType === 'INCOME' ? 'Catat pemasukan' : 'Catat pengeluaran'}
        subtitle={entityFilter === 'TPA' ? 'Kas otonom TPA Nurul Ilmi' : 'Kas DKM Musholla Al Muttaqin'}
      >
        <View style={st.form}>
          <Segmented<TransactionType>
            label="Jenis transaksi"
            value={txType}
            onChange={setTxType}
            options={[
              { key: 'INCOME', label: 'Pemasukan' },
              { key: 'EXPENSE', label: 'Pengeluaran' },
            ]}
          />

          <View style={{ gap: 6 }}>
            <T v="label">Kantong kas</T>
            {availableFormPockets.length === 0 ? (
              <T v="small" color={C.inkMuted}>
                Tidak ada kantong yang bisa dipakai peran ini. Hubungi ketua DKM.
              </T>
            ) : (
              <View style={st.chipWrap} accessibilityRole="radiogroup">
                {availableFormPockets.map((p) => (
                  <Chip key={p.id} label={p.name} active={formPocketId === p.id} onPress={() => setFormPocketId(p.id)} />
                ))}
              </View>
            )}
            {errors.pocket ? <T v="small" color={C.dangerFg}>{errors.pocket}</T> : null}
          </View>

          <Field
            label="Uraian transaksi"
            value={formTitle}
            onChangeText={setFormTitle}
            placeholder={entityFilter === 'TPA' ? 'Contoh: SPP santri bulan ini' : 'Contoh: Kotak infak Jumat'}
            error={errors.title}
          />

          <View style={{ gap: SP.s }}>
            <Field
              label="Nominal (Rp)"
              value={formAmount}
              onChangeText={(t) => setFormAmount(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              error={errors.amount}
              hint={amountNumber > 0 ? formatRupiah(amountNumber) : 'Ketik angka atau tambah cepat di bawah.'}
            />
            <View style={st.chipWrap}>
              {NOMINAL_ADDERS.map((val) => (
                <Press
                  key={val}
                  onPress={() => setFormAmount(String(amountNumber + val))}
                  accessibilityLabel={`Tambah ${formatRupiah(val)}`}
                  hitSlop={4}
                  style={st.chip}
                  hoverStyle={{ backgroundColor: C.g50 }}
                >
                  <Text style={[st.chipText, { color: C.g700 }]}>+{shortNominal(val)}</Text>
                </Press>
              ))}
              {amountNumber > 0 ? <Button compact variant="ghost" label="Kosongkan" onPress={() => setFormAmount('')} /> : null}
            </View>
          </View>

          <View style={{ gap: SP.s }}>
            <T v="label">Kategori cepat</T>
            <View style={st.chipWrap} accessibilityRole="radiogroup">
              {(entityFilter === 'TPA' ? TPA_QUICK_CATEGORIES : DKM_QUICK_CATEGORIES).map((cat) => (
                <Chip key={cat} label={cat} active={formCategory === cat} onPress={() => setFormCategory(cat)} />
              ))}
            </View>
            <Field label="Kategori" value={formCategory} onChangeText={setFormCategory} placeholder="Atau ketik kategori sendiri" />
          </View>

          <Field
            label="Catatan (opsional)"
            value={formNotes}
            onChangeText={setFormNotes}
            placeholder="Nama saksi atau nomor kuitansi"
            multiline
          />

          {errors.submit ? (
            <T v="small" color={C.dangerFg}>
              {errors.submit}
            </T>
          ) : null}

          <View style={st.formActions}>
            <Button variant="outline" label="Batal" onPress={() => setSheetOpen(false)} style={{ flex: 1 }} />
            <Button
              label={txType === 'INCOME' ? 'Simpan pemasukan' : 'Simpan pengeluaran'}
              onPress={handleSaveTransaction}
              loading={saving}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s, alignItems: 'center' },
  flash: { ...TYPE.bodyStrong, color: C.g700, backgroundColor: C.g50, borderRadius: R.inner, paddingHorizontal: SP.l, paddingVertical: SP.m } as TextStyle,
  notice: { flexDirection: 'row', alignItems: 'center', gap: SP.m, padding: SP.l },

  hero: { gap: SP.s, minHeight: 220 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: SP.s, flexWrap: 'wrap' },
  heroValue: { ...TYPE.display, color: C.onDark, marginTop: SP.xs } as TextStyle,
  heroValuePhone: { ...TYPE.h1, ...TYPE.num, color: C.onDark, marginTop: SP.xs } as TextStyle,
  heroSplit: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.l, marginTop: SP.s },
  heroSplitItem: { flexGrow: 1, flexBasis: 130, gap: 2 },
  heroSplitNum: { ...TYPE.h2, ...TYPE.num, color: C.onDark } as TextStyle,

  shareBar: { flexDirection: 'row', height: 14, borderRadius: R.pill, overflow: 'hidden', gap: 2, backgroundColor: C.card },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  swatchLight: { borderWidth: 1, borderColor: C.g300 },
  pocketAmount: { ...TYPE.bodyStrong, ...TYPE.num, color: C.ink } as TextStyle,

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.m, marginBottom: SP.s },
  txRight: { alignItems: 'flex-end', maxWidth: '45%' },
  txAmount: { ...TYPE.bodyStrong, ...TYPE.num } as TextStyle,

  chartTrack: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: SP.l },
  chartCol: { flex: 1, alignItems: 'center', gap: 6 },
  chartBarArea: { height: 140, width: '100%', maxWidth: 28, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: R.pill },
  chartHatch: { width: '100%', height: '30%' },
  chartDay: { ...TYPE.small, ...TYPE.num, color: C.inkMuted } as TextStyle,
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.l, marginTop: SP.l },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendHatch: { width: 14, height: 14 },

  reportBox: { backgroundColor: C.sunken, borderRadius: R.inner, borderWidth: 1, borderColor: C.line, padding: SP.l },
  reportText: { ...TYPE.body, lineHeight: 22, color: C.ink } as TextStyle,

  form: { gap: SP.l },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s },
  chip: {
    minHeight: 36,
    paddingHorizontal: SP.m + 2,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: C.g700, borderColor: C.g700 },
  chipText: { ...TYPE.label, color: C.ink } as TextStyle,
  chipTextActive: { color: C.onDark },
  formActions: { flexDirection: 'row', gap: SP.s, marginTop: SP.s },
});
