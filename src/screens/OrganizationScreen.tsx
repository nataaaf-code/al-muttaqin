import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRolePermissions, RolePermissions, useMushola } from '../store/useMusholaStore';
import { CashPocket, SubOrganization, TPAClassInfo, TPAStaffMember, UserRole } from '../types';
import { formatRupiah } from '../utils/formatters';
import { MUSHOLA_INFO, TPA_CLASSES, TPA_STAFF_MEMBERS, TPA_STRUCTURE_SUMMARY } from '../store/mockData';
import { BP, C, R, SP, TYPE } from '../theme/colors';
import { Sheet } from '../theme/motion';
import {
  Avatar,
  Badge,
  BadgeTone,
  Button,
  Card,
  CardHeader,
  Col,
  EmptyState,
  Hatch,
  IconButton,
  IconName,
  IconTile,
  ListRow,
  PageHeader,
  Row,
  Screen,
  Segmented,
  T,
  useBreakpoint,
} from '../ui/kit';

/* ---------- Data statis layar (label & peta, bukan angka) ---------- */

interface RoleInfo {
  role: UserRole;
  title: string;
  short: string;
  badge: string;
  icon: IconName;
  description: string;
  permissionsText: string[];
}

const ALL_ROLES: RoleInfo[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Ketua DKM (super admin)',
    short: 'Ketua DKM',
    badge: 'Akses penuh',
    icon: 'shield-checkmark-outline',
    description:
      'Akses tertinggi ke seluruh pembukuan, pengaturan organisasi, dan tata kelola mushola.',
    permissionsText: ['Kas pusat dan sub-organisasi', 'Agenda dan petugas Jumat', 'Kelola inventaris', 'Data sensus warga', 'Kelola TV signage'],
  },
  {
    role: 'BENDAHARA_DKM',
    title: 'Bendahara utama DKM',
    short: 'Bendahara DKM',
    badge: 'Keuangan DKM',
    icon: 'wallet-outline',
    description:
      'Mencatat penerimaan ZIS dan infaq, pengeluaran operasional DKM, pemindahan kas, dan warta keuangan Jumat.',
    permissionsText: ['Semua mutasi kas DKM', 'Pecah kantong kas', 'Laporan rekap ZIS', 'Data donatur warga'],
  },
  {
    role: 'BENDAHARA_SUB',
    title: 'Bendahara sub-organisasi atau TPA',
    short: 'Bendahara unit',
    badge: 'Kas unit',
    icon: 'card-outline',
    description:
      'Mengelola keuangan unitnya sendiri (TPA, RISMA, atau Majelis Taklim), terpisah dari kas utama mushola.',
    permissionsText: ['Kas khusus unit', 'Buat kegiatan unit', 'Laporan transparansi unit'],
  },
  {
    role: 'SEKRETARIS',
    title: 'Sekretaris dan sie dakwah',
    short: 'Sekretaris',
    badge: 'Dakwah dan warta',
    icon: 'document-text-outline',
    description:
      'Mengatur kalender kajian, petugas khotib dan imam sholat Jumat, pengumuman TV, dan pendataan sensus warga.',
    permissionsText: ['Kalender agenda dan kajian', 'Jadwal petugas Jumat', 'Warta TV signage', 'Kelola data jamaah'],
  },
  {
    role: 'PENGURUS_SEKSI',
    title: 'Seksi sarpras dan logistik',
    short: 'Sarpras',
    badge: 'Fasilitas dan aset',
    icon: 'cube-outline',
    description:
      'Mencatat aset inventaris, merawat sound system dan tenda, serta mengatur peminjaman oleh warga.',
    permissionsText: ['Tambah aset fisik', 'Ubah kondisi barang', 'Kelola pinjam pakai'],
  },
  {
    role: 'JAMAAH',
    title: 'Jamaah dan warga lingkungan',
    short: 'Jamaah',
    badge: 'Transparansi publik',
    icon: 'people-outline',
    description:
      'Memantau saldo kas mushola, jadwal sholat Kemenag, dan infaq QRIS secara terbuka.',
    permissionsText: ['Lihat saldo kas', 'Jadwal sholat dan hitung mundur', 'Infaq QRIS bebas nominal', 'Aspirasi dan kotak saran'],
  },
];

type CapKey = Exclude<keyof RolePermissions, 'isReadOnly' | 'roleTitle' | 'roleDescription' | 'roleBadgeColor' | 'roleIcon'>;

const CAPABILITIES: { key: CapKey; label: string }[] = [
  { key: 'canAddTransaction', label: 'Catat transaksi kas' },
  { key: 'canManagePockets', label: 'Kelola kantong kas' },
  { key: 'canViewFinancialReports', label: 'Lihat laporan keuangan' },
  { key: 'canAddEvent', label: 'Tambah agenda' },
  { key: 'canEditFridaySchedule', label: 'Ubah petugas Jumat' },
  { key: 'canManageInventory', label: 'Kelola inventaris' },
  { key: 'canManageJamaah', label: 'Kelola data jamaah' },
  { key: 'canEditSignage', label: 'Ubah tampilan TV' },
  { key: 'canManageSubOrgs', label: 'Kelola organisasi' },
];

const CATEGORY_LABEL: Record<SubOrganization['category'], string> = {
  DKM: 'Pengurus utama',
  REMAJA: 'Remaja',
  MAJELIS_TAKLIM: 'Majelis taklim',
  PANITIA_AD_HOC: 'Panitia ad hoc',
  TPA: 'Badan otonom',
};

const CATEGORY_ICON: Record<SubOrganization['category'], IconName> = {
  DKM: 'business-outline',
  REMAJA: 'people-outline',
  MAJELIS_TAKLIM: 'book-outline',
  PANITIA_AD_HOC: 'flag-outline',
  TPA: 'school-outline',
};

const STAFF_LABEL: Record<TPAStaffMember['roleCategory'], string> = {
  PEMBINA: 'Pembina',
  KEPALA_TPA: 'Kepala TPA',
  SEKRETARIS: 'Sekretaris',
  BENDAHARA: 'Bendahara',
  KURIKULUM: 'Kurikulum',
  PENGAJAR: 'Pengajar',
};

const STAFF_TONE: Record<TPAStaffMember['roleCategory'], BadgeTone> = {
  PEMBINA: 'neutral',
  KEPALA_TPA: 'success',
  SEKRETARIS: 'neutral',
  BENDAHARA: 'neutral',
  KURIKULUM: 'neutral',
  PENGAJAR: 'neutral',
};

const TIERS: { title: string; cats: TPAStaffMember['roleCategory'][] }[] = [
  { title: 'Dewan pembina DKM', cats: ['PEMBINA'] },
  { title: 'Kepala TPA', cats: ['KEPALA_TPA'] },
  { title: 'Administrasi dan keuangan', cats: ['SEKRETARIS', 'BENDAHARA'] },
  { title: 'Kurikulum dan mutu', cats: ['KURIKULUM'] },
  { title: 'Guru dan wali kelas', cats: ['PENGAJAR'] },
];

const POCKET_LABEL: Record<CashPocket['category'], string> = {
  OPERASIONAL: 'Operasional',
  SOSIAL_YATIM: 'Sosial dan yatim',
  PEMBANGUNAN: 'Pembangunan',
  KEGIATAN: 'Kegiatan',
  ZAKAT: 'Zakat',
  TPA_SPP: 'SPP santri',
  TPA_MODUL: 'Modul belajar',
  TPA_HONOR: 'Honor guru',
  TPA_KEGIATAN: 'Kegiatan TPA',
};

/** Kategori/kantong dibedakan dengan nada hijau + label (DESIGN.md bagian 2), bukan warna data mentah. */
const GREEN_TONES = [C.g900, C.g700, C.g500, C.g300, C.g100] as const;

type TpaTab = 'STRUKTUR' | 'GURU' | 'KELAS' | 'KEUANGAN';

const TPA_TABS: { key: TpaTab; label: string }[] = [
  { key: 'STRUKTUR', label: 'Struktur' },
  { key: 'GURU', label: 'Dewan guru' },
  { key: 'KELAS', label: 'Kelas' },
  { key: 'KEUANGAN', label: 'Kas mandiri' },
];

type SheetState =
  | { kind: 'person'; person: TPAStaffMember }
  | { kind: 'class'; cls: TPAClassInfo }
  | { kind: 'role'; info: RoleInfo };

/* ---------- Util ---------- */

function toWaNumber(phone: string) {
  let n = String(phone).replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  if (!n.startsWith('62')) n = '62' + n;
  return n;
}

/** 6285799001122 -> 0857-9900-1122 */
function formatPhone(phone: string) {
  const local = '0' + toWaNumber(phone).slice(2);
  return [local.slice(0, 4), local.slice(4, 8), local.slice(8)].filter(Boolean).join('-');
}

const SORTED_STAFF = [...TPA_STAFF_MEMBERS].sort((a, b) => a.orderIndex - b.orderIndex);

/* ---------- Layar ---------- */

export function OrganizationScreen() {
  const { subOrgs, pockets, currentRole, setCurrentRole, getTPABalance } = useMushola();
  const { isPhone, isDesktop } = useBreakpoint();

  const [selectedId, setSelectedId] = useState<string>(subOrgs[0]?.id ?? '');
  const [tpaTab, setTpaTab] = useState<TpaTab>('STRUKTUR');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [waError, setWaError] = useState('');

  const selectedOrg = subOrgs.find((o) => o.id === selectedId) ?? subOrgs[0];
  const orgPockets = useMemo(
    () => (selectedOrg ? pockets.filter((p) => p.subOrgId === selectedOrg.id) : []),
    [pockets, selectedOrg]
  );
  const orgTotal = orgPockets.reduce((sum, p) => sum + p.balance, 0);
  const isTPA = !!selectedOrg && (selectedOrg.id === 'org-tpa' || selectedOrg.category === 'TPA');

  const openWhatsApp = (phone: string, name: string) => {
    const url = `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(`Assalamu'alaikum ${name}`)}`;
    Linking.openURL(url)
      .then(() => setWaError(''))
      .catch(() => setWaError(`WhatsApp tidak bisa dibuka. Hubungi ${name} langsung di ${formatPhone(phone)}.`));
  };

  const openSheet = (s: SheetState) => {
    setSheet(s);
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

  const mainFlex = 3;
  const sideFlex = isDesktop ? 1 : 2;

  return (
    <Screen>
      <PageHeader
        title="Organisasi"
        subtitle="Struktur DKM dan badan otonom: TPA, RISMA, Majelis Taklim, dan panitia."
      />

      {waError ? (
        <View style={st.notice} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={18} color={C.dangerFg} aria-hidden />
          <T v="small" color={C.dangerFg} style={{ flex: 1 }}>
            {waError}
          </T>
        </View>
      ) : null}

      {!selectedOrg ? (
        <Card>
          <EmptyState
            icon="git-network-outline"
            title="Belum ada data organisasi"
            text="Daftar unit belum termuat dari server. Periksa koneksi lalu buka ulang halaman ini."
          />
        </Card>
      ) : (
        <>
          <Segmented
            label="Pilih organisasi"
            value={selectedOrg.id}
            onChange={setSelectedId}
            options={subOrgs.map((o) => ({ key: o.id, label: o.shortName }))}
          />

          <View key={selectedOrg.id} style={{ gap: isPhone ? SP.m : SP.l }}>
            <OrgHero
              org={selectedOrg}
              isTPA={isTPA}
              isPhone={isPhone}
              orgTotal={isTPA ? getTPABalance() : orgTotal}
              pocketCount={orgPockets.length}
              onContact={() => openWhatsApp(selectedOrg.contactPhone, selectedOrg.leaderName)}
            />

            {isTPA ? (
              <>
                <Segmented label="Bagian TPA" value={tpaTab} onChange={setTpaTab} options={TPA_TABS} />
                <Row>
                  <Col flex={mainFlex}>
                    {tpaTab === 'STRUKTUR' && <TpaStructure onOpen={(p) => openSheet({ kind: 'person', person: p })} />}
                    {tpaTab === 'GURU' && <TpaStaff onOpen={(p) => openSheet({ kind: 'person', person: p })} />}
                    {tpaTab === 'KELAS' && <TpaClasses onOpen={(c) => openSheet({ kind: 'class', cls: c })} />}
                    {tpaTab === 'KEUANGAN' && (
                      <PocketsCard
                        title="Kantong kas otonom TPA"
                        subtitle={`Dikelola bendahara TPA (${TPA_STRUCTURE_SUMMARY.treasurer}), terpisah dari kas DKM`}
                        pockets={orgPockets}
                        total={getTPABalance()}
                      />
                    )}
                  </Col>
                  <Col flex={sideFlex}>
                    <EnrollCard onEnroll={openWhatsApp} />
                    <TpaContactsCard onWa={openWhatsApp} />
                  </Col>
                </Row>
              </>
            ) : (
              <Row>
                <Col flex={mainFlex}>
                  <PocketsCard
                    title={`Kantong kas ${selectedOrg.shortName}`}
                    subtitle="Pembagian dana unit ini per kantong"
                    pockets={orgPockets}
                    total={orgTotal}
                  />
                </Col>
                <Col flex={sideFlex}>
                  <DkmContactsCard onWa={openWhatsApp} />
                </Col>
              </Row>
            )}
          </View>
        </>
      )}

      <Row stackBelow={BP.desktop}>
        <Col flex={3}>
          <MatrixCard currentRole={currentRole} isPhone={isPhone} />
        </Col>
        <Col flex={isDesktop ? 1.3 : 1}>
          <RolesCard currentRole={currentRole} onOpen={(info) => openSheet({ kind: 'role', info })} />
        </Col>
      </Row>

      <Sheet
        visible={sheetOpen}
        onClose={closeSheet}
        title={
          sheet?.kind === 'person'
            ? sheet.person.name
            : sheet?.kind === 'class'
            ? sheet.cls.name
            : sheet?.kind === 'role'
            ? sheet.info.title
            : ''
        }
        subtitle={
          sheet?.kind === 'person'
            ? sheet.person.role
            : sheet?.kind === 'class'
            ? sheet.cls.level
            : sheet?.kind === 'role'
            ? sheet.info.badge
            : undefined
        }
      >
        {sheet?.kind === 'person' && (
          <PersonDetail
            person={sheet.person}
            onWa={() => openWhatsApp(sheet.person.phone, sheet.person.name)}
          />
        )}
        {sheet?.kind === 'class' && <ClassDetail cls={sheet.cls} onWa={openWhatsApp} />}
        {sheet?.kind === 'role' && (
          <RoleDetail
            info={sheet.info}
            active={currentRole === sheet.info.role}
            onUse={() => {
              setCurrentRole(sheet.info.role);
              closeSheet();
            }}
          />
        )}
      </Sheet>
    </Screen>
  );
}

/* ---------- Hero ---------- */

function OrgHero({
  org,
  isTPA,
  isPhone,
  orgTotal,
  pocketCount,
  onContact,
}: {
  org: SubOrganization;
  isTPA: boolean;
  isPhone: boolean;
  orgTotal: number;
  pocketCount: number;
  onContact: () => void;
}) {
  const metrics: { label: string; value: string; note?: string }[] = isTPA
    ? [
        {
          label: 'Santri aktif',
          value: String(TPA_STRUCTURE_SUMMARY.totalSantri),
          note: `${TPA_STRUCTURE_SUMMARY.santriPutra} putra, ${TPA_STRUCTURE_SUMMARY.santriPutri} putri`,
        },
        { label: 'Kelas', value: String(TPA_STRUCTURE_SUMMARY.activeClasses), note: 'Iqro sampai tahfidz' },
        { label: 'Pengurus dan guru', value: String(TPA_STAFF_MEMBERS.length) },
        { label: 'Kas otonom', value: formatRupiah(orgTotal), note: `${pocketCount} kantong` },
      ]
    : [
        { label: 'Ketua atau PJ', value: org.leaderName },
        { label: 'Anggota aktif', value: `${org.memberCount} orang` },
        { label: 'Dana terkelola', value: formatRupiah(orgTotal), note: `${pocketCount} kantong kas` },
      ];

  return (
    <Card tone="hero">
      <View style={st.heroTop}>
        <View style={st.heroIcon}>
          <Ionicons name={CATEGORY_ICON[org.category]} size={22} color={C.onDark} aria-hidden />
        </View>
        <View style={{ flex: 1, minWidth: 200 }}>
          <T v="smallStrong" color={C.onDarkMuted}>
            {CATEGORY_LABEL[org.category]}
          </T>
          <T v="h2" color={C.onDark} style={{ marginTop: 2 }}>
            {org.name}
          </T>
        </View>
        <Button
          variant="onDark"
          icon="logo-whatsapp"
          label={isPhone ? 'Hubungi ketua' : `Hubungi ${org.leaderName}`}
          accessibilityLabel={`Kirim WhatsApp ke ${org.leaderName}, ${org.contactPhone}`}
          onPress={onContact}
          compact
        />
      </View>

      <T color={C.onDarkMuted} style={st.heroDesc}>
        {org.description}
      </T>

      <View style={st.metricRow}>
        {metrics.map((m) => (
          <View key={m.label} style={[st.metric, isPhone ? st.metricHalf : st.metricFlex]}>
            <T v="small" color={C.onDarkMuted}>
              {m.label}
            </T>
            <T v="h2" color={C.onDark} style={st.metricValue} numberOfLines={2}>
              {m.value}
            </T>
            {m.note ? (
              <T v="small" color={C.onDarkMuted}>
                {m.note}
              </T>
            ) : null}
          </View>
        ))}
      </View>
    </Card>
  );
}

/* ---------- TPA ---------- */

function PersonRow({ person, onOpen, last }: { person: TPAStaffMember; onOpen: (p: TPAStaffMember) => void; last?: boolean }) {
  const sub = person.assignedClass ? `${person.role}, ${person.assignedClass}` : person.role;
  return (
    <ListRow
      leading={<Avatar name={person.name} dark={person.roleCategory === 'KEPALA_TPA'} />}
      title={person.name}
      subtitle={sub}
      trailing={<Badge label={STAFF_LABEL[person.roleCategory]} tone={STAFF_TONE[person.roleCategory]} />}
      onPress={() => onOpen(person)}
      accessibilityLabel={`Lihat profil ${person.name}, ${person.role}`}
      last={last}
    />
  );
}

function TpaStructure({ onOpen }: { onOpen: (p: TPAStaffMember) => void }) {
  const tiers = TIERS.map((t) => ({ ...t, people: SORTED_STAFF.filter((p) => t.cats.includes(p.roleCategory)) })).filter(
    (t) => t.people.length > 0
  );
  return (
    <Card delay={60}>
      <CardHeader title="Bagan kepengurusan TPA" subtitle="Berjenjang dari pembina DKM sampai wali kelas" />
      {tiers.length === 0 ? (
        <EmptyState
          icon="git-network-outline"
          title="Struktur TPA belum diisi"
          text="Belum ada pengurus TPA yang tercatat. Kepala TPA dapat mengirim daftar pengurus ke sekretaris DKM untuk dimasukkan."
        />
      ) : (
        <View>
          {tiers.map((t, i) => (
            <View key={t.title}>
              <View style={st.tierHead}>
                <NumTile n={i + 1} />
                <T v="h3" style={{ flex: 1 }}>
                  {t.title}
                </T>
                <T v="small" color={C.inkMuted}>
                  {t.people.length} orang
                </T>
              </View>
              <View style={[st.tierBody, i === tiers.length - 1 && st.tierBodyLast]}>
                {t.people.map((p, j) => (
                  <PersonRow key={p.id} person={p} onOpen={onOpen} last={j === t.people.length - 1} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function TpaStaff({ onOpen }: { onOpen: (p: TPAStaffMember) => void }) {
  return (
    <Card delay={60}>
      <CardHeader title="Dewan guru dan pengurus" subtitle={`${SORTED_STAFF.length} orang, ketuk nama untuk profil dan kontak`} />
      {SORTED_STAFF.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="Belum ada guru tercatat"
          text="Data asatidz TPA masih kosong. Tata usaha TPA dapat mengirim daftar guru ke sekretaris DKM."
        />
      ) : (
        SORTED_STAFF.map((p, i) => <PersonRow key={p.id} person={p} onOpen={onOpen} last={i === SORTED_STAFF.length - 1} />)
      )}
    </Card>
  );
}

function TpaClasses({ onOpen }: { onOpen: (c: TPAClassInfo) => void }) {
  const total = TPA_CLASSES.reduce((s, c) => s + c.studentCount, 0);
  return (
    <Card delay={60}>
      <CardHeader title="Kelas dan kurikulum" subtitle={`${TPA_CLASSES.length} kelas, ${total} santri terbagi`} />
      {TPA_CLASSES.length === 0 ? (
        <EmptyState
          icon="layers-outline"
          title="Belum ada kelas"
          text="Pembagian kelas TPA belum dicatat. Koordinator kurikulum dapat menyusunnya bersama kepala TPA."
        />
      ) : (
        TPA_CLASSES.map((c, i) => (
          <ListRow
            key={c.id}
            leading={<NumTile n={i + 1} size={40} />}
            title={c.name}
            subtitle={`${c.teacherName}, ${c.schedule}`}
            trailing={<Badge label={`${c.studentCount} santri`} tone="success" />}
            onPress={() => onOpen(c)}
            accessibilityLabel={`Lihat rincian ${c.name}`}
            last={i === TPA_CLASSES.length - 1}
          />
        ))
      )}
    </Card>
  );
}

function EnrollCard({ onEnroll }: { onEnroll: (phone: string, name: string) => void }) {
  const secretary = SORTED_STAFF.find((s) => s.roleCategory === 'SEKRETARIS');
  return (
    <Card delay={100}>
      <CardHeader title="Penerimaan santri baru" subtitle="TPA Nurul Ilmi" />
      <View style={{ gap: SP.m }}>
        <InfoLine icon="cash-outline" label="SPP bulanan" value={`${formatRupiah(TPA_STRUCTURE_SUMMARY.sppNominalPerSantri)} per santri`} />
        <InfoLine
          icon="person-outline"
          label="Pendaftaran lewat"
          value={secretary ? `${secretary.name}, tata usaha` : 'Tata usaha TPA'}
        />
        {secretary ? (
          <Button
            icon="logo-whatsapp"
            label="Daftar lewat WhatsApp"
            accessibilityLabel={`Daftar santri baru lewat WhatsApp ${secretary.name}`}
            onPress={() => onEnroll(secretary.phone, `${secretary.name}, saya ingin mendaftarkan santri baru TPA`)}
          />
        ) : (
          <T v="small" color={C.inkMuted}>
            Kontak tata usaha belum tercatat. Tanyakan pendaftaran ke pengurus DKM.
          </T>
        )}
      </View>
    </Card>
  );
}

function ContactRow({
  name,
  meta,
  phone,
  onWa,
  last,
}: {
  name: string;
  meta: string;
  phone: string;
  onWa: (phone: string, name: string) => void;
  last?: boolean;
}) {
  return (
    <ListRow
      leading={<Avatar name={name} />}
      title={name}
      subtitle={`${meta}, ${formatPhone(phone)}`}
      trailing={<IconButton icon="logo-whatsapp" label={`Kirim WhatsApp ke ${name}`} onPress={() => onWa(phone, name)} />}
      last={last}
    />
  );
}

function TpaContactsCard({ onWa }: { onWa: (phone: string, name: string) => void }) {
  const leads = SORTED_STAFF.filter((s) => ['KEPALA_TPA', 'SEKRETARIS', 'BENDAHARA'].includes(s.roleCategory));
  return (
    <Card delay={140}>
      <CardHeader title="Kontak pengurus TPA" subtitle="Kepala, tata usaha, dan bendahara" />
      {leads.length === 0 ? (
        <EmptyState
          icon="call-outline"
          title="Belum ada kontak"
          text="Kontak pengurus TPA belum tercatat. Sementara itu hubungi pengurus DKM."
        />
      ) : (
        leads.map((p, i) => (
          <ContactRow key={p.id} name={p.name} meta={STAFF_LABEL[p.roleCategory]} phone={p.phone} onWa={onWa} last={i === leads.length - 1} />
        ))
      )}
    </Card>
  );
}

function DkmContactsCard({ onWa }: { onWa: (phone: string, name: string) => void }) {
  const contacts = MUSHOLA_INFO.contacts;
  return (
    <Card delay={100}>
      <CardHeader title="Kontak pengurus DKM" subtitle="Izin pemakaian mushola, konsultasi, dan pendaftaran" />
      {contacts.length === 0 ? (
        <EmptyState
          icon="call-outline"
          title="Belum ada kontak"
          text="Kontak pengurus DKM belum tercatat. Sekretaris DKM dapat menambahkannya di pengaturan mushola."
        />
      ) : (
        contacts.map((c, i) => (
          <ContactRow key={c.phone} name={c.name} meta={c.role} phone={c.phone} onWa={onWa} last={i === contacts.length - 1} />
        ))
      )}
    </Card>
  );
}

/* ---------- Kas ---------- */

function PocketsCard({
  title,
  subtitle,
  pockets,
  total,
}: {
  title: string;
  subtitle: string;
  pockets: CashPocket[];
  total: number;
}) {
  return (
    <Card delay={60}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          pockets.length > 0 ? (
            <T v="h3" style={TYPE.num as TextStyle}>
              {formatRupiah(total)}
            </T>
          ) : undefined
        }
      />
      {pockets.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="Belum ada kantong kas"
          text="Unit ini belum punya kantong kas sendiri, jadi dananya masih tercatat di kas DKM. Bendahara DKM dapat membuat kantong unit di halaman Keuangan."
        />
      ) : (
        <>
          <Allocation pockets={pockets} total={total} />
          <View style={{ marginTop: SP.m }}>
            {pockets.map((p, i) => (
              <ListRow
                key={p.id}
                leading={<Swatch color={GREEN_TONES[i % GREEN_TONES.length]} />}
                title={p.name}
                subtitle={p.description}
                trailing={
                  <View style={st.pocketTrail}>
                    <T v="bodyStrong" style={TYPE.num as TextStyle}>
                      {formatRupiah(p.balance)}
                    </T>
                    <Badge label={POCKET_LABEL[p.category] ?? p.category} />
                  </View>
                }
                last={i === pockets.length - 1}
              />
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

/** Batang pil bertumpuk: porsi tiap kantong dari total saldo. Total nol = arsir. */
function Allocation({ pockets, total }: { pockets: CashPocket[]; total: number }) {
  if (total <= 0) {
    return (
      <View style={{ gap: SP.s }}>
        <Hatch style={st.allocBar} />
        <T v="small" color={C.inkMuted}>
          Arsir berarti semua kantong masih bersaldo nol.
        </T>
      </View>
    );
  }
  const parts = pockets.map((p, i) => ({ p, color: GREEN_TONES[i % GREEN_TONES.length], pct: Math.round((p.balance / total) * 100) }));
  const summary = parts.map((x) => `${x.p.name} ${x.pct} persen`).join(', ');
  return (
    <View style={{ gap: SP.m }}>
      <T v="small" color={C.inkMuted}>
        Porsi saldo per kantong
      </T>
      <View style={st.allocBar} accessibilityRole="image" accessibilityLabel={`Porsi saldo: ${summary}`}>
        {parts
          .filter((x) => x.p.balance > 0)
          .map((x) => (
            <View key={x.p.id} style={{ flex: x.p.balance, backgroundColor: x.color }} />
          ))}
      </View>
      <View style={st.legend}>
        {parts.map((x) => (
          <View key={x.p.id} style={st.legendItem}>
            <View style={[st.legendDot, { backgroundColor: x.color }]} />
            <T v="small" color={C.inkMuted}>
              {x.p.name} {x.pct}%
            </T>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ---------- Hak akses ---------- */

function RolesCard({ currentRole, onOpen }: { currentRole: UserRole; onOpen: (r: RoleInfo) => void }) {
  const active = getRolePermissions(currentRole);
  return (
    <Card delay={160}>
      <CardHeader title="Peran pengurus" subtitle={`Peran aktif: ${active.roleTitle}`} />
      {ALL_ROLES.map((r, i) => {
        const isActive = currentRole === r.role;
        const perms = getRolePermissions(r.role);
        const count = CAPABILITIES.filter((c) => perms[c.key]).length;
        return (
          <ListRow
            key={r.role}
            leading={<IconTile icon={r.icon} tone={isActive ? 'dark' : 'green'} />}
            title={r.title}
            subtitle={`${r.badge}, ${count} dari ${CAPABILITIES.length} izin`}
            trailing={
              isActive ? (
                <Badge label="Aktif" tone="success" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={C.inkFaint} aria-hidden />
              )
            }
            onPress={() => onOpen(r)}
            accessibilityLabel={`${r.title}${isActive ? ', peran aktif' : ''}. Lihat rincian peran`}
            last={i === ALL_ROLES.length - 1}
          />
        );
      })}
    </Card>
  );
}

function MatrixCard({ currentRole, isPhone }: { currentRole: UserRole; isPhone: boolean }) {
  const initial = ALL_ROLES.some((r) => r.role === currentRole) ? currentRole : ALL_ROLES[0].role;
  const [phoneRole, setPhoneRole] = useState<UserRole>(initial);
  const perms = useMemo(() => Object.fromEntries(ALL_ROLES.map((r) => [r.role, getRolePermissions(r.role)])), []);

  return (
    <Card delay={120}>
      <CardHeader title="Matriks hak akses" subtitle="Izin tiap peran di aplikasi, sesuai aturan yang berlaku sekarang" />
      {isPhone ? (
        <View style={{ gap: SP.m }}>
          <Segmented
            label="Pilih peran"
            value={phoneRole}
            onChange={setPhoneRole}
            options={ALL_ROLES.map((r) => ({ key: r.role, label: r.short }))}
          />
          <View>
            {CAPABILITIES.map((c, i) => {
              const ok = perms[phoneRole][c.key];
              return (
                <ListRow
                  key={c.key}
                  leading={
                    <Ionicons
                      name={ok ? 'checkmark-circle' : 'remove-circle-outline'}
                      size={22}
                      color={ok ? C.g700 : C.inkFaint}
                      aria-hidden
                    />
                  }
                  title={c.label}
                  trailing={<Badge label={ok ? 'Boleh' : 'Tidak'} tone={ok ? 'success' : 'neutral'} />}
                  last={i === CAPABILITIES.length - 1}
                />
              );
            })}
          </View>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
          <View style={st.table} accessibilityRole="summary">
            <View style={[st.tr, st.trHead]}>
              <View style={st.thFirst}>
                <T v="smallStrong" color={C.inkMuted}>
                  Izin
                </T>
              </View>
              {ALL_ROLES.map((r) => {
                const active = r.role === currentRole;
                return (
                  <View key={r.role} style={[st.th, active && st.colActive]}>
                    <T v="smallStrong" color={active ? C.g700 : C.ink} style={st.center}>
                      {r.short}
                    </T>
                    {active ? <Badge label="Aktif" tone="success" /> : null}
                  </View>
                );
              })}
            </View>
            {CAPABILITIES.map((c, i) => (
              <View key={c.key} style={[st.tr, i < CAPABILITIES.length - 1 && st.trLine]}>
                <View style={st.thFirst}>
                  <T>{c.label}</T>
                </View>
                {ALL_ROLES.map((r) => {
                  const ok = perms[r.role][c.key];
                  return (
                    <View
                      key={r.role}
                      style={[st.td, r.role === currentRole && st.colActive]}
                      accessible
                      accessibilityLabel={`${r.short}, ${c.label}: ${ok ? 'boleh' : 'tidak'}`}
                    >
                      <Ionicons
                        name={ok ? 'checkmark-circle' : 'remove-outline'}
                        size={20}
                        color={ok ? C.g700 : C.inkFaint}
                        aria-hidden
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <View style={st.matrixLegend}>
        <Ionicons name="checkmark-circle" size={16} color={C.g700} aria-hidden />
        <T v="small" color={C.inkMuted}>
          Boleh
        </T>
        <Ionicons name="remove-outline" size={16} color={C.inkFaint} aria-hidden style={{ marginLeft: SP.m }} />
        <T v="small" color={C.inkMuted}>
          Tidak
        </T>
      </View>
    </Card>
  );
}

/* ---------- Isi sheet ---------- */

function PersonDetail({ person, onWa }: { person: TPAStaffMember; onWa: () => void }) {
  return (
    <View style={st.sheetBody}>
      <View style={st.personHead}>
        <Avatar name={person.name} size={56} dark={person.roleCategory === 'KEPALA_TPA'} />
        <Badge label={STAFF_LABEL[person.roleCategory]} tone={STAFF_TONE[person.roleCategory]} />
      </View>
      {person.bio ? <T color={C.inkMuted}>{person.bio}</T> : null}
      <View style={{ gap: SP.m }}>
        {person.assignedClass ? <InfoLine icon="book-outline" label="Kelas" value={person.assignedClass} /> : null}
        <InfoLine icon="call-outline" label="Nomor WhatsApp" value={formatPhone(person.phone)} />
      </View>
      <Button icon="logo-whatsapp" label="Kirim pesan WhatsApp" accessibilityLabel={`Kirim pesan WhatsApp ke ${person.name}`} onPress={onWa} />
    </View>
  );
}

function ClassDetail({ cls, onWa }: { cls: TPAClassInfo; onWa: (phone: string, name: string) => void }) {
  const teacher = TPA_STAFF_MEMBERS.find((s) => s.name === cls.teacherName);
  return (
    <View style={st.sheetBody}>
      <View style={{ gap: SP.m }}>
        <InfoLine icon="person-outline" label="Wali kelas" value={cls.teacherName} />
        <InfoLine icon="time-outline" label="Jadwal" value={cls.schedule} />
        <InfoLine icon="location-outline" label="Ruang" value={cls.room} />
        <InfoLine icon="people-outline" label="Jumlah santri" value={`${cls.studentCount} santri`} />
      </View>
      <View style={st.target}>
        <T v="label">Target capaian santri</T>
        <T color={C.inkMuted}>{cls.curriculum}</T>
      </View>
      {teacher ? (
        <Button
          icon="logo-whatsapp"
          label="Hubungi wali kelas"
          accessibilityLabel={`Kirim WhatsApp ke ${teacher.name}`}
          onPress={() => onWa(teacher.phone, teacher.name)}
        />
      ) : null}
    </View>
  );
}

function RoleDetail({ info, active, onUse }: { info: RoleInfo; active: boolean; onUse: () => void }) {
  const perms = getRolePermissions(info.role);
  return (
    <View style={st.sheetBody}>
      <T color={C.inkMuted}>{info.description}</T>
      <View>
        <T v="label" style={{ marginBottom: SP.xs }}>
          Yang bisa dikerjakan
        </T>
        {info.permissionsText.map((p, i) => (
          <ListRow
            key={p}
            leading={<Ionicons name="checkmark-circle" size={20} color={C.g700} aria-hidden />}
            title={p}
            last={i === info.permissionsText.length - 1}
          />
        ))}
      </View>
      <T v="small" color={C.inkMuted}>
        {CAPABILITIES.filter((c) => perms[c.key]).length} dari {CAPABILITIES.length} izin di matriks hak akses.
      </T>
      {active ? (
        <Badge label="Peran ini sedang aktif" tone="success" />
      ) : (
        <Button icon="swap-horizontal-outline" label="Gunakan peran ini" onPress={onUse} />
      )}
    </View>
  );
}

/* ---------- Komponen kecil lokal ---------- */

function InfoLine({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={st.info}>
      <IconTile icon={icon} size={36} tone="neutral" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="small" color={C.inkMuted}>
          {label}
        </T>
        <T v="bodyStrong">{value}</T>
      </View>
    </View>
  );
}

/** Kotak nomor urut (jenjang/tingkat). Kit hanya punya IconTile berikon. */
function NumTile({ n, size = 28 }: { n: number; size?: number }) {
  return (
    <View style={[st.numTile, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no">
      <T v="smallStrong" color={C.g800} style={TYPE.num as TextStyle}>
        {n}
      </T>
    </View>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <View style={st.swatchWrap} accessibilityElementsHidden importantForAccessibility="no">
      <View style={[st.swatch, { backgroundColor: color }]} />
    </View>
  );
}

/* ---------- Gaya ---------- */

const COL_W = 104;
const FIRST_W = 200;

const st = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.s,
    padding: SP.m,
    borderRadius: R.inner,
    backgroundColor: C.dangerBg,
  },

  heroTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SP.m },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: R.inner,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroDesc: { marginTop: SP.m, maxWidth: 720 },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SP.xl,
    paddingTop: SP.l,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    rowGap: SP.l,
  },
  metric: { paddingRight: SP.m, gap: 2 },
  metricHalf: { width: '50%' },
  metricFlex: { flex: 1, minWidth: 140 },
  metricValue: { ...TYPE.num, marginVertical: 2 } as TextStyle,

  tierHead: { flexDirection: 'row', alignItems: 'center', gap: SP.m, paddingTop: SP.s },
  tierBody: {
    marginLeft: 13,
    paddingLeft: SP.l + 2,
    borderLeftWidth: 2,
    borderLeftColor: C.line,
    marginBottom: SP.s,
  },
  tierBodyLast: { borderLeftColor: 'transparent', marginBottom: 0 },
  numTile: { borderRadius: R.chip, backgroundColor: C.g100, alignItems: 'center', justifyContent: 'center' },

  pocketTrail: { alignItems: 'flex-end', gap: SP.xs, maxWidth: 160 },
  swatchWrap: { width: 40, height: 40, borderRadius: R.inner - 2, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  allocBar: {
    height: 14,
    borderRadius: R.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 2,
    backgroundColor: C.sunken,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SP.l, rowGap: SP.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },

  table: { minWidth: FIRST_W + COL_W * ALL_ROLES.length, flexGrow: 1 },
  tr: { flexDirection: 'row', alignItems: 'stretch' },
  trHead: { borderBottomWidth: 1, borderBottomColor: C.line },
  trLine: { borderBottomWidth: 1, borderBottomColor: C.line },
  thFirst: { width: FIRST_W, flexGrow: 1, minHeight: 48, justifyContent: 'center', paddingRight: SP.m },
  th: { width: COL_W, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: SP.xs, paddingHorizontal: SP.xs, paddingVertical: SP.s },
  td: { width: COL_W, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  colActive: { backgroundColor: C.g50 },
  center: { textAlign: 'center' },
  matrixLegend: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, marginTop: SP.l },

  sheetBody: { gap: SP.l, paddingBottom: SP.s },
  personHead: { flexDirection: 'row', alignItems: 'center', gap: SP.m },
  info: { flexDirection: 'row', alignItems: 'center', gap: SP.m },
  target: { gap: SP.xs, padding: SP.l, borderRadius: R.inner, backgroundColor: C.sunken },
});
