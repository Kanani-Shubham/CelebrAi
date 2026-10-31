/**
 * CelebrAI — Central TypeScript Domain Models & Converters Facade
 *
 * Single source of truth for all domain interfaces, strict unions,
 * and data converters across the application.
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
// Domain Types & Unions
// ---------------------------------------------------------------------------
export type {
  SubscriptionTier,
  UserRole,
  SupportedCurrency,
  EventCategory,
  EventStatus,
  ExpenseStatus,
  TaskPriority,
  GuestDietary,
  GuestRSVPStatus,
  NotificationType,
  FirestoreTimestampOrISO,
  UserProfile,
  TimelineMilestone,
  EventItem,
  Guest,
  BudgetCategory,
  Expense,
  TaskItem,
  ConversationRecord,
  ConversationMessageRecord,
  AppNotification,
  RSVPSubmission,
} from './domain';

// ---------------------------------------------------------------------------
// Document Converters & Normalizers
// ---------------------------------------------------------------------------
export {
  toMillis,
  toIsoString,
  fromFirestoreEvent,
  fromFirestoreTask,
  fromFirestoreExpense,
  fromFirestoreGuest,
  fromFirestoreProfile,
  fromFirestoreNotification,
} from './converters';
