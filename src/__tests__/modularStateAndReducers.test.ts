import { describe, it, expect } from 'vitest';
import { calculateExpenseSummary, getCategoryTheme } from '../pages/planning/expenses/types';
import { groupConversations, formatHistoryTime } from '../pages/dashboard/chat/types';
import { calculateTaskStatus, aggregateTaskMetrics } from '../utils/taskCalculations';
import { INITIAL_EVENTS, INITIAL_TASKS, INITIAL_EXPENSES } from '../data/mockData';

describe('Modular Planning State & Calculations', () => {
  it('correctly aggregates mock tasks metrics', () => {
    const metrics = aggregateTaskMetrics(INITIAL_TASKS);
    expect(metrics.total).toBe(INITIAL_TASKS.length);
    expect(metrics.completed).toBe(INITIAL_TASKS.filter(t => t.completed).length);
    expect(metrics.pending).toBe(INITIAL_TASKS.filter(t => !t.completed).length);
  });

  it('calculates task status correctly for completed and pending items', () => {
    const completedTask = { id: 't1', title: 'Task 1', completed: true, dueDate: '2025-01-01' };
    const overdueTask = { id: 't2', title: 'Task 2', completed: false, dueDate: '2020-01-01' };
    const futureTask = { id: 't3', title: 'Task 3', completed: false, dueDate: '2030-01-01' };

    expect(calculateTaskStatus(completedTask)).toBe('Completed');
    expect(calculateTaskStatus(overdueTask)).toBe('Overdue');
    expect(calculateTaskStatus(futureTask)).toBe('Pending');
  });

  it('calculates expense summary with paid, pending, and overdue categories', () => {
    const summary = calculateExpenseSummary(INITIAL_EXPENSES);
    expect(summary.paid).toBeGreaterThan(0);
    expect(summary.pending).toBeGreaterThan(0);
    expect(typeof summary.remaining).toBe('number');
  });

  it('resolves valid category theme icons and color tokens', () => {
    const venueTheme = getCategoryTheme('Venue');
    expect(venueTheme.bg).toBe('#DBEAFE');
    expect(venueTheme.color).toBe('#1D4ED8');
    expect(venueTheme.icon).toBeDefined();

    const unknownTheme = getCategoryTheme('Unregistered');
    expect(unknownTheme.color).toBe('#7E57C2');
  });

  it('groups conversations into accurate temporal buckets', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

    const convs = [
      { id: 'c1', userId: 'u1', title: 'Chat 1', updatedAt: now, createdAt: now },
      { id: 'c2', userId: 'u1', title: 'Chat 2', updatedAt: yesterday, createdAt: yesterday },
      { id: 'c3', userId: 'u1', title: 'Chat 3', updatedAt: twoWeeksAgo, createdAt: twoWeeksAgo },
    ];

    const grouped = groupConversations(convs);
    expect(grouped.today.length).toBe(1);
    expect(grouped.yesterday.length).toBe(1);
    expect(grouped.older.length).toBe(1);
  });

  it('formats conversation history timestamps gracefully', () => {
    expect(formatHistoryTime(null)).toBe('Just now');
    expect(formatHistoryTime(new Date())).toMatch(/:/);
  });

  it('maintains integrity of initial seed events', () => {
    expect(INITIAL_EVENTS.length).toBeGreaterThanOrEqual(4);
    expect(INITIAL_EVENTS[0].eventName).toBe('Celine & James Wedding');
    expect(INITIAL_EVENTS[0].guestCount).toBe(250);
  });
});
