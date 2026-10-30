# AI Integration — CelebrAI

> [!IMPORTANT]
> The Groq API key **must never appear in client-side code**. All AI requests flow through a server-side proxy.

---

## 1. Architecture Overview

```
Browser (React SPA)
       │
       │  POST /api/ai/*
       │  Authorization: Bearer <Firebase ID Token>
       ▼
Proxy Server (Express / Netlify Functions)
       │  Verifies Firebase ID Token
       │  Attaches X-API-KEY: GROQ_API_KEY
       ▼
Groq AI API
       │  Returns JSON
       ▼
Proxy Server (validates & returns)
       │
       ▼
Browser (renders result)
```

The client never has direct access to the Groq API. The proxy acts as a **security boundary** and a **rate-limit enforcer**.

---

## 2. Why the API Key Is Server-Side Only

If `GROQ_API_KEY` were embedded in the Vite bundle (even as `import.meta.env.VITE_GROQ_KEY`):
- It would be visible in the JavaScript bundle downloaded by every visitor.
- Any user could extract it and make unlimited requests to Groq at the project's expense.

By keeping it in `process.env.GROQ_API_KEY` on the server:
- The key is never serialized into any HTTP response.
- Requests are authenticated with a **Firebase ID Token** (short-lived, user-specific).
- The proxy can enforce per-user rate limiting.

---

## 3. AI Models

### Primary Model
```
meta-llama/llama-4-scout-17b-16e-instruct
```
- 16-expert Mixture-of-Experts architecture
- 17B active parameters
- Low latency for structured JSON generation

### Fallback Model
```
llama-3.3-70b-versatile
```
Used when the primary model is unavailable or returns an error. The proxy retries with the fallback automatically.

### Model Selection Logic (server pseudocode)
```javascript
const MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.3-70b-versatile',
];

async function callWithFallback(prompt) {
  for (const model of MODELS) {
    try {
      return await groq.chat.completions.create({ model, ...prompt });
    } catch (err) {
      if (isRateLimitError(err) || isModelUnavailable(err)) continue;
      throw err;
    }
  }
  throw new Error('All models unavailable');
}
```

---

## 4. API Endpoints

### `POST /api/ai/generate-plan`
Generates a full event plan given event details.

**Request body** (`AIPlanRequest`):
```typescript
{
  eventType: string;
  eventName: string;
  eventDate: string;        // YYYY-MM-DD
  location: string;
  guestCount: number;
  budget: number;
  currency: string;         // e.g. 'INR'
  theme?: string;
  requirements?: string;
  existingProgress?: string;
}
```

**Response** (`AIPlanResult`):
```typescript
{
  eventSummary: string;
  themeSuggestions: string[];
  tasks: AITask[];
  budgetBreakdown: AIBudgetItem[];
  milestones: AIMilestone[];
  recommendations: string[];
}
```

### `POST /api/ai/chat`
Sends a message to the AI Mentor for contextual event guidance.

**Request body**:
```json
{
  "messages": [{ "role": "user", "content": "How many tables do I need?" }],
  "eventContext": { "guestCount": 250, "budget": 800000 }
}
```

**Response**:
```json
{ "reply": "For 250 guests, you'll need approximately 25 round tables..." }
```

### `POST /api/ai/invitation`
Generates invitation text in a specified tone and style.

### `POST /api/ai/decor`
Generates decoration ideas based on event style preferences.

---

## 5. Rate Limit Handling

Groq enforces per-minute token limits. The proxy handles `429 Too Many Requests` responses:

1. **Exponential backoff** — Retry after 2 s, 4 s, 8 s (max 3 retries).
2. **Model fallback** — Switch to the secondary model if the primary is throttled.
3. **Deterministic fallback** — If all retries are exhausted, return a pre-built fallback plan (see §6).

The client (`src/services/ai/groq.ts`) sets a **30-second timeout** via `AbortSignal.timeout(30_000)` to prevent indefinite hangs.

---

## 6. Deterministic Fallback Plan Generation

When AI is unavailable, the client renders a hardcoded sensible default plan so users always see actionable output.

### Fallback Plan Structure
```typescript
const FALLBACK_PLAN: AIPlanResult = {
  eventSummary: 'Your event plan is ready. AI enhancement will be applied when service is restored.',
  themeSuggestions: ['Classic Elegance', 'Modern Minimalist', 'Festive Traditional'],
  tasks: [
    { title: 'Book Venue', category: 'Venue', priority: 'high', suggestedDueDate: null },
    { title: 'Finalize Guest List', category: 'Guests', priority: 'high', suggestedDueDate: null },
    { title: 'Hire Caterer', category: 'Catering', priority: 'medium', suggestedDueDate: null },
    { title: 'Send Invitations', category: 'Invitations', priority: 'medium', suggestedDueDate: null },
    { title: 'Arrange Decor', category: 'Decor', priority: 'low', suggestedDueDate: null },
  ],
  budgetBreakdown: [
    { category: 'Venue', estimatedAmount: 0.30 * budget, currency },
    { category: 'Catering', estimatedAmount: 0.35 * budget, currency },
    { category: 'Decor', estimatedAmount: 0.15 * budget, currency },
    { category: 'Photography', estimatedAmount: 0.10 * budget, currency },
    { category: 'Miscellaneous', estimatedAmount: 0.10 * budget, currency },
  ],
  milestones: [],
  recommendations: ['Book your venue at least 6 months in advance.'],
};
```

Budget allocations are computed as percentages of the user's stated budget, making the fallback contextually relevant.

---

## 7. AI Mentor — Prompt Design

### System Prompt Philosophy
The AI Mentor is given a **rich context injection** at the start of every conversation:

```
You are CelebrAI — an expert event planning assistant.
You are helping plan: {eventName} ({eventType}) on {eventDate} in {location}.
Guest count: {guestCount}. Budget: {currency}{budget}.
Theme: {theme}. Requirements: {requirements}.

Current progress:
- Tasks completed: {tasksDone}/{tasksTotal}
- Budget spent: {spent}/{totalBudget}

Respond in friendly, concise language. Only answer questions relevant to
this specific event. Do not invent vendor names, prices, or dates unless
explicitly asked to suggest options. Always remind the user to verify
quotes independently.
```

### Hallucination Prevention
- **Grounding**: All factual context (budget, dates, guest count) is injected from Firestore — the model cannot hallucinate numbers the user already provided.
- **Disclaimer instruction**: The prompt explicitly tells the model to recommend verification for any vendor or price suggestion.
- **Response validation**: The `validateAIPlan()` function in `src/services/ai/groq.ts` type-checks and sanitizes the model's JSON output before it reaches the UI.

### Conversation Persistence
- Each chat message is saved to the `conversations/{conversationId}` Firestore collection.
- On page reload, the last N messages are loaded to restore context.
- The full history is sent in every API call as the `messages` array, giving the model full conversation memory within Groq's context window.

---

## 8. Structured Output

Plan generation uses **JSON mode** (`response_format: { type: 'json_object' }`) to ensure the model always returns parseable JSON. If parsing fails, the client falls back to the deterministic plan (§6).

```javascript
const completion = await groq.chat.completions.create({
  model,
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
  temperature: 0.7,
  max_tokens: 4096,
});
```
