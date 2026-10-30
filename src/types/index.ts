/**
 * CelebrAI — Central TypeScript type definitions
 *
 * Single source of truth for all core domain interfaces.
 * Importing from here keeps the rest of the codebase consistent
 * and avoids scattered inline type declarations.
 */

// ---------------------------------------------------------------------------
// Re-exports from AI service (single ownership, no duplication)
// ---------------------------------------------------------------------------
export type {
  AIPlanResult,
  AITask,
  AIBudgetItem,
  AIMilestone,
  AIPlanRequest,
  AIChatMessage,
} from '../services/ai/groq';

// ---------------------------------------------------------------------------
// User / Auth
// ---------------------------------------------------------------------------

/** Extended user profile stored in Firestore `users/{uid}`. */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  /** 'free' | 'pro' | 'enterprise' */
  subscription: string;
  /** ISO 4217 currency code, e.g. 'INR', 'USD' */
  currency: string;
  country?: string;
  language?: string;
  planningStyle?: string;
  aiUsageToday?: number;
  aiUsageTotal?: number;
  preferences?: {
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
    defaultCurrency?: string;
  };
  createdAt?: unknown; // Firestore Timestamp | string | null
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Mirrors the shape of `EventData` from `src/data/mockData.ts`.
 *  EventContext re-exports `Event = EventData`; keep these in sync. */
export interface EventItem {
  id: string;
  eventName: string;
  eventType: string;
  /** Human-readable date string or ISO YYYY-MM-DD. */
  eventDate: string;
  /** Alias used in some legacy paths. Prefer `eventDate`. */
  date?: string;
  location: string;
  guestCount: number;
  budget: number;
  currency: string;
  theme: string;
  coverImage: string;
  tasksDone: number;
  tasksTotal: number;
  status: 'active' | 'past' | 'archived';
  daysLeft: number;
  ownerId?: string;
  createdBy?: string;
  requirements?: string;
  planSummary?: string;
  themeSuggestions?: string[];
  savedPlan?: unknown;
  milestones?: TimelineMilestone[];
  archived?: boolean;
  isPublic?: boolean;
  collaborators?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  partySize: number;
  dietary: 'Vegetarian' | 'Vegan' | 'Non-vegetarian' | 'Halal' | 'Gluten Free' | 'None';
  status: 'Accepted' | 'Pending' | 'Declined';
  accessible?: boolean;
  avatar?: string;
  table?: string;
  email?: string;
  phone?: string;
  notes?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/** A high-level budget allocation category (e.g. "Venue", "Catering"). */
export interface BudgetCategory {
  id?: string;
  eventId?: string;
  category: string;
  estimatedAmount: number;
  actualAmount?: number;
  currency: string;
  notes?: string;
  ownerId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

/** A single expense / payment record stored in Firestore `expenses` collection. */
export interface Expense {
  id: string;
  eventId: string;
  title: string;
  category: string;
  date?: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  vendorName: string;
  vendorImage?: string;
  notes?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/** A planning task / checklist item stored in Firestore `tasks` collection. */
export interface TaskItem {
  id: string;
  eventId: string;
  title: string;
  dueDate: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  assignedTo?: string[];
  notes?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// Timeline / Milestones
// ---------------------------------------------------------------------------

/** A milestone or key date on the event timeline. */
export interface TimelineMilestone {
  title: string;
  targetDate?: string | null;
  description?: string;
}

// ---------------------------------------------------------------------------
// AI Conversations & Messages
// ---------------------------------------------------------------------------

export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  eventId?: string;
  createdAt: unknown;
  updatedAt: unknown;
  lastMessagePreview?: string;
}

export interface ConversationMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: unknown;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  type: 'task' | 'rsvp' | 'vendor' | 'budget' | 'ai' | 'system';
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  userId?: string;
  eventId?: string;
  createdAt?: unknown;
}

// ---------------------------------------------------------------------------
// Public RSVP Submissions
// ---------------------------------------------------------------------------

export interface RSVPSubmission {
  id?: string;
  eventId: string;
  name: string;
  additionalGuest?: string | null;
  attending: 'yes' | 'maybe' | 'no';
  partySize: number;
  email?: string | null;
  phone?: string | null;
  dietary?: string;
  notes?: string | null;
  createdAt?: unknown;
}
