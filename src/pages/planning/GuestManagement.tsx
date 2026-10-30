import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Check,
  MoreVertical,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { getEventGuests, createGuest, updateGuest, deleteGuest } from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
import './GuestManagement.css';

interface FirestoreGuest {
  id: string;
  name: string;
  partySize: number;
  dietary: 'Vegetarian' | 'Vegan' | 'Non-vegetarian' | 'Halal' | 'Gluten Free' | 'None';
  status: 'Accepted' | 'Pending' | 'Declined';
  accessible?: boolean;
  eventId: string;
  phone?: string;
  email?: string;
}

const DIETARY_OPTIONS: FirestoreGuest['dietary'][] = [
  'Vegetarian', 'Vegan', 'Non-vegetarian', 'Halal', 'Gluten Free', 'None',
];

export function GuestManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent } = useEvent();

  const [guests, setGuests] = useState<FirestoreGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Accepted' | 'Pending' | 'Declined'>('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPartySize, setFormPartySize] = useState('1');
  const [formDietary, setFormDietary] = useState<FirestoreGuest['dietary']>('Vegetarian');
  const [formStatus, setFormStatus] = useState<FirestoreGuest['status']>('Pending');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const eventId = activeEvent?.id;

  const loadGuests = useCallback(async () => {
    if (!eventId) {
      setGuests([]);
      setLoading(false);
      return;
    }

    if (eventId.startsWith('evt-')) {
      // Mock event that does not exist in Firestore
      setGuests([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!user) {
      setGuests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getEventGuests(eventId);
      setGuests(data as FirestoreGuest[]);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load guests';
      setError(msg);
      console.error('[GuestManagement]', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Computed stats from real records
  const acceptedCount = guests.filter(g => g.status === 'Accepted').reduce((sum, g) => sum + (Number(g.partySize) || 1), 0);
  const pendingCount = guests.filter(g => g.status === 'Pending').reduce((sum, g) => sum + (Number(g.partySize) || 1), 0);
  const declinedCount = guests.filter(g => g.status === 'Declined').reduce((sum, g) => sum + (Number(g.partySize) || 1), 0);
  const totalGuests = guests.reduce((sum, g) => sum + (Number(g.partySize) || 1), 0);

  const filteredGuests = guests.filter(g => {
    const matches = g.name.toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (filter === 'All') return true;
    return g.status === filter;
  });

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !eventId || !user) return;
    setSaving(true);
    try {
      const id = await createGuest(eventId, {
        name: formName.trim(),
        partySize: Number(formPartySize) || 1,
        dietary: formDietary,
        status: formStatus,
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase(),
      });
      const newGuest: FirestoreGuest = {
        id,
        name: formName.trim(),
        partySize: Number(formPartySize) || 1,
        dietary: formDietary,
        status: formStatus,
        eventId,
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase(),
      };
      setGuests(prev => [newGuest, ...prev]);
      setFormName('');
      setFormPartySize('1');
      setFormPhone('');
      setFormEmail('');
      setShowAddModal(false);
      toast.success('Guest added successfully');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add guest');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (guest: FirestoreGuest, newStatus: FirestoreGuest['status']) => {
    setMenuOpen(null);
    setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, status: newStatus } : g));
    try {
      await updateGuest(guest.id, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, status: guest.status } : g));
    }
  };

  const handleDelete = async (guestId: string) => {
    setMenuOpen(null);
    setGuests(prev => prev.filter(g => g.id !== guestId));
    try {
      await deleteGuest(guestId);
      toast.success('Guest removed');
    } catch {
      toast.error('Failed to remove guest');
      loadGuests();
    }
  };

  if (!eventId) {
    return (
      <div className="guest-management-page">
        <div className="empty-state-container">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No event selected</h3>
          <p className="empty-state-text">Select or create an event to manage its guest list.</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-event')} style={{ marginTop: 12 }}>
            <Plus size={16} /> Create an Event
          </button>
        </div>
      </div>
    );
  }

  if (eventId.startsWith('evt-')) {
    return (
      <div className="guest-management-page">
        <div className="empty-state-container" style={{ maxWidth: 440, margin: '40px auto', textAlign: 'center' }}>
          <Calendar size={40} style={{ color: 'var(--color-tuxedo-black)', margin: '0 auto 12px' }} />
          <h3 className="empty-state-title font-serif">Sample Event Selected</h3>
          <p className="empty-state-text">
            "{activeEvent?.eventName}" is a preview template. Create your own persistent event to add and manage live guests.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/create-event')} style={{ marginTop: 16 }}>
            <Plus size={16} /> Create My Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-management-page" onClick={() => setMenuOpen(null)}>
      {/* Stats row — computed from real data */}
      <div className="guest-stats-row">
        <div className="guest-stat-box accepted">
          <div className="g-stat-icon"><CheckCircle2 size={16} /></div>
          <span className="g-stat-num">{acceptedCount}</span>
          <span className="g-stat-lbl">Attending</span>
        </div>
        <div className="guest-stat-box pending">
          <div className="g-stat-icon"><Clock size={16} /></div>
          <span className="g-stat-num">{pendingCount}</span>
          <span className="g-stat-lbl">Pending</span>
        </div>
        <div className="guest-stat-box declined">
          <div className="g-stat-icon"><XCircle size={16} /></div>
          <span className="g-stat-num">{declinedCount}</span>
          <span className="g-stat-lbl">Declined</span>
        </div>
      </div>

      {totalGuests > 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', margin: '-4px 0 8px' }}>
          <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
          {totalGuests} total attending guests across {guests.length} RSVP records
        </div>
      )}

      <div className="guest-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search guests by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="guest-filter-tabs">
        {(['All', 'Accepted', 'Pending', 'Declined'] as const).map(tab => (
          <button
            key={tab}
            className={`g-tab-chip ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab} ({tab === 'All' ? guests.length : guests.filter(g => g.status === tab).length})
          </button>
        ))}
      </div>

      {loading && (
        <div className="tasks-loading-state">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading guests from database...</span>
        </div>
      )}

      {error && !loading && (
        <div className="tasks-error-state" style={{ flexDirection: 'column', gap: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={20} style={{ color: '#dc2626' }} />
            <span style={{ fontWeight: 500 }}>{error}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={loadGuests}>Retry</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/events')}>Switch Event</button>
          </div>
        </div>
      )}

      {!loading && !error && guests.length === 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No guests added yet</h3>
          <p className="empty-state-text">Start by adding your first guest or sharing your RSVP link.</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: 12 }}>
            <Plus size={16} /> Add First Guest
          </button>
        </div>
      )}

      {!loading && !error && guests.length > 0 && (
        <div className="guest-items-list">
          {filteredGuests.map(guest => (
            <div key={guest.id} className="guest-row-card" onClick={e => e.stopPropagation()}>
              <div className="g-checkbox">
                {guest.status === 'Accepted' && <Check size={12} strokeWidth={3} />}
              </div>

              <div className="g-info-col">
                <div className="g-name-line">
                  <span className="g-name">{guest.name}</span>
                  <span className={`g-status-pill g-status-${guest.status.toLowerCase()}`}>
                    {guest.status === 'Accepted' && '✓ '}
                    {guest.status === 'Pending' && '⏱ '}
                    {guest.status === 'Declined' && '✕ '}
                    {guest.status}
                  </span>
                  <button
                    className="g-menu-btn"
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === guest.id ? null : guest.id); }}
                    aria-label="Options"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>

                <div className="g-meta-line">
                  <span className="g-party">Party of {guest.partySize}</span>
                  <span className="g-dot">·</span>
                  <span className="g-dietary">{guest.dietary}</span>
                  {guest.phone && (
                    <>
                      <span className="g-dot">·</span>
                      <span className="g-phone">{guest.phone}</span>
                    </>
                  )}
                </div>
              </div>

              {menuOpen === guest.id && (
                <div className="guest-action-dropdown">
                  <div className="dropdown-label">Change Status</div>
                  {(['Accepted', 'Pending', 'Declined'] as const).map(s => (
                    <button
                      key={s}
                      className={`action-drop-item ${guest.status === s ? 'active' : ''}`}
                      onClick={() => handleStatusUpdate(guest, s)}
                    >
                      {s}
                    </button>
                  ))}
                  <div className="dropdown-divider" />
                  <button
                    className="action-drop-item danger"
                    onClick={() => handleDelete(guest.id)}
                  >
                    <Trash2 size={13} style={{ display: 'inline', marginRight: 6 }} />
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Guest Button */}
      <button className="fab-add-guest" onClick={() => setShowAddModal(true)} title="Add Guest">
        <Plus size={24} />
      </button>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="guest-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="guest-modal-header">
              <h3 className="modal-title font-serif">Add Guest</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddGuest} className="guest-modal-form">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Priya Sharma"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Party Size</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formPartySize}
                    onChange={e => setFormPartySize(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">RSVP Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as FirestoreGuest['status'])}
                    className="form-input"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dietary Preference</label>
                <select
                  value={formDietary}
                  onChange={e => setFormDietary(e.target.value as FirestoreGuest['dietary'])}
                  className="form-input"
                >
                  {DIETARY_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (optional)</label>
                <input
                  type="email"
                  placeholder="priya@example.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={saving || !formName.trim()}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
