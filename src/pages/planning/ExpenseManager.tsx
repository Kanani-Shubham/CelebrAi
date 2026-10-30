import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  AlertCircle,
  X,
  Building2,
  Utensils,
  Sparkles,
  Camera,
  Music,
  Mail,
  Shirt,
  Car,
  Package,
  Edit2,
  Wallet,
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

export interface FirestoreExpense {
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

export const DEMO_EXPENSES: FirestoreExpense[] = [
  { id: 'exp-1', vendorName: 'Grand Palace Banquet', title: 'Venue booking advance', amount: 150000, status: 'Paid', category: 'Venue', eventId: 'evt-1' },
  { id: 'exp-2', vendorName: 'Royal Florals & Decor', title: 'Decor planned allocation', amount: 80000, status: 'Overdue', category: 'Decor', eventId: 'evt-1' },
  { id: 'exp-3', vendorName: 'DJ & Sound Wave', title: 'Entertainment planned allocation', amount: 30000, status: 'Overdue', category: 'Entertainment', eventId: 'evt-1' },
  { id: 'exp-4', vendorName: 'Shreeji Gourmet Catering', title: 'Catering 50% advance', amount: 60000, status: 'Pending', category: 'Catering', eventId: 'evt-1' },
  { id: 'exp-5', vendorName: 'Studio Memories', title: 'Photography package', amount: 180000, status: 'Paid', category: 'Photography', eventId: 'evt-1' },
];

const CATEGORIES = [
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

interface CategoryTheme {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  bg: string;
  color: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
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

const DEFAULT_THEME: CategoryTheme = {
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
 * - Remaining Total = Sum of expenses with status 'overdue' (matching requested rule)
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

export function ExpenseManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent } = useEvent();

  const [expenses, setExpenses] = useState<FirestoreExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FirestoreExpense | null>(null);
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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && !(e.target as HTMLElement).closest('.expense-card-menu-container')) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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
      if (data && data.length > 0) {
        setExpenses(data as FirestoreExpense[]);
      } else {
        setExpenses(DEMO_EXPENSES);
      }
    } catch (err) {
      console.error('[ExpenseManager] Error loading expenses:', err);
      setExpenses(DEMO_EXPENSES);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Derived budget calculations using normalized status matching
  const { paid: paidTotal, pending: pendingTotal, overdue: overdueTotal, remaining: remainingTotal } =
    React.useMemo(() => calculateExpenseSummary(expenses), [expenses]);

  const filteredExpenses = expenses.filter(e => {
    if (filter === 'All') return true;
    return (e.status || '').trim().toLowerCase() === filter.toLowerCase();
  });

  const openAddModal = () => {
    setMenuOpen(null);
    setEditingExpense(null);
    setTitle('');
    setVendorName('');
    setAmount('');
    setCategory('Venue');
    setStatus('Pending');
    setDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const openEditModal = (exp: FirestoreExpense) => {
    setMenuOpen(null);
    setEditingExpense(exp);
    setTitle(exp.title || '');
    setVendorName(exp.vendorName === 'Allocated Budget' ? '' : (exp.vendorName || ''));
    setAmount(String(exp.amount || ''));
    setCategory(exp.category || 'Other');
    setStatus(exp.status || 'Pending');
    setDate(exp.date || new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !eventId) return;

    const numAmount = Math.max(0, Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    setSaving(true);
    try {
      if (editingExpense) {
        const updatedFields: Partial<FirestoreExpense> = {
          title: title.trim(),
          vendorName: vendorName.trim() || (editingExpense.vendorName === 'Allocated Budget' ? 'Allocated Budget' : 'Vendor'),
          amount: numAmount,
          category,
          status,
          date: date || new Date().toISOString().split('T')[0],
        };
        await updateExpense(editingExpense.id, updatedFields);
        setExpenses(prev =>
          prev.map(e => (e.id === editingExpense.id ? { ...e, ...updatedFields } : e))
        );
        toast.success('Expense updated successfully');
      } else {
        const newDoc = {
          vendorName: vendorName.trim() || 'Vendor',
          title: title.trim(),
          amount: numAmount,
          status,
          category,
          date: date || new Date().toISOString().split('T')[0],
          eventId,
        };
        const docId = await createExpense(eventId, newDoc);
        setExpenses(prev => [{ id: docId, ...newDoc }, ...prev]);
        toast.success('Expense recorded successfully');
      }
      setShowModal(false);
      setEditingExpense(null);
    } catch (err) {
      console.error('[ExpenseManager] Failed to save expense:', err);
      toast.error('Failed to save expense to Firestore');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (expense: FirestoreExpense, newStatus: 'Paid' | 'Pending' | 'Overdue') => {
    setMenuOpen(null);
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

  const handleDelete = async (id: string, titleLabel?: string) => {
    setMenuOpen(null);
    const confirmDelete = window.confirm(`Are you sure you want to delete "${titleLabel || 'this expense'}"? This cannot be undone.`);
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

  if (!eventId) {
    return (
      <div className="expense-manager-page" style={{ padding: '32px 18px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No active event selected. Please select or create an event first.</p>
      </div>
    );
  }

  return (
    <div className="expense-manager-page">
      {/* Top Header Bar with Back Button */}
      <div className="expense-top-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          title="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="expense-header-info">
          <h1 className="expense-page-title font-serif">Expenses</h1>
          <span className="expense-page-sub">
            {activeEvent?.eventName ? `Managing "${activeEvent.eventName}"` : 'Manage event expenses'}
          </span>
        </div>
      </div>

      {/* 1. 3 Metric Summary Cards */}
      <div className="expense-metrics-grid">
        <div className="metric-pill-box paid">
          <div className="metric-header">
            <span className="metric-lbl">Paid</span>
            <CheckCircle2 size={16} className="metric-icon" />
          </div>
          <span className="metric-amt">₹{paidTotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="metric-pill-box pending">
          <div className="metric-header">
            <span className="metric-lbl">Pending</span>
            <Clock size={16} className="metric-icon" />
          </div>
          <span className="metric-amt">₹{pendingTotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="metric-pill-box remaining">
          <div className="metric-header">
            <span className="metric-lbl">Remaining</span>
            <Wallet size={16} className="metric-icon" />
          </div>
          <span className="metric-amt">₹{remainingTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* 2. Filter Tabs & Add Button Toolbar */}
      <div className="expense-toolbar">
        <div className="expense-filter-tabs">
          {(['All', 'Paid', 'Pending', 'Overdue'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              className={`expense-tab-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-add-expense"
          onClick={openAddModal}
        >
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* 3. Expense Cards List */}
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
          <div className="expenses-empty-state">
            <div className="empty-icon-wrap">
              <Package size={28} />
            </div>
            <h4 className="empty-title">
              {filter === 'All' ? 'No expenses recorded yet' : `No ${filter.toLowerCase()} expenses`}
            </h4>
            <p className="empty-desc">
              {filter === 'All'
                ? 'Track your event expenses, manage vendor allocations, and stay on budget.'
                : `You do not have any expenses categorized under "${filter}".`}
            </p>
            {filter === 'All' && (
              <button
                type="button"
                className="btn-add-expense"
                style={{ marginTop: '8px' }}
                onClick={openAddModal}
              >
                <Plus size={16} />
                <span>Record Your First Expense</span>
              </button>
            )}
          </div>
        ) : (
          filteredExpenses.map(exp => {
            const theme = getCategoryTheme(exp.category || exp.title);
            const Icon = theme.icon;
            const isAllocated = exp.vendorName === 'Allocated Budget';
            const categoryName = exp.category || exp.title || 'Expense';

            return (
              <div key={exp.id} className="expense-card">
                {/* Top row: Icon, Category Name, Three-Dot Menu */}
                <div className="expense-card-top">
                  <div className="expense-card-top-left">
                    <div
                      className="expense-category-icon"
                      style={{ backgroundColor: theme.bg, color: theme.color }}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="expense-category-name">{categoryName}</span>
                  </div>

                  <div className="expense-card-menu-container">
                    <button
                      type="button"
                      className="expense-menu-btn"
                      aria-label="Expense options"
                      onClick={() => setMenuOpen(menuOpen === exp.id ? null : exp.id)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {menuOpen === exp.id && (
                      <div className="expense-menu-dropdown">
                        <button
                          type="button"
                          className="expense-menu-item"
                          onClick={() => openEditModal(exp)}
                        >
                          <Edit2 size={14} />
                          <span>Edit expense</span>
                        </button>

                        {exp.status !== 'Paid' && (
                          <button
                            type="button"
                            className="expense-menu-item"
                            onClick={() => handleStatusChange(exp, 'Paid')}
                          >
                            <CheckCircle2 size={14} />
                            <span>Mark as Paid</span>
                          </button>
                        )}

                        {exp.status !== 'Pending' && (
                          <button
                            type="button"
                            className="expense-menu-item"
                            onClick={() => handleStatusChange(exp, 'Pending')}
                          >
                            <Clock size={14} />
                            <span>Mark as Pending</span>
                          </button>
                        )}

                        {exp.status !== 'Overdue' && (
                          <button
                            type="button"
                            className="expense-menu-item"
                            onClick={() => handleStatusChange(exp, 'Overdue')}
                          >
                            <AlertTriangle size={14} />
                            <span>Mark as Overdue</span>
                          </button>
                        )}

                        <hr className="expense-menu-divider" />

                        <button
                          type="button"
                          className="expense-menu-item delete"
                          onClick={() => handleDelete(exp.id, exp.title || categoryName)}
                        >
                          <Trash2 size={14} />
                          <span>Delete expense</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle row: Clean labels, no string concatenation */}
                <div className="expense-card-middle">
                  {isAllocated ? (
                    <>
                      <div className="expense-subtitle">
                        {exp.title && exp.title !== exp.category ? exp.title : `${categoryName} planned allocation`}
                      </div>
                      <div className="expense-allocated-label">
                        Allocated Budget: <strong>₹{(Number(exp.amount) || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="expense-subtitle">{exp.title}</div>
                      {exp.vendorName && exp.vendorName !== 'Vendor' && (
                        <div className="expense-vendor-label">
                          Vendor: <span>{exp.vendorName}</span>
                        </div>
                      )}
                    </>
                  )}
                  {exp.date && <div className="expense-date-label">Date: {exp.date}</div>}
                </div>

                {/* Bottom row: Amount & Status Badge */}
                <div className="expense-card-bottom">
                  <div className="expense-amount-val">
                    ₹{(Number(exp.amount) || 0).toLocaleString('en-IN')}
                  </div>
                  <span className={`expense-status-badge badge-${exp.status.toLowerCase()}`}>
                    {exp.status === 'Paid' && <CheckCircle2 size={12} />}
                    {exp.status === 'Pending' && <Clock size={12} />}
                    {exp.status === 'Overdue' && <AlertTriangle size={12} />}
                    <span>{exp.status}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {showModal && (
        <div
          className="expense-modal-backdrop"
          onClick={() => {
            setShowModal(false);
            setEditingExpense(null);
          }}
        >
          <div
            className="expense-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="expense-modal-header">
              <h3 className="expense-modal-title">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button
                type="button"
                className="expense-modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingExpense(null);
                }}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="expense-form">
              <div className="form-group">
                <label className="form-label">
                  Item / Description *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Venue advance deposit"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    className="form-input"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Status
                  </label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={e => setStatus(e.target.value as 'Paid' | 'Pending' | 'Overdue')}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Vendor / Payee
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Royal Palace Banquet"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Category
                  </label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingExpense(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingExpense ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  <span>{saving ? 'Saving...' : editingExpense ? 'Save Changes' : 'Add Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
