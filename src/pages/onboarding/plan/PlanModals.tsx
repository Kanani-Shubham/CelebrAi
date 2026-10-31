import React from 'react';
import { X, Loader2, LogIn } from 'lucide-react';
import type { TaskItem } from './types';

// ========================================================
// 1. OVERVIEW MODAL
// ========================================================
interface OverviewModalProps {
  isOpen: boolean;
  form: {
    eventName: string;
    conceptSummary: string;
    location: string;
    guestCount: number;
    budget: number;
  };
  onFormChange: (form: OverviewModalProps['form']) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export function OverviewModal({
  isOpen,
  form,
  onFormChange,
  onClose,
  onSave,
}: OverviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Event Overview</h3>
          <button onClick={onClose} className="btn-icon-close" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="modal-form">
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              required
              value={form.eventName}
              onChange={(e) => onFormChange({ ...form, eventName: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Concept Summary</label>
            <textarea
              rows={4}
              value={form.conceptSummary}
              onChange={(e) => onFormChange({ ...form, conceptSummary: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => onFormChange({ ...form, location: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Guest Count</label>
              <input
                type="number"
                min="1"
                value={form.guestCount}
                onChange={(e) =>
                  onFormChange({ ...form, guestCount: parseInt(e.target.value) || 0 })
                }
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================================================
// 2. TASK MODAL
// ========================================================
interface TaskModalProps {
  mode: 'add' | 'edit' | null;
  form: TaskItem;
  onFormChange: (form: TaskItem) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export function TaskModal({
  mode,
  form,
  onFormChange,
  onClose,
  onSave,
}: TaskModalProps) {
  if (!mode) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'add' ? 'Add New Task' : 'Edit Task'}
          </h3>
          <button onClick={onClose} className="btn-icon-close" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="modal-form">
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Confirm catering tasting menu"
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={form.category}
                onChange={(e) => onFormChange({ ...form, category: e.target.value })}
                className="form-select"
              >
                <option value="Venue">Venue</option>
                <option value="Catering">Catering</option>
                <option value="Decor">Decor</option>
                <option value="Photography">Photography</option>
                <option value="Invitations">Invitations</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Logistics">Logistics</option>
                <option value="Attire">Attire</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    priority: e.target.value as 'high' | 'medium' | 'low',
                  })
                }
                className="form-select"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date / Target Timeframe</label>
            <input
              type="text"
              placeholder="e.g. 2 weeks before or 2026-11-15"
              value={form.suggestedDueDate || ''}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  suggestedDueDate: e.target.value.trim() ? e.target.value : null,
                })
              }
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'add' ? 'Add Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================================================
// 3. BUDGET MODAL
// ========================================================
interface BudgetModalProps {
  mode: 'add' | 'edit' | null;
  form: {
    category: string;
    amount: string;
    notes: string;
  };
  onFormChange: (form: BudgetModalProps['form']) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export function BudgetModal({
  mode,
  form,
  onFormChange,
  onClose,
  onSave,
}: BudgetModalProps) {
  if (!mode) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'add' ? 'Add Budget Category' : 'Edit Budget Item'}
          </h3>
          <button onClick={onClose} className="btn-icon-close" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="modal-form">
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Photography & Videography"
              value={form.category}
              onChange={(e) => onFormChange({ ...form, category: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Amount (₹) *</label>
            <input
              type="number"
              min="0"
              step="100"
              required
              placeholder="e.g. 50000"
              value={form.amount}
              onChange={(e) => onFormChange({ ...form, amount: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Breakdown</label>
            <input
              type="text"
              placeholder="e.g. Full-day coverage, edited album, highlight video"
              value={form.notes}
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'add' ? 'Add Category' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================================================
// 4. MILESTONE MODAL
// ========================================================
interface MilestoneModalProps {
  mode: 'add' | 'edit' | null;
  form: {
    title: string;
    description: string;
    targetDate: string | null;
  };
  onFormChange: (form: MilestoneModalProps['form']) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export function MilestoneModal({
  mode,
  form,
  onFormChange,
  onClose,
  onSave,
}: MilestoneModalProps) {
  if (!mode) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'add' ? 'Add Milestone' : 'Edit Milestone'}
          </h3>
          <button onClick={onClose} className="btn-icon-close" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="modal-form">
          <div className="form-group">
            <label className="form-label">Milestone Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Venue Booking Confirmation"
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Status Details</label>
            <textarea
              rows={3}
              placeholder="e.g. Sign contract and deposit paid for venue."
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'add' ? 'Add Milestone' : 'Save Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================================================
// 5. AUTH PROMPT MODAL
// ========================================================
interface AuthModalProps {
  isOpen: boolean;
  authLoading: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  onEmailSignIn: () => void;
}

export function AuthModal({
  isOpen,
  authLoading,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Sign In to Save Plan</h3>
          <button onClick={onClose} className="btn-icon-close" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="auth-modal-content">
          <div className="auth-modal-icon">
            <LogIn size={28} />
          </div>
          <h4 className="auth-modal-h4">Save Your Tailored Blueprint</h4>
          <p className="auth-modal-desc">
            Your AI-generated tasks, budget breakdown, and milestones are ready. Create an
            account or sign in to save this event securely to your CelebrAI workspace.
          </p>

          <button
            type="button"
            className="btn btn-primary btn-full google-signin-btn"
            onClick={onGoogleSignIn}
            disabled={authLoading}
          >
            {authLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={onEmailSignIn}
          >
            Sign In with Email / Password
          </button>
        </div>
      </div>
    </div>
  );
}
