import type { VendorItem } from '../../../data/seed';
import { where } from 'firebase/firestore';
import { createDoc, updateDocById, deleteDocById, queryCollection, toMillis } from './base';

export async function getSavedVendors(eventId: string): Promise<VendorItem[]> {
  const docs = await queryCollection('saved_vendors', [
    where('eventId', '==', eventId),
  ]);
  const sorted = docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  return sorted.map(d => ({ id: d.id, name: String(d.name || 'Vendor'), category: (d.category as VendorItem['category']) || 'Venue', location: String(d.location || ''), priceStart: String(d.priceStart || '₹0'), rating: Number(d.rating) || 5, reviewsCount: Number(d.reviewsCount) || 0, image: String(d.image || ''), saved: true }));
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
