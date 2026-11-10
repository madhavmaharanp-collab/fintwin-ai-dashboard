import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFinance } from '@/context/FinanceContext';
import { formatMoney, getSummary, sipValue } from '@/lib/finance';
import { Heading, Icon, LineChart, Panel, Screen, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

export default function SimulatorScreen() {
  const colors = useColors();
  const { data, activeSheet } = useFinance();
  const summary = getSummary(data);
  const [monthly, setMonthly] = useState(Math.max(1000, Math.round(Math.max(0, summary.monthlySurplus) * 0.2 / 1000) * 1000));
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);
  const result = sipValue(monthly, rate, years);
  const points = Array.from({ length: 6 }, (_, i) => ({ label: `${Math.round(years * i / 5)}y`, value: sipValue(monthly, rate, Math.max(1, Math.round(years * i / 5))) * (i === 0 ? 0 : 1) }));
  const control = (label: string, value: string, minus: () => void, plus: () => void) => <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 }}>
    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{label}</Text>
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      <Pressable accessibilityRole="button" onPress={minus} hitSlop={8}><Icon name="minus-circle" color={colors.primary} size={22} /></Pressable>
      <Text style={{ color: colors.foreground, minWidth: 62, textAlign: 'center', fontWeight: '700' }}>{value}</Text>
      <Pressable accessibilityRole="button" onPress={plus} hitSlop={8}><Icon name="plus-circle" color={colors.primary} size={22} /></Pressable>
    </View>
  </View>;
  return <Screen>
    <Heading eyebrow="Explore a possibility" title="SIP simulator" subtitle="See how regular monthly contributions might accumulate over time." />
    <Panel dark style={{ gap: 7 }}>
      <Text style={{ color: colors.primaryForeground, opacity: 0.72, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>PROJECTED VALUE</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.primaryForeground, fontSize: 31, fontWeight: '700' }}>{formatMoney(result, activeSheet.currency)}</Text>
      <Text style={{ color: colors.primaryForeground, opacity: 0.7, fontSize: 12 }}>Contributions total {formatMoney(monthly * years * 12, activeSheet.currency)}</Text>
    </Panel>
    <Panel style={{ gap: 13 }}>
      <SectionTitle title="Adjust your scenario" />
      {control('Monthly contribution', formatMoney(monthly, activeSheet.currency), () => setMonthly(Math.max(0, monthly - 1000)), () => setMonthly(monthly + 1000))}
      {control('Assumed annual return', `${rate}%`, () => setRate(Math.max(0, rate - 1)), () => setRate(Math.min(20, rate + 1)))}
      {control('Time horizon', `${years} years`, () => setYears(Math.max(1, years - 1)), () => setYears(Math.min(40, years + 1)))}
    </Panel>
    <Panel><SectionTitle title="Illustrative growth" /><LineChart points={points} /></Panel>
    <Panel style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}><Icon name="info" color={colors.mutedForeground} size={17} /><Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, flex: 1 }}>This mathematical illustration assumes a steady return compounded monthly. Actual investments can lose value; fees, taxes, and inflation are not included. It is not a forecast or investment recommendation.</Text></Panel>
  </Screen>;
}
