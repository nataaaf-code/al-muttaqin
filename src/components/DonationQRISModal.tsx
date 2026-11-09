import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Linking, Platform, StyleSheet, Text, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMushola } from '../store/useMusholaStore';
import { formatRupiah } from '../utils/formatters';
import { MUSHOLA_INFO } from '../store/mockData';
import { C, R, SP, TYPE } from '../theme/colors';
import { NATIVE, Sheet, dur } from '../theme/motion';
import { Avatar, Button, Field, IconButton, IconTile, ListRow, Segmented, T } from '../ui/kit';

interface DonationQRISModalProps {
  visible: boolean;
  onClose: () => void;
  defaultPocketId?: string;
}

const QR_SIZE = 240;
// assets/qris-square.png berukuran 714 x 728
const QR_HEIGHT = Math.round((QR_SIZE * 728) / 714);

const STEPS = [
  'Buka aplikasi m-Banking atau e-Wallet yang mendukung QRIS.',
  'Pilih menu Scan QRIS, lalu arahkan kamera ke kode QR di atas.',
  'Ketik nominal infaq seikhlasnya langsung di aplikasi Anda.',
  `Pastikan nama penerima adalah ${MUSHOLA_INFO.qris.merchantName}, lalu konfirmasi dengan PIN.`,
];

type CopyState = 'idle' | 'copied' | 'manual';

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
  const [amountError, setAmountError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [copyFade] = useState(() => new Animated.Value(0));
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saat dibuka, kantong mengikuti pemanggil (mis. kartu kantong di Dashboard).
  const [openedWith, setOpenedWith] = useState<string | null>(visible ? defaultPocketId : null);
  const openKey = visible ? defaultPocketId : null;
  if (openKey !== openedWith) {
    setOpenedWith(openKey);
    if (openKey) setSelectedPocketId(openKey);
  }

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const selectedPocket = pockets.find((p) => p.id === selectedPocketId) || pockets[0];
  const { merchantName, nmid, tip } = MUSHOLA_INFO.qris;

  const showCopyFeedback = (state: CopyState) => {
    setCopyState(state);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    Animated.timing(copyFade, { toValue: 1, duration: dur(150), useNativeDriver: NATIVE }).start();
    copyTimer.current = setTimeout(() => {
      Animated.timing(copyFade, { toValue: 0, duration: dur(300), useNativeDriver: NATIVE }).start(() =>
        setCopyState('idle')
      );
    }, 2200);
  };

  const handleCopyNMID = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(nmid);
        showCopyFeedback('copied');
        return;
      } catch {
        // jatuh ke petunjuk salin manual
      }
    }
    showCopyFeedback('manual');
  };

  const openUrl = (url: string) => {
    setLinkError(false);
    Linking.openURL(url).catch(() => setLinkError(true));
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `Assalamu'alaikum ${name},\nSaya ingin bertanya / konfirmasi terkait infaq di Musholla Al Muttaqin (Perumahan Mutiara Puri Harmoni, Rajeg).`
    );
    openUrl(`https://wa.me/${phone}?text=${message}`);
  };

  const handleCall = (phone: string) => openUrl(`tel:+${phone}`);

  const parsedAmount = parseInt(confirmedAmount.replace(/[^0-9]/g, ''), 10) || 0;

  const handleSaveConfirmation = async () => {
    if (!parsedAmount || parsedAmount < 1000) {
      setAmountError('Isi nominal yang sudah ditransfer, minimal Rp 1.000.');
      return;
    }
    if (!selectedPocket) {
      setSaveError('Kantong kas belum tersedia. Muat ulang aplikasi lalu coba lagi.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await addTransaction({
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
    } catch (err: any) {
      setSaveError(`${err?.message || 'Gagal menyimpan ke buku kas.'} Periksa koneksi lalu coba lagi.`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetAndClose = () => {
    setShowLogForm(false);
    setIsSuccess(false);
    setConfirmedAmount('');
    setDonorName('');
    setAmountError(undefined);
    setSaveError(null);
    setLinkError(false);
    setCopyState('idle');
    copyFade.setValue(0);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={handleResetAndClose} title="Infaq QRIS" subtitle="Musholla Al Muttaqin, bebas nominal">
      {isSuccess ? (
        <View style={styles.success} accessibilityLiveRegion="polite">
          <IconTile icon="checkmark-circle-outline" size={56} />
          <Text style={styles.successTitle} accessibilityRole="header">
            Infaq tercatat
          </Text>
          <T color={C.inkMuted} style={styles.center}>
            Infaq sebesar <T v="bodyStrong">{formatRupiah(parsedAmount)}</T> sudah dibukukan ke kas{' '}
            <T v="bodyStrong">{selectedPocket?.name}</T>.
          </T>
          <View style={styles.blessing}>
            <Text style={styles.arabic}>جَزَاكُمُ اللَّهُ خَيْرًا كَثِيرًا</Text>
            <T v="small" color={C.inkMuted} style={styles.center}>
              Semoga Allah membalas kebaikan Anda dengan kebaikan yang banyak.
            </T>
          </View>
          <Button label="Selesai" onPress={handleResetAndClose} style={styles.fullBtn} />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={C.g700} aria-hidden />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="bodyStrong">Bebas nominal</T>
              <T v="small" color={C.inkMuted}>
                {tip}
              </T>
            </View>
          </View>

          <View style={styles.qrFrame}>
            <Image
              source={require('../../assets/qris-square.png')}
              style={{ width: QR_SIZE, height: QR_HEIGHT, maxWidth: '100%' }}
              resizeMode="contain"
              alt={`Kode QRIS infaq Musholla Al Muttaqin, penerima ${merchantName}`}
              accessibilityLabel={`Kode QRIS infaq Musholla Al Muttaqin, penerima ${merchantName}`}
            />
          </View>

          <View style={styles.merchant}>
            <View style={styles.merchantRow}>
              <T v="small" color={C.inkMuted} style={styles.merchantKey}>
                Nama penerima
              </T>
              <T v="bodyStrong" style={styles.merchantVal}>
                {merchantName}
              </T>
            </View>
            <View style={[styles.merchantRow, styles.merchantRowLine]}>
              <T v="small" color={C.inkMuted} style={styles.merchantKey}>
                NMID
              </T>
              <Text selectable style={styles.nmid}>
                {nmid}
              </Text>
              <Button
                compact
                variant="outline"
                icon={copyState === 'copied' ? 'checkmark' : 'copy-outline'}
                label={copyState === 'copied' ? 'Tersalin' : 'Salin'}
                accessibilityLabel="Salin NMID"
                onPress={handleCopyNMID}
              />
            </View>
            {copyState !== 'idle' ? (
              <Animated.Text style={[styles.copyNote, { opacity: copyFade }]} accessibilityLiveRegion="polite">
                {copyState === 'copied'
                  ? 'NMID tersalin ke papan klip.'
                  : 'Salin otomatis tidak tersedia di perangkat ini. Tekan lama teks NMID untuk menyalin.'}
              </Animated.Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <T v="h3">Cara berinfaq lewat QRIS</T>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <T v="smallStrong" color={C.g700}>
                    {i + 1}
                  </T>
                </View>
                <T style={{ flex: 1 }}>{step}</T>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <T v="h3">Kontak pengurus DKM</T>
            <T v="small" color={C.inkMuted}>
              Untuk amanah infaq khusus atau konfirmasi transfer, hubungi:
            </T>
            <View>
              {MUSHOLA_INFO.contacts.map((c, i) => (
                <ListRow
                  key={c.phone}
                  leading={<Avatar name={c.name} />}
                  title={c.name}
                  subtitle={c.formattedPhone}
                  last={i === MUSHOLA_INFO.contacts.length - 1}
                  trailing={
                    <View style={styles.contactActions}>
                      <Button
                        compact
                        variant="outline"
                        icon="logo-whatsapp"
                        label="WhatsApp"
                        accessibilityLabel={`Kirim WhatsApp ke ${c.name}`}
                        onPress={() => handleOpenWhatsApp(c.phone, c.name)}
                      />
                      <IconButton icon="call-outline" label={`Telepon ${c.name}`} onPress={() => handleCall(c.phone)} />
                    </View>
                  }
                />
              ))}
            </View>
            {linkError ? (
              <T v="small" color={C.dangerFg}>
                WhatsApp atau telepon tidak bisa dibuka dari perangkat ini. Hubungi nomor di atas secara manual.
              </T>
            ) : null}
          </View>

          <View style={styles.logBox}>
            {!showLogForm ? (
              <View style={{ gap: SP.s }}>
                <T v="bodyStrong">Sudah transfer?</T>
                <T v="small" color={C.inkMuted}>
                  Catat infaq Anda ke buku kas musholla agar tampil di laporan kas.
                </T>
                <Button
                  label="Catat ke buku kas"
                  icon="receipt-outline"
                  variant="outline"
                  onPress={() => setShowLogForm(true)}
                />
              </View>
            ) : (
              <View style={{ gap: SP.l }}>
                <View style={styles.logHead}>
                  <T v="h3" style={{ flex: 1 }}>
                    Catat infaq ke buku kas
                  </T>
                  <Button compact variant="ghost" label="Batal" onPress={() => setShowLogForm(false)} />
                </View>

                <View style={{ gap: 6 }}>
                  <T v="label">Kantong kas tujuan</T>
                  {pockets.length ? (
                    <Segmented
                      label="Kantong kas tujuan"
                      options={pockets.map((p) => ({ key: p.id, label: p.name }))}
                      value={selectedPocket?.id ?? ''}
                      onChange={setSelectedPocketId}
                    />
                  ) : (
                    <T v="small" color={C.inkMuted}>
                      Belum ada kantong kas yang dimuat.
                    </T>
                  )}
                </View>

                <Field
                  label="Nominal yang ditransfer (Rp)"
                  value={confirmedAmount}
                  onChangeText={(v) => {
                    setConfirmedAmount(v.replace(/[^0-9]/g, ''));
                    setAmountError(undefined);
                  }}
                  keyboardType="numeric"
                  placeholder="50000"
                  error={amountError}
                  hint={parsedAmount ? formatRupiah(parsedAmount) : undefined}
                />

                <Field
                  label="Nama donatur (boleh dikosongkan)"
                  value={donorName}
                  onChangeText={setDonorName}
                  placeholder="Hamba Allah"
                />

                {saveError ? (
                  <T v="small" color={C.dangerFg}>
                    {saveError}
                  </T>
                ) : null}

                <Button label="Simpan ke buku kas" icon="save-outline" onPress={handleSaveConfirmation} loading={saving} />
              </View>
            )}
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: SP.xl,
  },
  center: {
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.s,
    padding: SP.m,
    borderRadius: R.inner,
    backgroundColor: C.g50,
  },
  qrFrame: {
    alignItems: 'center',
    padding: SP.l,
    borderRadius: R.inner,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
  },
  merchant: {
    borderRadius: R.inner,
    backgroundColor: C.sunken,
    paddingHorizontal: SP.l,
    paddingVertical: SP.xs,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SP.s,
    paddingVertical: SP.m,
  },
  merchantRowLine: {
    borderTopWidth: 1,
    borderColor: C.line,
  },
  merchantKey: {
    width: 96,
  },
  merchantVal: {
    flex: 1,
    minWidth: 140,
  },
  nmid: {
    ...TYPE.bodyStrong,
    ...TYPE.num,
    color: C.ink,
    flex: 1,
    minWidth: 120,
  } as TextStyle,
  copyNote: {
    ...TYPE.small,
    color: C.g700,
    paddingBottom: SP.m,
  } as TextStyle,
  section: {
    gap: SP.s,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.m,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.g100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.xs,
  },
  logBox: {
    padding: SP.l,
    borderRadius: R.inner,
    borderWidth: 1,
    borderColor: C.line,
  },
  logHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.s,
  },
  success: {
    alignItems: 'center',
    gap: SP.m,
    paddingVertical: SP.l,
  },
  successTitle: {
    ...TYPE.h2,
    color: C.ink,
  } as TextStyle,
  blessing: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: SP.s,
    padding: SP.l,
    borderRadius: R.inner,
    backgroundColor: C.g50,
  },
  arabic: {
    ...TYPE.h2,
    lineHeight: 34,
    color: C.g900,
    textAlign: 'center',
    writingDirection: 'rtl',
  } as TextStyle,
  fullBtn: {
    alignSelf: 'stretch',
  },
});
