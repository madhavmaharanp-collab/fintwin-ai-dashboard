import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { dateKey } from '@/lib/finance';

export type CurrencyCode = 'NPR' | 'USD' | 'INR' | 'GBP' | 'EUR' | 'AUD' | 'CAD';
export type TransactionType = 'income' | 'expense' | 'transfer';
export interface FinanceTransaction {
  id: string; sheetId: string; date: string; type: TransactionType;
  amount: number; category: string; description: string; recurring: boolean;
}
export interface FinanceGoal {
  id: string; sheetId: string; name: string; targetAmount: number;
  currentAmount: number; targetDate: string; priority: 'high' | 'medium' | 'low';
}
export interface FinanceSheet {
  id: string; name: string; type: 'personal' | 'family' | 'scenario'; currency: CurrencyCode;
}
export interface FinanceBudget { id: string; sheetId: string; category: string; monthlyLimit: number }
export interface FinanceBalance { savings: number; debt: number }
export interface FinanceData {
  transactions: FinanceTransaction[]; goals: FinanceGoal[]; sheets: FinanceSheet[];
  activeSheetId: string; budgets: FinanceBudget[]; openingBalance: number;
  debtBalance: number; balances: Record<string, FinanceBalance>; onboardingComplete: boolean;
}
export type TransactionDraft = Omit<FinanceTransaction, 'id' | 'sheetId'>;
export type GoalDraft = Omit<FinanceGoal, 'id' | 'sheetId' | 'currentAmount'>;

interface FinanceContextValue {
  data: FinanceData; ready: boolean; storageError: string | null;
  activeSheet: FinanceSheet; transactions: FinanceTransaction[]; goals: FinanceGoal[];
  budgets: FinanceBudget[]; addTransaction: (draft: TransactionDraft) => void;
  updateTransaction: (id: string, draft: TransactionDraft) => void; removeTransaction: (id: string) => void;
  addGoal: (draft: GoalDraft) => void; updateGoal: (id: string, draft: GoalDraft) => void;
  removeGoal: (id: string) => void; contributeGoal: (id: string, amount: number) => void;
  addSheet: (name: string, type: FinanceSheet['type'], currency: CurrencyCode) => void;
  renameSheet: (id: string, name: string) => void; removeSheet: (id: string) => void;
  selectSheet: (id: string) => void; setBudget: (category: string, amount: number) => void;
  setCurrency: (currency: CurrencyCode) => void; setBalances: (savings: number, debt: number) => void;
  completeOnboarding: (input: { currency: CurrencyCode; income: number; expenses: number; savings: number; goalName: string; goalTarget: number }) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);
let idCounter = 0;
function makeId(prefix: string) { idCounter += 1; return `${prefix}-${Date.now()}-${idCounter}`; }

function blankData(): FinanceData {
  return {
    transactions: [], goals: [],
    sheets: [{ id: 'personal', name: 'Personal finance', type: 'personal', currency: 'NPR' }],
    activeSheetId: 'personal', budgets: [], openingBalance: 0, debtBalance: 0,
    balances: { personal: { savings: 0, debt: 0 } },
    onboardingComplete: false,
  };
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [data, setData] = useState<FinanceData>(blankData);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const storageKey = userId ? `fintwin:finance:${userId}` : null;

  useEffect(() => {
    let current = true;
    if (!storageKey || !userId) { setLoadedUserId(null); return; }
    setLoadedUserId(null);
    AsyncStorage.getItem(storageKey).then((saved) => {
      if (!current) return;
      if (saved) {
        try { setData(JSON.parse(saved) as FinanceData); }
        catch { setData(blankData()); setStorageError('Saved data could not be read. A fresh local profile was opened.'); }
      } else setData(blankData());
      setLoadedUserId(userId);
    }).catch(() => {
      if (!current) return;
      setData(blankData()); setStorageError('Local storage is unavailable. Your changes may not persist.');
      setLoadedUserId(userId);
    });
    return () => { current = false; };
  }, [storageKey, userId]);

  useEffect(() => {
    if (!storageKey || !userId || loadedUserId !== userId) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(data)).then(() => setStorageError(null)).catch(() => setStorageError('Could not save to this device. Check available storage.'));
  }, [data, loadedUserId, storageKey, userId]);

  const activeSheet = data.sheets.find((sheet) => sheet.id === data.activeSheetId) ?? data.sheets[0] ?? blankData().sheets[0];
  const transactions = data.transactions.filter((item) => item.sheetId === activeSheet.id);
  const goals = data.goals.filter((item) => item.sheetId === activeSheet.id);
  const budgets = data.budgets.filter((item) => item.sheetId === activeSheet.id);
  const addTransaction = useCallback((draft: TransactionDraft) => setData((current) => ({ ...current, transactions: [{ ...draft, id: makeId('tx'), sheetId: current.activeSheetId }, ...current.transactions] })), []);
  const updateTransaction = useCallback((id: string, draft: TransactionDraft) => setData((current) => ({ ...current, transactions: current.transactions.map((item) => item.id === id ? { ...item, ...draft } : item) })), []);
  const removeTransaction = useCallback((id: string) => setData((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) })), []);
  const addGoal = useCallback((draft: GoalDraft) => setData((current) => ({ ...current, goals: [{ ...draft, id: makeId('goal'), sheetId: current.activeSheetId, currentAmount: 0 }, ...current.goals] })), []);
  const updateGoal = useCallback((id: string, draft: GoalDraft) => setData((current) => ({ ...current, goals: current.goals.map((item) => item.id === id ? { ...item, ...draft } : item) })), []);
  const removeGoal = useCallback((id: string) => setData((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== id) })), []);
  const contributeGoal = useCallback((id: string, amount: number) => setData((current) => ({ ...current, goals: current.goals.map((item) => item.id === id ? { ...item, currentAmount: Math.max(0, item.currentAmount + amount) } : item) })), []);
  const addSheet = useCallback((name: string, type: FinanceSheet['type'], currency: CurrencyCode) => setData((current) => {
    const sheet = { id: makeId('sheet'), name: name.trim(), type, currency };
    return { ...current, sheets: [...current.sheets, sheet], activeSheetId: sheet.id, balances: { ...current.balances, [sheet.id]: { savings: 0, debt: 0 } } };
  }), []);
  const renameSheet = useCallback((id: string, name: string) => setData((current) => ({ ...current, sheets: current.sheets.map((sheet) => sheet.id === id ? { ...sheet, name: name.trim() } : sheet) })), []);
  const removeSheet = useCallback((id: string) => setData((current) => {
    if (current.sheets.length <= 1) return current;
    const sheets = current.sheets.filter((sheet) => sheet.id !== id);
    const nextId = current.activeSheetId === id ? sheets[0].id : current.activeSheetId;
    const balances = { ...current.balances };
    delete balances[id];
    return { ...current, sheets, activeSheetId: nextId, transactions: current.transactions.filter((item) => item.sheetId !== id), goals: current.goals.filter((item) => item.sheetId !== id), budgets: current.budgets.filter((item) => item.sheetId !== id), balances };
  }), []);
  const selectSheet = useCallback((id: string) => setData((current) => ({ ...current, activeSheetId: id })), []);
  const setBudget = useCallback((category: string, amount: number) => setData((current) => {
    const old = current.budgets.find((item) => item.sheetId === current.activeSheetId && item.category === category);
    return { ...current, budgets: amount <= 0 ? current.budgets.filter((item) => item.id !== old?.id) : old ? current.budgets.map((item) => item.id === old.id ? { ...item, monthlyLimit: amount } : item) : [...current.budgets, { id: makeId('budget'), sheetId: current.activeSheetId, category, monthlyLimit: amount }] };
  }), []);
  const setCurrency = useCallback((currency: CurrencyCode) => setData((current) => ({ ...current, sheets: current.sheets.map((sheet) => sheet.id === current.activeSheetId ? { ...sheet, currency } : sheet) })), []);
  const setBalances = useCallback((savings: number, debt: number) => setData((current) => ({
    ...current,
    openingBalance: Math.max(0, savings),
    debtBalance: Math.max(0, debt),
    balances: { ...current.balances, [current.activeSheetId]: { savings: Math.max(0, savings), debt: Math.max(0, debt) } },
  })), []);
  const completeOnboarding = useCallback((input: { currency: CurrencyCode; income: number; expenses: number; savings: number; goalName: string; goalTarget: number }) => {
    setData((current) => {
      const sheetId = current.activeSheetId;
      const sheet = current.sheets.find((item) => item.id === sheetId);
      const transactions: FinanceTransaction[] = [];
      if (input.income > 0) transactions.push({ id: makeId('tx'), sheetId, date: dateKey(), type: 'income', amount: input.income, category: 'Salary', description: 'Monthly income', recurring: true });
      if (input.expenses > 0) transactions.push({ id: makeId('tx'), sheetId, date: dateKey(), type: 'expense', amount: input.expenses, category: 'Essentials', description: 'Monthly essentials', recurring: true });
      const goals = input.goalName.trim() && input.goalTarget > 0 ? [{ id: makeId('goal'), sheetId, name: input.goalName.trim(), targetAmount: input.goalTarget, currentAmount: 0, targetDate: `${new Date().getFullYear() + 1}-12-31`, priority: 'high' as const }] : [];
      return { ...current, onboardingComplete: true, transactions: [...transactions, ...current.transactions], goals: [...goals, ...current.goals], openingBalance: input.savings, balances: { ...current.balances, [sheetId]: { savings: input.savings, debt: current.balances?.[sheetId]?.debt ?? 0 } }, sheets: current.sheets.map((item) => item.id === sheetId ? { ...item, currency: input.currency } : item) };
    });
    if (!data.sheets.some((item) => item.id === data.activeSheetId)) setData((current) => ({ ...current, sheets: [{ id: 'personal', name: 'Personal finance', type: 'personal', currency: input.currency }, ...current.sheets] }));
  }, [data.activeSheetId, data.sheets]);

  const value = useMemo<FinanceContextValue>(() => ({
    data, ready: !!userId && loadedUserId === userId, storageError, activeSheet, transactions, goals, budgets,
    addTransaction, updateTransaction, removeTransaction, addGoal, updateGoal, removeGoal, contributeGoal,
    addSheet, renameSheet, removeSheet, selectSheet, setBudget, setCurrency, setBalances, completeOnboarding,
  }), [data, userId, loadedUserId, storageError, activeSheet, transactions, goals, budgets, addTransaction, updateTransaction, removeTransaction, addGoal, updateGoal, removeGoal, contributeGoal, addSheet, renameSheet, removeSheet, selectSheet, setBudget, setCurrency, setBalances, completeOnboarding]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('useFinance must be used within FinanceProvider');
  return value;
}
