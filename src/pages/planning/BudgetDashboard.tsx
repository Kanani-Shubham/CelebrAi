import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Building2,
  Utensils,
  Sparkles,
  Camera,
  Package,
  Plus,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
import { getEventExpenses } from '../../services/firebase/firestore';
import './BudgetDashboard.css';

interface CategorySummary {
  name: string;
  spent: number;
  icon: typeof Building2;
}

const CATEGORY_ICON_MAP: Record<string, typeof Building2> = {
  Venue: Building2,
  Catering: Utensils,
  'Decor & Styling': Sparkles,
  Decor: Sparkles,
  'Photography & Video': Camera,
  Photography: Camera,
  Other: Package,
};

export function BudgetDashboard() {
  const navigate = useNavigate();
  const { activeEvent } = useEvent();

  const [expenses, setExpenses] = useState<{ amount: number; category: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const eventId = activeEvent?.id;

  const loadData = useCallback(async () => {
    if (!eventId) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getEventExpenses(eventId);
      setExpenses((data || []) as unknown as { amount: number; category: string; status: string }[]);
    } catch (err) {
      console.warn('[BudgetDashboard] Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const categoryList: CategorySummary[] = Object.entries(categoryTotals).map(([name, spent]) => ({
    name,
    spent,
    icon: CATEGORY_ICON_MAP[name] || Package,
  }));

  if (!eventId) {
    return (
      <div className="budget-dashboard-page" style={{ padding: '32px 18px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No active event selected. Please select or create an event to track your budget.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="budget-dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-tuxedo-black)' }} />
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
              <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
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

        <div className="plan-card" onClick={() => navigate('/expenses')} style={{ cursor: 'pointer' }}>
          <div className="plan-card-icon spent">
            <TrendingUp size={16} />
          </div>
          <div>
            <span className="pa-lbl">Actual Recorded</span>
            <strong className="pa-amt">₹{totalSpent.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Action banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '8px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: 0, color: 'var(--color-tuxedo-black)' }}>
          Category Breakdown
        </h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/expenses')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
        >
          <span>Manage Expenses</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Category List */}
      <div className="category-spending-list">
        {categoryList.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '30px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>No expense records added yet.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/expenses')}
              style={{ fontSize: '13px', padding: '6px 16px', borderRadius: 'var(--radius-full)' }}
            >
              + Add First Expense
            </button>
          </div>
        ) : (
          categoryList.map(cat => {
            const Icon = cat.icon;
            const pct = totalSpent > 0 ? Math.round((cat.spent / totalSpent) * 100) : 0;
            return (
              <div key={cat.name} className="cat-row-item">
                <div className="cat-icon-col">
                  <Icon size={18} />
                </div>
                <div className="cat-info-col">
                  <div className="cat-name-row">
                    <span className="cat-name-text">{cat.name}</span>
                    <span className="cat-amt-text">₹{cat.spent.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="cat-progress-track">
                    <div className="cat-progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>{pct}% of recorded spend</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
