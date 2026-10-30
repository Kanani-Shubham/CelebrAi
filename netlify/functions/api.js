// Netlify Serverless Function — CelebrAI Groq AI Proxy
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
const FALLBACK_MODEL = 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

async function callGroqWithModel(model, messages, temperature, maxTokens) {
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
    const err = new Error(`Groq API error (${res.status}): ${text}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGroq(messages, options = {}) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in Netlify environment variables.');
  }

  const { temperature = 0.7, maxTokens = 1024, model = MODEL } = options;

  try {
    return await callGroqWithModel(model, messages, temperature, maxTokens);
  } catch (err) {
    // Fallback to reliable model on 400/404 (bad model name or not available)
    if (err.status === 400 || err.status === 404) {
      console.warn(`[callGroq] Primary model "${model}" failed (${err.status}), falling back to "${FALLBACK_MODEL}"`);
      return await callGroqWithModel(FALLBACK_MODEL, messages, temperature, maxTokens);
    }
    throw err;
  }
}

function sanitize(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').slice(0, maxLen).trim();
}

function sanitizeNumber(n, min = 0, max = 100_000_000, fallback = 0) {
  const num = Number(n);
  return isNaN(num) ? fallback : Math.min(Math.max(num, min), max);
}

const DECLINE_CODE_MESSAGE =
  "I'm CelebrAI, your event-planning assistant. I specialize in helping with celebrations, budgets, guests, vendors, and event management. I can't generate general-purpose programming code in this assistant.";

function isGeneralProgrammingRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();

  const codingPatterns = [
    /\b(write|create|generate|give me|show me)\s+(an?\s+)?(html|css|python|java|c\+\+|cpp|c#|javascript|typescript|sql|bash|powershell|rust|ruby|php|golang|go)\s+(code|script|program|app|query)/i,
    /\b(html|css|python|java|javascript|typescript|sql|c\+\+|cpp)\s+(code|script)\s+(for|to)\b/i,
    /\b(write|create)\s+(html|css|python|js|javascript)\s+code\b/i,
    /\bcode\s+(for|to create|to make)\s+(a\s+)?(lamp|game|calculator|scraper|server|bot|algorithm|todo app)\b/i,
    /\b(write|create)\s+a\s+(python|node|bash|shell)\s+script\b/i,
    /\b(html|css)\s+(for|of)\s+a\s+lamp\b/i,
    /\bhow to code\b/i,
  ];

  const isEventException = /\b(invitation|rsvp|email template|guest list)\b/i.test(t);
  if (isEventException && !/\b(lamp|calculator|scraper|game|fibonacci|sorting)\b/i.test(t)) {
    return false;
  }

  return codingPatterns.some(p => p.test(t));
}

/**
 * generateFallbackPlan — local deterministic plan generator.
 * Used when Groq is unreachable or returns an unrecoverable error.
 * Produces a structured plan scaled to guest count and budget.
 */
function generateFallbackPlan({ safeName, safeType, safeDate, safeLocation, safeGuests, safeBudget, safeCurrency, safeTheme }) {
  // Budget breakdown proportional allocation
  const budgetBreakdown = [
    { category: 'Venue', estimatedAmount: Math.round(safeBudget * 0.40), currency: safeCurrency, notes: 'Venue rental, setup, and basic AV' },
    { category: 'Catering', estimatedAmount: Math.round(safeBudget * 0.30), currency: safeCurrency, notes: `Food and beverages for ${safeGuests} guests` },
    { category: 'Decor', estimatedAmount: Math.round(safeBudget * 0.15), currency: safeCurrency, notes: `${safeTheme} themed decorations and floral arrangements` },
    { category: 'Photography', estimatedAmount: Math.round(safeBudget * 0.10), currency: safeCurrency, notes: 'Professional photo and video coverage' },
    { category: 'Other', estimatedAmount: Math.round(safeBudget * 0.05), currency: safeCurrency, notes: 'Miscellaneous supplies, contingency buffer' },
  ];

  // Tasks scaled to guest count
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

  // Milestones relative to event date
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

  // Theme suggestions based on event type
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
    eventSummary: `${safeName} is a ${safeType} for ${safeGuests} guests in ${safeLocation}. Planned with a ${safeCurrency}${safeBudget.toLocaleString('en-IN')} budget and a "${safeTheme}" theme, the event will be an elegant and memorable celebration. This plan was generated locally as a starting point — refine it with the AI assistant.`,
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
    _model: 'local-deterministic',
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

      const sanitizedMessages = (Array.isArray(messages) ? messages : []).slice(-12).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: sanitize(m.content, 2000),
      })).filter((m) => m.content.length > 0);

      const lastUserMsg = (sanitizedMessages[sanitizedMessages.length - 1]?.content || '').trim();

      // Guard: Restrict unrequested general-purpose programming code generation
      if (isGeneralProgrammingRequest(lastUserMsg)) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ reply: DECLINE_CODE_MESSAGE, model: MODEL }),
        };
      }

      const contextParts = [];
      if (eventName && eventName !== 'your event') contextParts.push(`- Event Name: "${eventName}"`);
      if (eventType && eventType !== 'Event') contextParts.push(`- Type: ${eventType}`);
      if (location && location !== 'India' && location !== 'TBD') contextParts.push(`- Location: ${location}`);
      if (guestCount) contextParts.push(`- Confirmed Guests: ${guestCount}`);
      if (budget) contextParts.push(`- Confirmed Budget: ${currency} ${budget.toLocaleString('en-IN')}`);

      const contextBlock = contextParts.length > 0
        ? `CURRENT EVENT CONTEXT (Use ONLY when relevant to the user request. NEVER invent unconfirmed details):\n${contextParts.join('\n')}`
        : 'CURRENT EVENT CONTEXT: No specific event details confirmed yet.';

      const systemPrompt = `You are CelebrAI, an intelligent, specialized AI event-planning mentor and assistant powered by GPT-OSS 120B.

${contextBlock}

CRITICAL BEHAVIOR INSTRUCTIONS:
1. EVENT ASSISTANT SCOPE & CODE RESTRICTION:
   - You are exclusively an event-planning assistant for celebrations, weddings, birthdays, corporate events, budgets, guests, vendors, and schedules.
   - Do NOT generate general-purpose programming code (e.g., HTML/CSS for lamps, Python scripts, JavaScript algorithms, backend code, SQL queries).
   - If the user asks for general programming code, politely decline with this exact message:
     "I'm CelebrAI, your event-planning assistant. I specialize in helping with celebrations, budgets, guests, vendors, and event management. I can't generate general-purpose programming code in this assistant."
2. GREETINGS: If the user says "hi", "hello", "hey", or offers a casual greeting, respond with a short, warm greeting (1-2 sentences) asking how you can assist them with their celebration today. NEVER fabricate an event plan, budget breakdown, or venue list for a simple greeting.
3. CONTEXT INTEGRITY & STRICT NO-INVENTION POLICY:
   - Use confirmed event context only when relevant.
   - Confirmed Budget: ${budget ? `${currency} ${budget.toLocaleString('en-IN')}` : 'UNSPECIFIED'}.
   - Confirmed Guests: ${guestCount ? guestCount : 'UNSPECIFIED'}.
   - STRICT PROHIBITION ON INVENTED DATA:
     * NEVER invent, assume, or hallucinate an event budget (such as ₹5,00,000 or any other fabricated number), guest count, venue, date, or location if it is NOT in the confirmed event context or specified by the user.
     * When asked for recommendations (such as catering, decor, or schedules) and NO budget is confirmed, provide suggestions across flexible tiers and politely ask the user what their target budget or guest count is. NEVER state or imply a specific budget number unless the user or confirmed context explicitly provided it.
     * Do NOT fabricate vendor names, quotes, availability, or pretend external databases have been checked.
4. FORMATTING & RESPONSE QUALITY:
   - Present information using clean, standard Markdown.
   - Use Markdown tables for tabular data, comparisons, or budget breakdowns.
   - Use bullet points for lists and bold formatting for key concepts.
   - NEVER output raw HTML tags (e.g. no <br>, <div>, or <span> tags). Use proper Markdown double-newlines for line breaks.
   - Keep answers appropriately concise, elegant, and warm.`;

      let reply;
      try {
        reply = await callGroq([
          { role: 'system', content: systemPrompt },
          ...sanitizedMessages,
        ], { temperature: 0.7, maxTokens: 1024 });
      } catch (groqErr) {
        console.warn('[/ai/chat] Groq failed, using resilient fallback reply:', groqErr.message);
        const lower = lastUserMsg.toLowerCase();
        if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(lower)) {
          reply = `Hello! I'm CelebrAI, your personal celebration co-planner. How can I assist you with your event today?`;
        } else if (isGeneralProgrammingRequest(lastUserMsg)) {
          reply = DECLINE_CODE_MESSAGE;
        } else {
          reply = `I am currently in resilient co-planning mode. For ${eventName ? `"${eventName}"` : 'your celebration'}, I can help recommend themes, schedule timelines, or review budget plans. What specific task would you like to tackle?`;
        }
      }

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
      const safeBudget = sanitizeNumber(budget, 0, 100_000_000, 0);
      const safeCurrency = sanitize(currency || '₹', 5);
      const safeTheme = sanitize(theme || 'Classic Elegant', 100);
      const safeReqs = sanitize(requirements || '', 500);

      const planParams = { safeName, safeType, safeDate, safeLocation, safeGuests, safeBudget, safeCurrency, safeTheme };

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

      let plan;
      try {
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
        plan = JSON.parse(cleaned);
        plan._model = MODEL;
      } catch (groqErr) {
        // Groq unreachable or returned unrecoverable error — serve deterministic fallback plan
        console.warn('[generate-plan] Groq failed, using local fallback:', groqErr.message);
        plan = generateFallbackPlan(planParams);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(plan),
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
