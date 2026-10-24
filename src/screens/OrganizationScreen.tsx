import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { SubOrganization, UserRole } from '../types';
import { formatRupiah } from '../utils/formatters';
import { MUSHOLA_INFO, TPA_CLASSES, TPA_STAFF_MEMBERS, TPA_STRUCTURE_SUMMARY } from '../store/mockData';
import { THEME } from '../theme/colors';

interface RoleCardInfo {
  role: UserRole;
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  permissionsText: string[];
}

const ALL_ROLES: RoleCardInfo[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Ketua DKM (Super Admin)',
    badge: 'Akses Master',
    badgeColor: THEME.coral,
    badgeBg: THEME.coralSoftBg,
    icon: 'shield-checkmark',
    description: 'Akses otoritas tertinggi tanpa batasan ke seluruh pembukuan, pengaturan organisasi, dan tata kelola mushola.',
    permissionsText: ['Kas Pusat & Sub-Org', 'Agenda & Petugas Jumat', 'Kelola Inventaris', 'Data Sensus Warga', 'Kelola TV Signage'],
  },
  {
    role: 'BENDAHARA_DKM',
    title: 'Bendahara Utama DKM',
    badge: 'Keuangan DKM',
    badgeColor: THEME.paynesGray,
    badgeBg: THEME.silverLight,
    icon: 'wallet',
    description: 'Bertanggung jawab mencatat penerimaan ZIS/infaq, pengeluaran operasional DKM, pemindahan kas, dan warta keuangan Jumat.',
    permissionsText: ['Semua Mutasi Kas DKM', 'Pecah Kantong Kas', 'Laporan Rekap ZIS', 'Data Donatur Warga'],
  },
  {
    role: 'BENDAHARA_SUB',
    title: 'Bendahara Sub-Organisasi / TPA',
    badge: 'Otonom Sub-Org',
    badgeColor: THEME.coral,
    badgeBg: THEME.coralSoftBg,
    icon: 'card',
    description: 'Mengelola keuangan otonom unitnya sendiri (TPA, RISMA, atau Majelis Taklim). Terisolasi ketat dari kas utama mushola.',
    permissionsText: ['Kas Khusus Unit Otonom', 'Buat Kegiatan Unit', 'Laporan Transparansi Unit'],
  },
  {
    role: 'SEKRETARIS',
    title: 'Sekretaris & Sie Dakwah',
    badge: 'Dakwah & Warta',
    badgeColor: THEME.paynesGray,
    badgeBg: THEME.silverLight,
    icon: 'document-text',
    description: 'Mengatur kalender kajian, petugas khotib & imam sholat Jumat, pengumuman digital TV, dan pendataan sensus warga.',
    permissionsText: ['Kalender Agenda/Kajian', 'Jadwal Petugas Jumat', 'Update Warta TV Signage', 'Kelola Data Jamaah'],
  },
  {
    role: 'PENGURUS_SEKSI',
    title: 'Seksi Sarpras & Logistik',
    badge: 'Fasilitas & Aset',
    badgeColor: THEME.gunmetal,
    badgeBg: THEME.silverLight,
    icon: 'cube',
    description: 'Mengelola pencatatan aset inventaris mushola, pemeliharaan sound system & tenda, serta perizinan peminjaman oleh warga.',
    permissionsText: ['Tambah Aset Fisik', 'Update Kondisi Barang', 'Kelola Pinjam Pakai'],
  },
  {
    role: 'JAMAAH',
    title: 'Jamaah / Warga Lingkungan',
    badge: 'Transparansi Publik',
    badgeColor: THEME.paynesGray,
    badgeBg: THEME.silverLight,
    icon: 'people',
    description: 'Akses transparansi penuh untuk warga lingkungan: memantau saldo kas mushola, jadwal sholat akurat Kemenag, dan infaq QRIS.',
    permissionsText: ['Lihat Saldo Transparan', 'Jadwal Sholat & Countdown', 'Infaq Tanpa Nominal QRIS', 'Aspirasi / Kotak Saran'],
  },
];

export function OrganizationScreen() {
  const { subOrgs, pockets, currentRole, setCurrentRole, getTPABalance } = useMushola();
  const [selectedOrg, setSelectedOrg] = useState<SubOrganization>(subOrgs[0]);
  const [tpaSubTab, setTpaSubTab] = useState<'STRUKTUR' | 'GURU' | 'KELAS' | 'KEUANGAN'>('STRUKTUR');

  // Cari kantong kas milik organisasi ini
  const orgPockets = pockets.filter((p) => p.subOrgId === selectedOrg.id);
  const orgTotalBalance = orgPockets.reduce((sum, p) => sum + p.balance, 0);

  const isTPASelected = selectedOrg.id === 'org-tpa' || selectedOrg.category === 'TPA';

  const openWhatsApp = (phone: string, name: string) => {
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;
    const url = `https://wa.me/${cleanPhone}?text=Assalamu%27alaikum%20${encodeURIComponent(name)}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Intro Header */}
      <View style={styles.headerBox}>
        <View style={styles.headerBadgeRow}>
          <View style={styles.orgBadgePill}>
            <Ionicons name="git-network-outline" size={14} color={THEME.coral} />
            <Text style={styles.orgBadgePillText}>Tata Kelola Musholla & Otonom</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Struktur Organisasi & Badan Otonom</Text>
        <Text style={styles.headerSubtitle}>
          Pengelolaan berjenjang DKM Takmir Utama, Badan Otonom TPA Nurul Ilmi, Remaja Islam (RISMA), Majelis Taklim Khadijah, dan Panitia Ad-Hoc.
        </Text>
      </View>

      {/* Sub-Org Selector Cards */}
      <Text style={styles.sectionHeading}>Pilih Entitas Organisasi:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orgSelectorRow}>
        {subOrgs.map((org) => {
          const isSelected = org.id === selectedOrg.id;
          const isTpa = org.id === 'org-tpa';
          return (
            <TouchableOpacity
              key={org.id}
              style={[
                styles.orgTabCard,
                isSelected && { borderColor: THEME.coral, borderWidth: 2, backgroundColor: THEME.white },
                isTpa && styles.orgTabCardTpa,
              ]}
              onPress={() => setSelectedOrg(org)}
              activeOpacity={0.8}
            >
              <View style={[styles.orgColorIndicator, { backgroundColor: isSelected ? THEME.coral : org.color }]} />
              <View style={styles.orgTabNameRow}>
                <Text style={[styles.orgTabName, isSelected && { color: THEME.gunmetal }]}>
                  {org.shortName}
                </Text>
                {isTpa && (
                  <View style={styles.tpaStarBadge}>
                    <Text style={styles.tpaStarBadgeText}>Otonom</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orgTabCategory}>{org.category.replace('_', ' ')}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ============================================================== */}
      {/* JIKA TPA DIPILIH: TAMPILKAN STRUKTUR ORGANISASI TPA LENGKAP      */}
      {/* ============================================================== */}
      {isTPASelected ? (
        <View style={styles.tpaMainContainer}>
          {/* TPA Banner Card */}
          <View style={styles.tpaBannerCard}>
            <View style={styles.tpaBannerHeader}>
              <View style={styles.tpaEmblemCircle}>
                <Ionicons name="book" size={26} color={THEME.white} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.tpaOtonomTag}>
                  <Text style={styles.tpaOtonomTagText}>BADAN OTONOM MANDIRI</Text>
                </View>
                <Text style={styles.tpaBannerTitle}>TPA / TPQ Nurul Ilmi</Text>
                <Text style={styles.tpaBannerSubtitle}>Musholla Al-Muttaqin • Perumahan Mutiara Puri Harmoni Blok H</Text>
              </View>
            </View>

            <Text style={styles.tpaBannerDesc}>
              Lembaga pendidikan Al-Qur'an terakreditasi tingkat pemukiman yang mengelola kurikulum berjenjang dari Pra-TK hingga Tahfidz Juz 30. Memiliki struktur kepengurusan terpisah, dewan asatidz mandiri, serta pembukuan keuangan kas otonom tersendiri.
            </Text>

            {/* Quick Stat Highlights */}
            <View style={styles.tpaStatsGrid}>
              <View style={styles.tpaStatBox}>
                <Text style={styles.tpaStatNum}>{TPA_STRUCTURE_SUMMARY.totalSantri}</Text>
                <Text style={styles.tpaStatLabel}>Santri Aktif</Text>
                <Text style={styles.tpaStatSub}>24 Putra • 18 Putri</Text>
              </View>

              <View style={styles.tpaStatBox}>
                <Text style={styles.tpaStatNum}>{TPA_STRUCTURE_SUMMARY.activeClasses}</Text>
                <Text style={styles.tpaStatLabel}>Tingkat Kelas</Text>
                <Text style={styles.tpaStatSub}>Iqro 1-6 s.d Tahfidz</Text>
              </View>

              <View style={styles.tpaStatBox}>
                <Text style={styles.tpaStatNum}>{TPA_STAFF_MEMBERS.length}</Text>
                <Text style={styles.tpaStatLabel}>Dewan Asatidz</Text>
                <Text style={styles.tpaStatSub}>Ustadz & Ustadzah</Text>
              </View>

              <View style={styles.tpaStatBox}>
                <Text style={[styles.tpaStatNum, { color: THEME.coral }]}>
                  {formatRupiah(getTPABalance())}
                </Text>
                <Text style={styles.tpaStatLabel}>Kas Otonom TPA</Text>
                <Text style={styles.tpaStatSub}>4 Kantong Khusus</Text>
              </View>
            </View>

            {/* TPA Internal Tab Buttons */}
            <View style={styles.tpaSubTabRow}>
              <TouchableOpacity
                style={[styles.tpaSubTabBtn, tpaSubTab === 'STRUKTUR' && styles.tpaSubTabBtnActive]}
                onPress={() => setTpaSubTab('STRUKTUR')}
              >
                <Ionicons
                  name="git-branch-outline"
                  size={15}
                  color={tpaSubTab === 'STRUKTUR' ? THEME.white : THEME.paynesGray}
                />
                <Text
                  style={[
                    styles.tpaSubTabBtnText,
                    tpaSubTab === 'STRUKTUR' && styles.tpaSubTabBtnTextActive,
                  ]}
                >
                  Bagan Struktur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tpaSubTabBtn, tpaSubTab === 'GURU' && styles.tpaSubTabBtnActive]}
                onPress={() => setTpaSubTab('GURU')}
              >
                <Ionicons
                  name="school-outline"
                  size={15}
                  color={tpaSubTab === 'GURU' ? THEME.white : THEME.paynesGray}
                />
                <Text
                  style={[
                    styles.tpaSubTabBtnText,
                    tpaSubTab === 'GURU' && styles.tpaSubTabBtnTextActive,
                  ]}
                >
                  Dewan Asatidz ({TPA_STAFF_MEMBERS.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tpaSubTabBtn, tpaSubTab === 'KELAS' && styles.tpaSubTabBtnActive]}
                onPress={() => setTpaSubTab('KELAS')}
              >
                <Ionicons
                  name="layers-outline"
                  size={15}
                  color={tpaSubTab === 'KELAS' ? THEME.white : THEME.paynesGray}
                />
                <Text
                  style={[
                    styles.tpaSubTabBtnText,
                    tpaSubTab === 'KELAS' && styles.tpaSubTabBtnTextActive,
                  ]}
                >
                  Kurikulum & Kelas ({TPA_CLASSES.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tpaSubTabBtn, tpaSubTab === 'KEUANGAN' && styles.tpaSubTabBtnActive]}
                onPress={() => setTpaSubTab('KEUANGAN')}
              >
                <Ionicons
                  name="wallet-outline"
                  size={15}
                  color={tpaSubTab === 'KEUANGAN' ? THEME.white : THEME.paynesGray}
                />
                <Text
                  style={[
                    styles.tpaSubTabBtnText,
                    tpaSubTab === 'KEUANGAN' && styles.tpaSubTabBtnTextActive,
                  ]}
                >
                  Kas Otonom
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TAB 1: BAGAN HIRARKI STRUKTUR ORGANISASI TPA */}
          {tpaSubTab === 'STRUKTUR' && (
            <View style={styles.tpaTreeCard}>
              <View style={styles.tpaTreeHeader}>
                <Ionicons name="git-network" size={20} color={THEME.coral} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tpaTreeHeaderTitle}>Bagan Hirarki Kepengurusan TPA Nurul Ilmi</Text>
                  <Text style={styles.tpaTreeHeaderSubtitle}>
                    Struktur komando berjenjang dari pembina DKM hingga wali kelas pengajar:
                  </Text>
                </View>
              </View>

              {/* LEVEL 1: DEWAN PEMBINA */}
              <View style={styles.treeLevelBox}>
                <View style={[styles.treeLevelBadge, { backgroundColor: THEME.gunmetalDark }]}>
                  <Text style={styles.treeLevelBadgeText}>TINGKAT 1 • DEWAN PEMBINA DKM</Text>
                </View>
                <View style={styles.treeNodeRow}>
                  <View style={styles.treeNodeCard}>
                    <Ionicons name="shield-checkmark" size={18} color={THEME.coral} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.treeNodeName}>Ustadz Astriyo</Text>
                      <Text style={styles.treeNodeRole}>Pembina Syariah & Kurikulum DKM</Text>
                      <Text style={styles.treeNodePhone}>0857-7790-0383</Text>
                    </View>
                  </View>

                  <View style={styles.treeNodeCard}>
                    <Ionicons name="shield-checkmark" size={18} color={THEME.coral} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.treeNodeName}>Ustadz Dicky</Text>
                      <Text style={styles.treeNodeRole}>Pembina Lembaga & Ketua DKM</Text>
                      <Text style={styles.treeNodePhone}>0817-4958-342</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.treeConnectorVertical}>
                <Ionicons name="arrow-down" size={16} color={THEME.silverBorder} />
              </View>

              {/* LEVEL 2: KEPALA SEKOLAH / DIREKTUR TPA */}
              <View style={styles.treeLevelBox}>
                <View style={[styles.treeLevelBadge, { backgroundColor: THEME.coral }]}>
                  <Text style={styles.treeLevelBadgeText}>TINGKAT 2 • PIMPINAN LEMBAGA TPA</Text>
                </View>
                <View style={[styles.treeNodeCard, styles.treeNodeHeadCard]}>
                  <View style={styles.treeAvatarCircle}>
                    <Ionicons name="person" size={24} color={THEME.white} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.treeHeadName}>Ustadzah Maryam, S.Pd.I</Text>
                    <Text style={styles.treeHeadRole}>Kepala Sekolah / Direktur TPA Nurul Ilmi</Text>
                    <Text style={styles.treeHeadBio}>Penanggung jawab operasional, standarisasi pembelajaran, & bimbingan tahfidz</Text>
                    <TouchableOpacity
                      style={styles.treeHeadWaBtn}
                      onPress={() => openWhatsApp('6285799001122', 'Ustadzah Maryam')}
                    >
                      <Ionicons name="logo-whatsapp" size={13} color={THEME.white} />
                      <Text style={styles.treeHeadWaText}>Hubungi via WhatsApp (0857-9900-1122)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.treeConnectorVertical}>
                <Ionicons name="arrow-down" size={16} color={THEME.silverBorder} />
              </View>

              {/* LEVEL 3: SEKRETARIS & BENDAHARA */}
              <View style={styles.treeLevelBox}>
                <View style={[styles.treeLevelBadge, { backgroundColor: THEME.paynesGray }]}>
                  <Text style={styles.treeLevelBadgeText}>TINGKAT 3 • ADMINISTRASI & KEUANGAN OTONOM</Text>
                </View>
                <View style={styles.treeNodeRow}>
                  <View style={styles.treeNodeCard}>
                    <Ionicons name="document-text" size={20} color={THEME.coral} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.treeNodeName}>Ustadzah Siti Aisyah, S.Pd</Text>
                      <Text style={styles.treeNodeRole}>Sekretaris & Tata Usaha Santri</Text>
                      <Text style={styles.treeNodeDesc}>Pendaftaran, presensi, rapor santri</Text>
                      <TouchableOpacity
                        style={styles.treeMiniWa}
                        onPress={() => openWhatsApp('6281299887766', 'Ustadzah Siti Aisyah')}
                      >
                        <Ionicons name="logo-whatsapp" size={11} color={THEME.white} />
                        <Text style={styles.treeMiniWaText}>WA Tata Usaha</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.treeNodeCard}>
                    <Ionicons name="wallet" size={20} color={THEME.coral} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.treeNodeName}>Ustadzah Fitri Handayani, S.E</Text>
                      <Text style={styles.treeNodeRole}>Bendahara Keuangan Otonom</Text>
                      <Text style={styles.treeNodeDesc}>Kas SPP, honor guru, & buku modul</Text>
                      <TouchableOpacity
                        style={styles.treeMiniWa}
                        onPress={() => openWhatsApp('6281311223344', 'Ustadzah Fitri Handayani')}
                      >
                        <Ionicons name="logo-whatsapp" size={11} color={THEME.white} />
                        <Text style={styles.treeMiniWaText}>WA Bendahara</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.treeConnectorVertical}>
                <Ionicons name="arrow-down" size={16} color={THEME.silverBorder} />
              </View>

              {/* LEVEL 4: PENJAMIN MUTU & KURIKULUM */}
              <View style={styles.treeLevelBox}>
                <View style={[styles.treeLevelBadge, { backgroundColor: THEME.gunmetal }]}>
                  <Text style={styles.treeLevelBadgeText}>TINGKAT 4 • KOORDINATOR KURIKULUM & MUTU TAHSIN</Text>
                </View>
                <View style={styles.treeNodeCard}>
                  <Ionicons name="ribbon" size={20} color={THEME.coral} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.treeNodeName}>Ustadz Hafiz Al-Faruq, S.Ag</Text>
                    <Text style={styles.treeNodeRole}>Koordinator Kurikulum & Tahfidz Al-Qur'an</Text>
                    <Text style={styles.treeNodeDesc}>Penguji kenaikan jilid Iqro, makharijul huruf, dan pembina tartil</Text>
                  </View>
                </View>
              </View>

              <View style={styles.treeConnectorVertical}>
                <Ionicons name="arrow-down" size={16} color={THEME.silverBorder} />
              </View>

              {/* LEVEL 5: DEWAN GURU / WALI KELAS */}
              <View style={styles.treeLevelBox}>
                <View style={[styles.treeLevelBadge, { backgroundColor: THEME.coral }]}>
                  <Text style={styles.treeLevelBadgeText}>TINGKAT 5 • DEWAN GURU PENGAJAR / WALI KELAS</Text>
                </View>
                <View style={styles.treeTeachersGrid}>
                  {TPA_STAFF_MEMBERS.filter((s) => s.roleCategory === 'PENGAJAR').map((teacher) => (
                    <View key={teacher.id} style={styles.teacherMiniCard}>
                      <View style={styles.teacherMiniIcon}>
                        <Ionicons name="school" size={14} color={THEME.coral} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teacherMiniName}>{teacher.name}</Text>
                        <Text style={styles.teacherMiniClass}>{teacher.assignedClass}</Text>
                        <Text style={styles.teacherMiniBio}>{teacher.bio}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: DAFTAR ASATIDZ / PENGURUS TPA */}
          {tpaSubTab === 'GURU' && (
            <View style={styles.tpaStaffSection}>
              <Text style={styles.tpaSubSectionTitle}>Profil Lengkap Dewan Pengurus & Guru TPA:</Text>
              <View style={styles.staffCardsGrid}>
                {TPA_STAFF_MEMBERS.map((staff) => (
                  <View key={staff.id} style={styles.staffProfileCard}>
                    <View style={styles.staffProfileTop}>
                      <View style={styles.staffAvatarCircle}>
                        <Ionicons
                          name={staff.roleCategory === 'PENGAJAR' ? 'school' : 'person'}
                          size={18}
                          color={THEME.white}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.staffCardName}>{staff.name}</Text>
                        <Text style={styles.staffCardRole}>{staff.role}</Text>
                      </View>
                      <View style={styles.staffRolePill}>
                        <Text style={styles.staffRolePillText}>{staff.roleCategory}</Text>
                      </View>
                    </View>

                    {staff.assignedClass && (
                      <View style={styles.staffClassRow}>
                        <Ionicons name="book-outline" size={13} color={THEME.coral} />
                        <Text style={styles.staffClassText}>Mengampu: {staff.assignedClass}</Text>
                      </View>
                    )}

                    {staff.bio && <Text style={styles.staffBioText}>{staff.bio}</Text>}

                    <TouchableOpacity
                      style={styles.staffWaActionBtn}
                      onPress={() => openWhatsApp(staff.phone, staff.name)}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color={THEME.white} />
                      <Text style={styles.staffWaActionText}>Hubungi via WhatsApp ({staff.phone})</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 3: DAFTAR KELAS & KURIKULUM PEMBELAJARAN */}
          {tpaSubTab === 'KELAS' && (
            <View style={styles.tpaClassSection}>
              <Text style={styles.tpaSubSectionTitle}>Jenjang Kelas & Target Pembelajaran TPA:</Text>
              <View style={styles.classListWrap}>
                {TPA_CLASSES.map((cls, idx) => (
                  <View key={cls.id} style={styles.classCard}>
                    <View style={styles.classCardHeader}>
                      <View style={styles.classIndexBadge}>
                        <Text style={styles.classIndexText}>0{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.classCardTitle}>{cls.name}</Text>
                        <Text style={styles.classCardLevel}>{cls.level}</Text>
                      </View>
                      <View style={styles.studentCountBadge}>
                        <Ionicons name="people" size={13} color={THEME.coral} />
                        <Text style={styles.studentCountText}>{cls.studentCount} Santri</Text>
                      </View>
                    </View>

                    <View style={styles.classDetailsGrid}>
                      <View style={styles.classDetailItem}>
                        <Ionicons name="person-circle-outline" size={16} color={THEME.paynesGray} />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={styles.classDetailLabel}>Wali Kelas / Guru Pengajar</Text>
                          <Text style={styles.classDetailValue}>{cls.teacherName}</Text>
                        </View>
                      </View>

                      <View style={styles.classDetailItem}>
                        <Ionicons name="time-outline" size={16} color={THEME.paynesGray} />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={styles.classDetailLabel}>Jadwal KBM</Text>
                          <Text style={styles.classDetailValue}>{cls.schedule}</Text>
                        </View>
                      </View>

                      <View style={styles.classDetailItem}>
                        <Ionicons name="location-outline" size={16} color={THEME.paynesGray} />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={styles.classDetailLabel}>Lokasi Ruang</Text>
                          <Text style={styles.classDetailValue}>{cls.room}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.curriculumBox}>
                      <Ionicons name="bulb-outline" size={16} color={THEME.coral} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.curriculumLabel}>Target & Capaian Materi:</Text>
                        <Text style={styles.curriculumText}>{cls.curriculum}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 4: RINGKASAN KEUANGAN KAS OTONOM TPA */}
          {tpaSubTab === 'KEUANGAN' && (
            <View style={styles.tpaFinanceSection}>
              <View style={styles.tpaFinanceHeader}>
                <Ionicons name="wallet" size={22} color={THEME.coral} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tpaFinanceTitle}>Pembukuan Kas Otonom TPA Nurul Ilmi</Text>
                  <Text style={styles.tpaFinanceSubtitle}>
                    Kas mandiri terpisah penuh dari kas DKM musholla demi transparansi & kepastian honor asatidz serta kegiatan santri:
                  </Text>
                </View>
              </View>

              <View style={styles.tpaTotalCard}>
                <Text style={styles.tpaTotalLabel}>Total Saldo Kas Otonom TPA Saat Ini</Text>
                <Text style={styles.tpaTotalValue}>{formatRupiah(getTPABalance())}</Text>
                <Text style={styles.tpaTotalMeta}>
                  Tercatat 4 Kantong Kas Khusus • Dikelola oleh Bendahara TPA (Ustadzah Fitri Handayani)
                </Text>
              </View>

              <Text style={styles.tpaPocketListHeading}>Rincian 4 Kantong Kas Otonom TPA:</Text>
              <View style={styles.tpaPocketsGrid}>
                {orgPockets.map((p) => (
                  <View key={p.id} style={styles.tpaPocketCard}>
                    <View style={styles.tpaPocketTop}>
                      <View style={styles.tpaPocketIconBox}>
                        <Ionicons name="cash-outline" size={18} color={THEME.coral} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tpaPocketName}>{p.name}</Text>
                        <Text style={styles.tpaPocketCategory}>{p.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.tpaPocketBalance}>{formatRupiah(p.balance)}</Text>
                    <Text style={styles.tpaPocketDesc}>{p.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Call-to-Action Pendaftaran Santri */}
          <View style={styles.ctaCard}>
            <View style={styles.ctaHeaderRow}>
              <Ionicons name="school" size={24} color={THEME.coral} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.ctaTitle}>Penerimaan Santri Baru TPA Nurul Ilmi</Text>
                <Text style={styles.ctaSubtitle}>Terbuka untuk anak usia 4 s.d. 14 tahun warga lingkungan sekitar</Text>
              </View>
            </View>
            <Text style={styles.ctaBodyText}>
              Infaq pendaftaran santri baru Rp 50.000 (termasuk Buku Prestasi & Raport). Iuran SPP pendidikan Rp 35.000 / bulan. Bimbingan tahsin langsung oleh para asatidz berpengalaman.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => openWhatsApp('6281299887766', 'Ustadzah Siti Aisyah - Pendaftaran Santri TPA')}
            >
              <Ionicons name="logo-whatsapp" size={16} color={THEME.white} />
              <Text style={styles.ctaBtnText}>Daftar Santri Baru via WhatsApp (Tata Usaha)</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ============================================================== */
        /* JIKA SUB-ORG LAIN (DKM / RISMA / TAKLIM / QURBAN) DIPILIH      */
        /* ============================================================== */
        <View>
          {/* Detail Organisasi Terpilih */}
          <View style={[styles.orgDetailCard, { borderTopColor: selectedOrg.color, borderTopWidth: 4 }]}>
            <View style={styles.orgDetailTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orgDetailTitle}>{selectedOrg.name}</Text>
                <Text style={styles.orgDetailDesc}>{selectedOrg.description}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaBox}>
                <Ionicons name="person-circle-outline" size={20} color={THEME.coral} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.metaLabel}>Ketua / Penanggung Jawab</Text>
                  <Text style={styles.metaValue}>{selectedOrg.leaderName}</Text>
                </View>
              </View>

              <View style={styles.metaBox}>
                <Ionicons name="people-outline" size={20} color={THEME.paynesGray} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.metaLabel}>Anggota Aktif</Text>
                  <Text style={styles.metaValue}>{selectedOrg.memberCount} Orang</Text>
                </View>
              </View>

              <View style={styles.metaBox}>
                <Ionicons name="call-outline" size={20} color={THEME.paynesGray} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.metaLabel}>Kontak WhatsApp</Text>
                  <Text style={styles.metaValue}>{selectedOrg.contactPhone}</Text>
                </View>
              </View>

              <View style={styles.metaBox}>
                <Ionicons name="wallet-outline" size={20} color={THEME.coral} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.metaLabel}>Total Dana Dikelola</Text>
                  <Text style={[styles.metaValue, { color: THEME.coral }]}>
                    {formatRupiah(orgTotalBalance)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Kantong Kas Terkait */}
            {orgPockets.length > 0 && (
              <View style={styles.pocketSubSection}>
                <Text style={styles.pocketSubTitle}>Kantong Kas Unit Ini:</Text>
                {orgPockets.map((p) => (
                  <View key={p.id} style={styles.pocketRow}>
                    <Ionicons name="cash-outline" size={16} color={THEME.coral} />
                    <Text style={styles.pocketRowName}>{p.name}</Text>
                    <Text style={styles.pocketRowBalance}>{formatRupiah(p.balance)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* DKM Key Contact Persons */}
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Ionicons name="people" size={20} color={THEME.coral} />
              <Text style={styles.contactTitle}>Kontak Layanan Pengurus DKM</Text>
            </View>
            <Text style={styles.contactDesc}>
              Silakan hubungi perwakilan pengurus untuk keperluan perizinan mushola, pendaftaran santri,
              atau konsultasi keagamaan:
            </Text>
            <View style={styles.contactRowsWrap}>
              {MUSHOLA_INFO.contacts.map((c, idx) => (
                <View key={idx} style={styles.personRow}>
                  <View style={styles.personIcon}>
                    <Ionicons name="person" size={16} color={THEME.coral} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personNameText}>{c.name}</Text>
                    <Text style={styles.personRoleText}>{c.role} • {c.formattedPhone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.personWaBtn}
                    onPress={() => openWhatsApp(c.phone, c.name)}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color={THEME.white} />
                    <Text style={styles.personWaText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Role-Based Access Control Info (Interactive Switcher) */}
      <View style={styles.rbacCard}>
        <View style={styles.rbacHeader}>
          <Ionicons name="shield-checkmark" size={22} color={THEME.coral} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.rbacTitle}>Matriks & Pengalihan Hak Akses (RBAC)</Text>
            <Text style={styles.rbacDesc}>
              Ketuk pada kartu peran di bawah untuk menguji & merasakan langsung alur kerja tiap divisi pengurus:
            </Text>
          </View>
        </View>

        <View style={styles.rolesGrid}>
          {ALL_ROLES.map((r) => {
            const isActive = currentRole === r.role;
            return (
              <TouchableOpacity
                key={r.role}
                style={[
                  styles.roleCardInteractive,
                  isActive && styles.roleCardActive,
                ]}
                onPress={() => setCurrentRole(r.role)}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardTop}>
                  <View style={styles.roleTitleGroup}>
                    <View style={[styles.roleIconCircle, { backgroundColor: r.badgeBg }]}>
                      <Ionicons name={r.icon} size={18} color={r.badgeColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleCardTitle}>{r.title}</Text>
                      <View style={[styles.badgePill, { backgroundColor: r.badgeBg }]}>
                        <Text style={[styles.badgePillText, { color: r.badgeColor }]}>{r.badge}</Text>
                      </View>
                    </View>
                  </View>

                  {isActive && (
                    <View style={styles.activeCheckBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={THEME.coral} />
                      <Text style={styles.activeCheckText}>Aktif</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.roleDescText}>{r.description}</Text>

                <View style={styles.permsWrap}>
                  {r.permissionsText.map((p, idx) => (
                    <View key={idx} style={styles.permChip}>
                      <Ionicons name="checkmark" size={11} color={THEME.coral} />
                      <Text style={styles.permChipText}>{p}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.roleCardFooter}>
                  <Text style={[styles.roleActionHint, isActive && styles.roleActionHintActive]}>
                    {isActive ? '● Sedang Digunakan Saat Ini' : 'Ketuk untuk Beralih ke Peran Ini →'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBox: {
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  headerBadgeRow: {
    marginBottom: 6,
  },
  orgBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  orgBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.coral,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.gunmetal,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.paynesGray,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginBottom: 10,
  },
  orgSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  orgTabCard: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 145,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  orgTabCardTpa: {
    borderColor: THEME.coral,
  },
  orgColorIndicator: {
    width: 28,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  orgTabNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  orgTabName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  tpaStarBadge: {
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tpaStarBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.coral,
  },
  orgTabCategory: {
    fontSize: 10,
    color: THEME.paynesGray,
    textTransform: 'uppercase',
  },

  // TPA STYLES
  tpaMainContainer: {
    marginBottom: 20,
  },
  tpaBannerCard: {
    backgroundColor: THEME.gunmetal,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  tpaBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tpaEmblemCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tpaOtonomTag: {
    backgroundColor: 'rgba(239, 131, 84, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  tpaOtonomTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.coral,
    letterSpacing: 0.5,
  },
  tpaBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.white,
  },
  tpaBannerSubtitle: {
    fontSize: 11,
    color: THEME.silver,
    marginTop: 1,
  },
  tpaBannerDesc: {
    fontSize: 12,
    color: THEME.silver,
    lineHeight: 18,
    marginBottom: 16,
  },
  tpaStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tpaStatBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: THEME.gunmetalHover,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(191, 192, 192, 0.2)',
  },
  tpaStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.white,
  },
  tpaStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.silver,
    marginTop: 2,
  },
  tpaStatSub: {
    fontSize: 10,
    color: 'rgba(191, 192, 192, 0.8)',
    marginTop: 1,
  },
  tpaSubTabRow: {
    flexDirection: 'row',
    backgroundColor: THEME.gunmetalDark,
    padding: 4,
    borderRadius: 10,
    gap: 4,
  },
  tpaSubTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 7,
  },
  tpaSubTabBtnActive: {
    backgroundColor: THEME.coral,
  },
  tpaSubTabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.silver,
  },
  tpaSubTabBtnTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },

  // TREE STYLES
  tpaTreeCard: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  tpaTreeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: THEME.silverLine,
  },
  tpaTreeHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  tpaTreeHeaderSubtitle: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 2,
  },
  treeLevelBox: {
    backgroundColor: THEME.silverLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.silverLine,
  },
  treeLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  treeLevelBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: 0.5,
  },
  treeNodeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  treeNodeCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME.white,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  treeNodeHeadCard: {
    padding: 14,
    borderColor: THEME.coral,
    borderWidth: 1.5,
  },
  treeAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeHeadName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  treeHeadRole: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.coral,
    marginTop: 1,
  },
  treeHeadBio: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 3,
    lineHeight: 16,
  },
  treeHeadWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  treeHeadWaText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.white,
  },
  treeNodeName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  treeNodeRole: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.coral,
    marginTop: 1,
  },
  treeNodePhone: {
    fontSize: 10,
    color: THEME.paynesGray,
    marginTop: 2,
  },
  treeNodeDesc: {
    fontSize: 10,
    color: THEME.paynesGray,
    marginTop: 2,
  },
  treeMiniWa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  treeMiniWaText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.white,
  },
  treeConnectorVertical: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  treeTeachersGrid: {
    gap: 8,
  },
  teacherMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  teacherMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  teacherMiniName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  teacherMiniClass: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.coral,
  },
  teacherMiniBio: {
    fontSize: 10,
    color: THEME.paynesGray,
    marginTop: 1,
  },

  // STAFF PROFILES
  tpaStaffSection: {
    marginBottom: 16,
  },
  tpaSubSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
    marginBottom: 10,
  },
  staffCardsGrid: {
    gap: 10,
  },
  staffProfileCard: {
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  staffProfileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  staffAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.gunmetal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  staffCardRole: {
    fontSize: 11,
    color: THEME.coral,
    fontWeight: '600',
  },
  staffRolePill: {
    backgroundColor: THEME.silverLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  staffRolePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.paynesGray,
  },
  staffClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.coralSoftBg,
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  staffClassText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.coral,
  },
  staffBioText: {
    fontSize: 11,
    color: THEME.paynesGray,
    lineHeight: 16,
    marginBottom: 10,
  },
  staffWaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 7,
    borderRadius: 8,
  },
  staffWaActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.white,
  },

  // CLASSES
  tpaClassSection: {
    marginBottom: 16,
  },
  classListWrap: {
    gap: 12,
  },
  classCard: {
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  classIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.gunmetal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.white,
  },
  classCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  classCardLevel: {
    fontSize: 11,
    color: THEME.paynesGray,
  },
  studentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  studentCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.coral,
  },
  classDetailsGrid: {
    backgroundColor: THEME.silverLight,
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
  },
  classDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classDetailLabel: {
    fontSize: 10,
    color: THEME.paynesGray,
  },
  classDetailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  curriculumBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME.coralSoftBg,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.coralBorder,
  },
  curriculumLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.coral,
  },
  curriculumText: {
    fontSize: 11,
    color: THEME.gunmetal,
    marginTop: 2,
    lineHeight: 16,
  },

  // TPA FINANCE SECTION
  tpaFinanceSection: {
    marginBottom: 16,
  },
  tpaFinanceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: THEME.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    marginBottom: 12,
  },
  tpaFinanceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  tpaFinanceSubtitle: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 2,
    lineHeight: 16,
  },
  tpaTotalCard: {
    backgroundColor: THEME.gunmetal,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  tpaTotalLabel: {
    fontSize: 12,
    color: THEME.silver,
  },
  tpaTotalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.coral,
    marginVertical: 4,
  },
  tpaTotalMeta: {
    fontSize: 10,
    color: THEME.silver,
  },
  tpaPocketListHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginBottom: 8,
  },
  tpaPocketsGrid: {
    gap: 8,
  },
  tpaPocketCard: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  tpaPocketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tpaPocketIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpaPocketName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  tpaPocketCategory: {
    fontSize: 9,
    color: THEME.paynesGray,
    textTransform: 'uppercase',
  },
  tpaPocketBalance: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.coral,
    marginBottom: 4,
  },
  tpaPocketDesc: {
    fontSize: 11,
    color: THEME.paynesGray,
    lineHeight: 16,
  },

  // CTA
  ctaCard: {
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.coral,
  },
  ctaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  ctaSubtitle: {
    fontSize: 11,
    color: THEME.paynesGray,
  },
  ctaBodyText: {
    fontSize: 11,
    color: THEME.paynesGray,
    lineHeight: 17,
    marginBottom: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
  },
  ctaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.white,
  },

  // NON-TPA STYLES
  orgDetailCard: {
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  orgDetailTop: {
    marginBottom: 14,
  },
  orgDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.gunmetal,
    marginBottom: 6,
  },
  orgDetailDesc: {
    fontSize: 13,
    color: THEME.paynesGray,
    lineHeight: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.silverLight,
    borderRadius: 10,
    padding: 10,
    width: '48%',
    borderWidth: 1,
    borderColor: THEME.silverLine,
  },
  metaLabel: {
    fontSize: 10,
    color: THEME.paynesGray,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginTop: 2,
  },
  pocketSubSection: {
    backgroundColor: THEME.coralSoftBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.coralBorder,
  },
  pocketSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginBottom: 8,
  },
  pocketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pocketRowName: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: THEME.gunmetal,
    fontWeight: '500',
  },
  pocketRowBalance: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.coral,
  },
  contactCard: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  contactDesc: {
    fontSize: 12,
    color: THEME.paynesGray,
    marginBottom: 12,
    lineHeight: 18,
  },
  contactRowsWrap: {
    gap: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.silverLight,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.silverLine,
  },
  personIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  personNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  personRoleText: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 1,
  },
  personWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  personWaText: {
    color: THEME.white,
    fontSize: 11,
    fontWeight: '700',
  },
  rbacCard: {
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    marginBottom: 16,
  },
  rbacHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  rbacTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.gunmetal,
    marginBottom: 4,
  },
  rbacDesc: {
    fontSize: 12,
    color: THEME.paynesGray,
    lineHeight: 18,
  },
  rolesGrid: {
    gap: 12,
  },
  roleCardInteractive: {
    backgroundColor: THEME.silverLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: THEME.silverBorder,
  },
  roleCardActive: {
    backgroundColor: THEME.white,
    borderColor: THEME.coral,
    shadowColor: THEME.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  roleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roleTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeCheckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.coralBorder,
  },
  activeCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.coral,
  },
  roleDescText: {
    fontSize: 12,
    color: THEME.paynesGray,
    lineHeight: 18,
    marginBottom: 10,
  },
  permsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  permChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  permChipText: {
    fontSize: 11,
    color: THEME.gunmetal,
    fontWeight: '500',
  },
  roleCardFooter: {
    borderTopWidth: 1,
    borderColor: THEME.silverLine,
    paddingTop: 8,
    marginTop: 2,
  },
  roleActionHint: {
    fontSize: 11,
    color: THEME.paynesGray,
    fontWeight: '600',
  },
  roleActionHintActive: {
    color: THEME.coral,
    fontWeight: '700',
  },
});
