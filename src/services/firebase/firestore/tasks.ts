import { where } from 'firebase/firestore';
import { createDoc, updateDocById, deleteDocById, queryCollection, toMillis } from './base';
import { fromFirestoreTask, type TaskItem } from '../../../types';

export async function getEventTasks(eventId: string): Promise<TaskItem[]> {
  const docs = await queryCollection('tasks', [
    where('eventId', '==', eventId),
  ]);
  const sorted = docs.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
  return sorted.map((d) => fromFirestoreTask(d.id, d));
}

export async function createTask(eventId: string, data: Record<string, unknown>): Promise<string> {
  return createDoc('tasks', {
    ...data,
    eventId,
    completed: false,
  });
}

export async function updateTask(taskId: string, data: Record<string, unknown>): Promise<void> {
  return updateDocById('tasks', taskId, data);
}

export async function deleteTask(taskId: string): Promise<void> {
  return deleteDocById('tasks', taskId);
}
