import { CheckCircle2, Clock, Wallet } from 'lucide-react';

interface ExpenseMetricsProps {
  paid: number;
  pending: number;
  remaining: number;
}

export function ExpenseMetrics({ paid, pending, remaining }: ExpenseMetricsProps) {
  return (
    <div className="expense-metrics-grid">
      <div className="metric-pill-box paid">
        <div className="metric-header">
          <span className="metric-lbl">Paid</span>
          <CheckCircle2 size={16} className="metric-icon" />
        </div>
        <span className="metric-amt">₹{paid.toLocaleString('en-IN')}</span>
      </div>

      <div className="metric-pill-box pending">
        <div className="metric-header">
          <span className="metric-lbl">Pending</span>
          <Clock size={16} className="metric-icon" />
        </div>
        <span className="metric-amt">₹{pending.toLocaleString('en-IN')}</span>
      </div>

      <div className="metric-pill-box remaining">
        <div className="metric-header">
          <span className="metric-lbl">Remaining</span>
          <Wallet size={16} className="metric-icon" />
        </div>
        <span className="metric-amt">₹{remaining.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
