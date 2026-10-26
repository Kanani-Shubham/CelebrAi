import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, Check, Heart, HelpCircle, XCircle, Loader2 } from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
import { createDoc } from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
import './GuestRSVP.css';

export function GuestRSVP() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeEvent } = useEvent();

  const eventId = searchParams.get('eventId') || activeEvent?.id || 'demo-event';

  const [attending, setAttending] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [guest1, setGuest1] = useState('');
  const [guest2, setGuest2] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dietary, setDietary] = useState<string>('None');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest1.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setSubmitting(true);
    try {
      await createDoc('rsvp', {
        eventId,
        name: guest1.trim(),
        additionalGuest: guestsCount > 1 ? guest2.trim() : null,
        attending,
        partySize: attending === 'no' ? 0 : guestsCount,
        email: email.trim() || null,
        phone: phone.trim() || null,
        dietary: attending === 'no' ? 'None' : dietary,
        notes: notes.trim() || null,
      });

      setSubmitted(true);
      toast.success('Your RSVP has been confirmed!');
    } catch (err) {
      console.error('[GuestRSVP] Submission failed:', err);
      toast.error('Failed to submit RSVP: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="guest-rsvp-page">
      <header className="page-header-nav">
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
      </header>

      <div className="rsvp-hero-title">
        <h1 className="rsvp-main-title">You're Invited!</h1>
        <p className="rsvp-subhead">Kindly respond to help us plan better.</p>
      </div>

      {/* Envelope Card */}
      <div className="rsvp-envelope-card">
        <div className="env-img-wrap">
          <img
            src="https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=600&q=80"
            alt="Wedding invitation envelope"
          />
        </div>
        <div className="env-card-info">
          <h2 className="env-event-title">{activeEvent?.eventName || 'Our Special Celebration'}</h2>
          <div className="env-meta">
            <span>📅 {activeEvent?.eventDate || activeEvent?.date || 'Date TBD'}</span>
            <span>📍 {activeEvent?.location || 'Venue TBD'}</span>
          </div>
        </div>
      </div>

      {submitted ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: '#F0FDF4',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: '0 0 8px 0', color: 'var(--color-tuxedo-black)' }}>
            Thank You, {guest1}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5', margin: '0 0 24px 0' }}>
            {attending === 'yes'
              ? `We have confirmed your attendance for ${guestsCount} guest(s). We can't wait to celebrate together!`
              : attending === 'maybe'
              ? 'We have noted your tentative response. You can update it anytime.'
              : 'Thank you for letting us know. You will be missed!'}
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/public-event')}
            style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)' }}
          >
            View Event Details
          </button>
        </div>
      ) : (
        <form className="rsvp-form" onSubmit={handleSubmit}>
          {/* Response Cards: Yes, Maybe, No */}
          <div className="rsvp-question-group">
            <label className="rsvp-question-label">Your Response</label>
            <span className="rsvp-question-sub">Will you be attending?</span>

            <div className="attendance-options-grid">
              <div
                className={`attendance-card ${attending === 'yes' ? 'selected' : ''}`}
                onClick={() => setAttending('yes')}
              >
                <div className="att-icon-wrap yes">
                  <Heart size={16} fill={attending === 'yes' ? 'currentColor' : 'none'} />
                </div>
                <strong className="att-title">Yes,</strong>
                <span className="att-desc">I'll be there</span>
              </div>

              <div
                className={`attendance-card ${attending === 'maybe' ? 'selected' : ''}`}
                onClick={() => setAttending('maybe')}
              >
                <div className="att-icon-wrap maybe">
                  <HelpCircle size={16} />
                </div>
                <strong className="att-title">Maybe</strong>
                <span className="att-desc">Not sure yet</span>
              </div>

              <div
                className={`attendance-card ${attending === 'no' ? 'selected' : ''}`}
                onClick={() => setAttending('no')}
              >
                <div className="att-icon-wrap no">
                  <XCircle size={16} />
                </div>
                <strong className="att-title">No</strong>
                <span className="att-desc">Unable to attend</span>
              </div>
            </div>
          </div>

          {/* Primary Guest Name */}
          <div className="rsvp-question-group">
            <label className="rsvp-question-label">Your Full Name *</label>
            <div className="numbered-input">
              <input
                type="text"
                placeholder="e.g. Maya Sharma"
                value={guest1}
                onChange={e => setGuest1(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="rsvp-question-group">
              <label className="rsvp-question-label">Email (Optional)</label>
              <input
                type="email"
                placeholder="maya@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            <div className="rsvp-question-group">
              <label className="rsvp-question-label">Phone (Optional)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
              />
            </div>
          </div>

          {attending !== 'no' && (
            <>
              {/* Number of Guests Stepper */}
              <div className="rsvp-question-group">
                <label className="rsvp-question-label">Total guests in your party</label>
                <div className="stepper-row">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setGuestsCount(c => Math.max(1, c - 1))}
                  >
                    -
                  </button>
                  <span className="step-val">{guestsCount}</span>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => setGuestsCount(c => Math.min(6, c + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              {guestsCount > 1 && (
                <div className="rsvp-question-group">
                  <label className="rsvp-question-label">Accompanying Guest Name</label>
                  <div className="numbered-input">
                    <span className="num-prefix">2.</span>
                    <input
                      type="text"
                      placeholder="e.g. Partner or family member"
                      value={guest2}
                      onChange={e => setGuest2(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Dietary Requirements */}
              <div className="rsvp-question-group">
                <label className="rsvp-question-label">Dietary requirements (optional)</label>
                <div className="dietary-chips-wrap">
                  {['None', 'Vegetarian', 'Vegan', 'Halal', 'Gluten Free', 'Dairy Free', 'Other'].map(d => (
                    <button
                      key={d}
                      type="button"
                      className={`dietary-chip ${dietary === d ? 'active' : ''}`}
                      onClick={() => setDietary(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Notes */}
              <div className="rsvp-question-group">
                <label className="rsvp-question-label">Any special notes? (optional)</label>
                <textarea
                  rows={2}
                  placeholder="E.g. accessibility requirements, song recommendations..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="rsvp-submit-wrap">
            <button type="submit" className="submit-rsvp-btn" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting RSVP...</span>
                </>
              ) : (
                <>
                  <span>Submit RSVP</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
