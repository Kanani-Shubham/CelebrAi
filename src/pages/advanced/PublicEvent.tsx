import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Heart } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { getDocById } from '../../services/firebase/firestore';
import { formatDisplayDate, calculateDaysCountdown } from '../../utils/dateUtils';
import './PublicEvent.css';

export function PublicEvent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeEvent } = useEvent();

  const queryEventId = searchParams.get('eventId');
  const [eventData, setEventData] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'schedule' | 'gallery' | 'travel'>('about');

  useEffect(() => {
    async function resolveEvent() {
      if (queryEventId) {
        try {
          const doc = await getDocById('events', queryEventId);
          if (doc) {
            setEventData(doc);
            return;
          }
        } catch {
          // fallback
        }
      }
      if (activeEvent) {
        setEventData(activeEvent as unknown as Record<string, unknown>);
      }
    }
    resolveEvent();
  }, [queryEventId, activeEvent]);

  const eventName = String(eventData?.eventName || 'Special Celebration');
  const eventDate = formatDisplayDate(eventData?.eventDate as string || eventData?.date as string);
  const location = String(eventData?.location || 'Venue TBD');
  const coverImage = String(eventData?.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80');
  const theme = String(eventData?.theme || 'Classic Elegance');
  const eventType = String(eventData?.eventType || 'Celebration');

  // Compute real countdown using safe local date math
  const rawDate = (eventData?.eventDate || eventData?.date) as string | undefined;
  const countdown = calculateDaysCountdown(rawDate);
  const daysLeft = countdown?.days ?? 0;

  return (
    <div className="public-event-page">
      {/* Mock Browser URL Bar */}
      <div className="mock-browser-bar">
        <div className="url-capsule">
          <span className="url-lock">🔒</span>
          <span className="url-text">{window.location.hostname} · Public Invitation</span>
        </div>
      </div>

      {/* Hero Photo Banner */}
      <div className="pub-hero-wrap">
        <img src={coverImage} alt={eventName} />
      </div>

      {/* Hero Content */}
      <div className="pub-hero-content">
        <h1 className="pub-couple-name">{eventName}</h1>
        <span className="pub-event-subtitle">{eventType} Celebration</span>
        <div className="pub-location-date">
          <MapPin size={13} />
          <span>{eventDate} · {location}</span>
        </div>

        <p className="pub-heartfelt-quote">
          "We are delighted to celebrate this joyous milestone with our dearest friends and family. Your blessings and presence mean everything to us! ♡"
        </p>

        {/* Countdown Box */}
        <div className="countdown-grid countdown-single-col">
          <div className="countdown-box">
            <span className="c-num">{daysLeft}</span>
            <span className="c-lbl">
              {countdown?.isToday
                ? 'Celebration is Today!'
                : countdown?.isPast
                ? 'Days Since Celebration'
                : 'Days Until Celebration'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="pub-tabs-row">
          {(['about', 'schedule', 'gallery', 'travel'] as const).map(tab => (
            <button
              key={tab}
              className={`pub-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* About Card */}
        {activeTab === 'about' && (
          <>
            <div className="pub-story-card">
              <div className="story-text-col">
                <h3 className="story-title">Welcome Guests</h3>
                <p className="story-desc">
                  We have prepared an unforgettable experience filled with warmth, great music, and celebration.
                </p>
              </div>
              <div className="story-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=300&q=80"
                  alt="Celebration moment"
                />
              </div>
            </div>

            {/* Event Details Card (Only public information exposed) */}
            <div className="pub-details-card">
              <h3 className="details-title">Event Details</h3>

              <div className="details-item-row">
                <span className="d-icon">📍</span>
                <div>
                  <strong className="d-label">Venue Location</strong>
                  <span className="d-val">{location}</span>
                </div>
              </div>

              <div className="details-item-row">
                <span className="d-icon">📅</span>
                <div>
                  <strong className="d-label">Date &amp; Schedule</strong>
                  <span className="d-val">{eventDate}</span>
                </div>
              </div>

              <div className="details-item-row">
                <span className="d-icon">✨</span>
                <div>
                  <strong className="d-label">Theme / Dress Code</strong>
                  <span className="d-val">{theme}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'schedule' && (
          <div className="ui-card-xl mt-4 text-left">
            <h3 className="ui-section-title-sm">Program Schedule</h3>
            <div className="flex-col gap-3">
              <div className="flex-row items-center gap-3">
                <span className="font-semibold text-sm w-20">05:30 PM</span>
                <span className="text-sm">Welcome Drinks &amp; Foyer Reception</span>
              </div>
              <div className="flex-row items-center gap-3">
                <span className="font-semibold text-sm w-20">07:00 PM</span>
                <span className="text-sm">Main Ceremony &amp; Toast</span>
              </div>
              <div className="flex-row items-center gap-3">
                <span className="font-semibold text-sm w-20">08:30 PM</span>
                <span className="text-sm">Dinner Buffet &amp; Celebration</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="grid-2-col gap-2 mt-4">
            <img src={coverImage} alt="Gallery 1" className="w-full h-36 object-cover rounded-lg" />
            <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80" alt="Gallery 2" className="w-full h-36 object-cover rounded-lg" />
          </div>
        )}

        {activeTab === 'travel' && (
          <div className="ui-card-xl mt-4 text-left">
            <h3 className="ui-section-title-sm">Travel &amp; Parking</h3>
            <p className="text-sm text-muted m-0">
              Valet parking will be available at the main entrance. For out-of-town guests arriving via airport or train station, cab services navigate directly to {location}.
            </p>
          </div>
        )}

        {/* Sticky RSVP Action */}
        <div className="mt-6">
          <button className="btn btn-primary btn btn-primary rounded-full w-full py-3 flex-center gap-2 text-base"
            onClick={() => navigate(`/guest-rsvp?eventId=${eventData?.id || activeEvent?.id || ''}`)}
          >
            <Heart size={18} fill="currentColor" />
            <span>RSVP for this Event</span>
          </button>
        </div>
      </div>
    </div>
  );
}
