import type { Expense } from '../../../types';
import React from 'react';
import {
  Building2,
  Utensils,
  Sparkles,
  Camera,
  Music,
  Mail,
  Shirt,
  Car,
  Package,
} from 'lucide-react';

export type FirestoreExpense = Expense;

export const DEMO_EXPENSES: FirestoreExpense[] = [
  { id: 'exp-1', vendorName: 'Grand Palace Banquet', title: 'Venue booking advance', amount: 150000, status: 'Paid', category: 'Venue', eventId: 'evt-1' },
  { id: 'exp-2', vendorName: 'Royal Florals & Decor', title: 'Decor planned allocation', amount: 80000, status: 'Overdue', category: 'Decor', eventId: 'evt-1' },
  { id: 'exp-3', vendorName: 'DJ & Sound Wave', title: 'Entertainment planned allocation', amount: 30000, status: 'Overdue', category: 'Entertainment', eventId: 'evt-1' },
  { id: 'exp-4', vendorName: 'Shreeji Gourmet Catering', title: 'Catering 50% advance', amount: 60000, status: 'Pending', category: 'Catering', eventId: 'evt-1' },
  { id: 'exp-5', vendorName: 'Studio Memories', title: 'Photography package', amount: 180000, status: 'Paid', category: 'Photography', eventId: 'evt-1' },
];

export const CATEGORIES = [
  'Venue',
  'Catering',
  'Decor & Styling',
  'Photography & Video',
  'Invitations & Stationery',
  'Music & Entertainment',
  'Attire & Beauty',
  'Transportation',
  'Miscellaneous',
  'Other',
];

export interface CategoryTheme {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  bg: string;
  color: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  Venue: {
    icon: Building2,
    bg: '#DBEAFE',
    color: '#1D4ED8',
  },
  Catering: {
    icon: Utensils,
    bg: '#FEF3C7',
    color: '#B45309',
  },
  Food: {
    icon: Utensils,
    bg: '#FEF3C7',
    color: '#B45309',
  },
  'Decor & Styling': {
    icon: Sparkles,
    bg: '#EDE9FE',
    color: '#6D28D9',
  },
  Decor: {
    icon: Sparkles,
    bg: '#EDE9FE',
    color: '#6D28D9',
  },
  'Photography & Video': {
    icon: Camera,
    bg: '#FFE4E6',
    color: '#BE123C',
  },
  Photography: {
    icon: Camera,
    bg: '#FFE4E6',
    color: '#BE123C',
  },
  'Music & Entertainment': {
    icon: Music,
    bg: '#DCFCE7',
    color: '#047857',
  },
  Entertainment: {
    icon: Music,
    bg: '#DCFCE7',
    color: '#047857',
  },
  Music: {
    icon: Music,
    bg: '#DCFCE7',
    color: '#047857',
  },
  'Invitations & Stationery': {
    icon: Mail,
    bg: '#FEE2E2',
    color: '#B91C1C',
  },
  Invitations: {
    icon: Mail,
    bg: '#FEE2E2',
    color: '#B91C1C',
  },
  'Attire & Beauty': {
    icon: Shirt,
    bg: '#FCE7F3',
    color: '#BE185D',
  },
  Attire: {
    icon: Shirt,
    bg: '#FCE7F3',
    color: '#BE185D',
  },
  Transportation: {
    icon: Car,
    bg: '#E0F2FE',
    color: '#0369A1',
  },
  Miscellaneous: {
    icon: Package,
    bg: '#F1F5F9',
    color: '#334155',
  },
  Other: {
    icon: Package,
    bg: '#F1F5F9',
    color: '#334155',
  },
};

export const DEFAULT_THEME: CategoryTheme = {
  icon: Package,
  bg: '#F4EFFF',
  color: '#7E57C2',
};

export const getCategoryTheme = (category?: string): CategoryTheme => {
  if (!category) return DEFAULT_THEME;
  return CATEGORY_THEMES[category] || DEFAULT_THEME;
};

/**
 * Calculates exact totals directly from expense records:
 * - Paid Total = Sum of expenses with status 'paid'
 * - Pending Total = Sum of expenses with status 'pending'
 * - Remaining Total = Sum of expenses with status 'overdue'
 */
export function calculateExpenseSummary(expenseList: { status?: string; amount?: number | string | null }[]) {
  let paid = 0;
  let pending = 0;
  let overdue = 0;

  for (const exp of expenseList) {
    const rawStatus = (exp.status || '').trim().toLowerCase();
    const amt = Math.max(0, Number(exp.amount) || 0);

    if (rawStatus === 'paid') {
      paid += amt;
    } else if (rawStatus === 'pending') {
      pending += amt;
    } else if (rawStatus === 'overdue') {
      overdue += amt;
    }
  }

  return {
    paid,
    pending,
    overdue,
    remaining: overdue,
  };
}
