import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Calendar, Check, Trash2, Archive, Loader2 } from 'lucide-react';
import { useEvent, type Event } from '../../contexts/EventContext';
import { toast } from '../../components/ui';
import './AllEvents.css';

export function AllEvents() {
  const navigate = useNavigate();
  const { events, activeEvent, setActiveEvent, removeEvent, updateEventDetails, loading } = useEvent();
  const [filter, setFilter] = useState<'active' | 'past' | 'archived'>('active');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const activeCount = events.filter(e => e.status === 'active' || !e.status).length;
  const pastCount = events.filter(e => e.status === 'past').length;
  const archivedCount = events.filter(e => e.status === 'archived').length;

  const filteredEvents = events.filter(e => {
    if (filter === 'active') return e.status === 'active' || !e.status;
    if (filter === 'past') return e.status === 'past';
    return e.status === 'archived';
  });

  const handleSelectEvent = (ev: Event) => {
    setActiveEvent(ev);
    navigate(`/events/${ev.id}`);
  };

  const handleToggleArchive = async (e: React.MouseEvent, ev: Event) => {
    e.stopPropagation();
    setMenuOpenId(null);
    const newStatus = ev.status === 'archived' ? 'active' : 'archived';
    try {
      await updateEventDetails(ev.id, { status: newStatus });
      toast.success(newStatus === 'archived' ? 'Event archived' : 'Event restored to active');
    } catch {
      toast.error('Failed to update event status');
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!confirm('Are you sure you want to delete this event? This will also remove its tasks, budget, and guest records.')) {
      return;
    }
    try {
      await removeEvent(id);
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="all-events-page">
      <div className="events-header-bar">
        <h1 className="events-title">My Celebrations</h1>
        <button
          className="create-event-fab"
          onClick={() => navigate('/create-event')}
          aria-label="Create Event"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="events-tabs">
        <button
          className={`tab-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({activeCount})
        </button>
        <button
          className={`tab-btn ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past ({pastCount})
        </button>
        <button
          className={`tab-btn ${filter === 'archived' ? 'active' : ''}`}
          onClick={() => setFilter('archived')}
        >
          Archived ({archivedCount})
        </button>
      </div>

      <div className="events-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }} />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: '0 0 6px 0', color: 'var(--color-tuxedo-black)' }}>
              No {filter} celebrations
            </h3>
            <p style={{ fontSize: '14px', margin: '0 0 16px 0' }}>
              {filter === 'active'
                ? 'Create your first event to start planning tasks, guests, and budgets.'
                : `You don't have any ${filter} celebrations.`}
            </p>
            {filter === 'active' && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/create-event')}
                style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)' }}
              >
                + Create Event
              </button>
            )}
          </div>
        ) : (
          filteredEvents.map(ev => {
            const progressPercent = ev.tasksTotal ? Math.round(((ev.tasksDone || 0) / ev.tasksTotal) * 100) : 0;
            const isSelected = activeEvent?.id === ev.id;

            return (
              <div
                key={ev.id}
                className={`event-list-card ${isSelected ? 'active-event' : ''}`}
                onClick={() => handleSelectEvent(ev)}
                style={{ position: 'relative' }}
              >
                <div className="event-thumb">
                  <img
                    src={ev.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80'}
                    alt={ev.eventName}
                  />
                </div>

                <div className="event-body">
                  <div className="event-head-row">
                    <h3 className="event-card-name">{ev.eventName}</h3>
                    <div style={{ position: 'relative' }}>
                      <button
                        className="event-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === ev.id ? null : ev.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {menuOpenId === ev.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: '#FFFFFF',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            zIndex: 20,
                            minWidth: '130px',
                            padding: '4px',
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleToggleArchive(e, ev)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '6px 10px', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                          >
                            <Archive size={12} />
                            {ev.status === 'archived' ? 'Unarchive' : 'Archive'}
                          </button>
                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-default)' }} />
                          <button
                            onClick={(e) => handleDeleteEvent(e, ev.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '6px 10px', fontSize: '12px', color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="event-card-date">{ev.eventDate || ev.date || 'Date TBD'}</span>

                  <div className="event-card-progress">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span className="progress-label">
                      {ev.tasksDone || 0} of {ev.tasksTotal || 0} tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
