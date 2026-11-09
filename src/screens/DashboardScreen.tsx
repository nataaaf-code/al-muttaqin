import React, { useEffect, useState } from 'react';
import { Animated, Platform, Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, Path, Pattern } from 'react-native-svg';
import { useMushola } from '../store/useMusholaStore';
import { formatDateIndo, formatRupiah, getEstimatedHijriDate } from '../utils/formatters';
import { POPULAR_CITIES } from '../services/prayerService';
import { DonationQRISModal } from '../components/DonationQRISModal';
import { MUSHOLA_INFO } from '../store/mockData';
import { EventItem } from '../types';
import { C, R, SP, TYPE } from '../theme/colors';
import { EASE_OUT, NATIVE, Press, Sheet, dur } from '../theme/motion';
import {
  ArrowButton,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Col,
  EmptyState,
  Hatch,
  IconButton,
  IconName,
  IconTile,
  ListRow,
  PageHeader,
  Row,
  Screen,
  Stat,
  useBreakpoint,
} from '../ui/kit';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

const DAY = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const CATEGORY: Record<EventItem['category'], { label: string; icon: IconName }> = {
  KAJIAN_AKBAR: { label: 'Kajian akbar', icon: 'mic-outline' },
  KAJIAN_RUTIN: { label: 'Kajian rutin', icon: 'book-outline' },
  SHOLAT_JUMAT: { label: 'Sholat Jumat', icon: 'people-outline' },
  TPA: { label: 'TPA', icon: 'school-outline' },
  KERJA_BAKTI: { label: 'Kerja bakti', icon: 'hammer-outline' },
  PHBI: { label: 'PHBI', icon: 'calendar-outline' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shortRp = (n: number) =>
  n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1).replace('.', ',').replace(',0', '')} jt` : n >= 1e3 ? `Rp ${Math.round(n / 1e3)} rb` : `Rp ${n}`;

export function DashboardScreen({ onNavigateTab }: DashboardProps) {
  const {
    prayerData,
    pockets,
    transactions,
    events,
    inventories,
    jamaahList,
    fridaySchedule,
    setIsSignageMode,
    currentUser,
    isLoggedIn,
    selectedCityId,
    setSelectedCityId,
    isPrayerLoading,
    refreshPrayerSchedule,
  } = useMushola();
  const { isPhone, isDesktop } = useBreakpoint();
  const [qrisVisible, setQrisVisible] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const today = new Date();
  const todayIso = isoDay(today);

  /* ---------- Angka ringkasan (semua dari store) ---------- */
  const totalBalance = pockets.reduce((s, p) => s + p.balance, 0);

  const incomes = transactions.filter((t) => t.type === 'INCOME');
  const lastIncomeDate = incomes.reduce((m, t) => (t.date > m ? t.date : m), '');
  const lastMonthKey = lastIncomeDate.slice(0, 7);
  const monthIncome = incomes.filter((t) => t.date.startsWith(lastMonthKey)).reduce((s, t) => s + t.amount, 0);

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sortedEvents.filter((e) => e.date >= todayIso);
  const mustahik = jamaahList.filter((j) => j.economicStatus !== 'MAMPU').length;
  const needFix = inventories.filter((i) => i.condition !== 'BAIK').length;

  /* ---------- Grafik pemasukan 7 hari terakhir yang tercatat ---------- */
  const chart = (() => {
    if (!lastIncomeDate) return null;
    const end = new Date(`${lastIncomeDate}T00:00:00`);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (6 - i));
      const key = isoDay(d);
      return { key, label: DAY[d.getDay()], total: incomes.filter((t) => t.date === key).reduce((s, t) => s + t.amount, 0) };
    });
    const max = Math.max(...days.map((d) => d.total));
    return { days, max, end };
  })();

  const grow = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: dur(700), delay: dur(200), easing: EASE_OUT, useNativeDriver: false }).start();
  }, [grow]);

  /* ---------- Bagikan jadwal Jumat ---------- */
  const noteOpacity = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!shareNote) return;
    noteOpacity.setValue(1);
    Animated.timing(noteOpacity, { toValue: 0, duration: dur(400), delay: 2200, useNativeDriver: NATIVE }).start(() => setShareNote(''));
  }, [shareNote, noteOpacity]);

  const shareFriday = async () => {
    const f = fridaySchedule;
    const text =
      `Jadwal Sholat Jumat, ${MUSHOLA_INFO.name}\n${f.date}\nTema: "${f.theme}"\n\n` +
      `Khotib: ${f.khotib}\nImam: ${f.imam}\nMuadzin: ${f.muadzin}\nBilal: ${f.bilal}\n\n${MUSHOLA_INFO.address}`;
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareNote('Teks jadwal tersalin. Tempel di grup WhatsApp warga.');
      } else {
        await Share.share({ message: text });
      }
    } catch {
      setShareNote('Gagal menyalin. Izinkan akses clipboard lalu coba lagi.');
    }
  };

  const next = prayerData.nextPrayer;
  const nextName = next.name.replace(' (Besok)', '');
  const isTomorrow = next.name.includes('Besok');

  /* ---------- Kartu ---------- */
  const statCards = [
    <Stat
      key="kas"
      hero
      compact
      delay={0}
      label="Total kas"
      value={formatRupiah(totalBalance)}
      note={
        lastMonthKey
          ? `Pemasukan ${MONTH_LONG[Number(lastMonthKey.slice(5)) - 1]}: ${formatRupiah(monthIncome)}`
          : `${pockets.length} kantong kas`
      }
      onOpen={() => onNavigateTab('finance')}
    />,
    <Stat
      key="agenda"
      compact={!isDesktop}
      delay={50}
      label="Agenda mendatang"
      value={String(upcoming.length)}
      note={upcoming.length ? `Terdekat ${formatShort(upcoming[0].date)}` : 'Belum ada agenda setelah hari ini'}
      onOpen={() => onNavigateTab('events')}
    />,
    <Stat
      key="warga"
      compact={!isDesktop}
      delay={100}
      label="Keluarga terdata"
      value={String(jamaahList.length)}
      note={`${mustahik} mustahik atau yatim/dhuafa`}
      onOpen={() => onNavigateTab('jamaah')}
    />,
    <Stat
      key="aset"
      compact={!isDesktop}
      delay={150}
      label="Aset perlu perbaikan"
      value={String(needFix)}
      note={`Dari ${inventories.length} barang inventaris`}
      onOpen={() => onNavigateTab('inventory')}
    />,
  ];

  const chartCard = (
    <Card key="chart" delay={200} style={{ flex: 1 }}>
      <CardHeader
        title="Pemasukan kas"
        subtitle={chart ? `Per hari, 7 hari sampai ${formatShort(isoDay(chart.end))} (transaksi terakhir)` : undefined}
        action={<ArrowButton label="Buka buku kas" onPress={() => onNavigateTab('finance')} />}
      />
      {!chart ? (
        <EmptyState icon="bar-chart-outline" title="Belum ada pemasukan" text="Grafik muncul setelah bendahara mencatat pemasukan di menu Keuangan." />
      ) : (
        <>
          <View style={st.chart} accessibilityLabel={`Pemasukan tertinggi ${formatRupiah(chart.max)}`}>
            {chart.days.map((d) => {
              const h = chart.max ? Math.max(0.22, d.total / chart.max) : 0;
              const isMax = d.total === chart.max && d.total > 0;
              return (
                <View key={d.key} style={st.barCol}>
                  {isMax ? (
                    <View style={st.tip}>
                      <Text style={st.tipText}>{shortRp(d.total)}</Text>
                    </View>
                  ) : null}
                  {d.total > 0 ? (
                    <Animated.View
                      style={[
                        st.bar,
                        { backgroundColor: isMax ? C.g900 : d.total >= chart.max * 0.5 ? C.g500 : C.g300 },
                        { height: grow.interpolate({ inputRange: [0, 1], outputRange: [0, 150 * h] }) },
                      ]}
                    />
                  ) : (
                    <Hatch style={[st.bar, { height: 150 * 0.62 }]} />
                  )}
                  <Text style={st.barLabel}>{d.label}</Text>
                </View>
              );
            })}
          </View>
          <View style={st.legend}>
            <Hatch style={st.legendHatch} radius={3} />
            <Text style={st.legendText}>Arsir: tidak ada pemasukan tercatat hari itu</Text>
          </View>
        </>
      )}
    </Card>
  );

  const scheduleCard = (
    <Card key="schedule" delay={250} style={{ flex: 1 }}>
      <CardHeader title="Jadwal sholat" subtitle={prayerData.isLiveKemenag ? 'Data Kemenag RI via myquran.com' : 'Offline: jadwal cadangan'} />
      <Text style={st.nextKicker}>{isTomorrow ? 'Berikutnya, besok' : 'Berikutnya'}</Text>
      <Text style={st.nextName}>{nextName}</Text>
      <Text style={st.nextTime}>pukul {next.time} WIB · {prayerData.cityName}</Text>
      <View style={st.times}>
        {prayerData.schedules.map((p) => {
          const active = p.name === nextName;
          return (
            <View key={p.name} style={[st.timeCell, active && st.timeCellActive]}>
              <Text style={[st.timeName, active && { color: C.onDark }]}>{p.name}</Text>
              <Text style={[st.timeVal, active && { color: C.onDark }]}>{p.time}</Text>
            </View>
          );
        })}
      </View>
      <Button label="Tampilkan di TV" icon="tv-outline" onPress={() => setIsSignageMode(true)} style={{ marginTop: SP.l }} />
    </Card>
  );

  const officers: [string, string][] = [
    ['Khotib', fridaySchedule.khotib],
    ['Imam', fridaySchedule.imam],
    ['Muadzin', fridaySchedule.muadzin],
    ['Bilal', fridaySchedule.bilal],
  ];
  const fridayCard = (
    <Card key="friday" delay={300} style={{ flex: 1 }}>
      <CardHeader
        title="Petugas Jumat"
        subtitle={fridaySchedule.date}
        action={<Button compact variant="outline" icon="share-outline" label="Bagikan" onPress={shareFriday} />}
      />
      <Text style={st.theme}>Tema: “{fridaySchedule.theme}”</Text>
      {officers.map(([role, name], i) => (
        <ListRow key={role} last={i === officers.length - 1} leading={<Avatar name={name} />} title={name} subtitle={`Bertugas sebagai ${role.toLowerCase()}`} trailing={<Badge label={role} tone="success" />} />
      ))}
      {shareNote ? (
        <Animated.Text style={[st.note, { opacity: noteOpacity }]} accessibilityLiveRegion="polite">
          {shareNote}
        </Animated.Text>
      ) : null}
    </Card>
  );

  const gaugeCard = (
    <Card key="gauge" delay={350} style={{ flex: 1 }}>
      <CardHeader title="Kondisi sarpras" action={<ArrowButton label="Buka inventaris" onPress={() => onNavigateTab('inventory')} />} />
      {inventories.length === 0 ? (
        <EmptyState icon="cube-outline" title="Inventaris kosong" text="Seksi sarpras bisa mendata barang di menu Sarpras." />
      ) : (
        <Gauge
          good={inventories.filter((i) => i.condition === 'BAIK').length}
          minor={inventories.filter((i) => i.condition === 'RUSAK_RINGAN').length}
          replace={inventories.filter((i) => i.condition === 'PERLU_DIGANTI').length}
        />
      )}
    </Card>
  );

  const agendaList = [...upcoming, ...sortedEvents.filter((e) => e.date < todayIso).reverse()].slice(0, 5);
  const agendaCard = (
    <Card key="agenda" delay={250} style={isDesktop ? { flex: 1 } : undefined}>
      <CardHeader title="Agenda" action={<Button compact variant="outline" icon="add" label="Tambah" onPress={() => onNavigateTab('events')} />} />
      {agendaList.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Belum ada agenda" text="Pengurus bisa menambahkan kajian atau kegiatan di menu Kegiatan." />
      ) : (
        agendaList.map((ev, i) => {
          const done = ev.date < todayIso;
          const cat = CATEGORY[ev.category] ?? { label: ev.category, icon: 'calendar-outline' as IconName };
          return (
            <ListRow
              key={ev.id}
              last={i === agendaList.length - 1}
              leading={<IconTile icon={cat.icon} tone={done ? 'neutral' : 'green'} />}
              title={ev.title}
              subtitle={`${formatShort(ev.date)} · ${ev.timeStart} WIB`}
              trailing={done ? <Badge label="Selesai" /> : null}
            />
          );
        })
      )}
    </Card>
  );

  const countdownCard = (
    <Card key="countdown" delay={400} style={st.dark}>
      <Text style={st.darkTitle}>Hitung mundur</Text>
      <Text style={st.darkSub}>Menuju {nextName}{isTomorrow ? ' besok' : ''}, {next.time} WIB</Text>
      <Text style={st.countdown} accessibilityLabel={`${next.hours} jam ${next.minutes} menit lagi`}>
        {pad(next.hours)}:{pad(next.minutes)}:{pad(next.seconds)}
      </Text>
      <View style={st.darkActions}>
        <IconButton onDark filled icon="refresh" label="Muat ulang jadwal sholat" onPress={refreshPrayerSchedule} disabled={isPrayerLoading} />
        <IconButton onDark icon="location-outline" label={`Wilayah ${prayerData.cityName}. Ganti wilayah`} onPress={() => setCityOpen(true)} />
      </View>
    </Card>
  );

  const name = isLoggedIn && currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : '';

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <PageHeader
          title="Ringkasan"
          subtitle={`Assalamu'alaikum${name}. ${formatDateIndo(today.toISOString())} · ${getEstimatedHijriDate(today)}`}
          actions={
            <>
              <Button label="Infaq QRIS" icon="qr-code-outline" onPress={() => setQrisVisible(true)} />
              {!isPhone && <Button variant="outline" label="Mode TV" icon="tv-outline" onPress={() => setIsSignageMode(true)} />}
            </>
          }
        />

        {/* Kartu ringkasan */}
        {isDesktop ? (
          <Row>{statCards}</Row>
        ) : (
          <View style={{ gap: isPhone ? SP.m : SP.l }}>
            {statCards[0]}
            <View style={{ flexDirection: 'row', gap: isPhone ? SP.m : SP.l }}>
              {statCards[1]}
              {statCards[2]}
              {!isPhone && statCards[3]}
            </View>
            {isPhone && statCards[3]}
          </View>
        )}

        {isDesktop ? (
          <Row>
            <Col flex={3}>
              <Row>
                <Col flex={2}>{chartCard}</Col>
                <Col flex={1}>{scheduleCard}</Col>
              </Row>
              <Row>
                <Col flex={2}>{fridayCard}</Col>
                <Col flex={1}>{gaugeCard}</Col>
              </Row>
            </Col>
            <Col flex={1}>
              {agendaCard}
              {countdownCard}
            </Col>
          </Row>
        ) : isPhone ? (
          <View style={{ gap: SP.m }}>
            {countdownCard}
            {scheduleCard}
            {fridayCard}
            {agendaCard}
            {chartCard}
            {gaugeCard}
          </View>
        ) : (
          <Row>
            <Col>
              {countdownCard}
              {scheduleCard}
              {agendaCard}
            </Col>
            <Col>
              {chartCard}
              {fridayCard}
              {gaugeCard}
            </Col>
          </Row>
        )}
      </Screen>

      <DonationQRISModal visible={qrisVisible} onClose={() => setQrisVisible(false)} defaultPocketId="pocket-operasional" />

      <Sheet visible={cityOpen} onClose={() => setCityOpen(false)} title="Wilayah jadwal sholat" subtitle="Jadwal mengikuti data Kemenag untuk wilayah yang dipilih.">
        {POPULAR_CITIES.map((c, i) => {
          const selected = c.id === selectedCityId;
          return (
            <Press
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={[st.cityRow, selected && st.cityRowOn, i === POPULAR_CITIES.length - 1 && { marginBottom: 0 }]}
              hoverStyle={selected ? undefined : { backgroundColor: C.sunken }}
              onPress={() => {
                setSelectedCityId(c.id);
                setCityOpen(false);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[st.cityName, selected && { color: C.g700 }]}>{c.name}</Text>
                <Text style={st.cityProv}>{c.province}</Text>
              </View>
              {selected ? <Badge label="Dipilih" tone="success" /> : null}
            </Press>
          );
        })}
      </Sheet>
    </View>
  );
}

function formatShort(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : `${DAY[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

/** Gauge setengah lingkaran: baik / rusak ringan / perlu diganti (arsir). */
function Gauge({ good, minor, replace }: { good: number; minor: number; replace: number }) {
  const total = good + minor + replace || 1;
  const [t, setT] = useState(0);
  const anim = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const id = anim.addListener(({ value }) => setT(value));
    Animated.timing(anim, { toValue: 1, duration: dur(800), delay: dur(300), easing: EASE_OUT, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [anim]);

  const RAD = 90;
  const LEN = Math.PI * RAD;
  const arc = `M 20 110 A ${RAD} ${RAD} 0 0 1 200 110`;
  const parts = [
    { n: good, stroke: C.g500 },
    { n: minor, stroke: C.g900 },
    { n: replace, stroke: 'url(#gaugeHatch)' },
  ];
  let start = 0;
  const pct = Math.round((good / total) * 100);

  return (
    <View style={{ alignItems: 'center' }}>
      <View accessibilityLabel={`${pct} persen barang dalam kondisi baik`}>
        <Svg width={220} height={124} viewBox="0 0 220 124">
          <Defs>
            <Pattern id="gaugeHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <Line x1="0" y1="0" x2="0" y2="8" stroke={C.hatchLine} strokeWidth="2.5" />
            </Pattern>
          </Defs>
          <Path d={arc} stroke={C.sunken} strokeWidth={30} fill="none" />
          {parts.map((p, i) => {
            const frac = (p.n / total) * t;
            const el = (
              <Path
                key={i}
                d={arc}
                stroke={p.stroke}
                strokeWidth={30}
                fill="none"
                strokeDasharray={`${Math.max(0, LEN * frac - 2)} ${LEN}`}
                strokeDashoffset={-LEN * start}
              />
            );
            start += frac;
            return el;
          })}
        </Svg>
        <View style={st.gaugeCenter} pointerEvents="none">
          <Text style={st.gaugePct}>{pct}%</Text>
          <Text style={st.gaugeLabel}>dalam kondisi baik</Text>
        </View>
      </View>
      <View style={st.gaugeLegend}>
        <Legend color={C.g500} label={`Baik (${good})`} />
        <Legend color={C.g900} label={`Rusak ringan (${minor})`} />
        <Legend hatch label={`Perlu diganti (${replace})`} />
      </View>
    </View>
  );
}

function Legend({ color, hatch, label }: { color?: string; hatch?: boolean; label: string }) {
  return (
    <View style={st.legendItem}>
      {hatch ? <Hatch style={st.legendDot} radius={6} /> : <View style={[st.legendDot, { backgroundColor: color }]} />}
      <Text style={st.legendText}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  chart: { height: 196, flexDirection: 'row', alignItems: 'flex-end', gap: SP.s },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: '100%' },
  bar: { width: '100%', maxWidth: 52, borderRadius: R.pill },
  barLabel: { ...TYPE.small, color: C.inkMuted },
  tip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  tipText: { ...TYPE.smallStrong, fontSize: 11, color: C.ink },
  legend: { flexDirection: 'row', alignItems: 'center', gap: SP.s, marginTop: SP.m },
  legendHatch: { width: 14, height: 14 },
  legendText: { ...TYPE.small, color: C.inkMuted },

  nextKicker: { ...TYPE.small, color: C.inkMuted },
  nextName: { ...TYPE.h1, color: C.g800, marginTop: 2 },
  nextTime: { ...TYPE.body, color: C.inkMuted },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SP.l },
  timeCell: { flexGrow: 1, flexBasis: 72, paddingVertical: 8, paddingHorizontal: 10, borderRadius: R.inner - 4, backgroundColor: C.sunken },
  timeCellActive: { backgroundColor: C.g700 },
  timeName: { ...TYPE.small, color: C.inkMuted },
  timeVal: { ...TYPE.num, fontSize: 15, color: C.ink },

  theme: { ...TYPE.body, color: C.inkMuted, marginTop: -SP.s, marginBottom: SP.xs },
  note: { ...TYPE.small, color: C.g700, marginTop: SP.s },

  dark: { backgroundColor: C.g900, borderColor: C.g900 },
  darkTitle: { ...TYPE.h2, color: C.onDark },
  darkSub: { ...TYPE.small, color: C.onDarkMuted, marginTop: 2 },
  countdown: { ...TYPE.display, color: C.onDark, textAlign: 'center', marginVertical: SP.l },
  darkActions: { flexDirection: 'row', justifyContent: 'center', gap: SP.m },

  gaugeCenter: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  gaugePct: { ...TYPE.display, fontSize: 38, lineHeight: 42, color: C.ink },
  gaugeLabel: { ...TYPE.small, color: C.inkMuted },
  gaugeLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SP.m, marginTop: SP.l },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },

  cityRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.m, borderRadius: R.inner, marginBottom: 2 },
  cityRowOn: { backgroundColor: C.g50 },
  cityName: { ...TYPE.bodyStrong, color: C.ink },
  cityProv: { ...TYPE.small, color: C.inkMuted },
});
