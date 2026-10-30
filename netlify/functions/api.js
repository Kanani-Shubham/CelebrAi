// Netlify Serverless Function — CelebrAI Groq AI Proxy
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

async function callGroq(messages, options = {}) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in Netlify environment variables.');
  }

  const { temperature = 0.7, maxTokens = 1024, model = MODEL } = options;
  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function sanitize(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').slice(0, maxLen).trim();
}

function sanitizeNumber(n, min = 0, max = 100_000_000, fallback = 0) {
  const num = Number(n);
  return isNaN(num) ? fallback : Math.min(Math.max(num, min), max);
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

  // Normalize path: /api/... or /.netlify/functions/api/...
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

    // 1. Chat
    if (path === '/ai/chat') {
      const { messages = [], eventContext = {} } = body;
      const eventName = sanitize(eventContext.eventName || '', 100);
      const eventType = sanitize(eventContext.eventType || '', 50);
      const location = sanitize(eventContext.location || '', 100);
      const guestCount = Number(eventContext.guestCount) > 0 ? Number(eventContext.guestCount) : null;
      const budget = Number(eventContext.budget) > 0 ? Number(eventContext.budget) : null;
      const currency = sanitize(eventContext.currency || '₹', 5);

      const contextParts = [];
      if (eventName && eventName !== 'your event') contextParts.push(`- Event Name: "${eventName}"`);
      if (eventType && eventType !== 'Event') contextParts.push(`- Type: ${eventType}`);
      if (location && location !== 'India' && location !== 'TBD') contextParts.push(`- Location: ${location}`);
      if (guestCount) contextParts.push(`- Confirmed Guests: ${guestCount}`);
      if (budget) contextParts.push(`- Confirmed Budget: ${currency} ${budget.toLocaleString('en-IN')}`);

      const contextBlock = contextParts.length > 0
        ? `CURRENT EVENT CONTEXT (Use ONLY when relevant to the user request. NEVER invent unconfirmed details):\n${contextParts.join('\n')}`
        : 'CURRENT EVENT CONTEXT: No specific event details confirmed yet.';

      const systemPrompt = `You are CelebrAI, an intelligent, versatile AI event planning mentor and assistant powered by GPT-OSS 120B.

${contextBlock}

CRITICAL BEHAVIOR INSTRUCTIONS:
1. GREETINGS: If the user says "hi", "hello", "hey", or offers a casual greeting, respond with a short, warm greeting (1-2 sentences) asking how you can assist them today. NEVER fabricate an event plan, budget breakdown, or venue list for a simple greeting.
2. ANSWER DIRECTLY: Always answer the user's specific prompt directly.
   - If the user asks for code (e.g. HTML/CSS for a lamp, JavaScript, Python), provide clean, complete code directly. Do NOT force the response back to event planning.
   - If the user asks for writing, invitation drafts, decor, timelines, or general advice, fulfill that exact request.
3. CONTEXT INTEGRITY:
   - Use current event context only when relevant.
   - Do NOT invent fake venue names, prices, availability, or pretend external databases have been checked.
   - If information is missing for an event task, ask a brief clarifying question instead of inventing numbers.
4. CONCISENESS & QUALITY:
   - Keep answers appropriately concise and well-formatted with markdown unless the user specifically asks for deep detail.`;

      const sanitizedMessages = (Array.isArray(messages) ? messages : []).slice(-12).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: sanitize(m.content, 2000),
      })).filter((m) => m.content.length > 0);

      const reply = await callGroq([
        { role: 'system', content: systemPrompt },
        ...sanitizedMessages,
      ], { temperature: 0.7, maxTokens: 1024 });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reply, model: MODEL }),
      };
    }

    // 2. Generate Plan
    if (path === '/ai/generate-plan') {
      const {
        eventType, eventName, eventDate, location,
        guestCount, budget, currency, theme, requirements,
      } = body;

      const safeName = sanitize(eventName || 'Event', 100);
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
}`;

      const raw = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.5, maxTokens: 2500 });

      let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }
      const plan = JSON.parse(cleaned);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ...plan, _model: MODEL }),
      };
    }

    // 3. Invitation text
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

      const text = await callGroq([
        { role: 'system', content: 'You are a luxury event copywriter. Write beautiful event invitations.' },
        { role: 'user', content: prompt },
      ], { temperature: 0.8, maxTokens: 600 });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text, model: MODEL }),
      };
    }

    // 4. Decor ideas
    if (path === '/ai/decor') {
      const { eventDetails = {}, style } = body;
      const safeStyle = sanitize(style || 'elegant', 50);
      const safeType = sanitize(eventDetails.eventType || 'event', 50);
      const safeGuests = sanitizeNumber(eventDetails.guestCount, 1, 100000, 100);

      const prompt = `Generate exactly 5 creative ${safeStyle} decor ideas for a ${safeType} with ${safeGuests} guests. Return a valid JSON array of exactly 5 strings. No other text — only the JSON array.`;

      const raw = await callGroq([
        { role: 'system', content: 'You are a luxury event designer. Return only a valid JSON array of strings.' },
        { role: 'user', content: prompt },
      ], { temperature: 0.8, maxTokens: 600 });

      let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleaned = cleaned.slice(firstBracket, lastBracket + 1);
      }
      const ideas = JSON.parse(cleaned);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ideas: Array.isArray(ideas) ? ideas : [cleaned], model: MODEL }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Not found: ${path}` }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
