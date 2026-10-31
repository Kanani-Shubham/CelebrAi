import {
  collection,
  doc,
  writeBatch,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config';
import { queryCollection, updateDocById, deleteDocById, toMillis } from './base';
import { fromFirestoreEvent, type EventItem } from '../../../types';
import type { AIPlanResult } from '../../ai/groq';

export async function getUserEvents(uid: string): Promise<EventItem[]> {
  const docs = await queryCollection('events', [
    where('ownerId', '==', uid),
  ]);
  const sorted = docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  return sorted.map((d) => fromFirestoreEvent(d.id, d));
}

export async function createEvent(ownerId: string, data: Record<string, unknown> | Partial<EventItem>) {
  const eventCol = collection(db, 'events');
  const docRef = doc(eventCol);
  const now = serverTimestamp();

  await writeBatch(db)
    .set(docRef, {
      ...data,
      id: docRef.id,
      ownerId,
      createdAt: now,
      updatedAt: now,
    })
    .commit();

  return docRef.id;
}

export async function updateEvent(eventId: string, data: Record<string, unknown>) {
  return updateDocById('events', eventId, data);
}

export async function deleteEvent(eventId: string) {
  return deleteDocById('events', eventId);
}

export async function saveApprovedEventPlan(
  userId: string,
  eventData: Record<string, unknown> | EventItem,
  plan: AIPlanResult
): Promise<string> {
  const batch = writeBatch(db);

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
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  const defaultDate = eventData.eventDate ? String(eventData.eventDate) : null;
  plan.tasks.forEach((task) => {
    const taskDoc = doc(collection(db, 'tasks'));
    batch.set(taskDoc, {
      id: taskDoc.id,
      eventId: realEventId,
      ownerId: userId,
      createdBy: userId,
      title: task.title,
      category: task.category || 'Other',
      priority: task.priority || 'medium',
      dueDate: task.suggestedDueDate || defaultDate,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  plan.budgetBreakdown.forEach((item) => {
    const budgetDoc = doc(collection(db, 'budget'));
    batch.set(budgetDoc, {
      id: budgetDoc.id,
      eventId: realEventId,
      ownerId: userId,
      createdBy: userId,
      category: item.category,
      estimatedAmount: Number(item.estimatedAmount) || 0,
      actualAmount: 0,
      currency: item.currency || (eventData.currency as string) || '₹',
      notes: item.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  if (auth.currentUser) {
    const notifDoc = doc(collection(db, 'notifications'));
    batch.set(notifDoc, {
      id: notifDoc.id,
      userId,
      eventId: realEventId,
      type: 'ai',
      title: 'Plan Approved',
      desc: `Your master plan for "${eventData.eventName || 'Our Celebration'}" was generated and saved with ${plan.tasks.length} tasks.`,
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();

  return realEventId;
}
