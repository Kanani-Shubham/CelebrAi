import { logger } from '../../utils/logger';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Building2,
  Utensils,
  Sparkles,
  Camera,
  Package,
  Loader2,
  AlertCircle,
  ArrowRight,
  Music,
} from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { getEventExpenses } from '../../services/firebase/firestore';
import './BudgetDashboard.css';

interface CategoryTheme {
  icon: typeof Building2;
  bg: string;
  color: string;
  barColor: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  Catering: {
    icon: Utensils,
    bg: '#FEF3C7',
    color: '#B45309',
    barColor: '#F59E0B',
  },
  Food: {
    icon: Utensils,
    bg: '#FEF3C7',
    color: '#B45309',
    barColor: '#F59E0B',
  },
  Venue: {
    icon: Building2,
    bg: '#DBEAFE',
    color: '#1D4ED8',
    barColor: '#3B82F6',
  },
  'Decor & Styling': {
    icon: Sparkles,
    bg: '#EDE9FE',
    color: '#6D28D9',
    barColor: '#8B5CF6',
  },
  Decor: {
    icon: Sparkles,
    bg: '#EDE9FE',
    color: '#6D28D9',
    barColor: '#8B5CF6',
  },
  'Photography & Video': {
    icon: Camera,
    bg: '#FFE4E6',
    color: '#BE123C',
    barColor: '#F43F5E',
  },
  Photography: {
    icon: Camera,
    bg: '#FFE4E6',
    color: '#BE123C',
    barColor: '#F43F5E',
  },
  Entertainment: {
    icon: Music,
    bg: '#DCFCE7',
    color: '#047857',
    barColor: '#10B981',
  },
  Music: {
    icon: Music,
    bg: '#DCFCE7',
    color: '#047857',
    barColor: '#10B981',
  },
  Miscellaneous: {
    icon: Package,
    bg: '#F1F5F9',
    color: '#334155',
    barColor: '#64748B',
  },
  Other: {
    icon: Package,
    bg: '#F1F5F9',
    color: '#334155',
    barColor: '#64748B',
  },
};

const DEFAULT_CATEGORY_THEME: CategoryTheme = {
  icon: Package,
  bg: '#F4EFFF',
  color: '#7E57C2',
  barColor: '#8B5CF6',
};

interface CategorySummary {
  name: string;
  spent: number;
  theme: CategoryTheme;
}

export function BudgetDashboard() {
  const navigate = useNavigate();
  const { activeEvent } = useEvent();

  const [expenses, setExpenses] = useState<{ amount: number; category: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const eventId = activeEvent?.id;

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
        if (!ignore) {
          setExpenses((data || []) as unknown as { amount: number; category: string; status: string }[]);
        }
      } catch (err) {
        logger.warn('[BudgetDashboard] Error loading expenses:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchExpenses();
    return () => { ignore = true; };
  }, [eventId]);

  const totalBudget = Number(activeEvent?.budget) || 0;
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remaining = Math.max(0, totalBudget - totalSpent);
  const usedPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const isOverBudget = totalBudget > 0 && totalSpent > totalBudget;

  // Group by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
  });

  const categoryList: CategorySummary[] = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, spent]) => ({
      name,
      spent,
      theme: CATEGORY_THEMES[name] || DEFAULT_CATEGORY_THEME,
    }));

  if (!eventId) {
    return (
      <div className="budget-dashboard-page p-4 text-center">
        <p className="text-muted">No active event selected. Please select or create an event to track your budget.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="budget-dashboard-page flex-center min-h-50">
        <Loader2 className="animate-spin text-tuxedo" size={28} />
      </div>
    );
  }

  return (
    <div className="budget-dashboard-page">
      {/* Top Header Card with Circular Donut */}
      <div className="budget-overview-card">
        <div className="budget-top-row">
          <div className="budget-text-col">
            <span className="budget-label">Total Planned Budget</span>
            <h1 className="budget-total-amt">₹{totalBudget.toLocaleString('en-IN')}</h1>
            {isOverBudget && (
              <span className="text-error text-xs font-semibold inline-flex items-center gap-1 mt-1">
                <AlertCircle size={14} /> Over budget by ₹{(totalSpent - totalBudget).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Donut progress */}
          <div className="budget-donut-wrap">
            <svg className="donut-svg" viewBox="0 0 36 36">
              <path
                className="donut-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="donut-fill"
                strokeDasharray={`${usedPercent}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="donut-center-text">
              <span className="donut-pct">{usedPercent}%</span>
              <span className="donut-sub">Used</span>
            </div>
          </div>
        </div>

        <div className="budget-meta-row">
          <div className="b-meta-col">
            <span className="b-meta-val">₹{totalSpent.toLocaleString('en-IN')}</span>
            <span className="b-meta-lbl">Total Recorded</span>
          </div>
          <div className="b-meta-col text-right">
            <span className="b-meta-val">₹{remaining.toLocaleString('en-IN')}</span>
            <span className="b-meta-lbl">Remaining</span>
          </div>
        </div>
      </div>

      {/* Planned vs Actual Cards */}
      <div className="plan-actual-grid">
        <div className="plan-card">
          <div className="plan-card-icon">
            <Wallet size={16} />
          </div>
          <div>
            <span className="pa-lbl">Planned Budget</span>
            <strong className="pa-amt">₹{totalBudget.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div className="plan-card cursor-pointer" onClick={() => navigate('/expenses')}>
          <div className="plan-card-icon spent">
            <TrendingUp size={16} />
          </div>
          <div>
            <span className="pa-lbl">Actual Recorded</span>
            <strong className="pa-amt">₹{totalSpent.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Category Breakdown Header */}
      <div className="category-section-header">
        <h2 className="category-section-title font-serif">
          Category Breakdown
        </h2>
        <button
          type="button"
          className="manage-expenses-btn"
          onClick={() => navigate('/expenses')}
        >
          <span>Manage Expenses</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Individual Category Cards Grid */}
      <div className="category-cards-grid">
        {categoryList.length === 0 ? (
          <div className="category-empty-state">
            <p className="text-sm mb-2">No expense records added yet.</p>
            <button className="btn btn-primary btn btn-secondary rounded-full text-xs"
              type="button"
              onClick={() => navigate('/expenses')}
            >
              + Add First Expense
            </button>
          </div>
        ) : (
          categoryList.map(cat => {
            const Icon = cat.theme.icon;
            const pct = totalSpent > 0 ? Math.min(100, Math.round((cat.spent / totalSpent) * 100)) : 0;
            return (
              <div key={cat.name} className="category-expense-card">
                <div className="cat-card-header">
                  <div className="cat-header-left">
                    <div
                      className="cat-icon-badge"
                      style={{ backgroundColor: cat.theme.bg, color: cat.theme.color }}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="cat-card-name">{cat.name}</span>
                  </div>
                  <strong className="cat-card-amount">₹{cat.spent.toLocaleString('en-IN')}</strong>
                </div>

                <div className="cat-card-progress-track">
                  <div
                    className="cat-card-progress-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cat.theme.barColor,
                    }}
                  />
                </div>

                <div className="cat-card-meta">
                  <span>{pct}% of recorded spend</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
