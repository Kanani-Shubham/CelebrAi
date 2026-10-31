import { where } from 'firebase/firestore';
import { createDoc, updateDocById, deleteDocById, queryCollection, toMillis } from './base';

export async function getEventTasks<T = Record<string, unknown>>(eventId: string): Promise<T[]> {
  const docs = await queryCollection('tasks', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)) as unknown as T[];
}

export async function createTask(eventId: string, data: Record<string, unknown>) {
  return createDoc('tasks', {
    ...data,
    eventId,
    completed: false,
  });
}

export async function updateTask(taskId: string, data: Record<string, unknown>) {
  return updateDocById('tasks', taskId, data);
}

export async function deleteTask(taskId: string) {
  return deleteDocById('tasks', taskId);
}
