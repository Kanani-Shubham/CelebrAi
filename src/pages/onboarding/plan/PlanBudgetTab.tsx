import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { BudgetItem } from './types';

interface PlanBudgetTabProps {
  budgetBreakdown: BudgetItem[];
  totalAllocatedBudget: number;
  targetBudget: number;
  budgetDifference: number;
  onOpenAddBudget: () => void;
  onOpenEditBudget: (idx: number) => void;
  onDeleteBudget: (idx: number) => void;
}

export function PlanBudgetTab({
  budgetBreakdown,
  totalAllocatedBudget,
  targetBudget,
  budgetDifference,
  onOpenAddBudget,
  onOpenEditBudget,
  onDeleteBudget,
}: PlanBudgetTabProps) {
  return (
    <div className="tab-pane-container">
      {/* Dynamic Budget Banner with real-time recalculation */}
      <div className="budget-summary-banner">
        <div className="budget-summary-row">
          <div>
            <span className="summary-label-sm">Total Estimated Budget</span>
            <h2 className="budget-sum-val">₹{totalAllocatedBudget.toLocaleString('en-IN')}</h2>
          </div>
          <div className="budget-target-col">
            <span className="summary-label-sm">Target Budget</span>
            <span className="budget-target-val">₹{targetBudget.toLocaleString('en-IN')}</span>
            <span className={`budget-status-pill ${budgetDifference >= 0 ? 'status-ok' : 'status-over'}`}>
              {budgetDifference >= 0
                ? `₹${budgetDifference.toLocaleString('en-IN')} remaining`
                : `₹${Math.abs(budgetDifference).toLocaleString('en-IN')} over target`}
            </span>
          </div>
        </div>
      </div>

      <div className="tab-pane-header">
        <div>
          <h3 className="section-heading">Budget Allocations ({budgetBreakdown.length})</h3>
          <p className="section-subheading">Amounts recalculate immediately when updated.</p>
        </div>
        <button onClick={onOpenAddBudget} className="btn-add-action" aria-label="Add budget item">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="budget-preview-list">
        {budgetBreakdown.map((b, i) => (
          <div key={i} className="interactive-card budget-card">
            <div className="card-main-info">
              <strong className="card-title">{b.category}</strong>
              {b.notes && <p className="card-notes">{b.notes}</p>}
            </div>
            <div className="card-actions">
              <span className="budget-amount-display">
                ₹{Number(b.estimatedAmount).toLocaleString('en-IN')}
              </span>
              <button
                onClick={() => onOpenEditBudget(i)}
                className="btn-icon-action"
                aria-label={`Edit ${b.category} allocation`}
                title="Edit Allocation"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => onDeleteBudget(i)}
                className="btn-icon-action btn-danger"
                aria-label={`Delete ${b.category} allocation`}
                title="Delete Allocation"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
