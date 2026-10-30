import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { auth } from './config';
import type { AIPlanResult } from '../ai/groq';

export { serverTimestamp, Timestamp };

// ---- Generic helpers ----

export async function createDoc(
  col: string,
  data: Record<string, unknown>
): Promise<string> {
  const ref = await addDoc(collection(db, col), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setDocById(
  col: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await setDoc(doc(db, col, id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateDocById(
  col: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await updateDoc(doc(db, col, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocById(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db, col, id));
}

export async function getDocById(col: string, id: string) {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

export async function queryCollection(
  col: string,
  constraints: QueryConstraint[]
): Promise<(DocumentData & { id: string })[]> {
  const q = query(collection(db, col), ...constraints);
  const snap = await getDocs(q);
  // Important: ensure real Firestore doc ID `d.id` always overrides any internal data.id
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

// ---- Current user uid helper ----
function requireAuth(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User is not authenticated');
  return uid;
}

// ===========================================================
// EVENTS
// ===========================================================
function toMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof (val as { toMillis?: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (val instanceof Date) return val.getTime();
  const d = new Date(val as string | number).getTime();
  return isNaN(d) ? 0 : d;
}

export async function getUserEvents(uid: string) {
  const docs = await queryCollection('events', [
    where('ownerId', '==', uid),
  ]);
  return docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function createEvent(ownerId: string, data: Record<string, unknown>) {
  const ref = doc(collection(db, 'events'));
  // Strip any client-generated ID so Firestore doc ID is canonical
  const { id: _ignore, ...cleanData } = data;
  await setDoc(ref, {
    ...cleanData,
    id: ref.id,
    ownerId,
    createdBy: ownerId,
    archived: false,
    isPublic: false,
    collaborators: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(eventId: string, data: Record<string, unknown>) {
  return updateDocById('events', eventId, data);
}

export async function deleteEvent(eventId: string) {
  // Batch delete: event + all its tasks, expenses, guests, vendors, conversations
  const batch = writeBatch(db);
  batch.delete(doc(db, 'events', eventId));

  const collections = ['tasks', 'expenses', 'guests', 'vendors', 'conversations'];
  for (const col of collections) {
    const snap = await getDocs(query(collection(db, col), where('eventId', '==', eventId)));
    snap.docs.forEach(d => batch.delete(d.ref));
  }

  await batch.commit();
}

export async function saveApprovedEventPlan(
  userId: string,
  eventData: Record<string, unknown>,
  plan: AIPlanResult
): Promise<string> {
  const batch = writeBatch(db);

  // 1. Resolve event reference: check if valid Firestore doc exists
  let eventRef;
  const existingId = eventData.id ? String(eventData.id) : null;
  if (existingId && !existingId.startsWith('evt-')) {
    eventRef = doc(db, 'events', existingId);
  } else {
    eventRef = doc(collection(db, 'events'));
  }
  const realEventId = eventRef.id;

  const totalCalculatedBudget = plan.budgetBreakdown.reduce(
    (sum, b) => sum + (Number(b.estimatedAmount) || 0),
    0
  );

  // 2. Set/merge event doc with approved plan
  const { id: _ignore, ...cleanEventData } = eventData;
  batch.set(
    eventRef,
    {
      ...cleanEventData,
      id: realEventId,
      ownerId: userId,
      createdBy: userId,
      eventName: eventData.eventName || 'Our Celebration',
      budget: totalCalculatedBudget > 0 ? totalCalculatedBudget : Number(eventData.budget) || 0,
      planSummary: plan.eventSummary,
      themeSuggestions: plan.themeSuggestions,
      milestones: plan.milestones,
      tasksTotal: plan.tasks.length,
      tasksDone: 0,
      savedPlan: plan,
      status: 'active',
      archived: false,
      isPublic: false,
      updatedAt: serverTimestamp(),
      createdAt: eventData.createdAt ? eventData.createdAt : serverTimestamp(),
    },
    { merge: true }
  );

  // 3. Batch insert tasks
  for (const t of plan.tasks) {
    const taskRef = doc(collection(db, 'tasks'));
    batch.set(taskRef, {
      id: taskRef.id,
      eventId: realEventId,
      ownerId: userId,
      createdBy: userId,
      title: t.title,
      category: t.category,
      priority: t.priority.toLowerCase() === 'high' ? 'High' : t.priority.toLowerCase() === 'low' ? 'Low' : 'Medium',
      dueDate: t.suggestedDueDate || '',
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 4. Batch insert budget allocations into expenses
  for (const b of plan.budgetBreakdown) {
    const expenseRef = doc(collection(db, 'expenses'));
    batch.set(expenseRef, {
      id: expenseRef.id,
      eventId: realEventId,
      ownerId: userId,
      createdBy: userId,
      vendorName: 'Allocated Budget',
      title: b.category,
      category: b.category,
      amount: Number(b.estimatedAmount) || 0,
      status: 'Pending',
      notes: b.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 5. Commit atomic batch
  await batch.commit();
  return realEventId;
}

// ===========================================================
// TASKS
// ===========================================================
export async function getEventTasks(eventId: string) {
  if (!eventId || eventId.startsWith('evt-')) return [];
  const docs = await queryCollection('tasks', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
}

export async function createTask(eventId: string, data: Record<string, unknown>) {
  const uid = requireAuth();
  return createDoc('tasks', {
    ...data,
    eventId,
    ownerId: uid,
    createdBy: uid,
    completed: false,
  });
}

export async function updateTask(taskId: string, data: Record<string, unknown>) {
  return updateDocById('tasks', taskId, data);
}

export async function deleteTask(taskId: string) {
  return deleteDocById('tasks', taskId);
}

// ===========================================================
// EXPENSES
// ===========================================================
export async function getEventExpenses(eventId: string) {
  if (!eventId || eventId.startsWith('evt-')) return [];
  const docs = await queryCollection('expenses', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function createExpense(eventId: string, data: Record<string, unknown>) {
  const uid = requireAuth();
  return createDoc('expenses', {
    ...data,
    eventId,
    ownerId: uid,
    createdBy: uid,
    amount: Number(data.amount) || 0,
  });
}

export async function updateExpense(expenseId: string, data: Record<string, unknown>) {
  return updateDocById('expenses', expenseId, data);
}

export async function deleteExpense(expenseId: string) {
  return deleteDocById('expenses', expenseId);
}

// ===========================================================
// GUESTS
// ===========================================================
export async function getEventGuests(eventId: string) {
  if (!eventId || eventId.startsWith('evt-')) return [];
  const docs = await queryCollection('guests', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

export async function createGuest(eventId: string, data: Record<string, unknown>) {
  const uid = requireAuth();
  return createDoc('guests', {
    ...data,
    eventId,
    ownerId: uid,
    createdBy: uid,
    status: data.status || 'Pending',
    partySize: Number(data.partySize) || 1,
  });
}

export async function updateGuest(guestId: string, data: Record<string, unknown>) {
  return updateDocById('guests', guestId, data);
}

export async function deleteGuest(guestId: string) {
  return deleteDocById('guests', guestId);
}

// ===========================================================
// VENDORS (saved by users)
// ===========================================================
export async function getSavedVendors(eventId: string) {
  if (!eventId || eventId.startsWith('evt-')) return [];
  const docs = await queryCollection('vendors', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function saveVendor(eventId: string, data: Record<string, unknown>) {
  const uid = requireAuth();
  return createDoc('vendors', { ...data, eventId, ownerId: uid, createdBy: uid });
}

export async function updateVendor(vendorId: string, data: Record<string, unknown>) {
  return updateDocById('vendors', vendorId, data);
}

export async function deleteVendor(vendorId: string) {
  return deleteDocById('vendors', vendorId);
}

// ===========================================================
// AI CONVERSATIONS & CHAT HISTORY
// ===========================================================

export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  eventId?: string | null;
  eventName?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
  lastMessagePreview?: string;
}

export interface ConversationMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: unknown;
  status?: string;
}

/**
 * Loads all conversation threads for an authenticated user,
 * ordered by updatedAt descending (newest first).
 */
export async function getUserConversations(userId: string): Promise<ConversationRecord[]> {
  if (!userId) return [];
  try {
    const docs = await queryCollection('conversations', [
      where('userId', '==', userId),
    ]);
    // Filter only thread documents (ignore raw legacy flat message docs if any)
    const threads = docs
      .filter((d) => d.title || !d.role)
      .map((d) => ({
        id: d.id,
        userId: String(d.userId || userId),
        title: String(d.title || 'New conversation'),
        eventId: d.eventId ? String(d.eventId) : null,
        eventName: d.eventName ? String(d.eventName) : null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt || d.createdAt,
        lastMessagePreview: d.lastMessagePreview ? String(d.lastMessagePreview) : '',
      })) as ConversationRecord[];

    return threads.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
  } catch (err) {
    console.warn('[firestore.ts] Error in getUserConversations:', err);
    return [];
  }
}

/**
 * Creates a new conversation thread in Firestore atomically.
 * If initialMessage is provided, persists the first user message in the subcollection
 * within the same atomic batch write, eliminating race conditions.
 */
export async function createConversation(data: {
  userId: string;
  title: string;
  eventId?: string | null;
  eventName?: string | null;
  initialMessage?: string;
}): Promise<string> {
  const convRef = doc(collection(db, 'conversations'));
  const batch = writeBatch(db);

  batch.set(convRef, {
    userId: data.userId,
    createdBy: data.userId,
    title: data.title || 'New conversation',
    eventId: data.eventId || null,
    eventName: data.eventName || null,
    lastMessagePreview: data.initialMessage ? data.initialMessage.slice(0, 100) : '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (data.initialMessage) {
    const msgRef = doc(collection(db, 'conversations', convRef.id, 'messages'));
    batch.set(msgRef, {
      role: 'user',
      content: data.initialMessage,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return convRef.id;
}

/**
 * Appends a message to a conversation's 'messages' subcollection
 * and updates the conversation's updatedAt timestamp and preview.
 */
export async function addMessageToConversation(
  convId: string,
  message: { role: 'user' | 'assistant'; content: string; titleUpdate?: string }
): Promise<string> {
  // 1. Add message to subcollection
  const msgCol = collection(db, 'conversations', convId, 'messages');
  const msgRef = await addDoc(msgCol, {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp(),
  });

  // 2. Update parent conversation metadata
  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    lastMessagePreview: message.content.slice(0, 100),
  };
  if (message.titleUpdate) {
    updates.title = message.titleUpdate.slice(0, 50);
  }

  try {
    await updateDoc(doc(db, 'conversations', convId), updates);
  } catch (err) {
    console.warn('[firestore.ts] Error updating conversation header:', err);
  }

  return msgRef.id;
}

/**
 * Retrieves all messages in a conversation in chronological order.
 */
export async function getConversationMessages(
  convId: string
): Promise<ConversationMessageRecord[]> {
  if (!convId) return [];
  try {
    const msgCol = collection(db, 'conversations', convId, 'messages');
    const snap = await getDocs(msgCol);
    const messages = snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as ConversationMessageRecord[];

    return messages.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
  } catch (err) {
    console.warn('[firestore.ts] Error fetching conversation messages:', err);
    return [];
  }
}

/**
 * Deletes a conversation thread and its messages.
 */
export async function deleteConversation(convId: string): Promise<void> {
  if (!convId) return;
  try {
    // Delete subcollection messages
    const msgCol = collection(db, 'conversations', convId, 'messages');
    const snap = await getDocs(msgCol);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'conversations', convId));
    await batch.commit();
  } catch (err) {
    console.warn('[firestore.ts] Error deleting conversation:', err);
    // Fallback to single doc delete
    await deleteDoc(doc(db, 'conversations', convId));
  }
}

// Backward-compatibility wrappers
export async function getEventConversations(eventId: string) {
  if (!eventId || eventId.startsWith('evt-')) return [];
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const docs = await queryCollection('conversations', [
    where('eventId', '==', eventId),
    where('userId', '==', uid),
  ]);
  return docs.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
}

export async function saveConversationMessage(
  eventId: string,
  userId: string,
  message: { role: 'user' | 'assistant'; content: string }
) {
  return createDoc('conversations', {
    eventId,
    userId,
    createdBy: userId,
    role: message.role,
    content: message.content,
  });
}

// ===========================================================
// NOTIFICATIONS
// ===========================================================
export async function getUserNotifications(uid: string) {
  const docs = await queryCollection('notifications', [
    where('userId', '==', uid),
  ]);
  return docs
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .slice(0, 50);
}

export async function markNotificationRead(notifId: string) {
  return updateDocById('notifications', notifId, { read: true });
}

// ===========================================================
// RE-EXPORTS
// ===========================================================
export { query, where, orderBy, limit, collection };
