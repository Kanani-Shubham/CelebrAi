import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Calendar, Sparkles, Heart, Clock } from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
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
        <div className="countdown-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '200px', margin: '0 auto 20px' }}>
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
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', marginTop: '16px', textAlign: 'left' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: '0 0 12px 0' }}>Program Schedule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', width: '80px' }}>05:30 PM</span>
                <span style={{ fontSize: '14px' }}>Welcome Drinks &amp; Foyer Reception</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', width: '80px' }}>07:00 PM</span>
                <span style={{ fontSize: '14px' }}>Main Ceremony &amp; Toast</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', width: '80px' }}>08:30 PM</span>
                <span style={{ fontSize: '14px' }}>Dinner Buffet &amp; Celebration</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
            <img src={coverImage} alt="Gallery 1" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
            <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80" alt="Gallery 2" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
          </div>
        )}

        {activeTab === 'travel' && (
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', marginTop: '16px', textAlign: 'left' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: '0 0 12px 0' }}>Travel &amp; Parking</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
              Valet parking will be available at the main entrance. For out-of-town guests arriving via airport or train station, cab services navigate directly to {location}.
            </p>
          </div>
        )}

        {/* Sticky RSVP Action */}
        <div style={{ marginTop: '24px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px' }}
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
