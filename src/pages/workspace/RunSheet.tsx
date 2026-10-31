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
          setItems(data as unknown as RunSheetItem[]);
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
      <div className="rs-title-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="rs-title">Event Run Sheet</h1>
          <p className="rs-sub">Detailed hour-by-hour schedule for {activeEvent?.eventName || 'your celebration'}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>Add Activity</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }} />
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

              <div className="rs-card-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="rs-item-title">{item.title}</h3>
                  <span className="rs-item-sub">
                    {item.location} · {item.duration}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px' }}
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: 0 }}>
                Add Run Sheet Event
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Time</label>
                <input
                  type="text"
                  placeholder="e.g. 02:00 PM"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Activity Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Cake Cutting & Speeches"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Stage Area"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 mins"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)' }}
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
