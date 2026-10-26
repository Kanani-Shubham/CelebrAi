import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Heart,
  Store,
  TrendingUp,
  MessageSquare,
  Sparkles,
  UserPlus,
  Clock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import {
  getUserNotifications,
  markNotificationRead,
  getEventTasks,
  getEventGuests,
} from '../../services/firebase/firestore';
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
  const { user } = useAuth();
  const { activeEvent } = useEvent();
  const [filter, setFilter] = useState<'All' | 'Tasks' | 'RSVP' | 'System'>('All');
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const liveItems: NotifItem[] = [];

      // 1. Fetch Firestore stored user notifications
      try {
        const stored = (await getUserNotifications(user.uid)) as unknown as { id: string; type: NotifItem['type']; title: string; body: string; read: boolean; createdAt?: { toDate?: () => Date } }[];
        stored.forEach(s => {
          liveItems.push({
            id: s.id,
            type: s.type || 'system',
            title: s.title,
            desc: s.body,
            time: s.createdAt?.toDate ? s.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            unread: !s.read,
          });
        });
      } catch {
        // Fall through to real event status notifications
      }

      // 2. Generate actual notifications based on active event status
      if (activeEvent?.id) {
        // Unfinished tasks
        const tasks = (await getEventTasks(activeEvent.id)) as unknown as { title: string; completed: boolean; priority?: string }[];
        const pendingTasks = tasks.filter(t => !t.completed);
        if (pendingTasks.length > 0) {
          liveItems.push({
            id: 'dyn-task-due',
            type: 'task',
            title: `${pendingTasks.length} Pending Tasks`,
            desc: `"${pendingTasks[0].title}" and ${pendingTasks.length - 1} other tasks need attention for ${activeEvent.eventName}.`,
            time: 'Today',
            unread: true,
          });
        }

        // Guests & RSVPs
        const guests = (await getEventGuests(activeEvent.id)) as unknown as { name: string; status: string }[];
        const pendingGuests = guests.filter(g => g.status === 'Pending');
        if (pendingGuests.length > 0) {
          liveItems.push({
            id: 'dyn-rsvp-pending',
            type: 'rsvp',
            title: `${pendingGuests.length} Pending RSVPs`,
            desc: `${pendingGuests.length} guests have not responded yet for ${activeEvent.eventName}.`,
            time: 'Today',
            unread: false,
          });
        }
      }

      setItems(liveItems);
    } catch (err) {
      console.warn('[NotificationsCenter] Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeEvent]);

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
