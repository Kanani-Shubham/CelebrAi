import { describe, it, expect } from 'vitest';
import { getAuthErrorMessage, getIsAuthInProgress } from '../services/firebase/auth';

describe('CelebrAI Authentication Service & Error Handling Suite', () => {
  describe('Error Message Mapping', () => {
    it('maps auth/popup-closed-by-user to user-friendly message', () => {
      const msg = getAuthErrorMessage('auth/popup-closed-by-user');
      expect(msg).toBe('Sign-in was cancelled before completing.');
    });

    it('maps auth/popup-blocked with actionable instruction', () => {
      const msg = getAuthErrorMessage('auth/popup-blocked');
      expect(msg).toContain('Sign-in popup was blocked by your browser');
      expect(msg).toContain('allow popups or use redirect');
    });

    it('maps auth/unauthorized-domain with clear configuration instruction', () => {
      const msg = getAuthErrorMessage('auth/unauthorized-domain');
      expect(msg).toContain('Authorized Domains');
    });

    it('maps auth/operation-not-allowed with Google provider instructions', () => {
      const msg = getAuthErrorMessage('auth/operation-not-allowed');
      expect(msg).toContain('Google provider');
    });

    it('maps auth/network-request-failed to clear network advice', () => {
      const msg = getAuthErrorMessage('auth/network-request-failed');
      expect(msg).toContain('Network connection failed');
    });

    it('maps auth/invalid-credential to helpful message', () => {
      const msg = getAuthErrorMessage('auth/invalid-credential');
      expect(msg).toContain('Invalid credentials');
    });

    it('maps auth/too-many-requests with rate-limit advice', () => {
      const msg = getAuthErrorMessage('auth/too-many-requests');
      expect(msg).toContain('Too many attempts');
    });

    it('maps auth/cancelled-popup-request preventing multiple windows', () => {
      const msg = getAuthErrorMessage('auth/cancelled-popup-request');
      expect(msg).toContain('Only one sign-in window');
    });

    it('falls back to default error for unknown codes', () => {
      const msg = getAuthErrorMessage('auth/unknown-custom-code');
      expect(msg).toBe('Authentication failed. Please try again.');
    });
  });

  describe('Concurrency & Operation State', () => {
    it('initializes with isAuthInProgress as false', () => {
      expect(getIsAuthInProgress()).toBe(false);
    });
  });
});

