import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useFinance, type CurrencyCode, type FinanceSheet } from '@/context/FinanceContext';
import { formatMoney, getMonthlySpend } from '@/lib/finance';
import { Heading, Icon, Panel, Pill, PrimaryButton, Screen, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

const currencies: CurrencyCode[] = ['NPR', 'USD', 'INR', 'GBP', 'EUR', 'AUD', 'CAD'];
const categories = ['Housing', 'Food', 'Transport', 'Bills', 'Health', 'Shopping', 'Essentials', 'Other'];
export default function SettingsScreen() {
  const colors = useColors();
  const { data, activeSheet, budgets, selectSheet, addSheet, renameSheet, removeSheet, setBudget, setCurrency, setBalances } = useFinance();
  const [sheetModal, setSheetModal] = useState(false);
  const [editingSheet, setEditingSheet] = useState<FinanceSheet | null>(null);
  const [sheetName, setSheetName] = useState('');
  const [sheetType, setSheetType] = useState<FinanceSheet['type']>('personal');
  const [currency, setCurrencyChoice] = useState<CurrencyCode>(activeSheet.currency);
  const [budgetModal, setBudgetModal] = useState(false);
  const [balanceModal, setBalanceModal] = useState(false);
  const balance = data.balances?.[activeSheet.id] ?? { savings: data.openingBalance ?? 0, debt: data.debtBalance ?? 0 };
  const [savingsAmount, setSavingsAmount] = useState(String(balance.savings));
  const [debtAmount, setDebtAmount] = useState(String(balance.debt));
  const [budgetCategory, setBudgetCategory] = useState(categories[0]);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [error, setError] = useState('');
  const spend = getMonthlySpend(data);
  const spentByCategory = new Map<string, number>();
  spend.forEach((item) => spentByCategory.set(item.category, (spentByCategory.get(item.category) ?? 0) + item.amount));
  const inputStyle = { minHeight: 48, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, color: colors.foreground, paddingHorizontal: 13, fontSize: 14 };
  const openNewSheet = () => { setEditingSheet(null); setSheetName(''); setSheetType('personal'); setCurrencyChoice(activeSheet.currency); setSheetModal(true); };
  const openEditSheet = (sheet: FinanceSheet) => { setEditingSheet(sheet); setSheetName(sheet.name); setSheetType(sheet.type); setCurrencyChoice(sheet.currency); setSheetModal(true); };
  const saveSheet = () => {
    if (!sheetName.trim()) { setError('Enter a name for this sheet.'); return; }
    if (editingSheet) { renameSheet(editingSheet.id, sheetName); }
    else addSheet(sheetName, sheetType, currency);
    setSheetModal(false); setError('');
  };
  const askDelete = (sheet: FinanceSheet) => {
    if (data.sheets.length <= 1) { Alert.alert('Keep one finance sheet', 'FinTwin needs at least one sheet.'); return; }
    Alert.alert('Delete this sheet?', `“${sheet.name}” and its transactions, goals, and budgets will be removed from this device.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeSheet(sheet.id) }]);
  };
  const openBudget = (category: string, value = 0) => { setBudgetCategory(category); setBudgetAmount(value ? String(value) : ''); setError(''); setBudgetModal(true); };
  const saveBudget = () => {
    const value = Number(budgetAmount);
    if (!Number.isFinite(value) || value < 0) { setError('Enter a valid limit, or zero to remove it.'); return; }
    setBudget(budgetCategory, value); setBudgetModal(false);
  };
  const saveBalances = () => {
    const savings = Number(savingsAmount);
    const debt = Number(debtAmount);
    if (![savings, debt].every((value) => Number.isFinite(value) && value >= 0)) { setError('Enter valid non-negative balances.'); return; }
    setBalances(savings, debt);
    setBalanceModal(false);
  };
  return <>
    <Screen>
      <Heading eyebrow="Manage your workspace" title="Settings" subtitle="Your financial records are saved on this device." />
      <Panel style={{ gap: 13 }}>
        <SectionTitle title="Finance sheets" action="Add sheet" onPress={openNewSheet} />
        {data.sheets.map((sheet) => <View key={sheet.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 5 }}>
          <Pressable accessibilityRole="button" onPress={() => selectSheet(sheet.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
            <Icon name={sheet.id === activeSheet.id ? 'check-circle' : 'circle'} color={sheet.id === activeSheet.id ? colors.primary : colors.mutedForeground} size={18} />
            <View style={{ gap: 3 }}><Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{sheet.name}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{sheet.type} · {sheet.currency}</Text></View>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => openEditSheet(sheet)} hitSlop={8}><Icon name="edit-2" color={colors.mutedForeground} size={16} /></Pressable>
          <Pressable accessibilityRole="button" onPress={() => askDelete(sheet)} hitSlop={8}><Icon name="trash-2" color={colors.destructive} size={16} /></Pressable>
        </View>)}
      </Panel>
      <Panel style={{ gap: 12 }}>
        <SectionTitle title="Monthly budgets" action="Set limit" onPress={() => openBudget(categories.find((category) => !budgets.some((item) => item.category === category)) ?? categories[0])} />
        {budgets.length ? budgets.map((budget) => {
          const spent = spentByCategory.get(budget.category) ?? 0;
          const ratio = budget.monthlyLimit > 0 ? Math.min(100, spent / budget.monthlyLimit * 100) : 0;
          return <Pressable key={budget.id} onPress={() => openBudget(budget.category, budget.monthlyLimit)} style={{ gap: 6, paddingVertical: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{budget.category}</Text><Text style={{ color: spent > budget.monthlyLimit ? colors.destructive : colors.mutedForeground, fontSize: 11 }}>{formatMoney(spent, activeSheet.currency)} / {formatMoney(budget.monthlyLimit, activeSheet.currency)}</Text></View>
            <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 8 }}><View style={{ width: `${ratio}%`, height: 6, backgroundColor: spent > budget.monthlyLimit ? colors.destructive : colors.primary, borderRadius: 8 }} /></View>
          </Pressable>;
        }) : <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>Set a category limit to see spending against your plan.</Text>}
      </Panel>
      <Panel style={{ gap: 10 }}>
        <SectionTitle title="Savings and debt" action="Edit balances" onPress={() => { setSavingsAmount(String(balance.savings)); setDebtAmount(String(balance.debt)); setError(''); setBalanceModal(true); }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Savings and investments</Text><Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 12 }}>{formatMoney(balance.savings, activeSheet.currency)}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Debt balance</Text><Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 12 }}>{formatMoney(balance.debt, activeSheet.currency)}</Text></View>
      </Panel>
      <Panel style={{ gap: 11 }}>
        <SectionTitle title="Display currency" />
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Changing currency changes how amounts are displayed; it does not convert saved values.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{currencies.map((item) => <Pill key={item} label={item} selected={activeSheet.currency === item} onPress={() => setCurrency(item)} />)}</View>
      </Panel>
      <Panel style={{ gap: 9 }}>
        <Text style={{ color: colors.foreground, fontWeight: '700' }}>Privacy and storage</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 19 }}>Transactions, goals, budgets, and sheets are saved locally on this device and are not synced between devices. FinTwin sends only the finance snapshot needed for the AI question you submit to OpenAI; if OpenAI is unavailable, the same snapshot may also be sent to Google AI as a fallback. Avoid including account numbers or other sensitive identifiers in chat.</Text>
      </Panel>
    </Screen>
    <Modal visible={sheetModal} transparent animationType="slide" onRequestClose={() => setSheetModal(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' }}><View style={{ maxHeight: '90%', backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
        <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 13 }} bottomOffset={50} keyboardShouldPersistTaps="handled">
          <Heading title={editingSheet ? 'Edit finance sheet' : 'New finance sheet'} right={<Pressable onPress={() => setSheetModal(false)}><Icon name="x" color={colors.mutedForeground} /></Pressable>} />
          <TextInput testID="sheet-name" value={sheetName} onChangeText={setSheetName} placeholder="Sheet name" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
          {!editingSheet ? <><Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>TYPE</Text><View style={{ flexDirection: 'row', gap: 7 }}>{(['personal', 'family', 'scenario'] as const).map((item) => <Pill key={item} label={item} selected={sheetType === item} onPress={() => setSheetType(item)} />)}</View></> : null}
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>CURRENCY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{currencies.map((item) => <Pill key={item} label={item} selected={currency === item} onPress={() => setCurrencyChoice(item)} />)}</View>
          {error ? <Text style={{ color: colors.destructive }}>{error}</Text> : null}
          <PrimaryButton title={editingSheet ? 'Save sheet' : 'Create sheet'} icon="check" onPress={saveSheet} testID="sheet-save" />
          {editingSheet ? <Pressable onPress={() => askDelete(editingSheet)}><Text style={{ color: colors.destructive, textAlign: 'center', padding: 8 }}>Delete sheet</Text></Pressable> : null}
        </KeyboardAwareScrollViewCompat>
      </View></View>
    </Modal>
    <Modal visible={budgetModal} transparent animationType="slide" onRequestClose={() => setBudgetModal(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' }}><View style={{ backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
        <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 13 }} bottomOffset={50} keyboardShouldPersistTaps="handled">
          <Heading title="Monthly category limit" right={<Pressable onPress={() => setBudgetModal(false)}><Icon name="x" color={colors.mutedForeground} /></Pressable>} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{categories.map((item) => <Pill key={item} label={item} selected={budgetCategory === item} onPress={() => setBudgetCategory(item)} />)}</View>
          <TextInput testID="budget-amount" value={budgetAmount} onChangeText={setBudgetAmount} keyboardType="decimal-pad" placeholder={`Limit (${activeSheet.currency})`} placeholderTextColor={colors.mutedForeground} style={inputStyle} />
          {error ? <Text style={{ color: colors.destructive }}>{error}</Text> : null}
          <PrimaryButton title="Save limit" icon="check" onPress={saveBudget} testID="budget-save" />
        </KeyboardAwareScrollViewCompat>
      </View></View>
    </Modal>
    <Modal visible={balanceModal} transparent animationType="slide" onRequestClose={() => setBalanceModal(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' }}><View style={{ backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
        <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 13 }} bottomOffset={50} keyboardShouldPersistTaps="handled">
          <Heading title="Update balances" right={<Pressable onPress={() => setBalanceModal(false)}><Icon name="x" color={colors.mutedForeground} /></Pressable>} />
          <TextInput testID="balance-savings" value={savingsAmount} onChangeText={setSavingsAmount} keyboardType="decimal-pad" placeholder={`Savings (${activeSheet.currency})`} placeholderTextColor={colors.mutedForeground} style={inputStyle} />
          <TextInput testID="balance-debt" value={debtAmount} onChangeText={setDebtAmount} keyboardType="decimal-pad" placeholder={`Debt (${activeSheet.currency})`} placeholderTextColor={colors.mutedForeground} style={inputStyle} />
          {error ? <Text style={{ color: colors.destructive }}>{error}</Text> : null}
          <PrimaryButton title="Save balances" icon="check" onPress={saveBalances} testID="balance-save" />
        </KeyboardAwareScrollViewCompat>
      </View></View>
    </Modal>
  </>;
}
