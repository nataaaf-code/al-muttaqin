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
  Image,
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
import { UserManagementScreen } from './src/screens/UserManagementScreen';
import { DonationQRISModal } from './src/components/DonationQRISModal';
import { LoginModal } from './src/components/LoginModal';
import { OnboardingModal } from './src/components/OnboardingModal';
import { UserRole } from './src/types';

type TabKey = 'dashboard' | 'finance' | 'organization' | 'events' | 'jamaah' | 'inventory' | 'users';

interface TabItem {
  key: TabKey;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badgeCount?: number;
  isPublic?: boolean;
}

const ALL_TABS: TabItem[] = [
  { key: 'dashboard', label: 'Ringkasan', iconName: 'home-outline', isPublic: true },
  { key: 'finance', label: 'Keuangan', iconName: 'wallet-outline', isPublic: false },
  { key: 'organization', label: 'Organisasi', iconName: 'people-outline', isPublic: false },
  { key: 'events', label: 'Kegiatan', iconName: 'calendar-outline', isPublic: false },
  { key: 'jamaah', label: 'Warga', iconName: 'id-card-outline', isPublic: false },
  { key: 'inventory', label: 'Sarpras', iconName: 'cube-outline', isPublic: false },
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
    title: '👑 Super User / System Admin',
    badge: 'Super Admin',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    icon: 'shield-half',
    desc: 'Hak akses tertinggi khusus Super User (fahriadjie99@gmail.com): Akses penuh + Modul Manajemen Pengguna.',
  },
  {
    role: 'ADMIN',
    title: 'Ketua DKM (Admin)',
    badge: 'Admin',
    color: '#059669',
    bgColor: '#DCFCE7',
    icon: 'shield-checkmark',
    desc: 'Akses penuh tanpa batasan ke seluruh modul sistem.',
  },
  {
    role: 'DKM',
    title: 'Pengurus DKM & Dakwah',
    badge: 'DKM',
    color: '#D97706',
    bgColor: '#FEF3C7',
    icon: 'business',
    desc: 'Mengatur kalender kajian, warta TV, petugas Jumat, dan sensus warga.',
  },
  {
    role: 'BENDAHARA',
    title: 'Bendahara Keuangan',
    badge: 'Kas DKM',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    icon: 'wallet',
    desc: 'Mencatat pemasukan/pengeluaran DKM, alokasi kantong kas, & laporan.',
  },
  {
    role: 'JAMAAH',
    title: 'Jamaah / Warga Terdaftar',
    badge: 'Warga',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    icon: 'people',
    desc: 'Warga perumahan terdaftar: transparansi kas, agenda warga, sensus.',
  },
  {
    role: 'PENGURUS_SEKSI',
    title: 'Seksi Sarpras & Marbot',
    badge: 'Sarpras',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    icon: 'cube',
    desc: 'Pencatatan aset inventaris, kondisi barang, & peminjaman fasilitas.',
  },
  {
    role: 'TAMU',
    title: 'Tamu Publik (Belum Login)',
    badge: 'Publik',
    color: '#64748B',
    bgColor: '#F1F5F9',
    icon: 'globe-outline',
    desc: 'Hanya melihat jadwal sholat live, Mode Smart TV, dan warta umum.',
  },
];

function getVisibleTabsForRole(role: UserRole, isLoggedIn: boolean, isSuperUser: boolean = false): TabItem[] {
  let baseTabs: TabItem[] = [];
  if (!isLoggedIn || role === 'TAMU') {
    // Pengunjung belum login melihat Ringkasan publik, plus tab lain dengan lock jika diinginkan
    baseTabs = ALL_TABS;
  } else {
    switch (role) {
      case 'JAMAAH':
        baseTabs = ALL_TABS.filter((t) => ['dashboard', 'finance', 'events', 'jamaah'].includes(t.key));
        break;
      case 'BENDAHARA':
      case 'BENDAHARA_DKM':
      case 'BENDAHARA_SUB':
        baseTabs = ALL_TABS.filter((t) => ['dashboard', 'finance', 'events', 'jamaah'].includes(t.key));
        break;
      case 'DKM':
      case 'SEKRETARIS':
        baseTabs = ALL_TABS.filter((t) => ['dashboard', 'organization', 'events', 'jamaah', 'inventory', 'finance'].includes(t.key));
        break;
      case 'PENGURUS_SEKSI':
      case 'MARBOT':
        baseTabs = ALL_TABS.filter((t) => ['dashboard', 'inventory', 'events'].includes(t.key));
        break;
      case 'ADMIN':
      case 'SUPER_ADMIN':
      default:
        baseTabs = ALL_TABS;
        break;
    }
  }

  // Khusus Super User (fahriadjie99@gmail.com / SUPER_ADMIN) sediakan Tab Manajemen User
  if (isSuperUser) {
    return [
      ...baseTabs,
      {
        key: 'users',
        label: 'Kelola User',
        iconName: 'shield-checkmark-outline',
        isPublic: false,
      },
    ];
  }

  return baseTabs;
}

function MainNavigator() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [globalQrisVisible, setGlobalQrisVisible] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { width } = useWindowDimensions();
  const isWebWide = width >= 860;

  const {
    isSignageMode,
    setIsSignageMode,
    currentRole,
    setCurrentRole,
    permissions,
    prayerData,
    currentUser,
    isLoggedIn,
    isAuthModalVisible,
    openLoginModal,
    closeLoginModal,
    logout,
  } = useMushola();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isSignageMode) {
    return <SignageTVScreen />;
  }

  const isSuperUser =
    currentUser?.email === 'fahriadjie99@gmail.com' ||
    currentRole === 'SUPER_ADMIN' ||
    currentUser?.role === 'SUPER_ADMIN';

  const visibleTabs = getVisibleTabsForRole(currentRole, isLoggedIn, isSuperUser);

  const handleTabPress = (tabKey: TabKey) => {
    if (!isLoggedIn && tabKey !== 'dashboard') {
      openLoginModal();
      return;
    }
    setActiveTab(tabKey);
  };

  const renderActiveScreen = () => {
    if (!isLoggedIn && activeTab !== 'dashboard') {
      return (
        <View style={styles.gatekeeperContainer}>
          <View style={styles.gatekeeperCard}>
            <View style={styles.gatekeeperIconWrap}>
              <Ionicons name="lock-closed" size={32} color="#047857" />
            </View>
            <Text style={styles.gatekeeperTitle}>Fitur Khusus Warga & Pengurus</Text>
            <Text style={styles.gatekeeperDesc}>
              Halaman ini memuat informasi internal Musholla Al Muttaqin (pembukuan kas detail, agenda pengurus, sensus jamaah & sarpras).
              Silakan masuk dengan akun Google untuk melanjutkan.
            </Text>
            <TouchableOpacity
              style={styles.gatekeeperLoginBtn}
              onPress={openLoginModal}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#FFFFFF" />
              <Text style={styles.gatekeeperLoginBtnText}>Masuk dengan Akun Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gatekeeperBackBtn}
              onPress={() => setActiveTab('dashboard')}
            >
              <Text style={styles.gatekeeperBackBtnText}>Kembali ke Ringkasan Publik</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen onNavigateTab={(t) => handleTabPress(t as TabKey)} />;
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
      case 'users':
        return <UserManagementScreen />;
      default:
        return <DashboardScreen onNavigateTab={(t) => handleTabPress(t as TabKey)} />;
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
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const isLocked = !isLoggedIn && !tab.isPublic;

                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.sidebarNavItem, isActive && styles.sidebarNavItemActive]}
                    onPress={() => handleTabPress(tab.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.navIconBox, isActive && styles.navIconBoxActive]}>
                      <Ionicons
                        name={tab.iconName}
                        size={18}
                        color={isActive ? '#047857' : isLocked ? '#94A3B8' : '#64748B'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sidebarNavLabel,
                        isActive && styles.sidebarNavLabelActive,
                        isLocked && { color: '#94A3B8' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {isLocked ? (
                      <Ionicons name="lock-closed" size={13} color="#94A3B8" />
                    ) : isActive ? (
                      <View style={styles.activeDotIndicator} />
                    ) : null}
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

            {/* User Session or Login Prompt in Sidebar Footer */}
            <View style={styles.sidebarFooter}>
              {isLoggedIn && currentUser ? (
                <View style={styles.userProfileSidebar}>
                  <View style={styles.userProfileRow}>
                    <View style={styles.userAvatarCircle}>
                      <Text style={styles.userAvatarInitials}>
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.userNameText} numberOfLines={1}>
                        {currentUser.name}
                      </Text>
                      <View style={styles.userRoleBadgeSmall}>
                        <View style={[styles.roleDotSmall, { backgroundColor: permissions.roleBadgeColor }]} />
                        <Text style={[styles.userRoleTextSmall, { color: permissions.roleBadgeColor }]}>
                          {permissions.roleTitle}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.userActionsRow}>
                    <TouchableOpacity
                      style={styles.userActionRoleBtn}
                      onPress={() => setIsRoleModalOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="swap-horizontal" size={13} color="#047857" />
                      <Text style={styles.userActionRoleText}>Ganti Peran</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.userActionLogoutBtn}
                      onPress={logout}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="log-out-outline" size={13} color="#DC2626" />
                      <Text style={styles.userActionLogoutText}>Keluar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.guestSidebarCard}>
                  <Text style={styles.guestTitle}>Warga / Pengurus?</Text>
                  <Text style={styles.guestDesc}>Masuk dengan Google untuk akses dashboard internal.</Text>
                  <TouchableOpacity
                    style={styles.guestLoginBtn}
                    onPress={openLoginModal}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-google" size={14} color="#FFFFFF" />
                    <Text style={styles.guestLoginBtnText}>Masuk Akun Google</Text>
                  </TouchableOpacity>
                </View>
              )}
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
                  {ALL_TABS.find((t) => t.key === activeTab)?.label}
                </Text>
                {!isLoggedIn && (
                  <View style={styles.guestBadgePill}>
                    <Ionicons name="globe-outline" size={12} color="#64748B" />
                    <Text style={styles.guestBadgeText}>Mode Tamu Publik</Text>
                  </View>
                )}
              </View>

              <View style={styles.desktopTopRight}>
                {isLoggedIn ? (
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
                ) : (
                  <TouchableOpacity
                    style={styles.desktopHeaderLoginBtn}
                    onPress={openLoginModal}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-google" size={15} color="#047857" />
                    <Text style={styles.desktopHeaderLoginText}>Masuk Akun Google</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.desktopInfaqBtn}
                  onPress={() => setGlobalQrisVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.desktopInfaqBtnText}>Kotak Infaq QRIS</Text>
                </TouchableOpacity>

                {isLoggedIn && (
                  <TouchableOpacity
                    style={styles.desktopLogoutIconBtn}
                    onPress={logout}
                    accessibilityLabel="Keluar"
                  >
                    <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                )}
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
                {isLoggedIn ? (
                  <TouchableOpacity
                    style={styles.mobileRolePill}
                    onPress={() => setIsRoleModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={permissions.roleIcon as any} size={13} color="#FFFFFF" />
                    <Text style={styles.mobileRolePillText} numberOfLines={1}>
                      {currentRole === 'SUPER_ADMIN'
                        ? '👑 Super User'
                        : currentRole === 'ADMIN'
                        ? 'DKM'
                        : currentRole === 'BENDAHARA' || currentRole === 'BENDAHARA_DKM'
                        ? 'Bendahara'
                        : currentRole === 'DKM' || currentRole === 'SEKRETARIS'
                        ? 'Pengurus'
                        : 'Warga'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.mobileLoginPill}
                    onPress={openLoginModal}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="log-in-outline" size={14} color="#047857" />
                    <Text style={styles.mobileLoginPillText}>Masuk</Text>
                  </TouchableOpacity>
                )}

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

          {/* Active Role Simulation Notice Bar (when logged in and not Super Admin) */}
          {isLoggedIn && currentRole !== 'ADMIN' && currentRole !== 'SUPER_ADMIN' && (
            <TouchableOpacity
              style={styles.roleSimulationBanner}
              onPress={() => setIsRoleModalOpen(true)}
              activeOpacity={0.9}
            >
              <View style={styles.roleSimLeft}>
                <Ionicons name="shield-outline" size={15} color="#0369A1" />
                <Text style={styles.roleSimText}>
                  Hak Akses: <Text style={{ fontWeight: '700' }}>{permissions.roleTitle}</Text>
                </Text>
              </View>
              <View style={styles.roleSimRight}>
                <Text style={styles.roleSimAction}>Uji Peran Lain →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Screen Body */}
          <View style={styles.screenWrapper}>{renderActiveScreen()}</View>

          {/* Mobile Bottom Navigation Bar */}
          {!isWebWide && (
            <View style={styles.bottomTabBar}>
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const isLocked = !isLoggedIn && !tab.isPublic;

                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.bottomTabItem}
                    onPress={() => handleTabPress(tab.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.bottomIconWrapper, isActive && styles.bottomIconWrapperActive]}>
                      <Ionicons
                        name={tab.iconName}
                        size={19}
                        color={isActive ? '#047857' : isLocked ? '#94A3B8' : '#64748B'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.bottomTabLabel,
                        isActive && styles.bottomTabLabelActive,
                        isLocked && { color: '#94A3B8' },
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

      {/* Login with Google Modal */}
      <LoginModal visible={isAuthModalVisible} onClose={closeLoginModal} />

      {/* First-time Registration Onboarding Modal */}
      <OnboardingModal />
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
  userProfileSidebar: {
    gap: 10,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  userNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  userRoleBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userRoleTextSmall: {
    fontSize: 10,
    fontWeight: '700',
  },
  userActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  userActionRoleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    borderRadius: 8,
  },
  userActionRoleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  userActionLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  userActionLogoutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  guestSidebarCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guestTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  guestDesc: {
    fontSize: 11,
    color: '#64748B',
    marginVertical: 4,
    lineHeight: 15,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#047857',
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 6,
  },
  guestLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
    gap: 12,
  },
  pageTitleHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  guestBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  guestBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
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
  desktopHeaderLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  desktopHeaderLoginText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
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
  desktopLogoutIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
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
  mobileLoginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  mobileLoginPillText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
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
  gatekeeperContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gatekeeperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gatekeeperIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gatekeeperTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  gatekeeperDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  gatekeeperLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#047857',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 10,
  },
  gatekeeperLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gatekeeperBackBtn: {
    paddingVertical: 8,
  },
  gatekeeperBackBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
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
