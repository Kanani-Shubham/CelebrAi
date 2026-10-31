import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Loader2, AlertCircle, Package } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { useExpenses } from './expenses/useExpenses';
import { ExpenseMetrics } from './expenses/ExpenseMetrics';
import { ExpenseCard } from './expenses/ExpenseCard';
import { ExpenseModal } from './expenses/ExpenseModal';
import type { FirestoreExpense } from './expenses/types';

// Re-exports for consumers and unit tests
export type { FirestoreExpense } from './expenses/types';


import './ExpenseManager.css';

export function ExpenseManager() {
  const navigate = useNavigate();
  const { activeEvent } = useEvent();
  const eventId = activeEvent?.id;

  const {
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
  } = useExpenses(eventId);

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FirestoreExpense | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

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

  const openAddModal = () => {
    setMenuOpen(null);
    setEditingExpense(null);
    setShowModal(true);
  };

  const openEditModal = (exp: FirestoreExpense) => {
    setMenuOpen(null);
    setEditingExpense(exp);
    setShowModal(true);
  };

  const handleModalSubmit = async (formData: {
    title: string;
    vendorName: string;
    amount: number;
    category: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    date: string;
  }) => {
    if (editingExpense) {
      const ok = await editExpense(editingExpense.id, formData);
      if (ok) {
        setShowModal(false);
        setEditingExpense(null);
      }
    } else if (eventId) {
      const ok = await addExpense({ ...formData, eventId });
      if (ok) {
        setShowModal(false);
        setEditingExpense(null);
      }
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
      <ExpenseMetrics
        paid={summary.paid}
        pending={summary.pending}
        remaining={summary.remaining}
      />

      {/* 2. Filter Tabs & Add Button Toolbar */}
      <div className="expense-toolbar">
        <div className="expense-filter-tabs">
          {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((tab) => (
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

        <button type="button" className="btn-add-expense" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* 3. Expense Cards List */}
      <div className="expenses-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2
              size={24}
              className="animate-spin"
              style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }}
            />
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
          filteredExpenses.map((exp) => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              isMenuOpen={menuOpen === exp.id}
              onToggleMenu={() => setMenuOpen(menuOpen === exp.id ? null : exp.id)}
              onEdit={openEditModal}
              onStatusChange={setExpenseStatus}
              onDelete={removeExpense}
            />
          ))
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={showModal}
        editingExpense={editingExpense}
        saving={saving}
        onClose={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
