import { where } from 'firebase/firestore';
import { createDoc, updateDocById, deleteDocById, queryCollection, toMillis } from './base';

export async function getEventGuests<T = Record<string, unknown>>(eventId: string): Promise<T[]> {
  const docs = await queryCollection('guests', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)) as unknown as T[];
}

export async function createGuest(eventId: string, data: Record<string, unknown>) {
  return createDoc('guests', {
    ...data,
    eventId,
    status: data.status || 'Pending',
    partySize: Number(data.partySize) || 1,
    dietary: data.dietary || 'None',
  });
}

export async function updateGuest(guestId: string, data: Record<string, unknown>) {
  return updateDocById('guests', guestId, data);
}

export async function deleteGuest(guestId: string) {
  return deleteDocById('guests', guestId);
}
