/**
 * CelebrAI Task Calculation and Date Validation Engine
 * 
 * Rules:
 * - A past due date does NOT mean a task is completed.
 * - Incomplete tasks with past due dates are automatically considered 'Overdue'.
 * - Future due dates are 'Pending'.
 * - Tasks due on the current day are 'Due Today'.
 * - Tasks with completed: true remain 'Completed' unless explicitly reopened.
 * - Event date passing marks event as past, but NEVER automatically marks tasks completed.
 */

import { parseLocalDate } from './dateUtils';

export type TaskStatus = 'Pending' | 'Due Today' | 'Overdue' | 'Completed';

export interface TaskRecord {
  id?: string;
  title?: string;
  dueDate?: string | null;
  completed?: boolean;
  completedAt?: unknown;
  category?: string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  rescheduleHistory?: { previousDate: string; newDate: string; changedAt: string }[];
}

export interface TaskDateValidationResult {
  isValid: boolean;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  diffDays: number;
  error?: string;
  warning?: string;
  formattedDueDate?: string;
}

/**
 * Validates a task's due date string against a reference date (default: now).
 * Strictly checks YYYY-MM-DD or standard ISO date calendar validity.
 */
export function validateTaskDueDate(
  dueDateStr?: string | null,
  referenceDate: Date = new Date()
): TaskDateValidationResult {
  if (!dueDateStr || typeof dueDateStr !== 'string' || !dueDateStr.trim()) {
    return {
      isValid: true,
      isPast: false,
      isToday: false,
      isFuture: false,
      diffDays: 0,
    };
  }

  const trimmed = dueDateStr.trim();

  // Validate YYYY-MM-DD format strictly
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!ymdMatch) {
    return {
      isValid: false,
      isPast: false,
      isToday: false,
      isFuture: false,
      diffDays: 0,
      error: 'Invalid date format. Expected YYYY-MM-DD.',
    };
  }

  const year = parseInt(ymdMatch[1], 10);
  const month = parseInt(ymdMatch[2], 10);
  const day = parseInt(ymdMatch[3], 10);

  if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      isValid: false,
      isPast: false,
      isToday: false,
      isFuture: false,
      diffDays: 0,
      error: 'Date numbers out of realistic range.',
    };
  }

  // Verify real calendar day (e.g. Feb 30 does not exist)
  const targetDate = new Date(year, month - 1, day, 12, 0, 0);
  if (
    targetDate.getFullYear() !== year ||
    targetDate.getMonth() !== month - 1 ||
    targetDate.getDate() !== day
  ) {
    return {
      isValid: false,
      isPast: false,
      isToday: false,
      isFuture: false,
      diffDays: 0,
      error: `Invalid calendar date: ${trimmed} does not exist in calendar.`,
    };
  }

  // Calculate day difference relative to start of reference day
  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  const targetStart = new Date(year, month - 1, day).getTime();
  const diffDays = Math.round((targetStart - refStart) / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isPast = diffDays < 0;
  const isFuture = diffDays > 0;

  return {
    isValid: true,
    isPast,
    isToday,
    isFuture,
    diffDays,
    warning: isPast
      ? `The deadline (${trimmed}) has already passed. Saving this task will mark it as Overdue.`
      : undefined,
    formattedDueDate: trimmed,
  };
}

/**
 * Single source of truth calculation for Task Status across all CelebrAI components.
 * 
 * Rules:
 * 1. If completed is true -> 'Completed'
 * 2. If no due date -> 'Pending'
 * 3. If due date is in the past -> 'Overdue'
 * 4. If due date is today -> 'Due Today'
 * 5. If due date is in the future -> 'Pending'
 */
export function calculateTaskStatus(
  task: TaskRecord,
  referenceDate: Date = new Date()
): TaskStatus {
  if (task.completed) {
    return 'Completed';
  }

  if (!task.dueDate) {
    return 'Pending';
  }

  const validation = validateTaskDueDate(task.dueDate, referenceDate);
  if (!validation.isValid) {
    return 'Pending';
  }

  if (validation.isPast) {
    return 'Overdue';
  }

  if (validation.isToday) {
    return 'Due Today';
  }

  return 'Pending';
}

/**
 * Aggregates task metrics into distinct, unambiguous buckets.
 */
export function aggregateTaskMetrics(
  tasks: TaskRecord[],
  referenceDate: Date = new Date()
) {
  let pending = 0;
  let dueToday = 0;
  let overdue = 0;
  let completed = 0;

  for (const t of tasks) {
    const status = calculateTaskStatus(t, referenceDate);
    if (status === 'Completed') {
      completed++;
    } else if (status === 'Overdue') {
      overdue++;
    } else if (status === 'Due Today') {
      dueToday++;
    } else {
      pending++;
    }
  }

  return {
    total: tasks.length,
    pending,
    dueToday,
    overdue,
    completed,
    incomplete: pending + dueToday + overdue,
  };
}

/**
 * Event lifecycle statuses:
 * - Upcoming: event date is in the future
 * - Ongoing: event date is today
 * - Past Event: event date has passed
 */
export type EventLifecycleStatus = 'Upcoming' | 'Ongoing' | 'Past Event';

export function calculateEventLifecycle(
  eventDateStr?: string | null,
  referenceDate: Date = new Date()
): { status: EventLifecycleStatus; isPast: boolean; daysRemaining: number | null } {
  if (!eventDateStr) {
    return { status: 'Upcoming', isPast: false, daysRemaining: null };
  }

  const parsed = parseLocalDate(eventDateStr);
  if (!parsed) {
    return { status: 'Upcoming', isPast: false, daysRemaining: null };
  }

  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  const targetStart = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  ).getTime();

  const diffDays = Math.round((targetStart - refStart) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { status: 'Ongoing', isPast: false, daysRemaining: 0 };
  }

  if (diffDays > 0) {
    return { status: 'Upcoming', isPast: false, daysRemaining: diffDays };
  }

  return { status: 'Past Event', isPast: true, daysRemaining: diffDays };
}
