import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useFinance, type FinanceGoal, type GoalDraft } from '@/context/FinanceContext';
import { dateKey, formatMoney, goalProgress } from '@/lib/finance';
import { Heading, Icon, Panel, Pill, PrimaryButton, ProgressBar, Screen, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

export default function GoalsScreen() {
  const colors = useColors();
  const { goals, activeSheet, addGoal, updateGoal, removeGoal, contributeGoal } = useFinance();
  const [modal, setModal] = useState<'goal' | 'contribution' | null>(null);
  const [editing, setEditing] = useState<FinanceGoal | null>(null);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState(`${new Date().getFullYear() + 1}-12-31`);
  const [priority, setPriority] = useState<FinanceGoal['priority']>('medium');
  const [error, setError] = useState('');
  const [contributionGoalId, setContributionGoalId] = useState('');
  const inputStyle = { minHeight: 48, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, color: colors.foreground, paddingHorizontal: 13, fontSize: 14 };
  const openNew = () => { setEditing(null); setName(''); setTarget(''); setTargetDate(`${new Date().getFullYear() + 1}-12-31`); setPriority('medium'); setError(''); setModal('goal'); };
  const openEdit = (goal: FinanceGoal) => { setEditing(goal); setName(goal.name); setTarget(String(goal.targetAmount)); setTargetDate(goal.targetDate); setPriority(goal.priority); setError(''); setModal('goal'); };
  const save = () => {
    const value = Number(target);
    if (!name.trim() || !Number.isFinite(value) || value <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) { setError('Add a name, a target above zero, and a valid date.'); return; }
    const draft: GoalDraft = { name: name.trim(), targetAmount: value, targetDate, priority };
    if (editing) updateGoal(editing.id, draft); else addGoal(draft);
    setModal(null);
  };
  const deleteGoal = (goal: FinanceGoal) => Alert.alert('Delete this goal?', `${goal.name} and its progress will be removed.`, [{ text: 'Keep', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeGoal(goal.id) }]);
  const saveContribution = () => {
    const value = Number(amount);
    if (Number.isFinite(value) && value > 0) { contributeGoal(contributionGoalId, value); setModal(null); setAmount(''); }
    else setError('Enter an amount greater than zero.');
  };
  return <>
    <Screen withTabs>
      <Heading eyebrow="Make progress visible" title="Goals" subtitle="Give your next milestone a target and a timeline." right={<Pressable onPress={openNew} accessibilityRole="button"><Icon name="plus-circle" size={25} color={colors.primary} /></Pressable>} />
      <Panel dark style={{ gap: 7 }}>
        <Text style={{ color: colors.primaryForeground, fontSize: 11, letterSpacing: 1, fontWeight: '700' }}>ACTIVE GOALS</Text>
        <Text style={{ color: colors.primaryForeground, fontSize: 29, fontWeight: '700' }}>{goals.length}<Text style={{ fontSize: 14, fontWeight: '500', opacity: 0.75 }}> {goals.length === 1 ? 'goal' : 'goals'}</Text></Text>
        <Text style={{ color: colors.primaryForeground, opacity: 0.72, fontSize: 12 }}>Progress is saved with your local finance sheet.</Text>
      </Panel>
      <SectionTitle title="Your milestones" />
      {goals.length ? goals.map((goal) => {
        const progress = goalProgress(goal);
        return <Panel key={goal.id} style={{ gap: 13 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{goal.name}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Target {goal.targetDate} · {goal.priority} priority</Text></View>
            <Pressable accessibilityRole="button" onPress={() => openEdit(goal)} hitSlop={8}><Icon name="edit-2" size={17} color={colors.mutedForeground} /></Pressable>
          </View>
          <ProgressBar value={progress} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{formatMoney(goal.currentAmount, activeSheet.currency)}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{formatMoney(goal.targetAmount, activeSheet.currency)} · {Math.round(progress)}%</Text></View>
          <PrimaryButton title="Add progress" icon="plus" onPress={() => { setContributionGoalId(goal.id); setAmount(''); setError(''); setModal('contribution'); }} />
        </Panel>;
      }) : <Panel><Text style={{ color: colors.mutedForeground, textAlign: 'center', lineHeight: 21, paddingVertical: 8 }}>No goals yet. Add one to track a savings target, a purchase, or a debt milestone.</Text><PrimaryButton title="Create a goal" icon="plus" onPress={openNew} /></Panel>}
    </Screen>
    <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' }}><View style={{ maxHeight: '90%', backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
        <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 13 }} bottomOffset={50} keyboardShouldPersistTaps="handled">
          <Heading title={modal === 'contribution' ? 'Add progress' : editing ? 'Edit goal' : 'New goal'} right={<Pressable onPress={() => setModal(null)}><Icon name="x" color={colors.mutedForeground} /></Pressable>} />
          {modal === 'contribution' ? <>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Add an amount to this milestone. This updates its saved progress.</Text>
            <TextInput testID="goal-contribution" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={`Amount (${activeSheet.currency})`} placeholderTextColor={colors.mutedForeground} style={inputStyle} />
            {error ? <Text style={{ color: colors.destructive }}>{error}</Text> : null}
            <PrimaryButton title="Save contribution" icon="check" onPress={saveContribution} />
          </> : <>
            <TextInput testID="goal-name" value={name} onChangeText={setName} placeholder="Goal name" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
            <TextInput testID="goal-target" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder={`Target amount (${activeSheet.currency})`} placeholderTextColor={colors.mutedForeground} style={inputStyle} />
            <TextInput value={targetDate} onChangeText={setTargetDate} placeholder="Target date YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>PRIORITY</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>{(['low', 'medium', 'high'] as const).map((item) => <Pill key={item} label={item} selected={priority === item} onPress={() => setPriority(item)} />)}</View>
            {error ? <Text style={{ color: colors.destructive }}>{error}</Text> : null}
            <PrimaryButton title={editing ? 'Save changes' : 'Create goal'} icon="check" onPress={save} testID="goal-save" />
            {editing ? <Pressable onPress={() => deleteGoal(editing)}><Text style={{ color: colors.destructive, textAlign: 'center', padding: 8 }}>Delete goal</Text></Pressable> : null}
          </>}
        </KeyboardAwareScrollViewCompat>
      </View></View>
    </Modal>
  </>;
}
