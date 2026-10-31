import { describe, it, expect } from 'vitest';
import {
  AI_PRIMARY_MODEL,
  AI_FALLBACK_MODEL,
  AI_MODEL_NAME,
  AI_OFFLINE_ENGINE_ID,
  AI_OFFLINE_BADGE,
} from '../config/ai';
import {
  sanitize,
  sanitizeNumber,
  isGeneralProgrammingRequest,
  extractJson,
  stripCodeFences,
  DECLINE_CODE_MESSAGE,
} from '../../server/lib/sanitizers.js';

describe('AI Configuration & Consistency', () => {
  it('exports primary Groq reasoning model matching openai/gpt-oss-120b', () => {
    expect(AI_PRIMARY_MODEL).toBe('openai/gpt-oss-120b');
  });

  it('exports valid fallback model and offline identifiers', () => {
    expect(AI_FALLBACK_MODEL).toBe('openai/gpt-oss-20b');
    expect(AI_OFFLINE_ENGINE_ID).toBe('client-resilient-engine');
    expect(AI_OFFLINE_BADGE).toBe('Offline Template Mode');
    expect(AI_MODEL_NAME).toContain('GPT-OSS 120B');
  });
});

describe('Sanitizer & Prompt Injection Defenses', () => {
  it('strips HTML tags and script injections', () => {
    const raw = '<script>alert("hack")</script><b>Wedding Decor</b>';
    const cleaned = sanitize(raw, 50);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('<b>');
    expect(cleaned).toBe('alert("hack")Wedding Decor');
  });

  it('enforces maximum character limits cleanly', () => {
    const longInput = 'A'.repeat(200);
    const cleaned = sanitize(longInput, 50);
    expect(cleaned.length).toBe(50);
  });

  it('sanitizes numbers within bounds and handles non-numeric input', () => {
    expect(sanitizeNumber(500, 0, 1000, 10)).toBe(500);
    expect(sanitizeNumber(-10, 0, 1000, 50)).toBe(0);
    expect(sanitizeNumber(9999, 0, 1000, 50)).toBe(1000);
    expect(sanitizeNumber('not a number', 0, 1000, 25)).toBe(25);
  });

  it('identifies and declines general programming requests', () => {
    expect(isGeneralProgrammingRequest('write a python script to scrape data')).toBe(true);
    expect(isGeneralProgrammingRequest('write the code for a calculator')).toBe(true);
    expect(isGeneralProgrammingRequest('solve this leetcode binary search tree problem')).toBe(true);
    expect(isGeneralProgrammingRequest('what should be the wedding menu for 150 guests')).toBe(false);
    expect(DECLINE_CODE_MESSAGE).toContain('event-planning assistant');
  });

  it('strips markdown code fences cleanly', () => {
    const fenced = '```json\n{"tasks": []}\n```';
    expect(stripCodeFences(fenced)).toBe('{"tasks": []}');
  });

  it('extracts nested JSON payload from prose', () => {
    const proseWithJson = 'Here is your plan:\n```json\n{"plan": "Grand Wedding"}\n```\nHope you like it!';
    const parsed = extractJson(proseWithJson);
    expect(parsed).toEqual({ plan: 'Grand Wedding' });
  });
});
