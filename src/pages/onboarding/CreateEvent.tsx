import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { createEvent } from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
import './CreateEvent.css';

const EVENT_TYPES = [
  { id: 'Wedding', icon: '💍', desc: 'Plan your perfect wedding' },
  { id: 'Birthday', icon: '🎂', desc: 'Make it memorable' },
  { id: 'Anniversary', icon: '❤️', desc: 'Celebrate your love story' },
  { id: 'Corporate', icon: '🏢', desc: 'Professional events' },
  { id: 'Community', icon: '🎪', desc: 'Festivals & gatherings' },
  { id: 'College Event', icon: '🎓', desc: 'Fests, hackathons' },
  { id: 'Festival', icon: '🎉', desc: 'Cultural celebrations' },
  { id: 'Custom', icon: '✨', desc: 'Create your own' },
];

const THEMES = ['Traditional + Modern', 'Classic Elegance', 'Bohemian', 'Garden Party', 'Modern Minimalist', 'Rustic', 'Glamorous', 'Tropical'];

type EventForm = {
  eventType: string;
  eventName: string;
  eventDate: string;
  location: string;
  guestCount: number;
  budget: number;
  currency: string;
  theme: string;
  requirements: string;
};

export function CreateEvent() {
  const { user } = useAuth();
  const { addEvent, refresh } = useEvent();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventForm>({
    eventType: 'Wedding',
    eventName: '',
    eventDate: '',
    location: '',
    guestCount: 150,
    budget: 500000,
    currency: 'INR',
    theme: '',
    requirements: '',
  });

  function set<K extends keyof EventForm>(k: K, v: EventForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleCreate() {
    if (!form.eventName.trim() || !form.eventDate || !form.location) {
      toast.error('Please fill in event name, date, and location.');
      return;
    }
    setSaving(true);
    try {
      const created = await addEvent({
        ...form,
        coverImage: '',
        planSummary: '',
      });
      await refresh();
      navigate(`/ai-plan?eventId=${created.id}`);
    } catch (err) {
      console.warn('addEvent failed, attempting direct Firestore create:', err);
      if (user) {
        try {
          const id = await createEvent(user.uid, {
            ...form,
            coverImage: '',
            tasksTotal: 0,
            tasksDone: 0,
            planSummary: '',
          });
          await refresh();
          navigate(`/ai-plan?eventId=${id}`);
          return;
        } catch {
          // ignore
        }
      }
      toast.error('Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-event-page">
      <div className="create-event-header">
        <button className="btn-icon" onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <div className="step-progress">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`step-dot ${i + 1 <= step ? 'active' : ''}`} />
          ))}
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{step}/{totalSteps}</span>
      </div>

      <div className="create-event-content">
        {/* Step 1: Event Type */}
        {step === 1 && (
          <div className="create-step animate-slide-up">
            <h1 className="create-title font-serif">Choose Your Event</h1>
            <p className="create-subtitle">What are you planning? Let's create something amazing together.</p>
            <div className="event-type-select-grid">
              {EVENT_TYPES.map(et => (
                <button
                  key={et.id}
                  className={`event-type-select-btn ${form.eventType === et.id ? 'active' : ''}`}
                  onClick={() => set('eventType', et.id)}
                >
                  <span className="et-icon">{et.icon}</span>
                  <strong>{et.id}</strong>
                  <span className="et-desc">{et.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Basic Details */}
        {step === 2 && (
          <div className="create-step animate-slide-up">
            <h1 className="create-title font-serif">Event Details</h1>
            <p className="create-subtitle">Let's set up the basics for your event.</p>

            <div className="create-form">
              <div className="form-group">
                <label className="form-label">Event type</label>
                <select className="form-input" value={form.eventType} onChange={e => set('eventType', e.target.value)}>
                  {EVENT_TYPES.map(et => <option key={et.id} value={et.id}>{et.icon} {et.id}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Event name</label>
                <input
                  type="text" className="form-input"
                  placeholder={`E.g. ${form.eventType === 'Wedding' ? 'Celine & James Wedding' : 'My Birthday Party'}`}
                  value={form.eventName} onChange={e => set('eventName', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Event date
                </label>
                <input type="date" className="form-input" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Location
                </label>
                <input type="text" className="form-input" placeholder="City, State" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Guest Count & Budget */}
        {step === 3 && (
          <div className="create-step animate-slide-up">
            <h1 className="create-title font-serif">Guests & Budget</h1>
            <p className="create-subtitle">Help us plan the right scale for your event.</p>

            <div className="create-form">
              <div className="form-group">
                <label className="form-label">
                  <Users size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Guest count
                </label>
                <input
                  type="number" className="form-input" min="1" max="100000"
                  value={form.guestCount} onChange={e => set('guestCount', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {[{ label: 'INR (₹)', value: 'INR' }, { label: 'USD ($)', value: 'USD' }, { label: 'GBP (£)', value: 'GBP' }].map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Total budget ({form.currency === 'INR' ? '₹' : form.currency === 'USD' ? '$' : '£'})
                </label>
                <input
                  type="number" className="form-input" min="0"
                  value={form.budget} onChange={e => set('budget', Number(e.target.value))}
                />
                <span className="form-hint">
                  {form.currency === 'INR'
                    ? `₹${(form.budget / 100000).toFixed(1)}L`
                    : `${form.budget.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Theme & Requirements */}
        {step === 4 && (
          <div className="create-step animate-slide-up">
            <h1 className="create-title font-serif">Theme & Details</h1>
            <p className="create-subtitle">Optional — helps our AI create a better plan.</p>

            <div className="create-form">
              <div className="form-group">
                <label className="form-label">Theme (optional)</label>
                <select className="form-input" value={form.theme} onChange={e => set('theme', e.target.value)}>
                  <option value="">Select theme...</option>
                  {THEMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional requirements (optional)</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 100, resize: 'vertical' }}
                  placeholder="E.g. outdoor venue, specific cuisine, accessibility needs..."
                  value={form.requirements}
                  onChange={e => set('requirements', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="create-event-footer">
        <button
          className="btn btn-primary w-full"
          disabled={saving}
          onClick={() => {
            if (step < totalSteps) setStep(s => s + 1);
            else handleCreate();
          }}
        >
          {saving ? (
            <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : step < totalSteps ? (
            <>Next <ChevronRight size={16} /></>
          ) : (
            <><Sparkles size={16} /> Generate AI Plan</>
          )}
        </button>
      </div>
    </div>
  );
}
