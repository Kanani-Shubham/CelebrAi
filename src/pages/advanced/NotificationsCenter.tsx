import { logger } from '../../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Heart,
  Store,
  TrendingUp,
  Sparkles,
  Clock,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import {
  getUserNotifications,
  getEventTasks,
  getEventGuests,
} from '../../services/firebase/firestore';
import type { TaskItem, Guest } from '../../types';
import { toast } from '../../components/ui';
import './NotificationsCenter.css';

interface NotifItem {
  id: string;
  type: 'task' | 'rsvp' | 'vendor' | 'budget' | 'ai' | 'system';
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export function NotificationsCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent } = useEvent();
  const [filter, setFilter] = useState<'All' | 'Tasks' | 'RSVP' | 'System'>('All');
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const activeEventId = activeEvent?.id;
  const activeEventName = activeEvent?.eventName || 'your celebration';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Timeout safety fallback ensures loading state never hangs
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3500);

    try {
      const liveItems: NotifItem[] = [];

      // 1. Fetch Firestore stored user notifications with safe error handling
      try {
        const stored = await getUserNotifications(user.uid);
        if (Array.isArray(stored)) {
          (stored as Array<{ id: string; type?: NotifItem['type']; title?: string; body?: string; desc?: string; read?: boolean; createdAt?: { toDate?: () => Date } }>).forEach((s) => {
            liveItems.push({
              id: s.id,
              type: s.type || 'system',
              title: s.title || 'Notification',
              desc: s.body || s.desc || '',
              time: s.createdAt?.toDate ? s.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
              unread: !s.read,
            });
          });
        }
      } catch (notifErr) {
        logger.warn('[NotificationsCenter] User notifications load skipped:', notifErr);
      }

      // 2. Fetch event status tasks & guests if real event
      if (activeEventId && !activeEventId.startsWith('evt-')) {
        try {
          const [tasksRes, guestsRes] = await Promise.allSettled([
            getEventTasks(activeEventId),
            getEventGuests(activeEventId),
          ]);

          if (tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value)) {
            const pendingTasks = (tasksRes.value as unknown as TaskItem[]).filter((t) => !t.completed);
            if (pendingTasks.length > 0) {
              liveItems.push({
                id: 'dyn-task-due',
                type: 'task',
                title: `${pendingTasks.length} Pending Tasks`,
                desc: `"${pendingTasks[0]?.title ?? 'Task'}" and ${pendingTasks.length - 1} other tasks need attention for ${activeEventName}.`,
                time: 'Today',
                unread: true,
              });
            }
          }

          if (guestsRes.status === 'fulfilled' && Array.isArray(guestsRes.value)) {
            const pendingGuests = (guestsRes.value as unknown as Guest[]).filter((g) => g.status === 'Pending');
            if (pendingGuests.length > 0) {
              liveItems.push({
                id: 'dyn-rsvp-pending',
                type: 'rsvp',
                title: `${pendingGuests.length} Pending RSVPs`,
                desc: `${pendingGuests.length} guests have not responded yet for ${activeEventName}.`,
                time: 'Today',
                unread: false,
              });
            }
          }
        } catch (evErr) {
          logger.warn('[NotificationsCenter] Event notifications load skipped:', evErr);
        }
      }

      setItems(liveItems);
    } catch (err) {
      logger.warn('[NotificationsCenter] Error loading notifications:', err);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, [user?.uid, activeEventId, activeEventName]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = () => {
    setItems(prev => prev.map(i => ({ ...i, unread: false })));
    toast.success('All notifications marked as read');
  };

  const getIcon = (type: NotifItem['type']) => {
    switch (type) {
      case 'task': return <Calendar size={16} />;
      case 'rsvp': return <Heart size={16} />;
      case 'vendor': return <Store size={16} />;
      case 'budget': return <TrendingUp size={16} />;
      case 'ai': return <Sparkles size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const filtered = items.filter(i => {
    if (filter === 'All') return true;
    if (filter === 'Tasks') return i.type === 'task';
    if (filter === 'RSVP') return i.type === 'rsvp';
    return i.type === 'budget' || i.type === 'ai';
  });

  return (
    <div className="notifications-center-page">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="notif-back-btn"
        aria-label="Go back"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
          fontWeight: 600,
          fontSize: '14px',
          color: 'var(--color-tuxedo-black, #171F20)',
          padding: '4px 0 12px',
        }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="notif-head-row">
        <h1 className="notif-title">Notifications</h1>
        {items.some(i => i.unread) && (
          <button className="mark-all-read-btn" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="notif-filter-chips">
        {(['All', 'Tasks', 'RSVP', 'System'] as const).map(f => (
          <button
            key={f}
            className={`notif-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="notif-sections-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#16a34a' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>You're all caught up! No notifications right now.</p>
          </div>
        ) : (
          <div className="notif-items-group">
            {filtered.map(item => (
              <div key={item.id} className={`notif-item-card ${item.unread ? 'unread' : ''}`}>
                <div className={`notif-icon-col icon-${item.type}`}>
                  {getIcon(item.type)}
                </div>

                <div className="notif-content-col">
                  <div className="notif-item-header">
                    <strong className="notif-item-title">{item.title}</strong>
                    <span className="notif-time">{item.time}</span>
                  </div>
                  <p className="notif-desc">{item.desc}</p>
                </div>

                {item.unread && <span className="unread-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
