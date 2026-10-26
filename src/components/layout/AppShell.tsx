import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppHeader, BottomNav } from './AppHeader';

type Props = {
  children: React.ReactNode;
  requireAuth?: boolean;
  hideNav?: boolean;
};

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="#171F20" strokeWidth="1.5"/>
        <path d="M14 6C14 6 9 9 9 14C9 19 14 22 14 22C14 22 19 19 19 14C19 9 14 6 14 6Z" fill="#D8CBF1"/>
        <circle cx="14" cy="14" r="2" fill="#171F20"/>
      </svg>
      <div style={{ width: 120, height: 3, background: 'var(--border-default)', borderRadius: 99, overflow: 'hidden' }}>
        <div className="animate-shimmer" style={{ width: '60%', height: '100%', background: 'var(--color-tuxedo-black)', borderRadius: 99, animation: 'shimmer 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

export function AppShell({ children, requireAuth = true, hideNav = false }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (requireAuth && !user) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  if (!requireAuth && user && (location.pathname === '/signin' || location.pathname === '/signup')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="page-container">
      <AppHeader />
      <main className="app-content" style={{ paddingBottom: 'var(--bottom-nav-height)' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-container">
      {children}
    </div>
  );
}
