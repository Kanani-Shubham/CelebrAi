import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { queryCollection, createDoc, deleteDocById } from '../../services/firebase/firestore';
import { where, orderBy } from 'firebase/firestore';
import { toast } from '../../components/ui/toast';
import './RunSheet.css';

interface RunSheetItem {
  id: string;
  time: string;
  title: string;
  location: string;
  duration: string;
  date: string;
}

const DEFAULT_ITEMS: RunSheetItem[] = [
  { id: 'rs-1', time: '09:00 AM', title: 'Vendor Setup & Arrival', location: 'Main Entrance & Lawn', duration: '2 hours', date: 'Event Day' },
  { id: 'rs-2', time: '11:30 AM', title: 'Photographer & Bridal Shoot', location: 'Bridal Suite', duration: '1 hour', date: 'Event Day' },
  { id: 'rs-3', time: '01:00 PM', title: 'Guest Welcome & Refreshments', location: 'Banquet Foyer', duration: '1.5 hours', date: 'Event Day' },
  { id: 'rs-4', time: '03:00 PM', title: 'Main Celebration Ceremony', location: 'Grand Mandap / Stage', duration: '2 hours', date: 'Event Day' },
  { id: 'rs-5', time: '07:30 PM', title: 'Dinner Reception & Music', location: 'Dining Hall', duration: '3 hours', date: 'Event Day' },
];

export function RunSheet() {
  const { activeEvent } = useEvent();
  const eventId = activeEvent?.id;

  const [items, setItems] = useState<RunSheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [time, setTime] = useState('10:00 AM');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('1 hour');

  useEffect(() => {
    let ignore = false;
    async function fetchRunSheet() {
      if (!eventId) {
        if (!ignore) {
          setItems(DEFAULT_ITEMS);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await queryCollection('runsheets', [
          where('eventId', '==', eventId),
          orderBy('createdAt', 'asc'),
        ]);
        if (ignore) return;
        if (data && data.length > 0) {
          setItems(data.map(d => ({ id: d.id, time: String(d.time || ''), title: String(d.title || ''), location: String(d.location || ''), duration: String(d.duration || ''), date: String(d.date || 'Event Day') })));
        } else {
          setItems(DEFAULT_ITEMS);
        }
      } catch {
        if (!ignore) setItems(DEFAULT_ITEMS);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchRunSheet();
    return () => {
      ignore = true;
    };
  }, [eventId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const newItem = {
      time,
      title: title.trim(),
      location: location.trim() || 'Main Venue',
      duration: duration.trim() || '1 hour',
      date: 'Event Day',
      eventId: eventId || 'default',
    };

    if (eventId) {
      try {
        const docId = await createDoc('runsheets', newItem);
        setItems(prev => [...prev, { id: docId, ...newItem }]);
        toast.success('Schedule item added to run sheet');
      } catch (err) {
        toast.error('Failed to save schedule item: ' + (err as Error).message);
      }
    } else {
      setItems(prev => [...prev, { id: `rs-${Date.now()}`, ...newItem }]);
      toast.success('Schedule item added');
    }

    setTitle('');
    setLocation('');
    setShowAddModal(false);
    setSaving(false);
  };

  const handleDeleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (eventId && !id.startsWith('rs-')) {
      try {
        await deleteDocById('runsheets', id);
        toast.success('Schedule item removed');
      } catch {
        toast.error('Failed to delete item');
      }
    }
  };

  return (
    <div className="run-sheet-page">
      <div className="rs-title-section flex-between items-start">
        <div>
          <h1 className="rs-title">Event Run Sheet</h1>
          <p className="rs-sub">Detailed hour-by-hour schedule for {activeEvent?.eventName || 'your celebration'}</p>
        </div>
        <button className="btn btn-primary ui-pill-btn btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          <span>Add Activity</span>
        </button>
      </div>

      {loading ? (
        <div className="ui-center-empty">
          <Loader2 className="animate-spin mx-auto text-tuxedo" size={24} />
        </div>
      ) : (
        <div className="rs-timeline-list">
          {items.map(item => (
            <div key={item.id} className="rs-timeline-row">
              <span className="rs-time-badge">{item.time}</span>

              <div className="rs-connector-col">
                <span className="rs-dot">📍</span>
                <span className="rs-line" />
              </div>

              <div className="rs-card-content flex-between">
                <div>
                  <h3 className="rs-item-title">{item.title}</h3>
                  <span className="rs-item-sub">
                    {item.location} · {item.duration}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="ui-icon-btn-ghost"
                  title="Delete item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div
          className="ui-modal-backdrop"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="ui-modal-card-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="ui-modal-header">
              <h3 className="ui-modal-title">
                Add Run Sheet Event
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="ui-icon-btn-ghost"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="flex-col gap-3">
              <div>
                <label className="ui-field-label">Time</label>
                <input
                  type="text"
                  placeholder="e.g. 02:00 PM"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label className="ui-field-label">Activity Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Cake Cutting & Speeches"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div className="grid-2-col gap-2">
                <div>
                  <label className="ui-field-label">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Stage Area"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
                <div>
                  <label className="ui-field-label">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 mins"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              <div className="flex-between justify-end gap-2 mt-2">
                <button className="btn btn-secondary btn btn-secondary rounded-full"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary btn btn-primary rounded-full"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Adding...' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
