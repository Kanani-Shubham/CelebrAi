import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Users,
  User,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { signOut } from '../../services/firebase/auth';
import './AppHeader.css';

const LOGO = (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" stroke="#171F20" strokeWidth="1.5"/>
    <path d="M14 6C14 6 9 9 9 14C9 19 14 22 14 22C14 22 19 19 19 14C19 9 14 6 14 6Z" fill="#D8CBF1"/>
    <path d="M8 10.5C8 10.5 11 8 14 8C17 8 20 10.5 20 10.5" stroke="#171F20" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="14" cy="14" r="2" fill="#171F20"/>
  </svg>
);

export function AppHeader() {
  const { user } = useAuth();
  const { events, activeEvent, setActiveEvent } = useEvent();
  const navigate = useNavigate();
  const [showEventMenu, setShowEventMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <header className="app-header">
      <button className="header-menu-btn" aria-label="Menu">
        <Menu size={20} />
      </button>

      <div className="header-logo">
        {LOGO}
        <span className="header-logo-text">CelebrAI</span>
      </div>

      {activeEvent && (
        <button
          className="header-event-switcher"
          onClick={() => setShowEventMenu(v => !v)}
        >
          <div className="event-switcher-inner">
            <span className="event-switcher-name">{activeEvent.eventName}</span>
            <span className="event-switcher-meta">
              {activeEvent.eventType} · {activeEvent.eventDate}
            </span>
          </div>
          <ChevronDown size={14} className={showEventMenu ? 'rotated' : ''} />
        </button>
      )}

      {showEventMenu && (
        <div className="event-menu dropdown-panel">
          {events.filter(e => e.status !== 'archived').map(ev => (
            <button
              key={ev.id}
              className={`event-menu-item ${activeEvent?.id === ev.id ? 'active' : ''}`}
              onClick={() => { setActiveEvent(ev); setShowEventMenu(false); }}
            >
              <span className="event-menu-name">{ev.eventName}</span>
              <span className="event-menu-meta">{ev.eventType}</span>
            </button>
          ))}
          <div className="event-menu-divider" />
          <button
            className="event-menu-item create"
            onClick={() => { navigate('/create-event'); setShowEventMenu(false); }}
          >
            + Create New Event
          </button>
        </div>
      )}

      <div className="header-actions">
        <NavLink to="/notifications" className="header-icon-btn" aria-label="Notifications">
          <Bell size={20} />
        </NavLink>

        <button
          className="header-avatar-btn"
          onClick={() => setShowUserMenu(v => !v)}
          aria-label="Account menu"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="avatar avatar-sm" />
          ) : (
            <div className="avatar avatar-sm">
              {initials(user?.displayName ?? user?.email ?? 'U')}
            </div>
          )}
        </button>

        {showUserMenu && (
          <div className="user-menu dropdown-panel">
            <div className="user-menu-info">
              <strong>{user?.displayName}</strong>
              <span>{user?.email}</span>
            </div>
            <div className="event-menu-divider" />
            <NavLink to="/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
              <User size={15} /> Profile
            </NavLink>
            <NavLink to="/settings" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
              <Settings size={15} /> Settings
            </NavLink>
            <button className="user-menu-item danger" onClick={handleSignOut}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={22} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/events" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Calendar size={22} />
        <span>Events</span>
      </NavLink>
      <NavLink to="/ai" className={({ isActive }) => `bottom-nav-item center ${isActive ? 'active' : ''}`}>
        <div className="ai-nav-btn">
          <Sparkles size={22} />
        </div>
        <span>AI</span>
      </NavLink>
      <NavLink to="/guests" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Users size={22} />
        <span>Guests</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
