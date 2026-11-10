import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import { formatMoney, getSixMonthTrend, getSummary } from '@/lib/finance';
import { Heading, Icon, LineChart, Panel, Pill, PrimaryButton, ProgressBar, Screen, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

export default function FinancialTwinScreen() {
  const colors = useColors();
  const { data, activeSheet, budgets } = useFinance();
  const [monthlySave, setMonthlySave] = useState(5000);
  const summary = getSummary(data);
  const trend = getSixMonthTrend(data);
  const categories = [...summary.byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSpend = Math.max(1, ...categories.map((entry) => entry[1]));
  const future = Array.from({ length: 6 }, (_, index) => ({
    label: `${index}y`,
    value: Math.max(0, summary.netWorth) + monthlySave * 12 * index,
  }));
  return <Screen withTabs>
    <Heading eyebrow="Your financial digital twin" title="Financial twin" subtitle="A living model of your cash flow, resilience, and next steps." />
    <Panel dark style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>Financial health</Text><Icon name="shield" color={colors.accent} /></View>
      <Text style={{ color: colors.primaryForeground, fontSize: 36, fontWeight: '700' }}>{summary.healthScore || '—'}<Text style={{ fontSize: 15, opacity: 0.72 }}> / 100</Text></Text>
      <ProgressBar value={summary.healthScore} color={colors.accent} />
      <Text style={{ color: colors.primaryForeground, opacity: 0.76, fontSize: 12, lineHeight: 18 }}>{summary.monthlyIncome ? `${summary.emergencyMonths.toFixed(1)} months of expenses covered; ${Math.round(summary.savingsRate)}% savings rate.` : 'Add your monthly income and expenses to calculate a personal resilience score.'}</Text>
    </Panel>
    <View style={{ flexDirection: 'row', gap: 9, flexWrap: 'wrap' }}>
      <Panel style={{ flex: 1, minWidth: 145 }}><Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>NET WORTH</Text><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>{formatMoney(summary.netWorth, activeSheet.currency)}</Text></Panel>
      <Panel style={{ flex: 1, minWidth: 145 }}><Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>DEBT BALANCE</Text><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>{formatMoney(summary.debtBalance, activeSheet.currency)}</Text></Panel>
    </View>
    <Panel>
      <SectionTitle title="Spending by category" action="Reports" onPress={() => router.push('/reports')} />
      {categories.length ? categories.map(([category, amount]) => {
        const budget = budgets.find((item) => item.category === category)?.monthlyLimit;
        return <View key={category} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{category}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{formatMoney(amount, activeSheet.currency)}{budget ? ` / ${formatMoney(budget, activeSheet.currency)}` : ''}</Text></View>
          <ProgressBar value={budget ? (amount / budget) * 100 : (amount / maxSpend) * 100} color={budget && amount > budget ? colors.destructive : colors.primary} />
        </View>;
      }) : <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Your spending categories appear when you record expenses.</Text>}
    </Panel>
    <Panel>
      <SectionTitle title="Your next 5 years" />
      <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>Explore a simple savings-only scenario. It excludes investment returns, inflation, and future changes in income or spending.</Text>
      <LineChart points={future} color={colors.primary} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" onPress={() => setMonthlySave(Math.max(0, monthlySave - 1000))}><Icon name="minus-circle" color={colors.primary} size={26} /></Pressable>
        <View style={{ alignItems: 'center', gap: 3 }}><Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>MONTHLY SAVING SCENARIO</Text><Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>{formatMoney(monthlySave, activeSheet.currency)}</Text></View>
        <Pressable accessibilityRole="button" onPress={() => setMonthlySave(monthlySave + 1000)}><Icon name="plus-circle" color={colors.primary} size={26} /></Pressable>
      </View>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: 'center' }}>Five-year estimate: {formatMoney(Math.max(0, summary.netWorth) + monthlySave * 60, activeSheet.currency)}</Text>
    </Panel>
    <Panel>
      <SectionTitle title="Recent cash-flow pattern" />
      <LineChart points={trend} />
    </Panel>
    <PrimaryButton title="Ask AI to read this picture" icon="zap" onPress={() => router.push('/coach')} />
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pill label="SIP simulator" onPress={() => router.push('/simulator')} />
      <Pill label="Can I afford it?" onPress={() => router.push('/affordability')} />
    </View>
  </Screen>;
}
