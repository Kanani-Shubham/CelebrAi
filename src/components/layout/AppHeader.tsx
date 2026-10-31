import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Users,
  User,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useEvent } from '../../contexts/useEvent';
import { signOut } from '../../services/firebase/auth';
import { formatDisplayDate } from '../../utils/dateUtils';
import './AppHeader.css';

export function AppHeader() {
  const { user, avatarUrl } = useAuth();
  const { events, activeEvent, setActiveEvent } = useEvent();
  const navigate = useNavigate();
  const [showEventMenu, setShowEventMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const eventMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (eventMenuRef.current && !eventMenuRef.current.contains(event.target as Node)) {
        setShowEventMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className="header-left-cluster">
        <Link to="/dashboard" className="header-logo" aria-label="CelebrAI Home">
          <img
            src="/assets/branding/celebrai-icon.png"
            alt="CelebrAI logo"
            className="header-brand-icon"
          />
          <span className="header-logo-text">CelebrAI</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="header-desktop-nav" aria-label="Main Navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
            Events
          </NavLink>
          <NavLink to="/ai" className={({ isActive }) => `header-nav-link ai-nav-link ${isActive ? 'active' : ''}`}>
            <Sparkles size={14} style={{ color: '#7E57C2' }} />
            <span>AI Mentor</span>
          </NavLink>
          <NavLink to="/guests" className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
            Guests
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
            Tasks
          </NavLink>
          <NavLink to="/budget" className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
            Budget
          </NavLink>
          <NavLink to="/vendors" className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
            Vendors
          </NavLink>
        </nav>
      </div>

      <div className="header-right-cluster">
        {/* Event Switcher with local anchoring container */}
        <div className="header-event-switcher-wrapper" ref={eventMenuRef}>
          {activeEvent ? (
            <button
              type="button"
              className="header-event-switcher"
              onClick={() => setShowEventMenu(v => !v)}
              aria-label="Switch active event"
            >
              <div className="event-switcher-inner">
                <span className="event-switcher-name">{activeEvent.eventName}</span>
                <span className="event-switcher-meta">
                  {activeEvent.eventType} · {formatDisplayDate(activeEvent.eventDate || activeEvent.date)}
                </span>
              </div>
              <ChevronDown size={14} className={showEventMenu ? 'rotated' : ''} />
            </button>
          ) : (
            <button
              type="button"
              className="header-event-switcher"
              onClick={() => navigate('/create-event')}
            >
              <div className="event-switcher-inner">
                <span className="event-switcher-name">+ Create Event</span>
                <span className="event-switcher-meta">Start a celebration</span>
              </div>
            </button>
          )}

          {showEventMenu && (
            <div className="event-menu dropdown-panel">
              <div className="dropdown-header-title">My Celebrations</div>
              <div className="dropdown-scroll-list">
                {events.filter(e => e.status !== 'archived').map(ev => (
                  <button
                    key={ev.id}
                    type="button"
                    className={`event-menu-item ${activeEvent?.id === ev.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveEvent(ev);
                      setShowEventMenu(false);
                    }}
                  >
                    <span className="event-menu-name">{ev.eventName}</span>
                    <span className="event-menu-meta">
                      {ev.eventType} · {formatDisplayDate(ev.eventDate || ev.date)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="event-menu-divider" />
              <button
                type="button"
                className="event-menu-item create"
                onClick={() => {
                  navigate('/create-event');
                  setShowEventMenu(false);
                }}
              >
                <Plus size={14} style={{ display: 'inline', marginRight: 6 }} />
                Create New Event
              </button>
            </div>
          )}
        </div>

        {/* Notifications and User Avatar Menu */}
        <div className="header-actions">
          <NavLink to="/notifications" className="header-icon-btn" aria-label="Notifications" title="Notifications">
            <Bell size={18} />
          </NavLink>

          <div className="header-user-menu-wrapper" ref={userMenuRef}>
            <button
              type="button"
              className="header-avatar-btn"
              onClick={() => setShowUserMenu(v => !v)}
              aria-label="Account menu"
              title="Account"
            >
              {avatarUrl || user?.photoURL ? (
                <img src={avatarUrl || user?.photoURL || undefined} alt={user?.displayName || 'User profile photo'} className="avatar avatar-sm" />
              ) : (
                <div className="avatar avatar-sm">
                  {initials(user?.displayName ?? user?.email ?? 'Host')}
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="user-menu dropdown-panel">
                <div className="user-menu-info">
                  <strong>{user?.displayName || 'Celebration Host'}</strong>
                  <span>{user?.email || 'Registered account'}</span>
                </div>
                <div className="event-menu-divider" />
                <NavLink to="/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                  <User size={15} /> My Profile
                </NavLink>
                <NavLink to="/settings" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                  <Settings size={15} /> Settings & Regional
                </NavLink>
                <button type="button" className="user-menu-item danger" onClick={handleSignOut}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation">
      <NavLink to="/dashboard" aria-label="Home Dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={22} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/events" aria-label="All Events" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Calendar size={22} />
        <span>Events</span>
      </NavLink>
      <NavLink to="/ai" aria-label="AI Event Planner and Mentor" className={({ isActive }) => `bottom-nav-item center ${isActive ? 'active' : ''}`}>
        <div className="ai-nav-btn">
          <Sparkles size={22} />
        </div>
        <span>AI</span>
      </NavLink>
      <NavLink to="/guests" aria-label="Guest Management" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Users size={22} />
        <span>Guests</span>
      </NavLink>
      <NavLink to="/profile" aria-label="User Profile and Settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
