import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeText,
  sanitizeEventName,
  sanitizeGuestName,
  sanitizeChatInput,
  isAllowedImageType,
  isWithinSizeLimit,
  validateFileMetadata,
  sanitizePhone,
  sanitizeEmail,
  validateRSVPPayload,
} from '../utils/security';

describe('CelebrAI Application Security Utilities', () => {
  describe('escapeHtml & XSS Prevention', () => {
    it('escapes <, >, &, ", and apostrophe characters', () => {
      const dirty = '<script>alert("XSS & attack")</script>\'';
      const clean = escapeHtml(dirty);
      expect(clean).toBe('&lt;script&gt;alert(&quot;XSS &amp; attack&quot;)&lt;/script&gt;&#39;');
    });

    it('returns empty string for non-string input', () => {
      // @ts-expect-error test invalid input
      expect(escapeHtml(null)).toBe('');
    });
  });

  describe('sanitizeText & HTML Stripping', () => {
    it('removes script tags, inline event handlers, and javascript: links', () => {
      const malicious = '<p onclick="steal()">Click me</p><script>evil()</script><a href="javascript:void(0)">Link</a>';
      const clean = sanitizeText(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('javascript:');
      expect(clean).toContain('Click me');
    });

    it('enforces maximum length constraints', () => {
      const longText = 'a'.repeat(3000);
      expect(sanitizeText(longText, 50).length).toBe(50);
    });
  });

  describe('sanitizeEventName & sanitizeGuestName', () => {
    it('preserves celebration punctuation in event names while stripping HTML', () => {
      const raw = '<h1>Rohan & Priya\'s Wedding Gala!</h1>';
      expect(sanitizeEventName(raw)).toBe("Rohan & Priya's Wedding Gala!");
    });

    it('allows international Unicode names and standard name punctuation', () => {
      expect(sanitizeGuestName("Dr. René O'Connor-Smith")).toBe("Dr. René O'Connor-Smith");
      expect(sanitizeGuestName('<script>alert()</script>Sarah')).toBe('Sarah');
    });
  });

  describe('sanitizeChatInput', () => {
    it('preserves markdown prose while removing injection vectors', () => {
      const input = '**Budget Breakdown:** 40% Venue <script>bad()</script>';
      expect(sanitizeChatInput(input)).toBe('**Budget Breakdown:** 40% Venue');
    });
  });

  describe('File Upload Metadata Validation', () => {
    it('validates allowed image mime types and rejects executables and documents', () => {
      expect(isAllowedImageType('image/jpeg')).toBe(true);
      expect(isAllowedImageType('image/png')).toBe(true);
      expect(isAllowedImageType('image/webp')).toBe(true);
      expect(isAllowedImageType('application/pdf')).toBe(false);
      expect(isAllowedImageType('application/x-msdownload')).toBe(false);
    });

    it('checks file size bounds under 5 MB', () => {
      expect(isWithinSizeLimit(2 * 1024 * 1024, 5)).toBe(true);
      expect(isWithinSizeLimit(6 * 1024 * 1024, 5)).toBe(false);
    });

    it('rejects path traversal attempts in filenames', () => {
      const traversal = validateFileMetadata('../../etc/passwd.jpg', 'image/jpeg', 1024);
      expect(traversal.valid).toBe(false);
      expect(traversal.error).toContain('path traversal');

      const safe = validateFileMetadata('my-avatar.webp', 'image/webp', 2048);
      expect(safe.valid).toBe(true);
    });
  });

  describe('Phone and Email Sanitization', () => {
    it('strips invalid characters from phone numbers', () => {
      expect(sanitizePhone('+91 (987) 654-3210')).toBe('+91 (987) 654-3210');
    });

    it('normalizes email addresses to lowercase and trims whitespace', () => {
      expect(sanitizeEmail('  HOST.User@CelebrAI.APP  ')).toBe('host.user@celebrai.app');
    });
  });

  describe('validateRSVPPayload', () => {
    it('validates a complete and legitimate RSVP payload', () => {
      const payload = {
        eventId: 'evt-123',
        name: 'Jane Doe',
        attending: 'yes',
        partySize: 2,
        email: 'jane@example.com',
        phone: '+1 555-123-4567',
      };

      const result = validateRSVPPayload(payload);
      expect(result.valid).toBe(true);
      expect(result.cleaned?.name).toBe('Jane Doe');
      expect(result.cleaned?.partySize).toBe(2);
      expect(result.cleaned?.attending).toBe('yes');
    });

    it('flags invalid event ID, short names, and malformed emails', () => {
      const bad = {
        eventId: '',
        name: 'X',
        attending: 'invalid_status',
        partySize: 0,
        email: 'not-an-email',
      };

      const result = validateRSVPPayload(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.eventId).toBeDefined();
      expect(result.errors.name).toBeDefined();
      expect(result.errors.attending).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });
  });
});
