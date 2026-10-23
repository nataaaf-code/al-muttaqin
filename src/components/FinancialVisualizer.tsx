import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CashPocket } from '../types';
import { formatRupiah } from '../utils/formatters';

interface FinancialVisualizerProps {
  pockets: CashPocket[];
  totalBalance: number;
  onOpenQRIS: (pocketId: string) => void;
  onSelectPocket: (pocketId: string) => void;
}

const POCKET_COLORS = [
  '#059669', // Emerald
  '#0284C7', // Sky blue
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#EC4899', // Pink
];

export function FinancialVisualizer({
  pockets,
  totalBalance,
  onOpenQRIS,
  onSelectPocket,
}: FinancialVisualizerProps) {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  // Renovasi Project Target Mockup
  const targetProject = {
    title: 'Renovasi Tempat Wudhu & Perluasan Kanopi',
    targetAmount: 50000000,
    currentAmount: pockets.find((p) => p.id === 'pocket-pembangunan')?.balance || 38250000,
  };
  const projectPercentage = Math.min(
    100,
    Math.round((targetProject.currentAmount / targetProject.targetAmount) * 100)
  );

  return (
    <View style={styles.container}>
      {/* Header with Visual Balance */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subLabel}>TOTAL KAS TERHIMPUN</Text>
          <Text style={styles.bigBalance}>{formatRupiah(totalBalance)}</Text>
        </View>

        <TouchableOpacity
          style={styles.quickQrisBtn}
          onPress={() => onOpenQRIS('pocket-operasional')}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
          <Text style={styles.quickQrisText}>Infaq QRIS</Text>
        </TouchableOpacity>
      </View>

      {/* Proportional Segmented Meter Bar */}
      <View style={styles.meterContainer}>
        <View style={styles.meterTrack}>
          {pockets.map((pocket, idx) => {
            const percent = totalBalance > 0 ? (pocket.balance / totalBalance) * 100 : 0;
            const color = POCKET_COLORS[idx % POCKET_COLORS.length];
            const isHovered = activeHoverId === pocket.id;

            return (
              <TouchableOpacity
                key={pocket.id}
                style={[
                  styles.meterSegment,
                  {
                    width: `${percent}%`,
                    backgroundColor: color,
                    opacity: activeHoverId ? (isHovered ? 1 : 0.4) : 1,
                  },
                ]}
                onPress={() => {
                  setActiveHoverId(pocket.id);
                  onSelectPocket(pocket.id);
                }}
                activeOpacity={0.7}
              />
            );
          })}
        </View>

        {/* Legend Chips Below the Meter */}
        <View style={styles.legendRow}>
          {pockets.map((pocket, idx) => {
            const percent = totalBalance > 0 ? Math.round((pocket.balance / totalBalance) * 100) : 0;
            const color = POCKET_COLORS[idx % POCKET_COLORS.length];
            const isSelected = activeHoverId === pocket.id;

            return (
              <TouchableOpacity
                key={pocket.id}
                style={[styles.legendChip, isSelected && styles.legendChipSelected]}
                onPress={() => {
                  setActiveHoverId(isSelected ? null : pocket.id);
                  onSelectPocket(pocket.id);
                }}
              >
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendName} numberOfLines={1}>
                  {pocket.name.replace('Kas ', '')}
                </Text>
                <Text style={styles.legendPercent}>{percent}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Target Program Pembangunan (Gamified Progress Tracker) */}
      <View style={styles.targetCard}>
        <View style={styles.targetTop}>
          <View style={styles.targetBadge}>
            <Ionicons name="construct" size={13} color="#B45309" />
            <Text style={styles.targetBadgeText}>PROGRAM PRIORITAS FISIK</Text>
          </View>
          <View style={styles.percentagePill}>
            <Text style={styles.percentageText}>{projectPercentage}% Terkumpul</Text>
          </View>
        </View>

        <Text style={styles.targetTitle}>{targetProject.title}</Text>

        {/* Progress Bar with Gradient feel */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${projectPercentage}%` }]} />
        </View>

        <View style={styles.targetFooter}>
          <Text style={styles.targetAmountText}>
            <Text style={styles.boldGreen}>{formatRupiah(targetProject.currentAmount)}</Text> /{' '}
            {formatRupiah(targetProject.targetAmount)}
          </Text>

          <TouchableOpacity
            style={styles.donateAction}
            onPress={() => onOpenQRIS('pocket-pembangunan')}
          >
            <Text style={styles.donateActionText}>Ikut Wakaf/Infaq →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  bigBalance: {
    fontSize: 26,
    fontWeight: '900',
    color: '#064E3B',
    marginTop: 2,
  },
  quickQrisBtn: {
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#047857',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  quickQrisText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  meterContainer: {
    marginBottom: 16,
  },
  meterTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  meterSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  legendChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    maxWidth: 90,
  },
  legendPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  targetCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  targetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  percentagePill: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  targetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#FDE68A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 4,
  },
  targetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetAmountText: {
    fontSize: 12,
    color: '#78350F',
  },
  boldGreen: {
    fontWeight: '800',
    color: '#047857',
  },
  donateAction: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  donateActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
});
