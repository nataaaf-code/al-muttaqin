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
                styles.orgPillTab,
                isSelected && styles.orgPillTabActive,
                isTpa && !isSelected && styles.orgPillTabTpa,
              ]}
              onPress={() => setSelectedOrg(org)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.orgDotCircle,
                  { backgroundColor: isSelected ? THEME.white : isTpa ? THEME.coral : org.color },
                ]}
              >
                <Ionicons
                  name={isTpa ? 'school' : org.category === 'DKM' ? 'business' : 'people'}
                  size={12}
                  color={isSelected ? (isTpa ? THEME.coral : THEME.gunmetal) : THEME.white}
                />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    style={[
                      styles.orgPillName,
                      isSelected && styles.orgPillNameActive,
                    ]}
                  >
                    {org.shortName}
                  </Text>
                  {isTpa && (
                    <View style={[styles.tpaBadgeMicro, isSelected && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                      <Text style={[styles.tpaBadgeMicroText, isSelected && { color: THEME.white }]}>
                        Otonom
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.orgPillCategory,
                    isSelected && styles.orgPillCategoryActive,
                  ]}
                >
                  {org.category.replace('_', ' ')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ============================================================== */}
      {/* JIKA TPA DIPILIH: TAMPILKAN STRUKTUR ORGANISASI TPA LENGKAP      */}
      {/* ============================================================== */}
      {isTPASelected ? (
        <View style={styles.tpaMainContainer}>
          {/* TPA Fluid Hero Banner Card */}
          <View style={styles.tpaHeroSurface}>
            <View style={styles.tpaHeroTopRow}>
              <View style={styles.tpaEmblemCircle}>
                <Ionicons name="book" size={26} color={THEME.white} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.tpaOtonomBadge}>
                  <Ionicons name="sparkles" size={10} color={THEME.coral} />
                  <Text style={styles.tpaOtonomBadgeText}>BADAN OTONOM MANDIRI</Text>
                </View>
                <Text style={styles.tpaHeroTitle}>TPA / TPQ Nurul Ilmi</Text>
                <Text style={styles.tpaHeroLocation}>
                  Musholla Al-Muttaqin • Perumahan Mutiara Puri Harmoni Blok H
                </Text>
              </View>
            </View>

            <Text style={styles.tpaHeroDescription}>
              Lembaga pembinaan Al-Qur'an terpadu santri lingkungan sekitar. Dikelola secara mandiri dengan kurikulum berjenjang dari Pra-TK (Iqro) hingga Tahfidz Juz 30, dewan asatidz mandiri, serta pembukuan kas otonom terpisah.
            </Text>

            {/* Seamless Unified Metric Ribbon (No Boxy Borders) */}
            <View style={styles.tpaMetricRibbon}>
              <View style={styles.metricRibbonItem}>
                <Text style={styles.metricRibbonNum}>{TPA_STRUCTURE_SUMMARY.totalSantri}</Text>
                <Text style={styles.metricRibbonLabel}>Santri Aktif</Text>
                <Text style={styles.metricRibbonSub}>24 Putra • 18 Putri</Text>
              </View>

              <View style={styles.metricRibbonDivider} />

              <View style={styles.metricRibbonItem}>
                <Text style={styles.metricRibbonNum}>{TPA_STRUCTURE_SUMMARY.activeClasses}</Text>
                <Text style={styles.metricRibbonLabel}>Jenjang Kelas</Text>
                <Text style={styles.metricRibbonSub}>Iqro 1-6 s.d Tahfidz</Text>
              </View>

              <View style={styles.metricRibbonDivider} />

              <View style={styles.metricRibbonItem}>
                <Text style={styles.metricRibbonNum}>{TPA_STAFF_MEMBERS.length}</Text>
                <Text style={styles.metricRibbonLabel}>Dewan Guru</Text>
                <Text style={styles.metricRibbonSub}>Asatidz & Ustadzah</Text>
              </View>

              <View style={styles.metricRibbonDivider} />

              <View style={styles.metricRibbonItem}>
                <Text style={[styles.metricRibbonNum, { color: THEME.coral }]}>
                  {formatRupiah(getTPABalance())}
                </Text>
                <Text style={styles.metricRibbonLabel}>Kas Otonom</Text>
                <Text style={styles.metricRibbonSub}>4 Kantong Mandiri</Text>
              </View>
            </View>

            {/* Fluid Capsule Segmented Tabs */}
            <View style={styles.tpaCapsuleNav}>
              <TouchableOpacity
                style={[styles.tpaCapsuleItem, tpaSubTab === 'STRUKTUR' && styles.tpaCapsuleItemActive]}
                onPress={() => setTpaSubTab('STRUKTUR')}
              >
                <Ionicons
                  name="git-branch-outline"
                  size={14}
                  color={tpaSubTab === 'STRUKTUR' ? THEME.white : THEME.silver}
                />
                <Text
                  style={[
                    styles.tpaCapsuleText,
                    tpaSubTab === 'STRUKTUR' && styles.tpaCapsuleTextActive,
                  ]}
                >
                  Bagan Struktur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tpaCapsuleItem, tpaSubTab === 'GURU' && styles.tpaCapsuleItemActive]}
                onPress={() => setTpaSubTab('GURU')}
              >
                <Ionicons
                  name="school-outline"
                  size={14}
                  color={tpaSubTab === 'GURU' ? THEME.white : THEME.silver}
                />
                <Text
                  style={[
                    styles.tpaCapsuleText,
                    tpaSubTab === 'GURU' && styles.tpaCapsuleTextActive,
                  ]}
                >
                  Dewan Guru
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tpaCapsuleItem, tpaSubTab === 'KELAS' && styles.tpaCapsuleItemActive]}
                onPress={() => setTpaSubTab('KELAS')}
              >
                <Ionicons
                  name="layers-outline"
                  size={14}
                  color={tpaSubTab === 'KELAS' ? THEME.white : THEME.silver}
                />
                <Text
                  style={[
                    styles.tpaCapsuleText,
                    tpaSubTab === 'KELAS' && styles.tpaCapsuleTextActive,
                  ]}
                >
                  Kurikulum
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tpaCapsuleItem, tpaSubTab === 'KEUANGAN' && styles.tpaCapsuleItemActive]}
                onPress={() => setTpaSubTab('KEUANGAN')}
              >
                <Ionicons
                  name="wallet-outline"
                  size={14}
                  color={tpaSubTab === 'KEUANGAN' ? THEME.white : THEME.silver}
                />
                <Text
                  style={[
                    styles.tpaCapsuleText,
                    tpaSubTab === 'KEUANGAN' && styles.tpaCapsuleTextActive,
                  ]}
                >
                  Kas Mandiri
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TAB 1: BAGAN HIRARKI STRUKTUR ORGANISASI TPA (SEAMLESS FLOW) */}
          {tpaSubTab === 'STRUKTUR' && (
            <View style={styles.tpaFlowCanvas}>
              <View style={styles.flowCanvasHeader}>
                <Ionicons name="git-network" size={20} color={THEME.coral} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.flowCanvasTitle}>Bagan Alur Kepengurusan TPA</Text>
                  <Text style={styles.flowCanvasSubtitle}>
                    Hubungan koordinatif berjenjang dari pembina DKM hingga wali kelas:
                  </Text>
                </View>
              </View>

              {/* LEVEL 1: DEWAN PEMBINA */}
              <View style={styles.flowTierWrap}>
                <View style={styles.flowTierHeader}>
                  <View style={[styles.flowTierDot, { backgroundColor: THEME.paynesGray }]} />
                  <Text style={styles.flowTierTitle}>TINGKAT 1 • DEWAN PEMBINA DKM</Text>
                </View>
                <View style={styles.duoPillRow}>
                  <View style={styles.duoPillCard}>
                    <View style={styles.duoPillIcon}>
                      <Ionicons name="shield-checkmark" size={16} color={THEME.coral} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.duoPillName}>Ustadz Astriyo</Text>
                      <Text style={styles.duoPillRole}>Pembina Syariah & Agama</Text>
                      <Text style={styles.duoPillMeta}>0857-7790-0383</Text>
                    </View>
                  </View>

                  <View style={styles.duoPillCard}>
                    <View style={styles.duoPillIcon}>
                      <Ionicons name="shield-checkmark" size={16} color={THEME.coral} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.duoPillName}>Ustadz Dicky</Text>
                      <Text style={styles.duoPillRole}>Pembina Lembaga / Ketua DKM</Text>
                      <Text style={styles.duoPillMeta}>0817-4958-342</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Connecting Flow Line */}
              <View style={styles.connectingRail}>
                <View style={styles.railLine} />
                <View style={styles.railNode} />
                <View style={styles.railLine} />
              </View>

              {/* LEVEL 2: KEPALA TPA (HERO FEATURE CARD) */}
              <View style={styles.flowTierWrap}>
                <View style={styles.flowTierHeader}>
                  <View style={[styles.flowTierDot, { backgroundColor: THEME.coral }]} />
                  <Text style={styles.flowTierTitle}>TINGKAT 2 • DIREKTUR / KEPALA SEKOLAH</Text>
                </View>
                <View style={styles.headmasterHeroSurface}>
                  <View style={styles.headmasterLeft}>
                    <View style={styles.headmasterAvatarRing}>
                      <Ionicons name="person" size={26} color={THEME.white} />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.headmasterRoleTag}>
                      <Text style={styles.headmasterRoleTagText}>PIMPINAN AKADEMIK & TAHFIDZ</Text>
                    </View>
                    <Text style={styles.headmasterName}>Ustadzah Maryam, S.Pd.I</Text>
                    <Text style={styles.headmasterBio}>
                      Alumnus Tarbiyah PAI, pemegang sanad tahsin Tilawati & penanggung jawab operasional harian TPA.
                    </Text>
                    <TouchableOpacity
                      style={styles.headmasterWaPill}
                      onPress={() => openWhatsApp('6285799001122', 'Ustadzah Maryam')}
                    >
                      <Ionicons name="logo-whatsapp" size={13} color={THEME.white} />
                      <Text style={styles.headmasterWaPillText}>WhatsApp Kepala TPA (0857-9900-1122)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Connecting Flow Line */}
              <View style={styles.connectingRail}>
                <View style={styles.railLine} />
                <View style={styles.railNode} />
                <View style={styles.railLine} />
              </View>

              {/* LEVEL 3: TATA USAHA & BENDAHARA (DUO HARMONY) */}
              <View style={styles.flowTierWrap}>
                <View style={styles.flowTierHeader}>
                  <View style={[styles.flowTierDot, { backgroundColor: THEME.paynesGray }]} />
                  <Text style={styles.flowTierTitle}>TINGKAT 3 • ADMINISTRASI & KEUANGAN MANDIRI</Text>
                </View>
                <View style={styles.duoPillRow}>
                  <View style={styles.adminSeamlessCard}>
                    <View style={styles.adminIconCircle}>
                      <Ionicons name="document-text" size={18} color={THEME.coral} />
                    </View>
                    <Text style={styles.adminCardName}>Ustadzah Siti Aisyah, S.Pd</Text>
                    <Text style={styles.adminCardRole}>Sekretaris & Tata Usaha</Text>
                    <Text style={styles.adminCardDesc}>Pendaftaran, presensi, & raport santri</Text>
                    <TouchableOpacity
                      style={styles.adminWaBtn}
                      onPress={() => openWhatsApp('6281299887766', 'Ustadzah Siti Aisyah')}
                    >
                      <Ionicons name="logo-whatsapp" size={11} color={THEME.white} />
                      <Text style={styles.adminWaBtnText}>WA Tata Usaha</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.adminSeamlessCard}>
                    <View style={styles.adminIconCircle}>
                      <Ionicons name="wallet" size={18} color={THEME.coral} />
                    </View>
                    <Text style={styles.adminCardName}>Ustadzah Fitri Handayani, S.E</Text>
                    <Text style={styles.adminCardRole}>Bendahara Kas Otonom</Text>
                    <Text style={styles.adminCardDesc}>Kas SPP, honor guru, & buku modul</Text>
                    <TouchableOpacity
                      style={styles.adminWaBtn}
                      onPress={() => openWhatsApp('6281311223344', 'Ustadzah Fitri Handayani')}
                    >
                      <Ionicons name="logo-whatsapp" size={11} color={THEME.white} />
                      <Text style={styles.adminWaBtnText}>WA Bendahara</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Connecting Flow Line */}
              <View style={styles.connectingRail}>
                <View style={styles.railLine} />
                <View style={styles.railNode} />
                <View style={styles.railLine} />
              </View>

              {/* LEVEL 4: KURIKULUM & TAHSIN */}
              <View style={styles.flowTierWrap}>
                <View style={styles.flowTierHeader}>
                  <View style={[styles.flowTierDot, { backgroundColor: THEME.gunmetal }]} />
                  <Text style={styles.flowTierTitle}>TINGKAT 4 • KOORDINATOR KURIKULUM & MUTU</Text>
                </View>
                <View style={styles.curriculumBannerCard}>
                  <View style={styles.curriculumIconCircle}>
                    <Ionicons name="ribbon" size={20} color={THEME.coral} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.curriculumLeaderName}>Ustadz Hafiz Al-Faruq, S.Ag</Text>
                    <Text style={styles.curriculumLeaderRole}>Penjamin Mutu Tahsin & Tartil Al-Qur'an</Text>
                    <Text style={styles.curriculumLeaderDesc}>
                      Hafizh 30 Juz, penguji kenaikan jilid Iqro, bimbingan makharijul huruf & tartil santri.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Connecting Flow Line */}
              <View style={styles.connectingRail}>
                <View style={styles.railLine} />
                <View style={styles.railNode} />
                <View style={styles.railLine} />
              </View>

              {/* LEVEL 5: DEWAN ASATIDZ / WALI KELAS */}
              <View style={styles.flowTierWrap}>
                <View style={styles.flowTierHeader}>
                  <View style={[styles.flowTierDot, { backgroundColor: THEME.coral }]} />
                  <Text style={styles.flowTierTitle}>TINGKAT 5 • DEWAN GURU / WALI KELAS BIMBINGAN</Text>
                </View>
                <View style={styles.teachersStreamCanvas}>
                  {TPA_STAFF_MEMBERS.filter((s) => s.roleCategory === 'PENGAJAR').map((teacher, index) => (
                    <View key={teacher.id} style={styles.teacherStreamItem}>
                      <View style={styles.teacherAvatarDot}>
                        <Ionicons name="school" size={13} color={THEME.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teacherStreamName}>{teacher.name}</Text>
                        <Text style={styles.teacherStreamClass}>{teacher.assignedClass}</Text>
                        <Text style={styles.teacherStreamBio}>{teacher.bio}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.teacherWaMiniBtn}
                        onPress={() => openWhatsApp(teacher.phone, teacher.name)}
                      >
                        <Ionicons name="logo-whatsapp" size={12} color="#25D366" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: DAFTAR ASATIDZ / PENGURUS TPA (UNIFIED SHOWCASE) */}
          {tpaSubTab === 'GURU' && (
            <View style={styles.tpaStaffSection}>
              <Text style={styles.tpaSubSectionTitle}>Direktori Dewan Asatidz & Tenaga Pendidik:</Text>
              <View style={styles.staffStreamCanvas}>
                {TPA_STAFF_MEMBERS.map((staff, idx) => (
                  <View
                    key={staff.id}
                    style={[
                      styles.staffStreamRow,
                      idx === TPA_STAFF_MEMBERS.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.staffAvatarGlow}>
                      <Ionicons
                        name={staff.roleCategory === 'PENGAJAR' ? 'school' : 'person'}
                        size={18}
                        color={THEME.coral}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.staffNameHeadingRow}>
                        <Text style={styles.staffNameText}>{staff.name}</Text>
                        <View style={styles.staffCategoryChip}>
                          <Text style={styles.staffCategoryChipText}>{staff.roleCategory}</Text>
                        </View>
                      </View>
                      <Text style={styles.staffRoleSubtitle}>{staff.role}</Text>
                      {staff.assignedClass && (
                        <View style={styles.assignedClassChip}>
                          <Ionicons name="book-outline" size={11} color={THEME.coral} />
                          <Text style={styles.assignedClassChipText}>{staff.assignedClass}</Text>
                        </View>
                      )}
                      {staff.bio && <Text style={styles.staffBioDescription}>{staff.bio}</Text>}
                    </View>
                    <TouchableOpacity
                      style={styles.staffChatCircle}
                      onPress={() => openWhatsApp(staff.phone, staff.name)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color={THEME.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 3: DAFTAR KELAS & KURIKULUM (CURRICULAR STEPPER) */}
          {tpaSubTab === 'KELAS' && (
            <View style={styles.tpaClassSection}>
              <Text style={styles.tpaSubSectionTitle}>Jenjang Kurikulum & Pembagian Kelas:</Text>
              <View style={styles.curriculumStepperWrap}>
                {TPA_CLASSES.map((cls, idx) => (
                  <View key={cls.id} style={styles.stepperItemCard}>
                    {/* Stepper Level Header */}
                    <View style={styles.stepperHeaderRow}>
                      <View style={styles.stepperBadgeOrb}>
                        <Text style={styles.stepperBadgeOrbText}>0{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepperTitle}>{cls.name}</Text>
                        <Text style={styles.stepperLevelText}>{cls.level}</Text>
                      </View>
                      <View style={styles.stepperStudentTag}>
                        <Ionicons name="people" size={12} color={THEME.coral} />
                        <Text style={styles.stepperStudentTagText}>{cls.studentCount} Santri</Text>
                      </View>
                    </View>

                    {/* Stepper Quick Meta Rail */}
                    <View style={styles.stepperMetaRail}>
                      <View style={styles.stepperMetaItem}>
                        <Ionicons name="person-outline" size={13} color={THEME.paynesGray} />
                        <Text style={styles.stepperMetaText}>{cls.teacherName}</Text>
                      </View>
                      <View style={styles.stepperMetaItem}>
                        <Ionicons name="time-outline" size={13} color={THEME.paynesGray} />
                        <Text style={styles.stepperMetaText}>{cls.schedule}</Text>
                      </View>
                      <View style={styles.stepperMetaItem}>
                        <Ionicons name="location-outline" size={13} color={THEME.paynesGray} />
                        <Text style={styles.stepperMetaText}>{cls.room}</Text>
                      </View>
                    </View>

                    {/* Stepper Competency Highlight */}
                    <View style={styles.stepperCompetencyBox}>
                      <Ionicons name="bulb" size={15} color={THEME.coral} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.stepperCompetencyLabel}>Target Capaian Santri:</Text>
                        <Text style={styles.stepperCompetencyDesc}>{cls.curriculum}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 4: RINGKASAN KAS OTONOM TPA (SEAMLESS LEDGER) */}
          {tpaSubTab === 'KEUANGAN' && (
            <View style={styles.tpaFinanceSection}>
              <View style={styles.tpaFinanceHeroCard}>
                <View style={styles.tpaFinanceHeroTop}>
                  <View style={styles.tpaFinanceIconOrb}>
                    <Ionicons name="wallet" size={20} color={THEME.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tpaFinanceHeroLabel}>TOTAL SALDO KAS OTONOM TPA</Text>
                    <Text style={styles.tpaFinanceHeroAmount}>{formatRupiah(getTPABalance())}</Text>
                  </View>
                </View>
                <Text style={styles.tpaFinanceHeroSub}>
                  Dikelola mandiri oleh Bendahara TPA (Ustadzah Fitri Handayani) • Terpisah dari kas DKM
                </Text>
              </View>

              <Text style={styles.tpaPocketListHeading}>4 Kantong Kas Otonom TPA:</Text>
              <View style={styles.pocketsSeamlessCanvas}>
                {orgPockets.map((p, pIdx) => (
                  <View
                    key={p.id}
                    style={[
                      styles.pocketStreamRow,
                      pIdx === orgPockets.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.pocketStreamIconCircle}>
                      <Ionicons name="cash-outline" size={18} color={THEME.coral} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pocketStreamName}>{p.name}</Text>
                      <Text style={styles.pocketStreamDesc}>{p.description}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                      <Text style={styles.pocketStreamBalance}>{formatRupiah(p.balance)}</Text>
                      <View style={styles.pocketCategoryMiniTag}>
                        <Text style={styles.pocketCategoryMiniText}>{p.category}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Fluid Call-to-Action Pendaftaran Santri */}
          <View style={styles.ctaFluidSurface}>
            <View style={styles.ctaFluidTopRow}>
              <View style={styles.ctaIconOrb}>
                <Ionicons name="school" size={20} color={THEME.coral} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaFluidTitle}>Penerimaan Santri Baru TPA Nurul Ilmi</Text>
                <Text style={styles.ctaFluidSubtitle}>Usia 4 s.d. 14 tahun • Bimbingan makharijul huruf & tahsin</Text>
              </View>
            </View>
            <Text style={styles.ctaFluidDesc}>
              Infaq pendaftaran santri baru Rp 50.000 (termasuk Buku Prestasi & Raport). Iuran SPP pendidikan mandiri Rp 35.000 / bulan.
            </Text>
            <TouchableOpacity
              style={styles.ctaFluidActionBtn}
              onPress={() => openWhatsApp('6281299887766', 'Ustadzah Siti Aisyah - Pendaftaran Santri TPA')}
            >
              <Ionicons name="logo-whatsapp" size={16} color={THEME.white} />
              <Text style={styles.ctaFluidActionText}>Daftar Santri Baru via WhatsApp Tata Usaha</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ============================================================== */
        /* JIKA SUB-ORG LAIN (DKM / RISMA / TAKLIM / QURBAN) DIPILIH      */
        /* ============================================================== */
        <View>
          {/* Detail Organisasi Terpilih (Seamless Card) */}
          <View style={styles.orgHeroDetailCard}>
            <View style={styles.orgHeroDetailTop}>
              <View style={[styles.orgLeadingAccentBar, { backgroundColor: selectedOrg.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.orgHeroDetailTitle}>{selectedOrg.name}</Text>
                <Text style={styles.orgHeroDetailDesc}>{selectedOrg.description}</Text>
              </View>
            </View>

            {/* Seamless Metric Strip */}
            <View style={styles.orgSeamlessMetaStrip}>
              <View style={styles.orgSeamlessMetaItem}>
                <Text style={styles.orgMetaItemLabel}>Ketua / PJ</Text>
                <Text style={styles.orgMetaItemValue} numberOfLines={1}>{selectedOrg.leaderName}</Text>
              </View>
              <View style={styles.orgMetaItemDivider} />
              <View style={styles.orgSeamlessMetaItem}>
                <Text style={styles.orgMetaItemLabel}>Anggota Aktif</Text>
                <Text style={styles.orgMetaItemValue}>{selectedOrg.memberCount} Orang</Text>
              </View>
              <View style={styles.orgMetaItemDivider} />
              <View style={styles.orgSeamlessMetaItem}>
                <Text style={styles.orgMetaItemLabel}>Dana Terkelola</Text>
                <Text style={[styles.orgMetaItemValue, { color: THEME.coral }]}>
                  {formatRupiah(orgTotalBalance)}
                </Text>
              </View>
            </View>

            {/* Kantong Kas Terkait */}
            {orgPockets.length > 0 && (
              <View style={styles.orgPocketsSubList}>
                <Text style={styles.orgPocketsSubTitle}>Kantong Kas Unit Ini:</Text>
                {orgPockets.map((p) => (
                  <View key={p.id} style={styles.orgPocketRowItem}>
                    <Ionicons name="cash-outline" size={15} color={THEME.coral} />
                    <Text style={styles.orgPocketRowName}>{p.name}</Text>
                    <Text style={styles.orgPocketRowBalance}>{formatRupiah(p.balance)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* DKM Key Contact Persons (Seamless Phonebook Canvas) */}
          <View style={styles.contactCanvasCard}>
            <View style={styles.contactCanvasHeader}>
              <Ionicons name="people" size={18} color={THEME.coral} />
              <Text style={styles.contactCanvasTitle}>Kontak Layanan Pengurus DKM</Text>
            </View>
            <Text style={styles.contactCanvasDesc}>
              Perwakilan pengurus untuk izin mushola, konsultasi keagamaan, atau pendaftaran:
            </Text>
            <View style={styles.contactsStreamWrap}>
              {MUSHOLA_INFO.contacts.map((c, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.contactStreamRow,
                    idx === MUSHOLA_INFO.contacts.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.contactAvatarOrb}>
                    <Ionicons name="person" size={15} color={THEME.coral} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPersonName}>{c.name}</Text>
                    <Text style={styles.contactPersonMeta}>{c.role} • {c.formattedPhone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.contactWaPill}
                    onPress={() => openWhatsApp(c.phone, c.name)}
                  >
                    <Ionicons name="logo-whatsapp" size={13} color={THEME.white} />
                    <Text style={styles.contactWaPillText}>WhatsApp</Text>
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
          <Ionicons name="shield-checkmark" size={20} color={THEME.coral} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.rbacTitle}>Matriks Hak Akses (RBAC)</Text>
            <Text style={styles.rbacDesc}>
              Sentuh kartu peran untuk beralih perspektif dan merasakan alur kerja divisi pengurus:
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
                      <Ionicons name={r.icon} size={16} color={r.badgeColor} />
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
                      <Ionicons name="checkmark-circle" size={13} color={THEME.coral} />
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
    borderRadius: 20,
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

  // ORGANIC CAPSULE SELECTOR TABS
  orgPillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    marginRight: 10,
  },
  orgPillTabActive: {
    backgroundColor: THEME.gunmetal,
    borderColor: THEME.gunmetal,
    shadowColor: THEME.gunmetal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  orgPillTabTpa: {
    borderColor: 'rgba(239, 131, 84, 0.4)',
  },
  orgDotCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  orgPillNameActive: {
    color: THEME.white,
  },
  tpaBadgeMicro: {
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tpaBadgeMicroText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.coral,
  },
  orgPillCategory: {
    fontSize: 10,
    color: THEME.paynesGray,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  orgPillCategoryActive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // TPA SEAMLESS HERO SURFACE & METRICS
  tpaMainContainer: {
    marginBottom: 20,
  },
  tpaHeroSurface: {
    backgroundColor: THEME.gunmetal,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: THEME.gunmetal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  tpaHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tpaEmblemCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpaOtonomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 131, 84, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tpaOtonomBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.coral,
    letterSpacing: 0.5,
  },
  tpaHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.white,
  },
  tpaHeroLocation: {
    fontSize: 11,
    color: THEME.silver,
    marginTop: 1,
  },
  tpaHeroDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 14,
  },
  tpaMetricRibbon: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  metricRibbonItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricRibbonNum: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.white,
  },
  metricRibbonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.silver,
    marginTop: 2,
  },
  metricRibbonSub: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 1,
  },
  metricRibbonDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tpaCapsuleNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 4,
    borderRadius: 20,
    gap: 4,
  },
  tpaCapsuleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tpaCapsuleItemActive: {
    backgroundColor: THEME.coral,
  },
  tpaCapsuleText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.silver,
  },
  tpaCapsuleTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.white,
  },

  // FLOW & HIERARCHY CANVAS (TAB 1: STRUKTUR)
  tpaFlowCanvas: {
    backgroundColor: THEME.white,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  flowCanvasHeader: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: THEME.silverLine,
  },
  flowCanvasTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  flowCanvasSubtitle: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 2,
  },
  flowTierWrap: {
    marginBottom: 12,
  },
  flowTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  flowTierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.coral,
  },
  flowTierTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.paynesGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headmasterHeroSurface: {
    backgroundColor: THEME.gunmetal,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headmasterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headmasterAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headmasterRoleTag: {
    backgroundColor: 'rgba(239, 131, 84, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  headmasterRoleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.coral,
  },
  headmasterName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.white,
  },
  headmasterBio: {
    fontSize: 11,
    color: THEME.silver,
    marginTop: 2,
  },
  headmasterWaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  headmasterWaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.white,
  },
  connectingRail: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  railLine: {
    width: 2,
    height: 14,
    backgroundColor: THEME.silverLine,
  },
  railNode: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.coral,
    marginVertical: 2,
  },
  duoPillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  duoPillCard: {
    flex: 1,
    backgroundColor: THEME.silverLight,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.silverLine,
  },
  duoPillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  duoPillRole: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.coral,
    textTransform: 'uppercase',
  },
  duoPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginTop: 2,
  },
  duoPillMeta: {
    fontSize: 10,
    color: THEME.paynesGray,
    marginTop: 2,
  },
  adminSeamlessCard: {
    backgroundColor: THEME.silverLight,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.silverLine,
  },
  adminCardRole: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.coral,
    textTransform: 'uppercase',
  },
  adminCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginTop: 2,
  },
  adminCardDesc: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 2,
  },
  adminIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  adminWaBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.white,
  },
  curriculumBannerCard: {
    backgroundColor: THEME.coralSoftBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.coralBorder,
    marginBottom: 12,
  },
  curriculumIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  curriculumLeaderRole: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.coral,
    textTransform: 'uppercase',
  },
  curriculumLeaderName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginTop: 2,
  },
  curriculumLeaderDesc: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 2,
  },
  teachersStreamCanvas: {
    backgroundColor: THEME.silverLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.silverLine,
  },
  teacherStreamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(191, 192, 192, 0.25)',
  },
  teacherAvatarDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.gunmetal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherStreamName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  teacherStreamClass: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.coral,
  },
  teacherStreamBio: {
    fontSize: 10,
    color: THEME.paynesGray,
  },
  teacherWaMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // STAFF DIRECTORY (TAB 2: GURU)
  tpaStaffSection: {
    marginBottom: 16,
  },
  tpaSubSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.gunmetal,
    marginBottom: 10,
  },
  staffStreamCanvas: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  staffStreamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: THEME.silverLine,
  },
  staffAvatarGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  staffNameHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  staffNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  staffCategoryChip: {
    backgroundColor: THEME.silverLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staffCategoryChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.paynesGray,
  },
  staffRoleSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.coral,
    marginTop: 2,
  },
  assignedClassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  assignedClassChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.coral,
  },
  staffBioDescription: {
    fontSize: 11,
    color: THEME.paynesGray,
    lineHeight: 16,
    marginTop: 4,
  },
  staffChatCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 6,
  },

  // CURRICULAR STEPPER (TAB 3: KELAS)
  tpaClassSection: {
    marginBottom: 16,
  },
  curriculumStepperWrap: {
    gap: 12,
  },
  stepperItemCard: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  stepperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  stepperBadgeOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.gunmetal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBadgeOrbText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.white,
  },
  stepperTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  stepperLevelText: {
    fontSize: 11,
    color: THEME.paynesGray,
  },
  stepperStudentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.coralSoftBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepperStudentTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.coral,
  },
  stepperMetaRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: THEME.silverLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  stepperMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepperMetaText: {
    fontSize: 11,
    color: THEME.paynesGray,
    fontWeight: '500',
  },
  stepperCompetencyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 131, 84, 0.08)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.coralBorder,
  },
  stepperCompetencyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.coral,
  },
  stepperCompetencyDesc: {
    fontSize: 11,
    color: THEME.gunmetal,
    marginTop: 2,
    lineHeight: 16,
  },

  // TPA AUTONOMOUS LEDGER (TAB 4: KEUANGAN)
  tpaFinanceSection: {
    marginBottom: 16,
  },
  tpaFinanceHeroCard: {
    backgroundColor: THEME.gunmetal,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  tpaFinanceHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  tpaFinanceIconOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpaFinanceHeroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.silver,
    letterSpacing: 0.5,
  },
  tpaFinanceHeroAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.coral,
    marginTop: 2,
  },
  tpaFinanceHeroSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
  },
  tpaPocketListHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.gunmetal,
    marginBottom: 10,
  },
  pocketsSeamlessCanvas: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  pocketStreamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: THEME.silverLine,
  },
  pocketStreamIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pocketStreamName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  pocketStreamDesc: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 2,
  },
  pocketStreamBalance: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.coral,
  },
  pocketCategoryMiniTag: {
    backgroundColor: THEME.silverLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  pocketCategoryMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.paynesGray,
    textTransform: 'uppercase',
  },

  // CTA FLUID SURFACE
  ctaFluidSurface: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.coralBorder,
    marginTop: 8,
  },
  ctaFluidTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  ctaIconOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaFluidTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  ctaFluidSubtitle: {
    fontSize: 11,
    color: THEME.paynesGray,
  },
  ctaFluidDesc: {
    fontSize: 11,
    color: THEME.paynesGray,
    lineHeight: 17,
    marginBottom: 12,
  },
  ctaFluidActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 11,
    borderRadius: 14,
  },
  ctaFluidActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.white,
  },

  // NON-TPA VIEW & CONTACT CANVAS
  orgHeroDetailCard: {
    backgroundColor: THEME.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
  },
  orgHeroDetailTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  orgLeadingAccentBar: {
    width: 4,
    borderRadius: 2,
  },
  orgHeroDetailTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.gunmetal,
    marginBottom: 4,
  },
  orgHeroDetailDesc: {
    fontSize: 12,
    color: THEME.paynesGray,
    lineHeight: 18,
  },
  orgSeamlessMetaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.silverLight,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  orgSeamlessMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  orgMetaItemLabel: {
    fontSize: 10,
    color: THEME.paynesGray,
  },
  orgMetaItemValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginTop: 2,
  },
  orgMetaItemDivider: {
    width: 1,
    height: 22,
    backgroundColor: THEME.silverLine,
  },
  orgPocketsSubList: {
    backgroundColor: THEME.coralSoftBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.coralBorder,
  },
  orgPocketsSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.gunmetal,
    marginBottom: 6,
  },
  orgPocketRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  orgPocketRowName: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: THEME.gunmetal,
    fontWeight: '500',
  },
  orgPocketRowBalance: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.coral,
  },
  contactCanvasCard: {
    backgroundColor: THEME.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.silverBorder,
    marginBottom: 16,
  },
  contactCanvasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactCanvasTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.gunmetal,
  },
  contactCanvasDesc: {
    fontSize: 11,
    color: THEME.paynesGray,
    lineHeight: 16,
    marginBottom: 10,
  },
  contactsStreamWrap: {
    backgroundColor: THEME.silverLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.silverLine,
  },
  contactStreamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(191, 192, 192, 0.25)',
  },
  contactAvatarOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.coralSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contactPersonName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gunmetal,
  },
  contactPersonMeta: {
    fontSize: 11,
    color: THEME.paynesGray,
    marginTop: 1,
  },
  contactWaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contactWaPillText: {
    color: THEME.white,
    fontSize: 10,
    fontWeight: '700',
  },

  // ROLE-BASED ACCESS CONTROL (RBAC)
  rbacCard: {
    backgroundColor: THEME.white,
    borderRadius: 22,
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
    fontSize: 15,
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
    borderRadius: 16,
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
