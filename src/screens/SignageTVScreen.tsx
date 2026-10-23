import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { getWibTime } from '../services/prayerService';
import { formatDateIndo, getEstimatedHijriDate } from '../utils/formatters';

// Helper: Tambah menit ke format waktu "HH:mm" (24 jam)
function addMinutesToTime(timeStr: string, addMins: number): string {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  const totalM = (h || 0) * 60 + (m || 0) + addMins;
  const newH = Math.floor(totalM / 60) % 24;
  const newM = totalM % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

// Custom SVG Icons for Weather & Prayer Times according to design.md
function SunriseIcon() {
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 6V12M11 13L14.5 16.5M37 13L33.5 16.5M5 26H11M37 26H43"
        stroke="#F3AC3C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M13 26C13 19.9249 17.9249 15 24 15C30.0751 15 35 19.9249 35 26"
        stroke="#F3AC3C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M24 19L24 23M21 21L24 18L27 21"
        stroke="#F3AC3C"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 32H42M14 38C17 36 20 40 24 38C28 36 31 40 34 38"
        stroke="#F3AC3C"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SunFullIcon({ size = 38 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <Circle cx="19" cy="19" r="8" fill="#F3AC3C" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 19 + Math.sin(rad) * 11;
        const y1 = 19 - Math.cos(rad) * 11;
        const x2 = 19 + Math.sin(rad) * 15;
        const y2 = 19 - Math.cos(rad) * 15;
        return (
          <Path
            key={idx}
            d={`M${x1} ${y1} L${x2} ${y2}`}
            stroke="#F3AC3C"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

function FajrIcon() {
  return (
    <Svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <Circle cx="20" cy="18" r="8" fill="#F3AC3C" />
      <Path d="M20 5V8M9 9L11.5 11.5M31 9L28.5 11.5M6 18H9M31 18H34" stroke="#F3AC3C" strokeWidth="2.5" strokeLinecap="round" />
      <Path
        d="M17 32C15.3431 32 14 30.6569 14 29C14 27.65 14.88 26.5 16.1 26.15C16.4 23.8 18.4 22 20.8 22C22.6 22 24.2 23 25 24.5C25.5 24.2 26.2 24 27 24C28.7 24 30 25.3 30 27C30.7 27.2 31.2 27.8 31.2 28.5C31.2 29.3 30.6 30 29.8 30L17 32Z"
        fill="#F5E9D4"
        stroke="#E8DCB8"
        strokeWidth="1.2"
      />
    </Svg>
  );
}

function AsrIcon() {
  return (
    <Svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <Circle cx="23" cy="18" r="8" fill="#F3AC3C" />
      <Path d="M23 5V8M12 9L14.5 11.5M34 9L31.5 11.5M9 18H12M34 18H37" stroke="#F3AC3C" strokeWidth="2.5" strokeLinecap="round" />
      <Path
        d="M11 31C9.5 31 8.2 29.8 8.2 28.3C8.2 27 9.1 26 10.3 25.6C10.7 23.5 12.5 21.9 14.7 21.9C16.4 21.9 17.8 22.8 18.6 24.2C19.1 23.9 19.7 23.7 20.4 23.7C21.9 23.7 23.1 24.9 23.1 26.4C23.8 26.6 24.3 27.2 24.3 27.9C24.3 28.7 23.7 29.3 22.9 29.3L11 31Z"
        fill="#F5E9D4"
        stroke="#E8DCB8"
        strokeWidth="1.2"
      />
    </Svg>
  );
}

function MaghribCardIcon() {
  return (
    <Svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <Path
        d="M24 10C24 16.6274 18.6274 22 12 22C11.3 22 10.6 21.9 10 21.8C11.8 25.4 15.6 28 20 28C26.0751 28 31 23.0751 31 17C31 12.6 28.4 8.8 24.8 7C24.9 8 24 10 24 10Z"
        fill="#F3AC3C"
      />
      <Path d="M27 9L28 11.5L30.5 12.5L28 13.5L27 16L26 13.5L23.5 12.5L26 11.5Z" fill="#F3AC3C" />
      <Path
        d="M12 32C10.3 32 9 30.7 9 29C9 27.7 9.9 26.6 11.1 26.2C11.4 23.9 13.4 22.1 15.8 22.1C17.6 22.1 19.2 23.1 20 24.6C20.5 24.3 21.2 24.1 22 24.1C23.7 24.1 25 25.4 25 27.1C25.7 27.3 26.2 27.9 26.2 28.6C26.2 29.4 25.6 30.1 24.8 30.1L12 32Z"
        fill="#F5E9D4"
        stroke="#E8DCB8"
        strokeWidth="1.2"
      />
    </Svg>
  );
}

function MaghribHeroIcon() {
  return (
    <Svg width="54" height="54" viewBox="0 0 54 54" fill="none">
      <Path
        d="M32 10C32 18.8 24.8 26 16 26C14.8 26 13.7 25.8 12.7 25.5C15.3 30.5 20.7 34 27 34C35.8 34 43 26.8 43 18C43 11.7 39.5 6.3 34.5 3.7C34.8 5.7 32 10 32 10Z"
        stroke="#C8B55B"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M38 7L39 10L42 11L39 12L38 15L37 12L34 11L37 10Z"
        fill="#C8B55B"
      />
      <Path
        d="M10 40C14 38 18 42 22 40C26 38 30 42 34 40C38 38 42 42 46 40"
        stroke="#C8B55B"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M14 46C18 44 22 48 26 46C30 44 34 48 38 46"
        stroke="#C8B55B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IshaIcon() {
  return (
    <Svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <Path
        d="M26 10C26 17.732 19.732 24 12 24C11 24 10 23.8 9.1 23.5C11.5 28.5 16.7 32 23 32C31.2843 32 38 25.2843 38 17C38 10.7 34.5 5.5 29.5 3.1C29.8 5.3 26 10 26 10Z"
        fill="#F3AC3C"
      />
      <Path d="M16 9L17 11L19 11.5L17 12L16 14L15 12L13 11.5L15 11Z" fill="#F3AC3C" />
      <Path d="M33 28L34 30L36 30.5L34 31L33 33L32 31L30 30.5L32 30Z" fill="#F3AC3C" />
    </Svg>
  );
}

// Komponen Jam Analog Presisi 356px (SVG Murni) Sesuai Spesifikasi design.md
function AnalogClockSVG({
  hours,
  minutes,
  seconds,
}: {
  hours: number;
  minutes: number;
  seconds: number;
}) {
  const hourAngle = ((hours % 12) + minutes / 60 + seconds / 3600) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  // 60 Titik/Garis Menit & Jam di Keliling Jam
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const isHour = i % 5 === 0;
    const angle = i * 6;
    const rad = (angle * Math.PI) / 180;
    const outerR = 150;
    const innerR = isHour ? 138 : 144;
    const x1 = 178 + outerR * Math.sin(rad);
    const y1 = 178 - outerR * Math.cos(rad);
    const x2 = 178 + innerR * Math.sin(rad);
    const y2 = 178 - innerR * Math.cos(rad);
    ticks.push({
      key: i,
      x1,
      y1,
      x2,
      y2,
      stroke: isHour ? '#264B3C' : '#A2B5AD',
      strokeWidth: isHour ? 3 : 1.5,
    });
  }

  // 12 Angka Jam (Radial Trigonometris r = 115)
  const numbers = [];
  for (let n = 1; n <= 12; n++) {
    const angle = n * 30;
    const rad = (angle * Math.PI) / 180;
    const r = 115;
    const x = 178 + r * Math.sin(rad);
    const y = 178 - r * Math.cos(rad);
    numbers.push({ n, x, y });
  }

  return (
    <Svg width="356" height="356" viewBox="0 0 356 356" fill="none">
      {/* 1. Latar Putih Dial Jam */}
      <Circle cx="178" cy="178" r="177" fill="#FFFFFF" />

      {/* 2. Cincin Luar Bezel Hijau Tua Tebal 22px (#264B3C) */}
      <Circle cx="178" cy="178" r="167" stroke="#264B3C" strokeWidth="22" fill="none" />

      {/* 3. Cincin Bevel Bagian Dalam (#DCE6E2, Tebal 2.5px) */}
      <Circle cx="178" cy="178" r="153" stroke="#DCE6E2" strokeWidth="2.5" fill="none" />

      {/* 4. 60 Garis Tikit Menit & Jam */}
      {ticks.map((t) => (
        <Line
          key={t.key}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={t.stroke}
          strokeWidth={t.strokeWidth}
          strokeLinecap="round"
        />
      ))}

      {/* 5. Angka 1 - 12 Radial */}
      {numbers.map(({ n, x, y }) => (
        <SvgText
          key={n}
          x={x}
          y={y + 9}
          fontSize="26"
          fontWeight="800"
          fill="#2D3834"
          textAnchor="middle"
        >
          {n}
        </SvgText>
      ))}

      {/* 6. Jarum Jam (Panjang: 82px, Tebal: 10px, Hijau Bezel) */}
      <G transform={`translate(178, 178) rotate(${hourAngle})`}>
        <Line x1="0" y1="0" x2="0" y2="-82" stroke="#264B3C" strokeWidth="10" strokeLinecap="round" />
        <Line x1="0" y1="-10" x2="0" y2="-64" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      </G>

      {/* 7. Jarum Menit (Panjang: 118px, Tebal: 8px, Hijau Bezel) */}
      <G transform={`translate(178, 178) rotate(${minuteAngle})`}>
        <Line x1="0" y1="0" x2="0" y2="-118" stroke="#264B3C" strokeWidth="8" strokeLinecap="round" />
        <Line x1="0" y1="-10" x2="0" y2="-98" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      </G>

      {/* 8. Jarum Detik (Panjang Maju 126px, Ekor Mundur 26px, Warna #9CB4AC) */}
      <G transform={`translate(178, 178) rotate(${secondAngle})`}>
        <Line x1="0" y1="26" x2="0" y2="-126" stroke="#9CB4AC" strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="0" cy="16" r="4.5" fill="#9CB4AC" />
      </G>

      {/* 9. Poros Tengah (Center Pin) */}
      <Circle cx="178" cy="178" r="8" fill="#264B3C" />
      <Circle cx="178" cy="178" r="3" fill="#FFFFFF" />
    </Svg>
  );
}

export function SignageTVScreen() {
  const { width: winW, height: winH } = useWindowDimensions();
  const { prayerData, setIsSignageMode } = useMushola();

  // Live Timer State (WIB)
  const [nowDate, setNowDate] = useState(new Date());
  const [wibTime, setWibTime] = useState(getWibTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
      setWibTime(getWibTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute 1920x1080 canvas scale factor for current viewport (Auto-scale 100%)
  const scale = Math.min(winW / 1920, winH / 1080);

  // ================= JAM ANALOG REAL-TIME (WIB) =================
  const liveHours = wibTime.hours;
  const liveMinutes = wibTime.minutes;
  const liveSeconds = wibTime.seconds;

  // ================= DATA AKTUAL MUSHOLA AL-MUTTAQIN =================
  const mosqueName = 'Musholla Al Muttaqin';
  const mosqueAddress = 'Perum. Mutiara Puri Harmoni, Sukamanah, Rajeg';

  // Jadwal Sholat Kemenag Aktual (Format 24 Jam)
  const timeSubuh = prayerData.schedules.find((s) => s.name === 'Subuh')?.time || '04:32';
  const timeTerbit = prayerData.schedules.find((s) => s.name === 'Terbit')?.time || '05:32';
  const timeDzuhur = prayerData.schedules.find((s) => s.name === 'Dzuhur')?.time || '11:47';
  const timeAshar = prayerData.schedules.find((s) => s.name === 'Ashar')?.time || '15:02';
  const timeMaghrib = prayerData.schedules.find((s) => s.name === 'Maghrib')?.time || '17:54';
  const timeIsya = prayerData.schedules.find((s) => s.name === 'Isya')?.time || '19:05';

  // Waktu Iqomah Aktual (Ditambah jeda adzan ke iqomah)
  const iqomahSubuh = addMinutesToTime(timeSubuh, 12);
  const iqomahDzuhur = addMinutesToTime(timeDzuhur, 13);
  const iqomahAshar = addMinutesToTime(timeAshar, 13);
  const iqomahMaghrib = addMinutesToTime(timeMaghrib, 11);
  const iqomahIsya = addMinutesToTime(timeIsya, 10);

  // Jadwal Sholat Jumat
  const jumatAdzan = timeDzuhur;
  const jumatIqomah = iqomahDzuhur;

  // Data Sholat Berikutnya (Hero Capsule)
  const nextName = prayerData.nextPrayer.name; // 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya'
  const nextTime = `${prayerData.nextPrayer.time}`;
  const nextCountdown = `(-${prayerData.nextPrayer.compactCountdown || '00:00:00'})`;

  // Tanggal Bahasa Indonesia
  const hijriDate = getEstimatedHijriDate(nowDate);
  const gregorianDate = formatDateIndo(nowDate.toISOString().split('T')[0]);

  // Data 5 Kartu Sholat Bawah (Semua Bahasa Indonesia & Format 24 Jam)
  const prayerCardsData = [
    {
      key: 'subuh',
      name: 'Subuh',
      icon: <FajrIcon />,
      timeAdzan: timeSubuh,
      timeIqomah: iqomahSubuh,
      isActive: nextName.toLowerCase() === 'subuh',
    },
    {
      key: 'dzuhur',
      name: 'Dzuhur',
      icon: <SunFullIcon size={42} />,
      timeAdzan: timeDzuhur,
      timeIqomah: iqomahDzuhur,
      isActive: nextName.toLowerCase() === 'dzuhur',
    },
    {
      key: 'ashar',
      name: 'Ashar',
      icon: <AsrIcon />,
      timeAdzan: timeAshar,
      timeIqomah: iqomahAshar,
      isActive: nextName.toLowerCase() === 'ashar',
    },
    {
      key: 'maghrib',
      name: 'Maghrib',
      icon: <MaghribCardIcon />,
      timeAdzan: timeMaghrib,
      timeIqomah: iqomahMaghrib,
      isActive: nextName.toLowerCase() === 'maghrib',
    },
    {
      key: 'isya',
      name: 'Isya',
      icon: <IshaIcon />,
      timeAdzan: timeIsya,
      timeIqomah: iqomahIsya,
      isActive: nextName.toLowerCase() === 'isya',
    },
  ];

  return (
    <View style={styles.viewportOuter}>
      {/* 1920x1080 Fixed Canvas dengan Auto-Scale Responsif */}
      <View
        style={[
          styles.canvas1080p,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {/* ================= LAYER 0: FOTO BACKGROUND MAKKAH ================= */}
        <View style={styles.imageBackgroundLayer} pointerEvents="none">
          <Image
            source={require('../../assets/makkah.jpg')}
            style={[StyleSheet.absoluteFill, { opacity: 0.38 }]}
            resizeMode="cover"
          />
        </View>

        {/* ================= LAYER 0.5: SVG MOSQUE SKYLINE SILHOUETTE ================= */}
        <View style={styles.svgBackgroundLayer} pointerEvents="none">
          <Svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none">
            {/* Kubah & Bulan Sabit Besar di Belakang Jam Analog */}
            <Circle cx="595" cy="240" r="85" fill="#CBE0DA" opacity="0.45" />
            <Path
              d="M570,110 A42,42 0 1,0 625,165 A34,34 0 1,1 570,110 Z"
              fill="#CBE0DA"
              opacity="0.55"
            />

            {/* Siluet Daun Palem Sudut Kiri & Kanan Atas */}
            <Path
              d="M-40,-20 Q120,40 180,180 Q100,120 -20,100 Z M-10,-40 Q160,20 230,120 Q140,80 30,30 Z"
              fill="#CBE0DA"
              opacity="0.35"
            />
            <Path
              d="M1960,-20 Q1800,40 1740,180 Q1820,120 1940,100 Z M1930,-40 Q1760,20 1690,120 Q1780,80 1890,30 Z"
              fill="#CBE0DA"
              opacity="0.35"
            />

            {/* Siluet Menara & Kubah Masjid Lapis Tengah */}
            <Path
              d="M0,640 L120,640 L120,520 Q160,450 200,520 L200,640 L260,640 Q380,460 500,640 L980,640 L980,430 L1015,380 L1050,430 L1050,640 L1370,640 L1385,360 L1405,310 L1425,360 L1440,640 L1650,640 Q1730,520 1810,640 L1920,640 L1920,1080 L0,1080 Z"
              fill="#C4DFD8"
              opacity="0.45"
            />

            {/* Siluet Bangunan Depan Masjid */}
            <Path
              d="M0,720 Q180,680 360,720 L1560,720 Q1740,670 1920,720 L1920,1080 L0,1080 Z"
              fill="#BFD8D2"
              opacity="0.4"
            />
          </Svg>
        </View>

        {/* ================= LAYER 1: ZONA HEADER ================= */}
        <View style={styles.tvHeader}>
          {/* Identitas Musholla */}
          <View style={styles.brandLeft}>
            <View style={styles.mosqueAvatarCircle}>
              <Image
                source={require('../../assets/masjid-nabawi-bg.jpg')}
                style={styles.mosqueAvatarImg}
                resizeMode="cover"
              />
            </View>
            <View style={{ marginLeft: 22 }}>
              <Text style={styles.mosqueTitle}>{mosqueName}</Text>
              <Text style={styles.mosqueSubtitle}>{mosqueAddress}</Text>
            </View>
          </View>

          {/* Indikator Waktu Terbit / Syuruq (Format 24 Jam) */}
          <View style={styles.sunriseRight}>
            <SunriseIcon />
            <Text style={styles.sunriseLabel}>Terbit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.sunriseTimeNum}>{timeTerbit}</Text>
              <Text style={styles.sunriseTimeAmPm}>WIB</Text>
            </View>

            {/* Tombol Tutup Mode TV */}
            <TouchableOpacity
              style={styles.exitTvBtn}
              onPress={() => setIsSignageMode(false)}
              activeOpacity={0.8}
              accessibilityLabel="Kembali ke Dashboard"
            >
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= LAYER 2: ZONA HERO (3 KOLOM ASIMETRIS) ================= */}
        <View style={styles.tvHero}>
          {/* Kolom Kiri: Kartu Sholat Jumat */}
          <View style={styles.jumuahCard}>
            <View style={styles.jumuahHeader}>
              <SunFullIcon size={38} />
              <Text style={styles.jumuahTitle}>Jumat</Text>
            </View>

            <View style={styles.jumuahTimeGroup}>
              <Text style={styles.jumuahTimeLabel}>Adzan</Text>
              <View style={styles.jumuahTimeRow}>
                <Text style={styles.jumuahTimeAthanNum}>{jumatAdzan}</Text>
                <Text style={styles.jumuahTimeAthanAmPm}>WIB</Text>
              </View>
            </View>

            <View style={[styles.jumuahTimeGroup, { marginTop: 14 }]}>
              <Text style={styles.jumuahTimeLabel}>Iqomah</Text>
              <View style={styles.jumuahTimeRow}>
                <Text style={styles.jumuahTimeIqamahNum}>{jumatIqomah}</Text>
                <Text style={styles.jumuahTimeIqamahAmPm}>WIB</Text>
              </View>
            </View>
          </View>

          {/* Kolom Tengah: Jam Analog Real-Time + Kapsul Sholat Berikutnya + Tanggal */}
          <View style={styles.heroCenterWrapper}>
            <View style={styles.clockAndPillRow}>
              {/* Jam Analog Berputar Nyata 356px (SVG Murni) */}
              <View style={styles.analogClockCircle}>
                <AnalogClockSVG
                  hours={liveHours}
                  minutes={liveMinutes}
                  seconds={liveSeconds}
                />
              </View>

              {/* Kapsul Hijau Zamrud Waktu Sholat Berikutnya (860px x 286px) */}
              <View style={styles.nextPrayerPill}>
                {/* Siluet Bukit & Palem di dalam Kapsul */}
                <Svg
                  width="860"
                  height="286"
                  viewBox="0 0 860 286"
                  style={styles.capsuleArtSvg}
                  pointerEvents="none"
                >
                  <Path
                    d="M860,0 Q720,20 680,120 Q750,70 860,60 Z M860,40 Q760,70 720,160 Q790,110 860,100 Z"
                    fill="#041B10"
                    opacity="0.85"
                  />
                  <Path
                    d="M320,286 Q540,210 740,250 Q800,260 860,286 Z"
                    fill="#041B10"
                    opacity="0.9"
                  />
                </Svg>

                <View style={styles.capsuleContent}>
                  {/* Baris 1: Ikon Emas + Nama Sholat Berikutnya */}
                  <View style={styles.heroPrayerNameRow}>
                    <MaghribHeroIcon />
                    <Text style={styles.heroPrayerNameText}>{nextName}</Text>
                  </View>

                  {/* Baris 2: Jam Sholat (24 Jam) + Hitung Mundur Live */}
                  <View style={styles.heroPrayerTimeRow}>
                    <Text style={styles.heroPrayerTimeText}>{nextTime} WIB</Text>
                    <Text style={styles.heroCountdownText}>{nextCountdown}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tanggal Hijriyah & Masehi Bahasa Indonesia */}
            <View style={styles.heroDatesBlock}>
              <Text style={styles.hijriDateText}>{hijriDate}</Text>
              <Text style={styles.gregorianDateText}>{gregorianDate}</Text>
            </View>
          </View>

          {/* Kolom Kanan: Kotak Infaq QRIS Musholla Al-Muttaqin */}
          <View style={styles.qrColumn}>
            <View style={styles.qrCard}>
              <Image
                source={require('../../assets/qris-square.png')}
                style={styles.qrImg}
                resizeMode="contain"
              />
            </View>
            <View style={styles.qrCaptionWrap}>
              <Text style={styles.qrCaptionLine}>Infaq & Sedekah Mushola</Text>
              <Text style={styles.qrCaptionLine}>Scan QRIS (GoPay / Semua Bank)</Text>
            </View>
          </View>
        </View>

        {/* ================= LAYER 3: ZONA 5 KARTU WAKTU SHOLAT ================= */}
        <View style={styles.prayerGrid}>
          {prayerCardsData.map((card) => {
            const isActive = card.isActive;
            return (
              <View
                key={card.key}
                style={[
                  styles.prayerCard,
                  isActive && styles.prayerCardActive,
                ]}
              >
                {/* Floating Pill Header di Atas Tengah Kartu */}
                <View style={styles.floatingPill}>
                  {card.icon}
                  <Text style={styles.floatingPillTitle}>{card.name}</Text>
                </View>

                {/* Isi Kartu (Adzan & Iqomah Bahasa Indonesia Format 24 Jam) */}
                <View style={styles.prayerCardContent}>
                  {/* Blok Adzan */}
                  <View style={styles.prayerTimeGroup}>
                    <Text
                      style={[
                        styles.prayerLabelText,
                        isActive && styles.prayerLabelTextActive,
                      ]}
                    >
                      Adzan
                    </Text>
                    <View style={styles.prayerTimeRow}>
                      <Text
                        style={[
                          styles.prayerAdhanTimeNum,
                          isActive && styles.prayerTimeNumActive,
                        ]}
                      >
                        {card.timeAdzan}
                      </Text>
                      <Text
                        style={[
                          styles.prayerAdhanTimeAmPm,
                          isActive && styles.prayerTimeAmPmActive,
                        ]}
                      >
                        WIB
                      </Text>
                    </View>
                  </View>

                  {/* Blok Iqomah (Hirarki Jam Terbesar 66px Bold) */}
                  <View style={styles.prayerTimeGroup}>
                    <Text
                      style={[
                        styles.prayerLabelText,
                        isActive && styles.prayerLabelTextActive,
                      ]}
                    >
                      Iqomah
                    </Text>
                    <View style={styles.prayerTimeRow}>
                      <Text
                        style={[
                          styles.prayerIqamahTimeNum,
                          isActive && styles.prayerTimeNumActive,
                        ]}
                      >
                        {card.timeIqomah}
                      </Text>
                      <Text
                        style={[
                          styles.prayerIqamahTimeAmPm,
                          isActive && styles.prayerTimeAmPmActive,
                        ]}
                      >
                        WIB
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewportOuter: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#DBEAE5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  canvas1080p: {
    width: 1920,
    height: 1080,
    backgroundColor: '#DBEAE5',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 34,
    justifyContent: 'space-between',
  },
  imageBackgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  svgBackgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  /* ================= ZONE 1: TOP HEADER BAR ================= */
  tvHeader: {
    height: 96,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mosqueAvatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mosqueAvatarImg: {
    width: 104,
    height: 104,
  },
  mosqueTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3834',
    letterSpacing: -0.3,
  },
  mosqueSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  sunriseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 10,
  },
  sunriseLabel: {
    fontSize: 27,
    fontWeight: '500',
    color: '#8F9995',
  },
  sunriseTimeNum: {
    fontSize: 38,
    fontWeight: '700',
    color: '#2D3834',
    fontVariant: ['tabular-nums'],
  },
  sunriseTimeAmPm: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8F9995',
    marginLeft: 6,
  },
  exitTvBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  /* ================= ZONE 2: MIDDLE HERO SECTION ================= */
  tvHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 470,
    zIndex: 10,
    marginTop: 10,
  },

  /* Left: Kartu Sholat Jumat */
  jumuahCard: {
    width: 310,
    height: 326,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 30,
    shadowColor: '#1C3E32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  jumuahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  jumuahTitle: {
    fontSize: 30,
    fontWeight: '600',
    color: '#3D403E',
  },
  jumuahTimeGroup: {
    alignItems: 'flex-start',
  },
  jumuahTimeLabel: {
    fontSize: 25,
    fontWeight: '500',
    color: '#8F9492',
    marginBottom: 2,
  },
  jumuahTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  jumuahTimeAthanNum: {
    fontSize: 46,
    fontWeight: '700',
    color: '#3D403E',
    fontVariant: ['tabular-nums'],
  },
  jumuahTimeAthanAmPm: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8F9492',
    marginLeft: 6,
  },
  jumuahTimeIqamahNum: {
    fontSize: 50,
    fontWeight: '700',
    color: '#3D403E',
    fontVariant: ['tabular-nums'],
  },
  jumuahTimeIqamahAmPm: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8F9492',
    marginLeft: 6,
  },

  /* Center: Jam Analog + Kapsul + Tanggal */
  heroCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockAndPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analogClockCircle: {
    width: 356,
    height: 356,
    borderRadius: 178,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Kapsul Hijau Zamrud Sholat Berikutnya */
  nextPrayerPill: {
    width: 860,
    height: 286,
    backgroundColor: '#0D3723',
    borderTopRightRadius: 72,
    borderBottomRightRadius: 72,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginLeft: -178, // Overlap jam analog
    paddingTop: 36,
    paddingBottom: 36,
    paddingRight: 56,
    paddingLeft: 210, // Memberi ruang bagi jam analog
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  capsuleArtSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  capsuleContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  heroPrayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 24,
  },
  heroPrayerNameText: {
    fontSize: 50,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroPrayerTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 22,
  },
  heroPrayerTimeText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  heroCountdownText: {
    fontSize: 46,
    fontWeight: '500',
    color: '#C8B55B',
    fontVariant: ['tabular-nums'],
  },

  /* Tanggal Di Bawah Kapsul */
  heroDatesBlock: {
    marginTop: 24,
    alignItems: 'center',
    marginLeft: 32,
  },
  hijriDateText: {
    fontSize: 33,
    fontWeight: '600',
    color: '#3A4642',
    lineHeight: 44,
  },
  gregorianDateText: {
    fontSize: 33,
    fontWeight: '600',
    color: '#3A4642',
    marginTop: 4,
  },

  /* Right: QR Code Column */
  qrColumn: {
    alignItems: 'center',
  },
  qrCard: {
    width: 296,
    height: 296,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#1C3E32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImg: {
    width: '100%',
    height: '100%',
  },
  qrCaptionWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  qrCaptionLine: {
    fontSize: 21,
    fontWeight: '700',
    color: '#4A5551',
    lineHeight: 28,
    textAlign: 'center',
  },

  /* ================= ZONE 3: BOTTOM 5-PRAYER GRID ================= */
  prayerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 46,
    marginTop: 42,
    height: 356,
    zIndex: 10,
  },
  prayerCard: {
    flex: 1,
    maxWidth: 330,
    height: 356,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingTop: 62,
    paddingBottom: 30,
    paddingHorizontal: 34,
    borderWidth: 3.5,
    borderColor: 'transparent',
    shadowColor: '#1C3E32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
    position: 'relative',
    justifyContent: 'space-between',
  },
  prayerCardActive: {
    borderColor: '#E5B96F',
    shadowColor: '#E5B96F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 8,
  },
  floatingPill: {
    position: 'absolute',
    top: -39,
    left: '50%',
    transform: [{ translateX: -112 }],
    width: 224,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#EFE9C8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 5,
  },
  floatingPillTitle: {
    fontSize: 31,
    fontWeight: '600',
    color: '#3D403E',
  },
  prayerCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  prayerTimeGroup: {
    alignItems: 'flex-start',
  },
  prayerLabelText: {
    fontSize: 27,
    fontWeight: '500',
    color: '#A2A6A4',
    marginBottom: 2,
  },
  prayerLabelTextActive: {
    color: '#5A5D5B',
  },
  prayerTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  prayerAdhanTimeNum: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3D403E',
    fontVariant: ['tabular-nums'],
  },
  prayerAdhanTimeAmPm: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8F9492',
    marginLeft: 6,
  },
  prayerIqamahTimeNum: {
    fontSize: 66, // Hirarki Terbesar di Kartu Sholat (66px Bold)
    fontWeight: '700',
    color: '#3D403E',
    fontVariant: ['tabular-nums'],
  },
  prayerIqamahTimeAmPm: {
    fontSize: 26,
    fontWeight: '700',
    color: '#8F9492',
    marginLeft: 8,
  },
  prayerTimeNumActive: {
    color: '#E09B3E',
  },
  prayerTimeAmPmActive: {
    color: '#E09B3E',
  },
});
