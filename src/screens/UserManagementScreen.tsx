import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Linking, StyleSheet, Text, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { usersApi } from '../services/apiService';
import { UserManagementItem, UserManagementStats, UserRole } from '../types';
import { BP, C, R, SP, TYPE } from '../theme/colors';
import { NATIVE, Press, Sheet, dur } from '../theme/motion';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Col,
  EmptyState,
  Field,
  IconName,
  ListRow,
  Loading,
  PageHeader,
  Row,
  Screen,
  Segmented,
  Stat,
  T,
  useBreakpoint,
} from '../ui/kit';

type FilterCategory = 'ALL' | 'DKM_ADMIN' | 'BENDAHARA' | 'SARPRAS' | 'JAMAAH' | 'PENDING';

/** Akun Super User utama: tidak boleh dihapus (aturan lama dipertahankan). */
const PROTECTED_EMAIL = 'fahriadjie99@gmail.com';

interface RoleOption {
  value: UserRole;
  label: string;
  short: string;
  icon: IconName;
  desc: string;
}

const ALL_ROLES: RoleOption[] = [
  {
    value: 'SUPER_ADMIN',
    label: 'Super administrator',
    short: 'Super admin',
    icon: 'sparkles-outline',
    desc: 'Pemegang kendali tertinggi sistem. Akses penuh ke semua fitur dan manajemen akun.',
  },
  {
    value: 'ADMIN',
    label: 'Ketua DKM (admin)',
    short: 'Ketua DKM',
    icon: 'shield-checkmark-outline',
    desc: 'Pengurus harian DKM dengan akses penuh ke pembukuan, kegiatan, sensus, dan sarpras.',
  },
  {
    value: 'DKM',
    label: 'Pengurus DKM dan dakwah',
    short: 'Pengurus DKM',
    icon: 'business-outline',
    desc: 'Mengelola kalender kajian, warta TV signage, jadwal petugas Jumat, dan data sensus warga.',
  },
  {
    value: 'BENDAHARA',
    label: 'Bendahara keuangan DKM',
    short: 'Bendahara',
    icon: 'wallet-outline',
    desc: 'Mencatat pemasukan, pengeluaran, kantong kas, dan laporan keuangan.',
  },
  {
    value: 'PENGURUS_SEKSI',
    label: 'Seksi sarpras dan logistik',
    short: 'Seksi sarpras',
    icon: 'cube-outline',
    desc: 'Mengelola aset inventaris, status kelayakan barang, dan peminjaman fasilitas.',
  },
  {
    value: 'JAMAAH',
    label: 'Warga atau jamaah terdaftar',
    short: 'Jamaah',
    icon: 'people-outline',
    desc: 'Melihat transparansi kas, direktori warga (terproteksi), dan agenda kajian.',
  },
];

/** Label peran lain yang mungkin datang dari server tapi tidak bisa dipilih di sini. */
const OTHER_ROLE_LABEL: Partial<Record<UserRole, string>> = {
  TAMU: 'Tamu',
  MARBOT: 'Marbot',
  BENDAHARA_DKM: 'Bendahara utama',
  BENDAHARA_SUB: 'Bendahara sub-organisasi',
  SEKRETARIS: 'Sekretaris',
};

const roleShort = (r: UserRole) => ALL_ROLES.find((o) => o.value === r)?.short ?? OTHER_ROLE_LABEL[r] ?? r;

const AVAILABLE_BLOCKS = ['Blok H', 'Blok A', 'Blok B', 'Blok C', 'Blok D', 'Blok E', 'Blok F', 'Blok G'];

const isProtected = (u: UserManagementItem) => u.email.toLowerCase() === PROTECTED_EMAIL || u.role === 'SUPER_ADMIN';

const formatAddress = (u: UserManagementItem) =>
  u.blokRumah ? `${u.blokRumah}${u.nomorBlok || ''} No.${u.noRumah || '-'}` : 'Alamat belum diisi';

const normalizePhone = (val: string) => {
  let clean = val.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  else if (clean.length > 0 && !clean.startsWith('62')) clean = '62' + clean;
  return clean;
};

type SheetMode = null | 'detail' | 'role' | 'form';
type Notice = { tone: 'success' | 'danger'; text: string } | null;
type Confirm = null | 'reset' | 'delete';

export function UserManagementScreen() {
  // currentUser tetap dibaca; akses layar ini dijaga di App.tsx (hanya SUPER_ADMIN).
  const { currentUser } = useMushola();
  const { isDesktop } = useBreakpoint();

  // Data
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [stats, setStats] = useState<UserManagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');

  // Pilihan & sheet
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form tambah / ubah
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
  const [formErrors, setFormErrors] = useState<{ email?: string; name?: string }>({});
  const [formSaving, setFormSaving] = useState(false);

  // Konfirmasi singkat yang memudar
  const [notice, setNotice] = useState<Notice>(null);
  const [noticeFade] = useState(() => new Animated.Value(0));
  const showNotice = useCallback((n: NonNullable<Notice>) => setNotice(n), []);

  // Muncul 150 ms, bertahan sekitar 3,5 detik, lalu memudar.
  useEffect(() => {
    if (!notice) return;
    noticeFade.setValue(0);
    Animated.timing(noticeFade, { toValue: 1, duration: dur(150), useNativeDriver: NATIVE }).start();
    const t = setTimeout(() => {
      Animated.timing(noticeFade, { toValue: 0, duration: dur(300), useNativeDriver: NATIVE }).start(({ finished }) => {
        if (finished) setNotice((cur) => (cur === notice ? null : cur));
      });
    }, 3500);
    return () => clearTimeout(t);
  }, [notice, noticeFade]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await usersApi.getAll();
      if (res.success && res.data) {
        setUsers(res.data.users || []);
        setStats(res.data.stats || null);
      } else {
        setLoadError('Server tidak mengirim daftar pengguna.');
      }
    } catch (err: any) {
      console.error('[UserManagement] Gagal load users:', err);
      setLoadError(err?.message || 'Tidak dapat mengambil daftar pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter terkelompok
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
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

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;
  // Di desktop panel rincian selalu menampilkan pengguna terpilih (atau yang pertama di daftar).
  const detailUser = selectedUser ?? (isDesktop ? filteredUsers[0] ?? null : null);

  const closeSheet = () => {
    if (busy || formSaving) return;
    setSheetMode(null);
    setConfirm(null);
    setActionError(null);
  };

  const openDetail = (u: UserManagementItem) => {
    setSelectedId(u.id);
    setConfirm(null);
    setActionError(null);
    if (!isDesktop) setSheetMode('detail');
  };

  const openRole = (u: UserManagementItem) => {
    setSelectedId(u.id);
    setActionError(null);
    setSheetMode('role');
  };

  // Ganti peran
  const handleUpdateRole = async (newRole: UserRole) => {
    if (!selectedUser || busy) return;
    if (newRole === selectedUser.role) {
      closeSheet();
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await usersApi.updateRole(selectedUser.id, newRole);
      setSheetMode(null);
      showNotice({ tone: 'success', text: `Peran ${selectedUser.name} diubah menjadi ${roleShort(newRole)}.` });
      loadUsers();
    } catch (err: any) {
      setActionError(`${err?.message || 'Tidak dapat memperbarui peran pengguna.'} Coba lagi sebentar.`);
    } finally {
      setBusy(false);
    }
  };

  // Reset onboarding (setelah konfirmasi di halaman)
  const handleResetOnboarding = async (user: UserManagementItem) => {
    setBusy(true);
    setActionError(null);
    try {
      await usersApi.resetOnboarding(user.id);
      setConfirm(null);
      setSheetMode(null);
      showNotice({ tone: 'success', text: `${user.name} akan diminta melengkapi data diri saat masuk berikutnya.` });
      loadUsers();
    } catch (err: any) {
      setActionError(`${err?.message || 'Gagal mereset status profil.'} Coba lagi sebentar.`);
    } finally {
      setBusy(false);
    }
  };

  // Hapus pengguna (setelah konfirmasi di halaman)
  const handleDeleteUser = async (user: UserManagementItem) => {
    if (user.email === PROTECTED_EMAIL) {
      setActionError('Akun Super User utama tidak dapat dihapus.');
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await usersApi.delete(user.id);
      setConfirm(null);
      setSheetMode(null);
      setSelectedId(null);
      showNotice({ tone: 'success', text: `Akun ${user.name} sudah dihapus dari sistem.` });
      loadUsers();
    } catch (err: any) {
      setActionError(`${err?.message || 'Tidak dapat menghapus pengguna.'} Coba lagi sebentar.`);
    } finally {
      setBusy(false);
    }
  };

  // Form tambah / ubah
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
    setFormErrors({});
    setActionError(null);
    setSheetMode('form');
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
    setFormErrors({});
    setActionError(null);
    setSheetMode('form');
  };

  const handleSaveUserForm = async () => {
    const errs: { email?: string; name?: string } = {};
    if (!formEmail.trim()) errs.email = 'Email wajib diisi.';
    else if (!/^\S+@\S+\.\S+$/.test(formEmail.trim())) errs.email = 'Format email belum benar, contoh: jamaah@gmail.com.';
    if (!formName.trim()) errs.name = 'Nama lengkap wajib diisi.';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setFormSaving(true);
    setActionError(null);
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
        showNotice({ tone: 'success', text: `Data ${payload.name} sudah diperbarui.` });
      } else {
        await usersApi.create(payload);
        showNotice({ tone: 'success', text: `Pengguna baru ${payload.name} sudah ditambahkan.` });
      }
      setSheetMode(null);
      loadUsers();
    } catch (err: any) {
      setActionError(`${err?.message || 'Gagal menyimpan data pengguna.'} Periksa isian lalu coba lagi.`);
    } finally {
      setFormSaving(false);
    }
  };

  // WhatsApp
  const handleOpenWhatsApp = (phone?: string) => {
    if (!phone) return;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean.startsWith('62')) clean = '62' + clean;
    Linking.openURL(`https://wa.me/${clean}`).catch(() =>
      showNotice({ tone: 'danger', text: 'WhatsApp tidak bisa dibuka dari perangkat ini.' })
    );
  };

  /* ---------- Bagian tampilan ---------- */

  const filterOptions: { key: FilterCategory; label: string }[] = [
    { key: 'ALL', label: `Semua (${users.length})` },
    { key: 'DKM_ADMIN', label: 'Pengurus dan admin' },
    { key: 'BENDAHARA', label: 'Bendahara' },
    { key: 'SARPRAS', label: 'Sarpras dan marbot' },
    { key: 'JAMAAH', label: `Jamaah (${stats?.jamaah ?? 0})` },
    { key: 'PENDING', label: `Profil belum lengkap (${stats?.pendingOnboarding ?? 0})` },
  ];

  const renderDetail = (u: UserManagementItem) => {
    const protectedUser = isProtected(u);
    const info: { icon: IconName; label: string; value: string }[] = [
      { icon: 'location-outline', label: 'Alamat', value: `${formatAddress(u)}, RT/RW ${u.rtRw || '05/07'}` },
      { icon: 'call-outline', label: 'WhatsApp', value: u.phone || 'Belum diisi' },
      { icon: 'home-outline', label: 'Status warga', value: `Warga ${u.statusWarga || 'Tetap'}, ${u.jumlahKeluarga || 1} jiwa` },
      { icon: 'briefcase-outline', label: 'Profesi', value: u.pekerjaan || 'Belum diisi' },
    ];
    if (u.catatan) info.push({ icon: 'document-text-outline', label: 'Catatan', value: u.catatan });

    return (
      <View style={styles.detail}>
        <View style={styles.detailHead}>
          <Avatar name={u.name} size={56} dark={protectedUser} />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <T v="h2">{u.name}</T>
            <T v="small" color={C.inkMuted}>
              {u.email}
            </T>
            <View style={styles.badges}>
              <Badge label={roleShort(u.role)} tone={protectedUser ? 'success' : 'neutral'} />
              <Badge label={u.isOnboarded ? 'Profil lengkap' : 'Profil belum lengkap'} tone={u.isOnboarded ? 'success' : 'warn'} />
            </View>
          </View>
        </View>

        <View>
          {info.map((it, i) => (
            <View key={it.label} style={[styles.infoRow, i < info.length - 1 && styles.infoRowLine]}>
              <Ionicons name={it.icon} size={16} color={C.inkMuted} aria-hidden />
              <T v="small" color={C.inkMuted} style={styles.infoLabel}>
                {it.label}
              </T>
              <T v="bodyStrong" style={{ flex: 1, minWidth: 0 }}>
                {it.value}
              </T>
            </View>
          ))}
        </View>

        {actionError ? (
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Ionicons name="alert-circle-outline" size={18} color={C.dangerFg} aria-hidden />
            <T v="small" color={C.dangerFg} style={{ flex: 1 }}>
              {actionError}
            </T>
          </View>
        ) : null}

        {confirm ? (
          <View style={[styles.confirmBox, confirm === 'delete' && styles.confirmDanger]}>
            <T v="bodyStrong">{confirm === 'delete' ? `Hapus akun ${u.name}?` : `Minta ${u.name} mengisi ulang profil?`}</T>
            <T v="small" color={C.inkMuted}>
              {confirm === 'delete'
                ? `Akun ${u.email} dan data jamaah terkait akan dihapus. Tindakan ini tidak bisa dibatalkan.`
                : 'Pengguna akan diminta melengkapi data diri lagi saat masuk berikutnya.'}
            </T>
            <View style={styles.actions}>
              <Button
                label={confirm === 'delete' ? 'Ya, hapus akun' : 'Ya, minta isi ulang'}
                variant={confirm === 'delete' ? 'danger' : 'primary'}
                compact
                loading={busy}
                onPress={() => (confirm === 'delete' ? handleDeleteUser(u) : handleResetOnboarding(u))}
              />
              <Button label="Batal" variant="ghost" compact disabled={busy} onPress={() => setConfirm(null)} />
            </View>
          </View>
        ) : (
          <View style={styles.actions}>
            <Button label="Ubah peran" icon="swap-horizontal-outline" compact onPress={() => openRole(u)} />
            <Button label="Ubah data" icon="create-outline" variant="outline" compact onPress={() => handleOpenEditModal(u)} />
            {u.phone ? (
              <Button
                label="Chat WhatsApp"
                icon="logo-whatsapp"
                variant="outline"
                compact
                onPress={() => handleOpenWhatsApp(u.phone)}
              />
            ) : null}
            {!u.isOnboarded ? (
              <Button label="Minta isi ulang profil" icon="refresh-outline" variant="ghost" compact onPress={() => setConfirm('reset')} />
            ) : null}
            {!protectedUser ? (
              <Button label="Hapus akun" icon="trash-outline" variant="danger" compact onPress={() => setConfirm('delete')} />
            ) : (
              <T v="small" color={C.inkMuted} style={{ alignSelf: 'center' }}>
                Akun super user tidak dapat dihapus.
              </T>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderRolePicker = () =>
    selectedUser ? (
      <View style={{ gap: SP.s }}>
        <T color={C.inkMuted}>
          Pilih hak akses untuk {selectedUser.name} ({selectedUser.email}).
        </T>
        {actionError ? (
          <T v="small" color={C.dangerFg}>
            {actionError}
          </T>
        ) : null}
        {ALL_ROLES.map((r) => {
          const current = selectedUser.role === r.value;
          return (
            <Press
              key={r.value}
              onPress={() => handleUpdateRole(r.value)}
              disabled={busy}
              accessibilityRole="radio"
              accessibilityState={{ checked: current, disabled: busy }}
              accessibilityLabel={`${r.label}. ${r.desc}`}
              style={[styles.roleOption, current && styles.roleOptionActive]}
              hoverStyle={current ? undefined : { backgroundColor: C.sunken }}
            >
              <Ionicons name={r.icon} size={20} color={current ? C.g700 : C.inkMuted} aria-hidden />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="bodyStrong">{r.label}</T>
                <T v="small" color={C.inkMuted}>
                  {r.desc}
                </T>
              </View>
              {current ? <Badge label="Peran saat ini" tone="success" /> : null}
            </Press>
          );
        })}
        {busy ? <Loading label="Menyimpan peran..." /> : null}
      </View>
    ) : null;

  const renderForm = () => (
    <View style={{ gap: SP.l }}>
      <Field
        label="Alamat email Google (wajib)"
        value={formEmail}
        onChangeText={(t) => {
          setFormEmail(t);
          setFormErrors((e) => ({ ...e, email: undefined }));
        }}
        placeholder="jamaah@gmail.com"
        keyboardType="email-address"
        editable={!editingUser}
        error={formErrors.email}
        hint={editingUser ? 'Email akun tidak bisa diubah.' : undefined}
      />
      <Field
        label="Nama lengkap sesuai KTP (wajib)"
        value={formName}
        onChangeText={(t) => {
          setFormName(t);
          setFormErrors((e) => ({ ...e, name: undefined }));
        }}
        placeholder="Contoh: Ahmad Fauzi"
        error={formErrors.name}
      />
      <View style={styles.group}>
        <T v="label">Peran hak akses</T>
        <Segmented
          label="Peran hak akses"
          options={ALL_ROLES.map((r) => ({ key: r.value, label: r.short }))}
          value={formRole}
          onChange={setFormRole}
        />
      </View>
      <Field
        label="Nomor WhatsApp"
        value={formPhone}
        onChangeText={(val) => setFormPhone(normalizePhone(val))}
        placeholder="6281234567890"
        keyboardType="phone-pad"
        hint="Otomatis disimpan dengan awalan 62."
      />
      <View style={styles.group}>
        <T v="label">Blok rumah (Mutiara Puri Harmoni)</T>
        <Segmented
          label="Blok rumah"
          options={AVAILABLE_BLOCKS.map((b) => ({ key: b, label: b }))}
          value={formBlok}
          onChange={setFormBlok}
        />
      </View>
      <View style={styles.twoCols}>
        <Field style={styles.col} label="Nomor blok" value={formNomorBlok} onChangeText={setFormNomorBlok} placeholder="7" hint="Misal H7, isi 7" />
        <Field style={styles.col} label="Nomor rumah" value={formNoRumah} onChangeText={setFormNoRumah} placeholder="31" />
      </View>
      <T v="small" color={C.inkMuted}>
        Alamat tercatat: <T v="smallStrong">{`${formBlok}${formNomorBlok || ''} No.${formNoRumah || '...'}`}</T>
      </T>
      <View style={styles.twoCols}>
        <Field style={styles.col} label="RT / RW" value={formRtRw} onChangeText={setFormRtRw} placeholder="05/07" />
        <Field
          style={styles.col}
          label="Jumlah jiwa"
          value={formJumlahKeluarga}
          onChangeText={setFormJumlahKeluarga}
          placeholder="4"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.group}>
        <T v="label">Status kependudukan</T>
        <Segmented
          label="Status kependudukan"
          options={[
            { key: 'Tetap', label: 'Warga tetap' },
            { key: 'Kontrak', label: 'Warga kontrak' },
          ]}
          value={formStatusWarga}
          onChange={setFormStatusWarga}
        />
      </View>
      <Field
        label="Profesi atau bidang keahlian"
        value={formPekerjaan}
        onChangeText={setFormPekerjaan}
        placeholder="Contoh: Karyawan swasta"
      />
      <Field
        label="Catatan internal DKM"
        value={formCatatan}
        onChangeText={setFormCatatan}
        placeholder="Catatan tambahan"
        multiline
      />
      {actionError ? (
        <T v="small" color={C.dangerFg}>
          {actionError}
        </T>
      ) : null}
      <View style={styles.actions}>
        <Button label="Simpan pengguna" icon="save-outline" onPress={handleSaveUserForm} loading={formSaving} />
        <Button label="Batal" variant="ghost" onPress={closeSheet} disabled={formSaving} />
      </View>
    </View>
  );

  const renderList = () => {
    if (loading && !users.length) return <Loading label="Memuat daftar pengguna..." />;
    if (loadError)
      return (
        <EmptyState
          icon="cloud-offline-outline"
          title="Daftar pengguna belum bisa dimuat"
          text={`${loadError.replace(/\.?$/, '.')} Periksa koneksi internet atau hak akses akun, lalu muat ulang.`}
          action={<Button label="Muat ulang" icon="refresh-outline" variant="outline" onPress={loadUsers} />}
        />
      );
    if (!users.length)
      return (
        <EmptyState
          icon="people-outline"
          title="Belum ada pengguna terdaftar"
          text="Akun muncul di sini setelah warga masuk dengan Google, atau ditambahkan lewat tombol Tambah pengguna."
        />
      );
    if (!filteredUsers.length)
      return (
        <EmptyState
          icon="search-outline"
          title="Tidak ada pengguna yang cocok"
          text="Tidak ada akun yang sesuai dengan kata kunci atau saringan ini. Ubah kata kunci atau tampilkan semua."
          action={
            <Button
              label="Tampilkan semua"
              variant="outline"
              onPress={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
            />
          }
        />
      );
    return (
      <View>
        {filteredUsers.map((u, i) => {
          const selected = isDesktop && detailUser?.id === u.id;
          return (
            <View key={u.id} style={[styles.rowWrap, selected && styles.rowSelected]}>
              <ListRow
                leading={<Avatar name={u.name} dark={isProtected(u)} />}
                title={u.name}
                subtitle={`${u.email}\n${formatAddress(u)}`}
                trailing={
                  <View style={styles.rowBadges}>
                    <Badge label={roleShort(u.role)} tone={isProtected(u) ? 'success' : 'neutral'} />
                    {!u.isOnboarded ? <Badge label="Belum lengkap" tone="warn" /> : null}
                  </View>
                }
                onPress={() => openDetail(u)}
                accessibilityLabel={`${u.name}, ${roleShort(u.role)}${u.isOnboarded ? '' : ', profil belum lengkap'}. Buka rincian`}
                last={i === filteredUsers.length - 1}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const pengurus = (stats?.admin ?? 0) + (stats?.dkm ?? 0) + (stats?.superAdmin ?? 0);
  // Saat gagal memuat, jumlah tidak diketahui: tampilkan tanda strip, bukan 0.
  const n = (v: number) => (loadError && !stats ? '-' : String(v));
  const statCards = [
    <Stat
      key="total"
      hero
      label="Total terdaftar"
      value={n(stats?.total ?? users.length)}
      note={stats ? `${stats.pendingOnboarding} belum melengkapi profil` : undefined}
    />,
    <Stat key="dkm" label="Pengurus DKM" value={n(pengurus)} note="Super admin, ketua, dan pengurus" delay={50} />,
    <Stat key="bend" label="Bendahara" value={n(stats?.bendahara ?? 0)} note="Pengelola kas" delay={100} />,
    <Stat key="jamaah" label="Warga jamaah" value={n(stats?.jamaah ?? 0)} note="Akun peran jamaah" delay={150} />,
  ];

  const sheetTitle =
    sheetMode === 'role'
      ? 'Ubah peran pengguna'
      : sheetMode === 'form'
        ? editingUser
          ? 'Ubah data pengguna'
          : 'Tambah pengguna'
        : 'Rincian pengguna';

  return (
    <Screen>
      <PageHeader
        title="Kelola pengguna"
        subtitle={`Atur peran, data warga, dan status profil akun yang terdaftar.${currentUser ? ` Masuk sebagai ${currentUser.name}.` : ''}`}
        actions={
          <>
            <Button label="Tambah pengguna" icon="person-add-outline" onPress={handleOpenAddModal} />
            <Button label="Muat ulang" icon="refresh-outline" variant="outline" onPress={loadUsers} loading={loading} />
          </>
        }
      />

      {notice ? (
        <Animated.View
          style={[styles.notice, notice.tone === 'danger' && styles.noticeDanger, { opacity: noticeFade }]}
          accessibilityLiveRegion="polite"
        >
          <Ionicons
            name={notice.tone === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={18}
            color={notice.tone === 'success' ? C.g700 : C.dangerFg}
            aria-hidden
          />
          <Text style={[styles.noticeText, notice.tone === 'danger' && { color: C.dangerFg }]}>{notice.text}</Text>
        </Animated.View>
      ) : null}

      {isDesktop ? (
        <Row>{statCards}</Row>
      ) : (
        <>
          <Row stackBelow={0} gap={SP.m}>
            {statCards.slice(0, 2)}
          </Row>
          <Row stackBelow={0} gap={SP.m}>
            {statCards.slice(2)}
          </Row>
        </>
      )}

      <Row stackBelow={BP.desktop}>
        <Col flex={3}>
          <Card delay={120}>
            <CardHeader
              title="Daftar pengguna"
              subtitle={loading ? 'Memuat...' : `${filteredUsers.length} dari ${users.length} akun ditampilkan`}
            />
            <View style={styles.toolbar}>
              <Field
                label="Cari pengguna"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nama, email, nomor HP, atau alamat (misal H7 No.31)"
              />
              <View style={styles.group}>
                <T v="label">Saring menurut peran</T>
                <Segmented label="Saring menurut peran" options={filterOptions} value={activeCategory} onChange={setActiveCategory} />
              </View>
            </View>
            {renderList()}
          </Card>
        </Col>
        {isDesktop ? (
          <Col flex={2}>
            <Card delay={180}>
              <CardHeader title="Rincian pengguna" subtitle="Pilih pengguna di daftar untuk melihat dan mengubah datanya" />
              {detailUser ? (
                renderDetail(detailUser)
              ) : (
                <EmptyState
                  icon="person-outline"
                  title="Belum ada pengguna dipilih"
                  text="Daftar masih kosong atau tidak ada yang cocok dengan saringan. Ubah saringan untuk memilih pengguna."
                />
              )}
            </Card>
          </Col>
        ) : null}
      </Row>

      <Sheet visible={sheetMode !== null} onClose={closeSheet} title={sheetTitle}>
        {sheetMode === 'detail' && selectedUser ? renderDetail(selectedUser) : null}
        {sheetMode === 'role' ? renderRolePicker() : null}
        {sheetMode === 'form' ? renderForm() : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    gap: SP.m,
    marginBottom: SP.s,
  },
  group: {
    gap: 6,
  },
  rowWrap: {
    marginHorizontal: -SP.m,
    paddingHorizontal: SP.m,
    borderRadius: R.inner,
  },
  rowSelected: {
    backgroundColor: C.g50,
  },
  rowBadges: {
    alignItems: 'flex-end',
    gap: SP.xs,
    maxWidth: 120,
  },
  detail: {
    gap: SP.l,
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.m,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SP.xs,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.s,
    paddingVertical: SP.m,
  },
  infoRowLine: {
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  infoLabel: {
    width: 92,
    paddingTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SP.s,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.s,
    padding: SP.m,
    borderRadius: R.inner,
    backgroundColor: C.dangerBg,
  },
  confirmBox: {
    gap: SP.s,
    padding: SP.l,
    borderRadius: R.inner,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.sunken,
  },
  confirmDanger: {
    borderColor: C.dangerFg,
    backgroundColor: C.dangerBg,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.m,
    padding: SP.m,
    borderRadius: R.inner,
    borderWidth: 1,
    borderColor: C.line,
    minHeight: 56,
  },
  roleOptionActive: {
    borderColor: C.g700,
    backgroundColor: C.g50,
  },
  twoCols: {
    flexDirection: 'row',
    gap: SP.m,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.s,
    padding: SP.m,
    borderRadius: R.inner,
    backgroundColor: C.g50,
    borderWidth: 1,
    borderColor: C.g100,
  },
  noticeDanger: {
    backgroundColor: C.dangerBg,
    borderColor: C.dangerBg,
  },
  noticeText: {
    ...TYPE.bodyStrong,
    color: C.g700,
    flex: 1,
  } as TextStyle,
});
