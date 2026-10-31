import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Plus, Loader2 } from 'lucide-react';
import { toast } from '../../../components/ui';
import { type FirestoreExpense, CATEGORIES } from './types';

interface ExpenseModalProps {
  isOpen: boolean;
  editingExpense: FirestoreExpense | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (expenseData: {
    title: string;
    vendorName: string;
    amount: number;
    category: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    date: string;
  }) => void;
}

export function ExpenseModal({
  isOpen,
  editingExpense,
  saving,
  onClose,
  onSubmit,
}: ExpenseModalProps) {
  const [vendorName, setVendorName] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Venue');
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title || '');
      setVendorName(
        editingExpense.vendorName === 'Allocated Budget' ? '' : (editingExpense.vendorName || '')
      );
      setAmount(String(editingExpense.amount || ''));
      setCategory(editingExpense.category || 'Other');
      setStatus(editingExpense.status || 'Pending');
      setDate(editingExpense.date || new Date().toISOString().split('T')[0]);
    } else {
      setTitle('');
      setVendorName('');
      setAmount('');
      setCategory('Venue');
      setStatus('Pending');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const numAmount = Math.max(0, Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    onSubmit({
      title: title.trim(),
      vendorName: vendorName.trim() || (editingExpense?.vendorName === 'Allocated Budget' ? 'Allocated Budget' : 'Vendor'),
      amount: numAmount,
      category,
      status,
      date: date || new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div
      className="expense-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editingExpense ? 'Edit Expense' : 'Add New Expense'}
    >
      <div className="expense-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="expense-modal-header">
          <h3 className="expense-modal-title">
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          <button
            type="button"
            className="expense-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label className="form-label">Item / Description *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Venue advance deposit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                className="form-input"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Paid' | 'Pending' | 'Overdue')}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Vendor / Payee</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Royal Palace Banquet"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
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
  );
}
