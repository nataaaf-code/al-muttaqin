import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { formatRupiah } from '../utils/formatters';
import { MUSHOLA_INFO } from '../store/mockData';

interface DonationQRISModalProps {
  visible: boolean;
  onClose: () => void;
  defaultPocketId?: string;
}

export function DonationQRISModal({
  visible,
  onClose,
  defaultPocketId = 'pocket-operasional',
}: DonationQRISModalProps) {
  const { pockets, addTransaction } = useMushola();
  const [selectedPocketId, setSelectedPocketId] = useState(defaultPocketId);
  const [showLogForm, setShowLogForm] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const selectedPocket = pockets.find((p) => p.id === selectedPocketId) || pockets[0];

  const handleCopyNMID = () => {
    const nmid = 'ID1026504038674';
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(nmid);
    }
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2500);
  };

  const handleOpenWhatsApp = (phone: string, ustadzName: string) => {
    const message = encodeURIComponent(
      `Assalamu'alaikum ${ustadzName},\nSaya ingin bertanya / konfirmasi terkait infaq di Musholla Al Muttaqin (Perumahan Mutiara Puri Harmoni, Rajeg).`
    );
    const url = `https://wa.me/${phone}?text=${message}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleCall = (phone: string) => {
    const url = `tel:+${phone}`;
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      Linking.openURL(url);
    }
  };

  const handleSaveConfirmation = () => {
    const parsedAmount = parseInt(confirmedAmount.replace(/[^0-9]/g, ''), 10);
    if (!parsedAmount || parsedAmount < 1000) {
      if (Platform.OS === 'web') {
        window.alert('Mohon masukkan nominal yang valid');
      } else {
        Alert.alert('Perhatian', 'Mohon masukkan nominal yang valid');
      }
      return;
    }

    addTransaction({
      pocketId: selectedPocket.id,
      subOrgId: selectedPocket.subOrgId,
      type: 'INCOME',
      amount: parsedAmount,
      title: `Infaq QRIS: ${selectedPocket.name}`,
      category: 'Donasi QRIS',
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'QRIS Gopay (FAHRIAJI ANJASTRIVINATA)',
      donorName: donorName.trim() || 'Hamba Allah',
      notes: `Infaq QRIS tanpa perantara untuk ${selectedPocket.name}`,
    });

    setIsSuccess(true);
  };

  const handleResetAndClose = () => {
    setShowLogForm(false);
    setIsSuccess(false);
    setConfirmedAmount('');
    setDonorName('');
    setCopiedFeedback(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleResetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="qr-code" size={20} color="#EF8354" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Kotak Infaq Digital QRIS</Text>
                <Text style={styles.headerSub}>Musholla Al Muttaqin • Bebas Nominal</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleResetAndClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {isSuccess ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconBubble}>
                  <Ionicons name="checkmark-circle" size={56} color="#EF8354" />
                </View>
                <Text style={styles.successHeading}>Alhamdulillah, Infaq Tercatat!</Text>
                <Text style={styles.successDesc}>
                  Konfirmasi infaq sebesar{' '}
                  <Text style={styles.boldGreen}>
                    {formatRupiah(parseInt(confirmedAmount.replace(/[^0-9]/g, ''), 10) || 0)}
                  </Text>{' '}
                  telah berhasil dibukukan ke dalam kas{' '}
                  <Text style={styles.boldGreen}>{selectedPocket.name}</Text>.
                </Text>

                <View style={styles.blessingBanner}>
                  <Text style={styles.arabicBlessing}>جَزَاكُمُ اللَّهُ خَيْرًا كَثِيرًا</Text>
                  <Text style={styles.blessingDesc}>
                    "Semoga Allah melipatgandakan pahala kebaikan Anda dan keluarga, melancarkan
                    rezeki yang halal, serta memberkahi setiap langkah kebaikan."
                  </Text>
                </View>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleResetAndClose}>
                  <Text style={styles.primaryActionBtnText}>Selesai & Tutup</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mainView}>
                {/* Notice Banner: Bebas Nominal */}
                <View style={styles.noticeBanner}>
                  <Ionicons name="information-circle" size={18} color="#EF8354" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeTitle}>Bebas Masukkan Nominal</Text>
                    <Text style={styles.noticeText}>
                      Scan QRIS ini langsung dari aplikasi m-Banking atau e-Wallet favorit Anda, lalu
                      ketik nominal infaq seikhlasnya saat melakukan pembayaran.
                    </Text>
                  </View>
                </View>

                {/* Merchant Identity Card */}
                <View style={styles.merchantCard}>
                  <View style={styles.merchantRow}>
                    <View style={styles.gopayBadge}>
                      <Text style={styles.gopayBadgeText}>GOPAY MERCHANT</Text>
                    </View>
                    <View style={styles.qrisLogoBadge}>
                      <Text style={styles.qrisLogoText}>QRIS RESMI</Text>
                    </View>
                  </View>
                  <Text style={styles.merchantName}>{MUSHOLA_INFO.qris.merchantName}</Text>
                  <View style={styles.nmidRow}>
                    <Text style={styles.nmidLabel}>NMID:</Text>
                    <Text style={styles.nmidValue}>{MUSHOLA_INFO.qris.nmid}</Text>
                    <TouchableOpacity
                      style={[styles.copyChip, copiedFeedback && styles.copyChipSuccess]}
                      onPress={handleCopyNMID}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={copiedFeedback ? 'checkmark' : 'copy-outline'}
                        size={12}
                        color={copiedFeedback ? '#EF8354' : '#EF8354'}
                      />
                      <Text
                        style={[styles.copyChipText, copiedFeedback && styles.copyChipTextSuccess]}
                      >
                        {copiedFeedback ? 'Tersalin' : 'Salin NMID'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* QRIS Direct Square QR Code */}
                <View style={styles.qrisPosterFrame}>
                  <View style={styles.qrisOfficialHeader}>
                    <Text style={styles.qrisRedText}>QRIS</Text>
                    <Text style={styles.qrisSubHead}>PEMBAYARAN DIGITAL</Text>
                  </View>
                  <Image
                    source={require('../../assets/qris-square.png')}
                    style={styles.qrisPosterImg as any}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrisScanCaption}>
                    Pindai dengan GoPay, BCA, Livin, BSI, OVO, ShopeePay, atau DANA
                  </Text>
                </View>

                {/* Step Instructions */}
                <View style={styles.stepsCard}>
                  <Text style={styles.stepsTitle}>Cara Berinfaq Menggunakan QRIS:</Text>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepDesc}>
                      Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI, BSI) atau e-Wallet (GoPay,
                      OVO, Dana, ShopeePay).
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepDesc}>
                      Pilih menu <Text style={styles.boldText}>Scan QRIS</Text> lalu arahkan kamera
                      ke kode QR di atas.
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepDesc}>
                      <Text style={styles.boldGreen}>Ketik jumlah nominal infaq seikhlasnya</Text>{' '}
                      langsung di aplikasi Anda.
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>4</Text>
                    </View>
                    <Text style={styles.stepDesc}>
                      Pastikan nama merchant penerima adalah{' '}
                      <Text style={styles.boldText}>FAHRIAJI ANJASTRIVINATA</Text>, lalu konfirmasi
                      PIN Anda.
                    </Text>
                  </View>
                </View>

                {/* Contact Persons DKM Section */}
                <View style={styles.contactSection}>
                  <View style={styles.contactHeaderRow}>
                    <Ionicons name="chatbubbles-outline" size={16} color="#EF8354" />
                    <Text style={styles.contactHeading}>Kontak Pengurus DKM (Konfirmasi Infaq)</Text>
                  </View>
                  <Text style={styles.contactSub}>
                    Jika ingin menyampaikan amanah infaq khusus atau konfirmasi transfer, silakan
                    hubungi:
                  </Text>

                  <View style={styles.contactCardsGrid}>
                    {/* Ustadz Astriyo */}
                    <View style={styles.personCard}>
                      <View style={styles.personInfo}>
                        <View style={styles.avatarCircle}>
                          <Ionicons name="person" size={16} color="#EF8354" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.personName}>Ustadz Astriyo</Text>
                          <Text style={styles.personPhone}>0857-7790-0383</Text>
                        </View>
                      </View>
                      <View style={styles.personActions}>
                        <TouchableOpacity
                          style={styles.waBtn}
                          onPress={() => handleOpenWhatsApp('6285777900383', 'Ustadz Astriyo')}
                        >
                          <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
                          <Text style={styles.waBtnText}>WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => handleCall('6285777900383')}
                        >
                          <Ionicons name="call-outline" size={14} color="#EF8354" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Ustadz Dicky */}
                    <View style={styles.personCard}>
                      <View style={styles.personInfo}>
                        <View style={styles.avatarCircle}>
                          <Ionicons name="person" size={16} color="#EF8354" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.personName}>Ustadz Dicky</Text>
                          <Text style={styles.personPhone}>0817-4958-342</Text>
                        </View>
                      </View>
                      <View style={styles.personActions}>
                        <TouchableOpacity
                          style={styles.waBtn}
                          onPress={() => handleOpenWhatsApp('628174958342', 'Ustadz Dicky')}
                        >
                          <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
                          <Text style={styles.waBtnText}>WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => handleCall('628174958342')}
                        >
                          <Ionicons name="call-outline" size={14} color="#EF8354" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Optional Record Transaction Drawer */}
                <View style={styles.logSectionWrapper}>
                  {!showLogForm ? (
                    <TouchableOpacity
                      style={styles.toggleLogFormBtn}
                      onPress={() => setShowLogForm(true)}
                    >
                      <Ionicons name="receipt-outline" size={15} color="#EF8354" />
                      <Text style={styles.toggleLogFormBtnText}>
                        Sudah Transfer? Catat ke Buku Kas Mushola
                      </Text>
                      <Ionicons name="chevron-down" size={14} color="#EF8354" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.logFormBox}>
                      <View style={styles.logFormHeader}>
                        <Text style={styles.logFormTitle}>Catat Transaksi Infaq</Text>
                        <TouchableOpacity onPress={() => setShowLogForm(false)}>
                          <Text style={styles.cancelText}>Tutup Form</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Pocket Choice */}
                      <Text style={styles.inputMiniLabel}>Pilih Alokasi Kantong Kas:</Text>
                      <View style={styles.pocketPillsRow}>
                        {pockets.map((p) => {
                          const isSel = p.id === selectedPocketId;
                          return (
                            <TouchableOpacity
                              key={p.id}
                              style={[styles.pocketPill, isSel && styles.pocketPillActive]}
                              onPress={() => setSelectedPocketId(p.id)}
                            >
                              <Text
                                style={[
                                  styles.pocketPillText,
                                  isSel && styles.pocketPillTextActive,
                                ]}
                              >
                                {p.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Nominal Amount */}
                      <Text style={styles.inputMiniLabel}>Nominal Yang Ditransfer:</Text>
                      <View style={styles.inputBox}>
                        <Text style={styles.rpText}>Rp</Text>
                        <TextInput
                          style={styles.textInputBox}
                          placeholder="cth: 50.000"
                          keyboardType="numeric"
                          value={confirmedAmount}
                          onChangeText={(v) => setConfirmedAmount(v.replace(/[^0-9]/g, ''))}
                        />
                      </View>

                      {/* Donor Name */}
                      <Text style={styles.inputMiniLabel}>Nama Donatur (Boleh Dikosongkan):</Text>
                      <TextInput
                        style={[styles.textInputBox, styles.plainInputBox]}
                        placeholder="Hamba Allah"
                        value={donorName}
                        onChangeText={setDonorName}
                      />

                      <TouchableOpacity
                        style={styles.submitConfirmationBtn}
                        onPress={handleSaveConfirmation}
                      >
                        <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.submitConfirmationBtnText}>Simpan ke Buku Kas</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FDF1EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#EF8354',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  scrollArea: {
    marginTop: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainView: {
    gap: 14,
  },
  noticeBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FDF1EB',
    borderWidth: 1,
    borderColor: '#BFC0C0',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 12,
    color: '#EF8354',
    lineHeight: 17,
  },
  merchantCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  merchantRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  gopayBadge: {
    backgroundColor: '#00AED6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gopayBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrisLogoBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qrisLogoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  nmidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  nmidLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  nmidValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDF1EB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  copyChipSuccess: {
    backgroundColor: '#D1FAE5',
  },
  copyChipText: {
    fontSize: 11,
    color: '#EF8354',
    fontWeight: '600',
  },
  copyChipTextSuccess: {
    color: '#EF8354',
  },
  qrisPosterFrame: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#EF8354',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  qrisOfficialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  qrisRedText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 1,
  },
  qrisSubHead: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  qrisPosterImg: {
    width: 250,
    height: 250,
    borderRadius: 8,
  },
  qrisScanCaption: {
    fontSize: 10.5,
    color: '#EF8354',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  stepsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF8354',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepDesc: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  boldGreen: {
    fontWeight: '700',
    color: '#EF8354',
  },
  contactSection: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 14,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  contactHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  contactSub: {
    fontSize: 11,
    color: '#EF8354',
    marginBottom: 10,
  },
  contactCardsGrid: {
    gap: 8,
  },
  personCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF1EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  personPhone: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  personActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  waBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  callBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FDF1EB',
  },
  logSectionWrapper: {
    marginTop: 2,
  },
  toggleLogFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleLogFormBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF8354',
  },
  logFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  logFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logFormTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cancelText: {
    fontSize: 11,
    color: '#64748B',
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  pocketPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pocketPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pocketPillActive: {
    backgroundColor: '#FDF1EB',
    borderColor: '#EF8354',
  },
  pocketPillText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  pocketPillTextActive: {
    color: '#EF8354',
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  rpText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF8354',
    marginRight: 6,
  },
  textInputBox: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  plainInputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  submitConfirmationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF8354',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  submitConfirmationBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  successIconBubble: {
    marginBottom: 10,
  },
  successHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  blessingBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BFC0C0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  arabicBlessing: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF8354',
    marginBottom: 6,
  },
  blessingDesc: {
    fontSize: 11,
    color: '#065F46',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  primaryActionBtn: {
    backgroundColor: '#EF8354',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
