import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { MusholaProvider, useMushola } from './src/store/useMusholaStore';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { OrganizationScreen } from './src/screens/OrganizationScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { JamaahScreen } from './src/screens/JamaahScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { SignageTVScreen } from './src/screens/SignageTVScreen';
import { DonationQRISModal } from './src/components/DonationQRISModal';
import { UserRole } from './src/types';

type TabKey = 'dashboard' | 'finance' | 'organization' | 'events' | 'jamaah' | 'inventory';

interface TabItem {
  key: TabKey;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badgeCount?: number;
}

const TABS: TabItem[] = [
  { key: 'dashboard', label: 'Ringkasan', iconName: 'home-outline' },
  { key: 'finance', label: 'Keuangan', iconName: 'wallet-outline' },
  { key: 'organization', label: 'Organisasi', iconName: 'people-outline' },
  { key: 'events', label: 'Kegiatan', iconName: 'calendar-outline' },
  { key: 'jamaah', label: 'Warga', iconName: 'id-card-outline' },
  { key: 'inventory', label: 'Sarpras', iconName: 'cube-outline' },
];

interface RoleModalOption {
  role: UserRole;
  title: string;
  badge: string;
  color: string;
  bgColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  desc: string;
}

const ROLE_OPTIONS: RoleModalOption[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Ketua DKM (Super Admin)',
    badge: 'Master',
    color: '#059669',
    bgColor: '#DCFCE7',
    icon: 'shield-checkmark',
    desc: 'Akses penuh tanpa batasan ke seluruh modul sistem.',
  },
  {
    role: 'BENDAHARA_DKM',
    title: 'Bendahara Utama DKM',
    badge: 'Kas DKM',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    icon: 'wallet',
    desc: 'Mencatat pemasukan/pengeluaran DKM, alokasi kantong kas, & laporan.',
  },
  {
    role: 'BENDAHARA_SUB',
    title: 'Bendahara Sub-Organisasi',
    badge: 'Otonom',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    icon: 'card',
    desc: 'Mencatat mutasi kas unit (RISMA/Taklim/TPA). Terisolasi dari kas pusat.',
  },
  {
    role: 'SEKRETARIS',
    title: 'Sekretaris & Sie Dakwah',
    badge: 'Dakwah',
    color: '#D97706',
    bgColor: '#FEF3C7',
    icon: 'document-text',
    desc: 'Mengatur kalender kajian, petugas Jumat, warta TV, & data sensus.',
  },
  {
    role: 'PENGURUS_SEKSI',
    title: 'Seksi Sarpras & Logistik',
    badge: 'Sarpras',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    icon: 'cube',
    desc: 'Mengelola pencatatan inventaris aset, kondisi alat, & pinjam pakai.',
  },
  {
    role: 'JAMAAH',
    title: 'Jamaah / Warga Umum',
    badge: 'Warga',
    color: '#475569',
    bgColor: '#F1F5F9',
    icon: 'people',
    desc: 'Transparansi kas, jadwal sholat, agenda kajian, & infaq QRIS.',
  },
];

function MainNavigator() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [globalQrisVisible, setGlobalQrisVisible] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { width } = useWindowDimensions();
  const isWebWide = width >= 860;
  const { isSignageMode, setIsSignageMode, currentRole, setCurrentRole, permissions, prayerData } = useMushola();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isSignageMode) {
    return <SignageTVScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen onNavigateTab={(t) => setActiveTab(t as TabKey)} />;
      case 'finance':
        return <FinanceScreen />;
      case 'organization':
        return <OrganizationScreen />;
      case 'events':
        return <EventsScreen />;
      case 'jamaah':
        return <JamaahScreen />;
      case 'inventory':
        return <InventoryScreen />;
      default:
        return <DashboardScreen onNavigateTab={(t) => setActiveTab(t as TabKey)} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={[styles.mainLayout, isWebWide && styles.mainLayoutWeb]}>
        {/* Desktop Sidebar (Web Wide View) */}
        {isWebWide && (
          <View style={styles.webSidebar}>
            {/* Mushola Brand Branding Header */}
            <View style={styles.sidebarBrand}>
              <View style={styles.brandIconBox}>
                <Ionicons name="moon" size={22} color="#FBBF24" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.brandTitle}>E-MUSHOLA</Text>
                <Text style={styles.brandSubtitle}>Musholla Al Muttaqin (Rajeg)</Text>
              </View>
            </View>

            {/* Quick Live Prayer Pill in Sidebar */}
            <View style={styles.sidebarPrayerPill}>
              <View style={styles.sidebarPrayerLeft}>
                <Ionicons name="time" size={14} color="#F59E0B" />
                <Text style={styles.sidebarPrayerName}>{prayerData.nextPrayer.name}</Text>
              </View>
              <Text style={styles.sidebarPrayerCountdown}>
                {prayerData.nextPrayer.compactCountdown || prayerData.nextPrayer.formattedCountdown}
              </Text>
            </View>

            {/* Sidebar Navigation Items */}
            <ScrollView style={styles.sidebarNav}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.sidebarNavItem, isActive && styles.sidebarNavItemActive]}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.navIconBox,
                        isActive && styles.navIconBoxActive,
                      ]}
                    >
                      <Ionicons
                        name={tab.iconName}
                        size={18}
                        color={isActive ? '#047857' : '#64748B'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sidebarNavLabel,
                        isActive && styles.sidebarNavLabelActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {isActive && <View style={styles.activeDotIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* TV Signage Trigger Button */}
            <TouchableOpacity
              style={styles.sidebarTvBtn}
              onPress={() => setIsSignageMode(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="tv-outline" size={18} color="#FFFFFF" />
              <Text style={styles.sidebarTvBtnText}>Mode Smart TV Signage</Text>
            </TouchableOpacity>

            {/* Role Switcher Sandbox */}
            <View style={styles.sidebarFooter}>
              <View style={styles.roleContainer}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.roleLabel}>Peran Saat Ini:</Text>
                  <Text style={styles.roleNameText} numberOfLines={1}>
                    {permissions.roleTitle}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.roleBadge}
                  onPress={() => setIsRoleModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="swap-horizontal" size={13} color="#047857" />
                  <Text style={styles.roleBadgeText}>Ganti</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Content Area */}
        <View style={styles.contentArea}>
          {/* Top Header Bar for Desktop Web */}
          {isWebWide && (
            <View style={styles.desktopTopNav}>
              <View style={styles.desktopTopLeft}>
                <Text style={styles.pageTitleHeader}>
                  {TABS.find((t) => t.key === activeTab)?.label}
                </Text>
              </View>

              <View style={styles.desktopTopRight}>
                {/* Desktop Role Pill Button */}
                <TouchableOpacity
                  style={styles.desktopRolePill}
                  onPress={() => setIsRoleModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleDot, { backgroundColor: permissions.roleBadgeColor }]} />
                  <Text style={styles.desktopRolePillText}>
                    Peran: <Text style={{ fontWeight: '800', color: permissions.roleBadgeColor }}>{permissions.roleTitle}</Text>
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.desktopInfaqBtn}
                  onPress={() => setGlobalQrisVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.desktopInfaqBtnText}>Kotak Infaq QRIS</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Mobile Top Header (hanya di layar HP) */}
          {!isWebWide && (
            <View style={styles.mobileHeader}>
              <View style={styles.mobileBrandRow}>
                <Ionicons name="moon" size={18} color="#FBBF24" />
                <Text style={styles.mobileBrandTitle}>Musholla Al Muttaqin</Text>
              </View>

              <View style={styles.mobileHeaderRight}>
                {/* Mobile Role Switcher Pill */}
                <TouchableOpacity
                  style={styles.mobileRolePill}
                  onPress={() => setIsRoleModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={permissions.roleIcon as any} size={13} color="#FFFFFF" />
                  <Text style={styles.mobileRolePillText} numberOfLines={1}>
                    {currentRole === 'SUPER_ADMIN'
                      ? 'DKM'
                      : currentRole === 'BENDAHARA_DKM'
                      ? 'Bendahara'
                      : currentRole === 'BENDAHARA_SUB'
                      ? 'Sub-Kas'
                      : currentRole === 'SEKRETARIS'
                      ? 'Sekretaris'
                      : currentRole === 'PENGURUS_SEKSI'
                      ? 'Sarpras'
                      : 'Warga'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mobileInfaqCircle}
                  onPress={() => setGlobalQrisVisible(true)}
                  accessibilityLabel="Infaq QRIS"
                >
                  <Ionicons name="qr-code" size={16} color="#047857" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mobileTvBtn}
                  onPress={() => setIsSignageMode(true)}
                  accessibilityLabel="Mode TV"
                >
                  <Ionicons name="tv-outline" size={16} color="#047857" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Active Role Simulation Notice Bar (when not Super Admin) */}
          {currentRole !== 'SUPER_ADMIN' && (
            <TouchableOpacity
              style={styles.roleSimulationBanner}
              onPress={() => setIsRoleModalOpen(true)}
              activeOpacity={0.9}
            >
              <View style={styles.roleSimLeft}>
                <Ionicons name="shield-outline" size={15} color="#0369A1" />
                <Text style={styles.roleSimText}>
                  Simulasi Peran: <Text style={{ fontWeight: '700' }}>{permissions.roleTitle}</Text>
                </Text>
              </View>
              <View style={styles.roleSimRight}>
                <Text style={styles.roleSimAction}>Ganti Peran →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Screen Body */}
          <View style={styles.screenWrapper}>{renderActiveScreen()}</View>

          {/* Mobile Bottom Navigation Bar (all 6 tabs) */}
          {!isWebWide && (
            <View style={styles.bottomTabBar}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.bottomTabItem}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.bottomIconWrapper,
                        isActive && styles.bottomIconWrapperActive,
                      ]}
                    >
                      <Ionicons
                        name={tab.iconName}
                        size={19}
                        color={isActive ? '#047857' : '#64748B'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.bottomTabLabel,
                        isActive && styles.bottomTabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Role Switcher Sandbox Modal */}
      <Modal
        visible={isRoleModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRoleModalOpen(false)}
      >
        <View style={styles.roleModalOverlay}>
          <View style={styles.roleModalCard}>
            <View style={styles.roleModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="people-circle" size={22} color="#047857" />
                <Text style={styles.roleModalTitle}>Simulasi Hak Akses (RBAC)</Text>
              </View>
              <TouchableOpacity onPress={() => setIsRoleModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.roleModalSubtitle}>
              Pilih peran pengguna di bawah untuk menguji respons antarmuka, pembatasan input, dan perlindungan privasi:
            </Text>

            <ScrollView style={{ maxHeight: 420 }}>
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = currentRole === opt.role;
                return (
                  <TouchableOpacity
                    key={opt.role}
                    style={[
                      styles.roleOptionCard,
                      isSelected && styles.roleOptionCardSelected,
                    ]}
                    onPress={() => {
                      setCurrentRole(opt.role);
                      setIsRoleModalOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleOptionTop}>
                      <View style={[styles.roleOptionIcon, { backgroundColor: opt.bgColor }]}>
                        <Ionicons name={opt.icon} size={18} color={opt.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.roleOptionTitle}>{opt.title}</Text>
                        <Text style={styles.roleOptionDesc}>{opt.desc}</Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={18} color="#047857" />
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.roleModalFooter}>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setIsRoleModalOpen(false)}
              >
                <Text style={styles.closeModalBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global Infaq QRIS Modal */}
      <DonationQRISModal
        visible={globalQrisVisible}
        onClose={() => setGlobalQrisVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <MusholaProvider>
      <MainNavigator />
    </MusholaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#064E3B',
  },
  mainLayout: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainLayoutWeb: {
    flexDirection: 'row',
  },
  webSidebar: {
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    justifyContent: 'space-between',
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  sidebarPrayerPill: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sidebarPrayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sidebarPrayerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  sidebarPrayerCountdown: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  sidebarNav: {
    flex: 1,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
    gap: 10,
  },
  sidebarNavItemActive: {
    backgroundColor: '#ECFDF5',
  },
  navIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navIconBoxActive: {
    backgroundColor: '#D1FAE5',
  },
  sidebarNavLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  sidebarNavLabelActive: {
    color: '#047857',
    fontWeight: '800',
  },
  activeDotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#047857',
  },
  sidebarTvBtn: {
    backgroundColor: '#047857',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  sidebarTvBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  roleNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  contentArea: {
    flex: 1,
    flexDirection: 'column',
  },
  desktopTopNav: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desktopTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitleHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  desktopTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  desktopRolePillText: {
    fontSize: 12,
    color: '#334155',
  },
  desktopInfaqBtn: {
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  desktopInfaqBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mobileHeader: {
    backgroundColor: '#064E3B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mobileBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileBrandTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  mobileHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  mobileRolePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mobileInfaqCircle: {
    backgroundColor: '#FFFFFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileTvBtn: {
    backgroundColor: '#FFFFFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSimulationBanner: {
    backgroundColor: '#F0F9FF',
    borderBottomWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleSimLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  roleSimText: {
    fontSize: 11,
    color: '#0369A1',
  },
  roleSimRight: {
    marginLeft: 8,
  },
  roleSimAction: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  screenWrapper: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingBottom: 6,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  bottomIconWrapper: {
    padding: 3,
    borderRadius: 8,
  },
  bottomIconWrapperActive: {
    backgroundColor: '#ECFDF5',
  },
  bottomTabLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '600',
  },
  bottomTabLabelActive: {
    color: '#047857',
    fontWeight: '800',
  },
  roleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  roleModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 520,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  roleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  roleOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  roleOptionCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  roleOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  selectedBadge: {
    marginLeft: 6,
  },
  roleModalFooter: {
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 6,
    alignItems: 'flex-end',
  },
  closeModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  closeModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
