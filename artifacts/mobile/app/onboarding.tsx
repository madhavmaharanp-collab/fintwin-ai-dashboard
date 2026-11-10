import React, { useState } from 'react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useFinance, type CurrencyCode } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { PrimaryButton, Pill } from '@/components/FinanceUi';

const currencies: CurrencyCode[] = ['NPR', 'USD', 'INR', 'GBP', 'EUR', 'AUD', 'CAD'];
export default function OnboardingScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const { data, ready, completeOnboarding } = useFinance();
  const [currency, setCurrency] = useState<CurrencyCode>('NPR');
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [savings, setSavings] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [error, setError] = useState('');
  if (!isSignedIn) return <Redirect href="/" />;
  if (ready && data.onboardingComplete) return <Redirect href="/(tabs)" />;
  const fieldStyle = { minHeight: 50, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 };
  const labelStyle = { color: colors.foreground, fontSize: 13, fontWeight: '600' as const };
  const finish = () => {
    const monthlyIncome = Number(income);
    const monthlyExpenses = Number(expenses || 0);
    const currentSavings = Number(savings || 0);
    const target = Number(goalTarget || 0);
    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0 || [monthlyExpenses, currentSavings, target].some((value) => !Number.isFinite(value) || value < 0)) {
      setError('Enter a monthly income and use non-negative amounts for the other fields.');
      return;
    }
    completeOnboarding({ currency, income: monthlyIncome, expenses: monthlyExpenses, savings: currentSavings, goalName, goalTarget: target });
    router.replace('/(tabs)');
  };
  return <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 67 }}>
    <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 22, paddingBottom: 36, gap: 18 }} bottomOffset={60} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 11, letterSpacing: 1.2, fontWeight: '700' }}>YOUR STARTING POINT</Text>
        <Text style={{ color: colors.foreground, fontSize: 29, fontWeight: '700', letterSpacing: -0.6 }}>Build your baseline</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 21 }}>A few numbers make your dashboard, twin, and projections meaningful. You can change them any time.</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Text style={labelStyle}>Display currency</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{currencies.map((item) => <Pill key={item} label={item} selected={currency === item} onPress={() => setCurrency(item)} />)}</View>
      </View>
      {[
        ['Monthly take-home income', income, setIncome, '0'],
        ['Monthly essential spending', expenses, setExpenses, 'Optional'],
        ['Current savings and investments', savings, setSavings, 'Optional'],
      ].map(([label, value, setter, placeholder]) => (
        <View key={label as string} style={{ gap: 8 }}>
          <Text style={labelStyle}>{label as string}</Text>
          <TextInput testID={`onboarding-${String(label).slice(0, 5)}`} value={value as string} onChangeText={setter as (value: string) => void} keyboardType="decimal-pad" placeholder={placeholder as string} placeholderTextColor={colors.mutedForeground} style={fieldStyle} />
        </View>
      ))}
      <View style={{ gap: 8 }}>
        <Text style={labelStyle}>First savings goal (optional)</Text>
        <TextInput value={goalName} onChangeText={setGoalName} placeholder="For example, emergency fund" placeholderTextColor={colors.mutedForeground} style={fieldStyle} />
        <TextInput value={goalTarget} onChangeText={setGoalTarget} keyboardType="decimal-pad" placeholder="Target amount" placeholderTextColor={colors.mutedForeground} style={fieldStyle} />
      </View>
      {error ? <Text style={{ color: colors.destructive, fontSize: 13 }}>{error}</Text> : null}
      <PrimaryButton title="Open my dashboard" onPress={finish} icon="arrow-right" testID="onboarding-complete" />
      <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, textAlign: 'center' }}>
        Your information is saved locally on this device. This is a planning tool, not financial advice.
      </Text>
    </KeyboardAwareScrollViewCompat>
  </View>;
}
