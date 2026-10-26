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
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function queryCollection(
  col: string,
  constraints: QueryConstraint[]
): Promise<(DocumentData & { id: string })[]> {
  const q = query(collection(db, col), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  return createDoc('events', {
    ...data,
    ownerId,
    archived: false,
    isPublic: false,
    collaborators: [],
  });
}

export async function updateEvent(eventId: string, data: Record<string, unknown>) {
  return updateDocById('events', eventId, data);
}

export async function deleteEvent(eventId: string) {
  // Batch delete: event + all its tasks, expenses, guests, vendors
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

  // 1. Resolve event reference
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
  batch.set(
    eventRef,
    {
      ...eventData,
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
  const docs = await queryCollection('vendors', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function saveVendor(eventId: string, data: Record<string, unknown>) {
  return createDoc('vendors', { ...data, eventId });
}

export async function updateVendor(vendorId: string, data: Record<string, unknown>) {
  return updateDocById('vendors', vendorId, data);
}

export async function deleteVendor(vendorId: string) {
  return deleteDocById('vendors', vendorId);
}

// ===========================================================
// AI CONVERSATIONS
// ===========================================================
export async function getEventConversations(eventId: string) {
  const docs = await queryCollection('conversations', [
    where('eventId', '==', eventId),
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
