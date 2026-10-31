import {
  MoreVertical,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { type FirestoreExpense, getCategoryTheme } from './types';

interface ExpenseCardProps {
  expense: FirestoreExpense;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: (expense: FirestoreExpense) => void;
  onStatusChange: (expense: FirestoreExpense, status: 'Paid' | 'Pending' | 'Overdue') => void;
  onDelete: (id: string, title?: string) => void;
}

export function ExpenseCard({
  expense,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onStatusChange,
  onDelete,
}: ExpenseCardProps) {
  const theme = getCategoryTheme(expense.category || expense.title);
  const Icon = theme.icon;
  const isAllocated = expense.vendorName === 'Allocated Budget';
  const categoryName = expense.category || expense.title || 'Expense';

  return (
    <div className="expense-card">
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
            onClick={onToggleMenu}
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <div className="expense-menu-dropdown">
              <button
                type="button"
                className="expense-menu-item"
                onClick={() => onEdit(expense)}
              >
                <Edit2 size={14} />
                <span>Edit expense</span>
              </button>

              {expense.status !== 'Paid' && (
                <button
                  type="button"
                  className="expense-menu-item"
                  onClick={() => onStatusChange(expense, 'Paid')}
                >
                  <CheckCircle2 size={14} />
                  <span>Mark as Paid</span>
                </button>
              )}

              {expense.status !== 'Pending' && (
                <button
                  type="button"
                  className="expense-menu-item"
                  onClick={() => onStatusChange(expense, 'Pending')}
                >
                  <Clock size={14} />
                  <span>Mark as Pending</span>
                </button>
              )}

              {expense.status !== 'Overdue' && (
                <button
                  type="button"
                  className="expense-menu-item"
                  onClick={() => onStatusChange(expense, 'Overdue')}
                >
                  <AlertTriangle size={14} />
                  <span>Mark as Overdue</span>
                </button>
              )}

              <hr className="expense-menu-divider" />

              <button
                type="button"
                className="expense-menu-item delete"
                onClick={() => onDelete(expense.id, expense.title || categoryName)}
              >
                <Trash2 size={14} />
                <span>Delete expense</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="expense-card-middle">
        {isAllocated ? (
          <>
            <div className="expense-subtitle">
              {expense.title && expense.title !== expense.category
                ? expense.title
                : `${categoryName} planned allocation`}
            </div>
            <div className="expense-allocated-label">
              Allocated Budget: <strong>₹{(Number(expense.amount) || 0).toLocaleString('en-IN')}</strong>
            </div>
          </>
        ) : (
          <>
            <div className="expense-subtitle">{expense.title}</div>
            {expense.vendorName && expense.vendorName !== 'Vendor' && (
              <div className="expense-vendor-label">
                Vendor: <span>{expense.vendorName}</span>
              </div>
            )}
          </>
        )}
        {expense.date && <div className="expense-date-label">Date: {expense.date}</div>}
      </div>

      <div className="expense-card-bottom">
        <div className="expense-amount-val">
          ₹{(Number(expense.amount) || 0).toLocaleString('en-IN')}
        </div>
        <span className={`expense-status-badge badge-${expense.status.toLowerCase()}`}>
          {expense.status === 'Paid' && <CheckCircle2 size={12} />}
          {expense.status === 'Pending' && <Clock size={12} />}
          {expense.status === 'Overdue' && <AlertTriangle size={12} />}
          <span>{expense.status}</span>
        </span>
      </div>
    </div>
  );
}
