import { where } from 'firebase/firestore';
import { updateDocById, queryCollection, toMillis } from './base';

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
