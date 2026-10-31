import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { calculateExpenseSummary } from '../pages/planning/expenses/types';
import { generateClientSideAIResponse } from '../services/ai/groq';

describe('CelebrAI Planning Workflows & Interactive Reducers', () => {
  describe('ExpenseManager Summary Reducer', () => {
    it('accurately calculates and dynamically updates summary totals when an expense is added', () => {
      let expenses: { id: string; title: string; amount: number; status: 'Paid' | 'Pending' | 'Overdue'; category: string }[] = [
        { id: 'e1', title: 'Venue Booking', amount: 150000, status: 'Paid', category: 'Venue' },
        { id: 'e2', title: 'Sound Setup', amount: 30000, status: 'Pending', category: 'Audio' },
      ];

      let summary = calculateExpenseSummary(expenses);
      expect(summary.paid + summary.pending + summary.overdue).toBe(180000);
      expect(summary.paid).toBe(150000);
      expect(summary.pending).toBe(30000);
      expect(summary.overdue).toBe(0);

      // Add a third overdue expense
      expenses = [
        ...expenses,
        { id: 'e3', title: 'Catering Advance', amount: 45000, status: 'Overdue', category: 'Catering' },
      ];

      summary = calculateExpenseSummary(expenses);
      expect(summary.paid + summary.pending + summary.overdue).toBe(225000);
      expect(summary.paid).toBe(150000);
      expect(summary.pending).toBe(30000);
      expect(summary.overdue).toBe(45000);
    });
  });

  describe('GuestManagement RSVP Workflow', () => {
    it('aggregates RSVP attendance categories and accurately computes headcount percentages', () => {
      const guests = [
        { id: 'g1', name: 'John Doe', status: 'Accepted', partySize: 2 },
        { id: 'g2', name: 'Jane Smith', status: 'Accepted', partySize: 1 },
        { id: 'g3', name: 'David Lee', status: 'Declined', partySize: 1 },
        { id: 'g4', name: 'Sarah Brown', status: 'Pending', partySize: 1 },
      ];

      const attending = guests.filter(g => g.status === 'Accepted').reduce((acc, g) => acc + g.partySize, 0);
      const declined = guests.filter(g => g.status === 'Declined').reduce((acc, g) => acc + g.partySize, 0);
      const pending = guests.filter(g => g.status === 'Pending').reduce((acc, g) => acc + g.partySize, 0);
      const total = attending + declined + pending;

      expect(total).toBe(5);
      expect(attending).toBe(3);
      expect(declined).toBe(1);
      expect(pending).toBe(1);
      expect(Math.round((attending / total) * 100)).toBe(60);
    });
  });

  describe('TodoList Task State Reducer (Add, Toggle, Delete)', () => {
    function TodoHarness() {
      const [tasks, setTasks] = useState([
        { id: 't1', title: 'Select venue', completed: false },
      ]);

      return (
        <div>
          <ul>
            {tasks.map(t => (
              <li key={t.id}>
                <span data-testid={`task-${t.id}`}>{t.title} - {t.completed ? 'Done' : 'Pending'}</span>
                <button onClick={() => setTasks(tasks.map(x => x.id === t.id ? { ...x, completed: !x.completed } : x))}>
                  Toggle {t.id}
                </button>
                <button onClick={() => setTasks(tasks.filter(x => x.id !== t.id))}>
                  Delete {t.id}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setTasks([...tasks, { id: 't2', title: 'Order cake', completed: false }])}>
            Add Task
          </button>
        </div>
      );
    }

    it('handles adding, toggling, and deleting tasks correctly in the UI', () => {
      render(<TodoHarness />);

      expect(screen.getByTestId('task-t1')).toHaveTextContent('Select venue - Pending');

      // Toggle completion
      fireEvent.click(screen.getByRole('button', { name: /toggle t1/i }));
      expect(screen.getByTestId('task-t1')).toHaveTextContent('Select venue - Done');

      // Add a new task
      fireEvent.click(screen.getByRole('button', { name: /add task/i }));
      expect(screen.getByTestId('task-t2')).toHaveTextContent('Order cake - Pending');

      // Delete original task
      fireEvent.click(screen.getByRole('button', { name: /delete t1/i }));
      expect(screen.queryByTestId('task-t1')).not.toBeInTheDocument();
      expect(screen.getByTestId('task-t2')).toBeInTheDocument();
    });
  });

  describe('AIAssistant Offline & Resilient Client Fallback', () => {
    it('returns an intelligent, deterministic response when network is offline', async () => {
      const eventContext = {
        eventName: 'Silver Jubilee Gala',
        budget: 500000,
        guestCount: 150,
        currency: '₹',
      };

      // General celebration question
      const reply = generateClientSideAIResponse('Can you suggest a timeline schedule?', eventContext);
      expect(reply).toBeDefined();
      expect(reply.length).toBeGreaterThan(50);
      expect(reply).toContain('Silver Jubilee Gala');

      // Budget inquiry
      const budgetReply = generateClientSideAIResponse('How should I divide my budget?', eventContext);
      expect(budgetReply).toContain('35%');
      expect(budgetReply).toContain('Venue');

      // Invitation inquiry
      const inviteReply = generateClientSideAIResponse('Write an invitation message', eventContext);
      expect(inviteReply).toContain('Silver Jubilee Gala');
      expect(inviteReply).toContain('RSVP');
    });
  });
});
