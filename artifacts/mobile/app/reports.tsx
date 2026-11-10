import React from 'react';
import { Share, Text, View } from 'react-native';
import { useFinance } from '@/context/FinanceContext';
import { formatMoney, getSixMonthTrend, getMonthlySpend, getSummary } from '@/lib/finance';
import { Heading, LineChart, Panel, PrimaryButton, Screen, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

export default function ReportsScreen() {
  const colors = useColors();
  const { data, activeSheet, goals } = useFinance();
  const summary = getSummary(data);
  const trend = getSixMonthTrend(data);
  const spend = getMonthlySpend(data);
  const categories = [...spend.reduce((map, item) => map.set(item.category, (map.get(item.category) ?? 0) + item.amount), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]);
  const shareReport = () => Share.share({ message: `FinTwin monthly snapshot\nIncome: ${formatMoney(summary.monthlyIncome, activeSheet.currency)}\nExpenses: ${formatMoney(summary.monthlyExpenses, activeSheet.currency)}\nSurplus: ${formatMoney(summary.monthlySurplus, activeSheet.currency)}\nSavings rate: ${Math.round(summary.savingsRate)}%\nNet worth estimate: ${formatMoney(summary.netWorth, activeSheet.currency)}\n\nFor planning only; not financial advice.` });
  return <Screen>
    <Heading eyebrow="Your numbers, in context" title="Financial reports" subtitle="A monthly view of cash flow, spending, and goals." />
    <View style={{ flexDirection: 'row', gap: 9, flexWrap: 'wrap' }}>
      {[['Income', summary.monthlyIncome], ['Spending', summary.monthlyExpenses], ['Surplus', summary.monthlySurplus]].map(([label, value]) => <Panel key={label as string} style={{ flex: 1, minWidth: 145, gap: 7 }}><Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.foreground, fontSize: 17, fontWeight: '700' }}>{formatMoney(value as number, activeSheet.currency)}</Text></Panel>)}
    </View>
    <Panel><SectionTitle title="Cash-flow trend" /><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Monthly spending · six months</Text><LineChart points={trend} /></Panel>
    <Panel style={{ gap: 13 }}>
      <SectionTitle title="Where this month went" />
      {categories.length ? categories.map(([name, value]) => {
        const max = Math.max(1, categories[0][1]);
        return <View key={name} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{name}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{formatMoney(value, activeSheet.currency)}</Text></View>
          <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 7 }}><View style={{ width: `${(value / max) * 100}%`, height: 6, backgroundColor: colors.primary, borderRadius: 7 }} /></View>
        </View>;
      }) : <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Record expenses to see a category breakdown.</Text>}
    </Panel>
    <Panel style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View style={{ gap: 4 }}><Text style={{ color: colors.foreground, fontWeight: '700' }}>Goal progress</Text><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{goals.length} active {goals.length === 1 ? 'goal' : 'goals'}</Text></View><Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>{goals.length ? `${Math.round(goals.reduce((sum, goal) => sum + (goal.targetAmount ? goal.currentAmount / goal.targetAmount : 0), 0) / goals.length * 100)}%` : '—'}</Text></Panel>
    <PrimaryButton title="Share this summary" icon="share" onPress={shareReport} />
    <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: 'center', lineHeight: 17 }}>Reports use the records in this finance sheet. Estimates may not include unrecorded activity.</Text>
  </Screen>;
}
