import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useFinance } from '@/context/FinanceContext';
import { formatMoney, getSummary } from '@/lib/finance';
import { Heading, Icon, Panel, PrimaryButton, Screen } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

export default function AffordabilityScreen() {
  const colors = useColors();
  const { data, activeSheet } = useFinance();
  const summary = getSummary(data);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [checked, setChecked] = useState(false);
  const price = Number(amount);
  const emergencyAfter = summary.monthlyExpenses > 0 ? Math.max(0, (summary.assets - (Number.isFinite(price) ? price : 0)) / summary.monthlyExpenses) : 0;
  const affordable = Number.isFinite(price) && price > 0 && summary.monthlySurplus > 0 && price <= summary.monthlySurplus * 0.5 && emergencyAfter >= 3;
  const caution = Number.isFinite(price) && price > 0 && summary.monthlySurplus > 0 && price <= summary.assets * 0.2 && emergencyAfter >= 1;
  const calculate = () => setChecked(true);
  const fieldStyle = { minHeight: 50, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, color: colors.foreground, paddingHorizontal: 14, fontSize: 14 };
  return <Screen>
    <Heading eyebrow="A quick reality check" title="Can I afford it?" subtitle="Estimate how a planned purchase could affect your monthly room and savings buffer." />
    <Panel style={{ gap: 13 }}>
      <TextInput testID="afford-item" value={item} onChangeText={setItem} placeholder="What are you considering?" placeholderTextColor={colors.mutedForeground} style={fieldStyle} />
      <TextInput testID="afford-amount" value={amount} onChangeText={(value) => { setAmount(value); setChecked(false); }} keyboardType="decimal-pad" placeholder={`Price (${activeSheet.currency})`} placeholderTextColor={colors.mutedForeground} style={fieldStyle} />
      <PrimaryButton title="Check impact" icon="activity" onPress={calculate} disabled={!Number.isFinite(price) || price <= 0} testID="afford-check" />
    </Panel>
    {checked ? <Panel style={{ borderColor: affordable ? colors.primary : caution ? colors.accent : colors.destructive, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><Icon name={affordable ? 'check-circle' : caution ? 'alert-circle' : 'x-circle'} color={affordable ? colors.primary : caution ? colors.foreground : colors.destructive} /><Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{affordable ? 'Fits your current picture' : caution ? 'Consider the trade-off' : 'This could strain your plan'}</Text></View>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20 }}>{item.trim() || 'This purchase'} costs {formatMoney(price, activeSheet.currency)}. Your estimated monthly surplus is {formatMoney(summary.monthlySurplus, activeSheet.currency)}, with about {emergencyAfter.toFixed(1)} months of expenses left in savings after purchase.</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>This check uses the balances and recurring transactions you entered. It does not account for every future expense.</Text>
    </Panel> : null}
    <Panel>
      <Text style={{ color: colors.foreground, fontWeight: '700' }}>Your current baseline</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Monthly surplus</Text><Text style={{ color: colors.foreground, fontWeight: '600' }}>{formatMoney(summary.monthlySurplus, activeSheet.currency)}</Text></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Savings buffer</Text><Text style={{ color: colors.foreground, fontWeight: '600' }}>{formatMoney(summary.assets, activeSheet.currency)}</Text></View>
    </Panel>
  </Screen>;
}
