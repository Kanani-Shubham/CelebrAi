/**
 * CelebrAI — Production AI Proxy Server
 * Securely proxies requests to Groq API — GROQ_API_KEY never exposed to browser.
 *
 * Usage:
 *   Development:  node server/api.js
 *   Production:   NODE_ENV=production node server/api.js
 *
 * Available models on this account (verified 2026-10-26):
 *   openai/gpt-oss-120b   ← requested model (GPT-OSS 120B)
 *   openai/gpt-oss-20b
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// ---- Model Configuration ----
// User requested: GPT-OSS 120B
// Verified available on this Groq account: openai/gpt-oss-120b
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

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
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests/minute/IP

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
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

// ---- Groq Caller ----
async function callGroq(messages, options = {}) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured on the server. Add it to your .env file.');
  }

  const {
    temperature = 0.7,
    maxTokens = 1024,
    model = MODEL,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      let errJson;
      try { errJson = JSON.parse(errText); } catch { errJson = null; }
      const msg = errJson?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`Groq API: ${msg}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Request timed out after 30 seconds.');
    throw err;
  }
}

// ---- Input sanitization ----
function sanitize(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').slice(0, maxLen).trim();
}

function sanitizeNumber(n, min = 0, max = 100_000_000, fallback = 0) {
  const num = Number(n);
  return isNaN(num) ? fallback : Math.min(Math.max(num, min), max);
}

// ============================================================
// ROUTES
// ============================================================

// Health check — no auth required
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    model: MODEL,
    groqKeyLoaded: !!GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ---- Chat endpoint ----
app.post('/api/ai/chat', rateLimit, async (req, res) => {
  try {
    const { messages = [], eventContext = {} } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }

    logRequest('/api/ai/chat', { msgCount: messages.length });

    const eventName = sanitize(eventContext.eventName || 'your event', 100);
    const eventType = sanitize(eventContext.eventType || 'Event', 50);
    const location = sanitize(eventContext.location || 'India', 100);
    const guestCount = sanitizeNumber(eventContext.guestCount, 1, 100000, 100);
    const budget = sanitizeNumber(eventContext.budget, 0, 100_000_000, 500000);

    const systemPrompt = `You are CelebrAI, a warm and professional AI event planning assistant powered by GPT-OSS 120B. You are helping plan "${eventName}" (${eventType}) in ${location} for ${guestCount} guests with a budget of ₹${budget.toLocaleString('en-IN')}.

Guidelines:
- Provide specific, actionable event planning advice
- Suggest vendors, timelines, checklists, decor ideas, and budget breakdowns
- Be warm, encouraging, and professional
- Use bullet points or numbered lists for clarity
- Tailor advice specifically to the event details provided
- Never make up vendor names or claim bookings unless the user confirms them`;

    // Sanitize and limit message history
    const sanitizedMessages = messages.slice(-12).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: sanitize(m.content, 2000),
    })).filter(m => m.content.length > 0);

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedMessages,
    ];

    const reply = await callGroq(groqMessages, { temperature: 0.7, maxTokens: 1024 });
    res.json({ reply, model: MODEL });
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

    // Validate required fields
    if (!sanitize(eventName, 100)) {
      return res.status(400).json({ error: 'eventName is required' });
    }

    logRequest('/api/ai/generate-plan', { eventType, eventName: sanitize(eventName, 50) });

    const safeName = sanitize(eventName, 100);
    const safeType = sanitize(eventType || 'Event', 50);
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

    const raw = await callGroq(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.5, maxTokens: 2500 }
    );

    // Robustly extract JSON from response
    let cleaned = raw.trim();
    // Remove any markdown code fences
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    // Find the outermost JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch {
      throw new Error('AI returned malformed JSON. Please try again.');
    }

    // Validate essential shape
    if (!plan.tasks || !Array.isArray(plan.tasks)) plan.tasks = [];
    if (!plan.budgetBreakdown || !Array.isArray(plan.budgetBreakdown)) plan.budgetBreakdown = [];
    if (!plan.milestones || !Array.isArray(plan.milestones)) plan.milestones = [];
    if (!plan.recommendations || !Array.isArray(plan.recommendations)) plan.recommendations = [];
    if (!plan.themeSuggestions || !Array.isArray(plan.themeSuggestions)) plan.themeSuggestions = [];
    if (typeof plan.eventSummary !== 'string') plan.eventSummary = '';

    res.json({ ...plan, _model: MODEL });
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

    const text = await callGroq(
      [
        { role: 'system', content: 'You are a luxury event copywriter. Write beautiful, emotionally resonant event invitations.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.8, maxTokens: 600 }
    );
    res.json({ text, model: MODEL });
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

    const raw = await callGroq(
      [
        { role: 'system', content: 'You are a luxury event designer. Return only a valid JSON array of strings.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.8, maxTokens: 600 }
    );

    let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }

    let ideas;
    try {
      ideas = JSON.parse(cleaned);
      if (!Array.isArray(ideas)) ideas = [cleaned];
    } catch {
      ideas = ['Could not parse AI response. Please try again.'];
    }

    res.json({ ideas: ideas.map(String), model: MODEL });
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
