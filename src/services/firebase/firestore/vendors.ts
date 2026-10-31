import { where } from 'firebase/firestore';
import { createDoc, updateDocById, deleteDocById, queryCollection, toMillis } from './base';

export async function getSavedVendors<T = Record<string, unknown>>(eventId: string): Promise<T[]> {
  const docs = await queryCollection('saved_vendors', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)) as unknown as T[];
}

export async function saveVendor(eventId: string, data: Record<string, unknown>) {
  return createDoc('saved_vendors', {
    ...data,
    eventId,
  });
}

export async function updateVendor(vendorId: string, data: Record<string, unknown>) {
  return updateDocById('saved_vendors', vendorId, data);
}

export async function deleteVendor(vendorId: string) {
  return deleteDocById('saved_vendors', vendorId);
}
