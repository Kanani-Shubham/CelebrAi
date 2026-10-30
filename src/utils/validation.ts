/**
 * Reusable validation module for CelebrAI.
 * Validates inputs across Guest, Event, and Profile forms
 * both client-side and before Firestore database operations.
 */

export interface ValidationResult<T = string> {
  valid: boolean;
  error?: string;
  normalized?: T;
}

/**
 * Validates a phone number.
 * Accepts:
 * - 10-digit Indian numbers (starting with 6, 7, 8, 9), optional +91 prefix
 * - Standard international formats (7-15 digits with optional +)
 * Rejects:
 * - Any alphabetic characters (e.g. "wenfn")
 * - Strings with invalid character counts
 */
export function validatePhone(input: string, optional = true): ValidationResult<string> {
  const trimmed = (input || '').trim();

  // If optional and empty, it's valid
  if (!trimmed) {
    if (optional) {
      return { valid: true, normalized: '' };
    }
    return { valid: false, error: 'Phone number is required.' };
  }

  // Reject any letters or invalid special characters immediately
  if (/[a-zA-Z]/.test(trimmed)) {
    return { valid: false, error: 'Phone number must contain digits only.' };
  }

  // Strip spaces, dashes, parentheses for numerical analysis
  const digitsOnly = trimmed.replace(/[\s\-\(\)]/g, '');

  // Must match valid phone character set (+ at start, followed by digits)
  if (!/^\+?[0-9]{7,15}$/.test(digitsOnly)) {
    return { valid: false, error: 'Please enter a valid 10-digit phone number (e.g. +91 98765 43210).' };
  }

  // Specific Indian mobile check (+91 or 10 digits starting with 6-9)
  if (digitsOnly.startsWith('+91')) {
    const local = digitsOnly.slice(3);
    if (local.length !== 10 || !/^[6-9]\d{9}$/.test(local)) {
      return { valid: false, error: 'Indian mobile numbers must have 10 digits starting with 6, 7, 8, or 9.' };
    }
    return { valid: true, normalized: `+91 ${local.slice(0, 5)} ${local.slice(5)}` };
  }

  if (digitsOnly.length === 10) {
    if (/^[6-9]\d{9}$/.test(digitsOnly)) {
      return { valid: true, normalized: `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}` };
    }
    return { valid: false, error: '10-digit Indian numbers should start with 6, 7, 8, or 9.' };
  }

  return { valid: true, normalized: digitsOnly };
}

/**
 * Validates email address format.
 */
export function validateEmail(input: string, optional = true): ValidationResult<string> {
  const trimmed = (input || '').trim().toLowerCase();

  if (!trimmed) {
    if (optional) {
      return { valid: true, normalized: '' };
    }
    return { valid: false, error: 'Email address is required.' };
  }

  // RFC 5322 compliant regex for practical email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed) || trimmed.length > 254) {
    return { valid: false, error: 'Please enter a valid email address (e.g. priya@example.com).' };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validates a guest name.
 */
export function validateGuestName(name: string): ValidationResult<string> {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Guest name is required.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must be under 100 characters.' };
  }
  return { valid: true, normalized: trimmed };
}

/**
 * Validates guest party size.
 */
export function validatePartySize(size: unknown): ValidationResult<number> {
  const num = Number(size);
  if (!Number.isInteger(num) || num < 1) {
    return { valid: false, error: 'Party size must be a positive integer (at least 1).' };
  }
  if (num > 50) {
    return { valid: false, error: 'Party size cannot exceed 50 per guest entry.' };
  }
  return { valid: true, normalized: num };
}

/**
 * Validates complete guest input data before database persistence.
 */
export interface GuestFormData {
  name: string;
  partySize: number | string;
  status?: string;
  dietary?: string;
  phone?: string;
  email?: string;
}

export function validateGuestForm(data: GuestFormData): {
  valid: boolean;
  errors: Record<string, string>;
  cleaned?: {
    name: string;
    partySize: number;
    status: 'Accepted' | 'Pending' | 'Declined';
    dietary: string;
    phone: string;
    email: string;
  };
} {
  const errors: Record<string, string> = {};

  const nameVal = validateGuestName(data.name);
  if (!nameVal.valid) errors.name = nameVal.error!;

  const partyVal = validatePartySize(data.partySize);
  if (!partyVal.valid) errors.partySize = partyVal.error!;

  const phoneVal = validatePhone(data.phone || '', true);
  if (!phoneVal.valid) errors.phone = phoneVal.error!;

  const emailVal = validateEmail(data.email || '', true);
  if (!emailVal.valid) errors.email = emailVal.error!;

  const validStatuses = ['Accepted', 'Pending', 'Declined'];
  const status = validStatuses.includes(data.status || '') ? (data.status as 'Accepted' | 'Pending' | 'Declined') : 'Pending';

  const validDietary = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'Gluten-Free', 'Halal', 'No Preference'];
  const dietary = validDietary.includes(data.dietary || '') ? data.dietary! : 'Vegetarian';

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    cleaned: {
      name: nameVal.normalized!,
      partySize: partyVal.normalized!,
      status,
      dietary,
      phone: phoneVal.normalized || '',
      email: emailVal.normalized || '',
    },
  };
}

/**
 * Validates an event creation form.
 */
export interface EventFormData {
  eventName: string;
  eventType: string;
  eventDate?: string;
  guestCount?: number | string;
  budget?: number | string;
}

export function validateEventForm(data: EventFormData): {
  valid: boolean;
  errors: Record<string, string>;
  cleaned?: {
    eventName: string;
    eventType: string;
    eventDate: string;
    guestCount: number;
    budget: number;
  };
} {
  const errors: Record<string, string> = {};

  const name = (data.eventName || '').trim();
  if (!name || name.length < 2) {
    errors.eventName = 'Event name is required (at least 2 characters).';
  }

  const type = (data.eventType || '').trim();
  if (!type) {
    errors.eventType = 'Please select an event category.';
  }

  const dateStr = (data.eventDate || '').trim();
  if (!dateStr) {
    errors.eventDate = 'Please select an event date.';
  } else {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      errors.eventDate = 'Please provide a valid date format.';
    }
  }

  const guestCount = Number(data.guestCount);
  if (isNaN(guestCount) || guestCount < 1) {
    errors.guestCount = 'Guest count must be at least 1.';
  }

  const budget = Number(data.budget);
  if (isNaN(budget) || budget < 0) {
    errors.budget = 'Budget must be a non-negative amount.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    cleaned: {
      eventName: name,
      eventType: type,
      eventDate: dateStr,
      guestCount: Math.round(guestCount),
      budget: Math.round(budget),
    },
  };
}

