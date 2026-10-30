import { describe, it, expect } from 'vitest';
import { parseLocalDate, formatDisplayDate, calculateDaysCountdown } from '../utils/dateUtils';

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD without UTC day shift', () => {
    const d = parseLocalDate('2026-12-25');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(11); // 0-indexed December
    expect(d!.getDate()).toBe(25);
  });

  it('returns null for empty string', () => {
    expect(parseLocalDate('')).toBeNull();
  });

  it('returns null for "TBD"', () => {
    expect(parseLocalDate('TBD')).toBeNull();
  });

  it('returns null for "Date TBD"', () => {
    expect(parseLocalDate('Date TBD')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(parseLocalDate(null)).toBeNull();
    expect(parseLocalDate(undefined)).toBeNull();
  });

  it('parses a Date instance directly', () => {
    const now = new Date(2026, 5, 15); // June 15 2026 local
    expect(parseLocalDate(now)).toBe(now);
  });

  it('parses a numeric timestamp', () => {
    const ts = new Date(2027, 0, 1).getTime();
    const d = parseLocalDate(ts);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2027);
  });

  it('parses a Firestore Timestamp-like object with toDate()', () => {
    const fakeTs = { toDate: () => new Date(2028, 2, 7) };
    const d = parseLocalDate(fakeTs);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2028);
    expect(d!.getMonth()).toBe(2); // March
    expect(d!.getDate()).toBe(7);
  });

  it('parses a human-readable date string', () => {
    const d = parseLocalDate('7 March 2028');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2028);
  });
});

describe('formatDisplayDate', () => {
  it('returns a formatted date string', () => {
    const result = formatDisplayDate('2026-10-28');
    // Should contain the year and some recognisable part of the date
    expect(result).toContain('2026');
  });

  it('returns fallback for null input', () => {
    expect(formatDisplayDate(null)).toBe('Date TBD');
  });

  it('returns fallback for empty string', () => {
    expect(formatDisplayDate('')).toBe('Date TBD');
  });

  it('returns custom fallback when provided', () => {
    expect(formatDisplayDate(null, 'N/A')).toBe('N/A');
  });

  it('passes through an unparseable string as-is', () => {
    // A string that looks like a human label but can't be parsed as a date
    // will just pass through
    const result = formatDisplayDate('TBD');
    expect(result).toBe('TBD');
  });
});

describe('calculateDaysCountdown', () => {
  it('returns isToday=true for today\'s date', () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const result = calculateDaysCountdown(iso);
    expect(result.isToday).toBe(true);
    expect(result.days).toBe(0);
    expect(result.label).toBe('Today');
  });

  it('returns positive days for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    const result = calculateDaysCountdown(iso);
    expect(result.days).toBe(10);
    expect(result.isPast).toBe(false);
    expect(result.label).toContain('Left');
  });

  it('returns isPast=true for a past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const iso = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
    const result = calculateDaysCountdown(iso);
    expect(result.isPast).toBe(true);
    expect(result.days).toBeLessThan(0);
    expect(result.label).toContain('Ago');
  });

  it('returns Date TBD for null input', () => {
    const result = calculateDaysCountdown(null);
    expect(result.days).toBeNull();
    expect(result.label).toBe('Date TBD');
    expect(result.isToday).toBe(false);
    expect(result.isPast).toBe(false);
  });

  it('returns correct label for 1 day left (singular)', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const result = calculateDaysCountdown(iso);
    expect(result.label).toBe('1 Day Left');
  });

  it('returns correct label for 1 day ago (singular)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const result = calculateDaysCountdown(iso);
    expect(result.label).toBe('1 Day Ago');
  });
});
