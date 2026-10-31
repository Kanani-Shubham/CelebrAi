import { logger } from '../../utils/logger';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { getEventTasks } from '../../services/firebase/firestore';
import { formatDisplayDate } from '../../utils/dateUtils';
import './TimelineCalendar.css';

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  priority: string;
  completed?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TimelineCalendar() {
  const navigate = useNavigate();
  const { activeEvent } = useEvent();
  const [viewTab, setViewTab] = useState<'calendar' | 'agenda'>('calendar');

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const eventId = activeEvent?.id;

  useEffect(() => {
    let ignore = false;
    async function fetchTimeline() {
      if (!eventId || !activeEvent) {
        if (!ignore) setLoading(false);
        return;
      }
      try {
        const items: TimelineItem[] = [];
        const taskDocs = (await getEventTasks(eventId)) as unknown as { id: string; title?: string; dueDate?: string; priority?: string }[];
        if (ignore) return;
        taskDocs.forEach(t => {
          if (t.dueDate) {
            items.push({
              id: t.id,
              date: t.dueDate,
              title: t.title || 'Task Due',
              priority: (t.priority as 'High' | 'Medium' | 'Low') || 'Medium',
            });
          }
        });
        const milestones = (activeEvent as { milestones?: { targetDate?: string; title: string }[] }).milestones;
        if (Array.isArray(milestones)) {
          milestones.forEach((m, idx) => {
            items.push({
              id: `ms-${idx}`,
              date: m.targetDate || activeEvent.eventDate || 'Scheduled',
              title: m.title,
              priority: 'High',
            });
          });
        }
        if (!ignore) setTimelineItems(items);
      } catch (err) {
        logger.warn('[TimelineCalendar] Error loading items:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchTimeline();
    return () => { ignore = true; };
  }, [eventId, activeEvent]);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push(d);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="timeline-page">
      {/* Tab Switcher */}
      <div className="calendar-tab-switcher">
        <button
          className={`cal-tab-btn ${viewTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`cal-tab-btn ${viewTab === 'agenda' ? 'active' : ''}`}
          onClick={() => setViewTab('agenda')}
        >
          Agenda
        </button>
      </div>

      {viewTab === 'calendar' ? (
        <>
          {/* Calendar Month Widget */}
          <div className="calendar-widget-card">
            <div className="calendar-nav-row">
              <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft size={18} />
              </button>
              <h3 className="cal-month-title">{monthName}</h3>
              <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-weekdays">
              {WEEKDAYS.map(w => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="calendar-dates-grid">
              {calendarCells.map((day, idx) => {
                if (day === null) return <div key={idx} className="cal-empty-cell" />;
                const isSelected = day === selectedDay;

                // Check if any timeline item falls on this day in current month
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvent = timelineItems.some(item => item.date.includes(dayStr) || item.date.includes(` ${day} `));

                return (
                  <button
                    key={idx}
                    className={`cal-day-cell ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span>{day}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Milestones from Firestore */}
          <div className="milestones-section">
            <div className="section-head">
              <h2 className="section-title">Timeline &amp; Deadlines</h2>
              <button className="view-all-btn" onClick={() => navigate('/tasks')}>
                Manage Tasks
              </button>
            </div>

            {loading ? (
              <div className="ui-center-empty">
                <Loader2 className="animate-spin mx-auto text-tuxedo" size={20} />
              </div>
            ) : timelineItems.length === 0 ? (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}>
                <p className="text-sm mb-2">No scheduled deadlines or milestones found.</p>
                <button className="btn btn-secondary btn btn-secondary rounded-full text-xs"
                  onClick={() => navigate('/tasks')}
                >
                  + Add Tasks with Due Dates
                </button>
              </div>
            ) : (
              <div className="milestones-vertical-list">
                {timelineItems.map(item => (
                  <div key={item.id} className="milestone-timeline-item">
                    <div className="milestone-line-marker">
                      <span className="milestone-bullet" />
                      <span className="milestone-connector" />
                    </div>
                    <div className="milestone-info">
                      <span className="milestone-date">{formatDisplayDate(item.date)}</span>
                      <h4 className="milestone-title">{item.title}</h4>
                    </div>
                    <span className={`task-priority-tag priority-${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Agenda View */
        <div className="agenda-list flex-col gap-2 mt-3">
          {timelineItems.length === 0 ? (
            <div className="ui-center-empty text-muted">
              No agenda items scheduled.
            </div>
          ) : (
            timelineItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong className="text-sm text-tuxedo block font-semibold">{item.title}</strong>
                  <span className="text-xs text-muted inline-flex items-center gap-1 mt-1">
                    <Clock size={12} /> {formatDisplayDate(item.date)}
                  </span>
                </div>
                <span className={`task-priority-tag priority-${item.priority.toLowerCase()}`}>
                  {item.priority}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
