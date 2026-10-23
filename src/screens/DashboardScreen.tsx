import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { formatDateIndo, getEstimatedHijriDate } from '../utils/formatters';
import { getDailyPrayerTimes } from '../services/prayerService';
import { PrayerTimeline } from '../components/PrayerTimeline';
import { FinancialVisualizer } from '../components/FinancialVisualizer';
import { DonationQRISModal } from '../components/DonationQRISModal';
import { MUSHOLA_INFO } from '../store/mockData';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export function DashboardScreen({ onNavigateTab }: DashboardProps) {
  const { prayerData, pockets, events, fridaySchedule, setIsSignageMode } = useMushola();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrisModalVisible, setQrisModalVisible] = useState(false);
  const [selectedPocketForDonation, setSelectedPocketForDonation] = useState('pocket-operasional');
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalBalance = pockets.reduce((sum, p) => sum + p.balance, 0);

  const handleOpenQRIS = (pocketId?: string) => {
    if (pocketId) setSelectedPocketForDonation(pocketId);
    setQrisModalVisible(true);
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleShareFridaySchedule = () => {
    const text = `*Jadwal Sholat Jumat - ${MUSHOLA_INFO.name}*\nAlamat: ${MUSHOLA_INFO.address}\nTanggal: ${fridaySchedule.date}\nTema: "${fridaySchedule.theme}"\n\n• Khotib: ${fridaySchedule.khotib}\n• Imam: ${fridaySchedule.imam}\n• Muadzin: ${fridaySchedule.muadzin}\n• Bilal: ${fridaySchedule.bilal}\n\nKontak DKM: Ustadz Astriyo (0857-7790-0383) / Ustadz Dicky (0817-4958-342)\nMari hadir lebih awal, sholat tahiyyatul masjid dan dengarkan khutbah dengan khusyuk.`;
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      notify('Tersalin', 'Jadwal petugas sholat Jumat siap dibagikan ke WhatsApp grup warga!');
    } else {
      notify('Jadwal Petugas Jumat', text);
    }
  };

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  return (
    <View style={styles.rootWrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Islamic Arch Hero Framing */}
        <View style={styles.archHeroContainer}>
          {/* Mihrab Arch Curve Decoration */}
          <View style={styles.mihrabArchTop} />

          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.bismillahArabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                <Text style={styles.musholaTitle}>{MUSHOLA_INFO.name}</Text>
                <Text style={styles.locationSubtitle} numberOfLines={2}>
                  {MUSHOLA_INFO.shortAddress}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.heroInfaqPill}
                onPress={() => handleOpenQRIS('pocket-operasional')}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={14} color="#FBBF24" />
                <Text style={styles.heroInfaqText}>Kotak Infaq Digital</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroDateRow}>
              <View style={styles.datePill}>
                <Ionicons name="calendar-outline" size={12} color="#D1FAE5" />
                <Text style={styles.datePillText}>
                  {formatDateIndo(currentTime.toISOString())}
                </Text>
              </View>

              <View style={[styles.datePill, styles.hijriDatePill]}>
                <Ionicons name="moon-outline" size={12} color="#FDE68A" />
                <Text style={styles.hijriDateText}>{getEstimatedHijriDate(currentTime)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Interactive Prayer Times Celestial Rail */}
        <PrayerTimeline
          schedules={prayerData.schedules}
          nextPrayer={prayerData.nextPrayer}
          onOpenSignage={() => setIsSignageMode(true)}
        />

        {/* Interactive Financial Visualizer with Proportional Meter & Target Progress */}
        <FinancialVisualizer
          pockets={pockets}
          totalBalance={totalBalance}
          onOpenQRIS={handleOpenQRIS}
          onSelectPocket={() => onNavigateTab('finance')}
        />

        {/* Interactive Friday Officer Schedule with 1-Click WhatsApp Share */}
        <View style={styles.fridayInteractiveCard}>
          <View style={styles.fridayTopRow}>
            <View style={styles.fridayTag}>
              <Ionicons name="star" size={13} color="#D97706" />
              <Text style={styles.fridayTagText}>PETUGAS JUMAT PEKAN INI</Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareFridaySchedule}>
              <Ionicons name="share-social-outline" size={14} color="#047857" />
              <Text style={styles.shareBtnText}>Bagikan Jadwal</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fridayThemeTitle}>"{fridaySchedule.theme}"</Text>
          <Text style={styles.fridayDateLabel}>{fridaySchedule.date}</Text>

          {/* Officer Circular Avatar Badges */}
          <View style={styles.officerCluster}>
            <View style={styles.officerBadge}>
              <View style={[styles.officerAvatar, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="mic" size={15} color="#047857" />
              </View>
              <View>
                <Text style={styles.officerRole}>Khotib</Text>
                <Text style={styles.officerName}>{fridaySchedule.khotib}</Text>
              </View>
            </View>

            <View style={styles.officerBadge}>
              <View style={[styles.officerAvatar, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="man" size={15} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.officerRole}>Imam</Text>
                <Text style={styles.officerName}>{fridaySchedule.imam}</Text>
              </View>
            </View>

            <View style={styles.officerBadge}>
              <View style={[styles.officerAvatar, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="volume-high" size={15} color="#D97706" />
              </View>
              <View>
                <Text style={styles.officerRole}>Muadzin</Text>
                <Text style={styles.officerName}>{fridaySchedule.muadzin}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Agenda Kajian & Kegiatan Interaktif */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Agenda Kajian Mendatang</Text>
            <Text style={styles.sectionSub}>Bina ilmu, ukhuwah & silaturahmi warga</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab('events')}>
            <Text style={styles.viewMoreLink}>Lihat Semua →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.eventGrid}>
          {events.slice(0, 3).map((event) => {
            const isBookmarked = bookmarkedEvents[event.id] ?? false;
            return (
              <View key={event.id} style={styles.interactiveEventCard}>
                <View style={styles.eventCardHeader}>
                  <View style={styles.eventBadgeCategory}>
                    <Text style={styles.eventBadgeCategoryText}>
                      {event.category.replace('_', ' ')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => handleToggleBookmark(event.id)}
                  >
                    <Ionicons
                      name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={isBookmarked ? '#047857' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.eventCardTitle}>{event.title}</Text>

                {event.speakerOrOfficer ? (
                  <View style={styles.eventSpeakerRow}>
                    <Ionicons name="person-outline" size={13} color="#047857" />
                    <Text style={styles.eventSpeakerText}>{event.speakerOrOfficer}</Text>
                  </View>
                ) : null}

                <View style={styles.eventCardFooter}>
                  <View style={styles.eventTimeChip}>
                    <Ionicons name="time-outline" size={12} color="#64748B" />
                    <Text style={styles.eventTimeText}>{event.timeStart} WIB</Text>
                  </View>

                  <View style={styles.eventLocationChip}>
                    <Ionicons name="location-outline" size={12} color="#64748B" />
                    <Text style={styles.eventLocationText} numberOfLines={1}>
                      {event.location}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Mushola Address & DKM Contact Card */}
        <View style={styles.musholaProfileCard}>
          <View style={styles.musholaProfileHeader}>
            <View style={styles.profileIconWrap}>
              <Ionicons name="location" size={20} color="#047857" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileCardTitle}>{MUSHOLA_INFO.name}</Text>
              <Text style={styles.profileCardAddress}>{MUSHOLA_INFO.address}</Text>
            </View>
          </View>

          <View style={styles.contactDivider} />

          <Text style={styles.contactSectionLabel}>Kontak Layanan DKM & Konfirmasi Infaq:</Text>
          <View style={styles.contactGrid}>
            {MUSHOLA_INFO.contacts.map((c, idx) => (
              <View key={idx} style={styles.contactItemBox}>
                <View style={styles.contactAvatar}>
                  <Ionicons name="person" size={15} color="#047857" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactPersonName}>{c.name}</Text>
                  <Text style={styles.contactPersonPhone}>{c.formattedPhone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.chatWaBtn}
                  onPress={() => {
                    const message = encodeURIComponent(
                      `Assalamu'alaikum ${c.name},\nSaya jamaah Musholla Al Muttaqin ingin bertanya / konfirmasi.`
                    );
                    const url = `https://wa.me/${c.phone}?text=${message}`;
                    if (Platform.OS === 'web') {
                      window.open(url, '_blank');
                    } else {
                      Linking.openURL(url);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={13} color="#FFFFFF" />
                  <Text style={styles.chatWaBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Interactive Quick-Action Dock */}
      <View style={styles.floatingDock}>
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => handleOpenQRIS('pocket-operasional')}
        >
          <View style={[styles.dockIconCircle, { backgroundColor: '#047857' }]}>
            <Ionicons name="qr-code" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.dockLabel}>Infaq Cepat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dockItem} onPress={() => onNavigateTab('finance')}>
          <View style={[styles.dockIconCircle, { backgroundColor: '#0284C7' }]}>
            <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.dockLabel}>Buku Kas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dockItem} onPress={() => onNavigateTab('events')}>
          <View style={[styles.dockIconCircle, { backgroundColor: '#D97706' }]}>
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.dockLabel}>Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dockItem} onPress={() => setIsSignageMode(true)}>
          <View style={[styles.dockIconCircle, { backgroundColor: '#065F46' }]}>
            <Ionicons name="tv-outline" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.dockLabel}>Smart TV</Text>
        </TouchableOpacity>
      </View>

      {/* QRIS Donation Modal */}
      <DonationQRISModal
        visible={qrisModalVisible}
        onClose={() => setQrisModalVisible(false)}
        defaultPocketId={selectedPocketForDonation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 90, // Leave space for floating dock
  },
  archHeroContainer: {
    backgroundColor: '#047857',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  mihrabArchTop: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  heroContent: {
    padding: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  bismillahArabic: {
    color: '#A7F3D0',
    fontSize: 14,
    fontFamily: Platform.select({ web: 'serif', default: 'normal' }),
    marginBottom: 2,
  },
  musholaTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  locationSubtitle: {
    color: '#D1FAE5',
    fontSize: 12,
    marginTop: 2,
  },
  heroInfaqPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  heroInfaqText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroDateRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  datePillText: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '600',
  },
  hijriDatePill: {
    backgroundColor: 'rgba(217, 119, 6, 0.3)',
  },
  hijriDateText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
  },
  fridayInteractiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fridayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fridayTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fridayTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '700',
  },
  fridayThemeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
    lineHeight: 22,
  },
  fridayDateLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  officerCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 12,
  },
  officerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 140,
  },
  officerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officerRole: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  officerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
  },
  viewMoreLink: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '700',
  },
  eventGrid: {
    gap: 10,
  },
  interactiveEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventBadgeCategory: {
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  eventBadgeCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  bookmarkBtn: {
    padding: 4,
  },
  eventCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventSpeakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  eventSpeakerText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  eventCardFooter: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
    paddingTop: 8,
  },
  eventTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTimeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  eventLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  eventLocationText: {
    fontSize: 11,
    color: '#64748B',
  },
  floatingDock: {
    position: 'absolute',
    bottom: 14,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  dockItem: {
    alignItems: 'center',
    gap: 3,
  },
  dockIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  musholaProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  musholaProfileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  profileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  profileCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  profileCardAddress: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  contactSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactGrid: {
    gap: 8,
  },
  contactItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contactPersonName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactPersonPhone: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  chatWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chatWaBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
