import { describe, it, expect } from 'vitest';
import {
  validatePhone,
  validateEmail,
  validateGuestForm,
  validateEventForm,
} from '../utils/validation';

describe('validatePhone', () => {
  it('rejects alphabetic characters like "wenfn"', () => {
    const res = validatePhone('wenfn', false);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('digits only');
  });

  it('allows empty string if optional', () => {
    const res = validatePhone('', true);
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe('');
  });

  it('rejects empty string if required', () => {
    const res = validatePhone('', false);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('required');
  });

  it('validates and formats a 10-digit Indian mobile number', () => {
    const res = validatePhone('9876543210', false);
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe('+91 98765 43210');
  });

  it('validates a +91 prefixed Indian mobile number', () => {
    const res = validatePhone('+91 98765 43210', false);
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe('+91 98765 43210');
  });

  it('rejects an invalid Indian number starting with 1, 2, 3, 4, or 5', () => {
    const res = validatePhone('1234567890', false);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('start with 6, 7, 8, or 9');
  });

  it('rejects numbers with too few digits', () => {
    const res = validatePhone('12345', false);
    expect(res.valid).toBe(false);
  });
});

describe('validateEmail', () => {
  it('validates correct email addresses', () => {
    const res = validateEmail('priya@example.com');
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe('priya@example.com');
  });

  it('allows optional empty email', () => {
    const res = validateEmail('', true);
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe('');
  });

  it('rejects malformed email addresses', () => {
    expect(validateEmail('not-an-email').valid).toBe(false);
    expect(validateEmail('priya@').valid).toBe(false);
    expect(validateEmail('@domain.com').valid).toBe(false);
    expect(validateEmail('priya@domain').valid).toBe(false);
  });
});

describe('validateGuestForm', () => {
  it('validates complete valid guest input', () => {
    const res = validateGuestForm({
      name: 'Priya Sharma',
      partySize: 2,
      status: 'Accepted',
      dietary: 'Vegetarian',
      phone: '9876543210',
      email: 'priya@example.com',
    });
    expect(res.valid).toBe(true);
    expect(res.cleaned?.name).toBe('Priya Sharma');
    expect(res.cleaned?.partySize).toBe(2);
    expect(res.cleaned?.phone).toBe('+91 98765 43210');
  });

  it('rejects guest with alphabetic phone and short name', () => {
    const res = validateGuestForm({
      name: 'P',
      partySize: 0,
      phone: 'wenfn',
      email: 'bad-email',
    });
    expect(res.valid).toBe(false);
    expect(res.errors.name).toBeDefined();
    expect(res.errors.partySize).toBeDefined();
    expect(res.errors.phone).toBeDefined();
    expect(res.errors.email).toBeDefined();
  });
});

describe('validateEventForm', () => {
  it('validates correct event input', () => {
    const res = validateEventForm({
      eventName: 'Grand Wedding Reception',
      eventType: 'Wedding',
      eventDate: '2026-11-20',
      guestCount: 200,
      budget: 800000,
    });
    expect(res.valid).toBe(true);
    expect(res.cleaned?.eventName).toBe('Grand Wedding Reception');
    expect(res.cleaned?.guestCount).toBe(200);
  });

  it('rejects empty event name and invalid budget', () => {
    const res = validateEventForm({
      eventName: '',
      eventType: '',
      guestCount: -5,
      budget: -100,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.eventName).toBeDefined();
    expect(res.errors.eventType).toBeDefined();
    expect(res.errors.guestCount).toBeDefined();
    expect(res.errors.budget).toBeDefined();
  });
});

