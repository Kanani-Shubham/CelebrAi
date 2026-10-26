import React from 'react';

// ---- Toast System ----
type ToastType = 'success' | 'error' | 'info' | 'warning';
type Toast = { id: string; message: string; type: ToastType };

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let globalToasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(fn => fn([...globalToasts]));
}

export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  info: (message: string) => addToast(message, 'info'),
  warning: (message: string) => addToast(message, 'warning'),
};

function addToast(message: string, type: ToastType) {
  const id = Date.now().toString();
  globalToasts = [...globalToasts, { id, message, type }];
  notifyListeners();
  setTimeout(() => {
    globalToasts = globalToasts.filter(t => t.id !== id);
    notifyListeners();
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 'var(--z-toast)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '90vw',
      maxWidth: '360px',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: t.type === 'success' ? 'var(--color-success)' :
                      t.type === 'error' ? 'var(--color-error)' :
                      t.type === 'warning' ? '#B45309' : 'var(--color-tuxedo-black)',
          color: 'white',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideUp 0.3s ease both',
        }}>
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(23,31,32,0.5)',
      zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', padding: '0 0 env(safe-area-inset-bottom)',
    }} onClick={onCancel}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
        padding: '24px', width: '100%', maxWidth: 480, animation: 'slideUp 0.25s ease',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary flex-1" onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`btn flex-1 ${dangerous ? '' : 'btn-primary'}`}
            style={dangerous ? { background: 'var(--color-error)', color: 'white', border: 'none' } : {}}
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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 16,
    }}>
      {icon && <div style={{ fontSize: 48, opacity: 0.4 }}>{icon}</div>}
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 6 }}>{title}</h3>
        {message && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 280, margin: '0 auto' }}>{message}</p>}
      </div>
      {action && (
        <button className="btn btn-primary btn-sm" onClick={action.onClick}>{action.label}</button>
      )}
    </div>
  );
}

// ---- Loading State ----
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 16,
    }}>
      <div style={{
        width: 32, height: 32, border: '2.5px solid var(--border-default)',
        borderTopColor: 'var(--color-tuxedo-black)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{message}</p>
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
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', gap: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
              color: active === tab.id ? 'var(--color-tuxedo-black)' : 'var(--text-secondary)',
              borderBottom: active === tab.id ? '2px solid var(--color-tuxedo-black)' : '2px solid transparent',
              background: 'none', marginBottom: '-1px', transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                marginLeft: 6, fontSize: 'var(--text-xs)', background: active === tab.id ? 'var(--color-tuxedo-black)' : 'var(--bg-subtle)',
                color: active === tab.id ? 'white' : 'var(--text-secondary)', padding: '1px 6px', borderRadius: 99,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '7px 14px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
            background: active === tab.id ? 'var(--color-tuxedo-black)' : 'var(--bg-subtle)',
            color: active === tab.id ? 'white' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-full)', border: 'none',
            transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{ marginLeft: 5, opacity: 0.8 }}>({tab.count})</span>
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
    <span className={`badge ${cls}`} style={size === 'xs' ? { fontSize: 10, padding: '2px 6px' } : {}}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---- Search Input ----
export function SearchInput({ value, onChange, placeholder = 'Search...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="search"
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: 36 }}
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
    default: 'var(--color-tuxedo-black)',
    violet: 'var(--color-violet-dark)',
    success: 'var(--color-success)',
    warning: '#F59E0B',
    error: 'var(--color-error)',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-bar" style={{ flex: 1 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: colors[color] }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', minWidth: 32 }}>
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
    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: color === 'violet' ? 'var(--color-violet)' : 'var(--bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color === 'violet' ? 'var(--color-tuxedo-black)' : 'var(--text-secondary)',
        }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-heading)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

// ---- Page Header ----
export function PageHeader({ title, subtitle, back, action }: {
  title: string; subtitle?: string; back?: () => void; action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: '16px var(--page-padding) 8px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {back && (
        <button onClick={back} style={{
          width: 36, height: 36, borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
          flexShrink: 0, marginTop: 2,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.5px' }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
