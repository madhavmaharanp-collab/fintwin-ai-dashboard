import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useFinance, type FinanceTransaction, type TransactionDraft, type TransactionType } from '@/context/FinanceContext';
import { dateKey, formatMoney } from '@/lib/finance';
import { formatDate, Heading, Icon, Panel, Pill, PrimaryButton, Screen, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

const categories = ['Housing', 'Food', 'Transport', 'Bills', 'Health', 'Shopping', 'Salary', 'Other'];
const types: TransactionType[] = ['expense', 'income', 'transfer'];
export default function LedgerScreen() {
  const colors = useColors();
  const { transactions, activeSheet, addTransaction, updateTransaction, removeTransaction } = useFinance();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(dateKey());
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState('');
  const inputStyle = { minHeight: 48, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, color: colors.foreground, paddingHorizontal: 13, fontSize: 14 };
  const openNew = () => { setEditing(null); setType('expense'); setAmount(''); setDescription(''); setCategory(categories[0]); setDate(dateKey()); setRecurring(false); setError(''); setModal(true); };
  const openEdit = (item: FinanceTransaction) => { setEditing(item); setType(item.type); setAmount(String(item.amount)); setDescription(item.description); setCategory(item.category); setDate(item.date); setRecurring(item.recurring); setError(''); setModal(true); };
  const visible = useMemo(() => transactions.filter((item) => (filter === 'all' || item.type === filter) && `${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [transactions, filter, query]);
  const save = () => {
    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError('Add a description, valid date, and amount greater than zero.'); return; }
    const draft: TransactionDraft = { type, amount: value, description: description.trim(), category, date, recurring };
    if (editing) updateTransaction(editing.id, draft); else addTransaction(draft);
    setModal(false);
  };
  const askDelete = (item: FinanceTransaction) => Alert.alert('Delete this entry?', `${item.description} will be removed from this device.`, [{ text: 'Keep', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(item.id) }]);
  return <>
    <Screen withTabs>
      <Heading eyebrow={activeSheet.name} title="Ledger" subtitle="Search, filter, and keep every entry in one place." right={<Pressable accessibilityRole="button" onPress={openNew} hitSlop={8}><Icon name="plus-circle" size={25} color={colors.primary} /></Pressable>} />
      <TextInput testID="ledger-search" value={query} onChangeText={setQuery} placeholder="Search transactions" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
      <View style={{ flexDirection: 'row', gap: 8 }}>{(['all', 'expense', 'income', 'transfer'] as const).map((item) => <Pill key={item} label={item[0].toUpperCase() + item.slice(1)} selected={filter === item} onPress={() => setFilter(item)} />)}</View>
      <SectionTitle title={`${visible.length} entries`} />
      {visible.length ? visible.map((item) => <Pressable key={item.id} testID={`transaction-${item.id}`} onPress={() => openEdit(item)} onLongPress={() => askDelete(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }}><Icon name={item.type === 'income' ? 'arrow-down-left' : item.type === 'transfer' ? 'repeat' : 'arrow-up-right'} size={17} color={colors.primary} /></View>
        <View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>{item.description}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{item.category} · {formatDate(item.date)}{item.recurring ? ' · recurring' : ''}</Text></View>
        <Text style={{ color: item.type === 'income' ? colors.primary : colors.foreground, fontWeight: '700', fontSize: 13 }}>{item.type === 'expense' ? '−' : '+'}{formatMoney(item.amount, activeSheet.currency)}</Text>
      </Pressable>) : <Panel><Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 18 }}>No matching entries yet. Add one to start tracking your cash flow.</Text></Panel>}
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Tap an entry to edit. Press and hold to delete.</Text>
    </Screen>
    <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' }}>
        <View style={{ maxHeight: '92%', backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16 }}>
          <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 13 }} bottomOffset={55} keyboardShouldPersistTaps="handled">
            <Heading title={editing ? 'Edit entry' : 'Add transaction'} right={<Pressable onPress={() => setModal(false)} accessibilityRole="button"><Icon name="x" color={colors.mutedForeground} /></Pressable>} />
            <View style={{ flexDirection: 'row', gap: 7 }}>{types.map((item) => <Pill key={item} label={item[0].toUpperCase() + item.slice(1)} selected={type === item} onPress={() => setType(item)} />)}</View>
            <TextInput testID="transaction-description" value={description} onChangeText={setDescription} placeholder="What was this for?" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
            <TextInput testID="transaction-amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={`Amount (${activeSheet.currency})`} placeholderTextColor={colors.mutedForeground} style={inputStyle} />
            <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>CATEGORY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{categories.map((item) => <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</View>
            <Pill label={recurring ? 'Recurring monthly ✓' : 'One-time entry'} selected={recurring} onPress={() => setRecurring(!recurring)} />
            {error ? <Text style={{ color: colors.destructive, fontSize: 12 }}>{error}</Text> : null}
            <PrimaryButton title={editing ? 'Save changes' : 'Add to ledger'} onPress={save} icon="check" testID="transaction-save" />
            {editing ? <Pressable onPress={() => askDelete(editing)}><Text style={{ color: colors.destructive, textAlign: 'center', fontWeight: '600', padding: 8 }}>Delete entry</Text></Pressable> : null}
          </KeyboardAwareScrollViewCompat>
        </View>
      </View>
    </Modal>
  </>;
}
