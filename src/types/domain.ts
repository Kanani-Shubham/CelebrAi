/**
 * CelebrAI — Core Domain Models & Strict Value Unions
 *
 * Provides strongly-typed interfaces for all central entities
 * representing verified domain state across Firebase Firestore and React components.
 */

import type { AIPlanResult } from '../services/ai/groq';

// ---------------------------------------------------------------------------
// Strict Value Enums / Unions
// ---------------------------------------------------------------------------

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type UserRole = 'admin' | 'moderator' | 'user';

export type SupportedCurrency =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'CAD'
  | 'AUD'
  | '₹'
  | '$'
  | '€'
  | '£'
  | (string & {});

export type EventCategory =
  | 'Wedding'
  | 'Birthday'
  | 'Anniversary'
  | 'Corporate'
  | 'Baby Shower'
  | 'Engagement'
  | 'Graduation'
  | 'Dinner Party'
  | 'Festival'
  | 'College Event'
  | 'Community'
  | 'Custom'
  | (string & {});

export type EventStatus = 'active' | 'past' | 'archived';

export type ExpenseStatus = 'Paid' | 'Pending' | 'Overdue';

export type TaskPriority = 'High' | 'Medium' | 'Low' | 'high' | 'medium' | 'low';

export type GuestDietary =
  | 'Vegetarian'
  | 'Vegan'
  | 'Non-vegetarian'
  | 'Halal'
  | 'Gluten Free'
  | 'None'
  | (string & {});

export type GuestRSVPStatus = 'Accepted' | 'Pending' | 'Declined';

export type NotificationType = 'task' | 'rsvp' | 'vendor' | 'budget' | 'ai' | 'system';

export type FirestoreTimestampOrISO =
  | string
  | number
  | Date
  | { toDate?: () => Date; seconds?: number; nanoseconds?: number }
  | null
  | undefined;

// ---------------------------------------------------------------------------
// Domain Models
// ---------------------------------------------------------------------------

/** Extended user profile stored in Firestore `users/{uid}`. */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  role?: UserRole;
  subscription: SubscriptionTier | string;
  currency: SupportedCurrency;
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
  createdAt?: FirestoreTimestampOrISO;
  updatedAt?: FirestoreTimestampOrISO;
}

/** A milestone or key target date on the celebration timeline. */
export interface TimelineMilestone {
  title: string;
  targetDate?: string | null;
  description?: string;
}

/** Central Event entity representing an active or archived celebration. */
export interface EventItem {
  id: string;
  eventName: string;
  eventType: EventCategory;
  /** Primary human-readable date or ISO YYYY-MM-DD. */
  eventDate: string;
  /** Legacy alias for compatibility with early components. */
  date?: string;
  location: string;
  guestCount: number;
  budget: number;
  currency: SupportedCurrency;
  theme: string;
  coverImage: string;
  tasksDone: number;
  tasksTotal: number;
  status: EventStatus;
  daysLeft: number;
  ownerId?: string;
  createdBy?: string;
  requirements?: string;
  planSummary?: string;
  themeSuggestions?: string[];
  savedPlan?: AIPlanResult | null;
  milestones?: TimelineMilestone[];
  archived?: boolean;
  isPublic?: boolean;
  collaborators?: string[];
  createdAt?: FirestoreTimestampOrISO;
  updatedAt?: FirestoreTimestampOrISO;
}

/** An invited or registered event guest. */
export interface Guest {
  id: string;
  eventId: string;
  name: string;
  partySize: number;
  dietary: GuestDietary;
  status: GuestRSVPStatus;
  accessible?: boolean;
  avatar?: string;
  table?: string;
  email?: string;
  phone?: string;
  notes?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: FirestoreTimestampOrISO;
  updatedAt?: FirestoreTimestampOrISO;
}

/** High-level planned budget allocation category (e.g. Venue, Catering). */
export interface BudgetCategory {
  id?: string;
  eventId?: string;
  category: string;
  estimatedAmount: number;
  actualAmount?: number;
  currency: SupportedCurrency;
  notes?: string;
  ownerId?: string;
  createdAt?: FirestoreTimestampOrISO;
  updatedAt?: FirestoreTimestampOrISO;
}

/** An expense or vendor invoice item. */
export interface Expense {
  id: string;
  eventId: string;
  title: string;
  category: string;
  date?: string;
  amount: number;
  status: ExpenseStatus;
  vendorName: string;
  vendorImage?: string;
  notes?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: FirestoreTimestampOrISO;
  updatedAt?: FirestoreTimestampOrISO;
}

/** A planning task / checklist item. */
export interface TaskItem {
  id: string;
  eventId: string;
  title: string;
  dueDate?: string | null;
  category: string;
  priority: TaskPriority;
  completed: boolean;
  assignedTo?: string[];
  notes?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: FirestoreTimestampOrISO;
  updatedAt?: FirestoreTimestampOrISO;
}

/** Persistent AI conversation thread in Firestore. */
export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  eventId?: string;
  createdAt?: FirestoreTimestampOrISO;
  updatedAt?: FirestoreTimestampOrISO;
  lastMessagePreview?: string;
}

/** A single chat message within an AI conversation. */
export interface ConversationMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: FirestoreTimestampOrISO;
}

/** An in-app alert or notification. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  userId?: string;
  eventId?: string;
  createdAt?: FirestoreTimestampOrISO;
}

/** Public RSVP form submission. */
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
  createdAt?: FirestoreTimestampOrISO;
}
