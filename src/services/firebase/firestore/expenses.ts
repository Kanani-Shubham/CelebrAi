import { where } from 'firebase/firestore';
import { createDoc, updateDocById, deleteDocById, queryCollection, toMillis } from './base';
import { fromFirestoreExpense, type Expense } from '../../../types';

export async function getEventExpenses(eventId: string): Promise<Expense[]> {
  const docs = await queryCollection('expenses', [
    where('eventId', '==', eventId),
  ]);
  const sorted = docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  return sorted.map((d) => fromFirestoreExpense(d.id, d));
}

export async function createExpense(eventId: string, data: Record<string, unknown>): Promise<string> {
  return createDoc('expenses', {
    ...data,
    eventId,
  });
}

export async function updateExpense(expenseId: string, data: Record<string, unknown>): Promise<void> {
  return updateDocById('expenses', expenseId, data);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  return deleteDocById('expenses', expenseId);
}
