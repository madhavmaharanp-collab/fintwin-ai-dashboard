import type { FinanceData, FinanceGoal, FinanceTransaction } from '@/context/FinanceContext';

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'NPR' || currency === 'INR' ? 0 : 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getSummary(data: FinanceData) {
  const sheetId = data.activeSheetId;
  const entries = data.transactions.filter((item) => item.sheetId === sheetId);
  const month = monthKey();
  const current = entries.filter((item) => item.date.slice(0, 7) === month);
  const monthIncome = current.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const monthExpenses = current.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const recurringIncome = entries.filter((item) => item.recurring && item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const recurringExpenses = entries.filter((item) => item.recurring && item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncome = monthIncome || recurringIncome;
  const monthlyExpenses = monthExpenses || recurringExpenses;
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const balance = data.balances?.[sheetId] ?? { savings: data.openingBalance ?? 0, debt: data.debtBalance ?? 0 };
  const allTimeNetFlow = entries.reduce((sum, item) => {
    if (item.type === 'income') return sum + item.amount;
    if (item.type === 'expense') return sum - item.amount;
    return sum;
  }, 0);
  const assets = Math.max(0, balance.savings + allTimeNetFlow);
  const netWorth = assets - balance.debt;
  const emergencyMonths = monthlyExpenses > 0 ? assets / monthlyExpenses : 0;
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;
  const healthScore = monthlyIncome > 0
    ? Math.max(0, Math.min(100, Math.round(28 + Math.max(0, savingsRate) * 0.55 + Math.min(6, emergencyMonths) * 5 + (balance.debt === 0 ? 14 : Math.max(0, 12 - (balance.debt / monthlyIncome) * 8)) + (data.goals.some((goal) => goal.sheetId === sheetId) ? 6 : 0))))
    : 0;
  const byCategory = new Map<string, number>();
  current.filter((item) => item.type === 'expense').forEach((item) => byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount));
  if (monthExpenses === 0) {
    entries.filter((item) => item.recurring && item.type === 'expense').forEach((item) => byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount));
  }
  return { monthlyIncome, monthlyExpenses, monthlySurplus, netWorth, assets, debtBalance: balance.debt, emergencyMonths, savingsRate, healthScore, byCategory };
}

export function getSixMonthTrend(data: FinanceData) {
  const points: { label: string; value: number }[] = [];
  const sheetItems = data.transactions.filter((item) => item.sheetId === data.activeSheetId && item.type === 'expense');
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - offset);
    const key = monthKey(date);
    const value = sheetItems.filter((item) => item.date.slice(0, 7) === key).reduce((sum, item) => sum + item.amount, 0);
    points.push({ label: date.toLocaleDateString(undefined, { month: 'short' }), value });
  }
  return points;
}

export function goalProgress(goal: FinanceGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.max(0, Math.min(100, (goal.currentAmount / goal.targetAmount) * 100));
}

export function getMonthlySpend(data: FinanceData): FinanceTransaction[] {
  const key = monthKey();
  const items = data.transactions.filter((item) => item.sheetId === data.activeSheetId && item.date.slice(0, 7) === key && item.type === 'expense');
  return items.length > 0
    ? items
    : data.transactions.filter((item) => item.sheetId === data.activeSheetId && item.recurring && item.type === 'expense');
}

export function sipValue(monthly: number, annualRate: number, years: number): number {
  const periods = Math.max(1, Math.round(years * 12));
  const rate = annualRate / 1200;
  if (rate === 0) return monthly * periods;
  return monthly * (((1 + rate) ** periods - 1) / rate) * (1 + rate);
}

export function sipTrend(monthly: number, annualRate: number, years: number) {
  const points: { label: string; value: number }[] = [];
  for (let year = 0; year <= years; year += 1) {
    points.push({ label: `${year}y`, value: sipValue(monthly, annualRate, year || 1) * (year === 0 ? 0 : 1) });
  }
  return points;
}
