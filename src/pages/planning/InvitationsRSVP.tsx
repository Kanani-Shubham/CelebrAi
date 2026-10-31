import { logger } from '../../utils/logger';
import { AI_MODEL_NAME } from '../../config/ai';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, CheckCircle2, Clock, XCircle, Share2, Sparkles } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { getEventGuests } from '../../services/firebase/firestore';
import { toast } from '../../components/ui/toast';
import { formatDisplayDate } from '../../utils/dateUtils';
import './InvitationsRSVP.css';

export function InvitationsRSVP() {
  const navigate = useNavigate();
  const { activeEvent } = useEvent();
  const [slide, setSlide] = useState(1);
  const [copied, setCopied] = useState(false);

  const [acceptedCount, setAcceptedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [declinedCount, setDeclinedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const eventId = activeEvent?.id;

  useEffect(() => {
    let ignore = false;
    async function fetchGuestStats() {
      if (!eventId) {
        if (!ignore) setLoading(false);
        return;
      }
      try {
        const guestDocs = (await getEventGuests(eventId)) as unknown as { status?: string; partySize?: number }[];
        if (ignore) return;
        let acc = 0;
        let pen = 0;
        let dec = 0;
        guestDocs.forEach(g => {
          const size = g.partySize || 1;
          if (g.status === 'Accepted') acc += size;
          else if (g.status === 'Declined') dec += size;
          else pen += size;
        });
        if (!ignore) {
          setAcceptedCount(acc);
          setPendingCount(pen);
          setDeclinedCount(dec);
        }
      } catch (err) {
        logger.warn('[InvitationsRSVP] Error loading RSVP counts:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchGuestStats();
    return () => { ignore = true; };
  }, [eventId]);

  const eventName = activeEvent?.eventName || 'Our Special Celebration';
  const eventDate = formatDisplayDate(activeEvent?.eventDate || activeEvent?.date);
  const location = activeEvent?.location || 'Venue Location';
  const inviteLink = `${window.location.origin}/guest-rsvp?eventId=${activeEvent?.id || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('RSVP link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `RSVP for ${eventName}`,
        text: `You are invited to ${eventName}! Please RSVP here:`,
        url: inviteLink,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="invitations-rsvp-page">
      {/* Wedding Card Carousel Preview */}
      <div className="card-preview-container">
        <button
          className="carousel-arrow prev"
          onClick={() => setSlide(s => (s > 1 ? s - 1 : 3))}
          aria-label="Previous card style"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="card-mockup-frame">
          <div className="botanical-decor-top" />
          <div className="card-inner-text">
            <span className="card-subhead">Together with their families</span>
            <h2 className="card-couple-names">{eventName}</h2>
            <span className="card-invite-phrase">cordially request the honour of your presence</span>
            <span className="card-date-badge">{eventDate}</span>
            <span className="card-venue-text">{location}</span>
          </div>
          <div className="botanical-decor-bottom" />
        </div>

        <button
          className="carousel-arrow next"
          onClick={() => setSlide(s => (s < 3 ? s + 1 : 1))}
          aria-label="Next card style"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="slide-counter">
        <span>Template {slide} / 3</span>
      </div>

      {/* Share Invitation Section */}
      <div className="share-link-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="share-link-title">Guest RSVP Link</span>
          <button
            onClick={handleShare}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--color-tuxedo-black)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Share2 size={13} /> Share
          </button>
        </div>
        <div className="share-input-row">
          <input type="text" readOnly value={inviteLink} />
          <button className="copy-link-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : null}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* RSVP Real Stats */}
      <div className="rsvp-stats-grid">
        <div className="rsvp-stat-box accepted" onClick={() => navigate('/guests')}>
          <CheckCircle2 size={16} />
          <strong className="r-num">{loading ? '...' : acceptedCount}</strong>
          <span className="r-lbl">Confirmed</span>
        </div>

        <div className="rsvp-stat-box maybe" onClick={() => navigate('/guests')}>
          <Clock size={16} />
          <strong className="r-num">{loading ? '...' : pendingCount}</strong>
          <span className="r-lbl">Pending</span>
        </div>

        <div className="rsvp-stat-box declined" onClick={() => navigate('/guests')}>
          <XCircle size={16} />
          <strong className="r-num">{loading ? '...' : declinedCount}</strong>
          <span className="r-lbl">Declined</span>
        </div>
      </div>

      {/* Quick Link to Studio */}
      <div className="studio-promo-card" onClick={() => navigate('/content-studio')}>
        <div className="promo-icon">
          <Sparkles size={18} />
        </div>
        <div className="promo-text">
          <strong>Customize Digital Invitations in Content Studio</strong>
          <p>Generate WhatsApp copy, announcements, and banquet menus with {AI_MODEL_NAME}.</p>
        </div>
      </div>
    </div>
  );
}
