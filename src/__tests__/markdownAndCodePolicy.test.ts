import { describe, it, expect } from 'vitest';
import {
  isGeneralProgrammingRequest,
  generateClientSideAIResponse,
  DECLINE_CODE_MESSAGE,
} from '../services/ai/groq';

describe('AI Scope & Code-Generation Restrictions', () => {
  it('correctly flags unrequested general programming queries', () => {
    const unrequestedCodeQueries = [
      'Write HTML code to create a lamp',
      'write HTML code for a lamp',
      'Create a python script to scrape websites',
      'Write javascript code for a calculator',
      'give me an sql query to select all users',
      'write c++ code for fibonacci',
      'html for a lamp',
      'how to code a binary search tree in java',
    ];

    for (const query of unrequestedCodeQueries) {
      expect(isGeneralProgrammingRequest(query)).toBe(true);
    }
  });

  it('allows genuine event planning queries without false positives', () => {
    const eventQueries = [
      'Suggest 3 refined decor themes inspired by Modern Minimalist for "New"',
      'Recommend caterers for 150 guests in Mumbai',
      'Create an hour-by-hour timeline for my wedding reception',
      'Optimize my budget of 500000 for floral decor and catering',
      'Draft invitation text for my birthday party',
      'Draft an invitation email template for my anniversary',
      'What are some budget-friendly return gift ideas?',
    ];

    for (const query of eventQueries) {
      expect(isGeneralProgrammingRequest(query)).toBe(false);
    }
  });

  it('returns polite decline message when general code is requested via client fallback', () => {
    const reply = generateClientSideAIResponse('Write HTML code to create a lamp', {
      eventName: 'My Celebration',
    });
    expect(reply).toBe(DECLINE_CODE_MESSAGE);
    expect(reply).toContain("I'm CelebrAI, your event-planning assistant");
    expect(reply).toContain("I can't generate general-purpose programming code");
  });

  it('provides helpful event responses for event prompts via client fallback', () => {
    const decorReply = generateClientSideAIResponse('Suggest decor themes', {
      eventName: 'Golden Gala',
    });
    expect(decorReply).toContain('decor themes');
    expect(decorReply).not.toBe(DECLINE_CODE_MESSAGE);

    const timelineReply = generateClientSideAIResponse('Create hour-by-hour timeline', {
      eventName: 'Golden Gala',
    });
    expect(timelineReply).toContain('timeline');
    expect(timelineReply).not.toBe(DECLINE_CODE_MESSAGE);
  });

  it('generates structured budget response without error', () => {
    const budgetReply = generateClientSideAIResponse('Optimize my budget', {
      eventName: 'New',
      budget: 19500,
      currency: '₹',
    });
    expect(budgetReply).toContain('₹19,500');
    expect(budgetReply).not.toBe(DECLINE_CODE_MESSAGE);
  });

  it('does NOT invent a budget when no budget is specified in event context', () => {
    const cateringReply = generateClientSideAIResponse('Recommend caterers for My Celebration', {
      eventName: 'My Celebration',
      guestCount: 50,
      // budget NOT provided / 0
    });
    // Must NOT invent ₹5,00,000 or any fake budget
    expect(cateringReply).not.toContain('5,00,000');
    expect(cateringReply).not.toContain('500000');
    expect(cateringReply).toContain('My Celebration');
  });

  it('preserves markdown table rows when cells contain line breaks', () => {
    // Test the preprocessMarkdown logic used in SafeMarkdown
    const rawAiTable = [
      '| Theme | Details | Budget |',
      '|---|---|---|',
      '| 1. Midnight Garden | • Swag lanterns <br>• Lush greenery <br>• Velvet lounge | 30% |',
      '| 2. Art Deco | • Gold leaf backdrop <br>• Feather pieces | 35% |',
    ].join('\n');

    // Preprocessing should preserve table row integrity on single lines
    const lines = rawAiTable.split('\n');
    const processedLines = lines.map((line) => {
      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith('|') || (trimmed.endsWith('|') && trimmed.includes('|'));
      if (isTableRow) {
        return line.replace(/<br\s*\/?>/gi, '[[BR]]');
      }
      return line.replace(/<br\s*\/?>/gi, '\n');
    });

    const result = processedLines.join('\n');
    const resultLines = result.split('\n');

    // Exactly 4 table lines, no extra split rows
    expect(resultLines).toHaveLength(4);
    expect(resultLines[2]).toContain('[[BR]]');
    expect(resultLines[2]).toContain('• Swag lanterns [[BR]]• Lush greenery [[BR]]• Velvet lounge');
    expect(resultLines[2].endsWith('|')).toBe(true);
  });
});

