import { describe, it, expect } from 'vitest';
import { sanitizeText, isAllowedImageType, isWithinSizeLimit, sanitizePhone } from '../utils/security';

describe('Security Sanitizer', () => {
  it('strips script tags', () => {
    const result = sanitizeText('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('strips javascript: URLs', () => {
    const result = sanitizeText('javascript:alert(1)');
    expect(result).not.toContain('javascript:');
  });

  it('strips inline event handlers', () => {
    const result = sanitizeText('<a onclick="evil()">click</a>');
    expect(result).not.toContain('onclick');
  });

  it('enforces maxLength', () => {
    const long = 'a'.repeat(3000);
    expect(sanitizeText(long, 100).length).toBeLessThanOrEqual(100);
  });

  it('validates allowed image types', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true);
    expect(isAllowedImageType('image/png')).toBe(true);
    expect(isAllowedImageType('image/webp')).toBe(true);
    expect(isAllowedImageType('application/pdf')).toBe(false);
    expect(isAllowedImageType('image/gif')).toBe(false);
  });

  it('validates file size limits', () => {
    expect(isWithinSizeLimit(4 * 1024 * 1024)).toBe(true);   // 4MB ok
    expect(isWithinSizeLimit(6 * 1024 * 1024)).toBe(false);  // 6MB over
  });

  it('sanitizes phone numbers', () => {
    expect(sanitizePhone('+91 98765-43210')).toBe('+91 98765-43210');
    expect(sanitizePhone('abc123def')).toBe('123');
  });
});
