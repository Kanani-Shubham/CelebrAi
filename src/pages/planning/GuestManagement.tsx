import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useEvent } from '../../contexts/useEvent';
import { useGuests } from './guests/useGuests';
import { GuestStatsRow } from './guests/GuestStatsRow';
import { GuestRowCard } from './guests/GuestRowCard';
import { GuestModal } from './guests/GuestModal';
export type { FirestoreGuest } from './guests/types';
import './GuestManagement.css';

export function GuestManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent } = useEvent();
  const eventId = activeEvent?.id;

  const {
    guests,
    loading,
    error,
    stats,
    addGuest,
    setGuestStatus,
    removeGuest,
    reload,
  } = useGuests(eventId, user);

  const [filter, setFilter] = useState<'All' | 'Accepted' | 'Pending' | 'Declined'>('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q)) return false;
      if (filter === 'All') return true;
      return g.status === filter;
    });
  }, [guests, search, filter]);

  if (!eventId) {
    return (
      <div className="guest-management-page">
        <div className="empty-state-container">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No event selected</h3>
          <p className="empty-state-text">Select or create an event to manage its guest list.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/create-event')}
            style={{ marginTop: 12 }}
          >
            <Plus size={16} /> Create an Event
          </button>
        </div>
      </div>
    );
  }

  if (eventId.startsWith('evt-')) {
    return (
      <div className="guest-management-page">
        <div
          className="empty-state-container"
          style={{ maxWidth: 440, margin: '40px auto', textAlign: 'center' }}
        >
          <Calendar
            size={40}
            style={{ color: 'var(--color-tuxedo-black)', margin: '0 auto 12px' }}
          />
          <h3 className="empty-state-title font-serif">Sample Event Selected</h3>
          <p className="empty-state-text">
            "{activeEvent?.eventName}" is a preview template. Create your own persistent event to
            add and manage live guests.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/create-event')}
            style={{ marginTop: 16 }}
          >
            <Plus size={16} /> Create My Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-management-page" onClick={() => setMenuOpen(null)}>
      {/* Stats row — computed from real records */}
      <GuestStatsRow
        acceptedCount={stats.acceptedCount}
        pendingCount={stats.pendingCount}
        declinedCount={stats.declinedCount}
        totalGuests={stats.totalGuests}
        recordsCount={guests.length}
      />

      <div className="guest-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search guests by name..."
          aria-label="Search guests by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="guest-filter-tabs">
        {(['All', 'Accepted', 'Pending', 'Declined'] as const).map((tab) => (
          <button
            key={tab}
            className={`g-tab-chip ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab} ({tab === 'All' ? guests.length : guests.filter((g) => g.status === tab).length})
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
            <button className="btn btn-secondary btn-sm" onClick={reload}>
              Retry
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/events')}>
              Switch Event
            </button>
          </div>
        </div>
      )}

      {!loading && !error && guests.length === 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No guests added yet</h3>
          <p className="empty-state-text">Start by adding your first guest or sharing your RSVP link.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ marginTop: 12 }}
          >
            <Plus size={16} /> Add First Guest
          </button>
        </div>
      )}

      {!loading && !error && guests.length > 0 && (
        <div className="guest-items-list">
          {filteredGuests.map((guest) => (
            <GuestRowCard
              key={guest.id}
              guest={guest}
              isMenuOpen={menuOpen === guest.id}
              onToggleMenu={() => setMenuOpen(menuOpen === guest.id ? null : guest.id)}
              onStatusChange={(g, s) => setGuestStatus(g, s)}
              onDelete={removeGuest}
            />
          ))}
        </div>
      )}

      {guests.length > 0 && (
        <button
          className="fab-add-guest"
          onClick={() => setShowAddModal(true)}
          title="Add Guest"
        >
          <Plus size={24} />
        </button>
      )}

      <GuestModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addGuest}
      />
    </div>
  );
}
