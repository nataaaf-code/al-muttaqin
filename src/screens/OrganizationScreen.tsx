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
import { MUSHOLA_INFO } from '../store/mockData';

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
    badgeColor: '#059669',
    badgeBg: '#DCFCE7',
    icon: 'shield-checkmark',
    description: 'Akses otoritas tertinggi tanpa batasan ke seluruh pembukuan, pengaturan organisasi, dan tata kelola mushola.',
    permissionsText: ['Kas Pusat & Sub-Org', 'Agenda & Petugas Jumat', 'Kelola Inventaris', 'Data Sensus Warga', 'Kelola TV Signage'],
  },
  {
    role: 'BENDAHARA_DKM',
    title: 'Bendahara Utama DKM',
    badge: 'Keuangan DKM',
    badgeColor: '#0D9488',
    badgeBg: '#CCFBF1',
    icon: 'wallet',
    description: 'Bertanggung jawab mencatat penerimaan ZIS/infaq, pengeluaran operasional DKM, pemindahan kas, dan warta keuangan Jumat.',
    permissionsText: ['Semua Mutasi Kas DKM', 'Pecah Kantong Kas', 'Laporan Rekap ZIS', 'Data Donatur Warga'],
  },
  {
    role: 'BENDAHARA_SUB',
    title: 'Bendahara Sub-Organisasi',
    badge: 'Otonom Sub-Org',
    badgeColor: '#0284C7',
    badgeBg: '#E0F2FE',
    icon: 'card',
    description: 'Mengelola keuangan otonom unitnya sendiri (RISMA, Majelis Taklim, atau TPA). Terisolasi ketat dari kas utama mushola.',
    permissionsText: ['Kas Khusus Unit Otonom', 'Buat Kegiatan Unit', 'Laporan Transparansi Unit'],
  },
  {
    role: 'SEKRETARIS',
    title: 'Sekretaris & Sie Dakwah',
    badge: 'Dakwah & Warta',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    icon: 'document-text',
    description: 'Mengatur kalender kajian, petugas khotib & imam sholat Jumat, pengumuman digital TV, dan pendataan sensus warga.',
    permissionsText: ['Kalender Agenda/Kajian', 'Jadwal Petugas Jumat', 'Update Warta TV Signage', 'Kelola Data Jamaah'],
  },
  {
    role: 'PENGURUS_SEKSI',
    title: 'Seksi Sarpras & Logistik',
    badge: 'Fasilitas & Aset',
    badgeColor: '#6366F1',
    badgeBg: '#EEF2FF',
    icon: 'cube',
    description: 'Mengelola pencatatan aset inventaris mushola, pemeliharaan sound system & tenda, serta perizinan peminjaman oleh warga.',
    permissionsText: ['Tambah Aset Fisik', 'Update Kondisi Barang', 'Kelola Pinjam Pakai'],
  },
  {
    role: 'JAMAAH',
    title: 'Jamaah / Warga Umum',
    badge: 'Transparansi Publik',
    badgeColor: '#475569',
    badgeBg: '#F1F5F9',
    icon: 'people',
    description: 'Akses transparansi penuh untuk warga lingkungan: memantau saldo kas mushola, jadwal sholat akurat Kemenag, dan infaq QRIS.',
    permissionsText: ['Lihat Saldo Transparan', 'Jadwal Sholat & Countdown', 'Infaq Tanpa Nominal QRIS', 'Aspirasi / Kotak Saran'],
  },
];

export function OrganizationScreen() {
  const { subOrgs, pockets, currentRole, setCurrentRole } = useMushola();
  const [selectedOrg, setSelectedOrg] = useState<SubOrganization>(subOrgs[0]);

  // Cari kantong kas milik organisasi ini
  const orgPockets = pockets.filter((p) => p.subOrgId === selectedOrg.id);
  const orgTotalBalance = orgPockets.reduce((sum, p) => sum + p.balance, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Intro Header */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Struktur Organisasi & Badan Otonom</Text>
        <Text style={styles.headerSubtitle}>
          Pengelolaan berjenjang DKM, Remaja Islam (RISMA), Majelis Taklim, TPA, dan Panitia Ad-Hoc.
        </Text>
      </View>

      {/* Sub-Org Selector Cards */}
      <Text style={styles.sectionHeading}>Pilih Entitas Organisasi:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orgSelectorRow}>
        {subOrgs.map((org) => {
          const isSelected = org.id === selectedOrg.id;
          return (
            <TouchableOpacity
              key={org.id}
              style={[
                styles.orgTabCard,
                isSelected && { borderColor: org.color, borderWidth: 2, backgroundColor: '#FFFFFF' },
              ]}
              onPress={() => setSelectedOrg(org)}
              activeOpacity={0.8}
            >
              <View style={[styles.orgColorIndicator, { backgroundColor: org.color }]} />
              <Text style={styles.orgTabName}>{org.shortName}</Text>
              <Text style={styles.orgTabCategory}>{org.category.replace('_', ' ')}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
            <Ionicons name="person-circle-outline" size={20} color="#047857" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.metaLabel}>Ketua / Penanggung Jawab</Text>
              <Text style={styles.metaValue}>{selectedOrg.leaderName}</Text>
            </View>
          </View>

          <View style={styles.metaBox}>
            <Ionicons name="people-outline" size={20} color="#0284C7" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.metaLabel}>Anggota Aktif</Text>
              <Text style={styles.metaValue}>{selectedOrg.memberCount} Orang</Text>
            </View>
          </View>

          <View style={styles.metaBox}>
            <Ionicons name="call-outline" size={20} color="#D97706" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.metaLabel}>Kontak WhatsApp</Text>
              <Text style={styles.metaValue}>{selectedOrg.contactPhone}</Text>
            </View>
          </View>

          <View style={styles.metaBox}>
            <Ionicons name="wallet-outline" size={20} color="#7C3AED" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.metaLabel}>Total Dana Dikelola</Text>
              <Text style={[styles.metaValue, { color: '#047857' }]}>
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
                <Ionicons name="cash-outline" size={16} color="#047857" />
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
          <Ionicons name="people" size={20} color="#047857" />
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
                <Ionicons name="person" size={16} color="#047857" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personNameText}>{c.name}</Text>
                <Text style={styles.personRoleText}>{c.role} • {c.formattedPhone}</Text>
              </View>
              <TouchableOpacity
                style={styles.personWaBtn}
                onPress={() => {
                  const url = `https://wa.me/${c.phone}?text=Assalamu%27alaikum%20${encodeURIComponent(c.name)}`;
                  if (Platform.OS === 'web') window.open(url, '_blank');
                  else Linking.openURL(url);
                }}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
                <Text style={styles.personWaText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Role-Based Access Control Info (Interactive Switcher) */}
      <View style={styles.rbacCard}>
        <View style={styles.rbacHeader}>
          <Ionicons name="shield-checkmark" size={22} color="#047857" />
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
                      <Ionicons name="checkmark-circle" size={14} color="#047857" />
                      <Text style={styles.activeCheckText}>Aktif</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.roleDescText}>{r.description}</Text>

                <View style={styles.permsWrap}>
                  {r.permissionsText.map((p, idx) => (
                    <View key={idx} style={styles.permChip}>
                      <Ionicons name="checkmark" size={11} color="#047857" />
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  orgSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  orgTabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orgColorIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  orgTabName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  orgTabCategory: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  orgDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orgDetailTop: {
    marginBottom: 14,
  },
  orgDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  orgDetailDesc: {
    fontSize: 13,
    color: '#475569',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    width: '48%',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  pocketSubSection: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pocketSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
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
    color: '#065F46',
    fontWeight: '500',
  },
  pocketRowBalance: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  contactDesc: {
    fontSize: 12,
    color: '#64748B',
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
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  personIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  personNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  personRoleText: {
    fontSize: 11,
    color: '#64748B',
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
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rbacCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#1E293B',
    marginBottom: 4,
  },
  rbacDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  rolesGrid: {
    gap: 12,
  },
  roleCardInteractive: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  roleCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
    shadowColor: '#059669',
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
    color: '#1E293B',
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
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  activeCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  roleDescText: {
    fontSize: 12,
    color: '#475569',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  permChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  roleCardFooter: {
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 2,
  },
  roleActionHint: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  roleActionHintActive: {
    color: '#059669',
    fontWeight: '700',
  },
});
