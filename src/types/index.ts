export type UserRole =
  | 'TAMU'              // Pengunjung publik / Belum login
  | 'JAMAAH'            // Warga / Jamaah umum
  | 'DKM'               // Pengurus DKM
  | 'BENDAHARA'         // Pengelola Keuangan
  | 'MARBOT'            // Marbot & Sie Ibadah
  | 'ADMIN'             // Administrator sistem
  | 'SUPER_ADMIN'       // Ketua DKM
  | 'BENDAHARA_DKM'     // Bendahara Utama
  | 'BENDAHARA_SUB'     // Bendahara Sub-Organisasi
  | 'SEKRETARIS'        // Pengelola Jadwal & Warta
  | 'PENGURUS_SEKSI';   // Sarpras, Dakwah, Humas

export interface UserProfile {
  id: number | string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isOnboarded: boolean;
  phone?: string;
  blokRumah?: string;
  nomorBlok?: string;
  noRumah?: string;
  rtRw?: string;
  statusWarga?: string;
  jumlahKeluarga?: number;
  pekerjaan?: string;
}

export interface OnboardingFormData {
  fullName: string;
  phone: string;
  blokRumah: string;
  nomorBlok: string;
  noRumah: string;
  rtRw: string;
  statusWarga: string;
  jumlahKeluarga: number;
  pekerjaan: string;
  catatan?: string;
}

export interface UserManagementStats {
  total: number;
  superAdmin: number;
  admin: number;
  dkm: number;
  bendahara: number;
  sarpras: number;
  jamaah: number;
  pendingOnboarding: number;
  completedOnboarding: number;
}

export interface UserManagementItem {
  id: number;
  googleId?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isOnboarded: boolean;
  phone?: string;
  blokRumah?: string;
  nomorBlok?: string;
  noRumah?: string;
  fullAddress?: string;
  rtRw?: string;
  statusWarga?: string;
  jumlahKeluarga?: number;
  pekerjaan?: string;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubOrganization {
  id: string;
  name: string;
  shortName: string;
  category: 'DKM' | 'REMAJA' | 'MAJELIS_TAKLIM' | 'PANITIA_AD_HOC' | 'TPA';
  description: string;
  leaderName: string;
  memberCount: number;
  contactPhone: string;
  color: string;
}

export interface CashPocket {
  id: string;
  subOrgId: string; // Relasi ke Sub-organisasi
  name: string;
  balance: number;
  category: 'OPERASIONAL' | 'SOSIAL_YATIM' | 'PEMBANGUNAN' | 'KEGIATAN' | 'ZAKAT';
  description: string;
  iconName: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  pocketId: string;
  subOrgId: string;
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  date: string; // ISO format YYYY-MM-DD
  receiptNumber?: string;
  recordedBy: string;
  donorName?: string;
  notes?: string;
}

export interface PrayerTimeSchedule {
  name: 'Imsak' | 'Subuh' | 'Terbit' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya';
  time: string; // e.g. "04:32"
  isPassed: boolean;
  isNext: boolean;
}

export interface EventItem {
  id: string;
  subOrgId: string;
  title: string;
  category: 'KAJIAN_AKBAR' | 'KAJIAN_RUTIN' | 'SHOLAT_JUMAT' | 'TPA' | 'KERJA_BAKTI' | 'PHBI';
  date: string;
  timeStart: string;
  timeEnd: string;
  speakerOrOfficer?: string; // Ustadz / Khotib
  theme?: string;
  location: string;
  isPublic: boolean;
  notes?: string;
}

export interface FridayOfficerSchedule {
  date: string;
  khotib: string;
  imam: string;
  muadzin: string;
  bilal: string;
  theme: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'AUDIO_ELEKTRONIK' | 'PERLENGKAPAN_IBADAH' | 'FASILITAS_UMUM' | 'PERAWATAN_JENAZAH';
  quantity: number;
  unit: string;
  condition: 'BAIK' | 'RUSAK_RINGAN' | 'PERLU_DIGANTI';
  location: string;
  isAvailableForLoan: boolean;
  notes?: string;
}

export interface JamaahResident {
  id: string;
  headOfFamily: string;
  rtRw: string;
  address: string;
  phone: string;
  memberCount: number;
  economicStatus: 'MAMPU' | 'MUSTAHIK' | 'YATIM_DHUAFA';
  notes?: string;
}

export interface SignageConfig {
  musholaName: string;
  musholaAddress: string;
  runningText: string;
  iqomahMinutesCountdown: number; // e.g., 10 mins
  adzanMuteDurationMins: number;  // e.g., 15 mins during prayer
  hadithOfTheDay: {
    text: string;
    narrator: string;
  };
}
