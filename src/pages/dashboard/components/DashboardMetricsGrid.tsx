import { Wallet, CheckCircle2, Users, MailCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardMetricsGridProps {
  budgetLeft: number;
  completedTasks: number;
  totalTasks: number;
  overdueTasks: number;
  guestCount: number;
  rsvpCount: number;
}

export function DashboardMetricsGrid({
  budgetLeft,
  completedTasks,
  totalTasks,
  overdueTasks,
  guestCount,
  rsvpCount,
}: DashboardMetricsGridProps) {
  const navigate = useNavigate();

  return (
    <div className="stats-badges-grid">
      <div className="stat-badge-item" onClick={() => navigate('/budget')}>
        <div className="stat-icon-wrap icon-budget">
          <Wallet size={16} />
        </div>
        <span className="stat-val">₹{budgetLeft.toLocaleString('en-IN')}</span>
        <span className="stat-sub">Budget Left</span>
      </div>

      <div className="stat-badge-item" onClick={() => navigate('/tasks')}>
        <div className="stat-icon-wrap icon-tasks">
          <CheckCircle2 size={16} />
        </div>
        <span className="stat-val">{completedTasks}/{totalTasks}</span>
        <span className="stat-sub">Tasks Done</span>
        {overdueTasks > 0 && (
          <span className="stat-overdue-alert">
            <AlertTriangle size={10} /> {overdueTasks} overdue
          </span>
        )}
      </div>

      <div className="stat-badge-item" onClick={() => navigate('/guests')}>
        <div className="stat-icon-wrap icon-guests">
          <Users size={16} />
        </div>
        <span className="stat-val">{guestCount}</span>
        <span className="stat-sub">Guests</span>
      </div>

      <div className="stat-badge-item" onClick={() => navigate('/guests')}>
        <div className="stat-icon-wrap icon-rsvp">
          <MailCheck size={16} />
        </div>
        <span className="stat-val">{rsvpCount}</span>
        <span className="stat-sub">RSVP</span>
      </div>
    </div>
  );
}

