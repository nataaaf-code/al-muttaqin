import { PrayerTimeSchedule } from '../types';

export interface NextPrayerInfo {
  name: string;
  time: string;
  remainingMinutes: number;
  remainingSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedCountdown: string;
  compactCountdown: string;
}

export interface KemenagPrayerResponse {
  cityId: string;
  cityName: string;
  provinceName: string;
  source: string;
  schedules: PrayerTimeSchedule[];
  nextPrayer: NextPrayerInfo;
  isLiveKemenag: boolean;
  dateStr: string;
}

export interface CityOption {
  id: string;
  name: string;
  province: string;
}

export const POPULAR_CITIES: CityOption[] = [
  { id: '1104', name: 'Kab. Tangerang (Rajeg)', province: 'Banten' },
  { id: '1107', name: 'Kota Tangerang', province: 'Banten' },
  { id: '1108', name: 'Kota Tangerang Selatan', province: 'Banten' },
  { id: '1301', name: 'Kota Jakarta', province: 'DKI Jakarta' },
  { id: '1203', name: 'Kab. Bekasi', province: 'Jawa Barat' },
  { id: '1221', name: 'Kota Bekasi', province: 'Jawa Barat' },
  { id: '1204', name: 'Kab. Bogor', province: 'Jawa Barat' },
  { id: '1222', name: 'Kota Depok', province: 'Jawa Barat' },
  { id: '1219', name: 'Kota Bogor', province: 'Jawa Barat' },
  { id: '1206', name: 'Kota Bandung', province: 'Jawa Barat' },
  { id: '1433', name: 'Kota Semarang', province: 'Jawa Tengah' },
  { id: '1505', name: 'Kota Yogyakarta', province: 'D.I. Yogyakarta' },
  { id: '1638', name: 'Kota Surabaya', province: 'Jawa Timur' },
];

/**
 * Parsing waktu "HH:mm" menjadi total detik sejak jam 00:00
 */
function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 3600 + (m || 0) * 60;
}

/**
 * Dapatkan jam, menit, dan detik saat ini dalam zona waktu WIB (Asia/Jakarta)
 * Memastikan perhitungan jadwal sholat selalu sinkron dengan waktu lokal Indonesia
 */
export function getWibTime(baseDate: Date = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(baseDate);
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    for (const part of parts) {
      if (part.type === 'hour') hours = parseInt(part.value, 10);
      if (part.type === 'minute') minutes = parseInt(part.value, 10);
      if (part.type === 'second') seconds = parseInt(part.value, 10);
    }
    if (hours === 24) hours = 0;
    return {
      hours,
      minutes,
      seconds,
      totalSeconds: hours * 3600 + minutes * 60 + seconds,
    };
  } catch {
    const h = baseDate.getHours();
    const m = baseDate.getMinutes();
    const s = baseDate.getSeconds();
    return {
      hours: h,
      minutes: m,
      seconds: s,
      totalSeconds: h * 3600 + m * 60 + s,
    };
  }
}

/**
 * Menghitung sholat berikutnya dan hitung mundur waktu tersisa (countdown per detik)
 */
export function calculateNextPrayer(
  rawTimes: Record<string, string>,
  now: Date = new Date()
): { schedules: PrayerTimeSchedule[]; nextPrayer: NextPrayerInfo } {
  const { totalSeconds: currentTotalSecs } = getWibTime(now);

  let nextName = 'Subuh (Besok)';
  let nextTimeStr = rawTimes['Subuh'] || '04:13';
  let minDiffSecs = -1;

  const schedules: PrayerTimeSchedule[] = Object.entries(rawTimes).map(([name, timeStr]) => {
    const prayerTotalSecs = parseTimeToSeconds(timeStr);
    const isPassed = currentTotalSecs >= prayerTotalSecs;

    if (!isPassed) {
      const diff = prayerTotalSecs - currentTotalSecs;
      if (minDiffSecs === -1 || diff < minDiffSecs) {
        minDiffSecs = diff;
        nextName = name;
        nextTimeStr = timeStr;
      }
    }

    return {
      name: name as PrayerTimeSchedule['name'],
      time: timeStr,
      isPassed,
      isNext: false,
    };
  });

  // Jika seluruh waktu sholat hari ini telah terlewati (misal sudah lewat Isya)
  // Hitung mundur menuju Subuh esok hari secara presisi
  if (minDiffSecs === -1) {
    nextName = 'Subuh (Besok)';
    nextTimeStr = rawTimes['Subuh'] || '04:13';
    const subuhSecs = parseTimeToSeconds(nextTimeStr);
    // Sisa detik hari ini sampai jam 24:00 (tengah malam) + detik Subuh esok hari
    const remainingToday = Math.max(0, 86400 - currentTotalSecs);
    minDiffSecs = remainingToday + subuhSecs;
  }

  // Tandai node jadwal mana yang merupakan sholat berikutnya
  schedules.forEach((s) => {
    if (s.name === nextName || (nextName.startsWith(s.name) && nextName.includes('Besok'))) {
      s.isNext = true;
    }
  });

  const hoursRemaining = Math.floor(minDiffSecs / 3600);
  const minutesRemaining = Math.floor((minDiffSecs % 3600) / 60);
  const secondsRemaining = minDiffSecs % 60;

  const formattedCountdown =
    hoursRemaining > 0
      ? `${hoursRemaining} jam ${minutesRemaining} mnt ${secondsRemaining} dtk`
      : `${minutesRemaining} mnt ${secondsRemaining} dtk`;

  const compactCountdown =
    hoursRemaining > 0
      ? `${hoursRemaining}j ${minutesRemaining}m ${secondsRemaining}d`
      : `${minutesRemaining}m ${secondsRemaining}d`;

  return {
    schedules,
    nextPrayer: {
      name: nextName,
      time: nextTimeStr,
      remainingMinutes: Math.floor(minDiffSecs / 60),
      remainingSeconds: minDiffSecs,
      hours: hoursRemaining,
      minutes: minutesRemaining,
      seconds: secondsRemaining,
      formattedCountdown,
      compactCountdown,
    },
  };
}

/**
 * Jadwal astronomis offline fallback jika koneksi internet terputus
 * Berdasarkan hisab wilayah Kabupaten Tangerang (Rajeg, Banten)
 */
export function getOfflineFallbackTimes(now: Date = new Date()): Record<string, string> {
  return {
    Imsak: '04:03',
    Subuh: '04:13',
    Terbit: '05:27',
    Dzuhur: '11:42',
    Ashar: '14:52',
    Maghrib: '17:50',
    Isya: '19:00',
  };
}

/**
 * Fetch jadwal sholat resmi dari Bimas Islam Kemenag RI (bimaislam.kemenag.go.id)
 * Menggunakan direct endpoint mirror Bimas Islam Kemenag
 * Default ke ID 1104 (KAB. TANGERANG / Rajeg)
 */
export async function fetchKemenagPrayerSchedule(
  cityId: string = '1104',
  now: Date = new Date()
): Promise<KemenagPrayerResponse> {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  try {
    const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.status && json.data && json.data.jadwal) {
      const j = json.data.jadwal;
      const rawTimes: Record<string, string> = {
        Imsak: j.imsak,
        Subuh: j.subuh,
        Terbit: j.terbit,
        Dzuhur: j.dzuhur,
        Ashar: j.ashar,
        Maghrib: j.maghrib,
        Isya: j.isya,
      };

      const { schedules, nextPrayer } = calculateNextPrayer(rawTimes, now);

      return {
        cityId,
        cityName: json.data.lokasi || 'KAB. TANGERANG',
        provinceName: json.data.daerah || 'BANTEN',
        source: 'Bimas Islam Kemenag RI (bimaislam.kemenag.go.id)',
        schedules,
        nextPrayer,
        isLiveKemenag: true,
        dateStr: j.tanggal || now.toISOString(),
      };
    }
  } catch (err) {
    console.warn('Gagal mengambil jadwal Kemenag online, menggunakan fallback:', err);
  }

  // Fallback
  const fallbackRaw = getOfflineFallbackTimes(now);
  const { schedules, nextPrayer } = calculateNextPrayer(fallbackRaw, now);

  return {
    cityId,
    cityName: 'Kab. Tangerang (Rajeg - Mode Offline)',
    provinceName: 'Banten',
    source: 'Bimas Islam Kemenag RI (Offline Cache)',
    schedules,
    nextPrayer,
    isLiveKemenag: false,
    dateStr: now.toISOString(),
  };
}

/**
 * Synchronous helper untuk komponen lokal yang membutuhkan render instan
 */
export function getDailyPrayerTimes(now: Date = new Date()) {
  const raw = getOfflineFallbackTimes(now);
  return calculateNextPrayer(raw, now);
}
