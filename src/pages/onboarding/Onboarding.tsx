import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../services/firebase/auth';
import { toast } from '../../components/ui';
import './Onboarding.css';

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Singapore', 'Other'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Arabic', 'German'];
const CURRENCIES = [
  { label: 'INR (₹)', value: 'INR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'AED (د.إ)', value: 'AED' },
];
const PLANNING_STYLES = [
  { id: 'Traditional', icon: '🌸', label: 'Traditional' },
  { id: 'Modern', icon: '✨', label: 'Modern' },
  { id: 'Mix', icon: '💫', label: 'Mix of both' },
  { id: 'Minimal', icon: '🍃', label: 'Minimal' },
];

export function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName ?? '',
    country: 'India',
    language: 'English',
    currency: 'INR',
    planningStyle: 'Traditional',
  });

  const totalSteps = 4;

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName,
        country: form.country,
        language: form.language,
        currency: form.currency,
        planningStyle: form.planningStyle,
        onboardingComplete: true,
      });
      navigate('/create-event');
    } catch {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-page">
      {/* Step indicator */}
      <div className="onboarding-header">
        <div className="step-dots">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`step-dot ${i + 1 <= step ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      <div className="onboarding-content animate-slide-up">
        {/* Step 1: Name & Photo */}
        {step === 1 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title font-serif">Tell us about yourself</h1>
            <p className="onboarding-subtitle">This helps us create a personalized planning experience</p>

            <div className="photo-upload">
              <div className="photo-circle">
                <Camera size={24} color="var(--text-muted)" />
                <span>Add Photo (Optional)</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="displayName">Your name</label>
              <input
                id="displayName" type="text" className="form-input"
                placeholder="Your name" value={form.displayName}
                onChange={e => set('displayName', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Country & Language */}
        {step === 2 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title font-serif">Your location</h1>
            <p className="onboarding-subtitle">We'll customize your experience accordingly</p>

            <div className="form-group">
              <label className="form-label">Country</label>
              <select className="form-input" value={form.country} onChange={e => set('country', e.target.value)}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c === 'India' ? '🇮🇳 ' : ''}{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-input" value={form.language} onChange={e => set('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Planning Style */}
        {step === 3 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title font-serif">What's your planning style?</h1>
            <p className="onboarding-subtitle">Choose what resonates with you most</p>

            <div className="planning-styles">
              {PLANNING_STYLES.map(s => (
                <button
                  key={s.id}
                  className={`planning-style-btn ${form.planningStyle === s.id ? 'active' : ''}`}
                  onClick={() => set('planningStyle', s.id)}
                >
                  <span className="style-icon">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title font-serif">You're all set, {form.displayName?.split(' ')[0]}! 🎉</h1>
            <p className="onboarding-subtitle">Let's create your first event and generate a personalized plan with AI.</p>

            <div className="summary-card card card-body">
              {[
                { label: 'Name', value: form.displayName },
                { label: 'Country', value: form.country },
                { label: 'Language', value: form.language },
                { label: 'Currency', value: form.currency },
                { label: 'Planning Style', value: form.planningStyle },
              ].map(item => (
                <div key={item.label} className="summary-row">
                  <span className="summary-label">{item.label}</span>
                  <span className="summary-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="onboarding-footer">
        {step > 1 && (
          <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
            Back
          </button>
        )}
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={saving}
          onClick={() => {
            if (step < totalSteps) setStep(s => s + 1);
            else handleFinish();
          }}
        >
          {saving ? (
            <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : step < totalSteps ? (
            <>Continue <ChevronRight size={16} /></>
          ) : 'Create My First Event 🎉'}
        </button>
      </div>
    </div>
  );
}
