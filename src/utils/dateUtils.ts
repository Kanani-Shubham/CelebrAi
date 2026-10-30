/**
 * CelebrAI Date and Timezone Utilities
 * Prevents UTC timezone day-shift bugs by parsing date-only strings in local time.
 */

/**
 * Safely parses a date input into a local Date instance.
 * Handles:
 * - "YYYY-MM-DD" (parses as local year, month, day to avoid UTC conversion shifts)
 * - ISO string
 * - Epoch timestamp / Firestore Timestamp
 * - "DD Month YYYY" (e.g. "7 March 2028")
 */
export function parseLocalDate(input: unknown): Date | null {
  if (!input) return null;

  // Firestore Timestamp
  if (typeof (input as { toDate?: () => Date }).toDate === 'function') {
    return (input as { toDate: () => Date }).toDate();
  }

  // Already a Date
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  // Number timestamp
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === 'TBD' || trimmed === 'Date TBD') return null;

    // Check for "YYYY-MM-DD" format
    const ymdMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const d = new Date(year, month, day, 12, 0, 0); // Noon local avoids DST edge cases
      return isNaN(d.getTime()) ? null : d;
    }

    const standard = new Date(trimmed);
    return isNaN(standard.getTime()) ? null : standard;
  }

  return null;
}

/**
 * Formats a date into a clean display string (e.g. "28 Oct 2026").
 */
export function formatDisplayDate(input: unknown, fallback = 'Date TBD'): string {
  const d = parseLocalDate(input);
  if (!d) return typeof input === 'string' && input ? input : fallback;

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a date with weekday (e.g. "Wednesday, 28 October 2026").
 */
export function formatFullDate(input: unknown, fallback = 'Date TBD'): string {
  const d = parseLocalDate(input);
  if (!d) return typeof input === 'string' && input ? input : fallback;

  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export interface CountdownResult {
  days: number | null;
  label: string;
  isToday: boolean;
  isPast: boolean;
}

/**
 * Calculates countdown from today to event date.
 * Accurately compares start of local day to start of local day.
 */
export function calculateDaysCountdown(eventDateInput: unknown): CountdownResult {
  const target = parseLocalDate(eventDateInput);
  if (!target) {
    return {
      days: null,
      label: 'Date TBD',
      isToday: false,
      isPast: false,
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  const diffMs = startOfTarget - startOfToday;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      days: 0,
      label: 'Today',
      isToday: true,
      isPast: false,
    };
  }

  if (diffDays > 0) {
    return {
      days: diffDays,
      label: `${diffDays} Day${diffDays === 1 ? '' : 's'} Left`,
      isToday: false,
      isPast: false,
    };
  }

  const pastDays = Math.abs(diffDays);
  return {
    days: diffDays,
    label: `${pastDays} Day${pastDays === 1 ? '' : 's'} Ago`,
    isToday: false,
    isPast: true,
  };
}

