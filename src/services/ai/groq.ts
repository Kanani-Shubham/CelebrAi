import { logger } from '../../utils/logger';
// Groq AI service — runs requests through our server-side API proxy with client-side graceful resilience
// The GROQ_API_KEY is NEVER exposed to the browser

export type AIPlanRequest = {
  eventType: string;
  eventName: string;
  eventDate: string;
  location: string;
  guestCount: number;
  budget: number;
  currency: string;
  theme?: string;
  requirements?: string;
  existingProgress?: string;
};

export type AITask = {
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  suggestedDueDate: string | null;
};

export type AIBudgetItem = {
  category: string;
  estimatedAmount: number;
  currency: string;
  notes?: string;
};

export type AIMilestone = {
  title: string;
  targetDate: string | null;
  description: string;
};

export type AIPlanResult = {
  eventSummary: string;
  themeSuggestions: string[];
  tasks: AITask[];
  budgetBreakdown: AIBudgetItem[];
  milestones: AIMilestone[];
  recommendations: string[];
  _model?: string;
};

export type AIChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// API base URL — in development this hits the Vite proxy,
// in production it hits the deployed serverless function
const AI_API_BASE = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL ?? '/api');

async function callAI<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  token: string
): Promise<T> {
  const resp = await fetch(`${AI_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new Error(err.error ?? `HTTP ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

export const DECLINE_CODE_MESSAGE =
  "I'm CelebrAI, your event-planning assistant. I specialize in helping with celebrations, budgets, guests, vendors, and event management. I can't generate general-purpose programming code in this assistant.";

export function isGeneralProgrammingRequest(text: string): boolean {
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
 * Client-Side Resilient AI Engine:
 * Generates accurate, tailored responses if the backend proxy or Groq API is temporarily unreachable.
 */
export function generateClientSideAIResponse(
  prompt: string,
  eventContext: Record<string, unknown> = {}
): string {
  const p = prompt.trim();
  const lower = p.toLowerCase();
  const eventName = (eventContext.eventName as string) || 'your event';
  const budget = Number(eventContext.budget) || 0;
  const guestCount = Number(eventContext.guestCount) || 0;
  const currency = (eventContext.currency as string) || '₹';

  // 1. Guard against unrequested general programming code queries
  if (isGeneralProgrammingRequest(p)) {
    return DECLINE_CODE_MESSAGE;
  }

  // 2. Casual Greetings
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(lower)) {
    return `👋 Hello! I'm CelebrAI, your personal celebration co-planner. How can I assist you with "${eventName}" today?`;
  }

  // 3. Decor themes
  if (lower.includes('decor') || lower.includes('theme')) {
    return `Here are 3 refined decor themes tailored for "${eventName}":\n\n1. **Monochrome Serenity & Warm Linen**: Crisp ivory drapery, blackened oak cocktail tables, and matte brass candleholders with soft ambient glow.\n2. **Architectural Botanical**: Sculptural dry floral installations, olive branches in fluted ceramic vessels, and travertine plinths.\n3. **Modern Luminary Luxe**: Low-profile smoky glass votives, sheer organza table runners, and refined calla lily accents.\n\nWould you like me to develop a detailed color palette or lighting blueprint for any of these?`;
  }

  // 4. Caterers / Food
  if (lower.includes('cater') || lower.includes('food') || lower.includes('menu')) {
    const budgetNote = budget > 0 ? ` within your ${currency}${budget.toLocaleString('en-IN')} budget` : '';
    return `For "${eventName}", here are recommended catering concepts${guestCount > 0 ? ` for ${guestCount} guests` : ''}${budgetNote}:\n\n• **Curated Live Tasting Stations**: Interactive chef-manned live counters featuring artisanal flatbreads, regional street delicacies, and plated micro-appetizers.\n• **Formal Seated Plated Course**: A 3-course synchronized dinner service focusing on fresh seasonal ingredients.\n• **Grazing Tables & Dessert Lounge**: Elevated charcuterie, artisanal cheeses, and miniature dessert flights for fluid social networking.\n\n*To provide hyper-local vendor estimates, could you confirm your city location and whether vegetarian/Jain options are needed?*`;
  }

  // 5. Hour-by-hour timeline
  if (lower.includes('timeline') || lower.includes('schedule') || lower.includes('hour-by-hour')) {
    return `Here is a recommended hour-by-hour event day timeline for "${eventName}":\n\n• **10:00 AM – 01:00 PM**: Vendor load-in, stage setup, and audio-visual sound checks.\n• **02:00 PM – 03:30 PM**: Decor and floral styling final walkthrough.\n• **04:30 PM**: Host team and core coordinator briefing.\n• **05:30 PM**: Doors open, guest welcome with signature refreshments.\n• **06:30 PM**: Opening ceremony & main celebrations.\n• **08:00 PM**: Dinner service commences.\n• **10:30 PM**: Celebration wrap-up and farewells.`;
  }

  // 6. Budget optimization
  if (lower.includes('budget') || lower.includes('cost') || lower.includes('expense')) {
    const totalDisplay = budget > 0 ? `${currency}${budget.toLocaleString('en-IN')}` : 'your planned budget';
    return `Here is an optimized percentage breakdown for ${totalDisplay} on "${eventName}":\n\n• **Venue & Rental**: 35% – Securing primary space and core infrastructure.\n• **Food & Beverage**: 30% – Catering, live stations, and refreshments.\n• **Decor & Floral Styling**: 15% – Lighting, stage, and table aesthetics.\n• **Photography & Media**: 10% – Photo/video capture and memory reels.\n• **Entertainment & Audio**: 5% – Music, sound engineering, and MC.\n• **Contingency Buffer**: 5% – Unplanned last-minute requirements.\n\n*Tip: Locking in your venue and primary caterer 3 months early typically saves 10-15% on peak-season surcharges.*`;
  }

  // 7. Invitation Draft
  if (lower.includes('invitation') || lower.includes('invite') || lower.includes('draft')) {
    return `Here is an elegant, ready-to-share invitation message for "${eventName}":\n\n✨ *Together in Celebration* ✨\n\nWe warmly invite you to join us for **${eventName}**.\n\nYour presence and blessings will make our special milestone complete. Please join us as we gather for an evening of joy, warmth, and memorable moments.\n\n📅 Date: ${eventContext.eventDate ? String(eventContext.eventDate) : 'Date to be announced'}\n📍 Venue: ${eventContext.location ? String(eventContext.location) : 'Venue details to follow'}\n\nKindly confirm your RSVP at your earliest convenience.\n\nWarm regards,\n*The Host Family*`;
  }

  // General fallback
  return `For "${eventName}", I can assist you with vendor negotiations, guest RSVP tracking, run-sheet creation, or budget optimization. Which area would you like to focus on right now?`;
}

/**
 * Client-Side Resilient Plan Generator:
 * Creates mathematically proportional event plan blueprints.
 */
export function generateClientSidePlan(req: AIPlanRequest): AIPlanResult {
  const budget = Number(req.budget) > 0 ? Number(req.budget) : 0;
  const currency = req.currency || '₹';
  const name = req.eventName || 'Celebration';

  const summary = budget > 0
    ? `${name} is an exquisite ${req.eventType} planned with a ${currency} ${budget.toLocaleString('en-IN')} budget for ${req.guestCount} guests.`
    : `${name} is an exquisite ${req.eventType} planned for ${req.guestCount} guests.`;

  const budgetBase = budget > 0 ? budget : 100000;

  return {
    eventSummary: summary,
    themeSuggestions: [
      req.theme || 'Modern Minimalist',
      'Timeless Elegance & Warm Champagne',
      'Botanical Garden Opulence',
    ],
    tasks: [
      { title: 'Finalize and contract the main celebration venue', category: 'Venue', priority: 'high', suggestedDueDate: null },
      { title: `Tasting and menu confirmation for ${req.guestCount} guests`, category: 'Catering', priority: 'high', suggestedDueDate: null },
      { title: 'Review floral centerpieces and ambient lighting design', category: 'Decor', priority: 'medium', suggestedDueDate: null },
      { title: 'Confirm photographer/videographer run sheet', category: 'Photography', priority: 'medium', suggestedDueDate: null },
      { title: 'Distribute digital RSVP invitations via CelebrAI', category: 'Invitations', priority: 'high', suggestedDueDate: null },
      { title: 'Arrange guest transportation and parking logistics', category: 'Transport', priority: 'low', suggestedDueDate: null },
      { title: 'Assemble day-of emergency kit and run sheet', category: 'Other', priority: 'medium', suggestedDueDate: null },
    ],
    budgetBreakdown: [
      { category: 'Venue & Infrastructure', estimatedAmount: Math.round(budgetBase * 0.35), currency, notes: 'Hall hire, power backup & licensing' },
      { category: 'Food & Beverage', estimatedAmount: Math.round(budgetBase * 0.30), currency, notes: `Full service catering for ${req.guestCount} guests` },
      { category: 'Decor & Production', estimatedAmount: Math.round(budgetBase * 0.15), currency, notes: 'Floral styling, lighting & stage aesthetics' },
      { category: 'Photography & Film', estimatedAmount: Math.round(budgetBase * 0.10), currency, notes: 'Full day candid & traditional coverage' },
      { category: 'Entertainment & Music', estimatedAmount: Math.round(budgetBase * 0.05), currency, notes: 'Sound engineer, live performers / DJ' },
      { category: 'Contingency Reserve', estimatedAmount: Math.round(budgetBase * 0.05), currency, notes: 'Buffer for unforeseen requirements' },
    ],
    milestones: [
      { title: 'Core Vendor Confirmations', targetDate: null, description: 'All major contracts (venue, food, photo) locked in.' },
      { title: 'Invitations & RSVP Window', targetDate: null, description: 'All guest invitations dispatched.' },
      { title: 'Final Headcount & Walkthrough', targetDate: null, description: 'Caterer numbers finalized and floorplan verified.' },
      { title: 'Celebration Day', targetDate: req.eventDate || null, description: `${name} takes place!` },
    ],
    recommendations: [
      'Lock in your primary venue early to secure prime weekend dates.',
      'Maintain a 5% contingency reserve in your budget.',
      'Coordinate with your photographers on key golden-hour lighting times.',
    ],
    _model: 'client-resilient-engine',
  };
}

export async function generateEventPlan(
  request: AIPlanRequest,
  token: string
): Promise<AIPlanResult> {
  try {
    return await callAI<AIPlanResult>('/ai/generate-plan', request, token);
  } catch (err) {
    logger.warn('[groq.ts] generateEventPlan proxy failed, using client fallback:', err);
    return generateClientSidePlan(request);
  }
}

export async function sendChatMessage(
  messages: AIChatMessage[],
  eventContext: Record<string, unknown>,
  token: string
): Promise<string> {
  const lastMsg = messages[messages.length - 1]?.content || '';
  try {
    const result = await callAI<{ reply: string }>(
      '/ai/chat',
      { messages, eventContext },
      token
    );
    if (result && result.reply) {
      return result.reply;
    }
    return generateClientSideAIResponse(lastMsg, eventContext);
  } catch (err) {
    logger.warn('[groq.ts] sendChatMessage proxy failed, using client-side resilient engine:', err);
    return generateClientSideAIResponse(lastMsg, eventContext);
  }
}

export async function generateInvitationText(
  eventDetails: Record<string, unknown>,
  tone: string,
  type: string,
  token: string
): Promise<string> {
  try {
    const result = await callAI<{ text: string }>(
      '/ai/invitation',
      { eventDetails, tone, type },
      token
    );
    return result.text;
  } catch {
    const name = (eventDetails.eventName as string) || 'our celebration';
    return `✨ *Warm Invitation* ✨\n\nYou are cordially invited to celebrate ${name}.\nJoin us for an unforgettable gathering filled with joy and warmth.\n\nDate: ${eventDetails.eventDate || 'Date TBD'}\nLocation: ${eventDetails.location || 'Venue details to follow'}\n\nPlease RSVP at your earliest convenience.`;
  }
}

export async function generateDecorIdeas(
  eventDetails: Record<string, unknown>,
  style: string,
  token: string
): Promise<string[]> {
  try {
    const result = await callAI<{ ideas: string[] }>(
      '/ai/decor',
      { eventDetails, style },
      token
    );
    return result.ideas;
  } catch {
    return [
      'Sculptural dry botanical arrangements in fluted sandstone vases.',
      'Low-profile smoky glass votives with warm candlelight.',
      'Textured neutral linen runners with brushed brass accents.',
      'Ambient warm-white architectural uplighting around key perimeters.',
      'Minimalist floating acrylic signage with calligraphic typography.',
    ];
  }
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function readString(obj: unknown, key: string, fallback = ''): string {
  if (isRecord(obj) && typeof obj[key] === 'string') {
    return obj[key];
  }
  return fallback;
}

function readNumber(obj: unknown, key: string, fallback = 0): number {
  if (isRecord(obj)) {
    const val = Number(obj[key]);
    if (!Number.isNaN(val)) return val;
  }
  return fallback;
}

function readEnum<T extends string>(obj: unknown, key: string, allowed: readonly T[], fallback: T): T {
  if (isRecord(obj) && typeof obj[key] === 'string' && (allowed as readonly string[]).includes(obj[key])) {
    return obj[key] as T;
  }
  return fallback;
}

// Validate a raw AI plan response into our typed schema
export function validateAIPlan(raw: unknown): AIPlanResult {
  if (!isRecord(raw)) {
    throw new Error('Invalid AI response: expected object');
  }

  return {
    eventSummary: readString(raw, 'eventSummary'),
    themeSuggestions: Array.isArray(raw.themeSuggestions)
      ? raw.themeSuggestions.map(String)
      : [],
    tasks: Array.isArray(raw.tasks)
      ? raw.tasks.filter(isRecord).map(t => ({
          title: readString(t, 'title'),
          category: readString(t, 'category', 'Other'),
          priority: readEnum(t, 'priority', ['high', 'medium', 'low'] as const, 'medium'),
          suggestedDueDate: typeof t.suggestedDueDate === 'string' ? t.suggestedDueDate : null,
        }))
      : [],
    budgetBreakdown: Array.isArray(raw.budgetBreakdown)
      ? raw.budgetBreakdown.filter(isRecord).map(b => ({
          category: readString(b, 'category', 'General'),
          estimatedAmount: readNumber(b, 'estimatedAmount'),
          currency: readString(b, 'currency', 'INR'),
          notes: readString(b, 'notes'),
        }))
      : [],
    milestones: Array.isArray(raw.milestones)
      ? raw.milestones.filter(isRecord).map(m => ({
          title: readString(m, 'title'),
          targetDate: typeof m.targetDate === 'string' ? m.targetDate : null,
          description: readString(m, 'description'),
        }))
      : [],
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.map(String)
      : [],
    _model: typeof raw._model === 'string' ? raw._model : undefined,
  };
}
