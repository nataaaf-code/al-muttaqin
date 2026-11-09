import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Keyboard, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TextInputInstance, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
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
import { formatRupiah } from './src/utils/formatters';
import { C, F, R, SP, TYPE } from './src/theme/colors';
import { Press, Rise, Sheet, springTo } from './src/theme/motion';
import { Avatar, Badge, Button, Card, EmptyState, IconButton, IconName, IconTile, ListRow, useBreakpoint } from './src/ui/kit';

type TabKey = 'dashboard' | 'finance' | 'organization' | 'events' | 'jamaah' | 'inventory' | 'users';

interface TabItem {
  key: TabKey;
  label: string;
  icon: IconName;
  iconActive: IconName;
  isPublic?: boolean;
}

const ALL_TABS: TabItem[] = [
  { key: 'dashboard', label: 'Ringkasan', icon: 'grid-outline', iconActive: 'grid', isPublic: true },
  { key: 'finance', label: 'Keuangan', icon: 'wallet-outline', iconActive: 'wallet' },
  { key: 'events', label: 'Kegiatan', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'jamaah', label: 'Warga', icon: 'people-outline', iconActive: 'people' },
  { key: 'inventory', label: 'Sarpras', icon: 'cube-outline', iconActive: 'cube' },
  { key: 'organization', label: 'Organisasi', icon: 'git-network-outline', iconActive: 'git-network' },
];
const USERS_TAB: TabItem = { key: 'users', label: 'Kelola user', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark' };

const ROLE_OPTIONS: { role: UserRole; title: string; desc: string }[] = [
  { role: 'SUPER_ADMIN', title: 'Super User / System Admin', desc: 'Akses penuh ditambah modul Kelola user.' },
  { role: 'ADMIN', title: 'Ketua DKM (Admin)', desc: 'Akses penuh ke seluruh modul.' },
  { role: 'DKM', title: 'Pengurus DKM & Dakwah', desc: 'Kalender kajian, warta TV, petugas Jumat, dan data warga.' },
  { role: 'BENDAHARA', title: 'Bendahara Keuangan', desc: 'Pemasukan, pengeluaran, kantong kas, dan laporan.' },
  { role: 'JAMAAH', title: 'Jamaah / Warga Terdaftar', desc: 'Melihat kas, agenda warga, dan data warga.' },
  { role: 'PENGURUS_SEKSI', title: 'Seksi Sarpras & Marbot', desc: 'Inventaris, kondisi barang, dan peminjaman fasilitas.' },
  { role: 'TAMU', title: 'Tamu Publik', desc: 'Jadwal sholat, mode TV, dan warta umum.' },
];

const TAB_KEYS_BY_ROLE: Partial<Record<UserRole, TabKey[]>> = {
  JAMAAH: ['dashboard', 'finance', 'events', 'jamaah'],
  BENDAHARA: ['dashboard', 'finance', 'events', 'jamaah'],
  BENDAHARA_DKM: ['dashboard', 'finance', 'events', 'jamaah'],
  BENDAHARA_SUB: ['dashboard', 'finance', 'events', 'jamaah'],
  DKM: ['dashboard', 'finance', 'events', 'jamaah', 'inventory', 'organization'],
  SEKRETARIS: ['dashboard', 'finance', 'events', 'jamaah', 'inventory', 'organization'],
  PENGURUS_SEKSI: ['dashboard', 'events', 'inventory'],
  MARBOT: ['dashboard', 'events', 'inventory'],
};

function getVisibleTabs(role: UserRole, isLoggedIn: boolean, isSuperUser: boolean): TabItem[] {
  const keys = isLoggedIn && role !== 'TAMU' ? TAB_KEYS_BY_ROLE[role] : undefined;
  const base = keys ? ALL_TABS.filter((t) => keys.includes(t.key)) : ALL_TABS;
  return isSuperUser ? [...base, USERS_TAB] : base;
}

const NAV_H = 44;
const NAV_GAP = 4;
const MAX_BOTTOM_TABS = 5;

interface SearchHit {
  id: string;
  title: string;
  sub: string;
  icon: IconName;
  tab: TabKey;
  group: string;
}

function MainNavigator() {
  const [chosenTab, setActiveTab] = useState<TabKey>('dashboard');
  const [qrisVisible, setQrisVisible] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [tabBarW, setTabBarW] = useState(0);
  const searchRef = useRef<TextInputInstance>(null);
  const { hasSidebar, isDesktop } = useBreakpoint();

  const {
    isSignageMode,
    setIsSignageMode,
    currentRole,
    setCurrentRole,
    permissions,
    currentUser,
    isLoggedIn,
    isAuthModalVisible,
    openLoginModal,
    closeLoginModal,
    logout,
    events,
    jamaahList,
    inventories,
    transactions,
  } = useMushola();

  const isSuperUser =
    currentUser?.email === 'fahriadjie99@gmail.com' || currentRole === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const visibleTabs = getVisibleTabs(currentRole, isLoggedIn, isSuperUser);
  const canOpen = (k: TabKey) => isLoggedIn && visibleTabs.some((t) => t.key === k);

  // Tab yang tidak boleh lagi dibuka setelah ganti peran kembali ke Ringkasan.
  const activeTab: TabKey = visibleTabs.some((t) => t.key === chosenTab) ? chosenTab : 'dashboard';

  const bottomTabs = visibleTabs.length > MAX_BOTTOM_TABS ? visibleTabs.slice(0, MAX_BOTTOM_TABS - 1) : visibleTabs;
  const overflowTabs = visibleTabs.length > MAX_BOTTOM_TABS ? visibleTabs.slice(MAX_BOTTOM_TABS - 1) : [];
  const bottomCount = bottomTabs.length + (overflowTabs.length ? 1 : 0);
  const bottomIdx = (() => {
    const i = bottomTabs.findIndex((t) => t.key === activeTab);
    return i >= 0 ? i : overflowTabs.length ? bottomTabs.length : 0;
  })();
  const sideIdx = Math.max(0, visibleTabs.findIndex((t) => t.key === activeTab));

  // Penanda aktif meluncur ke tab tujuan: arah perpindahan terlihat.
  const sideY = useState(() => new Animated.Value(0))[0];
  const tabX = useState(() => new Animated.Value(0))[0];
  const cellW = bottomCount ? tabBarW / bottomCount : 0;
  useEffect(() => {
    springTo(sideY, sideIdx * (NAV_H + NAV_GAP) + (NAV_H - 24) / 2).start();
    springTo(tabX, bottomIdx * cellW + (cellW - 56) / 2).start();
  }, [sideIdx, bottomIdx, cellW, sideY, tabX]);

  // Ctrl/⌘+K memfokuskan pencarian di web.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (hasSidebar) searchRef.current?.focus();
        else setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasSidebar]);

  const hits: SearchHit[] = (() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const has = (...xs: (string | undefined)[]) => xs.some((x) => x?.toLowerCase().includes(q));
    const out: SearchHit[] = [];
    // Tamu hanya mencari agenda publik; data warga/kas/aset hanya untuk peran yang berhak.
    events
      .filter((e) => (isLoggedIn ? canOpen('events') : e.isPublic) && has(e.title, e.location, e.speakerOrOfficer))
      .forEach((e) => out.push({ id: `e${e.id}`, title: e.title, sub: `${e.date} · ${e.location}`, icon: 'calendar-outline', tab: 'events', group: 'Agenda' }));
    if (canOpen('jamaah'))
      jamaahList
        .filter((j) => has(j.headOfFamily, j.rtRw, j.address))
        .forEach((j) => out.push({ id: `j${j.id}`, title: j.headOfFamily, sub: `RT/RW ${j.rtRw}`, icon: 'people-outline', tab: 'jamaah', group: 'Warga' }));
    if (canOpen('inventory'))
      inventories
        .filter((i) => has(i.name, i.location))
        .forEach((i) => out.push({ id: `i${i.id}`, title: i.name, sub: i.location, icon: 'cube-outline', tab: 'inventory', group: 'Sarpras' }));
    if (canOpen('finance'))
      transactions
        .filter((t) => has(t.title, t.category, t.donorName))
        .forEach((t) =>
          out.push({ id: `t${t.id}`, title: t.title, sub: `${t.date} · ${formatRupiah(t.amount)}`, icon: 'receipt-outline', tab: 'finance', group: 'Transaksi' })
        );
    return out.slice(0, 8);
  })();

  if (isSignageMode) return <SignageTVScreen />;

  const go = (k: TabKey) => {
    if (!isLoggedIn && k !== 'dashboard') {
      openLoginModal();
      return;
    }
    setActiveTab(k);
  };

  const pickHit = (h: SearchHit) => {
    setQuery('');
    setSearchOpen(false);
    Keyboard.dismiss();
    go(h.tab);
  };

  const results = (
    <View>
      {query.trim().length < 2 ? (
        <Text style={st.searchHint}>Ketik minimal 2 huruf. Cari agenda{isLoggedIn ? ', warga, aset, atau transaksi' : ' publik'}.</Text>
      ) : hits.length === 0 ? (
        <EmptyState icon="search-outline" title="Tidak ditemukan" text={`Tidak ada hasil untuk "${query.trim()}". Coba kata lain.`} />
      ) : (
        hits.map((h, i) => (
          <ListRow
            key={h.id}
            last={i === hits.length - 1}
            leading={<IconTile icon={h.icon} size={36} />}
            title={h.title}
            subtitle={h.sub}
            trailing={<Badge label={h.group} />}
            onPress={() => pickHit(h)}
            accessibilityLabel={`${h.group}: ${h.title}. Buka ${h.group}`}
          />
        ))
      )}
    </View>
  );

  const renderScreen = () => {
    if (!isLoggedIn && activeTab !== 'dashboard') {
      return (
        <View style={st.gateWrap}>
          <Card style={st.gate}>
            <EmptyState
              icon="lock-closed-outline"
              title="Khusus warga dan pengurus"
              text="Halaman ini memuat buku kas rinci, agenda pengurus, data warga, dan sarpras. Masuk dengan akun Google untuk membukanya."
              action={
                <View style={{ gap: SP.s, alignSelf: 'stretch', marginTop: SP.s }}>
                  <Button label="Masuk dengan Google" icon="logo-google" onPress={openLoginModal} />
                  <Button variant="ghost" label="Kembali ke Ringkasan" onPress={() => setActiveTab('dashboard')} />
                </View>
              }
            />
          </Card>
        </View>
      );
    }
    switch (activeTab) {
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
        return <DashboardScreen onNavigateTab={(t) => go(t as TabKey)} />;
    }
  };

  const navItem = (tab: TabItem, onPress: () => void) => {
    const active = activeTab === tab.key;
    const locked = !isLoggedIn && !tab.isPublic;
    return (
      <Press
        key={tab.key}
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        accessibilityLabel={locked ? `${tab.label}, perlu masuk` : tab.label}
        style={[st.navItem, active && st.navItemActive]}
        hoverStyle={active ? undefined : { backgroundColor: C.sunken }}
        onPress={onPress}
      >
        <Ionicons name={active ? tab.iconActive : tab.icon} size={20} color={active ? C.g700 : C.inkMuted} aria-hidden />
        <Text style={[st.navLabel, active && st.navLabelActive]}>{tab.label}</Text>
        {locked ? <Ionicons name="lock-closed-outline" size={14} color={C.inkMuted} aria-hidden /> : null}
      </Press>
    );
  };

  const userName = currentUser?.name || 'Warga';

  return (
    <SafeAreaView style={[st.safe, !hasSidebar && { backgroundColor: C.g900 }]}>
      <StatusBar style={hasSidebar ? 'dark' : 'light'} />
      <View style={[st.layout, hasSidebar && { flexDirection: 'row' }]}>
        {hasSidebar && (
          <View style={[st.sidebar, { width: isDesktop ? 260 : 232 }]} accessibilityRole="navigation">
            <View style={st.brand}>
              <Image source={require('./assets/logo.png')} style={st.brandLogo} resizeMode="contain" alt="Logo Musholla Al Muttaqin" />
              <View>
                <Text style={st.brandName}>Al Muttaqin</Text>
                <Text style={st.brandSub}>Musholla · Rajeg</Text>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: SP.l, paddingHorizontal: SP.l }}>
              <Text style={st.group}>Menu</Text>
              <View>
                <Animated.View pointerEvents="none" style={[st.sideMark, { transform: [{ translateY: sideY }] }]} />
                {visibleTabs.map((t) => navItem(t, () => go(t.key)))}
              </View>
              <Text style={[st.group, { marginTop: SP.xl }]}>Umum</Text>
              <Press style={st.navItem} hoverStyle={{ backgroundColor: C.sunken }} onPress={() => setIsSignageMode(true)}>
                <Ionicons name="tv-outline" size={20} color={C.inkMuted} aria-hidden />
                <Text style={st.navLabel}>Tampilkan di TV</Text>
              </Press>
              {isLoggedIn ? (
                <Press style={st.navItem} hoverStyle={{ backgroundColor: C.dangerBg }} onPress={logout}>
                  <Ionicons name="log-out-outline" size={20} color={C.dangerFg} aria-hidden />
                  <Text style={[st.navLabel, { color: C.dangerFg }]}>Keluar</Text>
                </Press>
              ) : (
                <Press style={st.navItem} hoverStyle={{ backgroundColor: C.sunken }} onPress={openLoginModal}>
                  <Ionicons name="log-in-outline" size={20} color={C.inkMuted} aria-hidden />
                  <Text style={st.navLabel}>Masuk</Text>
                </Press>
              )}
            </ScrollView>

            <View style={st.qrisCard}>
              <IconTile icon="qr-code-outline" size={36} tone="dark" />
              <Text style={st.qrisTitle}>Infaq untuk mushola</Text>
              <Text style={st.qrisText}>Pindai QRIS dari m-Banking atau e-Wallet. Nominal bebas.</Text>
              <Button variant="onDark" label="Buka QRIS" onPress={() => setQrisVisible(true)} />
            </View>
          </View>
        )}

        <View style={{ flex: 1 }}>
          {hasSidebar ? (
            <View style={st.topBar}>
              <View style={st.searchWrap}>
                <View style={[st.search, searchFocus && st.searchOn]}>
                  <Ionicons name="search-outline" size={18} color={C.inkMuted} aria-hidden />
                  <TextInput
                    ref={searchRef}
                    value={query}
                    onChangeText={setQuery}
                    onFocus={() => setSearchFocus(true)}
                    onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
                    onSubmitEditing={() => hits[0] && pickHit(hits[0])}
                    onKeyPress={(e) => e.nativeEvent.key === 'Escape' && (setQuery(''), searchRef.current?.blur())}
                    placeholder="Cari agenda, warga, aset, transaksi"
                    placeholderTextColor={C.inkFaint}
                    accessibilityLabel="Cari agenda, warga, aset, atau transaksi"
                    style={st.searchInput}
                  />
                  {Platform.OS === 'web' ? (
                    <View style={st.kbd}>
                      <Text style={st.kbdText}>Ctrl K</Text>
                    </View>
                  ) : null}
                </View>
                {searchFocus && query.length > 0 ? <Rise style={st.dropdown}>{results}</Rise> : null}
              </View>

              {isLoggedIn ? (
                <Press style={st.profile} hoverStyle={{ backgroundColor: C.sunken }} onPress={() => setAccountOpen(true)} accessibilityLabel={`Akun ${userName}, ${permissions.roleTitle}`}>
                  <Avatar name={userName} size={40} />
                  {isDesktop ? (
                    <View style={{ maxWidth: 180 }}>
                      <Text style={st.profileName} numberOfLines={1}>
                        {userName}
                      </Text>
                      <Text style={st.profileRole} numberOfLines={1}>
                        {currentUser?.email || permissions.roleTitle}
                      </Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-down" size={16} color={C.inkMuted} aria-hidden />
                </Press>
              ) : (
                <Button variant="outline" label="Masuk dengan Google" icon="logo-google" onPress={openLoginModal} />
              )}
            </View>
          ) : (
            <View style={st.mHeader}>
              <Image source={require('./assets/logo.png')} style={st.mLogo} resizeMode="contain" alt="Logo Musholla Al Muttaqin" />
              <Text style={st.mTitle}>Al Muttaqin</Text>
              <IconButton onDark icon="search-outline" label="Cari" onPress={() => setSearchOpen(true)} />
              <IconButton onDark icon="qr-code-outline" label="Infaq QRIS" onPress={() => setQrisVisible(true)} />
              {isLoggedIn ? (
                <Press onDark style={st.mAvatar} onPress={() => setAccountOpen(true)} accessibilityLabel={`Akun ${userName}`}>
                  <Avatar name={userName} size={34} />
                </Press>
              ) : (
                <Button compact variant="onDarkOutline" label="Masuk" onPress={openLoginModal} />
              )}
            </View>
          )}

          <View style={{ flex: 1 }} accessibilityRole="main">
            {activeTab === 'dashboard' ? (
              renderScreen()
            ) : (
              <Rise key={activeTab} style={{ flex: 1 }}>
                {renderScreen()}
              </Rise>
            )}
          </View>

          {!hasSidebar && (
            <View style={st.tabBar} accessibilityRole="tablist" onLayout={(e) => setTabBarW(e.nativeEvent.layout.width)}>
              {cellW > 0 ? <Animated.View pointerEvents="none" style={[st.tabMark, { transform: [{ translateX: tabX }] }]} /> : null}
              {bottomTabs.map((t) => {
                const active = activeTab === t.key;
                const locked = !isLoggedIn && !t.isPublic;
                return (
                  <Press
                    key={t.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={locked ? `${t.label}, perlu masuk` : t.label}
                    style={st.tabItem}
                    hoverStyle={{ opacity: 0.8 }}
                    onPress={() => go(t.key)}
                  >
                    <Ionicons name={locked ? 'lock-closed-outline' : active ? t.iconActive : t.icon} size={21} color={active ? C.g700 : C.inkMuted} aria-hidden />
                    <Text style={[st.tabLabel, active && st.tabLabelOn]} numberOfLines={1}>
                      {t.label}
                    </Text>
                  </Press>
                );
              })}
              {overflowTabs.length ? (
                <Press
                  accessibilityRole="tab"
                  accessibilityState={{ selected: overflowTabs.some((t) => t.key === activeTab) }}
                  accessibilityLabel="Lainnya"
                  style={st.tabItem}
                  hoverStyle={{ opacity: 0.8 }}
                  onPress={() => setMoreOpen(true)}
                >
                  <Ionicons name="ellipsis-horizontal" size={21} color={overflowTabs.some((t) => t.key === activeTab) ? C.g700 : C.inkMuted} aria-hidden />
                  <Text style={[st.tabLabel, overflowTabs.some((t) => t.key === activeTab) && st.tabLabelOn]}>Lainnya</Text>
                </Press>
              ) : null}
            </View>
          )}
        </View>
      </View>

      <Sheet visible={searchOpen} onClose={() => setSearchOpen(false)} title="Cari">
        <View style={[st.search, st.searchOn, { marginBottom: SP.m }]}>
          <Ionicons name="search-outline" size={18} color={C.inkMuted} aria-hidden />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => hits[0] && pickHit(hits[0])}
            placeholder="Agenda, warga, aset, transaksi"
            placeholderTextColor={C.inkFaint}
            accessibilityLabel="Kata pencarian"
            style={st.searchInput}
          />
        </View>
        {results}
      </Sheet>

      <Sheet visible={moreOpen} onClose={() => setMoreOpen(false)} title="Menu lainnya">
        {overflowTabs.map((t) =>
          navItem(t, () => {
            setMoreOpen(false);
            go(t.key);
          })
        )}
        <Press style={st.navItem} hoverStyle={{ backgroundColor: C.sunken }} onPress={() => (setMoreOpen(false), setIsSignageMode(true))}>
          <Ionicons name="tv-outline" size={20} color={C.inkMuted} aria-hidden />
          <Text style={st.navLabel}>Tampilkan di TV</Text>
        </Press>
      </Sheet>

      <Sheet visible={accountOpen} onClose={() => setAccountOpen(false)} title={userName} subtitle={currentUser?.email ? `${currentUser.email} · ${permissions.roleTitle}` : permissions.roleTitle}>
        <Text style={st.sheetGroup}>Uji hak akses</Text>
        {ROLE_OPTIONS.map((o) => {
          const selected = currentRole === o.role;
          return (
            <Press
              key={o.role}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={[st.roleRow, selected && { backgroundColor: C.g50 }]}
              hoverStyle={selected ? undefined : { backgroundColor: C.sunken }}
              onPress={() => {
                setCurrentRole(o.role);
                setAccountOpen(false);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[st.roleTitle, selected && { color: C.g700 }]}>{o.title}</Text>
                <Text style={st.roleDesc}>{o.desc}</Text>
              </View>
              {selected ? <Badge label="Aktif" tone="success" /> : null}
            </Press>
          );
        })}
        <Button
          variant="danger"
          icon="log-out-outline"
          label="Keluar"
          style={{ marginTop: SP.l }}
          onPress={() => {
            setAccountOpen(false);
            logout();
          }}
        />
      </Sheet>

      <DonationQRISModal visible={qrisVisible} onClose={() => setQrisVisible(false)} />
      <LoginModal visible={isAuthModalVisible} onClose={closeLoginModal} />
      <OnboardingModal />
    </SafeAreaView>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    [F.r]: require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    [F.m]: require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
    [F.s]: require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    [F.b]: require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
  });
  // Gagal memuat font tidak memblokir aplikasi: teks jatuh ke font sistem.
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: C.page }} />;
  return (
    <MusholaProvider>
      <MainNavigator />
    </MusholaProvider>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.page },
  layout: { flex: 1, backgroundColor: C.page },

  sidebar: { backgroundColor: C.card, borderRightWidth: 1, borderColor: C.line, paddingTop: SP.xl, paddingBottom: SP.l },
  brand: { flexDirection: 'row', alignItems: 'center', gap: SP.m, paddingHorizontal: SP.s, marginHorizontal: SP.l, marginBottom: SP.xl },
  brandLogo: { width: 40, height: 40 },
  brandName: { ...TYPE.h2, color: C.ink },
  brandSub: { ...TYPE.small, color: C.inkMuted },
  group: { ...TYPE.small, color: C.inkMuted, paddingHorizontal: SP.m, marginBottom: SP.s },
  sideMark: { position: 'absolute', left: -SP.l, top: 0, width: 4, height: 24, borderTopRightRadius: 3, borderBottomRightRadius: 3, backgroundColor: C.g700 },
  navItem: { height: NAV_H, marginBottom: NAV_GAP, flexDirection: 'row', alignItems: 'center', gap: SP.m, paddingHorizontal: SP.m, borderRadius: R.inner - 2 },
  navItemActive: { backgroundColor: C.g50 },
  navLabel: { ...TYPE.label, fontSize: 14, color: C.inkMuted, flex: 1 },
  navLabelActive: { color: C.g700, fontFamily: F.s },
  qrisCard: { backgroundColor: C.g900, borderRadius: R.card - 4, padding: SP.l, gap: SP.s, marginHorizontal: SP.l },
  qrisTitle: { ...TYPE.h3, color: C.onDark, marginTop: SP.xs },
  qrisText: { ...TYPE.small, color: C.onDarkMuted, marginBottom: SP.xs },

  topBar: {
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.l,
    paddingHorizontal: SP.xxl,
    paddingVertical: SP.m,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  searchWrap: { flex: 1, maxWidth: 460 },
  search: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: SP.s, paddingHorizontal: SP.l, borderRadius: R.pill, backgroundColor: C.sunken, borderWidth: 1, borderColor: C.line },
  searchOn: { borderColor: C.g700, backgroundColor: C.card },
  searchInput: { ...TYPE.body, flex: 1, color: C.ink, paddingVertical: 10, outlineStyle: 'none' } as never,
  kbd: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  kbdText: { ...TYPE.small, fontSize: 11, color: C.inkMuted },
  searchHint: { ...TYPE.body, color: C.inkMuted, paddingVertical: SP.m },
  dropdown: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: C.card, borderRadius: R.card - 4, borderWidth: 1, borderColor: C.line, paddingHorizontal: SP.l, paddingVertical: SP.xs },
  profile: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: SP.m, paddingVertical: 4, paddingLeft: 4, paddingRight: SP.m, borderRadius: R.pill },
  profileName: { ...TYPE.bodyStrong, color: C.ink },
  profileRole: { ...TYPE.small, color: C.inkMuted },

  mHeader: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: SP.l, paddingRight: SP.s, paddingVertical: 4, backgroundColor: C.g900 },
  mLogo: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.card, marginRight: SP.s },
  mTitle: { ...TYPE.h2, color: C.onDark, flex: 1 },
  mAvatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },

  tabBar: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderColor: C.line, paddingTop: 6, paddingBottom: 6 },
  tabMark: { position: 'absolute', top: 6, left: 0, width: 56, height: 30, borderRadius: R.pill, backgroundColor: C.g100 },
  tabItem: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 5, gap: 4 },
  tabLabel: { ...TYPE.small, fontSize: 11, color: C.inkMuted },
  tabLabelOn: { color: C.g700, fontFamily: F.s },

  gateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SP.l },
  gate: { width: '100%', maxWidth: 440 },

  sheetGroup: { ...TYPE.label, color: C.inkMuted, marginBottom: SP.s },
  roleRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: SP.m, paddingHorizontal: SP.m, paddingVertical: SP.s, borderRadius: R.inner },
  roleTitle: { ...TYPE.bodyStrong, color: C.ink },
  roleDesc: { ...TYPE.small, color: C.inkMuted, marginTop: 2 },
});
