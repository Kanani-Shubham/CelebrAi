import { CheckCircle2, Clock, XCircle, Users } from 'lucide-react';

interface GuestStatsRowProps {
  acceptedCount: number;
  pendingCount: number;
  declinedCount: number;
  totalGuests: number;
  recordsCount: number;
}

export function GuestStatsRow({
  acceptedCount,
  pendingCount,
  declinedCount,
  totalGuests,
  recordsCount,
}: GuestStatsRowProps) {
  return (
    <>
      <div className="guest-stats-row">
        <div className="guest-stat-box accepted">
          <div className="g-stat-icon">
            <CheckCircle2 size={16} />
          </div>
          <span className="g-stat-num">{acceptedCount}</span>
          <span className="g-stat-lbl">Attending</span>
        </div>
        <div className="guest-stat-box pending">
          <div className="g-stat-icon">
            <Clock size={16} />
          </div>
          <span className="g-stat-num">{pendingCount}</span>
          <span className="g-stat-lbl">Pending</span>
        </div>
        <div className="guest-stat-box declined">
          <div className="g-stat-icon">
            <XCircle size={16} />
          </div>
          <span className="g-stat-num">{declinedCount}</span>
          <span className="g-stat-lbl">Declined</span>
        </div>
      </div>

      {totalGuests > 0 && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            margin: '-4px 0 8px',
          }}
        >
          <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
          {totalGuests} total attending guests across {recordsCount} RSVP records
        </div>
      )}
    </>
  );
}
