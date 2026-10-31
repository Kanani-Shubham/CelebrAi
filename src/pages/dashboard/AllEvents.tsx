import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Calendar, Trash2, Archive, Loader2 } from 'lucide-react';
import { type Event } from '../../contexts/EventContext';
import { useEvent } from '../../contexts/useEvent';
import { toast } from '../../components/ui/toast';
import { formatDisplayDate } from '../../utils/dateUtils';
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
          <div className="ui-center-empty">
            <Loader2 className="animate-spin mx-auto text-tuxedo" size={24} />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="allevents-empty-state">
            <Calendar size={36} className="mx-auto mb-2 opacity-50" />
            <h3 className="ui-section-title-sm mb-1 text-center">
              No {filter} celebrations
            </h3>
            <p className="text-sm mb-4 text-center">
              {filter === 'active'
                ? 'Create your first event to start planning tasks, guests, and budgets.'
                : `You don't have any ${filter} celebrations.`}
            </p>
            {filter === 'active' && (
              <button className="btn btn-primary btn btn-primary rounded-full"
                onClick={() => navigate('/create-event')}
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
              <div className={`event-list-card ${isSelected ? 'active-event' : ''} relative`}
                key={ev.id}
                onClick={() => handleSelectEvent(ev)}
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
                    <div className="relative">
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
                          className="allevents-dropdown-menu"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleToggleArchive(e, ev)}
                            className="allevents-menu-item"
                          >
                            <Archive size={12} />
                            {ev.status === 'archived' ? 'Unarchive' : 'Archive'}
                          </button>
                          <hr className="allevents-menu-divider" />
                          <button
                            onClick={(e) => handleDeleteEvent(e, ev.id)}
                            className="allevents-menu-item text-error"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="event-card-date">{formatDisplayDate(ev.eventDate || ev.date)}</span>

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
