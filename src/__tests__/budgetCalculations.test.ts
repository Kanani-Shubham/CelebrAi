import { describe, it, expect } from 'vitest';

// Pure budget calculation functions (tested in isolation)
function calcVariance(planned: number, actual: number) { return planned - actual; }
function calcPercentUsed(planned: number, actual: number) { return planned > 0 ? Math.round((actual / planned) * 100) : 0; }
function formatINR(amount: number) { return `₹${amount.toLocaleString('en-IN')}`; }
function totalBudget(categories: { estimatedAmount: number }[]) { return categories.reduce((s, c) => s + (c.estimatedAmount || 0), 0); }

describe('Budget Calculations', () => {
  it('calculates variance correctly', () => {
    expect(calcVariance(100000, 75000)).toBe(25000);
    expect(calcVariance(50000, 60000)).toBe(-10000);
  });

  it('calculates percent used correctly', () => {
    expect(calcPercentUsed(100000, 50000)).toBe(50);
    expect(calcPercentUsed(0, 5000)).toBe(0);
  });

  it('formats INR correctly', () => {
    expect(formatINR(500000)).toContain('₹');
    expect(formatINR(500000)).toContain('5');
  });

  it('sums budget categories', () => {
    const cats = [{ estimatedAmount: 50000 }, { estimatedAmount: 30000 }, { estimatedAmount: 20000 }];
    expect(totalBudget(cats)).toBe(100000);
  });

  it('handles empty categories', () => {
    expect(totalBudget([])).toBe(0);
  });

  it('handles invalid amounts', () => {
    const cats = [{ estimatedAmount: NaN }, { estimatedAmount: 20000 }];
    expect(totalBudget(cats)).toBe(20000);
  });

  it('calculates category spend percentage of total recorded spend safely', () => {
    const calcCategoryPct = (catSpent: number, totalSpent: number) =>
      totalSpent > 0 ? Math.min(100, Math.round((catSpent / totalSpent) * 100)) : 0;

    expect(calcCategoryPct(7000, 19500)).toBe(36);
    expect(calcCategoryPct(5000, 19500)).toBe(26);
    expect(calcCategoryPct(3000, 19500)).toBe(15);
    expect(calcCategoryPct(2000, 19500)).toBe(10);
    expect(calcCategoryPct(1500, 19500)).toBe(8);
    expect(calcCategoryPct(1000, 19500)).toBe(5);

    // Safe zero handling (no NaN or Infinity)
    expect(calcCategoryPct(0, 0)).toBe(0);
    expect(calcCategoryPct(100, 0)).toBe(0);
  });
});
