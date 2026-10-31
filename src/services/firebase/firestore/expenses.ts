import { where } from 'firebase/firestore';
import { createDoc, updateDocById, deleteDocById, queryCollection, toMillis } from './base';

export async function getEventExpenses<T = Record<string, unknown>>(eventId: string): Promise<T[]> {
  const docs = await queryCollection('expenses', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)) as unknown as T[];
}

export async function createExpense(eventId: string, data: Record<string, unknown>) {
  return createDoc('expenses', {
    ...data,
    eventId,
  });
}

export async function updateExpense(expenseId: string, data: Record<string, unknown>) {
  return updateDocById('expenses', expenseId, data);
}

export async function deleteExpense(expenseId: string) {
  return deleteDocById('expenses', expenseId);
}
