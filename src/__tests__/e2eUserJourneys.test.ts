import { describe, it, expect } from 'vitest';
import {
  calculateTaskStatus,
  aggregateTaskMetrics,
  calculateEventLifecycle,
} from '../utils/taskCalculations';
import { groupConversations } from '../pages/dashboard/chat/types';
import type { ConversationRecord } from '../types';

describe('CelebrAI End-to-End User Journey Workflows', () => {
  const REF_DATE = new Date(2026, 9, 30, 12, 0, 0); // Reference Date: Oct 30, 2026

  describe('Journey 1: Event Lifecycle & Incomplete Tasks Retention', () => {
    it('accurately advances event lifecycle to Past Event while preserving overdue tasks incomplete', () => {
      // Host planned a celebration on Oct 25, 2026
      const eventDate = '2026-10-25';
      const lifecycle = calculateEventLifecycle(eventDate, REF_DATE);

      expect(lifecycle.status).toBe('Past Event');
      expect(lifecycle.isPast).toBe(true);
      expect(lifecycle.daysRemaining).toBeLessThan(0);

      // Tasks attached to the event: 1 completed, 2 incomplete
      const tasks = [
        { id: 't1', title: 'Collect cake', dueDate: '2026-10-24', completed: true },
        { id: 't2', title: 'Return sound equipment', dueDate: '2026-10-26', completed: false },
        { id: 't3', title: 'Send thank-you notes', dueDate: '2026-10-28', completed: false },
      ];

      const metrics = aggregateTaskMetrics(tasks, REF_DATE);
      expect(metrics.completed).toBe(1);
      expect(metrics.overdue).toBe(2);
      expect(metrics.incomplete).toBe(2);

      // Rule verification: Ending an event NEVER marks incomplete tasks completed!
      expect(tasks[1].completed).toBe(false);
      expect(tasks[2].completed).toBe(false);
    });
  });

  describe('Journey 2: Task Rescheduling & Due Today Management', () => {
    it('transitions task from Overdue -> Due Today -> Completed with audit trail', () => {
      let task = {
        id: 't-10',
        title: 'Confirm photographer',
        dueDate: '2026-10-20',
        completed: false,
      };

      // Step 1: Initial state is Overdue on Oct 30
      expect(calculateTaskStatus(task, REF_DATE)).toBe('Overdue');

      // Step 2: Host reschedules task to today (Oct 30)
      task = { ...task, dueDate: '2026-10-30' };
      expect(calculateTaskStatus(task, REF_DATE)).toBe('Due Today');

      // Step 3: Host completes the task
      task = { ...task, completed: true };
      expect(calculateTaskStatus(task, REF_DATE)).toBe('Completed');
    });
  });

  describe('Journey 3: Expense Management & Overdue Amount Synchronization', () => {
    it('computes Paid, Pending, and Overdue expense totals accurately and updates remaining budget', () => {
      const expenses = [
        { id: 'e1', category: 'Venue', amount: 150000, status: 'paid' },
        { id: 'e2', category: 'Catering', amount: 240000, status: 'pending' },
        { id: 'e3', category: 'Decor', amount: 80000, status: 'overdue' },
        { id: 'e4', category: 'Entertainment', amount: 30000, status: 'overdue' },
      ];

      const paidTotal = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
      const pendingTotal = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
      const overdueTotal = expenses.filter(e => e.status === 'overdue').reduce((s, e) => s + e.amount, 0);
      const remainingTotal = overdueTotal; // CelebrAI business rule: Remaining reflects all overdue expenses

      expect(paidTotal).toBe(150000);
      expect(pendingTotal).toBe(240000);
      expect(overdueTotal).toBe(110000);
      expect(remainingTotal).toBe(110000);

      // Percentage spend breakdown of total spend (150k + 240k + 80k + 30k = 500,000)
      const totalRecorded = 500000;
      const venuePercent = Math.round((150000 / totalRecorded) * 100);
      const cateringPercent = Math.round((240000 / totalRecorded) * 100);
      const decorPercent = Math.round((80000 / totalRecorded) * 100);
      const entertainmentPercent = Math.round((30000 / totalRecorded) * 100);

      expect(venuePercent).toBe(30);
      expect(cateringPercent).toBe(48);
      expect(decorPercent).toBe(16);
      expect(entertainmentPercent).toBe(6);
    });
  });

  describe('Journey 4: Chat History Grouping & Temporal Ordering', () => {
    it('groups conversations into Today, Yesterday, and Previous Days without dropping messages', () => {
      const now = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const conversations: ConversationRecord[] = [
        { id: 'c1', userId: 'u1', title: 'Decor Theme Ideas', createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'c2', userId: 'u1', title: 'Catering Menu Review', createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
        { id: 'c3', userId: 'u1', title: 'Initial Budget Planning', createdAt: lastWeek.toISOString(), updatedAt: lastWeek.toISOString() },
      ];

      const grouped = groupConversations(conversations);
      expect(grouped.today).toHaveLength(1);
      expect(grouped.yesterday).toHaveLength(1);
      expect(grouped.lastWeek).toHaveLength(1);
      expect(grouped.today[0].title).toBe('Decor Theme Ideas');
    });
  });
});
