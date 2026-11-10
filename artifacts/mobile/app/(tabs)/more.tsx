import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useClerk, useUser } from '@clerk/expo';
import { useFinance } from '@/context/FinanceContext';
import { formatMoney, getSummary } from '@/lib/finance';
import { Heading, Icon, Panel, Screen, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

const tools = [
  { route: '/coach', title: 'FinTwin AI', detail: 'Ask about your plan and build a chart', icon: 'zap' as const },
  { route: '/simulator', title: 'SIP & scenario simulator', detail: 'Project monthly savings over time', icon: 'trending-up' as const },
  { route: '/reports', title: 'Financial reports', detail: 'Review cash flow and category trends', icon: 'bar-chart-2' as const },
  { route: '/affordability', title: 'Can I afford it?', detail: 'Check the impact of a planned purchase', icon: 'shopping-bag' as const },
  { route: '/settings', title: 'Sheets, budgets & settings', detail: 'Switch workspaces and manage limits', icon: 'settings' as const },
];
export default function MoreScreen() {
  const colors = useColors();
  const { data, activeSheet, selectSheet } = useFinance();
  const { user } = useUser();
  const clerk = useClerk();
  const summary = getSummary(data);
  return <Screen withTabs>
    <Heading eyebrow={user?.primaryEmailAddress?.emailAddress ?? 'Your workspace'} title="More" subtitle="Tools and settings for your financial picture." />
    <Panel dark style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="layers" color={colors.accentForeground} size={21} /></View>
      <View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 15 }}>{activeSheet.name}</Text><Text style={{ color: colors.primaryForeground, opacity: 0.72, fontSize: 12 }}>{formatMoney(summary.netWorth, activeSheet.currency)} estimated net worth</Text></View>
      <Pressable onPress={() => router.push('/settings')} accessibilityRole="button"><Icon name="chevron-right" color={colors.primaryForeground} /></Pressable>
    </Panel>
    <SectionTitle title="Finance tools" />
    <View style={{ gap: 9 }}>{tools.map((tool) => <Pressable key={tool.route} accessibilityRole="button" testID={`tool-${tool.route.slice(1)}`} onPress={() => router.push(tool.route as never)}>
      <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15 }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}><Icon name={tool.icon} color={colors.primary} /></View>
        <View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>{tool.title}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{tool.detail}</Text></View>
        <Icon name="chevron-right" size={17} color={colors.mutedForeground} />
      </Panel>
    </Pressable>)}</View>
    <Panel style={{ gap: 10 }}>
      <SectionTitle title="Your finance sheets" action="Manage" onPress={() => router.push('/settings')} />
      {data.sheets.map((sheet) => <Pressable key={sheet.id} onPress={() => selectSheet(sheet.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><Icon name={sheet.id === activeSheet.id ? 'check-circle' : 'circle'} color={sheet.id === activeSheet.id ? colors.primary : colors.mutedForeground} size={17} /><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{sheet.name}</Text></View>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{sheet.type}</Text>
      </Pressable>)}
    </Panel>
    <Pressable onPress={async () => { await clerk.signOut(); router.replace('/'); }} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 12 }} accessibilityRole="button" testID="sign-out">
      <Icon name="log-out" color={colors.destructive} size={16} /><Text style={{ color: colors.destructive, fontWeight: '700', fontSize: 13 }}>Sign out</Text>
    </Pressable>
    <Text style={{ color: colors.mutedForeground, textAlign: 'center', fontSize: 11, lineHeight: 17 }}>FinTwin is an educational planning tool, not financial advice. Local finance data is saved on this device.</Text>
  </Screen>;
}
