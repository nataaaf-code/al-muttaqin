/**
 * Kit komponen "Hijau Kartu". Spesifikasi visual: DESIGN.md bagian 0.
 * Layar menyusun UI dari komponen ini + token di src/theme/colors.ts.
 */
import React, { useId } from 'react';
import {
  ActivityIndicator,
  KeyboardTypeOptions,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, Line, LinearGradient, Pattern, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BP, C, F, HERO_GRADIENT, R, SP, TYPE } from '../theme/colors';
import { Press, Rise } from '../theme/motion';

export type IconName = keyof typeof Ionicons.glyphMap;

/* ---------- Layout ---------- */

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    width,
    isPhone: width < BP.tablet,
    isTablet: width >= BP.tablet && width < BP.desktop,
    isDesktop: width >= BP.desktop,
    /** Sidebar tampil mulai tablet. */
    hasSidebar: width >= BP.tablet,
  };
}

/** Halaman: scroll, padding responsif, lebar maksimum 1320. */
export function Screen({ children, contentStyle }: { children: React.ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const { isPhone } = useBreakpoint();
  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.screenContent, isPhone && s.screenContentPhone, contentStyle]}>
      {children}
    </ScrollView>
  );
}

/**
 * Baris kolom. Di HP (atau di bawah `stackBelow`) kolom ditumpuk vertikal.
 * Tiap anak dibungkus `Col` dengan flex sesuai `flex` prop-nya.
 */
export function Row({
  children,
  gap = SP.l,
  stackBelow = BP.tablet,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  stackBelow?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  const stacked = width < stackBelow;
  return <View style={[{ flexDirection: stacked ? 'column' : 'row', gap, alignItems: 'stretch' }, style]}>{children}</View>;
}

export function Col({ flex = 1, children, style }: { flex?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flex, minWidth: 0, gap: SP.l }, style]}>{children}</View>;
}

/* ---------- Permukaan ---------- */

/** Latar gradien hijau untuk satu kartu fokus per layar. */
export function HeroFill({ radius = R.card }: { radius?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <LinearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={HERO_GRADIENT[0]} />
          <Stop offset="1" stopColor={HERO_GRADIENT[1]} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" rx={0} fill={`url(#g${id})`} />
    </Svg>
  );
}

type CardTone = 'plain' | 'hero' | 'sunken';

export function Card({
  children,
  tone = 'plain',
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
  /** Jeda animasi masuk (ms), untuk urutan baca. */
  delay?: number;
}) {
  return (
    <Rise delay={delay} style={[s.card, tone === 'hero' && s.cardHero, tone === 'sunken' && s.cardSunken, style]}>
      {tone === 'hero' && <HeroFill />}
      {children}
    </Rise>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  onDark,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <View style={s.cardHeader}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.cardTitle, onDark && { color: C.onDark }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={[s.cardSub, onDark && { color: C.onDarkMuted }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <Rise style={s.pageHeader}>
      <View style={{ flex: 1, minWidth: 220 }}>
        <Text style={s.pageTitle} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={s.pageSub}>{subtitle}</Text> : null}
      </View>
      {actions ? <View style={s.pageActions}>{actions}</View> : null}
    </Rise>
  );
}

/* ---------- Kontrol ---------- */

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'onDark' | 'onDarkOutline';

export function Button({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  accessibilityLabel,
  style,
  compact,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** 36px tinggi visual; area sentuh tetap 44 lewat hitSlop. */
  compact?: boolean;
}) {
  const v = BTN[variant];
  return (
    <Press
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel}
      onDark={variant === 'onDark' || variant === 'onDarkOutline'}
      hitSlop={compact ? 4 : undefined}
      style={[s.btn, compact && s.btnCompact, v.box, style]}
      hoverStyle={[v.box, v.hover]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={compact ? 16 : 18} color={v.fg} aria-hidden />
      ) : null}
      <Text style={[s.btnText, compact && s.btnTextCompact, { color: v.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Press>
  );
}

const BTN: Record<ButtonVariant, { box: ViewStyle; hover: ViewStyle; fg: string }> = {
  primary: { box: { backgroundColor: C.g700 }, hover: { backgroundColor: C.g800 }, fg: C.onDark },
  outline: { box: { borderWidth: 1, borderColor: C.g700, backgroundColor: C.card }, hover: { backgroundColor: C.g50 }, fg: C.g700 },
  ghost: { box: { backgroundColor: 'transparent' }, hover: { backgroundColor: C.g50 }, fg: C.g700 },
  danger: { box: { borderWidth: 1, borderColor: C.dangerFg, backgroundColor: C.card }, hover: { backgroundColor: C.dangerBg }, fg: C.dangerFg },
  onDark: { box: { backgroundColor: C.onDark }, hover: { backgroundColor: C.g100 }, fg: C.g900 },
  onDarkOutline: {
    box: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
    hover: { backgroundColor: 'rgba(255,255,255,0.12)' },
    fg: C.onDark,
  },
};

/** Tombol bulat panah: membuka halaman rinci dari kartu. */
export function ArrowButton({ onPress, label, onDark }: { onPress: () => void; label: string; onDark?: boolean }) {
  return (
    <Press
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      onDark={onDark}
      hitSlop={4}
      style={[s.arrow, onDark ? s.arrowOnDark : s.arrowPlain]}
      hoverStyle={onDark ? { backgroundColor: 'rgba(255,255,255,0.15)' } : { backgroundColor: C.g50 }}
    >
      <Ionicons name="arrow-up-outline" size={18} color={onDark ? C.onDark : C.ink} style={s.arrowIcon} aria-hidden />
    </Press>
  );
}

/** Tombol ikon bulat 44px (aksi tanpa teks wajib punya label). */
export function IconButton({
  icon,
  label,
  onPress,
  onDark,
  filled,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  onDark?: boolean;
  filled?: boolean;
  disabled?: boolean;
}) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={label}
      onDark={onDark}
      disabled={disabled}
      style={[s.iconBtn, filled ? { backgroundColor: onDark ? C.onDark : C.g700 } : onDark ? s.arrowOnDark : s.arrowPlain]}
      hoverStyle={filled ? { opacity: 0.88 } : onDark ? { backgroundColor: 'rgba(255,255,255,0.15)' } : { backgroundColor: C.g50 }}
    >
      <Ionicons name={icon} size={20} color={filled ? (onDark ? C.g900 : C.onDark) : onDark ? C.onDark : C.ink} aria-hidden />
    </Press>
  );
}

/** Pilihan pil (tab/filter). */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.seg} accessibilityRole="tablist" accessibilityLabel={label}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Press
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.key)}
            hitSlop={{ top: 4, bottom: 4 }}
            style={[s.segItem, active && s.segItemActive]}
            hoverStyle={active ? undefined : { backgroundColor: C.g50 }}
          >
            <Text style={[s.segText, active && s.segTextActive]}>{o.label}</Text>
          </Press>
        );
      })}
    </ScrollView>
  );
}

/* ---------- Tampilan data ---------- */

export type BadgeTone = 'success' | 'warn' | 'danger' | 'neutral';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const t = BADGE[tone];
  return (
    <View style={[s.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[s.badgeText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const BADGE: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  success: { bg: C.g50, fg: C.g700, border: C.g100 },
  warn: { bg: C.warnBg, fg: C.warnFg, border: C.warnLine },
  danger: { bg: C.dangerBg, fg: C.dangerFg, border: C.dangerLine },
  neutral: { bg: C.sunken, fg: C.inkMuted, border: C.line },
};

/** Avatar inisial: tidak pernah foto karangan. */
export function Avatar({ name, size = 40, dark }: { name: string; size?: number; dark?: boolean }) {
  const initials = (name || '?')
    .replace(/^(Dr|H|Hj|Ustadz|Ustadzah|Bpk|Ibu|Akhi|Ukhti)\.?\s+/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={[
        s.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: dark ? C.g800 : C.g100 },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[s.avatarText, { fontSize: size * 0.38, color: dark ? C.onDark : C.g800 }]}>{initials || '?'}</Text>
    </View>
  );
}

/** Kotak ikon untuk baris daftar. */
export function IconTile({ icon, size = 40, tone = 'green' }: { icon: IconName; size?: number; tone?: 'green' | 'dark' | 'neutral' }) {
  const bg = tone === 'dark' ? C.g800 : tone === 'neutral' ? C.sunken : C.g100;
  const fg = tone === 'dark' ? C.onDark : tone === 'neutral' ? C.inkMuted : C.g700;
  return (
    <View style={[s.tile, { width: size, height: size, backgroundColor: bg }]}>
      <Ionicons name={icon} size={size * 0.48} color={fg} aria-hidden />
    </View>
  );
}

/** Baris daftar standar. Kalau `onPress` ada, baris bisa ditekan. */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  accessibilityLabel,
  last,
}: {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  last?: boolean;
}) {
  const body = (
    <>
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={s.rowSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </>
  );
  const style = [s.row, !last && s.rowLine];
  return onPress ? (
    <Press onPress={onPress} accessibilityLabel={accessibilityLabel} style={style} hoverStyle={{ backgroundColor: C.sunken }}>
      {body}
    </Press>
  ) : (
    <View style={style}>{body}</View>
  );
}

/** Angka besar + label: dipakai kartu ringkasan. */
export function Stat({
  label,
  value,
  note,
  onOpen,
  hero,
  delay,
  compact,
}: {
  label: string;
  value: string;
  /** Angka lebih kecil untuk kolom sempit (HP). */
  compact?: boolean;
  /** Keterangan dari data nyata; jangan delta karangan. */
  note?: string;
  onOpen?: () => void;
  hero?: boolean;
  delay?: number;
}) {
  return (
    <Card tone={hero ? 'hero' : 'plain'} delay={delay} style={[s.stat, compact && s.statCompact]}>
      <View style={s.statTop}>
        <Text style={[s.statLabel, hero && { color: C.onDark }]}>{label}</Text>
        {onOpen ? <ArrowButton onPress={onOpen} label={`Buka rincian ${label}`} onDark={hero} /> : null}
      </View>
      <Text style={[s.statValue, compact && s.statValueCompact, hero && { color: C.onDark }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {note ? <Text style={[s.statNote, hero && { color: C.onDarkMuted }]}>{note}</Text> : null}
    </Card>
  );
}

/** Arsir diagonal: menandai data kosong/tertunda (bukan dekorasi). */
export function Hatch({ style, radius = R.pill }: { style?: StyleProp<ViewStyle>; radius?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <View style={[{ overflow: 'hidden', borderRadius: radius, backgroundColor: C.hatchBg }, style]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern id={`h${id}`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <Line x1="0" y1="0" x2="0" y2="8" stroke={C.hatchLine} strokeWidth="2.5" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#h${id})`} />
      </Svg>
    </View>
  );
}

/** State kosong/error: selalu sebut sebab + langkah berikutnya. */
export function EmptyState({
  icon = 'leaf-outline',
  title,
  text,
  action,
}: {
  icon?: IconName;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.empty} accessibilityLiveRegion="polite">
      <IconTile icon={icon} size={44} tone="neutral" />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyText}>{text}</Text>
      {action}
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={s.empty} accessibilityLiveRegion="polite">
      <ActivityIndicator color={C.g700} />
      <Text style={s.emptyText}>{label}</Text>
    </View>
  );
}

/* ---------- Form ---------- */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  error,
  hint,
  secureTextEntry,
  editable = true,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.inkFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        accessibilityLabel={label}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[
          s.input,
          multiline && s.inputMulti,
          focus && s.inputFocus,
          !!error && s.inputError,
          !editable && { opacity: 0.6 },
        ]}
      />
      {error ? (
        <Text style={s.fieldError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={s.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Teks dengan token tipe; untuk kasus yang tidak tercakup komponen. */
export function T({
  v = 'body',
  color = C.ink,
  style,
  children,
  numberOfLines,
}: {
  v?: keyof typeof TYPE;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text style={[TYPE[v] as TextStyle, { color }, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  screenContent: {
    padding: SP.xxl,
    paddingBottom: 48,
    gap: SP.l,
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
  },
  screenContentPhone: { padding: SP.l, paddingBottom: 32, gap: SP.m },

  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.line,
    padding: SP.xl,
    overflow: 'hidden',
  },
  cardHero: { borderColor: C.g800, backgroundColor: C.g800 },
  cardSunken: { backgroundColor: C.sunken },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.m, marginBottom: SP.l },
  cardTitle: { ...TYPE.h2, color: C.ink } as TextStyle,
  cardSub: { ...TYPE.small, color: C.inkMuted, marginTop: 2 } as TextStyle,

  pageHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: SP.l, marginBottom: SP.xs },
  pageTitle: { ...TYPE.h1, color: C.ink } as TextStyle,
  pageSub: { ...TYPE.body, color: C.inkMuted, marginTop: 4 } as TextStyle,
  pageActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s, flexShrink: 1, maxWidth: '100%' },

  btn: {
    minHeight: 44,
    paddingHorizontal: SP.xl,
    borderRadius: R.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP.s,
  },
  btnCompact: { minHeight: 36, paddingHorizontal: SP.m + 2 },
  btnText: { fontFamily: F.m, fontSize: 14 },
  btnTextCompact: { fontSize: 13 },

  arrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  arrowPlain: { borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  arrowOnDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  arrowIcon: { transform: [{ rotate: '45deg' }] },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  seg: { flexDirection: 'row', gap: 6, padding: 4, backgroundColor: C.sunken, borderRadius: R.pill, borderWidth: 1, borderColor: C.line },
  segItem: { minHeight: 36, paddingHorizontal: SP.l, borderRadius: R.pill, justifyContent: 'center' },
  segItemActive: { backgroundColor: C.g700 },
  segText: { fontFamily: F.m, fontSize: 13, color: C.inkMuted },
  segTextActive: { color: C.onDark },

  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontFamily: F.m, fontSize: 11, lineHeight: 14 },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: F.s },
  tile: { borderRadius: R.inner - 2, alignItems: 'center', justifyContent: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', gap: SP.m, paddingVertical: SP.m, minHeight: 56 },
  rowLine: { borderBottomWidth: 1, borderColor: C.line },
  rowTitle: { ...TYPE.bodyStrong, color: C.ink } as TextStyle,
  rowSub: { ...TYPE.small, color: C.inkMuted, marginTop: 2 } as TextStyle,

  stat: { flex: 1, minWidth: 0, minHeight: 150, justifyContent: 'space-between', gap: SP.s },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SP.s },
  statLabel: { ...TYPE.h3, color: C.ink, flex: 1 } as TextStyle,
  statValue: { ...TYPE.display, color: C.ink } as TextStyle,
  statCompact: { minHeight: 120, padding: SP.l },
  statValueCompact: { fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  statNote: { ...TYPE.small, color: C.inkMuted } as TextStyle,

  empty: { alignItems: 'center', gap: SP.s, paddingVertical: SP.xxl, paddingHorizontal: SP.l },
  emptyTitle: { ...TYPE.h3, color: C.ink, textAlign: 'center', marginTop: 4 } as TextStyle,
  emptyText: { ...TYPE.body, color: C.inkMuted, textAlign: 'center', maxWidth: 360 } as TextStyle,

  fieldLabel: { ...TYPE.label, color: C.ink } as TextStyle,
  input: {
    ...TYPE.body,
    color: C.ink,
    minHeight: 46,
    paddingHorizontal: SP.l,
    paddingVertical: 10,
    borderRadius: R.inner,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.sunken,
  } as TextStyle,
  inputMulti: { minHeight: 96, textAlignVertical: 'top' },
  inputFocus: { borderColor: C.g700, backgroundColor: C.card },
  inputError: { borderColor: C.dangerFg },
  fieldError: { ...TYPE.small, color: C.dangerFg } as TextStyle,
  fieldHint: { ...TYPE.small, color: C.inkMuted } as TextStyle,
});
