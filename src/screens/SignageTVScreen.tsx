import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { formatDateIndo, getEstimatedHijriDate } from '../utils/formatters';
import { getWibTime } from '../services/prayerService';
import { MUSHOLA_INFO } from '../store/mockData';

// Helper: Tambah menit ke format waktu "HH:mm"
function addMinutesToTime(timeStr: string, addMins: number): string {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  const totalM = (h || 0) * 60 + (m || 0) + addMins;
  const newH = Math.floor(totalM / 60) % 24;
  const newM = totalM % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

// Komponen Jam Analog Presisi dengan Jarum Jam, Menit, dan Detik Bergerak
function AnalogClock({
  size = 140,
  hours,
  minutes,
  seconds,
}: {
  size?: number;
  hours: number;
  minutes: number;
  seconds: number;
}) {
  const center = size / 2;
  const r = center - 13;

  const numbers = [
    { n: 12, x: center, y: center - r },
    { n: 1, x: center + r * Math.sin((30 * Math.PI) / 180), y: center - r * Math.cos((30 * Math.PI) / 180) },
    { n: 2, x: center + r * Math.sin((60 * Math.PI) / 180), y: center - r * Math.cos((60 * Math.PI) / 180) },
    { n: 3, x: center + r, y: center },
    { n: 4, x: center + r * Math.sin((120 * Math.PI) / 180), y: center - r * Math.cos((120 * Math.PI) / 180) },
    { n: 5, x: center + r * Math.sin((150 * Math.PI) / 180), y: center - r * Math.cos((150 * Math.PI) / 180) },
    { n: 6, x: center, y: center + r },
    { n: 7, x: center + r * Math.sin((210 * Math.PI) / 180), y: center - r * Math.cos((210 * Math.PI) / 180) },
    { n: 8, x: center + r * Math.sin((240 * Math.PI) / 180), y: center - r * Math.cos((240 * Math.PI) / 180) },
    { n: 9, x: center - r, y: center },
    { n: 10, x: center + r * Math.sin((300 * Math.PI) / 180), y: center - r * Math.cos((300 * Math.PI) / 180) },
    { n: 11, x: center + r * Math.sin((330 * Math.PI) / 180), y: center - r * Math.cos((330 * Math.PI) / 180) },
  ];

  const hourAngle = ((hours % 12) + minutes / 60 + seconds / 3600) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const hourHandLength = size * 0.28;
  const minuteHandLength = size * 0.38;
  const secondHandLength = size * 0.42;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFFFFF',
        borderWidth: 3.5,
        borderColor: '#064E3B',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      {/* Angka Jam 1 - 12 */}
      {numbers.map(({ n, x, y }) => (
        <Text
          key={n}
          style={{
            position: 'absolute',
            left: x - 8,
            top: y - 7,
            width: 16,
            height: 14,
            textAlign: 'center',
            fontSize: size > 130 ? 10 : 8.5,
            fontWeight: '800',
            color: '#1E293B',
          }}
        >
          {n}
        </Text>
      ))}

      {/* Jarum Jam */}
      <View
        style={{
          position: 'absolute',
          top: center - hourHandLength,
          left: center - 2.5,
          width: 5,
          height: hourHandLength * 2,
          alignItems: 'center',
          transform: [{ rotate: `${hourAngle}deg` }],
        }}
      >
        <View
          style={{
            width: 5,
            height: hourHandLength,
            backgroundColor: '#0F172A',
            borderRadius: 3,
          }}
        />
      </View>

      {/* Jarum Menit */}
      <View
        style={{
          position: 'absolute',
          top: center - minuteHandLength,
          left: center - 1.5,
          width: 3,
          height: minuteHandLength * 2,
          alignItems: 'center',
          transform: [{ rotate: `${minuteAngle}deg` }],
        }}
      >
        <View
          style={{
            width: 3,
            height: minuteHandLength,
            backgroundColor: '#0F172A',
            borderRadius: 2,
          }}
        />
      </View>

      {/* Jarum Detik */}
      <View
        style={{
          position: 'absolute',
          top: center - secondHandLength,
          left: center - 1,
          width: 2,
          height: secondHandLength * 2,
          alignItems: 'center',
          transform: [{ rotate: `${secondAngle}deg` }],
        }}
      >
        <View
          style={{
            width: 2,
            height: secondHandLength,
            backgroundColor: '#DC2626',
            borderRadius: 1,
          }}
        />
      </View>

      {/* Titik Poros Tengah */}
      <View
        style={{
          position: 'absolute',
          top: center - 4.5,
          left: center - 4.5,
          width: 9,
          height: 9,
          borderRadius: 4.5,
          backgroundColor: '#064E3B',
          borderWidth: 1.5,
          borderColor: '#FBBF24',
        }}
      />
    </View>
  );
}

// Background Foto Masjid Nabawi dengan Opacity Diturunkan & Tint Islami Elegan
function MasjidNabawiBackground() {
  return (
    <View style={styles.nabawiBgContainer} pointerEvents="none">
      <Image
        source={require('../../assets/masjid-nabawi-bg.jpg')}
        style={styles.nabawiBgImage as any}
        resizeMode="cover"
      />
      {/* Overlay atmosferik agar teks & kartu kontras sempurna */}
      <View style={styles.nabawiTintOverlay} />
      <View style={styles.nabawiBottomVignette} />
    </View>
  );
}

export function SignageTVScreen() {
  const { signageConfig, setIsSignageMode, prayerData } = useMushola();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Mode orientasi: 'AUTO', 'LANDSCAPE', 'PORTRAIT'
  const [forcedOrientation, setForcedOrientation] = useState<'AUTO' | 'LANDSCAPE' | 'PORTRAIT'>('AUTO');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isPortraitMode =
    forcedOrientation === 'PORTRAIT' ||
    (forcedOrientation === 'AUTO' && windowWidth < 768 && windowWidth < windowHeight);

  // Waktu WIB Presisi
  const wib = getWibTime(currentTime);

  // Format Countdown (-HH:MM:SS)
  const pad = (n: number) => n.toString().padStart(2, '0');
  const countdownTimerString = `-${pad(prayerData.nextPrayer.hours)}:${pad(
    prayerData.nextPrayer.minutes
  )}:${pad(prayerData.nextPrayer.seconds)}`;

  // Ambil waktu masing-masing sholat dari schedules
  const getTime = (name: string, fallback: string) =>
    prayerData.schedules.find((s) => s.name === name)?.time || fallback;

  const imsakTime = getTime('Imsak', '04:03');
  const subuhTime = getTime('Subuh', '04:13');
  const terbitTime = getTime('Terbit', '05:27');
  const dzuhurTime = getTime('Dzuhur', '11:42');
  const asharTime = getTime('Ashar', '14:52');
  const maghribTime = getTime('Maghrib', '17:50');
  const isyaTime = getTime('Isya', '19:00');

  // Waktu Iqomah standar (jeda setelah adzan)
  const subuhIqamah = addMinutesToTime(subuhTime, 12);
  const dzuhurIqamah = addMinutesToTime(dzuhurTime, 10);
  const asharIqamah = addMinutesToTime(asharTime, 10);
  const maghribIqamah = addMinutesToTime(maghribTime, 8);
  const isyaIqamah = addMinutesToTime(isyaTime, 10);
  const jumuahIqamah = addMinutesToTime(dzuhurTime, 18); // Khutbah & Sholat Jumat

  // Highlight status aktif
  const nextName = prayerData.nextPrayer.name;
  const isSubuhActive = nextName.includes('Subuh');
  const isDzuhurActive = nextName.includes('Dzuhur');
  const isAsharActive = nextName.includes('Ashar');
  const isMaghribActive = nextName.includes('Maghrib');
  const isIsyaActive = nextName.includes('Isya');

  // Daftar 5 Sholat Fardhu
  const fardhuCards = [
    {
      name: 'Fajr',
      subName: 'Subuh',
      icon: 'sunny-outline',
      athan: subuhTime,
      iqamah: subuhIqamah,
      isActive: isSubuhActive,
      isBesok: isSubuhActive && nextName.includes('Besok'),
    },
    {
      name: 'Dhuhr',
      subName: 'Dzuhur',
      icon: 'sunny',
      athan: dzuhurTime,
      iqamah: dzuhurIqamah,
      isActive: isDzuhurActive,
      isBesok: false,
    },
    {
      name: 'Asr',
      subName: 'Ashar',
      icon: 'partly-sunny-outline',
      athan: asharTime,
      iqamah: asharIqamah,
      isActive: isAsharActive,
      isBesok: false,
    },
    {
      name: 'Maghrib',
      subName: 'Maghrib',
      icon: 'partly-sunny',
      athan: maghribTime,
      iqamah: maghribIqamah,
      isActive: isMaghribActive,
      isBesok: false,
    },
    {
      name: 'Isha',
      subName: 'Isya',
      icon: 'moon',
      athan: isyaTime,
      iqamah: isyaIqamah,
      isActive: isIsyaActive,
      isBesok: false,
    },
  ];

  const handleToggleFullscreen = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <View style={styles.tvRoot}>
      {/* Background Foto Masjid Nabawi dengan Opacity Elegan */}
      <MasjidNabawiBackground />

      {/* Top Floating Action Bar (Controls & Switchers) */}
      <View style={styles.topControlBar}>
        <View style={styles.controlPillGroup}>
          <TouchableOpacity
            style={[styles.controlPill, !isPortraitMode && styles.controlPillActive]}
            onPress={() => setForcedOrientation('LANDSCAPE')}
          >
            <Ionicons name="tv-outline" size={13} color={!isPortraitMode ? '#047857' : '#64748B'} />
            <Text style={[styles.controlPillText, !isPortraitMode && styles.controlPillTextActive]}>
              Landscape (16:9)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlPill, isPortraitMode && styles.controlPillActive]}
            onPress={() => setForcedOrientation('PORTRAIT')}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={13}
              color={isPortraitMode ? '#047857' : '#64748B'}
            />
            <Text style={[styles.controlPillText, isPortraitMode && styles.controlPillTextActive]}>
              Portrait (9:16)
            </Text>
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <TouchableOpacity style={styles.controlPill} onPress={handleToggleFullscreen}>
              <Ionicons name={isFullscreen ? 'contract-outline' : 'expand-outline'} size={13} color="#047857" />
              <Text style={styles.controlPillText}>{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.closeTvBtn} onPress={() => setIsSignageMode(false)}>
          <Ionicons name="close" size={16} color="#FFFFFF" />
          <Text style={styles.closeTvText}>Tutup Mode TV</Text>
        </TouchableOpacity>
      </View>

      {/* Tampilan Sesuai Orientasi */}
      {!isPortraitMode ? (
        /* ========================================================================= */
        /* ======================== MODE TV LANDSCAPE (16:9) ======================= */
        /* ========================================================================= */
        <View style={styles.landscapeContainer}>
          {/* Top Bar: Mosque Branding & Sunrise Indicator */}
          <View style={styles.landscapeTopHeader}>
            <View style={styles.brandingRow}>
              <View style={styles.mosqueLogoCircle}>
                <Ionicons name="moon" size={18} color="#047857" />
              </View>
              <View>
                <Text style={styles.brandTitleText}>{MUSHOLA_INFO.name}</Text>
                <Text style={styles.brandSubtitleText}>
                  Perumahan Mutiara Puri Harmoni Blok H, Rajeg, Kab. Tangerang • Bimas Islam Kemenag RI
                </Text>
              </View>
            </View>

            <View style={styles.sunriseBadgePill}>
              <Ionicons name="partly-sunny" size={16} color="#D97706" />
              <Text style={styles.sunriseBadgeLabel}>Sunrise / Terbit</Text>
              <Text style={styles.sunriseBadgeTime}>{terbitTime} WIB</Text>
            </View>
          </View>

          {/* Middle Upper Section (3 Columns: Jumu'ah, Center Hero Clock+Capsule, QRIS) */}
          <View style={styles.landscapeMiddleRow}>
            {/* Left Card: Jumu'ah Card */}
            <View style={styles.jumuahCardBox}>
              <View style={styles.jumuahTopPill}>
                <Ionicons name="sunny" size={14} color="#D97706" />
                <Text style={styles.jumuahTopPillText}>Jumu'ah</Text>
              </View>

              <View style={styles.jumuahTimesBody}>
                <View style={styles.jumuahTimeItem}>
                  <Text style={styles.jumuahTimeLabel}>Athan / Adzan</Text>
                  <Text style={styles.jumuahTimeValue}>{dzuhurTime}</Text>
                </View>

                <View style={styles.jumuahTimeItem}>
                  <Text style={styles.jumuahTimeLabel}>Iqamah / Khutbah</Text>
                  <Text style={styles.jumuahTimeValue}>{jumuahIqamah}</Text>
                </View>
              </View>

              <Text style={styles.jumuahFootnote}>Dr. H. Zulkifli Rahman • Ust. M. Ilham</Text>
            </View>

            {/* Center: Analog Clock + Active Capsule + Dates */}
            <View style={styles.centerHeroBox}>
              <View style={styles.clockWithCapsuleRow}>
                {/* Analog Clock */}
                <AnalogClock
                  size={142}
                  hours={wib.hours}
                  minutes={wib.minutes}
                  seconds={wib.seconds}
                />

                {/* Connected Dark Green Capsule */}
                <View style={styles.activeCapsule}>
                  <View style={styles.capsuleTopLine}>
                    <Ionicons
                      name={
                        nextName.toLowerCase().includes('maghrib') ||
                        nextName.toLowerCase().includes('isya') ||
                        nextName.toLowerCase().includes('subuh')
                          ? 'moon'
                          : 'sunny'
                      }
                      size={18}
                      color="#FBBF24"
                    />
                    <Text style={styles.capsulePrayerTitle}>{nextName}</Text>
                  </View>

                  <View style={styles.capsuleTimeLine}>
                    <Text style={styles.capsuleTimeValue}>{prayerData.nextPrayer.time} WIB</Text>
                    <Text style={styles.capsuleCountdownValue}>({countdownTimerString})</Text>
                  </View>
                </View>
              </View>

              {/* Date Labels Underneath */}
              <View style={styles.heroDatesGroup}>
                <Text style={styles.hijriDateBigText}>{getEstimatedHijriDate(currentTime)}</Text>
                <Text style={styles.gregorianDateSubText}>
                  {formatDateIndo(currentTime.toISOString())}
                </Text>
              </View>
            </View>

            {/* Right Card: QRIS Infaq Code Card */}
            <View style={styles.qrisCardBox}>
              <View style={styles.qrisBadgeHeader}>
                <Text style={styles.qrisRedText}>QRIS</Text>
                <Text style={styles.qrisSubBadge}>GOPAY MERCHANT</Text>
              </View>

              <View style={styles.qrisCodeImageWrapper}>
                <Image
                  source={require('../../assets/qris-square.png')}
                  style={styles.qrisImageStyle as any}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.qrisStayConnectedText}>Infaq Digital QRIS</Text>
              <Text style={styles.qrisMerchantSub}>
                {MUSHOLA_INFO.qris.merchantName}
              </Text>
              <Text style={styles.qrisNmidTiny}>NMID: {MUSHOLA_INFO.qris.nmid}</Text>
              <Text style={styles.qrisScanTip}>Bebas Nominal • Scan m-Banking & GoPay</Text>
            </View>
          </View>

          {/* Bottom Row: 5 Fardhu Prayer Cards */}
          <View style={styles.landscapeFardhuRow}>
            {fardhuCards.map((card, idx) => (
              <View
                key={idx}
                style={[
                  styles.fardhuCard,
                  card.isActive && styles.fardhuCardActive,
                ]}
              >
                {/* Top Notch Badge */}
                <View
                  style={[
                    styles.fardhuCardBadge,
                    card.isActive && styles.fardhuCardBadgeActive,
                  ]}
                >
                  <Ionicons
                    name={card.icon as any}
                    size={14}
                    color={card.isActive ? '#B45309' : '#D97706'}
                  />
                  <Text
                    style={[
                      styles.fardhuCardBadgeText,
                      card.isActive && styles.fardhuCardBadgeTextActive,
                    ]}
                  >
                    {card.name} {card.isBesok ? '(Besok)' : ''}
                  </Text>
                </View>

                {/* Times Content */}
                <View style={styles.fardhuCardBody}>
                  <View style={styles.fardhuTimeRow}>
                    <Text style={styles.fardhuTimeLabel}>Athan</Text>
                    <Text
                      style={[
                        styles.fardhuTimeNumber,
                        card.isActive && styles.fardhuTimeNumberActive,
                      ]}
                    >
                      {card.athan}
                    </Text>
                  </View>

                  <View style={styles.fardhuTimeRow}>
                    <Text style={styles.fardhuTimeLabel}>Iqamah</Text>
                    <Text
                      style={[
                        styles.fardhuTimeNumber,
                        card.isActive && styles.fardhuTimeNumberActive,
                      ]}
                    >
                      {card.iqamah}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        /* ========================================================================= */
        /* ======================== MODE TV PORTRAIT (9:16) ======================== */
        /* ========================================================================= */
        <ScrollView style={styles.portraitScrollView} contentContainerStyle={styles.portraitContent}>
          {/* Header */}
          <View style={styles.portraitHeader}>
            <View style={styles.mosqueLogoCircle}>
              <Ionicons name="moon" size={16} color="#047857" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.portraitBrandTitle}>{MUSHOLA_INFO.name}</Text>
              <Text style={styles.portraitBrandSub}>Rajeg, Kab. Tangerang</Text>
            </View>
          </View>

          {/* Clock & Capsule Hero in Portrait */}
          <View style={styles.portraitHeroClockBox}>
            <View style={styles.portraitClockRow}>
              <AnalogClock
                size={110}
                hours={wib.hours}
                minutes={wib.minutes}
                seconds={wib.seconds}
              />
              <View style={styles.portraitActiveCapsule}>
                <View style={styles.capsuleTopLine}>
                  <Ionicons name="moon" size={15} color="#FBBF24" />
                  <Text style={styles.portraitCapsuleName}>{nextName}</Text>
                </View>
                <Text style={styles.portraitCapsuleTime}>{prayerData.nextPrayer.time} WIB</Text>
                <Text style={styles.portraitCapsuleCountdown}>({countdownTimerString})</Text>
              </View>
            </View>

            {/* Dates Bar */}
            <View style={styles.portraitDatesBar}>
              <Text style={styles.portraitHijriText}>{getEstimatedHijriDate(currentTime)}</Text>
              <Text style={styles.portraitGregorianText}>
                {formatDateIndo(currentTime.toISOString())}
              </Text>
            </View>

            {/* Sunrise & Sunset Indicator */}
            <View style={styles.portraitSunBar}>
              <View style={styles.sunItem}>
                <Ionicons name="sunny-outline" size={14} color="#D97706" />
                <Text style={styles.sunLabel}>Sunrise: {terbitTime} WIB</Text>
              </View>
              <View style={styles.sunItem}>
                <Ionicons name="partly-sunny-outline" size={14} color="#047857" />
                <Text style={styles.sunLabel}>Sunset: {maghribTime} WIB</Text>
              </View>
            </View>
          </View>

          {/* Prayer Schedule Table (Athan & Iqamah) */}
          <View style={styles.portraitTableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { flex: 1.2 }]}>WAKTU</Text>
              <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>ADZAN</Text>
              <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>IQAMAH</Text>
            </View>

            {fardhuCards.map((card, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, card.isActive && styles.tableRowActive]}
              >
                <View style={[styles.tableColPrayer, { flex: 1.2 }]}>
                  <Ionicons
                    name={card.icon as any}
                    size={14}
                    color={card.isActive ? '#FBBF24' : '#D97706'}
                  />
                  <Text style={[styles.tablePrayerName, card.isActive && styles.tableTextActive]}>
                    {card.name} {card.isBesok ? '(Bsk)' : ''}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.tableTimeText,
                    { flex: 1, textAlign: 'center' },
                    card.isActive && styles.tableTextActive,
                  ]}
                >
                  {card.athan}
                </Text>
                <Text
                  style={[
                    styles.tableTimeText,
                    { flex: 1, textAlign: 'right' },
                    card.isActive && styles.tableTextActive,
                  ]}
                >
                  {card.iqamah}
                </Text>
              </View>
            ))}

            {/* Jumu'ah Row */}
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.tableColPrayer, { flex: 1.2 }]}>
                <Ionicons name="sunny" size={14} color="#D97706" />
                <Text style={styles.tablePrayerName}>Jumu'ah</Text>
              </View>
              <Text style={[styles.tableTimeText, { flex: 1, textAlign: 'center' }]}>
                {dzuhurTime}
              </Text>
              <Text style={[styles.tableTimeText, { flex: 1, textAlign: 'right' }]}>
                {jumuahIqamah}
              </Text>
            </View>
          </View>

          {/* QRIS Infaq Box */}
          <View style={styles.portraitQrisBox}>
            <View style={styles.portraitQrisImageWrap}>
              <Image
                source={require('../../assets/qris-square.png')}
                style={styles.portraitQrisImg as any}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={styles.portraitQrisTitle}>Infaq QRIS Digital</Text>
                <View style={styles.gopayMiniPill}>
                  <Text style={styles.gopayMiniPillText}>GOPAY</Text>
                </View>
              </View>
              <Text style={styles.portraitQrisNmid}>{MUSHOLA_INFO.qris.merchantName}</Text>
              <Text style={styles.portraitQrisSub}>NMID: {MUSHOLA_INFO.qris.nmid}</Text>
              <Text style={styles.portraitQrisPrompt}>Bebas Nominal • Scan m-Banking & GoPay</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Running Text Ticker Bar at Bottom */}
      <View style={styles.bottomTickerBar}>
        <View style={styles.tickerBadge}>
          <Ionicons name="megaphone" size={13} color="#FFFFFF" />
          <Text style={styles.tickerBadgeText}>WARTA</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tickerScroll}>
          <Text style={styles.tickerContent}>{signageConfig.runningText}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tvRoot: {
    flex: 1,
    backgroundColor: '#EAF3EC',
    position: 'relative',
    overflow: 'hidden',
  },
  nabawiBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#EAF3EC',
  },
  nabawiBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.22, // Opacity diturunkan sesuai instruksi agar konten kontras & terbaca jelas
  },
  nabawiTintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(234, 243, 236, 0.42)',
  },
  nabawiBottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(234, 243, 236, 0.35)',
  },

  // Top Control Bar
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 50,
  },
  controlPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  controlPillActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  controlPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  controlPillTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  closeTvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  closeTvText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // LANDSCAPE LAYOUT
  landscapeContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  landscapeTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mosqueLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  brandSubtitleText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  sunriseBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sunriseBadgeLabel: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  sunriseBadgeTime: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '900',
  },

  // Landscape Middle Section
  landscapeMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    flex: 1,
    maxHeight: 250,
  },
  jumuahCardBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    height: 220,
    justifyContent: 'space-between',
  },
  jumuahTopPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jumuahTopPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  jumuahTimesBody: {
    gap: 8,
  },
  jumuahTimeItem: {
    gap: 2,
  },
  jumuahTimeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  jumuahTimeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  jumuahFootnote: {
    fontSize: 9.5,
    color: '#047857',
    fontWeight: '600',
  },

  // Center Hero Box (Clock + Capsule + Dates)
  centerHeroBox: {
    flex: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockWithCapsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCapsule: {
    backgroundColor: '#0A3B2C',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    marginLeft: 12,
    minWidth: 230,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  capsuleTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  capsulePrayerTitle: {
    color: '#FDE68A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  capsuleTimeLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  capsuleTimeValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  capsuleCountdownValue: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
  },
  heroDatesGroup: {
    alignItems: 'center',
    marginTop: 12,
  },
  hijriDateBigText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  gregorianDateSubText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },

  // Right QRIS Card Box
  qrisCardBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  qrisBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  qrisRedText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  qrisSubBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: '#00AED6',
    letterSpacing: 0.5,
  },
  qrisCodeImageWrapper: {
    width: 110,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  qrisImageStyle: {
    width: '100%',
    height: '100%',
  },
  qrisStayConnectedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  qrisMerchantSub: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 1,
  },
  qrisNmidTiny: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  qrisScanTip: {
    fontSize: 8,
    color: '#047857',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },

  // Landscape Bottom 5 Fardhu Cards
  landscapeFardhuRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  fardhuCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fardhuCardActive: {
    borderColor: '#F59E0B',
    borderWidth: 2.5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  fardhuCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  fardhuCardBadgeActive: {
    backgroundColor: '#FEF3C7',
  },
  fardhuCardBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  fardhuCardBadgeTextActive: {
    color: '#B45309',
  },
  fardhuCardBody: {
    width: '100%',
    gap: 8,
  },
  fardhuTimeRow: {
    alignItems: 'center',
  },
  fardhuTimeLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  fardhuTimeNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  fardhuTimeNumberActive: {
    color: '#D97706',
  },

  // PORTRAIT LAYOUT (9:16)
  portraitScrollView: {
    flex: 1,
  },
  portraitContent: {
    padding: 16,
    paddingBottom: 50,
  },
  portraitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  portraitBrandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  portraitBrandSub: {
    fontSize: 11,
    color: '#64748B',
  },
  portraitHeroClockBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  portraitClockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  portraitActiveCapsule: {
    flex: 1,
    backgroundColor: '#0A3B2C',
    borderRadius: 18,
    padding: 12,
  },
  portraitCapsuleName: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '800',
  },
  portraitCapsuleTime: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  portraitCapsuleCountdown: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  portraitDatesBar: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  portraitHijriText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  portraitGregorianText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  portraitSunBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sunLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // Portrait Table
  portraitTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  tableRowActive: {
    backgroundColor: '#0A3B2C',
    borderRadius: 10,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  tableColPrayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tablePrayerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  tableTextActive: {
    color: '#FDE68A',
  },

  // Portrait QRIS Box
  portraitQrisBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  portraitQrisImageWrap: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  portraitQrisImg: {
    width: '100%',
    height: '100%',
  },
  portraitQrisTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  gopayMiniPill: {
    backgroundColor: '#00AED6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  gopayMiniPillText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  portraitQrisNmid: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  portraitQrisSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  portraitQrisPrompt: {
    fontSize: 8.5,
    color: '#047857',
    marginTop: 4,
    fontWeight: '500',
  },

  // Bottom Ticker Bar
  bottomTickerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 40,
  },
  tickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#065F46',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  tickerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tickerScroll: {
    flex: 1,
  },
  tickerContent: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '600',
  },
});
