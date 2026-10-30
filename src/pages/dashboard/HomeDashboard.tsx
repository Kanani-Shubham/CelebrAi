import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Users,
  MailCheck,
  Store,
  Palette,
  PieChart,
  UserCheck,
  Check,
  Plus,
  Sparkles,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getEventTasks,
  updateTask,
  getEventExpenses,
  getEventGuests,
} from '../../services/firebase/firestore';
import { calculateDaysCountdown, formatDisplayDate } from '../../utils/dateUtils';
import './HomeDashboard.css';

interface DashboardTask {
  id: string;
  title: string;
  dueDate?: string;
  priority?: string;
  completed: boolean;
}

export function HomeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent, loading: eventLoading } = useEvent();

  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  const eventId = activeEvent?.id;

  const loadDashboardData = useCallback(async () => {
    if (!eventId || eventId.startsWith('evt-')) {
      setTasks([]);
      setTasksDone(activeEvent?.tasksDone || 0);
      setTasksTotal(activeEvent?.tasksTotal || 0);
      setTotalSpent(0);
      setGuestCount(Number(activeEvent?.guestCount) || 0);
      setRsvpCount(0);
      return;
    }

    setLoadingData(true);
    try {
      // 1. Tasks
      const taskDocs = (await getEventTasks(eventId)) as unknown as DashboardTask[];
      setTasks(taskDocs);
      setTasksDone(taskDocs.filter(t => t.completed).length);
      setTasksTotal(taskDocs.length);

      // 2. Expenses
      const expenseDocs = (await getEventExpenses(eventId)) as unknown as { amount?: number; status?: string }[];
      const spent = expenseDocs.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      setTotalSpent(spent);

      // 3. Guests & RSVPs
      const guestDocs = (await getEventGuests(eventId)) as unknown as { status?: string; partySize?: number }[];
      const totalGuests = guestDocs.reduce((sum, g) => sum + (Number(g.partySize) || 1), 0);
      const confirmedRsvps = guestDocs
        .filter(g => g.status === 'Accepted')
        .reduce((sum, g) => sum + (Number(g.partySize) || 1), 0);

      setGuestCount(totalGuests > 0 ? totalGuests : Number(activeEvent?.guestCount) || 0);
      setRsvpCount(confirmedRsvps);
    } catch (err) {
      console.warn('[HomeDashboard] Error loading dashboard records from Firestore:', err);
    } finally {
      setLoadingData(false);
    }
  }, [eventId, activeEvent?.tasksDone, activeEvent?.tasksTotal, activeEvent?.guestCount]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const toggleTask = async (task: DashboardTask) => {
    const newCompleted = !task.completed;
    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, completed: newCompleted } : t))
    );
    setTasksDone(prev => (newCompleted ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await updateTask(task.id, { completed: newCompleted });
    } catch (err) {
      console.error('[HomeDashboard] Failed to toggle task:', err);
      // Revert
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
      setTasksDone(prev => (task.completed ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // Accurate countdown calculation
  const countdown = useMemo(() => {
    return calculateDaysCountdown(activeEvent?.eventDate || activeEvent?.date);
  }, [activeEvent?.eventDate, activeEvent?.date]);

  const plannedBudget = Number(activeEvent?.budget) || 0;
  const budgetLeft = Math.max(0, plannedBudget - totalSpent);

  if (eventLoading || (eventId && loadingData && tasks.length === 0)) {
    return (
      <div className="home-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-tuxedo-black)' }} />
      </div>
    );
  }

  // Genuine Empty State when user has no active event
  if (!activeEvent) {
    return (
      <div className="home-dashboard">
        <div className="hero-countdown-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '36px 28px', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Welcome to CelebrAI{user?.displayName ? `, ${user.displayName}` : ''}
            </span>
            <h1 className="font-serif" style={{ fontSize: '32px', margin: '8px 0', color: 'var(--color-tuxedo-black)' }}>
              Let’s Plan Your Next Celebration
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', maxWidth: '540px', margin: 0 }}>
              You don’t have an active celebration yet. Create an event manually or let our AI assistant build a tailored master plan, budget breakdown, and checklist in seconds.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-full)' }}
              onClick={() => navigate('/create-event')}
            >
              <Plus size={18} />
              <span>Create Your First Event</span>
            </button>
            <button
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-full)' }}
              onClick={() => navigate('/create-event')}
            >
              <Sparkles size={18} style={{ color: '#7E57C2' }} />
              <span>AI Wizard Planning</span>
            </button>
          </div>
        </div>

        {/* Quick access tiles */}
        <div className="quick-action-tiles" style={{ marginTop: '16px' }}>
          <button className="action-tile" onClick={() => navigate('/events')}>
            <div className="tile-icon-bg"><Calendar size={20} /></div>
            <span>All Events</span>
          </button>
          <button className="action-tile" onClick={() => navigate('/ai')}>
            <div className="tile-icon-bg"><Sparkles size={20} /></div>
            <span>AI Assistant</span>
          </button>
          <button className="action-tile" onClick={() => navigate('/vendors')}>
            <div className="tile-icon-bg"><Store size={20} /></div>
            <span>Vendors</span>
          </button>
          <button className="action-tile" onClick={() => navigate('/decor')}>
            <div className="tile-icon-bg"><Palette size={20} /></div>
            <span>Decor Ideas</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-dashboard">
      {/* Hero Banner with real active event */}
      <div className="hero-countdown-card">
        <div className="countdown-content">
          <span className="days-number">
            {countdown.days !== null ? Math.abs(countdown.days) : '--'}
          </span>
          <span className="days-label">
            {countdown.isToday ? (
              <>It's Celebration Day!<br />{activeEvent.eventName}</>
            ) : countdown.isPast ? (
              <>Days Since<br />{activeEvent.eventName}</>
            ) : (
              <>Days Until<br />{activeEvent.eventName}</>
            )}
          </span>
        </div>
        <div className="countdown-img-wrap">
          <img
            src={activeEvent.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
            alt={activeEvent.eventName}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
            }}
          />
        </div>
      </div>

      {/* 4 Stat Badges computed from real records */}
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
          <span className="stat-val">{tasksDone}/{tasksTotal}</span>
          <span className="stat-sub">Tasks Done</span>
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

      {/* 4 Quick Action Square Tiles */}
      <div className="quick-action-tiles">
        <button className="action-tile" onClick={() => navigate('/vendors')}>
          <div className="tile-icon-bg">
            <Store size={20} />
          </div>
          <span>Vendors</span>
        </button>

        <button className="action-tile" onClick={() => navigate('/decor')}>
          <div className="tile-icon-bg">
            <Palette size={20} />
          </div>
          <span>Decor</span>
        </button>

        <button className="action-tile" onClick={() => navigate('/budget')}>
          <div className="tile-icon-bg">
            <PieChart size={20} />
          </div>
          <span>Budget</span>
        </button>

        <button className="action-tile" onClick={() => navigate('/team')}>
          <div className="tile-icon-bg">
            <UserCheck size={20} />
          </div>
          <span>Team</span>
        </button>
      </div>

      {/* Urgent Tasks Section */}
      <div className="dashboard-section">
        <div className="section-head-row">
          <h2 className="section-title font-serif">Tasks to Focus On</h2>
          <button className="section-link" onClick={() => navigate('/tasks')}>
            View All ({tasksTotal})
          </button>
        </div>

        <div className="urgent-tasks-card">
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-secondary)' }}>
              <p style={{ margin: '0 0 12px', fontSize: '14px' }}>No pending tasks recorded for this celebration.</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/tasks')}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                <Plus size={14} /> Add First Task
              </button>
            </div>
          ) : (
            tasks.slice(0, 3).map(task => (
              <div
                key={task.id}
                className={`urgent-task-item ${task.completed ? 'completed' : ''}`}
                onClick={() => toggleTask(task)}
              >
                <div className={`task-check-circle ${task.completed ? 'checked' : ''}`}>
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="task-info">
                  <span className="task-title-text">{task.title}</span>
                  <div className="task-meta">
                    {task.dueDate && <span>Due: {formatDisplayDate(task.dueDate)}</span>}
                    {task.priority && (
                      <span className={`task-priority-tag priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
