import { where } from 'firebase/firestore';
import { createDoc, updateDocById, deleteDocById, queryCollection, toMillis } from './base';
import { fromFirestoreGuest, type Guest } from '../../../types';

export async function getEventGuests(eventId: string): Promise<Guest[]> {
  const docs = await queryCollection('guests', [
    where('eventId', '==', eventId),
  ]);
  const sorted = docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  return sorted.map((d) => fromFirestoreGuest(d.id, d));
}

export async function createGuest(eventId: string, data: Record<string, unknown>): Promise<string> {
  return createDoc('guests', {
    ...data,
    eventId,
    status: data.status || 'Pending',
    partySize: Number(data.partySize) || 1,
    dietary: data.dietary || 'None',
  });
}

export async function updateGuest(guestId: string, data: Record<string, unknown>): Promise<void> {
  return updateDocById('guests', guestId, data);
}

export async function deleteGuest(guestId: string): Promise<void> {
  return deleteDocById('guests', guestId);
}
