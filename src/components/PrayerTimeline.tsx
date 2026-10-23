import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrayerTimeSchedule } from '../types';
import { NextPrayerInfo, POPULAR_CITIES } from '../services/prayerService';
import { useMushola } from '../store/useMusholaStore';

interface PrayerTimelineProps {
  schedules: PrayerTimeSchedule[];
  nextPrayer: NextPrayerInfo;
  onOpenSignage: () => void;
}

export function PrayerTimeline({ schedules, nextPrayer, onOpenSignage }: PrayerTimelineProps) {
  const { prayerData, selectedCityId, setSelectedCityId, isPrayerLoading, refreshPrayerSchedule } =
    useMushola();
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerTimeSchedule | null>(null);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [alarmActive, setAlarmActive] = useState<Record<string, boolean>>({
    Subuh: true,
    Dzuhur: true,
    Ashar: true,
    Maghrib: true,
    Isya: true,
  });

  const toggleAlarm = (name: string) => {
    setAlarmActive((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const getPrayerIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    switch (name) {
      case 'Imsak':
        return 'cloud-outline';
      case 'Subuh':
        return 'sunny-outline';
      case 'Terbit':
        return 'partly-sunny-outline';
      case 'Dzuhur':
        return 'sunny';
      case 'Ashar':
        return 'contrast-outline';
      case 'Maghrib':
        return 'partly-sunny';
      case 'Isya':
        return 'moon-outline';
      default:
        return 'time-outline';
    }
  };

  const handleSelectCity = (id: string) => {
    setSelectedCityId(id);
    setCityModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Official Bimas Islam Kemenag Badge & City Selector Bar */}
      <View style={styles.kemenagBar}>
        <View style={styles.kemenagBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#10B981" />
          <Text style={styles.kemenagBadgeText}>
            API Bimas Islam Kemenag RI • bimaislam.kemenag.go.id
          </Text>
        </View>

        <View style={styles.kemenagRightGroup}>
          <TouchableOpacity
            style={styles.cityPickerBtn}
            onPress={() => setCityModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-sharp" size={12} color="#FBBF24" />
            <Text style={styles.cityPickerText}>{prayerData.cityName}</Text>
            <Ionicons name="chevron-down" size={11} color="#FBBF24" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refreshPrayerSchedule}
            activeOpacity={0.8}
            accessibilityLabel="Refresh Jadwal Kemenag"
          >
            {isPrayerLoading ? (
              <ActivityIndicator size="small" color="#FBBF24" />
            ) : (
              <Ionicons name="refresh" size={13} color="#D1FAE5" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Header & Countdown */}
      <View style={styles.topBar}>
        <View style={styles.nextInfo}>
          <View style={styles.pulsingIndicator} />
          <View>
            <Text style={styles.nextTitle}>SHOLAT BERIKUTNYA</Text>
            <Text style={styles.nextName}>
              {nextPrayer.name} <Text style={styles.nextTime}>• {nextPrayer.time} WIB</Text>
            </Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          <View style={styles.countdownPill}>
            <Ionicons name="hourglass-outline" size={13} color="#F59E0B" />
            <Text style={styles.countdownText}>{nextPrayer.formattedCountdown}</Text>
          </View>

          <TouchableOpacity
            style={styles.tvIconBtn}
            onPress={onOpenSignage}
            accessibilityLabel="Mode Layar Penuh"
          >
            <Ionicons name="tv-outline" size={16} color="#A7F3D0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Timeline Rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineRail}
      >
        {schedules.map((item, index) => {
          const isNext = item.isNext;
          const isPassed = item.isPassed;
          const isAlarm = alarmActive[item.name] ?? false;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.nodeCard,
                isNext && styles.nodeCardNext,
                isPassed && styles.nodeCardPassed,
              ]}
              onPress={() => setSelectedPrayer(item)}
              activeOpacity={0.8}
            >
              {index > 0 && <View style={[styles.connector, isPassed && styles.connectorPassed]} />}

              <View
                style={[
                  styles.iconBubble,
                  isNext && styles.iconBubbleNext,
                  isPassed && styles.iconBubblePassed,
                ]}
              >
                <Ionicons
                  name={getPrayerIcon(item.name)}
                  size={16}
                  color={isNext ? '#FFFFFF' : isPassed ? '#94A3B8' : '#047857'}
                />
              </View>

              <Text style={[styles.nodeName, isNext && styles.nodeNameNext]}>
                {item.name}
              </Text>
              <Text style={[styles.nodeTime, isNext && styles.nodeTimeNext]}>
                {item.time}
              </Text>

              {isNext ? (
                <View style={styles.nextBadge}>
                  <Text style={styles.nextBadgeText}>
                    {nextPrayer.name.includes('Besok') ? 'BESOK' : 'AKAN TIBA'}
                  </Text>
                </View>
              ) : isAlarm ? (
                <Ionicons name="notifications" size={10} color="#059669" style={{ marginTop: 2 }} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* City Selector Modal */}
      <Modal visible={cityModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.cityModalContainer}>
            <View style={styles.cityModalHeader}>
              <View>
                <Text style={styles.cityModalTitle}>Pilih Wilayah Jadwal Sholat</Text>
                <Text style={styles.cityModalSub}>Sinkronisasi hisab Bimas Islam Kemenag RI</Text>
              </View>
              <TouchableOpacity onPress={() => setCityModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {POPULAR_CITIES.map((c) => {
                const isSelected = c.id === selectedCityId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                    onPress={() => handleSelectCity(c.id)}
                  >
                    <View style={styles.cityRowLeft}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={isSelected ? '#047857' : '#64748B'}
                      />
                      <View>
                        <Text style={[styles.cityNameText, isSelected && styles.cityNameTextSelected]}>
                          {c.name}
                        </Text>
                        <Text style={styles.cityProvinceText}>{c.province}</Text>
                      </View>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#047857" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail Prayer Modal */}
      {selectedPrayer && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={styles.detailIconBox}>
                  <Ionicons name={getPrayerIcon(selectedPrayer.name)} size={22} color="#047857" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.detailPrayerName}>Waktu Sholat {selectedPrayer.name}</Text>
                  <Text style={styles.detailPrayerTime}>{selectedPrayer.time} WIB</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPrayer(null)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="globe-outline" size={16} color="#047857" />
                  <Text style={styles.infoRowText}>
                    Sumber Hisab: <Text style={styles.boldText}>Bimas Islam Kemenag RI</Text>
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#047857" />
                  <Text style={styles.infoRowText}>
                    Wilayah: <Text style={styles.boldText}>{prayerData.cityName}</Text>
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="timer-outline" size={16} color="#64748B" />
                  <Text style={styles.infoRowText}>
                    Jeda Iqomah: <Text style={styles.boldText}>10 Menit setelah adzan</Text>
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="compass-outline" size={16} color="#64748B" />
                  <Text style={styles.infoRowText}>
                    Arah Kiblat: <Text style={styles.boldText}>295° Baratlaut (Serang/Jakarta)</Text>
                  </Text>
                </View>
              </View>

              {/* Alarm Toggle */}
              <TouchableOpacity
                style={[
                  styles.alarmToggleBtn,
                  alarmActive[selectedPrayer.name] && styles.alarmToggleBtnActive,
                ]}
                onPress={() => toggleAlarm(selectedPrayer.name)}
              >
                <Ionicons
                  name={alarmActive[selectedPrayer.name] ? 'notifications' : 'notifications-off-outline'}
                  size={16}
                  color={alarmActive[selectedPrayer.name] ? '#047857' : '#64748B'}
                />
                <Text
                  style={[
                    styles.alarmToggleText,
                    alarmActive[selectedPrayer.name] && styles.alarmToggleTextActive,
                  ]}
                >
                  {alarmActive[selectedPrayer.name]
                    ? 'Pengingat Adzan Aktif'
                    : 'Aktifkan Notifikasi Adzan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2D3142',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#2D3142',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  kemenagBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  kemenagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kemenagBadgeText: {
    fontSize: 10,
    color: '#D1FAE5',
    fontWeight: '700',
  },
  kemenagRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  cityPickerText: {
    color: '#FEF3C7',
    fontSize: 10,
    fontWeight: '800',
  },
  refreshBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  nextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulsingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF8354',
  },
  nextTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BFC0C0',
    letterSpacing: 0.5,
  },
  nextName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nextTime: {
    fontSize: 13,
    color: '#EF8354',
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF8354',
    borderWidth: 1,
    borderColor: '#EF8354',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 5,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tvIconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 6,
    borderRadius: 8,
  },
  timelineRail: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
  },
  nodeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 74,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  nodeCardNext: {
    backgroundColor: '#EF8354',
    borderColor: '#EF8354',
    transform: [{ scale: 1.04 }],
  },
  nodeCardPassed: {
    opacity: 0.5,
  },
  connector: {
    position: 'absolute',
    left: -10,
    top: '35%',
    width: 10,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  connectorPassed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconBubbleNext: {
    backgroundColor: '#FFFFFF',
  },
  iconBubblePassed: {
    backgroundColor: '#1E212D',
  },
  nodeName: {
    fontSize: 11,
    color: '#BFC0C0',
    fontWeight: '600',
    marginBottom: 2,
  },
  nodeNameNext: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  nodeTime: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  nodeTimeNext: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  nextBadge: {
    backgroundColor: '#2D3142',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  nextBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cityModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 420,
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 10,
  },
  cityModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  cityModalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  cityRowSelected: {
    backgroundColor: '#ECFDF5',
  },
  cityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cityNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  cityNameTextSelected: {
    color: '#047857',
    fontWeight: '800',
  },
  cityProvinceText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 380,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPrayerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  detailPrayerTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  detailContent: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoRowText: {
    fontSize: 12,
    color: '#475569',
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  alarmToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  alarmToggleBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#047857',
  },
  alarmToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  alarmToggleTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
});
