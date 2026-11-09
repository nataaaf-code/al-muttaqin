import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TextStyle, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { getWibTime } from '../services/prayerService';
import { formatDateIndo, getEstimatedHijriDate } from '../utils/formatters';
import { C, R, SP, TYPE } from '../theme/colors';
import { NATIVE, isReducedMotion } from '../theme/motion';
import { HeroFill, IconButton, IconName } from '../ui/kit';

/**
 * Layar TV 16:9 (DESIGN.md bagian 10). Kanvas tetap 1920x1080 yang diskalakan ke viewport,
 * jadi semua ukuran di bawah dalam satuan kanvas. Tipe memakai token TYPE dengan fontSize diperbesar.
 */

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const PAD = 32;
const GAP = 20;

const makkahAsset = require('../../assets/makkah.jpg');
const logoAsset = require('../../assets/logo.png');
const qrisAsset = require('../../assets/qris-square.png');

/** Jeda adzan ke iqomah per waktu sholat (menit), sama seperti sebelumnya. */
const IQOMAH_GAP: Record<string, number> = { Subuh: 12, Dzuhur: 13, Ashar: 13, Maghrib: 11, Isya: 10 };

const PRAYER_ICON: Record<string, IconName> = {
  Subuh: 'partly-sunny-outline',
  Dzuhur: 'sunny-outline',
  Ashar: 'sunny-outline',
  Maghrib: 'cloudy-night-outline',
  Isya: 'moon-outline',
};

function addMinutesToTime(timeStr: string, addMins: number): string {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  const totalM = (h || 0) * 60 + (m || 0) + addMins;
  const newH = Math.floor(totalM / 60) % 24;
  const newM = totalM % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

function toSeconds(timeStr: string) {
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 3600 + (m || 0) * 60;
}

const pad2 = (n: number) => n.toString().padStart(2, '0');

/** Token tipe dengan ukuran TV. */
function tv(token: keyof typeof TYPE, fontSize: number, lineHeight = Math.round(fontSize * 1.15), extra?: TextStyle): TextStyle {
  return { ...(TYPE[token] as TextStyle), fontSize, lineHeight, ...extra };
}

/** Running text: bergerak terus karena itu fungsinya; diam saat reduced-motion. */
function RunningText({ text }: { text: string }) {
  const x = useState(() => new Animated.Value(0))[0];
  const [boxW, setBoxW] = useState(0);
  const [textW, setTextW] = useState(0);
  const reduced = isReducedMotion();

  useEffect(() => {
    if (reduced || !boxW || !textW) return;
    x.setValue(boxW);
    const anim = Animated.loop(
      Animated.timing(x, {
        toValue: -textW,
        duration: ((boxW + textW) / 110) * 1000,
        easing: Easing.linear,
        useNativeDriver: NATIVE,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, boxW, textW, x]);

  if (reduced) {
    return (
      <Text style={st.runText} numberOfLines={1}>
        {text}
      </Text>
    );
  }

  return (
    <View style={st.runClip} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
      <Animated.View style={[st.runTrack, { transform: [{ translateX: x }] }]}>
        <Text style={st.runText} onLayout={(e) => setTextW(e.nativeEvent.layout.width)}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

function TimeWithZone({ time, style, zoneStyle }: { time: string; style: TextStyle; zoneStyle: TextStyle }) {
  return (
    <View style={st.timeRow}>
      <Text style={style}>{time}</Text>
      <Text style={zoneStyle}>WIB</Text>
    </View>
  );
}

export function SignageTVScreen() {
  const { width: winW, height: winH } = useWindowDimensions();
  const { prayerData, setIsSignageMode, signageConfig, isPrayerLoading } = useMushola();

  // Jam berdetak per detik (WIB)
  const [nowDate, setNowDate] = useState(new Date());
  const [wib, setWib] = useState(getWibTime());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
      setWib(getWibTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scale = Math.min(winW / CANVAS_W, winH / CANVAS_H);
  // Ruang untuk tombol keluar (ukuran nyata 44px) di pojok kanan atas viewport.
  const exitReserve = Math.min(420, (44 + 32) / Math.max(scale, 0.01));

  const timeOf = (name: string, fallback: string) => prayerData.schedules.find((s) => s.name === name)?.time || fallback;

  const timeTerbit = timeOf('Terbit', '05:32');
  const prayers = [
    { name: 'Subuh', adzan: timeOf('Subuh', '04:32') },
    { name: 'Dzuhur', adzan: timeOf('Dzuhur', '11:47') },
    { name: 'Ashar', adzan: timeOf('Ashar', '15:02') },
    { name: 'Maghrib', adzan: timeOf('Maghrib', '17:54') },
    { name: 'Isya', adzan: timeOf('Isya', '19:05') },
  ].map((p) => ({ ...p, iqomah: addMinutesToTime(p.adzan, IQOMAH_GAP[p.name]) }));

  const dzuhur = prayers[1];

  // Fase iqomah: adzan sudah lewat, iqomah belum.
  const nowSec = wib.totalSeconds;
  const inIqomah = prayers.find((p) => nowSec >= toSeconds(p.adzan) && nowSec < toSeconds(p.iqomah));
  const iqomahLeft = inIqomah ? toSeconds(inIqomah.iqomah) - nowSec : 0;

  const nextName = prayerData.nextPrayer.name;
  const activeName = inIqomah ? inIqomah.name : nextName;

  const hijriDate = getEstimatedHijriDate(nowDate);
  const gregorianDate = formatDateIndo(nowDate.toISOString().split('T')[0]);
  const isFriday = nowDate.getDay() === 5;

  const hadith = signageConfig.hadithOfTheDay;

  return (
    <View style={st.viewport}>
      <Image source={makkahAsset} style={st.bgImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no" />

      <View style={[st.canvas, { transform: [{ scale }] }]}>
        {/* Header */}
        <View style={[st.header, { paddingRight: exitReserve }]}>
          <View style={st.brand}>
            <View style={st.logoWrap}>
              <Image source={logoAsset} style={st.logo} resizeMode="contain" accessibilityLabel="Logo Musholla Al Muttaqin" />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={st.brandName} numberOfLines={1}>
                {signageConfig.musholaName}
              </Text>
              <Text style={st.brandAddress} numberOfLines={1}>
                {signageConfig.musholaAddress}
              </Text>
            </View>
          </View>

          <View style={st.headerRight}>
            <View style={st.dates}>
              <Text style={st.dateHijri}>{hijriDate}</Text>
              <Text style={st.dateGreg}>{gregorianDate}</Text>
            </View>
            <View style={st.terbit}>
              <Ionicons name="sunny-outline" size={34} color={C.g700} aria-hidden />
              <View>
                <Text style={st.terbitLabel}>Terbit</Text>
                <TimeWithZone time={timeTerbit} style={st.terbitTime} zoneStyle={st.zoneSmall} />
              </View>
            </View>
          </View>
        </View>

        {/* Baris utama: jam, sholat berikutnya, QRIS */}
        <View style={st.mainRow}>
          <View style={[st.card, st.clockCard]}>
            <Text style={st.cardLabel}>Waktu sekarang, WIB</Text>
            <View style={st.clockRow}>
              <Text style={st.clockHM}>
                {pad2(wib.hours)}:{pad2(wib.minutes)}
              </Text>
              <Text style={st.clockS}>{pad2(wib.seconds)}</Text>
            </View>
            <Text style={st.cardFoot} numberOfLines={1}>
              {isPrayerLoading
                ? 'Memperbarui jadwal sholat...'
                : prayerData.isLiveKemenag
                  ? `Jadwal Kemenag, ${prayerData.cityName}`
                  : `Jadwal perkiraan offline, ${prayerData.cityName}`}
            </Text>
          </View>

          <View style={[st.card, st.heroCard]}>
            <HeroFill />
            <Text style={st.heroLabel}>{inIqomah ? 'Menuju iqomah' : 'Sholat berikutnya'}</Text>
            <View style={st.heroNameRow}>
              <Ionicons name={PRAYER_ICON[activeName] ?? 'time-outline'} size={60} color={C.onDark} aria-hidden />
              <Text style={st.heroName}>{activeName}</Text>
            </View>
            <TimeWithZone
              time={inIqomah ? inIqomah.iqomah : prayerData.nextPrayer.time}
              style={st.heroTime}
              zoneStyle={st.heroZone}
            />
            <View style={st.heroCountRow}>
              <Text style={st.heroCountLabel}>{inIqomah ? 'Iqomah dalam' : 'Adzan dalam'}</Text>
              <Text style={st.heroCount}>
                {inIqomah
                  ? `${pad2(Math.floor(iqomahLeft / 60))}:${pad2(iqomahLeft % 60)}`
                  : prayerData.nextPrayer.compactCountdown || '00:00:00'}
              </Text>
            </View>
          </View>

          <View style={[st.card, st.qrCard]}>
            <Image source={qrisAsset} style={st.qrImg} resizeMode="contain" accessibilityLabel="Kode QRIS infaq Musholla Al Muttaqin" />
            <Text style={st.qrTitle}>Infaq dan sedekah</Text>
            <Text style={st.qrSub}>Scan QRIS, semua bank dan e-wallet</Text>
          </View>
        </View>

        {/* Lima waktu sholat */}
        <View style={st.prayerRow}>
          {prayers.map((p) => {
            const active = p.name === activeName;
            return (
              <View key={p.name} style={[st.card, st.prayerCard, active && st.prayerCardActive]}>
                <View style={st.prayerHead}>
                  <Ionicons name={PRAYER_ICON[p.name]} size={34} color={active ? C.g700 : C.inkMuted} aria-hidden />
                  <Text style={[st.prayerName, active && { color: C.g700 }]}>{p.name}</Text>
                  {active ? (
                    <View style={st.tvBadge}>
                      <Text style={st.tvBadgeText}>{inIqomah ? 'Iqomah' : 'Berikutnya'}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={st.prayerTimes}>
                  <View>
                    <Text style={st.timeLabel}>Adzan</Text>
                    <TimeWithZone time={p.adzan} style={st.prayerAdzan} zoneStyle={st.zoneSmall} />
                  </View>
                  <View>
                    <Text style={st.timeLabel}>Iqomah</Text>
                    <Text style={st.prayerIqomah}>{p.iqomah}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Hadits & Jumat */}
        <View style={st.bottomRow}>
          <View style={[st.card, st.hadithCard]}>
            <Ionicons name="book-outline" size={36} color={C.g700} aria-hidden />
            <View style={{ flex: 1 }}>
              <Text style={st.hadithText} numberOfLines={2}>
                {hadith.text}
              </Text>
              <Text style={st.hadithBy}>{hadith.narrator}</Text>
            </View>
          </View>
          <View style={[st.card, st.jumatCard, isFriday && st.prayerCardActive]}>
            <Text style={st.jumatTitle}>Jumat</Text>
            <View>
              <Text style={st.timeLabel}>Adzan</Text>
              <Text style={st.jumatTime}>{dzuhur.adzan}</Text>
            </View>
            <View>
              <Text style={st.timeLabel}>Iqomah</Text>
              <Text style={st.jumatTime}>{dzuhur.iqomah}</Text>
            </View>
          </View>
        </View>

        {/* Running text */}
        <View style={[st.card, st.runCard]}>
          <View style={st.runTag}>
            <Text style={st.runTagText}>Info</Text>
          </View>
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <RunningText text={signageConfig.runningText} />
          </View>
        </View>
      </View>

      <View style={st.exit}>
        <IconButton icon="close" label="Keluar dari mode TV" onPress={() => setIsSignageMode(false)} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  viewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: C.page,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: 0.1 },
  canvas: {
    width: CANVAS_W,
    height: CANVAS_H,
    padding: PAD,
    gap: GAP,
    flexShrink: 0,
  },
  exit: { position: 'absolute', top: SP.l, right: SP.l, backgroundColor: C.card, borderRadius: R.pill },

  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },

  /* Header */
  header: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 22, flexShrink: 1 },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 80, height: 80 },
  brandName: tv('h1', 46, 54, { letterSpacing: -1, color: C.ink }),
  brandAddress: tv('body', 22, 30, { color: C.inkMuted }),
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  dates: { alignItems: 'flex-end' },
  dateHijri: tv('h3', 28, 36, { color: C.ink }),
  dateGreg: tv('body', 22, 30, { color: C.inkMuted }),
  terbit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: C.card,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  terbitLabel: tv('label', 20, 26, { color: C.inkMuted }),
  terbitTime: tv('display', 38, 44, { letterSpacing: -0.8, color: C.ink }),

  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  zoneSmall: tv('smallStrong', 18, 22, { color: C.inkMuted }),

  /* Baris utama */
  mainRow: { height: 400, flexDirection: 'row', gap: GAP },
  clockCard: { flex: 1.1, padding: 36, justifyContent: 'space-between' },
  cardLabel: tv('h3', 28, 34, { color: C.inkMuted }),
  clockRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  clockHM: tv('display', 196, 206, { letterSpacing: -6, color: C.ink }),
  clockS: tv('display', 72, 80, { letterSpacing: -1.5, color: C.inkMuted }),
  cardFoot: tv('body', 22, 30, { color: C.inkMuted }),

  heroCard: { flex: 1.4, padding: 36, justifyContent: 'space-between', borderColor: C.g800, backgroundColor: C.g800 },
  heroLabel: tv('h3', 28, 34, { color: C.onDarkMuted }),
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroName: tv('h1', 68, 76, { letterSpacing: -1.4, color: C.onDark }),
  heroTime: tv('display', 132, 140, { letterSpacing: -4, color: C.onDark }),
  heroZone: tv('h3', 32, 38, { color: C.onDarkMuted }),
  heroCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 18 },
  heroCountLabel: tv('h3', 28, 34, { color: C.onDarkMuted }),
  heroCount: tv('display', 56, 62, { letterSpacing: -1.2, color: C.onDark }),

  qrCard: { width: 360, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 6 },
  qrImg: { width: 260, height: 260 },
  qrTitle: tv('h3', 26, 32, { color: C.ink, textAlign: 'center', marginTop: 8 }),
  qrSub: tv('body', 20, 26, { color: C.inkMuted, textAlign: 'center' }),

  /* Lima waktu */
  prayerRow: { height: 236, flexDirection: 'row', gap: GAP },
  prayerCard: { flex: 1, padding: 24, paddingRight: 28, justifyContent: 'space-between' },
  prayerCardActive: { borderWidth: 3, borderColor: C.g700 },
  prayerHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayerName: tv('h2', 34, 40, { letterSpacing: -0.5, color: C.ink, flexShrink: 1 }),
  tvBadge: {
    marginLeft: 'auto',
    backgroundColor: C.g50,
    borderColor: C.g100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tvBadgeText: tv('smallStrong', 18, 22, { color: C.g700 }),
  prayerTimes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  timeLabel: tv('label', 22, 28, { color: C.inkMuted }),
  prayerAdzan: tv('display', 66, 72, { letterSpacing: -2, color: C.ink }),
  prayerIqomah: tv('display', 32, 38, { letterSpacing: -0.6, color: C.inkMuted }),

  /* Hadits & Jumat */
  bottomRow: { height: 124, flexDirection: 'row', gap: GAP },
  hadithCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 22, paddingHorizontal: 32, paddingVertical: 18 },
  hadithText: tv('body', 24, 33, { color: C.ink }),
  hadithBy: tv('smallStrong', 20, 26, { color: C.g700, marginTop: 4 }),
  jumatCard: { width: 560, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32 },
  jumatTitle: tv('h2', 34, 40, { color: C.ink }),
  jumatTime: tv('display', 46, 52, { letterSpacing: -1, color: C.ink }),

  /* Running text */
  runCard: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 18, paddingLeft: 12, paddingRight: 24 },
  runTag: { backgroundColor: C.g700, borderRadius: R.pill, paddingHorizontal: 20, paddingVertical: 6 },
  runTagText: tv('label', 22, 28, { color: C.onDark }),
  runClip: { height: 40, overflow: 'hidden', justifyContent: 'center' },
  runTrack: { position: 'absolute', left: 0, top: 0, width: 20000, flexDirection: 'row' },
  runText: tv('bodyStrong', 26, 40, { color: C.ink }),
});
