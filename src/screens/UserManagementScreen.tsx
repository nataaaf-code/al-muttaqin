import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { usersApi } from '../services/apiService';
import { UserRole, UserManagementItem, UserManagementStats } from '../types';

type FilterCategory = 'ALL' | 'DKM_ADMIN' | 'BENDAHARA' | 'SARPRAS' | 'JAMAAH' | 'PENDING';

interface RoleOption {
  value: UserRole;
  label: string;
  badgeColor: string;
  badgeBg: string;
  icon: keyof typeof Ionicons.glyphMap;
  desc: string;
}

const ALL_ROLES: RoleOption[] = [
  {
    value: 'SUPER_ADMIN',
    label: 'Super Administrator',
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    icon: 'sparkles',
    desc: 'Pemegang kendali tertinggi sistem (fahriadjie99@gmail.com). Akses penuh ke semua fitur dan manajemen akun.',
  },
  {
    value: 'ADMIN',
    label: 'Ketua DKM (Admin)',
    badgeColor: '#059669',
    badgeBg: '#DCFCE7',
    icon: 'shield-checkmark',
    desc: 'Pengurus harian DKM dengan akses penuh ke seluruh pembukuan, kegiatan, sensus, dan sarpras.',
  },
  {
    value: 'DKM',
    label: 'Pengurus DKM & Dakwah',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    icon: 'business',
    desc: 'Pengelola kalender kajian, warta TV signage, jadwal petugas sholat Jumat, dan data sensus warga.',
  },
  {
    value: 'BENDAHARA',
    label: 'Bendahara Keuangan DKM',
    badgeColor: '#0D9488',
    badgeBg: '#CCFBF1',
    icon: 'wallet',
    desc: 'Pencatatan kas pemasukan, pengeluaran, kantong kas operasional/sosial, dan laporan keuangan.',
  },
  {
    value: 'PENGURUS_SEKSI',
    label: 'Seksi Sarpras & Logistik',
    badgeColor: '#6366F1',
    badgeBg: '#EEF2FF',
    icon: 'cube',
    desc: 'Pengelolaan aset inventaris musholla, status kelayakan barang, dan peminjaman fasilitas warga.',
  },
  {
    value: 'JAMAAH',
    label: 'Warga / Jamaah Terdaftar',
    badgeColor: '#0284C7',
    badgeBg: '#E0F2FE',
    icon: 'people',
    desc: 'Warga perumahan terdaftar: melihat transparansi kas, direktori warga (terproteksi), dan agenda kajian.',
  },
];

export function UserManagementScreen() {
  const { currentUser } = useMushola();

  // State Data
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [stats, setStats] = useState<UserManagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');

  // Modal State: Ubah Role
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserManagementItem | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  // Modal State: Tambah / Edit User
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementItem | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('JAMAAH');
  const [formPhone, setFormPhone] = useState('');
  const [formBlok, setFormBlok] = useState('Blok H');
  const [formNomorBlok, setFormNomorBlok] = useState('7');
  const [formNoRumah, setFormNoRumah] = useState('');
  const [formRtRw, setFormRtRw] = useState('05/07');
  const [formStatusWarga, setFormStatusWarga] = useState('Tetap');
  const [formJumlahKeluarga, setFormJumlahKeluarga] = useState('4');
  const [formPekerjaan, setFormPekerjaan] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const availableBlocks = ['Blok H', 'Blok A', 'Blok B', 'Blok C', 'Blok D', 'Blok E', 'Blok F', 'Blok G'];

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll();
      if (res.success && res.data) {
        setUsers(res.data.users || []);
        setStats(res.data.stats || null);
      }
    } catch (err: any) {
      console.error('[UserManagement] Gagal load users:', err);
      notify('Gagal Memuat Data', err?.message || 'Tidak dapat mengambil daftar pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filtering Terkelompok
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Kategori Filter
      if (activeCategory === 'DKM_ADMIN') {
        if (!['SUPER_ADMIN', 'ADMIN', 'DKM', 'SEKRETARIS'].includes(u.role)) return false;
      } else if (activeCategory === 'BENDAHARA') {
        if (!['BENDAHARA', 'BENDAHARA_DKM', 'BENDAHARA_SUB'].includes(u.role)) return false;
      } else if (activeCategory === 'SARPRAS') {
        if (!['PENGURUS_SEKSI', 'MARBOT'].includes(u.role)) return false;
      } else if (activeCategory === 'JAMAAH') {
        if (u.role !== 'JAMAAH') return false;
      } else if (activeCategory === 'PENDING') {
        if (u.isOnboarded) return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullAddr = `${u.blokRumah || ''}${u.nomorBlok || ''} No.${u.noRumah || ''}`.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = (u.phone || '').includes(q);
        const matchAddr = fullAddr.includes(q);
        const matchRole = u.role.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchAddr && !matchRole) return false;
      }

      return true;
    });
  }, [users, activeCategory, searchQuery]);

  // Handler Ganti Role
  const handleOpenRoleModal = (user: UserManagementItem) => {
    setSelectedUserForRole(user);
    setRoleModalVisible(true);
  };

  const handleUpdateRole = async (newRole: UserRole) => {
    if (!selectedUserForRole) return;
    try {
      await usersApi.updateRole(selectedUserForRole.id, newRole);
      notify('Berhasil', `Peran untuk ${selectedUserForRole.name} berhasil diubah menjadi ${newRole}.`);
      setRoleModalVisible(false);
      loadUsers();
    } catch (err: any) {
      notify('Gagal', err?.message || 'Tidak dapat memperbarui peran pengguna.');
    }
  };

  // Handler Reset Onboarding
  const handleResetOnboarding = async (user: UserManagementItem) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`Reset onboarding untuk ${user.name}? Pengguna akan diminta mengisi ulang profil saat login berikutnya.`)
      : true;
    if (!confirm) return;

    try {
      await usersApi.resetOnboarding(user.id);
      notify('Status Direset', `User ${user.name} akan diminta melengkapi data diri saat login berikutnya.`);
      loadUsers();
    } catch (err: any) {
      notify('Gagal', err?.message || 'Gagal mereset onboarding.');
    }
  };

  // Handler Hapus User
  const handleDeleteUser = async (user: UserManagementItem) => {
    if (user.email === 'fahriadjie99@gmail.com') {
      notify('Terproteksi', 'Akun Super User utama tidak dapat dihapus.');
      return;
    }

    const confirm = Platform.OS === 'web'
      ? window.confirm(`Apakah Anda yakin ingin menghapus akun ${user.name} (${user.email})? Data jamaah terkait juga akan dihapus.`)
      : true;
    if (!confirm) return;

    try {
      await usersApi.delete(user.id);
      notify('Berhasil Dihapus', `Akun ${user.name} telah berhasil dihapus dari sistem.`);
      loadUsers();
    } catch (err: any) {
      notify('Gagal Menghapus', err?.message || 'Tidak dapat menghapus pengguna.');
    }
  };

  // Handler Open Modal Tambah / Edit
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormEmail('');
    setFormName('');
    setFormRole('JAMAAH');
    setFormPhone('');
    setFormBlok('Blok H');
    setFormNomorBlok('7');
    setFormNoRumah('');
    setFormRtRw('05/07');
    setFormStatusWarga('Tetap');
    setFormJumlahKeluarga('4');
    setFormPekerjaan('');
    setFormCatatan('');
    setUserModalVisible(true);
  };

  const handleOpenEditModal = (user: UserManagementItem) => {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormName(user.name);
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setFormBlok(user.blokRumah || 'Blok H');
    setFormNomorBlok(user.nomorBlok || '7');
    setFormNoRumah(user.noRumah || '');
    setFormRtRw(user.rtRw || '05/07');
    setFormStatusWarga(user.statusWarga || 'Tetap');
    setFormJumlahKeluarga(String(user.jumlahKeluarga || 4));
    setFormPekerjaan(user.pekerjaan || '');
    setFormCatatan(user.catatan || '');
    setUserModalVisible(true);
  };

  const handleSaveUserForm = async () => {
    if (!formEmail.trim() || !formName.trim()) {
      notify('Validasi', 'Email dan Nama Lengkap wajib diisi.');
      return;
    }
    setFormSaving(true);
    try {
      const payload = {
        email: formEmail.trim().toLowerCase(),
        name: formName.trim(),
        role: formRole,
        phone: formPhone.trim(),
        blokRumah: formBlok.trim(),
        nomorBlok: formNomorBlok.trim(),
        noRumah: formNoRumah.trim(),
        rtRw: formRtRw.trim(),
        statusWarga: formStatusWarga,
        jumlahKeluarga: parseInt(formJumlahKeluarga, 10) || 1,
        pekerjaan: formPekerjaan.trim(),
        catatan: formCatatan.trim(),
      };

      if (editingUser) {
        await usersApi.update(editingUser.id, payload);
        notify('Berhasil', `Data pengguna ${payload.name} berhasil diperbarui.`);
      } else {
        await usersApi.create(payload);
        notify('Berhasil', `Pengguna baru ${payload.name} berhasil ditambahkan.`);
      }
      setUserModalVisible(false);
      loadUsers();
    } catch (err: any) {
      notify('Gagal', err?.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setFormSaving(false);
    }
  };

  // Helper buka WhatsApp
  const handleOpenWhatsApp = (phone?: string) => {
    if (!phone) return;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean.startsWith('62')) clean = '62' + clean;
    const url = `https://wa.me/${clean}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => notify('Error', 'Gagal membuka aplikasi WhatsApp.'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Super User Header Banner */}
      <View style={styles.headerHero}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerBadge}>
            <Ionicons name="sparkles" size={15} color="#FBBF24" />
            <Text style={styles.headerBadgeText}>SUPER USER PRIVILEGE</Text>
          </View>
          <View style={styles.superEmailPill}>
            <Ionicons name="person-circle" size={14} color="#D1FAE5" />
            <Text style={styles.superEmailText}>fahriadjie99@gmail.com</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Manajemen Pengguna & Hak Akses</Text>
        <Text style={styles.heroSubtitle}>
          Pusat kendali akun Musholla Al Muttaqin: kelola pengurus DKM, bendahara kas, seksi sarpras, dan data sensus warga kependudukan secara terpadu.
        </Text>
      </View>

      {/* KPI Summary Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#059669' }]}>
          <Text style={styles.statLabel}>Total Terdaftar</Text>
          <Text style={styles.statNumber}>{stats?.total ?? users.length}</Text>
          <Text style={styles.statSub}>Akun Terintegrasi</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#D97706' }]}>
          <Text style={styles.statLabel}>Pengurus DKM</Text>
          <Text style={styles.statNumber}>{(stats?.admin ?? 0) + (stats?.dkm ?? 0) + (stats?.superAdmin ?? 0)}</Text>
          <Text style={styles.statSub}>Admin & Syiar</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#0D9488' }]}>
          <Text style={styles.statLabel}>Bendahara</Text>
          <Text style={styles.statNumber}>{stats?.bendahara ?? 0}</Text>
          <Text style={styles.statSub}>Pengelola Kas</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#0284C7' }]}>
          <Text style={styles.statLabel}>Warga Jamaah</Text>
          <Text style={styles.statNumber}>{stats?.jamaah ?? 0}</Text>
          <Text style={styles.statSub}>Muzakki & Warga</Text>
        </View>
      </View>

      {/* Search & Actions Toolbar */}
      <View style={styles.toolbarCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama, email, no HP, atau Blok rumah (misal: H7 No.31)..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal} activeOpacity={0.8}>
            <Ionicons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Tambah User</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Categories Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveCategory('ALL')}
          >
            <Ionicons name="people-outline" size={14} color={activeCategory === 'ALL' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.filterChipText, activeCategory === 'ALL' && styles.filterChipTextActive]}>
              Semua ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'DKM_ADMIN' && styles.filterChipActive]}
            onPress={() => setActiveCategory('DKM_ADMIN')}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color={activeCategory === 'DKM_ADMIN' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.filterChipText, activeCategory === 'DKM_ADMIN' && styles.filterChipTextActive]}>
              Pengurus DKM & Admin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'BENDAHARA' && styles.filterChipActive]}
            onPress={() => setActiveCategory('BENDAHARA')}
          >
            <Ionicons name="wallet-outline" size={14} color={activeCategory === 'BENDAHARA' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.filterChipText, activeCategory === 'BENDAHARA' && styles.filterChipTextActive]}>
              Bendahara Kas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'SARPRAS' && styles.filterChipActive]}
            onPress={() => setActiveCategory('SARPRAS')}
          >
            <Ionicons name="cube-outline" size={14} color={activeCategory === 'SARPRAS' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.filterChipText, activeCategory === 'SARPRAS' && styles.filterChipTextActive]}>
              Sarpras & Marbot
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'JAMAAH' && styles.filterChipActive]}
            onPress={() => setActiveCategory('JAMAAH')}
          >
            <Ionicons name="home-outline" size={14} color={activeCategory === 'JAMAAH' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.filterChipText, activeCategory === 'JAMAAH' && styles.filterChipTextActive]}>
              Warga Jamaah ({stats?.jamaah ?? 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'PENDING' && styles.filterChipActive]}
            onPress={() => setActiveCategory('PENDING')}
          >
            <Ionicons name="alert-circle-outline" size={14} color={activeCategory === 'PENDING' ? '#FFFFFF' : '#DC2626'} />
            <Text style={[styles.filterChipText, activeCategory === 'PENDING' && styles.filterChipTextActive, { color: activeCategory === 'PENDING' ? '#FFFFFF' : '#DC2626' }]}>
              Belum Lengkap ({stats?.pendingOnboarding ?? 0})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* User Cards List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Memuat database pengguna...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Pengguna Tidak Ditemukan</Text>
          <Text style={styles.emptySubtitle}>Tidak ada akun yang sesuai dengan kata kunci atau filter saat ini.</Text>
        </View>
      ) : (
        <View style={styles.userList}>
          {filteredUsers.map((item) => {
            const roleMeta = ALL_ROLES.find((r) => r.value === item.role) || {
              label: item.role,
              badgeColor: '#64748B',
              badgeBg: '#F1F5F9',
              icon: 'person' as any,
            };

            const isSuperUser = item.email.toLowerCase() === 'fahriadjie99@gmail.com' || item.role === 'SUPER_ADMIN';

            return (
              <View key={item.id} style={[styles.userCard, isSuperUser && styles.superUserCard]}>
                {/* Header User Card */}
                <View style={styles.userCardHeader}>
                  <View style={styles.userLeftRow}>
                    <View style={[styles.userAvatar, isSuperUser && styles.superUserAvatar]}>
                      <Text style={styles.userAvatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'U'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.userName}>{item.name}</Text>
                        {isSuperUser && (
                          <View style={styles.superBadgePill}>
                            <Ionicons name="sparkles" size={11} color="#B45309" />
                            <Text style={styles.superBadgePillText}>Super User</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                  </View>

                  {/* Role Pill Button */}
                  <TouchableOpacity
                    style={[styles.rolePill, { backgroundColor: roleMeta.badgeBg, borderColor: roleMeta.badgeColor }]}
                    onPress={() => handleOpenRoleModal(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={roleMeta.icon} size={13} color={roleMeta.badgeColor} />
                    <Text style={[styles.rolePillText, { color: roleMeta.badgeColor }]}>{roleMeta.label}</Text>
                    <Ionicons name="chevron-down" size={12} color={roleMeta.badgeColor} />
                  </TouchableOpacity>
                </View>

                {/* Info Grid: Alamat Lengkap, Phone, Status */}
                <View style={styles.userInfoGrid}>
                  {/* Alamat Lengkap: Blok H7 No. 31 */}
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={14} color="#047857" />
                    <Text style={styles.infoLabel}>Alamat:</Text>
                    <Text style={styles.infoValueHighlight}>
                      {item.blokRumah ? `${item.blokRumah}${item.nomorBlok || ''} No.${item.noRumah || '-'}` : 'Belum diisi'}
                    </Text>
                    <Text style={styles.infoSub}>RT/RW {item.rtRw || '05/07'}</Text>
                  </View>

                  {/* No Handphone WhatsApp */}
                  <View style={styles.infoItem}>
                    <Ionicons name="call-outline" size={14} color="#0284C7" />
                    <Text style={styles.infoLabel}>WhatsApp:</Text>
                    <Text style={styles.infoValue}>{item.phone || '-'}</Text>
                    {item.phone ? (
                      <TouchableOpacity
                        style={styles.waQuickBtn}
                        onPress={() => handleOpenWhatsApp(item.phone)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={12} color="#FFFFFF" />
                        <Text style={styles.waQuickText}>Chat WA</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Status Warga & Keluarga */}
                  <View style={styles.infoItem}>
                    <Ionicons name="home-outline" size={14} color="#D97706" />
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValue}>Warga {item.statusWarga || 'Tetap'}</Text>
                    <Text style={styles.infoSub}>{item.jumlahKeluarga || 1} Jiwa</Text>
                  </View>

                  {/* Status Onboarding */}
                  <View style={styles.infoItem}>
                    <Ionicons
                      name={item.isOnboarded ? 'checkmark-circle' : 'alert-circle'}
                      size={14}
                      color={item.isOnboarded ? '#059669' : '#DC2626'}
                    />
                    <Text style={styles.infoLabel}>Profil:</Text>
                    <Text style={[styles.infoValue, { color: item.isOnboarded ? '#059669' : '#DC2626', fontWeight: '700' }]}>
                      {item.isOnboarded ? 'Lengkap' : 'Menunggu Input'}
                    </Text>
                  </View>
                </View>

                {item.pekerjaan ? (
                  <View style={styles.professionRow}>
                    <Ionicons name="briefcase-outline" size={13} color="#64748B" />
                    <Text style={styles.professionText}>Profesi / Keahlian: <Text style={{ color: '#0F172A', fontWeight: '600' }}>{item.pekerjaan}</Text></Text>
                  </View>
                ) : null}

                {/* Card Action Buttons Toolbar */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => handleOpenEditModal(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={14} color="#047857" />
                    <Text style={styles.actionBtnEditText}>Edit Detail</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnRole}
                    onPress={() => handleOpenRoleModal(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="swap-horizontal" size={14} color="#0284C7" />
                    <Text style={styles.actionBtnRoleText}>Ganti Peran</Text>
                  </TouchableOpacity>

                  {!item.isOnboarded && (
                    <TouchableOpacity
                      style={styles.actionBtnReset}
                      onPress={() => handleResetOnboarding(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh-outline" size={14} color="#D97706" />
                      <Text style={styles.actionBtnResetText}>Paksa Isi Ulang</Text>
                    </TouchableOpacity>
                  )}

                  {!isSuperUser && (
                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => handleDeleteUser(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* MODAL 1: GANTI PERAN PENGGUNA */}
      <Modal visible={roleModalVisible} transparent animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.roleModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={20} color="#047857" />
                <Text style={styles.modalTitle}>Ubah Peran Pengguna</Text>
              </View>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Pilih hak akses untuk <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedUserForRole?.name}</Text> ({selectedUserForRole?.email}):
            </Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {ALL_ROLES.map((r) => {
                const isCurrent = selectedUserForRole?.role === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleOptionCard, isCurrent && styles.roleOptionCardSelected]}
                    onPress={() => handleUpdateRole(r.value)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.roleOptionIconWrap, { backgroundColor: r.badgeBg }]}>
                      <Ionicons name={r.icon} size={18} color={r.badgeColor} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.roleOptionTitle}>{r.label}</Text>
                      <Text style={styles.roleOptionDesc}>{r.desc}</Text>
                    </View>
                    {isCurrent ? <Ionicons name="checkmark-circle" size={20} color="#059669" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setRoleModalVisible(false)}>
                <Text style={styles.cancelModalBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: TAMBAH / EDIT USER DETAIL */}
      <Modal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => setUserModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.userFormModal}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={editingUser ? 'create' : 'person-add'} size={20} color="#047857" />
                <Text style={styles.modalTitle}>{editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</Text>
              </View>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              {/* Email & Nama */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Alamat Email Google <Text style={styles.req}>*</Text></Text>
                <TextInput
                  style={[styles.input, editingUser && styles.inputDisabled]}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="jamaah@gmail.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  editable={!editingUser}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nama Lengkap Sesuai KTP <Text style={styles.req}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Bpk. Fahri Adjie"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Peran Sistem */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Peran Hak Akses (Role)</Text>
                <View style={styles.chipsWrap}>
                  {ALL_ROLES.map((r) => {
                    const isSelected = formRole === r.value;
                    return (
                      <TouchableOpacity
                        key={r.value}
                        style={[styles.roleSelectChip, isSelected && { backgroundColor: r.badgeColor, borderColor: r.badgeColor }]}
                        onPress={() => setFormRole(r.value)}
                      >
                        <Text style={[styles.roleSelectChipText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* No WhatsApp */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nomor WhatsApp (Auto 62xxx)</Text>
                <TextInput
                  style={styles.input}
                  value={formPhone}
                  onChangeText={(val) => {
                    let clean = val.replace(/\D/g, '');
                    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
                    else if (clean.length > 0 && !clean.startsWith('62')) clean = '62' + clean;
                    setFormPhone(clean);
                  }}
                  placeholder="6281234567890"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Blok Rumah & Nomor Blok (Contoh: Blok H7) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Pilihan Blok Rumah (Mutiara Puri Harmoni)</Text>
                <View style={styles.chipsWrap}>
                  {availableBlocks.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.blockChip, formBlok === b && styles.blockChipActive]}
                      onPress={() => setFormBlok(b)}
                    >
                      <Text style={[styles.blockChipText, formBlok === b && styles.blockChipTextActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.twoCols}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Nomor Blok (Contoh: 7)</Text>
                  <TextInput
                    style={styles.input}
                    value={formNomorBlok}
                    onChangeText={setFormNomorBlok}
                    placeholder="7"
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.hintText}>Misal H7, isi angka 7</Text>
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.fieldLabel}>Nomor Rumah (Contoh: 31)</Text>
                  <TextInput
                    style={styles.input}
                    value={formNoRumah}
                    onChangeText={setFormNoRumah}
                    placeholder="31"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Live Preview Alamat */}
              <View style={styles.liveAddressPreview}>
                <Ionicons name="location" size={16} color="#064E3B" />
                <Text style={styles.liveAddressText}>
                  Format Alamat: <Text style={{ fontWeight: '800', color: '#064E3B' }}>{formBlok}{formNomorBlok ? formNomorBlok : ''} No.{formNoRumah || '...'}</Text>
                </Text>
              </View>

              <View style={styles.twoCols}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>RT / RW</Text>
                  <TextInput
                    style={styles.input}
                    value={formRtRw}
                    onChangeText={setFormRtRw}
                    placeholder="05/07"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.fieldLabel}>Jumlah Jiwa</Text>
                  <TextInput
                    style={styles.input}
                    value={formJumlahKeluarga}
                    onChangeText={setFormJumlahKeluarga}
                    placeholder="4"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Profesi / Bidang Keahlian</Text>
                <TextInput
                  style={styles.input}
                  value={formPekerjaan}
                  onChangeText={setFormPekerjaan}
                  placeholder="Contoh: Pengembang Sistem / Karyawan"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Catatan Khusus</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  value={formCatatan}
                  onChangeText={setFormCatatan}
                  placeholder="Catatan tambahan internal DKM..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setUserModalVisible(false)} disabled={formSaving}>
                <Text style={styles.cancelModalBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveUserForm} disabled={formSaving}>
                {formSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save" size={15} color="#FFFFFF" />
                    <Text style={styles.saveModalBtnText}>Simpan Pengguna</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  headerHero: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  headerBadgeText: {
    color: '#FDE68A',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  superEmailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  superEmailText: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    lineHeight: 19,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  statSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  toolbarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#047857',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabsRow: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#047857',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  userList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  superUserCard: {
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF5',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  userLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 220,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  superUserAvatar: {
    backgroundColor: '#B45309',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  superBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  superBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  userEmail: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  userInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 1,
  },
  infoValueHighlight: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#064E3B',
    marginTop: 1,
  },
  infoSub: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  waQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  waQuickText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  professionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  professionText: {
    fontSize: 11.5,
    color: '#475569',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
  },
  actionBtnEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  actionBtnRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  actionBtnRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionBtnReset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  actionBtnResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  actionBtnDelete: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  roleModalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  userFormModal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginVertical: 12,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  roleOptionCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  roleOptionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleOptionDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  formScroll: {
    marginVertical: 12,
    maxHeight: 460,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  req: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  hintText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 3,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleSelectChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  roleSelectChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  blockChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  blockChipActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  blockChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  blockChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  twoCols: {
    flexDirection: 'row',
  },
  liveAddressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  liveAddressText: {
    fontSize: 12,
    color: '#064E3B',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  cancelModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelModalBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  saveModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#047857',
  },
  saveModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
