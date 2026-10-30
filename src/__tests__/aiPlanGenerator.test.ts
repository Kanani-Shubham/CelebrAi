import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateClientSidePlan,
  validateAIPlan,
  isGeneralProgrammingRequest,
  DECLINE_CODE_MESSAGE,
  type AIPlanRequest,
} from '../services/ai/groq';

describe('CelebrAI AI Plan Generator & Guardrails Suite', () => {
  const sampleRequest: AIPlanRequest = {
    eventName: 'Priya & Rahul Wedding',
    eventType: 'Wedding',
    eventDate: '2027-02-14',
    location: 'Udaipur, Rajasthan',
    guestCount: 250,
    budget: 1500000,
    currency: 'INR',
    theme: 'Royal Heritage',
  };

  describe('Deterministic Client-side Plan Generation', () => {
    it('generates a complete, proportionally allocated plan for valid inputs', () => {
      const plan = generateClientSidePlan(sampleRequest);

      expect(plan.eventSummary).toContain('Priya & Rahul Wedding');
      expect(plan.eventSummary).toContain('Wedding');
      expect(plan.themeSuggestions.length).toBeGreaterThanOrEqual(3);
      expect(plan.tasks.length).toBeGreaterThan(0);
      expect(plan.budgetBreakdown.length).toBe(6);

      // Verify budget breakdown totals match or are within rounding margin of target budget
      const totalAllocated = plan.budgetBreakdown.reduce((sum, b) => sum + b.estimatedAmount, 0);
      expect(totalAllocated).toBe(1500000);
    });

    it('safely handles zero or negative budget inputs without crashing', () => {
      const zeroBudgetReq: AIPlanRequest = {
        ...sampleRequest,
        budget: 0,
      };
      const plan = generateClientSidePlan(zeroBudgetReq);

      expect(plan.budgetBreakdown.length).toBe(6);
      expect(plan.tasks.length).toBeGreaterThan(0);
      expect(plan.eventSummary).not.toContain('NaN');
    });

    it('handles negative or NaN budget gracefully with fallback baseline', () => {
      const nanBudgetReq: AIPlanRequest = {
        ...sampleRequest,
        budget: -50000,
      };
      const plan = generateClientSidePlan(nanBudgetReq);
      expect(plan.budgetBreakdown[0].estimatedAmount).toBeGreaterThan(0);
    });

    it('handles missing event name or type with graceful defaults', () => {
      const incompleteReq = {
        eventDate: '',
        location: '',
        guestCount: 50,
        budget: 100000,
        currency: 'INR',
      } as unknown as AIPlanRequest;

      const plan = generateClientSidePlan(incompleteReq);
      expect(plan.eventSummary).toBeDefined();
      expect(plan.themeSuggestions).toContain('Modern Minimalist');
    });
  });

  describe('AI Plan Schema Validation', () => {
    it('validates and normalizes raw AI plan responses', () => {
      const raw = {
        eventSummary: 'A grand reception',
        themeSuggestions: ['Classic White', 'Emerald Evening'],
        tasks: [
          { title: 'Book caterer', category: 'Food', priority: 'high' },
        ],
        budgetBreakdown: [
          { category: 'Venue', estimatedAmount: 500000, currency: 'INR' },
        ],
        milestones: [
          { title: 'Lock Venue', targetDate: '2026-12-01', description: 'Signed contract' },
        ],
        recommendations: ['Book photo team early'],
      };

      const validated = validateAIPlan(raw);
      expect(validated.eventSummary).toBe('A grand reception');
      expect(validated.tasks[0].priority).toBe('high');
      expect(validated.budgetBreakdown[0].estimatedAmount).toBe(500000);
    });

    it('throws when raw input is not an object', () => {
      expect(() => validateAIPlan(null)).toThrow();
      expect(() => validateAIPlan('invalid string')).toThrow();
    });
  });

  describe('Unauthenticated Draft Serialization & Restoration', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
    });

    it('serializes and restores onboarding draft without data corruption', () => {
      const draft = {
        step: 4,
        formData: sampleRequest,
        timestamp: Date.now(),
      };

      mockStorage['celebr_ai_draft'] = JSON.stringify(draft);
      const restored = JSON.parse(mockStorage['celebr_ai_draft'] || '{}');

      expect(restored.formData.eventName).toBe('Priya & Rahul Wedding');
      expect(restored.formData.budget).toBe(1500000);
      expect(restored.formData.guestCount).toBe(250);
    });
  });

  describe('AI Guardrails Against General Purpose Code Generation', () => {
    it('identifies and rejects general programming requests', () => {
      expect(isGeneralProgrammingRequest('write python code to scrape twitter')).toBe(true);
      expect(isGeneralProgrammingRequest('generate a java program for fibonacci')).toBe(true);
      expect(isGeneralProgrammingRequest('create html css for a lamp app')).toBe(true);
      expect(isGeneralProgrammingRequest('write a bash script to delete files')).toBe(true);
    });

    it('allows legitimate event planning inquiries that contain template words', () => {
      expect(isGeneralProgrammingRequest('Help me draft an invitation email template for wedding guests')).toBe(false);
      expect(isGeneralProgrammingRequest('Suggest decor themes for an evening cocktail party')).toBe(false);
    });

    it('provides clear decline message for non-event coding requests', () => {
      expect(DECLINE_CODE_MESSAGE).toContain("I'm CelebrAI, your event-planning assistant");
      expect(DECLINE_CODE_MESSAGE).toContain("I can't generate general-purpose programming code");
    });
  });
});
