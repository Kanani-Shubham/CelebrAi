/**
 * CelebrAI — Firestore Document Converters & Domain Normalizers
 *
 * Provides pure, null-safe mapping functions to translate raw Firestore
 * document data into strongly-typed domain models. Ensures runtime defense
 * against malformed, partial, or legacy schema records.
 */

import type {
  EventItem,
  TaskItem,
  Expense,
  Guest,
  UserProfile,
  AppNotification,
  EventStatus,
  ExpenseStatus,
  TaskPriority,
  GuestRSVPStatus,
  NotificationType,
} from './domain';
import { validateAIPlan } from '../services/ai/groq';

/**
 * Safely extracts epoch milliseconds from a date string, number, or Firestore Timestamp.
 */
export function toMillis(val: unknown): number {
  if (!val) return 0;
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === 'object' && val !== null) {
    if ('toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      try {
        return (val as { toDate: () => Date }).toDate().getTime();
      } catch {
        return 0;
      }
    }
    if ('seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
      return (val as { seconds: number }).seconds * 1000;
    }
  }
  return 0;
}

/**
 * Normalizes an unknown timestamp/date into an ISO string or null.
 */
export function toIsoString(val: unknown): string | null {
  const ms = toMillis(val);
  if (ms <= 0) return null;
  return new Date(ms).toISOString();
}

/**
 * Converts a raw Firestore event document into a verified EventItem.
 */
export function fromFirestoreEvent(docId: string, data?: Record<string, unknown> | null): EventItem {
  const d = data || {};
  const rawStatus = String(d.status || 'active').toLowerCase();
  const status: EventStatus = rawStatus === 'past' ? 'past' : rawStatus === 'archived' ? 'archived' : 'active';

  const eventDate = String(d.eventDate || d.date || 'TBD');

  return {
    id: docId,
    eventName: String(d.eventName || 'Our Celebration'),
    eventType: String(d.eventType || 'Celebration'),
    eventDate,
    date: eventDate,
    location: String(d.location || 'India'),
    guestCount: Math.max(0, Number(d.guestCount) || 0),
    budget: Math.max(0, Number(d.budget) || 0),
    currency: String(d.currency || '₹'),
    theme: String(d.theme || 'Classic Elegance'),
    coverImage: String(d.coverImage || ''),
    tasksDone: Math.max(0, Number(d.tasksDone) || 0),
    tasksTotal: Math.max(0, Number(d.tasksTotal) || 0),
    status,
    daysLeft: Number(d.daysLeft) || 30,
    ownerId: d.ownerId ? String(d.ownerId) : undefined,
    createdBy: d.createdBy ? String(d.createdBy) : undefined,
    requirements: d.requirements ? String(d.requirements) : undefined,
    planSummary: d.planSummary ? String(d.planSummary) : undefined,
    themeSuggestions: Array.isArray(d.themeSuggestions)
      ? d.themeSuggestions.map(String)
      : undefined,
    savedPlan: d.savedPlan ? validateAIPlan(d.savedPlan) : null,
    milestones: Array.isArray(d.milestones)
      ? d.milestones.map((m: unknown) => {
          const item = (m && typeof m === 'object') ? m as Record<string, unknown> : {};
          return {
            title: String(item.title || 'Milestone'),
            targetDate: item.targetDate ? String(item.targetDate) : null,
            description: item.description ? String(item.description) : undefined,
          };
        })
      : undefined,
    archived: Boolean(d.archived),
    isPublic: Boolean(d.isPublic),
    collaborators: Array.isArray(d.collaborators) ? d.collaborators.map(String) : undefined,
    createdAt: (d.createdAt as EventItem['createdAt']) ?? undefined,
    updatedAt: (d.updatedAt as EventItem['updatedAt']) ?? undefined,
  };
}

/**
 * Converts a raw Firestore task document into a verified TaskItem.
 */
export function fromFirestoreTask(docId: string, data?: Record<string, unknown> | null): TaskItem {
  const d = data || {};
  const rawPriority = String(d.priority || 'Medium').trim();
  const priority: TaskPriority = (['High', 'Medium', 'Low', 'high', 'medium', 'low'].includes(rawPriority)
    ? rawPriority
    : 'Medium') as TaskPriority;

  return {
    id: docId,
    eventId: String(d.eventId || ''),
    title: String(d.title || 'Untitled Task'),
    dueDate: String(d.dueDate || 'TBD'),
    category: String(d.category || 'General'),
    priority,
    completed: Boolean(d.completed),
    assignedTo: Array.isArray(d.assignedTo) ? d.assignedTo.map(String) : undefined,
    notes: d.notes ? String(d.notes) : undefined,
    ownerId: d.ownerId ? String(d.ownerId) : undefined,
    createdBy: d.createdBy ? String(d.createdBy) : undefined,
    createdAt: (d.createdAt as TaskItem['createdAt']) ?? undefined,
    updatedAt: (d.updatedAt as TaskItem['updatedAt']) ?? undefined,
  };
}

/**
 * Converts a raw Firestore expense document into a verified Expense.
 */
export function fromFirestoreExpense(docId: string, data?: Record<string, unknown> | null): Expense {
  const d = data || {};
  const rawStatus = String(d.status || 'Pending').trim().toLowerCase();
  const status: ExpenseStatus = rawStatus === 'paid' ? 'Paid' : rawStatus === 'overdue' ? 'Overdue' : 'Pending';

  return {
    id: docId,
    eventId: String(d.eventId || ''),
    title: String(d.title || 'Expense Item'),
    category: String(d.category || 'General'),
    date: d.date ? String(d.date) : undefined,
    amount: Math.max(0, Number(d.amount) || 0),
    status,
    vendorName: String(d.vendorName || 'Vendor'),
    vendorImage: d.vendorImage ? String(d.vendorImage) : undefined,
    notes: d.notes ? String(d.notes) : undefined,
    ownerId: d.ownerId ? String(d.ownerId) : undefined,
    createdBy: d.createdBy ? String(d.createdBy) : undefined,
    createdAt: (d.createdAt as Expense['createdAt']) ?? undefined,
    updatedAt: (d.updatedAt as Expense['updatedAt']) ?? undefined,
  };
}

/**
 * Converts a raw Firestore guest document into a verified Guest.
 */
export function fromFirestoreGuest(docId: string, data?: Record<string, unknown> | null): Guest {
  const d = data || {};
  const rawStatus = String(d.status || 'Pending').trim();
  const status: GuestRSVPStatus = rawStatus === 'Accepted' ? 'Accepted' : rawStatus === 'Declined' ? 'Declined' : 'Pending';

  return {
    id: docId,
    eventId: String(d.eventId || ''),
    name: String(d.name || 'Guest'),
    partySize: Math.max(1, Number(d.partySize) || 1),
    dietary: String(d.dietary || 'None'),
    status,
    accessible: Boolean(d.accessible),
    avatar: d.avatar ? String(d.avatar) : undefined,
    table: d.table ? String(d.table) : undefined,
    email: d.email ? String(d.email) : undefined,
    phone: d.phone ? String(d.phone) : undefined,
    notes: d.notes ? String(d.notes) : undefined,
    ownerId: d.ownerId ? String(d.ownerId) : undefined,
    createdBy: d.createdBy ? String(d.createdBy) : undefined,
    createdAt: (d.createdAt as Guest['createdAt']) ?? undefined,
    updatedAt: (d.updatedAt as Guest['updatedAt']) ?? undefined,
  };
}

/**
 * Converts a raw Firestore user document into a verified UserProfile.
 */
export function fromFirestoreProfile(uid: string, data?: Record<string, unknown> | null): UserProfile {
  const d = data || {};
  return {
    uid,
    displayName: String(d.displayName || 'CelebrAI Host'),
    email: String(d.email || ''),
    photoURL: d.photoURL ? String(d.photoURL) : undefined,
    phone: d.phone ? String(d.phone) : undefined,
    role: (['admin', 'moderator', 'user'].includes(String(d.role)) ? d.role : 'user') as UserProfile['role'],
    subscription: String(d.subscription || 'free'),
    currency: String(d.currency || 'INR'),
    country: d.country ? String(d.country) : undefined,
    language: d.language ? String(d.language) : undefined,
    planningStyle: d.planningStyle ? String(d.planningStyle) : undefined,
    aiUsageToday: Number(d.aiUsageToday) || 0,
    aiUsageTotal: Number(d.aiUsageTotal) || 0,
    preferences: typeof d.preferences === 'object' && d.preferences !== null
      ? (d.preferences as UserProfile['preferences'])
      : undefined,
    createdAt: (d.createdAt as UserProfile['createdAt']) ?? undefined,
    updatedAt: (d.updatedAt as UserProfile['updatedAt']) ?? undefined,
  };
}

/**
 * Converts a raw Firestore notification document into a verified AppNotification.
 */
export function fromFirestoreNotification(docId: string, data?: Record<string, unknown> | null): AppNotification {
  const d = data || {};
  const validTypes: NotificationType[] = ['task', 'rsvp', 'vendor', 'budget', 'ai', 'system'];
  const rawType = String(d.type || 'system').toLowerCase();
  const type: NotificationType = (validTypes.includes(rawType as NotificationType) ? rawType : 'system') as NotificationType;

  return {
    id: docId,
    type,
    title: String(d.title || 'Notification'),
    desc: String(d.desc || ''),
    time: String(d.time || 'Just now'),
    unread: typeof d.unread === 'boolean' ? d.unread : true,
    userId: d.userId ? String(d.userId) : undefined,
    eventId: d.eventId ? String(d.eventId) : undefined,
    createdAt: (d.createdAt as AppNotification['createdAt']) ?? undefined,
  };
}
