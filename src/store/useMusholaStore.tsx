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
        roleTitle: 'Ketua DKM (Super Admin)',
        roleDescription: 'Akses penuh tanpa batasan ke seluruh pembukuan, jadwal kajian, inventaris, data jamaah, dan konfigurasi TV.',
        roleBadgeColor: '#059669', // Emerald
        roleIcon: 'shield-checkmark',
      };
    case 'BENDAHARA_DKM':
      return {
        canAddTransaction: true,
        canManagePockets: true,
        canAddEvent: false,
        canEditFridaySchedule: false,
        canManageInventory: false,
        canManageJamaah: true, // Untuk pembukuan donatur/mustahik
        canEditSignage: false,
        canViewFinancialReports: true,
        canManageSubOrgs: false,
        isReadOnly: false,
        roleTitle: 'Bendahara Utama DKM',
        roleDescription: 'Mengelola transaksi kas pemasukan & pengeluaran DKM, alokasi kantong kas, dan laporan warta Jumat.',
        roleBadgeColor: '#0D9488', // Teal
        roleIcon: 'wallet',
      };
    case 'BENDAHARA_SUB':
      return {
        canAddTransaction: true, // Terisolasi pada kantong unitnya
        canManagePockets: false,
        canAddEvent: true, // Agenda unitnya
        canEditFridaySchedule: false,
        canManageInventory: false,
        canManageJamaah: false,
        canEditSignage: false,
        canViewFinancialReports: true,
        canManageSubOrgs: false,
        isReadOnly: false,
        roleTitle: 'Bendahara Sub-Organisasi',
        roleDescription: 'Mencatat mutasi kas otonom milik RISMA, Majelis Taklim, atau TPA. Terisolasi dari kas utama DKM.',
        roleBadgeColor: '#0284C7', // Sky Blue
        roleIcon: 'card',
      };
    case 'SEKRETARIS':
      return {
        canAddTransaction: false, // Transparansi baca kas
        canManagePockets: false,
        canAddEvent: true,
        canEditFridaySchedule: true,
        canManageInventory: false,
        canManageJamaah: true,
        canEditSignage: true,
        canViewFinancialReports: true,
        canManageSubOrgs: false,
        isReadOnly: false,
        roleTitle: 'Sekretaris & Sie Dakwah',
        roleDescription: 'Mengatur kalender kajian, petugas sholat Jumat, warta TV digital, dan sensus warga jamaah.',
        roleBadgeColor: '#D97706', // Amber
        roleIcon: 'document-text',
      };
    case 'PENGURUS_SEKSI':
      return {
        canAddTransaction: false,
        canManagePockets: false,
        canAddEvent: false,
        canEditFridaySchedule: false,
        canManageInventory: true, // Sarpras
        canManageJamaah: false,
        canEditSignage: false,
        canViewFinancialReports: false,
        canManageSubOrgs: false,
        isReadOnly: false,
        roleTitle: 'Pengurus Seksi Sarpras / Logistik',
        roleDescription: 'Mengelola pencatatan aset inventaris, status kelayakan pakai alat, dan peminjaman fasilitas warga.',
        roleBadgeColor: '#6366F1', // Indigo
        roleIcon: 'cube',
      };
    case 'JAMAAH':
    default:
      return {
        canAddTransaction: false,
        canManagePockets: false,
        canAddEvent: false,
        canEditFridaySchedule: false,
        canManageInventory: false,
        canManageJamaah: false,
        canEditSignage: false,
        canViewFinancialReports: true, // Transparansi publik
        canManageSubOrgs: false,
        isReadOnly: true,
        roleTitle: 'Jamaah / Warga Umum',
        roleDescription: 'Akses transparansi publik: melihat saldo kas, jadwal sholat, agenda kajian, dan infaq QRIS.',
        roleBadgeColor: '#475569', // Slate
        roleIcon: 'people',
      };
  }
}

interface MusholaContextType {
  // Sub-organisasi
  subOrgs: SubOrganization[];
  selectedSubOrgId: string | 'ALL';
  setSelectedSubOrgId: (id: string | 'ALL') => void;

  // Keuangan
  pockets: CashPocket[];
  transactions: Transaction[];
  addTransaction: (newTx: Omit<Transaction, 'id'>) => void;
  getTotalBalance: () => number;

  // Kegiatan & Petugas
  events: EventItem[];
  addEvent: (event: Omit<EventItem, 'id'>) => void;
  fridaySchedule: FridayOfficerSchedule;
  updateFridaySchedule: (schedule: FridayOfficerSchedule) => void;

  // Inventaris & Jamaah
  inventories: InventoryItem[];
  addInventory: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryCondition: (id: string, condition: InventoryItem['condition']) => void;
  jamaahList: JamaahResident[];
  addJamaah: (jamaah: Omit<JamaahResident, 'id'>) => void;

  // TV Signage
  signageConfig: SignageConfig;
  updateSignageConfig: (newCfg: Partial<SignageConfig>) => void;
  isSignageMode: boolean;
  setIsSignageMode: (val: boolean) => void;

  // User Role Switcher & RBAC Permissions
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  permissions: RolePermissions;

  // Jadwal Sholat Kemenag (bimaislam.kemenag.go.id)
  prayerData: KemenagPrayerResponse;
  selectedCityId: string;
  setSelectedCityId: (id: string) => void;
  isPrayerLoading: boolean;
  refreshPrayerSchedule: () => Promise<void>;
}

const MusholaContext = createContext<MusholaContextType | undefined>(undefined);

export function MusholaProvider({ children }: { children: ReactNode }) {
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
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPER_ADMIN');

  // Evaluasi permissions berdasarkan currentRole
  const permissions = useMemo(() => getRolePermissions(currentRole), [currentRole]);

  // Jadwal Sholat Kemenag State - Default ke Kabupaten Tangerang (Rajeg) ID 1104
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

  // Update countdown setiap 1 detik (live ticking timer)
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

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const createdTx: Transaction = {
      ...newTx,
      id: `trx-${Date.now()}`,
    };

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
  };

  const addEvent = (newEvent: Omit<EventItem, 'id'>) => {
    const createdEvent: EventItem = {
      ...newEvent,
      id: `ev-${Date.now()}`,
    };
    setEvents((prev) => [createdEvent, ...prev]);
  };

  const updateFridaySchedule = (newSchedule: FridayOfficerSchedule) => {
    setFridaySchedule(newSchedule);
  };

  const addInventory = (newItem: Omit<InventoryItem, 'id'>) => {
    const createdItem: InventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}`,
    };
    setInventories((prev) => [createdItem, ...prev]);
  };

  const updateInventoryCondition = (id: string, condition: InventoryItem['condition']) => {
    setInventories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, condition } : item))
    );
  };

  const addJamaah = (newJamaah: Omit<JamaahResident, 'id'>) => {
    const createdJamaah: JamaahResident = {
      ...newJamaah,
      id: `jmh-${Date.now()}`,
    };
    setJamaahList((prev) => [createdJamaah, ...prev]);
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
