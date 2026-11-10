import React, { useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateAiCoachResponse, type AiCoachChart } from '@workspace/api-client-react';
import { useFinance } from '@/context/FinanceContext';
import { formatMoney, getSixMonthTrend, getSummary } from '@/lib/finance';
import { Heading, Icon, LineChart, Panel, Pill, PrimaryButton, SectionTitle } from '@/components/FinanceUi';
import { useColors } from '@/hooks/useColors';

interface CoachMessage { id: string; role: 'user' | 'assistant'; content: string; chart?: AiCoachChart | null }
let chatCounter = 0;
const questionIdeas = ['Where did most of my spending go?', 'Create a chart of my monthly cash flow', 'How can I build my emergency fund?'];
export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, transactions, goals, activeSheet } = useFinance();
  const summary = getSummary(data);
  const trend = getSixMonthTrend(data);
  const mutation = useCreateAiCoachResponse();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [question, setQuestion] = useState('');
  const listRef = useRef<FlatList<CoachMessage>>(null);
  const snapshot = useMemo(() => ({
    currency: activeSheet.currency,
    monthlyIncome: summary.monthlyIncome,
    monthlyExpenses: summary.monthlyExpenses,
    monthlySurplus: summary.monthlySurplus,
    savingsRate: summary.savingsRate,
    netWorth: summary.netWorth,
    transactions: transactions.slice(0, 30).map((item) => ({ date: item.date, description: item.description, category: item.category, type: item.type, amount: item.amount })),
    goals: goals.slice(0, 8).map((item) => ({ name: item.name, targetAmount: item.targetAmount, currentAmount: item.currentAmount, targetDate: item.targetDate })),
  }), [activeSheet.currency, goals, summary.monthlyExpenses, summary.monthlyIncome, summary.monthlySurplus, summary.netWorth, summary.savingsRate, transactions]);
  const send = async (value = question) => {
    const text = value.trim();
    if (!text || mutation.isPending) return;
    chatCounter += 1;
    const userMessage: CoachMessage = { id: `chat-${Date.now()}-${chatCounter}`, role: 'user', content: text };
    const history = [...messages, userMessage];
    setMessages(history); setQuestion('');
    try {
      const result = await mutation.mutateAsync({ data: { question: text, snapshot } });
      chatCounter += 1;
      setMessages([...history, { id: `chat-${Date.now()}-${chatCounter}`, role: 'assistant', content: result.answer, chart: result.chart }]);
    } catch {
      chatCounter += 1;
      setMessages([...history, { id: `chat-${Date.now()}-${chatCounter}`, role: 'assistant', content: 'I could not reach FinTwin AI just now. Check your connection and try again.' }]);
    }
  };
  const reversed = [...messages].reverse();
  const inputStyle = { flex: 1, maxHeight: 110, minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 11, color: colors.foreground, backgroundColor: colors.card, fontSize: 14 };
  const renderMessage = ({ item }: { item: CoachMessage }) => <View style={{ alignItems: item.role === 'user' ? 'flex-end' : 'flex-start', paddingVertical: 5 }}>
    <View style={{ maxWidth: '90%', padding: 13, borderRadius: 17, backgroundColor: item.role === 'user' ? colors.primary : colors.card, borderWidth: item.role === 'assistant' ? 1 : 0, borderColor: colors.border }}>
      <Text style={{ color: item.role === 'user' ? colors.primaryForeground : colors.foreground, fontSize: 13, lineHeight: 20 }}>{item.content}</Text>
      {item.chart?.values?.length ? <View style={{ marginTop: 10, padding: 10, backgroundColor: item.role === 'user' ? colors.primary : colors.secondary, borderRadius: 13 }}>
        <Text style={{ color: item.role === 'user' ? colors.primaryForeground : colors.foreground, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>{item.chart.title}</Text>
        <LineChart points={item.chart.labels.map((label, index) => ({ label, value: item.chart?.values[index] ?? 0 }))} height={115} />
      </View> : null}
    </View>
  </View>;
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : 0 }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Heading eyebrow="Private finance coach" title="FinTwin AI" subtitle="Ask about your numbers. Request a chart or a practical next step." />
      </View>
      {messages.length ? <FlatList ref={listRef} data={reversed} inverted keyExtractor={(item) => item.id} renderItem={renderMessage} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 8 }} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" ListHeaderComponent={mutation.isPending ? <View><Text style={{ color: colors.mutedForeground, padding: 10 }}>FinTwin is reviewing your snapshot…</Text></View> : undefined} /> :
        <FlatList data={[]} renderItem={() => null} ListEmptyComponent={<View style={{ paddingHorizontal: 20, gap: 15 }}>
          <Panel><SectionTitle title="Your cash-flow chart" /><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Monthly spending · 6 months</Text><LineChart points={trend} /></Panel>
          <Panel style={{ gap: 10 }}><Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>What would you like to understand?</Text>{questionIdeas.map((idea) => <Pressable key={idea} accessibilityRole="button" onPress={() => void send(idea)} style={{ paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border }}><Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{idea}</Text></Pressable>)}</Panel>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, textAlign: 'center' }}>Your question and a limited financial snapshot go to OpenAI. If it is unavailable, the same data may be sent to Google AI as a fallback. Do not include bank credentials or account numbers.</Text>
        </View>} contentContainerStyle={{ flexGrow: 1, paddingBottom: 18 }} keyboardShouldPersistTaps="handled" />}
      {mutation.isPending && messages.length === 0 ? <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 10 }}>Building your answer…</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingHorizontal: 14, paddingTop: 8, paddingBottom: Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 8), borderTopWidth: 1, borderTopColor: colors.border }}>
        <TextInput testID="coach-question" value={question} onChangeText={setQuestion} placeholder="Ask about your finances…" placeholderTextColor={colors.mutedForeground} style={inputStyle} multiline blurOnSubmit={false} onSubmitEditing={() => void send()} />
        <Pressable testID="coach-send" accessibilityRole="button" disabled={!question.trim() || mutation.isPending} onPress={() => void send()} style={{ minWidth: 48, height: 46, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: !question.trim() || mutation.isPending ? 0.5 : 1 }}><Icon name="arrow-up" color={colors.primaryForeground} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
