/**
 * Utility functions for Indonesian currency, date formatting, and Hijri calendar
 */

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateStr;
  }
}

export function formatShortDateIndo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Konversi tanggal Masehi ke perkiraan tanggal Hijriyah
 */
export function getEstimatedHijriDate(date: Date = new Date()): string {
  const hijriMonths = [
    'Muharram', 'Safar', "Rabi'ul Awwal", "Rabi'ul Akhir",
    'Jumadil Ula', 'Jumadil Akhir', 'Rajab', "Sya'ban",
    'Ramadhan', 'Syawwal', "Dzulqa'dah", 'Dzulhijjah'
  ];

  // Algoritma konversi tabular hisab
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();

  let jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 13) / 12))) / 4) +
    Math.floor((367 * (m - 1 - 12 * Math.floor((m - 13) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 13) / 12)) / 100)) / 4) +
    d - 32075;

  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) +
    (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
    (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  
  let hijriMonthIdx = Math.floor((24 * l) / 709);
  let hijriDay = l - Math.floor((709 * hijriMonthIdx) / 24);
  let hijriYear = 30 * n + j - 30;

  if (hijriMonthIdx < 0) hijriMonthIdx = 0;
  if (hijriMonthIdx > 11) hijriMonthIdx = 11;

  const monthName = hijriMonths[hijriMonthIdx] || 'Ramadhan';
  return `${hijriDay} ${monthName} ${hijriYear} H`;
}
