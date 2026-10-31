/**
 * CelebrAI — Production AI Proxy Server
 * Securely proxies requests to Groq API — GROQ_API_KEY never exposed to browser.
 *
 * Usage:
 *   Development:  node server/api.js
 *   Production:   NODE_ENV=production node server/api.js
 *
 * Available models on this account:
 *   openai/gpt-oss-120b      ← primary reasoning model (Groq LPU)
 *   openai/gpt-oss-20b       ← resilient fallback model
 *   llama-3.3-70b-versatile  ← legacy alternative
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import {
  PRIMARY_MODEL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
} from './lib/config.js';
import {
  sanitize,
  sanitizeNumber,
  isGeneralProgrammingRequest,
  DECLINE_CODE_MESSAGE,
  extractJson,
  stripCodeFences,
} from './lib/sanitizers.js';
import { callGroq } from './lib/groqClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = PRIMARY_MODEL;

const isDev = process.env.NODE_ENV !== 'production';

// ---- CORS ----
const allowedOrigins = isDev
  ? ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000']
  : (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({
  origin: isDev ? true : (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ---- Middleware ----
app.use(express.json({ limit: '512kb' }));

// ---- Simple in-memory rate limiter ----
const rateLimitMap = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, windowStart: now };

  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.windowStart = now;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);

  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  next();
}

// ---- Request Logger (no secrets or PII) ----
function logRequest(endpoint, extras = {}) {
  console.log(`[${new Date().toISOString()}] POST ${endpoint}`, extras);
}

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    groqConfigured: Boolean(GROQ_API_KEY),
    model: MODEL,
  });
});

// ---- Chat with AI Mentor ----
app.post('/api/ai/chat', rateLimit, async (req, res) => {
  try {
    const { messages = [], eventContext = {} } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    logRequest('/api/ai/chat', { messageCount: messages.length });

    const sanitizedMessages = messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: sanitize(m.content, 2000),
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
      return res.json({ reply: DECLINE_CODE_MESSAGE, model: MODEL });
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
      console.warn('[/api/ai/chat] Groq failed, using resilient reply:', groqErr.message);
      const lower = lastUserMsg.toLowerCase();
      if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(lower)) {
        reply = "Hello! I'm CelebrAI, your personal celebration co-planner. How can I assist you with your event today?";
      } else if (isGeneralProgrammingRequest(lastUserMsg)) {
        reply = DECLINE_CODE_MESSAGE;
      } else {
        reply = `I am currently in resilient co-planning mode. For ${eventName ? `"${eventName}"` : 'your celebration'}, I can help recommend themes, schedule timelines, or review budget plans. What specific task would you like to tackle?`;
      }
    }

    res.json({ reply, model: usedModel });
  } catch (err) {
    console.error('[/api/ai/chat]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- Generate event plan ----
app.post('/api/ai/generate-plan', rateLimit, async (req, res) => {
  try {
    const {
      eventType, eventName, eventDate, location,
      guestCount, budget, currency, theme, requirements,
    } = req.body;

    if (!sanitize(eventName, 100)) {
      return res.status(400).json({ error: 'eventName is required' });
    }

    logRequest('/api/ai/generate-plan', { eventType, eventName: sanitize(eventName, 50) });

    const safeName = sanitize(eventName, 100);
    const safeType = sanitize(eventType || 'Event', 50);
    const safeDate = sanitize(eventDate || 'TBD', 30);
    const safeLocation = sanitize(location || 'India', 100);
    const safeGuests = sanitizeNumber(guestCount, 1, 100000, 100);
    const safeBudget = sanitizeNumber(budget, 0, 100_000_000, 0);
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

    const groqRes = await callGroq(
      GROQ_API_KEY,
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.5, maxTokens: 4096 }
    );

    let plan;
    try {
      plan = extractJson(groqRes.content);
    } catch {
      throw new Error('AI returned malformed JSON. Please try again.');
    }

    if (!plan.tasks || !Array.isArray(plan.tasks)) plan.tasks = [];
    if (!plan.budgetBreakdown || !Array.isArray(plan.budgetBreakdown)) plan.budgetBreakdown = [];
    if (!plan.milestones || !Array.isArray(plan.milestones)) plan.milestones = [];
    if (!plan.recommendations || !Array.isArray(plan.recommendations)) plan.recommendations = [];
    if (!plan.themeSuggestions || !Array.isArray(plan.themeSuggestions)) plan.themeSuggestions = [];
    if (typeof plan.eventSummary !== 'string') plan.eventSummary = '';

    res.json({ ...plan, _model: groqRes.model });
  } catch (err) {
    console.error('[/api/ai/generate-plan]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- Generate invitation text ----
app.post('/api/ai/invitation', rateLimit, async (req, res) => {
  try {
    const { eventDetails = {}, tone, type } = req.body;

    logRequest('/api/ai/invitation');

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
    res.json({ text: groqRes.content, model: groqRes.model });
  } catch (err) {
    console.error('[/api/ai/invitation]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- Generate decor ideas ----
app.post('/api/ai/decor', rateLimit, async (req, res) => {
  try {
    const { eventDetails = {}, style } = req.body;

    logRequest('/api/ai/decor');

    const safeStyle = sanitize(style || 'elegant', 50);
    const safeType = sanitize(eventDetails.eventType || 'event', 50);
    const safeGuests = sanitizeNumber(eventDetails.guestCount, 1, 100000, 100);

    const prompt = `Generate exactly 5 creative ${safeStyle} decor ideas for a ${safeType} with ${safeGuests} guests. Return a valid JSON array of exactly 5 strings. Each string should be 1-2 sentences describing a specific, actionable decor idea. No other text — only the JSON array.`;

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
      ideas = ['Could not parse AI response. Please try again.'];
    }

    res.json({ ideas: ideas.map(String), model: groqRes.model });
  } catch (err) {
    console.error('[/api/ai/decor]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- Global error handler ----
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log('\n🎉 CelebrAI AI Proxy Server');
  console.log(`   URL:   http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Key:   ${GROQ_API_KEY ? '✅ Loaded' : '❌ MISSING — add GROQ_API_KEY to .env'}`);
  console.log(`   Mode:  ${isDev ? 'development' : 'production'}\n`);

  if (!GROQ_API_KEY) {
    console.warn('⚠️  WARNING: GROQ_API_KEY is not set. AI endpoints will fail.\n');
  }
});
