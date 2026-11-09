import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { formatDateIndo } from '../utils/formatters';
import { EventItem } from '../types';
import { C, R, SP } from '../theme/colors';
import { NATIVE, Press, Sheet, dur } from '../theme/motion';
import {
  Avatar,
  Badge,
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

type Category = EventItem['category'];

const CAT: Record<Category, { label: string; icon: IconName }> = {
  KAJIAN_RUTIN: { label: 'Kajian rutin', icon: 'book-outline' },
  KAJIAN_AKBAR: { label: 'Kajian akbar', icon: 'people-outline' },
  SHOLAT_JUMAT: { label: 'Sholat Jumat', icon: 'moon-outline' },
  TPA: { label: 'TPA', icon: 'school-outline' },
  KERJA_BAKTI: { label: 'Kerja bakti', icon: 'construct-outline' },
  PHBI: { label: 'PHBI', icon: 'star-outline' },
};
const CAT_ORDER: Category[] = ['KAJIAN_RUTIN', 'KAJIAN_AKBAR', 'KERJA_BAKTI', 'SHOLAT_JUMAT', 'TPA', 'PHBI'];
/** Filter yang selalu tampil; kategori lain tampil bila ada datanya. */
const CAT_ALWAYS: Category[] = ['KAJIAN_RUTIN', 'KAJIAN_AKBAR', 'KERJA_BAKTI'];

const pad = (n: number) => String(n).padStart(2, '0');
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseLocal(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}
function shortDate(iso: string) {
  const d = parseLocal(iso);
  return d ? d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : iso;
}
const isISODate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !!parseLocal(v);
const isTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/* ---------- Komponen lokal (belum ada di kit) ---------- */

/** Pilihan pil yang membungkus (radio), untuk form di dalam Sheet. */
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

/** Baris info ikon + label + nilai di dalam sheet rincian. */
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

/** Konfirmasi singkat yang memudar setelah sekitar 2 detik (DESIGN.md bagian 7). */
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

/** Kartu ringkasan: HP hero selebar penuh lalu 2 per baris, tablet 2 per baris, desktop 4 sebaris. */
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

type NoticeWhere = 'top' | 'friday';

export function EventsScreen() {
  const { events, addEvent, fridaySchedule, updateFridaySchedule, subOrgs, currentRole, permissions } = useMushola();
  const { isDesktop } = useBreakpoint();
  const notice = useNotice<NoticeWhere>();
  const today = todayISO();

  const [filter, setFilter] = useState<'ALL' | Category>('ALL');
  const [detail, setDetail] = useState<EventItem | null>(null);

  // Sub-organisasi yang boleh dipilih (Bendahara Sub tidak bisa memilih DKM pusat).
  const availableSubOrgs = useMemo(
    () => subOrgs.filter((o) => (currentRole === 'BENDAHARA_SUB' ? o.id !== 'org-dkm' : true)),
    [subOrgs, currentRole]
  );

  /* Form tambah agenda */
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('KAJIAN_RUTIN');
  const [subOrgId, setSubOrgId] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [theme, setTheme] = useState('');
  const [date, setDate] = useState(today);
  const [timeStart, setTimeStart] = useState('05:00');
  const [timeEnd, setTimeEnd] = useState('06:30');
  const [location, setLocation] = useState('Ruang utama Musholla Al Muttaqin');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => {
    if (!availableSubOrgs.some((o) => o.id === subOrgId)) setSubOrgId(availableSubOrgs[0]?.id ?? 'org-dkm');
    setErrors({});
    setAddOpen(true);
  };

  const saveEvent = () => {
    if (!permissions.canAddEvent) return;
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Judul agenda wajib diisi.';
    if (!isISODate(date.trim())) e.date = 'Tulis tanggal dengan format TTTT-BB-HH, contoh 2026-11-20.';
    if (!isTime(timeStart.trim())) e.timeStart = 'Format jam JJ:MM, contoh 05:00.';
    if (!isTime(timeEnd.trim())) e.timeEnd = 'Format jam JJ:MM, contoh 06:30.';
    else if (isTime(timeStart.trim()) && timeEnd.trim() <= timeStart.trim()) e.timeEnd = 'Jam selesai harus setelah jam mulai.';
    if (!location.trim()) e.location = 'Lokasi wajib diisi.';
    setErrors(e);
    if (Object.keys(e).length) return;

    addEvent({
      subOrgId: subOrgId || availableSubOrgs[0]?.id || 'org-dkm',
      title: title.trim(),
      category,
      date: date.trim(),
      timeStart: timeStart.trim(),
      timeEnd: timeEnd.trim(),
      speakerOrOfficer: speaker.trim(),
      theme: theme.trim(),
      location: location.trim(),
      isPublic: true,
    });
    setTitle('');
    setSpeaker('');
    setTheme('');
    setAddOpen(false);
    notice.show('Agenda ditambahkan ke kalender.', 'top');
  };

  /* Form petugas Jumat */
  const [fridayOpen, setFridayOpen] = useState(false);
  const [fKhotib, setFKhotib] = useState('');
  const [fImam, setFImam] = useState('');
  const [fMuadzin, setFMuadzin] = useState('');
  const [fBilal, setFBilal] = useState('');
  const [fTheme, setFTheme] = useState('');
  const [fErrors, setFErrors] = useState<Record<string, string>>({});

  const openFriday = () => {
    setFKhotib(fridaySchedule.khotib);
    setFImam(fridaySchedule.imam);
    setFMuadzin(fridaySchedule.muadzin);
    setFBilal(fridaySchedule.bilal);
    setFTheme(fridaySchedule.theme);
    setFErrors({});
    setFridayOpen(true);
  };

  const saveFriday = () => {
    if (!permissions.canEditFridaySchedule) return;
    const e: Record<string, string> = {};
    if (!fKhotib.trim()) e.khotib = 'Nama khotib wajib diisi.';
    if (!fImam.trim()) e.imam = 'Nama imam wajib diisi.';
    if (!fMuadzin.trim()) e.muadzin = 'Nama muadzin wajib diisi.';
    if (!fBilal.trim()) e.bilal = 'Nama bilal wajib diisi.';
    setFErrors(e);
    if (Object.keys(e).length) return;
    updateFridaySchedule({
      ...fridaySchedule,
      khotib: fKhotib.trim(),
      imam: fImam.trim(),
      muadzin: fMuadzin.trim(),
      bilal: fBilal.trim(),
      theme: fTheme.trim() || fridaySchedule.theme,
    });
    setFridayOpen(false);
    notice.show('Petugas sholat Jumat diperbarui.', 'friday');
  };

  /* Turunan data */
  const upcoming = useMemo(
    () => events.filter((e) => e.date >= today).sort((a, b) => (a.date + a.timeStart).localeCompare(b.date + b.timeStart)),
    [events, today]
  );
  const past = useMemo(
    () => events.filter((e) => e.date < today).sort((a, b) => (b.date + b.timeStart).localeCompare(a.date + a.timeStart)),
    [events, today]
  );
  const match = (e: EventItem) => filter === 'ALL' || e.category === filter;
  const upcomingShown = upcoming.filter(match);
  const pastShown = past.filter(match);

  const countBy = (c: Category) => events.filter((e) => e.category === c).length;
  const kajianCount = countBy('KAJIAN_RUTIN') + countBy('KAJIAN_AKBAR');
  const monthKey = today.slice(0, 7);
  const monthCount = events.filter((e) => e.date.startsWith(monthKey)).length;
  const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const next = upcoming[0];

  const filterOptions = [
    { key: 'ALL' as const, label: `Semua (${events.length})` },
    ...CAT_ORDER.filter((c) => CAT_ALWAYS.includes(c) || countBy(c) > 0).map((c) => ({
      key: c,
      label: `${CAT[c].label} (${countBy(c)})`,
    })),
  ];

  const subOrgName = (id: string) => subOrgs.find((o) => o.id === id)?.name;

  const renderEvent = (e: EventItem, i: number, arr: EventItem[], isPast: boolean) => {
    const meta = [shortDate(e.date), `${e.timeStart}${e.timeEnd ? ` - ${e.timeEnd}` : ""} WIB`, e.speakerOrOfficer].filter(Boolean).join(' · ');
    const badge =
      e.date === today ? (
        <Badge label="Hari ini" tone="success" />
      ) : isPast ? (
        <Badge label="Selesai" tone="neutral" />
      ) : (
        <Badge label={CAT[e.category]?.label ?? 'Agenda'} tone="neutral" />
      );
    return (
      <ListRow
        key={e.id}
        leading={<IconTile icon={CAT[e.category]?.icon ?? 'calendar-outline'} tone={isPast ? 'neutral' : 'green'} />}
        title={e.title}
        subtitle={meta}
        trailing={badge}
        onPress={() => setDetail(e)}
        accessibilityLabel={`Buka rincian ${e.title}, ${formatDateIndo(e.date)}`}
        last={i === arr.length - 1}
      />
    );
  };

  const officers: { role: string; name: string }[] = [
    { role: 'Khotib', name: fridaySchedule.khotib },
    { role: 'Imam', name: fridaySchedule.imam },
    { role: 'Muadzin', name: fridaySchedule.muadzin },
    { role: 'Bilal', name: fridaySchedule.bilal },
  ];

  const fridayCard = (
    <Card delay={160}>
      <CardHeader
        title="Petugas sholat Jumat"
        subtitle={fridaySchedule.date || 'Tanggal belum diatur'}
        action={
          permissions.canEditFridaySchedule ? (
            <Button compact variant="outline" icon="create-outline" label="Ubah" accessibilityLabel="Ubah petugas sholat Jumat" onPress={openFriday} />
          ) : undefined
        }
      />
      {notice.render('friday')}
      {fridaySchedule.theme ? (
        <View style={st.themeBox}>
          <T v="small" color={C.inkMuted}>
            Tema khutbah
          </T>
          <T v="bodyStrong">{fridaySchedule.theme}</T>
        </View>
      ) : null}
      {officers.map((o, i) => (
        <ListRow
          key={o.role}
          leading={<Avatar name={o.name || o.role} size={40} dark={i === 0} />}
          title={o.name || 'Belum ditentukan'}
          subtitle={o.role}
          last={i === officers.length - 1}
        />
      ))}
    </Card>
  );

  const accessCard = !permissions.canAddEvent ? (
    <Card tone="sunken" delay={220}>
      <View style={st.info}>
        <Ionicons name="eye-outline" size={18} color={C.inkMuted} aria-hidden />
        <T v="body" color={C.inkMuted} style={{ flex: 1 }}>
          Anda melihat sebagai {permissions.roleTitle}. Agenda baru dicatat oleh pengurus DKM, sekretaris, atau bendahara unit.
        </T>
      </View>
    </Card>
  ) : null;

  const filterEmpty = upcomingShown.length === 0 && pastShown.length === 0;

  return (
    <Screen>
      <PageHeader
        title="Agenda"
        subtitle="Kalender kajian, kegiatan warga, dan petugas sholat Jumat."
        actions={
          <>
            {permissions.canEditFridaySchedule ? (
              <Button variant="outline" icon="people-outline" label="Atur petugas Jumat" onPress={openFriday} />
            ) : null}
            {permissions.canAddEvent ? <Button icon="add" label="Tambah agenda" onPress={openAdd} /> : null}
          </>
        }
      />
      {notice.render('top')}

      <StatGrid
        items={[
          <Stat
            key="up"
            hero
            label="Agenda mendatang"
            value={String(upcoming.length)}
            note={next ? `Berikutnya: ${next.title}, ${shortDate(next.date)}` : 'Belum ada agenda terjadwal'}
          />,
          <Stat key="kajian" delay={50} label="Kajian" value={String(kajianCount)} note="Kajian rutin dan akbar tercatat" />,
          <Stat key="bakti" delay={100} label="Kerja bakti" value={String(countBy('KERJA_BAKTI'))} note="Kegiatan kerja bakti tercatat" />,
          <Stat key="bulan" delay={150} label="Bulan ini" value={String(monthCount)} note={`Agenda pada ${monthName}`} />,
        ]}
      />

      <Row>
        <Col flex={isDesktop ? 3 : 1}>
          <Card delay={120}>
            <CardHeader title="Kalender kajian & kegiatan" subtitle="Ketuk agenda untuk melihat tema, narasumber, dan lokasi." />
            <Segmented label="Saring kategori agenda" options={filterOptions} value={filter} onChange={setFilter} />
            <View style={{ marginTop: SP.m }}>
              {events.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="Belum ada agenda"
                  text={
                    permissions.canAddEvent
                      ? 'Kalender masih kosong. Catat kajian atau kegiatan pertama lewat tombol Tambah agenda.'
                      : 'Kalender masih kosong. Pengurus DKM akan mengumumkan kajian dan kegiatan di sini.'
                  }
                  action={permissions.canAddEvent ? <Button label="Tambah agenda" icon="add" onPress={openAdd} /> : undefined}
                />
              ) : filterEmpty ? (
                <EmptyState
                  icon="funnel-outline"
                  title="Tidak ada agenda di kategori ini"
                  text="Belum ada agenda dengan kategori yang dipilih. Pilih Semua untuk melihat seluruh kalender."
                  action={<Button variant="outline" label="Tampilkan semua" onPress={() => setFilter('ALL')} />}
                />
              ) : (
                <>
                  <T v="h3" style={st.groupHead}>
                    Mendatang
                  </T>
                  {upcomingShown.length ? (
                    upcomingShown.map((e, i, a) => renderEvent(e, i, a, false))
                  ) : (
                    <T v="body" color={C.inkMuted} style={st.groupEmpty}>
                      Belum ada agenda mendatang di kategori ini.
                    </T>
                  )}
                  {pastShown.length ? (
                    <>
                      <T v="h3" style={[st.groupHead, { marginTop: SP.xl }]}>
                        Sudah lewat
                      </T>
                      {pastShown.map((e, i, a) => renderEvent(e, i, a, true))}
                    </>
                  ) : null}
                </>
              )}
            </View>
          </Card>
        </Col>
        <Col flex={1}>
          {fridayCard}
          {accessCard}
        </Col>
      </Row>

      {/* Rincian agenda */}
      <Sheet
        visible={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ''}
        subtitle={detail ? CAT[detail.category]?.label : undefined}
      >
        {detail ? (
          <View style={{ gap: SP.m }}>
            <InfoLine icon="calendar-outline" label="Tanggal" value={formatDateIndo(detail.date)} />
            <InfoLine icon="time-outline" label="Waktu" value={`${detail.timeStart}${detail.timeEnd ? ` - ${detail.timeEnd}` : ""} WIB`} />
            {detail.speakerOrOfficer ? <InfoLine icon="mic-outline" label="Narasumber" value={detail.speakerOrOfficer} /> : null}
            {detail.theme ? <InfoLine icon="chatbubble-ellipses-outline" label="Tema" value={detail.theme} /> : null}
            <InfoLine icon="location-outline" label="Lokasi" value={detail.location} />
            {subOrgName(detail.subOrgId) ? (
              <InfoLine icon="business-outline" label="Penyelenggara" value={subOrgName(detail.subOrgId) as string} />
            ) : null}
            {detail.notes ? <InfoLine icon="document-text-outline" label="Catatan" value={detail.notes} /> : null}
          </View>
        ) : null}
      </Sheet>

      {/* Tambah agenda */}
      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} title="Tambah agenda" subtitle="Agenda tampil untuk semua warga setelah disimpan.">
        <View style={st.form}>
          <Field label="Judul agenda" value={title} onChangeText={setTitle} placeholder="Contoh: Kajian Ahad subuh" error={errors.title} />
          <ChoiceGroup
            label="Kategori"
            value={category}
            onChange={setCategory}
            options={CAT_ORDER.map((c) => ({ key: c, label: CAT[c].label }))}
          />
          {availableSubOrgs.length > 1 ? (
            <ChoiceGroup
              label="Penyelenggara"
              value={subOrgId}
              onChange={setSubOrgId}
              options={availableSubOrgs.map((o) => ({ key: o.id, label: o.shortName || o.name }))}
            />
          ) : null}
          <Field label="Narasumber atau penceramah" value={speaker} onChangeText={setSpeaker} placeholder="Opsional" />
          <Field label="Tema atau pembahasan" value={theme} onChangeText={setTheme} placeholder="Opsional" />
          <Field label="Tanggal" value={date} onChangeText={setDate} placeholder="TTTT-BB-HH" error={errors.date} hint="Format TTTT-BB-HH" />
          <View style={st.pair}>
            <Field style={{ flex: 1 }} label="Jam mulai" value={timeStart} onChangeText={setTimeStart} placeholder="05:00" error={errors.timeStart} />
            <Field style={{ flex: 1 }} label="Jam selesai" value={timeEnd} onChangeText={setTimeEnd} placeholder="06:30" error={errors.timeEnd} />
          </View>
          <Field label="Lokasi" value={location} onChangeText={setLocation} error={errors.location} />
          <View style={st.formActions}>
            <Button variant="ghost" label="Batal" onPress={() => setAddOpen(false)} />
            <Button icon="checkmark" label="Simpan agenda" onPress={saveEvent} />
          </View>
        </View>
      </Sheet>

      {/* Petugas Jumat */}
      <Sheet
        visible={fridayOpen}
        onClose={() => setFridayOpen(false)}
        title="Atur petugas sholat Jumat"
        subtitle={fridaySchedule.date || undefined}
      >
        <View style={st.form}>
          <Field label="Tema khutbah" value={fTheme} onChangeText={setFTheme} placeholder="Tema khutbah Jumat" />
          <Field label="Khotib" value={fKhotib} onChangeText={setFKhotib} error={fErrors.khotib} />
          <Field label="Imam" value={fImam} onChangeText={setFImam} error={fErrors.imam} />
          <Field label="Muadzin" value={fMuadzin} onChangeText={setFMuadzin} error={fErrors.muadzin} />
          <Field label="Bilal" value={fBilal} onChangeText={setFBilal} error={fErrors.bilal} />
          <View style={st.formActions}>
            <Button variant="ghost" label="Batal" onPress={() => setFridayOpen(false)} />
            <Button icon="checkmark" label="Simpan petugas" onPress={saveFriday} />
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
  themeBox: {
    backgroundColor: C.sunken,
    borderRadius: R.inner,
    padding: SP.m,
    gap: 2,
    marginBottom: SP.xs,
  },
  groupHead: { marginBottom: SP.xs },
  groupEmpty: { paddingVertical: SP.m },
  form: { gap: SP.l },
  pair: { flexDirection: 'row', gap: SP.m },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: SP.s, marginTop: SP.xs },
});
