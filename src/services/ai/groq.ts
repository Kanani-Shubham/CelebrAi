// Groq AI service — runs all requests through our server-side API proxy
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
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

export async function generateEventPlan(
  request: AIPlanRequest,
  token: string
): Promise<AIPlanResult> {
  return callAI<AIPlanResult>('/ai/generate-plan', request, token);
}

export async function sendChatMessage(
  messages: AIChatMessage[],
  eventContext: Record<string, unknown>,
  token: string
): Promise<string> {
  const result = await callAI<{ reply: string }>(
    '/ai/chat',
    { messages, eventContext },
    token
  );
  return result.reply;
}

export async function generateInvitationText(
  eventDetails: Record<string, unknown>,
  tone: string,
  type: string,
  token: string
): Promise<string> {
  const result = await callAI<{ text: string }>(
    '/ai/invitation',
    { eventDetails, tone, type },
    token
  );
  return result.text;
}

export async function generateDecorIdeas(
  eventDetails: Record<string, unknown>,
  style: string,
  token: string
): Promise<string[]> {
  const result = await callAI<{ ideas: string[] }>(
    '/ai/decor',
    { eventDetails, style },
    token
  );
  return result.ideas;
}

// Validate a raw AI plan response into our typed schema
export function validateAIPlan(raw: unknown): AIPlanResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid AI response: expected object');
  }
  const r = raw as Record<string, unknown>;
  return {
    eventSummary: String(r.eventSummary ?? ''),
    themeSuggestions: Array.isArray(r.themeSuggestions)
      ? r.themeSuggestions.map(String)
      : [],
    tasks: Array.isArray(r.tasks)
      ? r.tasks.map(t => ({
          title: String((t as Record<string, unknown>).title ?? ''),
          category: String((t as Record<string, unknown>).category ?? ''),
          priority: (['high', 'medium', 'low'].includes(
            String((t as Record<string, unknown>).priority)
          )
            ? String((t as Record<string, unknown>).priority)
            : 'medium') as 'high' | 'medium' | 'low',
          suggestedDueDate:
            typeof (t as Record<string, unknown>).suggestedDueDate === 'string'
              ? String((t as Record<string, unknown>).suggestedDueDate)
              : null,
        }))
      : [],
    budgetBreakdown: Array.isArray(r.budgetBreakdown)
      ? r.budgetBreakdown.map(b => ({
          category: String((b as Record<string, unknown>).category ?? ''),
          estimatedAmount: Number((b as Record<string, unknown>).estimatedAmount ?? 0),
          currency: String((b as Record<string, unknown>).currency ?? 'INR'),
          notes: String((b as Record<string, unknown>).notes ?? ''),
        }))
      : [],
    milestones: Array.isArray(r.milestones)
      ? r.milestones.map(m => ({
          title: String((m as Record<string, unknown>).title ?? ''),
          targetDate:
            typeof (m as Record<string, unknown>).targetDate === 'string'
              ? String((m as Record<string, unknown>).targetDate)
              : null,
          description: String((m as Record<string, unknown>).description ?? ''),
        }))
      : [],
    recommendations: Array.isArray(r.recommendations)
      ? r.recommendations.map(String)
      : [],
  };
}
