import { logger } from '../../utils/logger';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, ChevronRight, ChevronLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
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

const THEMES = [
  'Traditional + Modern',
  'Classic Elegance',
  'Bohemian',
  'Garden Party',
  'Modern Minimalist',
  'Rustic',
  'Glamorous',
  'Tropical',
];

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
    budget: 0,
    currency: 'INR',
    theme: '',
    requirements: '',
  });

  const [errors, setErrors] = useState<{
    eventName?: string;
    eventDate?: string;
    guestCount?: string;
    budget?: string;
  }>({});

  function set<K extends keyof EventForm>(k: K, v: EventForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k as keyof typeof errors]) {
      setErrors(e => ({ ...e, [k]: undefined }));
    }
  }

  function validateStep(currentStep: number): boolean {
    const newErrors: typeof errors = {};

    if (currentStep === 2) {
      if (!form.eventName.trim()) {
        newErrors.eventName = 'Event name is required';
      }
      if (!form.eventDate) {
        newErrors.eventDate = 'Event date is required';
      } else {
        const d = new Date(form.eventDate);
        if (isNaN(d.getTime())) {
          newErrors.eventDate = 'Please select a valid date';
        }
      }
    }

    if (currentStep === 3) {
      if (!form.guestCount || form.guestCount < 1) {
        newErrors.guestCount = 'Guest count must be at least 1';
      }
      if (form.budget < 0) {
        newErrors.budget = 'Budget cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep(s => Math.min(s + 1, totalSteps));
  }

  async function handleCreate() {
    if (!validateStep(2) || !validateStep(3)) {
      toast.error('Please fix validation errors before creating your event.');
      return;
    }

    setSaving(true);
    try {
      const created = await addEvent({
        eventType: form.eventType,
        eventName: form.eventName.trim(),
        eventDate: form.eventDate,
        date: form.eventDate,
        location: form.location.trim() || 'TBD',
        guestCount: Number(form.guestCount) || 100,
        budget: Number(form.budget) || 0,
        currency: form.currency,
        theme: form.theme || 'Classic Elegance',
        requirements: form.requirements.trim(),
        coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        planSummary: '',
      });

      await refresh();
      toast.success('Celebration created successfully!');
      navigate(`/ai-plan-preview?eventId=${created.id}`);
    } catch (err) {
      logger.error('[CreateEvent] Error creating event:', err);
      toast.error('Failed to create event: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-event-page">
      <div className="create-event-header">
        <button
          className="btn-icon"
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          aria-label="Previous step"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="step-progress">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`step-dot ${i + 1 <= step ? 'active' : ''}`} />
          ))}
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Step {step} of {totalSteps}
        </span>
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
                  type="button"
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
            <p className="create-subtitle">Let's set up the core details for your {form.eventType.toLowerCase()}.</p>

            <div className="create-form">
              <div className="form-group">
                <label className="form-label">Event type</label>
                <select className="form-input" value={form.eventType} onChange={e => set('eventType', e.target.value)}>
                  {EVENT_TYPES.map(et => <option key={et.id} value={et.id}>{et.icon} {et.id}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Event name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.eventName ? 'input-error' : ''}`}
                  placeholder={`E.g. ${form.eventType === 'Wedding' ? 'Celine & James Wedding' : 'My Birthday Bash'}`}
                  value={form.eventName}
                  onChange={e => set('eventName', e.target.value)}
                  autoFocus
                />
                {errors.eventName && (
                  <span className="form-error-msg" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                    <AlertCircle size={12} /> {errors.eventName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Event date *
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.eventDate ? 'input-error' : ''}`}
                  value={form.eventDate}
                  onChange={e => set('eventDate', e.target.value)}
                />
                {errors.eventDate && (
                  <span className="form-error-msg" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                    <AlertCircle size={12} /> {errors.eventDate}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Location (City or Venue)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="E.g. Mumbai, Maharashtra"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                />
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
                  Estimated guest count *
                </label>
                <input
                  type="number"
                  className={`form-input ${errors.guestCount ? 'input-error' : ''}`}
                  min="1"
                  max="100000"
                  value={form.guestCount}
                  onChange={e => set('guestCount', Number(e.target.value))}
                />
                {errors.guestCount && (
                  <span className="form-error-msg" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                    <AlertCircle size={12} /> {errors.guestCount}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {[
                    { label: 'INR (₹)', value: 'INR' },
                    { label: 'USD ($)', value: 'USD' },
                    { label: 'EUR (€)', value: 'EUR' },
                    { label: 'GBP (£)', value: 'GBP' },
                    { label: 'AED (د.إ)', value: 'AED' },
                  ].map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Total estimated budget
                </label>
                <input
                  type="number"
                  className={`form-input ${errors.budget ? 'input-error' : ''}`}
                  min="0"
                  step="1000"
                  value={form.budget}
                  onChange={e => set('budget', Number(e.target.value))}
                />
                {errors.budget ? (
                  <span className="form-error-msg" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                    <AlertCircle size={12} /> {errors.budget}
                  </span>
                ) : (
                  <span className="form-hint" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                    {form.budget > 0
                      ? (form.currency === 'INR'
                        ? `₹${(form.budget / 100000).toFixed(2)} Lakhs`
                        : `${form.currency} ${form.budget.toLocaleString()}`)
                      : 'Leave as 0 if budget is not decided yet'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Theme & Requirements */}
        {step === 4 && (
          <div className="create-step animate-slide-up">
            <h1 className="create-title font-serif">Theme & Preferences</h1>
            <p className="create-subtitle">Optional — helps our AI tailor suggestions to your taste.</p>

            <div className="create-form">
              <div className="form-group">
                <label className="form-label">Preferred theme style</label>
                <select className="form-input" value={form.theme} onChange={e => set('theme', e.target.value)}>
                  <option value="">Select theme style...</option>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Special requests or notes</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 110, resize: 'vertical' }}
                  placeholder="E.g. outdoor sunset venue, live acoustic music, Jain catering options..."
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
          type="button"
          className="btn btn-primary w-full"
          disabled={saving}
          onClick={step < totalSteps ? handleNext : handleCreate}
        >
          {saving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={16} className="animate-spin" />
              Saving Event...
            </span>
          ) : step < totalSteps ? (
            <>
              Next <ChevronRight size={16} />
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate AI Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
