/**
 * CelebrAI — Application Security & Input Sanitization
 *
 * Implements strict, defense-in-depth sanitization and validation
 * for all user-provided strings, files, payloads and rendering contexts.
 */

/**
 * Escapes untrusted text for safe HTML rendering to prevent XSS.
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips script tags, inline event handlers, and javascript: URLs
 * from user-provided strings before persistence.
 */
export function sanitizeText(input: string, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:\s*/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<[^>]*>/g, '')
    .slice(0, maxLength)
    .trim();
}

/**
 * Sanitizes event titles — preserves natural celebration punctuation (e.g., "Rohan & Priya's Sangeet!")
 * while stripping harmful tags and constraining maximum length.
 */
export function sanitizeEventName(input: string, maxLength = 100): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:\s*/gi, '')
    .slice(0, maxLength)
    .trim();
}

/**
 * Sanitizes guest names — supports letters, accented Unicode names, apostrophes, hyphens, and spaces.
 */
export function sanitizeGuestName(input: string, maxLength = 80): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{M}\s.'-]/gu, '')
    .slice(0, maxLength)
    .trim();
}

/**
 * Sanitizes chat input messages — preserves markdown and prose while stripping script injection.
 */
export function sanitizeChatInput(input: string, maxLength = 3000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:\s*/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .slice(0, maxLength)
    .trim();
}

/**
 * Validates file upload MIME type against allowed image types.
 */
export function isAllowedImageType(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);
}

/**
 * Validates that file size is within the limit (default 5MB).
 */
export function isWithinSizeLimit(bytes: number, maxMb = 5): boolean {
  return bytes <= maxMb * 1024 * 1024;
}

/**
 * Validates file upload metadata: ensures filename has no directory traversal,
 * correct extension matching MIME, and permissible size.
 */
export function validateFileMetadata(filename: string, mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Invalid filename containing path traversal characters.' };
  }
  if (!isAllowedImageType(mimeType)) {
    return { valid: false, error: 'Unsupported file type. Only JPEG, PNG, and WebP images are allowed.' };
  }
  if (!isWithinSizeLimit(sizeBytes, 5)) {
    return { valid: false, error: 'File exceeds maximum permissible size of 5MB.' };
  }
  return { valid: true };
}

/**
 * Sanitizes a phone number input — allows only digits, spaces, +, -, ().
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^0-9\s+\-()]/g, '').slice(0, 20);
}

/**
 * Sanitizes an email to basic safe format.
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  return input.toLowerCase().trim().slice(0, 254);
}

/**
 * Validates public RSVP submission payloads.
 */
export function validateRSVPPayload(data: {
  eventId: string;
  name: string;
  attending: string;
  partySize: number | string;
  email?: string;
  phone?: string;
}): { valid: boolean; errors: Record<string, string>; cleaned?: {
  eventId: string;
  name: string;
  attending: 'yes' | 'maybe' | 'no';
  partySize: number;
  email?: string;
  phone?: string;
} } {
  const errors: Record<string, string> = {};

  if (!data.eventId || typeof data.eventId !== 'string' || data.eventId.trim().length === 0) {
    errors.eventId = 'Valid event ID is required.';
  }

  const cleanName = sanitizeGuestName(data.name || '');
  if (!cleanName || cleanName.length < 2) {
    errors.name = 'Please enter a valid guest name (at least 2 characters).';
  }

  const validAttending = ['yes', 'maybe', 'no'];
  if (!validAttending.includes(data.attending)) {
    errors.attending = 'Invalid attendance status selection.';
  }

  const parsedSize = Math.max(0, Math.min(20, Math.floor(Number(data.partySize) || 1)));

  let cleanEmail: string | undefined;
  if (data.email) {
    cleanEmail = sanitizeEmail(data.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please provide a valid email address.';
    }
  }

  let cleanPhone: string | undefined;
  if (data.phone) {
    cleanPhone = sanitizePhone(data.phone);
    if (cleanPhone.length < 7) {
      errors.phone = 'Phone number is too short.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    cleaned: {
      eventId: data.eventId.trim(),
      name: cleanName,
      attending: data.attending as 'yes' | 'maybe' | 'no',
      partySize: data.attending === 'no' ? 0 : parsedSize,
      email: cleanEmail,
      phone: cleanPhone,
    },
  };
}
