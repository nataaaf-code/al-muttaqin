import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { JamaahResident } from '../types';
import { C, R, SP } from '../theme/colors';
import { NATIVE, Press, Sheet, dur } from '../theme/motion';
import {
  Avatar,
  Badge,
  BadgeTone,
  Button,
  Card,
  CardHeader,
  Col,
  EmptyState,
  Field,
  IconName,
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

type Status = JamaahResident['economicStatus'];

const STATUS: Record<Status, { label: string; long: string; tone: BadgeTone }> = {
  MAMPU: { label: 'Mampu', long: 'Mampu / muzakki', tone: 'neutral' },
  MUSTAHIK: { label: 'Mustahik', long: 'Mustahik ZIS', tone: 'warn' },
  YATIM_DHUAFA: { label: 'Yatim & dhuafa', long: 'Yatim & dhuafa', tone: 'warn' },
};
const STATUS_ORDER: Status[] = ['MAMPU', 'MUSTAHIK', 'YATIM_DHUAFA'];

function maskPhone(raw: string) {
  const clean = (raw || '').replace(/\D/g, '');
  if (!clean) return 'Tidak ada nomor';
  if (clean.length >= 8) return `${clean.slice(0, 4)}-****-${clean.slice(-4)}`;
  return '08**-****-****';
}
const hasPhone = (p: string) => !!p && p.replace(/\D/g, '').length >= 8;

function openWhatsApp(phoneNum: string, name: string) {
  const clean = phoneNum.replace(/\D/g, '');
  const wa = clean.startsWith('0') ? `62${clean.slice(1)}` : clean;
  const url = `https://wa.me/${wa}?text=${encodeURIComponent(`Assalamu'alaikum Bapak/Ibu ${name}`)}`;
  if (Platform.OS === 'web') window.open(url, '_blank');
  else Linking.openURL(url).catch(() => {});
}

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

type Suggestion = { id: string; name: string; content: string; date: string };
type NoticeWhere = 'top' | 'suggest';

export function JamaahScreen() {
  const { jamaahList, permissions, addJamaah } = useMushola();
  const { isDesktop } = useBreakpoint();
  const canManage = permissions.canManageJamaah;
  const notice = useNotice<NoticeWhere>();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | Status>('ALL');
  const [rt, setRt] = useState<string>('ALL');
  const [detail, setDetail] = useState<JamaahResident | null>(null);

  /* Form tambah warga */
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [address, setAddress] = useState('');
  const [members, setMembers] = useState('');
  const [phone, setPhone] = useState('');
  const [eco, setEco] = useState<Status>('MAMPU');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setRtRw('');
    setAddress('');
    setMembers('');
    setPhone('');
    setEco('MAMPU');
    setNotes('');
    setErrors({});
  };

  const saveResident = () => {
    if (!canManage) return;
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama kepala keluarga wajib diisi.';
    if (!rtRw.trim()) e.rtRw = 'RT/RW wajib diisi, contoh RT 04 / RW 08.';
    if (!address.trim()) e.address = 'Alamat atau blok rumah wajib diisi.';
    const count = parseInt(members, 10);
    if (isNaN(count) || count < 1) e.members = 'Isi jumlah anggota keluarga, minimal 1.';
    if (phone.trim() && !hasPhone(phone)) e.phone = 'Nomor HP minimal 8 digit, atau kosongkan.';
    setErrors(e);
    if (Object.keys(e).length) return;

    addJamaah({
      headOfFamily: name.trim(),
      rtRw: rtRw.trim(),
      address: address.trim(),
      memberCount: count,
      phone: phone.trim() || '-',
      economicStatus: eco,
      notes: notes.trim() || undefined,
    });
    setAddOpen(false);
    resetForm();
    notice.show('Data warga ditambahkan ke direktori.', 'top');
  };

  /* Kotak saran (tersimpan selama sesi; belum ada penyimpanan di store) */
  const [sName, setSName] = useState('');
  const [sContent, setSContent] = useState('');
  const [sError, setSError] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const sendSuggestion = () => {
    if (!sContent.trim()) {
      setSError('Tulis isi saran atau aspirasi terlebih dahulu.');
      return;
    }
    setSError(undefined);
    setSuggestions((prev) => [
      {
        id: `sug-${Date.now()}`,
        name: sName.trim() || 'Hamba Allah (anonim)',
        content: sContent.trim(),
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      },
      ...prev,
    ]);
    setSName('');
    setSContent('');
    notice.show('Terima kasih, aspirasi disampaikan ke pengurus DKM.', 'suggest');
  };

  /* Turunan data */
  const rtList = useMemo(
    () => Array.from(new Set(jamaahList.map((j) => j.rtRw.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id')),
    [jamaahList]
  );
  const totalJiwa = jamaahList.reduce((s, j) => s + (j.memberCount || 0), 0);
  const countStatus = (k: Status) => jamaahList.filter((j) => j.economicStatus === k).length;

  const q = query.trim().toLowerCase();
  const filtered = jamaahList.filter((j) => {
    const okStatus = !canManage || status === 'ALL' || j.economicStatus === status;
    const okRt = rt === 'ALL' || j.rtRw.trim() === rt;
    const okQuery =
      !q || j.headOfFamily.toLowerCase().includes(q) || j.rtRw.toLowerCase().includes(q) || j.address.toLowerCase().includes(q);
    return okStatus && okRt && okQuery;
  });
  const groups = useMemo(() => {
    const map = new Map<string, JamaahResident[]>();
    filtered.forEach((j) => {
      const k = j.rtRw.trim() || 'RT/RW belum diisi';
      map.set(k, [...(map.get(k) ?? []), j]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [filtered]);

  const filtersActive = !!q || rt !== 'ALL' || (canManage && status !== 'ALL');
  const clearFilters = () => {
    setQuery('');
    setRt('ALL');
    setStatus('ALL');
  };

  const statItems = canManage
    ? [
        <Stat key="kk" hero label="Kepala keluarga" value={String(jamaahList.length)} note={`${totalJiwa} jiwa tercatat`} />,
        <Stat key="mus" delay={50} label="Mustahik ZIS" value={String(countStatus('MUSTAHIK'))} note="Penerima zakat terdata" />,
        <Stat key="yat" delay={100} label="Yatim & dhuafa" value={String(countStatus('YATIM_DHUAFA'))} note="Prioritas santunan" />,
        <Stat key="rt" delay={150} label="RT tercatat" value={String(rtList.length)} note="Wilayah dalam direktori" />,
      ]
    : [
        <Stat key="kk" hero label="Kepala keluarga" value={String(jamaahList.length)} note="Warga terdaftar di direktori" />,
        <Stat key="jiwa" delay={50} label="Jiwa tercatat" value={String(totalJiwa)} note="Jumlah anggota keluarga" />,
        <Stat key="rt" delay={100} label="RT tercatat" value={String(rtList.length)} note="Wilayah dalam direktori" />,
        <Stat
          key="avg"
          delay={150}
          label="Rata-rata keluarga"
          value={jamaahList.length ? (totalJiwa / jamaahList.length).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '0'}
          note="Jiwa per kepala keluarga"
        />,
      ];

  return (
    <Screen>
      <PageHeader
        title="Jamaah"
        subtitle="Direktori warga per RT/RW untuk penyaluran zakat, santunan, dan silaturahmi."
        actions={
          canManage ? (
            <Button
              icon="person-add-outline"
              label="Tambah warga"
              onPress={() => {
                resetForm();
                setAddOpen(true);
              }}
            />
          ) : undefined
        }
      />
      {notice.render('top')}

      <StatGrid items={statItems} />

      <Row>
        <Col flex={isDesktop ? 3 : 1}>
          <Card delay={120}>
            <CardHeader
              title="Daftar kepala keluarga"
              subtitle={`${filtered.length} dari ${jamaahList.length} keluarga ditampilkan`}
            />
            <View style={{ gap: SP.m }}>
              <Field label="Cari warga" value={query} onChangeText={setQuery} placeholder="Nama, RT, atau alamat" />
              {canManage ? (
                <Segmented
                  label="Saring kategori sosial"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { key: 'ALL' as const, label: 'Semua kategori' },
                    ...STATUS_ORDER.map((k) => ({ key: k, label: `${STATUS[k].long} (${countStatus(k)})` })),
                  ]}
                />
              ) : null}
              {rtList.length > 1 ? (
                <Segmented
                  label="Saring RT/RW"
                  value={rt}
                  onChange={setRt}
                  options={[{ key: 'ALL', label: 'Semua RT' }, ...rtList.map((r) => ({ key: r, label: r }))]}
                />
              ) : null}
            </View>

            <View style={{ marginTop: SP.m }}>
              {jamaahList.length === 0 ? (
                <EmptyState
                  icon="people-outline"
                  title="Direktori masih kosong"
                  text={
                    canManage
                      ? 'Belum ada data warga. Tambahkan kepala keluarga pertama lewat tombol Tambah warga.'
                      : 'Belum ada data warga. Pengurus DKM akan mengisi direktori setelah pendataan.'
                  }
                  action={
                    canManage ? (
                      <Button
                        icon="person-add-outline"
                        label="Tambah warga"
                        onPress={() => {
                          resetForm();
                          setAddOpen(true);
                        }}
                      />
                    ) : undefined
                  }
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon="search-outline"
                  title="Tidak ada warga yang cocok"
                  text="Pencarian atau saringan tidak menemukan keluarga. Ubah kata kunci atau hapus saringan."
                  action={filtersActive ? <Button variant="outline" label="Hapus saringan" onPress={clearFilters} /> : undefined}
                />
              ) : (
                groups.map(([rtKey, list], gi) => (
                  <View key={rtKey} style={gi > 0 ? { marginTop: SP.xl } : undefined}>
                    <View style={st.groupHead}>
                      <T v="h3">{rtKey}</T>
                      <T v="small" color={C.inkMuted}>
                        {list.length} keluarga
                      </T>
                    </View>
                    {list.map((j, i) => {
                      const phoneText = canManage ? (j.phone && j.phone !== '-' ? j.phone : 'Tidak ada nomor') : maskPhone(j.phone);
                      return (
                        <ListRow
                          key={j.id}
                          leading={<Avatar name={j.headOfFamily} />}
                          title={j.headOfFamily}
                          subtitle={`${j.address} · ${j.memberCount} jiwa · ${phoneText}`}
                          trailing={
                            canManage ? (
                              <Badge label={STATUS[j.economicStatus]?.label ?? 'Terdaftar'} tone={STATUS[j.economicStatus]?.tone ?? 'neutral'} />
                            ) : (
                              <Badge label="Terdaftar" tone="success" />
                            )
                          }
                          onPress={() => setDetail(j)}
                          accessibilityLabel={`Buka rincian keluarga ${j.headOfFamily}`}
                          last={i === list.length - 1}
                        />
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          </Card>
        </Col>

        <Col flex={1}>
          <Card tone="sunken" delay={160}>
            <View style={st.info}>
              <Ionicons name={canManage ? 'lock-open-outline' : 'shield-checkmark-outline'} size={18} color={C.g700} aria-hidden />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="bodyStrong">{canManage ? 'Akses pengurus' : 'Privasi warga dilindungi'}</T>
                <T v="small" color={C.inkMuted}>
                  {canManage
                    ? 'Nomor kontak lengkap, kategori sosial, dan catatan takmir tampil untuk penyaluran santunan. Jaga kerahasiaannya.'
                    : `Sebagai ${permissions.roleTitle}, nomor telepon disamarkan dan kategori sosial serta catatan takmir hanya terlihat oleh pengurus.`}
                </T>
              </View>
            </View>
          </Card>

          <Card delay={200}>
            <CardHeader title="Kotak saran" subtitle="Kritik, saran, atau usulan kegiatan untuk pengurus DKM." />
            {notice.render('suggest')}
            <View style={{ gap: SP.m }}>
              <Field label="Nama" value={sName} onChangeText={setSName} placeholder="Kosongkan untuk anonim" />
              <Field
                label="Isi aspirasi"
                value={sContent}
                onChangeText={(t) => {
                  setSContent(t);
                  if (sError) setSError(undefined);
                }}
                placeholder="Usulan kajian, kebersihan, atau fasilitas"
                multiline
                error={sError}
              />
              <Button icon="paper-plane-outline" label="Kirim aspirasi" onPress={sendSuggestion} />
            </View>
            <T v="h3" style={{ marginTop: SP.xl, marginBottom: SP.xs }}>
              Terkirim dari perangkat ini
            </T>
            {suggestions.length === 0 ? (
              <EmptyState
                icon="chatbubbles-outline"
                title="Belum ada aspirasi"
                text="Aspirasi yang Anda kirim pada sesi ini tampil di sini. Tulis lewat formulir di atas."
              />
            ) : (
              suggestions.map((s, i) => (
                <ListRow
                  key={s.id}
                  leading={<Avatar name={s.name} size={36} />}
                  title={s.name}
                  subtitle={`${s.date} · ${s.content}`}
                  last={i === suggestions.length - 1}
                />
              ))
            )}
          </Card>
        </Col>
      </Row>

      {/* Rincian warga */}
      <Sheet visible={!!detail} onClose={() => setDetail(null)} title={detail?.headOfFamily ?? ''} subtitle={detail?.rtRw}>
        {detail ? (
          <View style={{ gap: SP.m }}>
            <InfoLine icon="home-outline" label="Alamat" value={`${detail.address} (${detail.rtRw})`} />
            <InfoLine icon="people-outline" label="Anggota keluarga" value={`${detail.memberCount} jiwa`} />
            <InfoLine
              icon="call-outline"
              label="Nomor HP"
              value={canManage ? (detail.phone && detail.phone !== '-' ? detail.phone : 'Tidak ada nomor') : maskPhone(detail.phone)}
            />
            {canManage ? (
              <>
                <InfoLine icon="pricetag-outline" label="Kategori sosial" value={STATUS[detail.economicStatus]?.long ?? '-'} />
                {detail.notes ? <InfoLine icon="bookmark-outline" label="Catatan takmir" value={detail.notes} /> : null}
                {hasPhone(detail.phone) ? (
                  <Button
                    icon="logo-whatsapp"
                    variant="outline"
                    label="Hubungi lewat WhatsApp"
                    onPress={() => openWhatsApp(detail.phone, detail.headOfFamily)}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}
      </Sheet>

      {/* Tambah warga */}
      <Sheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah warga"
        subtitle="Data kepala keluarga untuk direktori DKM."
      >
        <View style={st.form}>
          <Field label="Nama kepala keluarga" value={name} onChangeText={setName} placeholder="Nama lengkap" error={errors.name} />
          <View style={st.pair}>
            <Field style={{ flex: 1 }} label="RT/RW" value={rtRw} onChangeText={setRtRw} placeholder="RT 04 / RW 08" error={errors.rtRw} />
            <Field
              style={{ flex: 1 }}
              label="Jumlah jiwa"
              value={members}
              onChangeText={setMembers}
              keyboardType="number-pad"
              placeholder="Contoh 4"
              error={errors.members}
            />
          </View>
          <Field label="Alamat atau blok rumah" value={address} onChangeText={setAddress} placeholder="Blok H No. 12" error={errors.address} />
          <Field
            label="Nomor HP atau WhatsApp"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Opsional"
            error={errors.phone}
          />
          <ChoiceGroup
            label="Kategori sosial"
            value={eco}
            onChange={setEco}
            options={STATUS_ORDER.map((k) => ({ key: k, label: STATUS[k].long }))}
          />
          <Field
            label="Catatan takmir"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Opsional, misalnya kebutuhan santunan"
            hint="Hanya terlihat oleh pengurus."
          />
          <View style={st.formActions}>
            <Button variant="ghost" label="Batal" onPress={() => setAddOpen(false)} />
            <Button icon="checkmark" label="Simpan warga" onPress={saveResident} />
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
  groupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: SP.s, marginBottom: SP.xs },
  form: { gap: SP.l },
  pair: { flexDirection: 'row', gap: SP.m },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: SP.s, marginTop: SP.xs },
});
