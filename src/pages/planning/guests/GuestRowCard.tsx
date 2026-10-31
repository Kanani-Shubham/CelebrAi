import { Check, MoreVertical, Trash2 } from 'lucide-react';
import type { FirestoreGuest } from './types';

interface GuestRowCardProps {
  guest: FirestoreGuest;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onStatusChange: (guest: FirestoreGuest, status: FirestoreGuest['status']) => void;
  onDelete: (guestId: string) => void;
}

export function GuestRowCard({
  guest,
  isMenuOpen,
  onToggleMenu,
  onStatusChange,
  onDelete,
}: GuestRowCardProps) {
  return (
    <div className="guest-row-card" onClick={(e) => e.stopPropagation()}>
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu();
            }}
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

      {isMenuOpen && (
        <div className="guest-action-dropdown">
          <div className="dropdown-label">Change Status</div>
          {(['Accepted', 'Pending', 'Declined'] as const).map((s) => (
            <button
              key={s}
              className={`action-drop-item ${guest.status === s ? 'active' : ''}`}
              onClick={() => onStatusChange(guest, s)}
            >
              {s}
            </button>
          ))}
          <div className="dropdown-divider" />
          <button
            className="action-drop-item danger"
            onClick={() => onDelete(guest.id)}
          >
            <Trash2 size={13} style={{ display: 'inline', marginRight: 6 }} />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
