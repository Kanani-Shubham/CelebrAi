import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from '../../../components/ui';
import { validateGuestForm } from '../../../utils/validation';
import { DIETARY_OPTIONS, type FirestoreGuest } from './types';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cleaned: {
    name: string;
    partySize: number;
    dietary: FirestoreGuest['dietary'];
    status: FirestoreGuest['status'];
    phone?: string;
    email?: string;
  }) => Promise<boolean>;
}

export function GuestModal({ isOpen, onClose, onSave }: GuestModalProps) {
  const [formName, setFormName] = useState('');
  const [formPartySize, setFormPartySize] = useState('1');
  const [formDietary, setFormDietary] = useState<FirestoreGuest['dietary']>('Vegetarian');
  const [formStatus, setFormStatus] = useState<FirestoreGuest['status']>('Pending');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const valResult = validateGuestForm({
      name: formName,
      partySize: formPartySize,
      status: formStatus,
      dietary: formDietary,
      phone: formPhone,
      email: formEmail,
    });

    if (!valResult.valid || !valResult.cleaned) {
      setFormErrors(valResult.errors);
      const firstError = Object.values(valResult.errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }

    setFormErrors({});
    setSaving(true);
    const cleaned = valResult.cleaned;

    const ok = await onSave({
      name: cleaned.name,
      partySize: cleaned.partySize,
      dietary: cleaned.dietary as FirestoreGuest['dietary'],
      status: cleaned.status,
      phone: cleaned.phone,
      email: cleaned.email,
    });

    setSaving(false);
    if (ok) {
      setFormName('');
      setFormPartySize('1');
      setFormPhone('');
      setFormEmail('');
      setFormErrors({});
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="guest-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="guest-modal-header">
          <h3 className="modal-title font-serif">Add Guest</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="guest-modal-form">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="E.g. Priya Sharma"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
              }}
              className={`form-input ${formErrors.name ? 'input-error' : ''}`}
            />
            {formErrors.name && (
              <span style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {formErrors.name}
              </span>
            )}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Party Size</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formPartySize}
                onChange={(e) => {
                  setFormPartySize(e.target.value);
                  if (formErrors.partySize) setFormErrors((prev) => ({ ...prev, partySize: '' }));
                }}
                className={`form-input ${formErrors.partySize ? 'input-error' : ''}`}
              />
              {formErrors.partySize && (
                <span style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  {formErrors.partySize}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">RSVP Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as FirestoreGuest['status'])}
                className="form-input"
              >
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dietary Preference</label>
            <select
              value={formDietary}
              onChange={(e) => setFormDietary(e.target.value as FirestoreGuest['dietary'])}
              className="form-input"
            >
              {DIETARY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (optional)</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={formPhone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d+\s\-()]/g, '');
                setFormPhone(cleaned);
                if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
              }}
              className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
            />
            {formErrors.phone && (
              <span style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {formErrors.phone}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (optional)</label>
            <input
              type="email"
              placeholder="priya@example.com"
              value={formEmail}
              onChange={(e) => {
                setFormEmail(e.target.value);
                if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
              }}
              className={`form-input ${formErrors.email ? 'input-error' : ''}`}
            />
            {formErrors.email && (
              <span style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {formErrors.email}
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={saving || !formName.trim()}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
