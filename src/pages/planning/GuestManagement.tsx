import React, { useState, useEffect, useCallback } from 'react';
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
    if (!eventId) { setGuests([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getEventGuests(eventId);
      setGuests(data as FirestoreGuest[]);
    } catch (err) {
      setError((err as Error).message || 'Failed to load guests');
      console.error('[GuestManagement]', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  // Computed stats from real data
  const acceptedCount = guests.reduce((sum, g) => g.status === 'Accepted' ? sum + g.partySize : sum, 0);
  const pendingCount = guests.filter(g => g.status === 'Pending').length;
  const declinedCount = guests.filter(g => g.status === 'Declined').length;
  const totalGuests = guests.reduce((sum, g) => sum + g.partySize, 0);

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
      setFormName(''); setFormPartySize('1'); setFormPhone(''); setFormEmail('');
      setShowAddModal(false);
      toast.success('Guest added');
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
          <p className="empty-state-text">Select an event to manage its guest list.</p>
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
          {totalGuests} total guests across {guests.length} records
        </div>
      )}

      <div className="guest-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search guests..."
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
          <span>Loading guests...</span>
        </div>
      )}

      {error && !loading && (
        <div className="tasks-error-state">
          <AlertCircle size={20} /><span>{error}</span>
          <button onClick={loadGuests}>Retry</button>
        </div>
      )}

      {!loading && !error && guests.length === 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No guests yet</h3>
          <p className="empty-state-text">Add your first guest to start building your list.</p>
        </div>
      )}

      {!loading && !error && (
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
                    aria-label="Guest options"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {menuOpen === guest.id && (
                    <div className="task-menu-dropdown">
                      <button className="task-menu-item" onClick={() => handleStatusUpdate(guest, 'Accepted')}>✓ Mark Accepted</button>
                      <button className="task-menu-item" onClick={() => handleStatusUpdate(guest, 'Pending')}>⏱ Mark Pending</button>
                      <button className="task-menu-item" onClick={() => handleStatusUpdate(guest, 'Declined')}>✕ Mark Declined</button>
                      <button className="task-menu-item delete" onClick={() => handleDelete(guest.id)}>
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="g-meta-line">
                  <span className="g-party">Party of {guest.partySize}</span>
                  <span className="g-dietary">{guest.dietary}</span>
                  {guest.email && <span className="g-email">{guest.email}</span>}
                </div>
              </div>
            </div>
          ))}

          {!loading && filteredGuests.length === 0 && guests.length > 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              No guests match your filter.
            </p>
          )}
        </div>
      )}

      <div className="guest-bottom-bar">
        <button className="add-guest-main-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Add Guest</span>
        </button>
      </div>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Add Guest</h3>
            <form onSubmit={handleAddGuest}>
              <div className="form-group">
                <label>Guest Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul & Priya Verma"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Party Size</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formPartySize}
                    onChange={e => setFormPartySize(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>RSVP Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as FirestoreGuest['status'])}>
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Dietary Requirement</label>
                <select value={formDietary} onChange={e => setFormDietary(e.target.value as FirestoreGuest['dietary'])}>
                  {DIETARY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Email (optional)</label>
                <input
                  type="email"
                  placeholder="guest@email.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Phone (optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                />
              </div>

              <div className="modal-btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving || !formName.trim()}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Add to List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
