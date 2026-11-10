import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useFinance } from '@/context/FinanceContext';
import { formatMoney, getSixMonthTrend, getSummary } from '@/lib/finance';
import { EmptyState, formatDate, Heading, Icon, LineChart, Panel, PrimaryButton, Screen, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

export default function DashboardScreen() {
  const colors = useColors();
  const { user } = useUser();
  const { data, ready, storageError, activeSheet, transactions, goals } = useFinance();
  if (!ready) return <Screen><Text style={{ color: colors.mutedForeground }}>Loading your finances…</Text></Screen>;
  const summary = getSummary(data);
  const trend = getSixMonthTrend(data);
  const recent = transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const firstName = user?.firstName || 'there';
  return <Screen withTabs>
    <Heading eyebrow={`${activeSheet.name} · ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`} title={`Good to see you, ${firstName}`} right={<Pressable accessibilityRole="button" onPress={() => router.push('/settings')} hitSlop={10}><Icon name="settings" size={20} color={colors.mutedForeground} /></Pressable>} />
    {storageError ? <Panel style={{ borderColor: colors.destructive }}><Text style={{ color: colors.destructive, fontSize: 13 }}>{storageError}</Text></Panel> : null}
    <Panel dark style={{ padding: 21, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.primaryForeground, opacity: 0.72, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>ESTIMATED NET WORTH</Text>
        <Icon name="activity" color={colors.accent} size={18} />
      </View>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.primaryForeground, fontSize: 34, fontWeight: '700', letterSpacing: -1 }}>
        {formatMoney(summary.netWorth, activeSheet.currency)}
      </Text>
      <View style={{ flexDirection: 'row', gap: 18 }}>
        <View><Text style={{ color: colors.primaryForeground, opacity: 0.62, fontSize: 10 }}>INCOME</Text><Text style={{ color: colors.primaryForeground, fontWeight: '600', marginTop: 4 }}>{formatMoney(summary.monthlyIncome, activeSheet.currency)}</Text></View>
        <View><Text style={{ color: colors.primaryForeground, opacity: 0.62, fontSize: 10 }}>SPENDING</Text><Text style={{ color: colors.primaryForeground, fontWeight: '600', marginTop: 4 }}>{formatMoney(summary.monthlyExpenses, activeSheet.currency)}</Text></View>
        <View><Text style={{ color: colors.primaryForeground, opacity: 0.62, fontSize: 10 }}>LEFT OVER</Text><Text style={{ color: colors.accent, fontWeight: '700', marginTop: 4 }}>{formatMoney(summary.monthlySurplus, activeSheet.currency)}</Text></View>
      </View>
    </Panel>
    {summary.monthlyIncome === 0 ? <Panel><EmptyState title="Start with one entry" description="Add income and spending to bring your dashboard, twin, and charts to life." icon="plus-circle" /><PrimaryButton title="Add a transaction" onPress={() => router.push('/(tabs)/ledger')} icon="plus" /></Panel> : null}
    <Panel>
      <SectionTitle title="Spending trend" action="Full report" onPress={() => router.push('/reports')} />
      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Monthly expenses · last 6 months</Text>
      <LineChart points={trend} />
    </Panel>
    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      <Panel style={{ flex: 1, minWidth: 145 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>SAVINGS RATE</Text>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '700' }}>{Math.round(summary.savingsRate)}%</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>of this month’s income</Text>
      </Panel>
      <Panel style={{ flex: 1, minWidth: 145 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>FINANCIAL HEALTH</Text>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '700' }}>{summary.healthScore || '—'}<Text style={{ fontSize: 12, fontWeight: '500' }}>{summary.healthScore ? ' / 100' : ''}</Text></Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{summary.emergencyMonths.toFixed(1)} months of expenses saved</Text>
      </Panel>
    </View>
    <View style={{ gap: 12 }}>
      <SectionTitle title="Your goals" action="See all" onPress={() => router.push('/(tabs)/goals')} />
      {goals.length ? goals.slice(0, 2).map((goal) => <Pressable key={goal.id} onPress={() => router.push('/(tabs)/goals')}><Panel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}><Text style={{ color: colors.foreground, fontWeight: '700', flex: 1 }}>{goal.name}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{formatMoney(goal.currentAmount, activeSheet.currency)} / {formatMoney(goal.targetAmount, activeSheet.currency)}</Text></View>
        <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 8 }}><View style={{ width: `${Math.min(100, (goal.currentAmount / Math.max(1, goal.targetAmount)) * 100)}%`, height: 6, backgroundColor: colors.primary, borderRadius: 8 }} /></View>
      </Panel></Pressable>) : <Panel><EmptyState title="No goals yet" description="Turn a future plan into a goal with a target and a date." icon="target" /><PrimaryButton title="Create a goal" onPress={() => router.push('/(tabs)/goals')} icon="plus" /></Panel>}
    </View>
    <View style={{ gap: 12 }}>
      <SectionTitle title="Recent activity" action="Open ledger" onPress={() => router.push('/(tabs)/ledger')} />
      {recent.length ? recent.map((item) => <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 }}>
        <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}><Icon name={item.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'} color={colors.primary} size={17} /></View>
        <View style={{ flex: 1, gap: 3 }}><Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{item.description}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{item.category} · {formatDate(item.date)}</Text></View>
        <Text style={{ color: item.type === 'income' ? colors.primary : colors.foreground, fontWeight: '700', fontSize: 13 }}>{item.type === 'expense' ? '−' : '+'}{formatMoney(item.amount, activeSheet.currency)}</Text>
      </View>) : <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Your transactions will appear here.</Text>}
    </View>
    <PrimaryButton title="Ask FinTwin AI" icon="zap" onPress={() => router.push('/coach')} />
  </Screen>;
}
