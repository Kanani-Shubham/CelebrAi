import React from 'react';
import { subscribeToasts, type Toast } from './toast';
import './ui.css';

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    return subscribeToasts(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ---- Confirm Dialog ----
type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  dangerous = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="confirm-dialog-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm-dialog-card" onClick={e => e.stopPropagation()}>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-secondary flex-1" onClick={onCancel}>{cancelLabel}</button>
          <button
            type="button"
            className={`btn flex-1 ${dangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Empty State ----
type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state-container">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div>
        <h3 className="empty-state-title">{title}</h3>
        {message && <p className="empty-state-message">{message}</p>}
      </div>
      {action && (
        <button type="button" className="btn btn-primary btn-sm" onClick={action.onClick}>{action.label}</button>
      )}
    </div>
  );
}

// ---- Loading State ----
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="loading-state-container">
      <div className="loading-spinner" />
      <p className="loading-message">{message}</p>
    </div>
  );
}

// ---- Skeleton ----
export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style = {} }: {
  width?: string | number; height?: number; borderRadius?: number; style?: React.CSSProperties;
}) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius, ...style }} />
  );
}

// ---- Tab Navigation ----
type TabsProps = {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'underline';
};

export function Tabs({ tabs, active, onChange, variant = 'pill' }: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className="tabs-underline-container" role="tablist">
        {tabs.map(tab => (
          <button
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`tab-underline-btn ${active === tab.id ? 'is-active' : ''}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-underline-badge">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="tabs-pill-container" role="tablist">
      {tabs.map(tab => (
        <button
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`tab-pill-btn ${active === tab.id ? 'is-active' : ''}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 opacity-80">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---- Status Badge ----
export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' }) {
  const map: Record<string, string> = {
    high: 'badge-high', medium: 'badge-medium', low: 'badge-low',
    accepted: 'badge-accepted', pending: 'badge-pending', declined: 'badge-declined',
    paid: 'badge-paid', overdue: 'badge-overdue', completed: 'badge-accepted',
    active: 'badge-accepted', archived: 'badge-medium',
  };
  const cls = map[status.toLowerCase()] ?? 'badge-medium';
  return (
    <span className={`badge ${cls} ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : ''}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---- Search Input ----
export function SearchInput({ value, onChange, placeholder = 'Search...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="search-input-wrapper">
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="search-input-icon"
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="search"
        className="form-input search-input-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ---- Progress Bar ----
export function ProgressBar({ value, max = 100, color = 'default', showLabel = false }: {
  value: number; max?: number; color?: 'default' | 'violet' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors: Record<string, string> = {
    default: 'var(--color-tuxedo-black, #171F20)',
    violet: 'var(--color-violet-dark, #5B21B6)',
    success: 'var(--color-success, #16A34A)',
    warning: '#F59E0B',
    error: 'var(--color-error, #DC2626)',
  };
  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar progress-bar-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: colors[color] }} />
      </div>
      {showLabel && (
        <span className="progress-bar-label">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

// ---- Stat Card ----
export function StatCard({ label, value, icon, color = 'default' }: {
  label: string; value: string | number; icon?: React.ReactNode; color?: string;
}) {
  return (
    <div className="card stat-card-box">
      {icon && (
        <div className={`stat-card-icon-box ${color === 'violet' ? 'is-violet' : ''}`}>
          {icon}
        </div>
      )}
      <div className="stat-card-value-num">
        {value}
      </div>
      <div className="stat-card-label-txt">{label}</div>
    </div>
  );
}

// ---- Page Header ----
export function PageHeader({ title, subtitle, back, action }: {
  title: string; subtitle?: string; back?: () => void; action?: React.ReactNode;
}) {
  return (
    <div className="page-header-box">
      {back && (
        <button type="button" onClick={back} aria-label="Go back" className="page-header-back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="page-header-title-text">
          {title}
        </h1>
        {subtitle && <p className="page-header-subtitle-text">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
