/**
 * CelebrAI — Cloud Firestore Service Facade
 * Provides a unified public API surface delegating to domain-specific submodules:
 * - base: Core CRUD operations, queries, and server timestamp helpers
 * - events: Event lifecycle, plan saving, and user event aggregations
 * - tasks: Task checklists, due date tracking, and completions
 * - expenses: Itemized financial tracking and budget records
 * - guests: Guest lists, RSVP status, and party headcounts
 * - vendors: Saved vendors and partner bookmarks
 * - conversations: AI Mentor threads and chat history persistence
 * - notifications: Real-time user alerts and task audit notifications
 */

export * from './firestore/base';
export * from './firestore/events';
export * from './firestore/tasks';
export * from './firestore/expenses';
export * from './firestore/guests';
export * from './firestore/vendors';
export * from './firestore/conversations';
export * from './firestore/notifications';
export type { ConversationRecord, ConversationMessageRecord } from '../../types';
