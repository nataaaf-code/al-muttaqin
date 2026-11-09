import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  PressableProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, R, TYPE } from './colors';

// Native driver tidak ada di web; Animated jatuh ke JS di sana.
export const NATIVE = Platform.OS !== 'web';

// Preferensi reduced-motion dibaca sekali dan diperbarui lewat event; semua durasi lewat dur().
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => (reduceMotion = v))
  .catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => (reduceMotion = v));

export const dur = (ms: number) => (reduceMotion ? 0 : ms);
export const isReducedMotion = () => reduceMotion;

export const EASE_OUT = Easing.out(Easing.cubic);

/** Spring untuk posisi/skala; timing 0 ms saat reduced-motion. */
export function springTo(v: Animated.Value, toValue: number, useNativeDriver = NATIVE) {
  return reduceMotion
    ? Animated.timing(v, { toValue, duration: 0, useNativeDriver })
    : Animated.spring(v, { toValue, damping: 18, stiffness: 210, mass: 1, useNativeDriver });
}

/**
 * Masuk layar: naik 14px + muncul, berjenjang lewat `delay`.
 * Tujuan: menandai perpindahan tab dan mengarahkan urutan baca dari atas.
 */
export function Rise({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: dur(420),
      delay: reduceMotion ? 0 : delay,
      easing: EASE_OUT,
      useNativeDriver: NATIVE,
    }).start();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  /** Cincin fokus emas untuk tombol di atas latar zamrud. */
  onDark?: boolean;
  children: React.ReactNode;
};

/**
 * Semua kontrol yang bisa ditekan. Tekan = mengecil 4% lalu memantul balik (umpan balik sentuh),
 * hover & fokus keyboard punya state sendiri (R-32, R-39).
 */
export function Press({ style, hoverStyle, onDark, disabled, children, ...rest }: PressProps) {
  const scale = useState(() => new Animated.Value(1))[0];
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        springTo(scale, 0.96).start();
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        springTo(scale, 1).start();
        rest.onPressOut?.(e);
      }}
      onHoverIn={(e) => {
        setHovered(true);
        rest.onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        setHovered(false);
        rest.onHoverOut?.(e);
      }}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={[
        s.pressBase,
        style,
        hovered && !disabled && (hoverStyle ?? s.hoverDefault),
        focused && (onDark ? s.focusOnDark : s.focus),
        disabled && s.disabled,
        { transform: [{ scale }] },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * Lembar modal: scrim memudar, panel naik dengan spring dari bawah (HP) atau dari sedikit di bawah (layar lebar).
 * Escape / tombol back menutup lewat onRequestClose.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const v = useState(() => new Animated.Value(0))[0];
  const [mounted, setMounted] = useState(visible);
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  // Pasang modal saat diminta tampil (penyesuaian state saat render, bukan di effect).
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      springTo(v, 1).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: dur(180), easing: EASE_OUT, useNativeDriver: NATIVE }).start(
        () => setMounted(false)
      );
    }
  }, [visible, v]);

  if (!mounted) return null;

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [wide ? 40 : 520, 0] });

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.scrim, { opacity: v }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Tutup" />
      </Animated.View>
      <View style={[s.sheetWrap, wide && s.sheetWrapWide]} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[s.sheet, wide && s.sheetWide, { opacity: wide ? v : 1, transform: [{ translateY }] }]}
        >
          <View style={s.sheetHead}>
            <View style={{ flex: 1 }}>
              <Text style={s.sheetTitle} accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? <Text style={s.sheetSub}>{subtitle}</Text> : null}
            </View>
            <Press style={s.iconBtn} onPress={onClose} accessibilityLabel="Tutup">
              <Ionicons name="close" size={20} color={C.ink} aria-hidden />
            </Press>
          </View>
          <ScrollView style={{ flexShrink: 1 }}>{children}</ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  pressBase: {
    cursor: 'pointer',
  },
  hoverDefault: {
    opacity: 0.82,
  },
  focus: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: C.g700,
    outlineOffset: 2,
  },
  focusOnDark: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: C.onDark,
    outlineOffset: 2,
  },
  disabled: {
    opacity: 0.45,
    // Tipe RN hanya kenal auto|pointer; react-native-web meneruskan nilai CSS ini.
    cursor: 'not-allowed' as 'auto',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.scrim,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetWrapWide: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: R.card,
    borderTopRightRadius: R.card,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  sheetWide: {
    width: '100%',
    maxWidth: 520,
    borderRadius: R.card,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  sheetTitle: {
    ...TYPE.h2,
    fontSize: 20,
    color: C.ink,
  },
  sheetSub: {
    ...TYPE.body,
    color: C.inkMuted,
    marginTop: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: R.inner,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    marginRight: -10,
  },
});
