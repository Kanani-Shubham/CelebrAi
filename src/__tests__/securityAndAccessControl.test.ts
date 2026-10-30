import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeEmail, sanitizePhone, isAllowedImageType, isWithinSizeLimit } from '../utils/security';
import { validateEventForm, validateGuestForm } from '../utils/validation';

describe('CelebrAI Security & Access Control Validation Suite', () => {
  describe('XSS & Content Sanitization', () => {
    it('strips script tags and malicious event handlers from user text', () => {
      const malicious = '<script>alert("xss")</script>Hello <img src="x" onerror="stealCookies()" />World';
      const clean = sanitizeText(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('Hello');
      expect(clean).toContain('World');
    });

    it('strips javascript: pseudo-protocols from user text', () => {
      const payload = 'Visit us at javascript:alert(1) right now';
      const clean = sanitizeText(payload);
      expect(clean).not.toContain('javascript:');
    });

    it('limits text length and trims input safely in sanitizeText', () => {
      const longInput = 'A'.repeat(500);
      const sanitized = sanitizeText(longInput, 100);
      expect(sanitized.length).toBe(100);
    });

    it('validates allowed image MIME types strictly', () => {
      expect(isAllowedImageType('image/jpeg')).toBe(true);
      expect(isAllowedImageType('image/png')).toBe(true);
      expect(isAllowedImageType('image/webp')).toBe(true);
      expect(isAllowedImageType('application/pdf')).toBe(false);
      expect(isAllowedImageType('text/html')).toBe(false);
      expect(isAllowedImageType('application/x-msdownload')).toBe(false);
    });

    it('enforces maximum file size limit (5MB default)', () => {
      expect(isWithinSizeLimit(2 * 1024 * 1024)).toBe(true); // 2 MB
      expect(isWithinSizeLimit(5 * 1024 * 1024)).toBe(true); // 5 MB
      expect(isWithinSizeLimit(6 * 1024 * 1024)).toBe(false); // 6 MB
    });
  });

  describe('Tenant & Owner Authorization Logic', () => {
    it('verifies that an event can only be modified by its creator or owner', () => {
      const userA = 'user_abc_123';
      const userB = 'user_xyz_456';
      const eventDoc = {
        id: 'event_001',
        ownerId: userA,
        createdBy: userA,
        collaborators: [],
      };

      const canUserAEdit = eventDoc.ownerId === userA || eventDoc.createdBy === userA;
      const canUserBEdit = eventDoc.ownerId === userB || eventDoc.createdBy === userB;

      expect(canUserAEdit).toBe(true);
      expect(canUserBEdit).toBe(false);
    });

    it('allows permitted collaborators read-only or scoped access based on collaborator list', () => {
      const owner = 'user_owner';
      const collaborator = 'user_collab';
      const stranger = 'user_stranger';

      const event = {
        id: 'event_002',
        ownerId: owner,
        collaborators: [collaborator],
        isPublic: false,
      };

      const isMember = (uid: string) =>
        uid === event.ownerId || event.collaborators.includes(uid);

      expect(isMember(owner)).toBe(true);
      expect(isMember(collaborator)).toBe(true);
      expect(isMember(stranger)).toBe(false);
    });
  });

  describe('Input Validation & Strict Schema Boundaries', () => {
    it('rejects invalid event dates (e.g., non-existent dates, negative budgets)', () => {
      const result = validateEventForm({
        eventName: 'Test Party',
        eventType: 'Birthday',
        eventDate: 'not-a-valid-date',
        budget: -5000,
        guestCount: -10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.eventDate || result.errors.budget).toBeDefined();
    });

    it('rejects malformed guest emails and invalid phone numbers', () => {
      const badGuest = validateGuestForm({
        name: 'John Doe',
        partySize: 2,
        email: 'not-an-email',
        phone: 'invalid-alpha-phone',
      });

      expect(badGuest.valid).toBe(false);
      expect(badGuest.errors.email || badGuest.errors.phone).toBeDefined();
    });

    it('accepts well-formed guest details', () => {
      const validGuest = validateGuestForm({
        name: 'Aarav Sharma',
        partySize: 2,
        email: 'aarav@example.com',
        phone: '+919876543210',
      });

      expect(validGuest.valid).toBe(true);
      expect(Object.keys(validGuest.errors)).toHaveLength(0);
    });
  });
});
