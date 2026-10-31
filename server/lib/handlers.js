// @ts-check
/**
 * CelebrAI Server Route Handlers
 * Pure, reusable business logic decoupled from Express & Netlify HTTP adapters.
 */

import { PRIMARY_MODEL, MAX_PROMPT_LENGTH } from './config.js';
import {
  sanitize,
  sanitizeNumber,
  isGeneralProgrammingRequest,
  DECLINE_CODE_MESSAGE,
  extractJson,
  stripCodeFences,
} from './sanitizers.js';
import { callGroq } from './groqClient.js';
import { checkRateLimit } from './rateLimiter.js';
import { verifyFirebaseToken } from './auth.js';
import { logger } from './logger.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = PRIMARY_MODEL;

/**
 * Deterministic offline blueprint generator.
 * Used if Groq API is unreachable or in offline demonstration mode.
 */
export function generateFallbackPlan({
  safeName,
  safeType,
  safeDate,
  safeGuests,
  safeBudget,
  safeCurrency,
  safeTheme,
}) {
  const budgetBreakdown = [
    { category: 'Venue', estimatedAmount: Math.round(safeBudget * 0.4), currency: safeCurrency, notes: 'Venue rental, setup, and basic AV' },
    { category: 'Catering', estimatedAmount: Math.round(safeBudget * 0.3), currency: safeCurrency, notes: `Food and beverages for ${safeGuests} guests` },
    { category: 'Decor', estimatedAmount: Math.round(safeBudget * 0.15), currency: safeCurrency, notes: `${safeTheme} themed decorations and floral arrangements` },
    { category: 'Photography', estimatedAmount: Math.round(safeBudget * 0.1), currency: safeCurrency, notes: 'Professional photo and video coverage' },
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
    if (!eventTs || isNaN(eventTs)) return null;
    const d = new Date(eventTs - daysBeforeEvent * 86400000);
    return d.toISOString().split('T')[0];
  }

  const milestones = [
    { title: 'Planning kickoff', targetDate: offsetDate(90), description: 'Confirm venue, set budget, and finalise guest count.' },
    { title: 'Vendor confirmations complete', targetDate: offsetDate(60), description: 'All major vendors (catering, photography, decor) confirmed with deposits paid.' },
    { title: 'Invitations dispatched', targetDate: offsetDate(45), description: 'Digital & physical invitations sent out with RSVP deadline set.' },
    { title: 'Final headcount locked', targetDate: offsetDate(14), description: 'Close RSVPs, confirm final numbers with caterer and venue.' },
    { title: 'Event day execution', targetDate: offsetDate(0), description: 'On-site coordination, vendor arrivals, and schedule management.' },
  ];

  return {
    eventSummary: `Master blueprint for ${safeName}: A meticulously organized ${safeType.toLowerCase()} designed for ${safeGuests} guests with a ${safeTheme.toLowerCase()} ambiance, managed within ${safeCurrency} ${safeBudget.toLocaleString('en-IN')}.`,
    themeSuggestions: [
      `${safeTheme} Classic`,
      'Minimalist Modern Elegance',
      'Warm Candlelit Evening',
      'Contemporary Celebration',
    ],
    tasks,
    budgetBreakdown,
    milestones,
    recommendations: [
      `Lock in the venue at least 60 days before ${safeDate} to secure preferred dates.`,
      `Collect dietary preferences early via digital RSVPs to prevent catering waste.`,
      `Maintain a 5% contingency reserve (${safeCurrency} ${Math.round(safeBudget * 0.05).toLocaleString('en-IN')}) for last-minute adjustments.`,
      `Assign point-of-contact responsibilities to trusted collaborators using the team workspace.`,
    ],
  };
}

/**
 * Common security gate for API handlers.
 * Verifies Rate Limit and Firebase Authentication Token.
 */
async function enforceSecurity(authHeader, clientIp) {
  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    return {
      status: 429,
      body: { error: 'Too many requests. Please wait a moment before trying again.' },
    };
  }

  // Token authentication
  const authResult = await verifyFirebaseToken(authHeader);
  if (!authResult.valid) {
    return {
      status: 401,
      body: { error: authResult.error || 'Authentication required' },
    };
  }

  return null;
}

/**
 * Health check handler.
 */
export function handleHealth() {
  return {
    status: 200,
    body: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      groqConfigured: Boolean(GROQ_API_KEY),
      model: MODEL,
    },
  };
}

/**
 * AI Chat completion handler.
 */
export async function handleChat({ body = {}, authHeader, clientIp }) {
  const securityViolation = await enforceSecurity(authHeader, clientIp);
  if (securityViolation) return securityViolation;

  const { messages = [], eventContext = {} } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, body: { error: 'messages array is required' } };
  }

  const sanitizedMessages = messages.slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: sanitize(m.content, MAX_PROMPT_LENGTH),
  }));

  const eventName = sanitize(eventContext.eventName, 100);
  const eventType = sanitize(eventContext.eventType, 50);
  const budget = sanitizeNumber(eventContext.budget, 0, 100_000_000, 0);
  const guestCount = sanitizeNumber(eventContext.guestCount, 0, 100_000, 0);
  const eventDate = sanitize(eventContext.eventDate, 30);
  const location = sanitize(eventContext.location, 100);
  const currency = sanitize(eventContext.currency, 5) || '₹';

  const contextBlock = [
    'CONFIRMED EVENT CONTEXT:',
    eventName ? `• Event: "${eventName}"` : null,
    eventType ? `• Type: ${eventType}` : null,
    eventDate ? `• Date: ${eventDate}` : null,
    location ? `• Location: ${location}` : null,
    budget ? `• Total Budget: ${currency} ${budget.toLocaleString('en-IN')}` : null,
    guestCount ? `• Headcount: ${guestCount} guests` : null,
  ].filter(Boolean).join('\n');

  const lastUserMsg = sanitizedMessages[sanitizedMessages.length - 1]?.content || '';

  if (isGeneralProgrammingRequest(lastUserMsg)) {
    return { status: 200, body: { reply: DECLINE_CODE_MESSAGE, model: MODEL } };
  }

  const systemPrompt = `You are CelebrAI, an intelligent, specialized AI event-planning mentor and assistant powered by GPT-OSS 120B.

${contextBlock}

CRITICAL BEHAVIOR INSTRUCTIONS:
1. EVENT ASSISTANT SCOPE & CODE RESTRICTION:
   - You are exclusively an event-planning assistant for celebrations, weddings, birthdays, corporate events, budgets, guests, vendors, and schedules.
   - Do NOT generate general-purpose programming code.
   - If asked for general-purpose programming code, decline with the standard message.
2. GREETINGS: If the user offers a casual greeting, respond with a short warm greeting asking how you can assist them with their celebration today.
3. CONTEXT INTEGRITY & STRICT NO-INVENTION POLICY:
   - Use confirmed event context only when relevant.
   - Confirmed Budget: ${budget ? `${currency} ${budget.toLocaleString('en-IN')}` : 'UNSPECIFIED'}.
   - Confirmed Guests: ${guestCount ? guestCount : 'UNSPECIFIED'}.
   - NEVER invent or hallucinate fabricated numbers, quotes, or fake vendors.
4. FORMATTING & RESPONSE QUALITY:
   - Present information using clean, standard Markdown.
   - Use Markdown tables for comparisons or budgets.
   - NEVER output raw HTML tags.
   - Keep answers elegant, warm, and concise.`;

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...sanitizedMessages,
  ];

  let reply;
  let usedModel = MODEL;
  try {
    const groqRes = await callGroq(GROQ_API_KEY, groqMessages, { temperature: 0.7, maxTokens: 1024 });
    reply = groqRes.content;
    usedModel = groqRes.model;
  } catch (groqErr) {
    logger.warn('[handleChat] Groq unavailable, applying resilient response:', groqErr.message);
    const lower = lastUserMsg.toLowerCase();
    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(lower)) {
      reply = "Hello! I'm CelebrAI, your personal celebration co-planner. How can I assist you with your event today?";
    } else {
      reply = `I am currently in resilient co-planning mode. For ${eventName ? `"${eventName}"` : 'your celebration'}, I can help recommend themes, schedule timelines, or review budget plans. What specific task would you like to tackle?`;
    }
  }

  return { status: 200, body: { reply, model: usedModel } };
}

/**
 * Event Plan Generation handler.
 */
export async function handleGeneratePlan({ body = {}, authHeader, clientIp }) {
  const securityViolation = await enforceSecurity(authHeader, clientIp);
  if (securityViolation) return securityViolation;

  const {
    eventType,
    eventName,
    eventDate,
    location,
    guestCount,
    budget,
    currency,
    theme,
    requirements,
  } = body;

  const safeName = sanitize(eventName, 100);
  if (!safeName) {
    return { status: 400, body: { error: 'eventName is required' } };
  }

  const safeType = sanitize(eventType || 'Event', 50);
  const safeDate = sanitize(eventDate || 'TBD', 30);
  const safeLocation = sanitize(location || 'India', 100);
  const safeGuests = sanitizeNumber(guestCount, 1, 100000, 100);
  const safeBudget = sanitizeNumber(budget, 0, 100_000_000, 0);
  const safeCurrency = sanitize(currency || '₹', 5);
  const safeTheme = sanitize(theme || 'Classic Elegant', 100);
  const safeReqs = sanitize(requirements || '', MAX_PROMPT_LENGTH);

  const systemPrompt =
    'You are CelebrAI, a premium AI event planning assistant. Generate a comprehensive event plan as a valid JSON object ONLY. No markdown, no code fences, no explanation — just the raw JSON object.';

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

    let plan;
    try {
      plan = extractJson(groqRes.content);
    } catch {
      throw new Error('AI returned malformed JSON.');
    }

    if (!plan.tasks || !Array.isArray(plan.tasks)) plan.tasks = [];
    if (!plan.budgetBreakdown || !Array.isArray(plan.budgetBreakdown)) plan.budgetBreakdown = [];
    if (!plan.milestones || !Array.isArray(plan.milestones)) plan.milestones = [];
    if (!plan.recommendations || !Array.isArray(plan.recommendations)) plan.recommendations = [];
    if (!plan.themeSuggestions || !Array.isArray(plan.themeSuggestions)) plan.themeSuggestions = [];
    if (typeof plan.eventSummary !== 'string') plan.eventSummary = '';

    return { status: 200, body: { ...plan, _model: groqRes.model } };
  } catch (err) {
    logger.warn('[handleGeneratePlan] Groq plan generation failed, invoking deterministic fallback:', err.message);
    const fallback = generateFallbackPlan({
      safeName,
      safeType,
      safeDate,
      safeLocation,
      safeGuests,
      safeBudget,
      safeCurrency,
      safeTheme,
    });
    return { status: 200, body: { ...fallback, _model: 'fallback-offline' } };
  }
}

/**
 * Invitation text generation handler.
 */
export async function handleGenerateInvitation({ body = {}, authHeader, clientIp }) {
  const securityViolation = await enforceSecurity(authHeader, clientIp);
  if (securityViolation) return securityViolation;

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

  try {
    const groqRes = await callGroq(
      GROQ_API_KEY,
      [
        { role: 'system', content: 'You are a luxury event copywriter. Write beautiful, emotionally resonant event invitations.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.8, maxTokens: 600 }
    );
    return { status: 200, body: { text: groqRes.content, model: groqRes.model } };
  } catch (err) {
    logger.warn('[handleGenerateInvitation] Groq failed, applying template:', err.message);
    const text = `Together with their families,\n${safeHost}\ncordially invite you to celebrate\n${safeName}\n\nDate: ${safeDate}\nVenue: ${safeLoc || 'To be announced'}\n\nYour presence and blessings will make our special day complete.`;
    return { status: 200, body: { text, model: 'fallback-template' } };
  }
}

/**
 * Decor suggestions handler.
 */
export async function handleSuggestDecor({ body = {}, authHeader, clientIp }) {
  const securityViolation = await enforceSecurity(authHeader, clientIp);
  if (securityViolation) return securityViolation;

  const { eventDetails = {}, style } = body;
  const safeStyle = sanitize(style || 'elegant', 50);
  const safeType = sanitize(eventDetails.eventType || 'event', 50);
  const safeGuests = sanitizeNumber(eventDetails.guestCount, 1, 100000, 100);

  const prompt = `Generate exactly 5 creative ${safeStyle} decor ideas for a ${safeType} with ${safeGuests} guests. Return a valid JSON array of exactly 5 strings. Each string should be 1-2 sentences describing a specific, actionable decor idea. No other text — only the JSON array.`;

  try {
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
      ideas = ['Curated floral centerpiece with soft uplighting tailored to venue architecture.'];
    }

    return { status: 200, body: { ideas: ideas.map(String), model: groqRes.model } };
  } catch (err) {
    logger.warn('[handleSuggestDecor] Groq failed, applying curated list:', err.message);
    const ideas = [
      `Fairy light ceiling canopy with cascading floral drops for a ${safeStyle} feel.`,
      `Customized entrance welcome arch embellished with ${safeStyle} botanicals.`,
      `Warm amber ambient lighting with candlelit table runners.`,
      `Interactive memory or photo gallery wall honoring the celebration.`,
      `Minimalist acrylic signage with gold accents welcoming your guests.`,
    ];
    return { status: 200, body: { ideas, model: 'fallback-template' } };
  }
}
