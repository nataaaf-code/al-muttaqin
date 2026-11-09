import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { InventoryItem } from '../types';
import { C, R, SP } from '../theme/colors';
import { NATIVE, Press, Sheet, dur } from '../theme/motion';
import {
  Badge,
  BadgeTone,
  Button,
  Card,
  CardHeader,
  Col,
  EmptyState,
  Field,
  IconName,
  IconTile,
  ListRow,
  PageHeader,
  Row,
  Screen,
  Segmented,
  Stat,
  T,
  useBreakpoint,
} from '../ui/kit';

/* ---------- Data bantu ---------- */

type Category = InventoryItem['category'];
type Condition = InventoryItem['condition'];

const CAT: Record<Category, { label: string; icon: IconName }> = {
  AUDIO_ELEKTRONIK: { label: 'Audio & elektronik', icon: 'mic-outline' },
  PERLENGKAPAN_IBADAH: { label: 'Perlengkapan ibadah', icon: 'book-outline' },
  FASILITAS_UMUM: { label: 'Fasilitas umum & tenda', icon: 'home-outline' },
  PERAWATAN_JENAZAH: { label: 'Perawatan jenazah', icon: 'medkit-outline' },
};
const CAT_ORDER: Category[] = ['AUDIO_ELEKTRONIK', 'PERLENGKAPAN_IBADAH', 'FASILITAS_UMUM', 'PERAWATAN_JENAZAH'];

const COND: Record<Condition, { label: string; tone: BadgeTone }> = {
  BAIK: { label: 'Baik', tone: 'success' },
  RUSAK_RINGAN: { label: 'Rusak ringan', tone: 'warn' },
  PERLU_DIGANTI: { label: 'Perlu diganti', tone: 'danger' },
};
const COND_ORDER: Condition[] = ['BAIK', 'RUSAK_RINGAN', 'PERLU_DIGANTI'];

const loanLabel = (i: InventoryItem) => (i.isAvailableForLoan ? 'Bisa dipinjam warga' : 'Khusus mushola');

/* ---------- Komponen lokal (belum ada di kit) ---------- */

function ChoiceGroup<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <T v="label">{label}</T>
      <View style={st.choiceWrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Press
              key={o.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => onChange(o.key)}
              hitSlop={4}
              style={[st.choice, on && st.choiceOn]}
              hoverStyle={on ? undefined : { backgroundColor: C.g50 }}
            >
              <T v="label" color={on ? C.onDark : C.inkMuted}>
                {o.label}
              </T>
            </Press>
          );
        })}
      </View>
    </View>
  );
}

/** Kotak centang 44px. */
function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Press
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={st.check}
      hoverStyle={{ backgroundColor: C.sunken }}
    >
      <View style={[st.checkBox, checked && st.checkBoxOn]}>
        {checked ? <Ionicons name="checkmark" size={16} color={C.onDark} aria-hidden /> : null}
      </View>
      <T v="body" style={{ flex: 1 }}>
        {label}
      </T>
    </Press>
  );
}

function InfoLine({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={st.info}>
      <Ionicons name={icon} size={18} color={C.inkMuted} aria-hidden />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="small" color={C.inkMuted}>
          {label}
        </T>
        <T v="bodyStrong">{value}</T>
      </View>
    </View>
  );
}

function useNotice<W extends string>() {
  const [msg, setMsg] = useState<{ text: string; where: W } | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback(
    (text: string, where: W) => {
      setMsg({ text, where });
      v.setValue(0);
      Animated.timing(v, { toValue: 1, duration: dur(150), useNativeDriver: NATIVE }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(v, { toValue: 0, duration: dur(300), useNativeDriver: NATIVE }).start(() => setMsg(null));
      }, 2200);
    },
    [v]
  );
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const render = (where: W) =>
    msg && msg.where === where ? (
      <Animated.View style={[st.notice, { opacity: v }]} accessibilityLiveRegion="polite">
        <Ionicons name="checkmark-circle" size={18} color={C.g700} aria-hidden />
        <T v="bodyStrong" color={C.g800} style={{ flex: 1 }}>
          {msg.text}
        </T>
      </Animated.View>
    ) : null;
  return { show, render };
}

function StatGrid({ items }: { items: React.ReactNode[] }) {
  const { isPhone, isDesktop } = useBreakpoint();
  if (isDesktop) return <Row stackBelow={0}>{items}</Row>;
  const [first, ...rest] = items;
  const head = isPhone ? [[first]] : [];
  const pool = isPhone ? rest : items;
  const rows: React.ReactNode[][] = [...head];
  for (let i = 0; i < pool.length; i += 2) rows.push(pool.slice(i, i + 2));
  return (
    <View style={{ gap: isPhone ? SP.m : SP.l }}>
      {rows.map((r, i) => (
        <Row key={i} stackBelow={0} gap={isPhone ? SP.m : SP.l}>
          {r}
        </Row>
      ))}
    </View>
  );
}

/* ---------- Layar ---------- */

type NoticeWhere = 'top' | 'sheet';

export function InventoryScreen() {
  const { inventories, permissions, addInventory, updateInventoryCondition } = useMushola();
  const { isDesktop } = useBreakpoint();
  const canManage = permissions.canManageInventory;
  const notice = useNotice<NoticeWhere>();

  const [catFilter, setCatFilter] = useState<'ALL' | Category>('ALL');
  const [condFilter, setCondFilter] = useState<'ALL' | Condition>('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = inventories.find((i) => i.id === detailId) ?? null;

  /* Form tambah aset */
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('AUDIO_ELEKTRONIK');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('Unit');
  const [condition, setCondition] = useState<Condition>('BAIK');
  const [location, setLocation] = useState('');
  const [forLoan, setForLoan] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setCategory('AUDIO_ELEKTRONIK');
    setQty('1');
    setUnit('Unit');
    setCondition('BAIK');
    setLocation('');
    setForLoan(false);
    setNotes('');
    setErrors({});
  };
  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const saveItem = () => {
    if (!canManage) return;
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama barang wajib diisi.';
    const n = parseInt(qty, 10);
    if (isNaN(n) || n <= 0 || String(n) !== qty.trim()) e.qty = 'Jumlah harus angka bulat, minimal 1.';
    if (!location.trim()) e.location = 'Lokasi penyimpanan wajib diisi.';
    setErrors(e);
    if (Object.keys(e).length) return;

    addInventory({
      name: name.trim(),
      category,
      quantity: n,
      unit: unit.trim() || 'Unit',
      condition,
      location: location.trim(),
      isAvailableForLoan: forLoan,
      notes: notes.trim() || undefined,
    });
    setAddOpen(false);
    resetForm();
    notice.show('Aset baru dicatat di inventaris.', 'top');
  };

  const changeCondition = (item: InventoryItem, c: Condition) => {
    if (!canManage || item.condition === c) return;
    updateInventoryCondition(item.id, c);
    notice.show(`Kondisi ${item.name} diubah menjadi ${COND[c].label.toLowerCase()}.`, 'sheet');
  };

  /* Turunan data */
  const totalUnits = inventories.reduce((s, i) => s + (i.quantity || 0), 0);
  const countCond = (c: Condition) => inventories.filter((i) => i.condition === c).length;
  const countCat = (c: Category) => inventories.filter((i) => i.category === c).length;
  const loanable = inventories.filter((i) => i.isAvailableForLoan);
  const attention = inventories
    .filter((i) => i.condition !== 'BAIK')
    .sort((a, b) => (a.condition === 'PERLU_DIGANTI' ? -1 : 0) - (b.condition === 'PERLU_DIGANTI' ? -1 : 0));

  const filtered = inventories.filter(
    (i) => (catFilter === 'ALL' || i.category === catFilter) && (condFilter === 'ALL' || i.condition === condFilter)
  );

  const itemRow = (i: InventoryItem, idx: number, arr: InventoryItem[], showLoan = true) => (
    <ListRow
      key={i.id}
      leading={<IconTile icon={CAT[i.category]?.icon ?? 'cube-outline'} />}
      title={i.name}
      subtitle={[`${i.quantity} ${i.unit}`, i.location, showLoan ? loanLabel(i) : null].filter(Boolean).join(' · ')}
      trailing={<Badge label={COND[i.condition]?.label ?? i.condition} tone={COND[i.condition]?.tone ?? 'neutral'} />}
      onPress={() => setDetailId(i.id)}
      accessibilityLabel={`Buka rincian ${i.name}, kondisi ${COND[i.condition]?.label ?? i.condition}`}
      last={idx === arr.length - 1}
    />
  );

  return (
    <Screen>
      <PageHeader
        title="Inventaris"
        subtitle="Aset fisik mushola, kondisi kelayakan, dan fasilitas yang bisa dipinjam warga."
        actions={canManage ? <Button icon="add" label="Tambah aset" onPress={openAdd} /> : undefined}
      />
      {notice.render('top')}

      <StatGrid
        items={[
          <Stat key="all" hero label="Jenis aset" value={String(inventories.length)} note={`${totalUnits} unit tercatat`} />,
          <Stat key="ok" delay={50} label="Kondisi baik" value={String(countCond('BAIK'))} note="Jenis aset layak pakai" />,
          <Stat
            key="att"
            delay={100}
            label="Perlu perhatian"
            value={String(attention.length)}
            note={`${countCond('RUSAK_RINGAN')} rusak ringan, ${countCond('PERLU_DIGANTI')} perlu diganti`}
          />,
          <Stat key="loan" delay={150} label="Bisa dipinjam" value={String(loanable.length)} note="Jenis aset untuk warga" />,
        ]}
      />

      <Row>
        <Col flex={isDesktop ? 3 : 1}>
          <Card delay={120}>
            <CardHeader
              title="Katalog aset"
              subtitle={canManage ? 'Ketuk aset untuk melihat rincian dan mengubah kondisi.' : 'Ketuk aset untuk melihat rincian.'}
            />
            <View style={{ gap: SP.m }}>
              <Segmented
                label="Saring kategori aset"
                value={catFilter}
                onChange={setCatFilter}
                options={[
                  { key: 'ALL' as const, label: `Semua (${inventories.length})` },
                  ...CAT_ORDER.map((c) => ({ key: c, label: `${CAT[c].label} (${countCat(c)})` })),
                ]}
              />
              <Segmented
                label="Saring kondisi aset"
                value={condFilter}
                onChange={setCondFilter}
                options={[{ key: 'ALL' as const, label: 'Semua kondisi' }, ...COND_ORDER.map((c) => ({ key: c, label: COND[c].label }))]}
              />
            </View>
            <View style={{ marginTop: SP.m }}>
              {inventories.length === 0 ? (
                <EmptyState
                  icon="cube-outline"
                  title="Belum ada aset tercatat"
                  text={
                    canManage
                      ? 'Inventaris masih kosong. Catat aset pertama lewat tombol Tambah aset.'
                      : 'Inventaris masih kosong. Seksi sarpras akan mencatat aset mushola di sini.'
                  }
                  action={canManage ? <Button icon="add" label="Tambah aset" onPress={openAdd} /> : undefined}
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon="funnel-outline"
                  title="Tidak ada aset yang cocok"
                  text="Tidak ada aset dengan kategori dan kondisi yang dipilih. Hapus saringan untuk melihat semua aset."
                  action={
                    <Button
                      variant="outline"
                      label="Hapus saringan"
                      onPress={() => {
                        setCatFilter('ALL');
                        setCondFilter('ALL');
                      }}
                    />
                  }
                />
              ) : (
                filtered.map((i, idx, arr) => itemRow(i, idx, arr))
              )}
            </View>
          </Card>
        </Col>

        <Col flex={1}>
          <Card delay={160}>
            <CardHeader title="Perlu perhatian" subtitle="Aset rusak ringan atau perlu diganti." />
            {attention.length === 0 ? (
              <EmptyState
                icon="checkmark-done-outline"
                title={inventories.length ? 'Semua aset dalam kondisi baik' : 'Belum ada aset'}
                text={
                  inventories.length
                    ? 'Tidak ada aset yang rusak. Ubah kondisi lewat rincian aset bila ada kerusakan.'
                    : 'Daftar ini terisi setelah aset dicatat dan kondisinya diperiksa.'
                }
              />
            ) : (
              attention.map((i, idx, arr) => itemRow(i, idx, arr, false))
            )}
          </Card>

          <Card tone="sunken" delay={200}>
            <View style={st.info}>
              <Ionicons name={canManage ? 'construct-outline' : 'information-circle-outline'} size={18} color={C.g700} aria-hidden />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="bodyStrong">{canManage ? 'Akses seksi sarpras' : 'Katalog terbuka untuk warga'}</T>
                <T v="small" color={C.inkMuted}>
                  {canManage
                    ? `${loanable.length} jenis aset bisa dipinjam warga. Perbarui kondisi setelah aset dipakai atau dikembalikan.`
                    : `Sebagai ${permissions.roleTitle}, Anda melihat katalog. Untuk meminjam aset berlabel Bisa dipinjam warga, hubungi seksi sarpras. Perubahan data dilakukan oleh seksi sarpras atau ketua DKM.`}
                </T>
              </View>
            </View>
          </Card>
        </Col>
      </Row>

      {/* Rincian aset + ubah kondisi */}
      <Sheet visible={!!detail} onClose={() => setDetailId(null)} title={detail?.name ?? ''} subtitle={detail ? CAT[detail.category]?.label : undefined}>
        {detail ? (
          <View style={{ gap: SP.m }}>
            {notice.render('sheet')}
            <InfoLine icon="cube-outline" label="Jumlah" value={`${detail.quantity} ${detail.unit}`} />
            <InfoLine icon="location-outline" label="Lokasi" value={detail.location} />
            <InfoLine
              icon={detail.isAvailableForLoan ? 'hand-left-outline' : 'lock-closed-outline'}
              label="Peminjaman"
              value={detail.isAvailableForLoan ? 'Bisa dipinjam warga, hubungi seksi sarpras' : 'Khusus untuk kegiatan mushola'}
            />
            {detail.notes ? <InfoLine icon="document-text-outline" label="Catatan" value={detail.notes} /> : null}
            {canManage ? (
              <ChoiceGroup
                label="Kondisi"
                value={detail.condition}
                onChange={(c) => changeCondition(detail, c)}
                options={COND_ORDER.map((c) => ({ key: c, label: COND[c].label }))}
              />
            ) : (
              <View style={{ gap: 6 }}>
                <T v="small" color={C.inkMuted}>
                  Kondisi
                </T>
                <Badge label={COND[detail.condition]?.label ?? detail.condition} tone={COND[detail.condition]?.tone ?? 'neutral'} />
              </View>
            )}
          </View>
        ) : null}
      </Sheet>

      {/* Tambah aset */}
      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} title="Tambah aset" subtitle="Catat barang baru ke inventaris mushola.">
        <View style={st.form}>
          <Field label="Nama barang" value={name} onChangeText={setName} placeholder="Contoh: Mic nirkabel, tenda 4x6" error={errors.name} />
          <ChoiceGroup
            label="Kategori"
            value={category}
            onChange={setCategory}
            options={CAT_ORDER.map((c) => ({ key: c, label: CAT[c].label }))}
          />
          <View style={st.pair}>
            <Field style={{ flex: 1 }} label="Jumlah" value={qty} onChangeText={setQty} keyboardType="number-pad" error={errors.qty} />
            <Field style={{ flex: 1 }} label="Satuan" value={unit} onChangeText={setUnit} placeholder="Unit, set, rol" />
          </View>
          <ChoiceGroup
            label="Kondisi awal"
            value={condition}
            onChange={setCondition}
            options={COND_ORDER.map((c) => ({ key: c, label: COND[c].label }))}
          />
          <Field label="Lokasi penyimpanan" value={location} onChangeText={setLocation} placeholder="Contoh: Gudang belakang" error={errors.location} />
          <Checkbox checked={forLoan} onChange={setForLoan} label="Bisa dipinjam warga untuk keperluan pribadi" />
          <Field label="Catatan" value={notes} onChangeText={setNotes} multiline placeholder="Opsional: merek, spesifikasi, asal donasi" />
          <View style={st.formActions}>
            <Button variant="ghost" label="Batal" onPress={() => setAddOpen(false)} />
            <Button icon="checkmark" label="Simpan aset" onPress={saveItem} />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s },
  choice: {
    minHeight: 36,
    paddingHorizontal: SP.l,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.sunken,
    justifyContent: 'center',
  },
  choiceOn: { backgroundColor: C.g700, borderColor: C.g700 },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.m,
    minHeight: 44,
    paddingVertical: SP.xs,
    borderRadius: R.inner,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.inkMuted,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: C.g700, borderColor: C.g700 },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.m },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.s,
    backgroundColor: C.g50,
    borderWidth: 1,
    borderColor: C.g100,
    borderRadius: R.inner,
    paddingHorizontal: SP.l,
    paddingVertical: SP.m,
    marginBottom: SP.s,
  },
  form: { gap: SP.l },
  pair: { flexDirection: 'row', gap: SP.m },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: SP.s, marginTop: SP.xs },
});
