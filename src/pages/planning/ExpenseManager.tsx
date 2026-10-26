import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import {
  getEventExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
import './ExpenseManager.css';

interface FirestoreExpense {
  id: string;
  vendorName: string;
  title: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  category: string;
  date?: string;
  notes?: string;
  eventId: string;
}

const CATEGORIES = [
  'Venue',
  'Catering',
  'Decor & Styling',
  'Photography & Video',
  'Invitations & Stationery',
  'Music & Entertainment',
  'Attire & Beauty',
  'Transportation',
  'Other',
];

export function ExpenseManager() {
  const { user } = useAuth();
  const { activeEvent } = useEvent();

  const [expenses, setExpenses] = useState<FirestoreExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [vendorName, setVendorName] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Venue');
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const eventId = activeEvent?.id;

  const loadExpenses = useCallback(async () => {
    if (!eventId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getEventExpenses(eventId);
      setExpenses((data || []) as FirestoreExpense[]);
    } catch (err) {
      console.error('[ExpenseManager] Error loading expenses:', err);
      setError((err as Error).message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const paidTotal = expenses
    .filter(e => e.status === 'Paid')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const pendingTotal = expenses
    .filter(e => e.status === 'Pending')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalSpent = paidTotal + pendingTotal;
  const plannedBudget = Number(activeEvent?.budget) || 0;
  const isOverBudget = plannedBudget > 0 && totalSpent > plannedBudget;
  const overBudgetAmount = isOverBudget ? totalSpent - plannedBudget : 0;

  const filteredExpenses = expenses.filter(e => {
    if (filter === 'All') return true;
    return e.status === filter;
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !eventId) return;

    const numAmount = Math.max(0, Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSaving(true);
    const newDoc = {
      vendorName: vendorName.trim() || 'Vendor',
      title: title.trim(),
      amount: numAmount,
      status,
      category,
      date: date || new Date().toISOString().split('T')[0],
      eventId,
    };

    try {
      const docId = await createExpense(eventId, newDoc);
      setExpenses(prev => [{ id: docId, ...newDoc }, ...prev]);
      setTitle('');
      setVendorName('');
      setAmount('');
      setShowAddModal(false);
      toast.success('Expense recorded successfully');
    } catch (err) {
      console.error('[ExpenseManager] Failed to create expense:', err);
      toast.error('Failed to save expense to Firestore');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (expense: FirestoreExpense, newStatus: 'Paid' | 'Pending' | 'Overdue') => {
    setMenuOpen(null);
    setExpenses(prev => prev.map(e => (e.id === expense.id ? { ...e, status: newStatus } : e)));
    try {
      await updateExpense(expense.id, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
    } catch {
      setExpenses(prev => prev.map(e => (e.id === expense.id ? { ...e, status: expense.status } : e)));
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    setMenuOpen(null);
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

  if (!eventId) {
    return (
      <div className="expense-manager-page" style={{ padding: '32px 18px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No active event selected. Please select or create an event first.</p>
      </div>
    );
  }

  return (
    <div className="expense-manager-page">
      {/* 3 Metric Summary Badges */}
      <div className="expense-metrics-grid">
        <div className="metric-pill-box paid">
          <span className="metric-amt">₹{paidTotal.toLocaleString('en-IN')}</span>
          <span className="metric-lbl">Paid</span>
        </div>
        <div className="metric-pill-box pending">
          <span className="metric-amt">₹{pendingTotal.toLocaleString('en-IN')}</span>
          <span className="metric-lbl">Pending</span>
        </div>
        <div className={`metric-pill-box ${isOverBudget ? 'overdue' : ''}`}>
          <span className="metric-amt">
            {isOverBudget ? `₹${overBudgetAmount.toLocaleString('en-IN')}` : `₹${Math.max(0, plannedBudget - totalSpent).toLocaleString('en-IN')}`}
          </span>
          <span className="metric-lbl">{isOverBudget ? 'Over Budget' : 'Remaining'}</span>
        </div>
      </div>

      {/* Filter Tabs & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
        <div className="expense-filter-tabs">
          {(['All', 'Paid', 'Pending', 'Overdue'] as const).map(tab => (
            <button
              key={tab}
              className={`expense-tab-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '13px',
          }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Expense List */}
      <div className="expenses-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#dc2626' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 8px' }} />
            <p>{error}</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
              {filter === 'All' ? 'No expenses recorded yet for this event.' : `No ${filter.toLowerCase()} expenses found.`}
            </p>
            {filter === 'All' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}
                onClick={() => setShowAddModal(true)}
              >
                + Record Your First Expense
              </button>
            )}
          </div>
        ) : (
          filteredExpenses.map(exp => (
            <div key={exp.id} className="expense-item-row" style={{ position: 'relative' }}>
              <div className="expense-item-info">
                <span className="exp-vendor">{exp.vendorName}</span>
                <span className="exp-title">{exp.title}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{exp.category}</span>
                  {exp.date && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>• {exp.date}</span>}
                </div>
              </div>

              <div className="expense-item-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span className="exp-amount">₹{(Number(exp.amount) || 0).toLocaleString('en-IN')}</span>
                  <span className={`exp-status-pill status-${exp.status.toLowerCase()}`}>
                    {exp.status}
                  </span>
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    className="icon-btn-ghost"
                    onClick={() => setMenuOpen(menuOpen === exp.id ? null : exp.id)}
                    style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {menuOpen === exp.id && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        background: '#ffffff',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 20,
                        minWidth: '140px',
                        padding: '4px',
                      }}
                    >
                      <button
                        onClick={() => handleStatusChange(exp, 'Paid')}
                        style={{ display: 'flex', width: '100%', padding: '6px 10px', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => handleStatusChange(exp, 'Pending')}
                        style={{ display: 'flex', width: '100%', padding: '6px 10px', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                      >
                        Mark as Pending
                      </button>
                      <button
                        onClick={() => handleStatusChange(exp, 'Overdue')}
                        style={{ display: 'flex', width: '100%', padding: '6px 10px', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                      >
                        Mark as Overdue
                      </button>
                      <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-default)' }} />
                      <button
                        onClick={() => handleDelete(exp.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '6px 10px', fontSize: '12px', color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: 0, color: 'var(--color-tuxedo-black)' }}>
                Add New Expense
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                  Item / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Venue advance deposit"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 50000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as 'Paid' | 'Pending' | 'Overdue')}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                  Vendor / Payee
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Palace Banquet"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff' }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>{saving ? 'Saving...' : 'Add Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
