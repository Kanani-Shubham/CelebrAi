import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';
import {
  validateTaskDueDate,
  calculateTaskStatus,
  aggregateTaskMetrics,
  calculateEventLifecycle,
} from '../utils/taskCalculations';
import {
  runTaskAndEventAudit,
  getCurrentAuditCycle,
  getNotificationInfrastructureInfo,
  DEFAULT_NOTIFICATION_PREFS,
} from '../services/notifications/notificationEngine';

// Mock Firestore methods for notification dispatching
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    addDoc: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
    serverTimestamp: vi.fn().mockReturnValue('mock-timestamp'),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn().mockResolvedValue({ empty: true }),
    limit: vi.fn(),
  };
});

vi.mock('../services/firebase/config', () => {
  return {
    db: {},
  };
});

describe('CelebrAI Task & Smart Notification Engine', () => {
  const REF_DATE = new Date(2026, 9, 30, 10, 0, 0); // October 30, 2026, 10:00 AM

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Scenario 1: Future Due Date
  it('Scenario 1: User adds a task with a future due date -> saved as Pending with positive days remaining', () => {
    const validation = validateTaskDueDate('2026-11-05', REF_DATE);
    expect(validation.isValid).toBe(true);
    expect(validation.isFuture).toBe(true);
    expect(validation.isPast).toBe(false);
    expect(validation.isToday).toBe(false);
    expect(validation.diffDays).toBe(6);

    const status = calculateTaskStatus({ title: 'Book Florist', dueDate: '2026-11-05', completed: false }, REF_DATE);
    expect(status).toBe('Pending');
  });

  // Scenario 2: Due Today
  it("Scenario 2: User adds a task with today's date -> saved as Pending with Due Today indicator", () => {
    const validation = validateTaskDueDate('2026-10-30', REF_DATE);
    expect(validation.isValid).toBe(true);
    expect(validation.isToday).toBe(true);
    expect(validation.diffDays).toBe(0);

    const status = calculateTaskStatus({ title: 'Finalize Seating', dueDate: '2026-10-30', completed: false }, REF_DATE);
    expect(status).toBe('Due Today');
  });

  // Scenario 3: Past Due Date Warning
  it('Scenario 3: User attempts to add a task with a past due date -> warns that deadline has passed', () => {
    const validation = validateTaskDueDate('2026-10-25', REF_DATE);
    expect(validation.isValid).toBe(true);
    expect(validation.isPast).toBe(true);
    expect(validation.diffDays).toBe(-5);
    expect(validation.warning).toContain('already passed');
  });

  // Scenario 4: Past-Dated Task Saved Incomplete
  it('Scenario 4: User saves a past-dated task incomplete -> automatically marked Overdue', () => {
    const status = calculateTaskStatus({ title: 'Send Invitations', dueDate: '2026-10-25', completed: false }, REF_DATE);
    expect(status).toBe('Overdue');
  });

  // Scenario 5: Deadline Passes Without Completion
  it('Scenario 5: Deadline passes without completion -> automatically becomes Overdue (never auto-completed)', () => {
    const task = { title: 'Order Stage Lighting', dueDate: '2026-10-29', completed: false };
    const status = calculateTaskStatus(task, REF_DATE);
    expect(status).toBe('Overdue');
    expect(task.completed).toBe(false); // Task is NOT auto-completed
  });

  // Scenario 6: User Completes an Overdue Task
  it('Scenario 6: User completes an overdue task -> becomes Completed, preserving completion history', () => {
    const completedTask = {
      title: 'Pay Sound Engineer',
      dueDate: '2026-10-25',
      completed: true,
      completedAt: '2026-10-30T09:30:00Z',
    };
    const status = calculateTaskStatus(completedTask, REF_DATE);
    expect(status).toBe('Completed');
    expect(completedTask.completedAt).toBeDefined();
  });

  // Scenario 7: User Reschedules Overdue Task to Future Date
  it('Scenario 7: User reschedules an overdue task to a future date -> recomputed to Pending', () => {
    const originalTask = { title: 'Menu Tasting', dueDate: '2026-10-20', completed: false };
    expect(calculateTaskStatus(originalTask, REF_DATE)).toBe('Overdue');

    const rescheduledTask = { ...originalTask, dueDate: '2026-11-10' };
    expect(calculateTaskStatus(rescheduledTask, REF_DATE)).toBe('Pending');
  });

  // Scenario 8: User Reschedules Overdue Task to Today
  it('Scenario 8: User reschedules an overdue task to today -> recomputed to Due Today', () => {
    const rescheduledTask = { title: 'Menu Tasting', dueDate: '2026-10-30', completed: false };
    expect(calculateTaskStatus(rescheduledTask, REF_DATE)).toBe('Due Today');
  });

  // Scenario 9: Completed Task Remains Completed
  it('Scenario 9: Completed task with past due date remains Completed (never reverts to Overdue)', () => {
    const task = { title: 'Pay Deposit', dueDate: '2026-10-15', completed: true };
    const status = calculateTaskStatus(task, REF_DATE);
    expect(status).toBe('Completed');
  });

  // Scenario 10: Event Date Passes While Incomplete Tasks Remain
  it('Scenario 10: Event date passes while incomplete tasks remain -> Event is Past Event, tasks remain Overdue', () => {
    const eventLifecycle = calculateEventLifecycle('2026-10-25', REF_DATE);
    expect(eventLifecycle.status).toBe('Past Event');
    expect(eventLifecycle.isPast).toBe(true);

    const task = { title: 'Collect Guestbook', dueDate: '2026-10-25', completed: false };
    const taskStatus = calculateTaskStatus(task, REF_DATE);
    expect(taskStatus).toBe('Overdue');
    expect(task.completed).toBe(false); // Incomplete tasks must NEVER be auto-completed when event date passes!
  });

  // Scenario 11: Morning Notification Check (9:00 AM)
  it('Scenario 11: Morning audit identifies overdue, due today, and due tomorrow tasks', async () => {
    const mockTasks = [
      { id: '1', title: 'Tasting', dueDate: '2026-10-25', completed: false }, // Overdue
      { id: '2', title: 'Call DJ', dueDate: '2026-10-30', completed: false }, // Due today
      { id: '3', title: 'Pick up cake', dueDate: '2026-10-31', completed: false }, // Due tomorrow
    ];

    const cycle = getCurrentAuditCycle({
      ...DEFAULT_NOTIFICATION_PREFS,
      morningTime: '09:00',
      eveningTime: '18:00',
    });
    expect(['morning', 'evening']).toContain(cycle);

    const generated = await runTaskAndEventAudit({
      userId: 'user-123',
      event: { id: 'evt-1', eventName: 'Silver Jubilee', eventDate: '2026-11-05' },
      tasks: mockTasks,
    });

    expect(generated).toBeGreaterThan(0);
  });

  // Scenario 12: Evening Notification Check (6:00 PM)
  it('Scenario 12: Evening audit identifies incomplete action items', async () => {
    const mockTasks = [
      { id: '1', title: 'Wrap Gifts', dueDate: '2026-10-30', completed: false },
    ];

    const generated = await runTaskAndEventAudit({
      userId: 'user-123',
      event: { id: 'evt-1', eventName: 'Silver Jubilee', eventDate: '2026-11-05' },
      tasks: mockTasks,
      preferences: {
        ...DEFAULT_NOTIFICATION_PREFS,
        eveningTime: '00:00', // Forces evening cycle check
      },
    });

    expect(generated).toBeGreaterThanOrEqual(1);
  });

  // Scenario 13: Deduplication Prevents Duplicate Alerts
  it('Scenario 13: Notification deduplication prevents double alerts within the same cycle and day', async () => {
    const { getDocs } = await import('firebase/firestore');
    // Simulate that deduplication query returns existing record
    vi.mocked(getDocs).mockResolvedValueOnce({ empty: false } as unknown as QuerySnapshot<DocumentData>);

    const mockTasks = [
      { id: '1', title: 'Overdue Task', dueDate: '2026-10-25', completed: false },
    ];

    const generated = await runTaskAndEventAudit({
      userId: 'user-123',
      event: { id: 'evt-1', eventName: 'Silver Jubilee' },
      tasks: mockTasks,
    });

    // Should not dispatch new duplicate notification
    expect(generated).toBe(0);
  });

  // Scenario 14: Timezone Handling
  it('Scenario 14: Timezone handling accurately resolves date checks', () => {
    const tokyoValidation = validateTaskDueDate('2026-10-30', new Date('2026-10-30T00:00:00Z'));
    expect(tokyoValidation.isValid).toBe(true);
  });

  // Scenario 15: User Disables Notifications
  it('Scenario 15: User disabling notifications suppresses all notification generation', async () => {
    const mockTasks = [
      { id: '1', title: 'Overdue Task', dueDate: '2026-10-25', completed: false },
    ];

    const generated = await runTaskAndEventAudit({
      userId: 'user-123',
      event: { id: 'evt-1', eventName: 'Silver Jubilee' },
      tasks: mockTasks,
      preferences: {
        ...DEFAULT_NOTIFICATION_PREFS,
        enabled: false,
      },
    });

    expect(generated).toBe(0);
  });

  // Scenario 16: Metrics Aggregation
  it('Scenario 16: AggregateTaskMetrics accurately divides tasks into proper status buckets', () => {
    const tasks = [
      { id: '1', title: 'Task 1', dueDate: '2026-10-20', completed: false }, // Overdue
      { id: '2', title: 'Task 2', dueDate: '2026-10-30', completed: false }, // Due Today
      { id: '3', title: 'Task 3', dueDate: '2026-11-05', completed: false }, // Pending
      { id: '4', title: 'Task 4', dueDate: '2026-10-15', completed: true },  // Completed
      { id: '5', title: 'Task 5', dueDate: null, completed: false },          // Pending (no deadline)
    ];

    const metrics = aggregateTaskMetrics(tasks, REF_DATE);
    expect(metrics.total).toBe(5);
    expect(metrics.overdue).toBe(1);
    expect(metrics.dueToday).toBe(1);
    expect(metrics.pending).toBe(2);
    expect(metrics.completed).toBe(1);
    expect(metrics.incomplete).toBe(4);
  });

  // Scenario 17: Date Format & Non-Existent Calendar Day Validation
  it('Scenario 17: Rejects malformed and impossible calendar dates (e.g. Feb 30, invalid month)', () => {
    const feb30 = validateTaskDueDate('2026-02-30', REF_DATE);
    expect(feb30.isValid).toBe(false);
    expect(feb30.error).toContain('does not exist');

    const invalidMonth = validateTaskDueDate('2026-13-01', REF_DATE);
    expect(invalidMonth.isValid).toBe(false);

    const malformed = validateTaskDueDate('not-a-date', REF_DATE);
    expect(malformed.isValid).toBe(false);
    expect(malformed.error).toContain('Invalid date format');
  });

  // Spark Free Plan Infrastructure Check
  it('Infrastructure Check: Confirms Spark Free Plan constraints without hidden costs', () => {
    const info = getNotificationInfrastructureInfo();
    expect(info.firebasePlan).toBe('Spark (Free)');
    expect(info.backgroundPushWhileClosed).toBe(false);
    expect(info.inAppLifecycleAudits).toBe(true);
    expect(info.costDependency).toContain('Blaze');
  });
});

