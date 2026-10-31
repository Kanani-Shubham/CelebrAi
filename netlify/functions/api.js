// @ts-check
/**
 * Netlify Serverless Function — CelebrAI Groq AI Proxy
 * Securely proxies AI completion requests without exposing GROQ_API_KEY to the browser.
 */

import { PRIMARY_MODEL } from '../../server/lib/config.js';
import {
  sanitize,
  sanitizeNumber,
  isGeneralProgrammingRequest,
  DECLINE_CODE_MESSAGE,
  extractJson,
  stripCodeFences,
} from '../../server/lib/sanitizers.js';
import { callGroq } from '../../server/lib/groqClient.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = PRIMARY_MODEL;

/**
 * generateFallbackPlan — deterministic offline blueprint generator.
 * Used if Groq API is completely unreachable.
 */
function generateFallbackPlan({ safeName, safeType, safeDate, safeLocation, safeGuests, safeBudget, safeCurrency, safeTheme }) {
  const budgetBreakdown = [
    { category: 'Venue', estimatedAmount: Math.round(safeBudget * 0.40), currency: safeCurrency, notes: 'Venue rental, setup, and basic AV' },
    { category: 'Catering', estimatedAmount: Math.round(safeBudget * 0.30), currency: safeCurrency, notes: `Food and beverages for ${safeGuests} guests` },
    { category: 'Decor', estimatedAmount: Math.round(safeBudget * 0.15), currency: safeCurrency, notes: `${safeTheme} themed decorations and floral arrangements` },
    { category: 'Photography', estimatedAmount: Math.round(safeBudget * 0.10), currency: safeCurrency, notes: 'Professional photo and video coverage' },
    { category: 'Other', estimatedAmount: Math.round(safeBudget * 0.05), currency: safeCurrency, notes: 'Miscellaneous supplies, contingency buffer' },
  ];

  const taskCount = safeGuests > 200 ? 12 : safeGuests > 50 ? 10 : 8;
  const allTasks = [
    { title: 'Book and confirm venue', category: 'Venue', priority: 'high', suggestedDueDate: null },
    { title: 'Finalise guest list and send invitations', category: 'Invitations', priority: 'high', suggestedDueDate: null },
    { title: 'Hire catering team and confirm menu', category: 'Catering', priority: 'high', suggestedDueDate: null },
    { title: 'Book photographer / videographer', category: 'Photography', priority: 'high', suggestedDueDate: null },
    { title: 'Order decor items and centrepieces', category: 'Decor', priority: 'medium', suggestedDueDate: null },
    { title: 'Arrange transportation for guests', category: 'Transport', priority: 'medium', suggestedDueDate: null },
    { title: 'Plan entertainment and programme schedule', category: 'Entertainment', priority: 'medium', suggestedDueDate: null },
    { title: 'Confirm dietary requirements with caterer', category: 'Catering', priority: 'medium', suggestedDueDate: null },
    { title: 'Create seating plan', category: 'Venue', priority: 'low', suggestedDueDate: null },
    { title: 'Prepare welcome signage and name cards', category: 'Decor', priority: 'low', suggestedDueDate: null },
    { title: 'Coordinate sound system and lighting', category: 'Entertainment', priority: 'medium', suggestedDueDate: null },
    { title: 'Send final RSVP reminder', category: 'Invitations', priority: 'low', suggestedDueDate: null },
  ];
  const tasks = allTasks.slice(0, taskCount);

  const eventTs = safeDate && safeDate !== 'TBD' ? new Date(safeDate).getTime() : null;
  function offsetDate(daysBeforeEvent) {
    if (!eventTs) return null;
    const d = new Date(eventTs - daysBeforeEvent * 86400000);
    return d.toISOString().split('T')[0];
  }

  const milestones = [
    { title: 'Planning kickoff', targetDate: offsetDate(90), description: 'Confirm venue, set budget, and finalise guest count.' },
    { title: 'Vendor confirmations complete', targetDate: offsetDate(60), description: 'All major vendors (catering, photography, decor) confirmed with deposits paid.' },
    { title: 'Invitations sent', targetDate: offsetDate(45), description: 'All invitations dispatched and RSVP tracking started.' },
    { title: 'Final head count locked', targetDate: offsetDate(14), description: 'Confirm final numbers with caterer and venue.' },
    { title: 'Event day', targetDate: safeDate !== 'TBD' ? safeDate : null, description: `${safeName} takes place. Enjoy every moment!` },
  ];

  const typeLC = safeType.toLowerCase();
  let themeSuggestions;
  if (typeLC.includes('wedding')) {
    themeSuggestions = ['Rustic Boho Garden', 'Classic Black & White Elegance', 'Romantic Candlelit Banquet'];
  } else if (typeLC.includes('birthday')) {
    themeSuggestions = ['Glam Gatsby Gold', 'Tropical Paradise', 'Retro Disco Night'];
  } else if (typeLC.includes('corporate') || typeLC.includes('conference')) {
    themeSuggestions = ['Modern Minimalist', 'Elevated Networking Lounge', 'Tech Forward Showcase'];
  } else {
    themeSuggestions = [`${safeTheme} Classic`, 'Luxe Monochrome', 'Garden Party Chic'];
  }

  return {
    eventSummary: `${safeName} is a ${safeType} for ${safeGuests} guests in ${safeLocation}. Planned with a ${safeCurrency}${safeBudget.toLocaleString('en-IN')} budget and a "${safeTheme}" theme. This blueprint was deterministically generated in offline resilience mode.`,
    themeSuggestions,
    tasks,
    budgetBreakdown,
    milestones,
    recommendations: [
      'Book the venue at least 3 months in advance to secure your preferred date.',
      'Allocate a 10% contingency buffer within each budget category.',
      'Send digital invitations first, then follow up with physical ones for VIP guests.',
      'Create a detailed day-of timeline and share it with all vendors 1 week before.',
    ],
    _fallback: true,
    _model: 'client-resilient-engine',
  };
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const rawPath = event.path || '';
  const path = rawPath
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '');

  try {
    if (path === '/health' || path === '' || path === '/') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok', model: MODEL, online: true }),
      };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const body = event.body ? JSON.parse(event.body) : {};

    // 1. Chat with AI Mentor
    if (path === '/ai/chat') {
      const { messages = [], eventContext = {} } = body;
      const eventName = sanitize(eventContext.eventName || '', 100);
      const eventType = sanitize(eventContext.eventType || '', 50);
      const location = sanitize(eventContext.location || '', 100);
      const guestCount = Number(eventContext.guestCount) > 0 ? Number(eventContext.guestCount) : null;
      const budget = Number(eventContext.budget) > 0 ? Number(eventContext.budget) : null;
      const currency = sanitize(eventContext.currency || '₹', 5);

      const lastUserMsg = (messages.slice(-1)[0]?.content || '').trim();
      if (isGeneralProgrammingRequest(lastUserMsg)) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ reply: DECLINE_CODE_MESSAGE, model: MODEL }),
        };
      }

      const contextLines = [
        'CONFIRMED EVENT CONTEXT:',
        eventName ? `• Event: "${eventName}"` : null,
        eventType ? `• Type: ${eventType}` : null,
        location ? `• Location: ${location}` : null,
        guestCount ? `• Headcount: ${guestCount} guests` : null,
        budget ? `• Total Budget: ${currency} ${budget.toLocaleString('en-IN')}` : null,
      ].filter(Boolean).join('\n');

      const systemPrompt = `You are CelebrAI, an intelligent, specialized AI event-planning mentor and assistant powered by GPT-OSS 120B.

${contextLines}

CRITICAL BEHAVIOR INSTRUCTIONS:
1. EVENT ASSISTANT SCOPE: Only answer event-planning questions. Decline general programming code.
2. GREETINGS: Respond warmly and concisely in 1-2 sentences.
3. CONTEXT INTEGRITY: Never invent or hallucinate fabricated numbers, vendors, or quotes.
4. FORMATTING: Use Markdown tables and bullets. Never output raw HTML tags.`;

      const sanitizedMessages = messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: sanitize(m.content, 2000),
      }));

      const groqMessages = [{ role: 'system', content: systemPrompt }, ...sanitizedMessages];

      try {
        const groqRes = await callGroq(GROQ_API_KEY, groqMessages, { temperature: 0.7, maxTokens: 1024 });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ reply: groqRes.content, model: groqRes.model }),
        };
      } catch (err) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            reply: `I am currently operating in resilient offline mode. For "${eventName || 'your celebration'}", I can assist you with budgeting, scheduling, or vendor planning. What would you like to review next?`,
            model: 'client-resilient-engine',
            _fallback: true,
          }),
        };
      }
    }

    // 2. Generate Plan
    if (path === '/ai/generate-plan') {
      const {
        eventType, eventName, eventDate, location,
        guestCount, budget, currency, theme, requirements,
      } = body;

      const safeName = sanitize(eventName || '', 100);
      const safeType = sanitize(eventType || 'Celebration', 50);
      const safeDate = sanitize(eventDate || 'TBD', 30);
      const safeLocation = sanitize(location || 'India', 100);
      const safeGuests = sanitizeNumber(guestCount, 1, 100000, 100);
      const safeBudget = sanitizeNumber(budget, 0, 100_000_000, 500000);
      const safeCurrency = sanitize(currency || '₹', 5);
      const safeTheme = sanitize(theme || 'Classic Elegant', 100);
      const safeReqs = sanitize(requirements || '', 500);

      const systemPrompt = 'You are CelebrAI, a premium AI event planning assistant. Generate a comprehensive event plan as a valid JSON object ONLY. No markdown, no code fences, no explanation — just the raw JSON object.';

      const userPrompt = `Generate a detailed event plan for:
Event: ${safeName} (${safeType})
Date: ${safeDate}
Location: ${safeLocation}
Guests: ${safeGuests}
Budget: ${safeCurrency}${safeBudget.toLocaleString('en-IN')}
Theme: ${safeTheme}
Requirements: ${safeReqs || 'Standard professional event'}

Return ONLY this JSON shape with no other text:
{
  "eventSummary": "2-3 sentence description of the event concept",
  "themeSuggestions": ["theme 1", "theme 2", "theme 3"],
  "tasks": [
    {"title": "task title", "category": "Venue|Catering|Decor|Photography|Invitations|Entertainment|Transport|Other", "priority": "high|medium|low", "suggestedDueDate": "YYYY-MM-DD or null"}
  ],
  "budgetBreakdown": [
    {"category": "category name", "estimatedAmount": 50000, "currency": "${safeCurrency}", "notes": "brief note"}
  ],
  "milestones": [
    {"title": "milestone title", "targetDate": "YYYY-MM-DD or null", "description": "what happens at this milestone"}
  ],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Requirements: 8-12 tasks, 5-7 budget items summing close to ${safeBudget}, 4-5 milestones, 4-5 recommendations.`;

      try {
        const groqRes = await callGroq(
          GROQ_API_KEY,
          [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          { temperature: 0.5, maxTokens: 4096 }
        );

        const plan = extractJson(groqRes.content);
        if (!plan.tasks || !Array.isArray(plan.tasks)) plan.tasks = [];
        if (!plan.budgetBreakdown || !Array.isArray(plan.budgetBreakdown)) plan.budgetBreakdown = [];
        if (!plan.milestones || !Array.isArray(plan.milestones)) plan.milestones = [];
        if (!plan.recommendations || !Array.isArray(plan.recommendations)) plan.recommendations = [];
        if (!plan.themeSuggestions || !Array.isArray(plan.themeSuggestions)) plan.themeSuggestions = [];
        if (typeof plan.eventSummary !== 'string') plan.eventSummary = '';

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ...plan, _model: groqRes.model }),
        };
      } catch (err) {
        console.warn('[netlify/api] Groq failed, generating fallback plan:', err.message);
        const fallback = generateFallbackPlan({
          safeName, safeType, safeDate, safeLocation, safeGuests, safeBudget, safeCurrency, safeTheme,
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(fallback),
        };
      }
    }

    // 3. Invitation copy
    if (path === '/ai/invitation') {
      const { eventDetails = {}, tone, type } = body;
      const safeTone = sanitize(tone || 'warm and elegant', 50);
      const safeType = sanitize(type || 'formal', 50);
      const safeName = sanitize(eventDetails.eventName || 'Our Event', 100);
      const safeDate = sanitize(eventDetails.eventDate || 'TBD', 30);
      const safeLoc = sanitize(eventDetails.location || '', 100);
      const safeHost = sanitize(eventDetails.hostName || 'The Host Family', 100);

      const prompt = `Write a ${safeTone} ${safeType} invitation for:
Event: ${safeName}
Date: ${safeDate}
Location: ${safeLoc}
Host: ${safeHost}

Write only the invitation text itself — elegant, warm, and ready to copy. No instructions, no explanations.`;

      const groqRes = await callGroq(
        GROQ_API_KEY,
        [
          { role: 'system', content: 'You are a luxury event copywriter. Write beautiful, emotionally resonant event invitations.' },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.8, maxTokens: 600 }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text: groqRes.content, model: groqRes.model }),
      };
    }

    // 4. Decor concepts
    if (path === '/ai/decor') {
      const { eventDetails = {}, style } = body;
      const safeStyle = sanitize(style || 'elegant', 50);
      const safeType = sanitize(eventDetails.eventType || 'event', 50);
      const safeGuests = sanitizeNumber(eventDetails.guestCount, 1, 100000, 100);

      const prompt = `Generate exactly 5 creative ${safeStyle} decor ideas for a ${safeType} with ${safeGuests} guests. Return a valid JSON array of exactly 5 strings. No other text.`;

      const groqRes = await callGroq(
        GROQ_API_KEY,
        [
          { role: 'system', content: 'You are a luxury event designer. Return only a valid JSON array of strings.' },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.8, maxTokens: 600 }
      );

      let ideas;
      try {
        const cleaned = stripCodeFences(groqRes.content);
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          ideas = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
        } else {
          ideas = JSON.parse(cleaned);
        }
        if (!Array.isArray(ideas)) ideas = [cleaned];
      } catch {
        ideas = ['Classic ivory drapery and warm ambient candle lighting.'];
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ideas: ideas.map(String), model: groqRes.model }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Not Found: ${path}` }),
    };
  } catch (err) {
    console.error('[Netlify Function Error]', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
