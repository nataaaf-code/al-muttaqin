import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  SubOrganization,
  CashPocket,
  Transaction,
  EventItem,
  FridayOfficerSchedule,
  InventoryItem,
  JamaahResident,
  SignageConfig,
  UserRole,
  UserProfile,
  OnboardingFormData,
} from '../types';
import {
  INITIAL_SUB_ORGS,
  INITIAL_CASH_POCKETS,
  INITIAL_TRANSACTIONS,
  INITIAL_EVENTS,
  FRIDAY_SCHEDULE,
  INITIAL_INVENTORIES,
  INITIAL_JAMAAH,
  INITIAL_SIGNAGE_CONFIG,
} from './mockData';
import {
  fetchKemenagPrayerSchedule,
  KemenagPrayerResponse,
  calculateNextPrayer,
  getOfflineFallbackTimes,
} from '../services/prayerService';
import {
  authApi,
  publicApi,
  financeApi,
  eventsApi,
  inventoryApi,
  jamaahApi,
  getStoredToken,
  removeStoredToken,
} from '../services/apiService';

export interface RolePermissions {
  canAddTransaction: boolean;
  canManagePockets: boolean;
  canAddEvent: boolean;
  canEditFridaySchedule: boolean;
  canManageInventory: boolean;
  canManageJamaah: boolean;
  canEditSignage: boolean;
  canViewFinancialReports: boolean;
  canManageSubOrgs: boolean;
  isReadOnly: boolean;
  roleTitle: string;
  roleDescription: string;
  roleBadgeColor: string;
  roleIcon: string;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        canAddTransaction: true,
        canManagePockets: true,
        canAddEvent: true,
        canEditFridaySchedule: true,
        canManageInventory: true,
        canManageJamaah: true,
        canEditSignage: true,
        canViewFinancialReports: true,
        canManageSubOrgs: true,
        isReadOnly: false,
        roleTitle: '👑 Super User (System Admin)',
        roleDescription: 'Hak akses tertinggi: Akses modul khusus Manajemen Pengguna, DKM, kas, sarpras, agenda, dan konfigurasi TV.',
        roleBadgeColor: '#EF8354',
        roleIcon: 'shield-half',
      };
    case 'ADMIN':
      return {
        canAddTransaction: true,
        canManagePockets: true,
        canAddEvent: true,
        canEditFridaySchedule: true,
        canManageInventory: true,
        canManageJamaah: true,
        canEditSignage: true,
        canViewFinancialReports: true,
        canManageSubOrgs: true,
        isReadOnly: false,
        roleTitle: 'Ketua DKM (Admin)',
        roleDescription: 'Akses penuh ke seluruh pembukuan, jadwal kajian, inventaris, data jamaah, dan konfigurasi TV.',
        roleBadgeColor: '#2D3142',
        roleIcon: 'shield-checkmark',
      };
    case 'BENDAHARA':
    case 'BENDAHARA_DKM':
      return {
        canAddTransaction: true,
        canManagePockets: true,
        canAddEvent: false,
        canEditFridaySchedule: false,
        canManageInventory: false,
        canManageJamaah: true,
        canEditSignage: false,
        canViewFinancialReports: true,
        canManageSubOrgs: false,
        isReadOnly: false,
        roleTitle: 'Bendahara Keuangan DKM',
        roleDescription: 'Mengelola transaksi kas pemasukan & pengeluaran DKM, alokasi kantong kas, dan laporan warta Jumat.',
        roleBadgeColor: '#4F5D75',
        roleIcon: 'wallet',
      };
    case 'DKM':
    case 'SEKRETARIS':
      return {
        canAddTransaction: false,
        canManagePockets: false,
        canAddEvent: true,
        canEditFridaySchedule: true,
        canManageInventory: true,
        canManageJamaah: true,
        canEditSignage: true,
        canViewFinancialReports: true,
        canManageSubOrgs: false,
        isReadOnly: false,
        roleTitle: 'Pengurus DKM & Dakwah',
        roleDescription: 'Mengatur kalender kajian, petugas sholat Jumat, warta TV digital, dan sensus warga jamaah.',
        roleBadgeColor: '#4F5D75',
        roleIcon: 'business',
      };
    case 'BENDAHARA_SUB':
      return {
        canAddTransaction: true,
        canManagePockets: false,
        canAddEvent: true,
        canEditFridaySchedule: false,
        canManageInventory: false,
        canManageJamaah: false,
        canEditSignage: false,
        canViewFinancialReports: true,
        canManageSubOrgs: false,
        isReadOnly: false,
        roleTitle: 'Bendahara Sub-Organisasi',
        roleDescription: 'Mencatat mutasi kas unit (RISMA/Taklim/TPA). Terisolasi dari kas pusat.',
        roleBadgeColor: '#4F5D75',
        roleIcon: 'card',
      };
    case 'PENGURUS_SEKSI':
    case 'MARBOT':
      return {
        canAddTransaction: false,
        canManagePockets: false,
        canAddEvent: false,
        canEditFridaySchedule: false,
        canManageInventory: true,
        canManageJamaah: false,
        canEditSignage: false,
        canViewFinancialReports: false,
        canManageSubOrgs: false,
        isReadOnly: false,
        roleTitle: 'Seksi Sarpras & Logistik',
        roleDescription: 'Mengelola inventaris aset, kondisi alat musholla, dan peminjaman fasilitas warga.',
        roleBadgeColor: '#2D3142',
        roleIcon: 'cube',
      };
    case 'JAMAAH':
      return {
        canAddTransaction: false,
        canManagePockets: false,
        canAddEvent: false,
        canEditFridaySchedule: false,
        canManageInventory: false,
        canManageJamaah: false,
        canEditSignage: false,
        canViewFinancialReports: true,
        canManageSubOrgs: false,
        isReadOnly: true,
        roleTitle: 'Warga / Jamaah Terdaftar',
        roleDescription: 'Warga terdaftar Musholla Al Muttaqin. Akses data agenda kajian, transparansi kas detail, dan profil warga.',
        roleBadgeColor: '#4F5D75',
        roleIcon: 'people',
      };
    case 'TAMU':
    default:
      return {
        canAddTransaction: false,
        canManagePockets: false,
        canAddEvent: false,
        canEditFridaySchedule: false,
        canManageInventory: false,
        canManageJamaah: false,
        canEditSignage: false,
        canViewFinancialReports: true,
        canManageSubOrgs: false,
        isReadOnly: true,
        roleTitle: 'Tamu / Pengunjung Publik',
        roleDescription: 'Akses publik: Jadwal sholat live, Mode Smart TV Signage, warta ringkas, dan infaq QRIS. Masuk dengan Google untuk akses warga & DKM.',
        roleBadgeColor: '#BFC0C0',
        roleIcon: 'globe-outline',
      };
  }
}

interface MusholaContextType {
  // Autentikasi & Profil Pengguna
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  isAuthModalVisible: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isOnboardingModalVisible: boolean;
  openOnboardingModal: () => void;
  closeOnboardingModal: () => void;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithDemo: (role: string) => Promise<void>;
  logout: () => void;
  submitOnboarding: (data: OnboardingFormData) => Promise<void>;

  // Sub-organisasi
  subOrgs: SubOrganization[];
  selectedSubOrgId: string | 'ALL';
  setSelectedSubOrgId: (id: string | 'ALL') => void;

  // Keuangan
  pockets: CashPocket[];
  transactions: Transaction[];
  addTransaction: (newTx: Omit<Transaction, 'id'>) => Promise<void>;
  getTotalBalance: () => number;

  // Kegiatan & Petugas
  events: EventItem[];
  addEvent: (event: Omit<EventItem, 'id'>) => Promise<void>;
  fridaySchedule: FridayOfficerSchedule;
  updateFridaySchedule: (schedule: FridayOfficerSchedule) => void;

  // Inventaris & Jamaah
  inventories: InventoryItem[];
  addInventory: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryCondition: (id: string, condition: InventoryItem['condition']) => void;
  jamaahList: JamaahResident[];
  addJamaah: (jamaah: Omit<JamaahResident, 'id'>) => Promise<void>;

  // TV Signage
  signageConfig: SignageConfig;
  updateSignageConfig: (newCfg: Partial<SignageConfig>) => void;
  isSignageMode: boolean;
  setIsSignageMode: (val: boolean) => void;

  // User Role & Permissions
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  permissions: RolePermissions;

  // Jadwal Sholat Kemenag
  prayerData: KemenagPrayerResponse;
  selectedCityId: string;
  setSelectedCityId: (id: string) => void;
  isPrayerLoading: boolean;
  refreshPrayerSchedule: () => Promise<void>;
  reloadAllData: () => Promise<void>;
}

const MusholaContext = createContext<MusholaContextType | undefined>(undefined);

export function MusholaProvider({ children }: { children: ReactNode }) {
  // Auth state - Default ke Tamu publik sebelum login
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('TAMU');
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const [isOnboardingModalVisible, setIsOnboardingModalVisible] = useState<boolean>(false);

  // Entities state
  const [subOrgs] = useState<SubOrganization[]>(INITIAL_SUB_ORGS);
  const [selectedSubOrgId, setSelectedSubOrgId] = useState<string | 'ALL'>('ALL');
  const [pockets, setPockets] = useState<CashPocket[]>(INITIAL_CASH_POCKETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [fridaySchedule, setFridaySchedule] = useState<FridayOfficerSchedule>(FRIDAY_SCHEDULE);
  const [inventories, setInventories] = useState<InventoryItem[]>(INITIAL_INVENTORIES);
  const [jamaahList, setJamaahList] = useState<JamaahResident[]>(INITIAL_JAMAAH);
  const [signageConfig, setSignageConfig] = useState<SignageConfig>(INITIAL_SIGNAGE_CONFIG);
  const [isSignageMode, setIsSignageMode] = useState<boolean>(false);

  const permissions = useMemo(() => getRolePermissions(currentRole), [currentRole]);
  const isLoggedIn = currentUser !== null && currentRole !== 'TAMU';

  // Jadwal Sholat Kemenag State - Rajeg / Kab Tangerang ID 1104
  const [selectedCityId, setSelectedCityId] = useState<string>('1104');
  const [isPrayerLoading, setIsPrayerLoading] = useState<boolean>(false);
  const [prayerData, setPrayerData] = useState<KemenagPrayerResponse>(() => {
    const fallbackRaw = getOfflineFallbackTimes(new Date());
    const { schedules, nextPrayer } = calculateNextPrayer(fallbackRaw, new Date());
    return {
      cityId: '1104',
      cityName: 'KAB. TANGERANG',
      provinceName: 'BANTEN',
      source: 'Bimas Islam Kemenag RI (bimaislam.kemenag.go.id)',
      schedules,
      nextPrayer,
      isLiveKemenag: false,
      dateStr: new Date().toISOString(),
    };
  });

  const loadPrayerSchedule = useCallback(async (cityId: string) => {
    setIsPrayerLoading(true);
    const data = await fetchKemenagPrayerSchedule(cityId, new Date());
    setPrayerData(data);
    setIsPrayerLoading(false);
  }, []);

  useEffect(() => {
    loadPrayerSchedule(selectedCityId);
  }, [selectedCityId, loadPrayerSchedule]);

  // Live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setPrayerData((prev) => {
        const rawTimes: Record<string, string> = {};
        if (prev.schedules && prev.schedules.length > 0) {
          prev.schedules.forEach((s) => {
            rawTimes[s.name] = s.time;
          });
        } else {
          Object.assign(rawTimes, getOfflineFallbackTimes(new Date()));
        }

        const { schedules, nextPrayer } = calculateNextPrayer(rawTimes, new Date());
        return {
          ...prev,
          schedules,
          nextPrayer,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch data dari database backend riil
  const reloadAllData = useCallback(async () => {
    try {
      // 1. Ambil summary publik
      const pubRes = await publicApi.getSummary().catch(() => null);
      if (pubRes?.success && pubRes.data) {
        if (pubRes.data.events && Array.isArray(pubRes.data.events)) {
          const mappedEvents: EventItem[] = pubRes.data.events.map((e: any) => ({
            id: `ev-${e.id}`,
            subOrgId: 'suborg-dkm',
            title: e.title,
            category: (e.category as any) || 'KAJIAN_RUTIN',
            date: e.date,
            timeStart: e.time,
            timeEnd: 'Selesai',
            speakerOrOfficer: e.speaker,
            theme: e.description || '',
            location: e.location || 'Musholla Al Muttaqin',
            isPublic: true,
            notes: e.target_jamaah || '',
          }));
          setEvents(mappedEvents);
        }
      }

      // 2. Jika user terautentikasi, ambil data modul lengkap
      const token = getStoredToken();
      if (token) {
        // Ambil transaksi keuangan
        try {
          const finRes = await financeApi.getSummaryAndTransactions();
          if (finRes.success && finRes.data.transactions) {
            const mappedTx: Transaction[] = finRes.data.transactions.map((t: any) => ({
              id: `trx-${t.id}`,
              pocketId: 'pocket-operasional',
              subOrgId: 'suborg-dkm',
              type: t.type,
              amount: t.amount,
              title: t.title,
              category: t.category,
              date: t.date,
              recordedBy: t.recorded_by || 'Bendahara DKM',
              notes: t.notes || '',
            }));
            setTransactions(mappedTx);

            // Update balance pocket operasional
            const bal = finRes.data.summary?.currentBalance || 0;
            setPockets((prev) =>
              prev.map((p) => (p.id === 'pocket-operasional' ? { ...p, balance: bal } : p))
            );
          }
        } catch (e) {
          console.warn('[Store] Gagal load keuangan:', e);
        }

        // Ambil data sensus jamaah
        try {
          const jamRes = await jamaahApi.getAll();
          if (jamRes.success && Array.isArray(jamRes.data)) {
            const mappedJamaah: JamaahResident[] = jamRes.data.map((j: any) => ({
              id: `jmh-${j.id}`,
              headOfFamily: j.name,
              phone: j.phone,
              address: `${j.blok_rumah || 'Blok H'} No. ${j.no_rumah || '01'}`,
              rtRw: j.rt_rw || '05/07',
              memberCount: j.jumlah_keluarga || 4,
              economicStatus: (j.status_zakat === 'Mustahik' ? 'MUSTAHIK' : 'MAMPU') as any,
              notes: `${j.status_warga || 'Tetap'} - ${j.pekerjaan || ''}`,
            }));
            setJamaahList(mappedJamaah);
          }
        } catch (e) {
          console.warn('[Store] Gagal load jamaah:', e);
        }

        // Ambil data sarpras inventaris
        try {
          const invRes = await inventoryApi.getAll();
          if (invRes.success && Array.isArray(invRes.data)) {
            const mappedInv: InventoryItem[] = invRes.data.map((i: any) => ({
              id: `inv-${i.id}`,
              name: i.item_name,
              category: 'PERLENGKAPAN_IBADAH',
              quantity: i.quantity,
              unit: i.unit || 'Unit',
              condition: (i.condition?.toUpperCase() === 'RUSAK' ? 'RUSAK_RINGAN' : 'BAIK') as any,
              location: i.location || 'Musholla',
              isAvailableForLoan: true,
              notes: i.notes || '',
            }));
            setInventories(mappedInv);
          }
        } catch (e) {
          console.warn('[Store] Gagal load inventaris:', e);
        }
      }
    } catch (err) {
      console.warn('[Store] Error sync data dari server:', err);
    }
  }, []);

  // Cek token tersimpan saat awal mount
  useEffect(() => {
    async function initAuth() {
      const token = getStoredToken();
      if (!token) {
        setCurrentRole('TAMU');
        setCurrentUser(null);
        reloadAllData();
        return;
      }

      try {
        const meRes = await authApi.getMe();
        if (meRes.success && meRes.user) {
          setCurrentUser(meRes.user);
          setCurrentRole(meRes.user.role);

          // Jika belum mengisi data diri onboarding, paksa buka modal
          if (!meRes.user.isOnboarded) {
            setIsOnboardingModalVisible(true);
          }
        } else {
          removeStoredToken();
          setCurrentRole('TAMU');
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('[Store] Token kadaluwarsa atau server offline:', err);
        removeStoredToken();
        setCurrentRole('TAMU');
        setCurrentUser(null);
      } finally {
        reloadAllData();
      }
    }

    initAuth();
  }, [reloadAllData]);

  // Auth Handlers
  const loginWithGoogle = async (credential: string) => {
    const res = await authApi.loginWithGoogle(credential);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      setIsAuthModalVisible(false);

      if (!res.user.isOnboarded) {
        setIsOnboardingModalVisible(true);
      }
      reloadAllData();
    }
  };

  const loginWithDemo = async (role: string) => {
    const res = await authApi.loginWithDemo(role);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      setIsAuthModalVisible(false);

      if (!res.user.isOnboarded) {
        setIsOnboardingModalVisible(true);
      }
      reloadAllData();
    }
  };

  const logout = () => {
    removeStoredToken();
    setCurrentUser(null);
    setCurrentRole('TAMU');
    setIsOnboardingModalVisible(false);
    setIsAuthModalVisible(false);
    reloadAllData();
  };

  const submitOnboarding = async (data: OnboardingFormData) => {
    const res = await authApi.submitOnboarding(data);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      setIsOnboardingModalVisible(false);
      reloadAllData();
    }
  };

  // Mutasi dengan sinkronisasi ke server
  const addTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const localId = `trx-${Date.now()}`;
    const createdTx: Transaction = { ...newTx, id: localId };
    setTransactions((prev) => [createdTx, ...prev]);

    setPockets((prev) =>
      prev.map((pocket) => {
        if (pocket.id === createdTx.pocketId) {
          const delta = createdTx.type === 'INCOME' ? createdTx.amount : -createdTx.amount;
          return {
            ...pocket,
            balance: Math.max(0, pocket.balance + delta),
          };
        }
        return pocket;
      })
    );

    try {
      await financeApi.create({
        title: newTx.title,
        type: newTx.type,
        amount: newTx.amount,
        category: newTx.category,
        pocket: 'Kas Utama',
        date: newTx.date,
        notes: newTx.notes,
      });
      reloadAllData();
    } catch (e) {
      console.warn('[Store] Transaksi disimpan lokal, gagal kirim ke API:', e);
    }
  };

  const addEvent = async (newEvent: Omit<EventItem, 'id'>) => {
    const createdEvent: EventItem = {
      ...newEvent,
      id: `ev-${Date.now()}`,
    };
    setEvents((prev) => [createdEvent, ...prev]);

    try {
      await eventsApi.create({
        title: newEvent.title,
        speaker: newEvent.speakerOrOfficer || 'Ustadz',
        date: newEvent.date,
        time: newEvent.timeStart,
        category: newEvent.category,
        location: newEvent.location,
        description: newEvent.theme,
      });
      reloadAllData();
    } catch (e) {
      console.warn('[Store] Event disimpan lokal, gagal sync API:', e);
    }
  };

  const updateFridaySchedule = (newSchedule: FridayOfficerSchedule) => {
    setFridaySchedule(newSchedule);
  };

  const addInventory = async (newItem: Omit<InventoryItem, 'id'>) => {
    const createdItem: InventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}`,
    };
    setInventories((prev) => [createdItem, ...prev]);

    try {
      await inventoryApi.create({
        item_name: newItem.name,
        quantity: newItem.quantity,
        condition: newItem.condition,
        location: newItem.location,
        notes: newItem.notes,
      });
      reloadAllData();
    } catch (e) {
      console.warn('[Store] Inventory disimpan lokal, gagal sync API:', e);
    }
  };

  const updateInventoryCondition = (id: string, condition: InventoryItem['condition']) => {
    setInventories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, condition } : item))
    );
  };

  const addJamaah = async (newJamaah: Omit<JamaahResident, 'id'>) => {
    const createdJamaah: JamaahResident = {
      ...newJamaah,
      id: `jmh-${Date.now()}`,
    };
    setJamaahList((prev) => [createdJamaah, ...prev]);

    try {
      const addressParts = newJamaah.address.split('No.');
      const blok = addressParts[0] ? addressParts[0].trim() : 'Blok H';
      const no = addressParts[1] ? addressParts[1].trim() : '01';

      await jamaahApi.create({
        name: newJamaah.headOfFamily,
        phone: newJamaah.phone,
        blok_rumah: blok,
        no_rumah: no,
        rt_rw: newJamaah.rtRw || '05/07',
        status_warga: 'Tetap',
        jumlah_keluarga: newJamaah.memberCount || 4,
        pekerjaan: newJamaah.notes || 'Warga',
      });
      reloadAllData();
    } catch (e) {
      console.warn('[Store] Jamaah disimpan lokal, gagal sync API:', e);
    }
  };

  const updateSignageConfig = (newCfg: Partial<SignageConfig>) => {
    setSignageConfig((prev) => ({ ...prev, ...newCfg }));
  };

  const getTotalBalance = () => {
    return pockets.reduce((sum, p) => sum + p.balance, 0);
  };

  const refreshPrayerSchedule = async () => {
    await loadPrayerSchedule(selectedCityId);
  };

  return (
    <MusholaContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isAuthModalVisible,
        openLoginModal: () => setIsAuthModalVisible(true),
        closeLoginModal: () => setIsAuthModalVisible(false),
        isOnboardingModalVisible,
        openOnboardingModal: () => setIsOnboardingModalVisible(true),
        closeOnboardingModal: () => setIsOnboardingModalVisible(false),
        loginWithGoogle,
        loginWithDemo,
        logout,
        submitOnboarding,

        subOrgs,
        selectedSubOrgId,
        setSelectedSubOrgId,
        pockets,
        transactions,
        addTransaction,
        getTotalBalance,
        events,
        addEvent,
        fridaySchedule,
        updateFridaySchedule,
        inventories,
        addInventory,
        updateInventoryCondition,
        jamaahList,
        addJamaah,
        signageConfig,
        updateSignageConfig,
        isSignageMode,
        setIsSignageMode,
        currentRole,
        setCurrentRole,
        permissions,
        prayerData,
        selectedCityId,
        setSelectedCityId,
        isPrayerLoading,
        refreshPrayerSchedule,
        reloadAllData,
      }}
    >
      {children}
    </MusholaContext.Provider>
  );
}

export function useMushola() {
  const context = useContext(MusholaContext);
  if (!context) {
    throw new Error('useMushola must be used within a MusholaProvider');
  }
  return context;
}
