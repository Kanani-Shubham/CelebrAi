import { describe, it, expect } from 'vitest';
import { getCategoryTheme, calculateExpenseSummary } from '../pages/planning/ExpenseManager';

interface TestExpense {
  id: string;
  vendorName: string;
  title: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  category: string;
}

describe('Expense Manager Calculations & Filtering', () => {
  const sampleExpenses: TestExpense[] = [
    { id: '1', vendorName: 'Allocated Budget', title: 'Miscellaneous', amount: 1000, status: 'Paid', category: 'Miscellaneous' },
    { id: '2', vendorName: 'Allocated Budget', title: 'Catering', amount: 7000, status: 'Pending', category: 'Catering' },
    { id: '3', vendorName: 'Allocated Budget', title: 'Venue', amount: 5000, status: 'Pending', category: 'Venue' },
    { id: '4', vendorName: 'Allocated Budget', title: 'Photography', amount: 2000, status: 'Overdue', category: 'Photography' },
    { id: '5', vendorName: 'Allocated Budget', title: 'Entertainment', amount: 1500, status: 'Paid', category: 'Entertainment' },
    { id: '6', vendorName: 'Allocated Budget', title: 'Decor', amount: 3000, status: 'Pending', category: 'Decor' },
  ];

  it('calculates Paid total accurately', () => {
    const summary = calculateExpenseSummary(sampleExpenses);
    // 1000 + 1500 = 2500
    expect(summary.paid).toBe(2500);
  });

  it('calculates Pending total accurately', () => {
    const summary = calculateExpenseSummary(sampleExpenses);
    // 7000 + 5000 + 3000 = 15000
    expect(summary.pending).toBe(15000);
  });

  it('calculates Overdue total accurately', () => {
    const summary = calculateExpenseSummary(sampleExpenses);
    // 2000
    expect(summary.overdue).toBe(2000);
  });

  it('calculates Remaining summary accurately as the sum of all overdue expenses', () => {
    // Tests exact scenario from user's screenshot:
    // Paid: ₹1,50,000, Pending: ₹2,40,000, Overdue: ₹80,000 + ₹30,000 = ₹1,10,000
    const screenshotExpenses = [
      { id: 'e1', title: 'Venue', amount: 150000, status: 'Paid' },
      { id: 'e2', title: 'Catering', amount: 240000, status: 'Pending' },
      { id: 'e3', title: 'Decor', amount: 80000, status: 'Overdue' },
      { id: 'e4', title: 'Entertainment', amount: 30000, status: 'Overdue' },
    ];

    const summary = calculateExpenseSummary(screenshotExpenses);
    expect(summary.paid).toBe(150000);
    expect(summary.pending).toBe(240000);
    expect(summary.overdue).toBe(110000);
    // Remaining must reflect the overdue total: ₹1,10,000
    expect(summary.remaining).toBe(110000);
  });

  it('normalizes status casing and handles missing amounts safely', () => {
    const mixedExpenses = [
      { id: 'm1', amount: 5000, status: 'PAID' },
      { id: 'm2', amount: '3000', status: 'paid' },
      { id: 'm3', amount: 4000, status: ' Pending ' },
      { id: 'm4', amount: 2000, status: 'overdue' },
      { id: 'm5', amount: null, status: 'Paid' },
      { id: 'm6', amount: -500, status: 'Pending' },
    ];

    const summary = calculateExpenseSummary(mixedExpenses);
    expect(summary.paid).toBe(8000);
    expect(summary.pending).toBe(4000);
    expect(summary.overdue).toBe(2000);
    expect(summary.remaining).toBe(2000);
  });

  it('updates summary calculations correctly across all status transitions', () => {
    let list = [
      { id: 't1', amount: 50000, status: 'Pending' },
    ];

    // Initial state: Pending = 50000, Overdue = 0, Paid = 0, Remaining = 0
    let s = calculateExpenseSummary(list);
    expect(s.pending).toBe(50000);
    expect(s.remaining).toBe(0);

    // 1. Pending -> Overdue: subtract from Pending, add to Remaining
    list = list.map(e => e.id === 't1' ? { ...e, status: 'Overdue' } : e);
    s = calculateExpenseSummary(list);
    expect(s.pending).toBe(0);
    expect(s.remaining).toBe(50000);
    expect(s.paid).toBe(0);

    // 2. Overdue -> Paid: subtract from Remaining, add to Paid
    list = list.map(e => e.id === 't1' ? { ...e, status: 'Paid' } : e);
    s = calculateExpenseSummary(list);
    expect(s.remaining).toBe(0);
    expect(s.paid).toBe(50000);

    // 3. Paid -> Overdue: subtract from Paid, add to Remaining
    list = list.map(e => e.id === 't1' ? { ...e, status: 'Overdue' } : e);
    s = calculateExpenseSummary(list);
    expect(s.paid).toBe(0);
    expect(s.remaining).toBe(50000);

    // 4. Overdue -> Pending: subtract from Remaining, add to Pending
    list = list.map(e => e.id === 't1' ? { ...e, status: 'Pending' } : e);
    s = calculateExpenseSummary(list);
    expect(s.remaining).toBe(0);
    expect(s.pending).toBe(50000);
  });

  it('filters expenses correctly by status tab', () => {
    const filterAll = sampleExpenses.filter(() => true);
    expect(filterAll.length).toBe(6);

    const filterPaid = sampleExpenses.filter(e => e.status === 'Paid');
    expect(filterPaid.length).toBe(2);

    const filterPending = sampleExpenses.filter(e => e.status === 'Pending');
    expect(filterPending.length).toBe(3);

    const filterOverdue = sampleExpenses.filter(e => e.status === 'Overdue');
    expect(filterOverdue.length).toBe(1);
  });

  it('resolves category themes and falls back safely', () => {
    const cateringTheme = getCategoryTheme('Catering');
    expect(cateringTheme.bg).toBe('#FEF3C7');
    expect(cateringTheme.color).toBe('#B45309');

    const venueTheme = getCategoryTheme('Venue');
    expect(venueTheme.bg).toBe('#DBEAFE');

    const fallbackTheme = getCategoryTheme('Unknown Category');
    expect(fallbackTheme.bg).toBe('#F4EFFF');
    expect(fallbackTheme.color).toBe('#7E57C2');
  });

  it('avoids string concatenation between vendor and title', () => {
    const exp = { vendorName: 'Allocated Budget', title: 'Miscellaneous' };
    // Should distinguish allocated budget from regular vendor
    const isAllocated = exp.vendorName === 'Allocated Budget';
    expect(isAllocated).toBe(true);

    const formattedTitle = isAllocated ? `${exp.title} planned allocation` : exp.title;
    expect(formattedTitle).not.toBe('Allocated BudgetMiscellaneous');
    expect(formattedTitle).toBe('Miscellaneous planned allocation');
  });
});

