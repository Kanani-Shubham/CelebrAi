import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../../../utils/logger';
import { toast } from '../../../components/ui/toast';
import {
  getEventExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../../services/firebase/firestore';
import {
  type FirestoreExpense,
  DEMO_EXPENSES,
  calculateExpenseSummary,
} from './types';

export function useExpenses(eventId?: string) {
  const [expenses, setExpenses] = useState<FirestoreExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');

  useEffect(() => {
    let ignore = false;
    async function fetchExpenses() {
      if (!eventId) {
        if (!ignore) {
          setExpenses([]);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await getEventExpenses(eventId);
        if (ignore) return;
        if (data && data.length > 0) {
          setExpenses(data as unknown as FirestoreExpense[]);
        } else {
          setExpenses(DEMO_EXPENSES);
        }
      } catch (err) {
        logger.error('[ExpenseManager] Error loading expenses:', err);
        if (!ignore) setExpenses(DEMO_EXPENSES);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchExpenses();
    return () => { ignore = true; };
  }, [eventId]);

  const loadExpenses = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await getEventExpenses(eventId);
      setExpenses(data && data.length > 0 ? (data as unknown as FirestoreExpense[]) : DEMO_EXPENSES);
    } catch (err) {
      logger.error('[ExpenseManager] Reload failed:', err);
    }
  }, [eventId]);

  const summary = useMemo(() => calculateExpenseSummary(expenses), [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (filter === 'All') return true;
      return (e.status || '').trim().toLowerCase() === filter.toLowerCase();
    });
  }, [expenses, filter]);

  const addExpense = async (doc: Omit<FirestoreExpense, 'id'>) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const docId = await createExpense(eventId, doc);
      setExpenses(prev => [{ id: docId, ...doc }, ...prev]);
      toast.success('Expense recorded successfully');
      return true;
    } catch (err) {
      logger.error('[ExpenseManager] Failed to create expense:', err);
      toast.error('Failed to save expense');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const editExpense = async (id: string, updatedFields: Partial<FirestoreExpense>) => {
    setSaving(true);
    try {
      await updateExpense(id, updatedFields);
      setExpenses(prev =>
        prev.map(e => (e.id === id ? { ...e, ...updatedFields } : e))
      );
      toast.success('Expense updated successfully');
      return true;
    } catch (err) {
      logger.error('[ExpenseManager] Failed to update expense:', err);
      toast.error('Failed to update expense');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setExpenseStatus = async (expense: FirestoreExpense, newStatus: 'Paid' | 'Pending' | 'Overdue') => {
    const prevStatus = expense.status;
    setExpenses(prev => prev.map(e => (e.id === expense.id ? { ...e, status: newStatus } : e)));
    try {
      await updateExpense(expense.id, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
    } catch {
      setExpenses(prev => prev.map(e => (e.id === expense.id ? { ...e, status: prevStatus } : e)));
      toast.error('Failed to update status');
    }
  };

  const removeExpense = async (id: string, titleLabel?: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${titleLabel || 'this expense'}"? This cannot be undone.`
    );
    if (!confirmDelete) return;

    const previous = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
    } catch {
      setExpenses(previous);
      toast.error('Failed to delete expense');
    }
  };

  return {
    expenses,
    filteredExpenses,
    loading,
    error,
    saving,
    filter,
    setFilter,
    summary,
    addExpense,
    editExpense,
    setExpenseStatus,
    removeExpense,
    reload: loadExpenses,
  };
}
