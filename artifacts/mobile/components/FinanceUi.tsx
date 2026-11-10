import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({ name, size = 18, color }: { name: IconName; size?: number; color?: string }) {
  const colors = useColors();
  return <Feather name={name} size={size} color={color ?? colors.foreground} />;
}
export function Screen({ children, withTabs = false, scroll = true, contentStyle }: { children: React.ReactNode; withTabs?: boolean; scroll?: boolean; contentStyle?: object }) {
  const colors = useColors();
  const web = Platform.OS === 'web';
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.background, paddingTop: web ? 67 : 0 }]}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: web ? (withTabs ? 120 : 34) : 24 }, contentStyle]}>{children}</ScrollView> : children}
    </SafeAreaView>
  );
}
export function Heading({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.heading}>
    <View style={{ flex: 1, gap: 4 }}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>;
}
export function Panel({ children, style, dark = false }: { children: React.ReactNode; style?: object; dark?: boolean }) {
  const colors = useColors();
  return <View style={[styles.panel, { backgroundColor: dark ? colors.primary : colors.card, borderColor: dark ? colors.primary : colors.border }, style]}>{children}</View>;
}
export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}>
    <Text style={[styles.sectionText, { color: colors.foreground }]}>{title}</Text>
    {action ? <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}><Text style={[styles.action, { color: colors.primary }]}>{action}</Text></Pressable> : null}
  </View>;
}
export function PrimaryButton({ title, onPress, icon, disabled = false, testID }: { title: string; onPress: () => void; icon?: IconName; disabled?: boolean; testID?: string }) {
  const colors = useColors();
  return <Pressable testID={testID} accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, { backgroundColor: disabled ? colors.muted : colors.primary, opacity: pressed ? 0.85 : 1 }, disabled && { opacity: 0.6 }]}>
    {icon ? <Feather name={icon} size={17} color={colors.primaryForeground} /> : null}
    <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{title}</Text>
  </Pressable>;
}
export function OutlineButton({ title, onPress, icon, testID }: { title: string; onPress: () => void; icon?: IconName; testID?: string }) {
  const colors = useColors();
  return <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.outlineButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.75 : 1 }]}>
    {icon ? <Feather name={icon} size={16} color={colors.primary} /> : null}
    <Text style={[styles.outlineText, { color: colors.foreground }]}>{title}</Text>
  </Pressable>;
}
export function Pill({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} style={[styles.pill, { backgroundColor: selected ? colors.primary : colors.secondary, borderColor: selected ? colors.primary : colors.border }]}>
    <Text style={{ color: selected ? colors.primaryForeground : colors.secondaryForeground, fontSize: 12, fontWeight: '600' }}>{label}</Text>
  </Pressable>;
}
export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(value, 100))}%`, backgroundColor: color ?? colors.primary }]} /></View>;
}
export function Metric({ label, value, caption, icon }: { label: string; value: string; caption?: string; icon?: IconName }) {
  const colors = useColors();
  return <Panel style={{ flex: 1, minWidth: 145, gap: 10 }}>
    <View style={styles.metricLabel}>{icon ? <Icon name={icon} size={15} color={colors.mutedForeground} /> : null}<Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{label}</Text></View>
    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
    {caption ? <Text style={[styles.caption, { color: colors.mutedForeground }]}>{caption}</Text> : null}
  </Panel>;
}
export function LineChart({ points, height = 138, color }: { points: { label: string; value: number }[]; height?: number; color?: string }) {
  const colors = useColors();
  const stroke = color ?? colors.primary;
  const width = 320;
  const plotTop = 12;
  const plotBottom = height - 24;
  const values = points.map((point) => Math.max(0, point.value));
  const max = Math.max(1, ...values);
  const coords = values.map((value, index) => ({
    x: points.length <= 1 ? width / 2 : 8 + (index * (width - 16)) / (points.length - 1),
    y: plotBottom - (value / max) * (plotBottom - plotTop),
  }));
  const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  return <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
    <Path d={`M 0 ${plotBottom} L ${width} ${plotBottom}`} stroke={colors.border} strokeWidth="1" />
    {coords.length > 1 ? <Path d={path} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}
    {coords.map((point, index) => <Circle key={`${points[index]?.label}-${index}`} cx={point.x} cy={point.y} r="3.5" fill={stroke} />)}
    {points.map((point, index) => <SvgText key={`${point.label}-label`} x={coords[index]?.x ?? 0} y={height - 4} fontSize="10" fill={colors.mutedForeground} textAnchor="middle">{point.label}</SvgText>)}
  </Svg>;
}
export function EmptyState({ title, description, icon = 'inbox' }: { title: string; description: string; icon?: IconName }) {
  const colors = useColors();
  return <View style={styles.empty}>
    <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={22} color={colors.primary} /></View>
    <Text style={[styles.sectionText, { color: colors.foreground }]}>{title}</Text>
    <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign: 'center' }]}>{description}</Text>
  </View>;
}
export function LoadingState({ label = 'Loading your finances' }: { label?: string }) {
  const colors = useColors();
  return <View style={styles.loading}><Text style={{ color: colors.mutedForeground }}>{label}…</Text></View>;
}
export function formatDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  title: { fontSize: 27, letterSpacing: -0.5, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 19 },
  panel: { borderWidth: 1, borderRadius: 22, padding: 17, gap: 12 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionText: { fontSize: 16, fontWeight: '700' },
  action: { fontSize: 12, fontWeight: '700' },
  button: { minHeight: 50, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  outlineButton: { minHeight: 46, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  outlineText: { fontSize: 13, fontWeight: '600' },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  progressTrack: { height: 7, borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 10 },
  metricLabel: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  caption: { fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 18, gap: 9 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
