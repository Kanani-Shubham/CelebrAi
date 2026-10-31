import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import { queryCollection, toMillis } from './base';
import { logger } from '../../../utils/logger';
import type { ConversationRecord, ConversationMessageRecord } from '../../../types';

export async function getUserConversations(userId: string): Promise<ConversationRecord[]> {
  if (!userId) return [];
  try {
    const rawDocs = await queryCollection('conversations', [
      where('userId', '==', userId),
    ]);
    const conversations = rawDocs.map((d) => ({
      ...d,
      id: d.id,
      userId: (d.userId as string) || userId,
      title: (d.title as string) || 'Conversation',
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      lastMessagePreview: d.lastMessagePreview as string | undefined,
    })) as ConversationRecord[];

    return conversations.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
  } catch (err) {
    logger.warn('[firestore.ts] Error fetching conversations:', err);
    return [];
  }
}

export async function createConversation(data: {
  userId: string;
  title: string;
  eventId?: string | null;
  eventName?: string | null;
  initialMessage?: string;
  [key: string]: unknown;
}): Promise<string> {
  const convCol = collection(db, 'conversations');
  const now = serverTimestamp();
  const ref = await addDoc(convCol, {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function addMessageToConversation(
  convId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
  }
): Promise<string> {
  if (!convId) throw new Error('Missing conversation ID');
  const msgCol = collection(db, 'conversations', convId, 'messages');
  const now = serverTimestamp();

  const ref = await addDoc(msgCol, {
    ...message,
    createdAt: now,
  });

  try {
    const preview = message.content.slice(0, 80).replace(/\n/g, ' ');
    await updateDoc(doc(db, 'conversations', convId), {
      updatedAt: now,
      lastMessagePreview: preview,
    });
  } catch (err) {
    logger.warn('[firestore.ts] Error updating conversation timestamp:', err);
  }

  return ref.id;
}

export async function getConversationMessages(
  convId: string
): Promise<ConversationMessageRecord[]> {
  if (!convId) return [];
  try {
    const msgCol = collection(db, 'conversations', convId, 'messages');
    const snap = await getDocs(msgCol);
    const messages = snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as ConversationMessageRecord[];

    return messages.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
  } catch (err) {
    logger.warn('[firestore.ts] Error fetching conversation messages:', err);
    return [];
  }
}

export async function deleteConversation(convId: string): Promise<void> {
  if (!convId) return;
  try {
    const msgCol = collection(db, 'conversations', convId, 'messages');
    const snap = await getDocs(msgCol);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'conversations', convId));
    await batch.commit();
  } catch (err) {
    logger.warn('[firestore.ts] Error deleting conversation:', err);
    await deleteDoc(doc(db, 'conversations', convId));
  }
}

export async function getEventConversations(eventId: string) {
  const docs = await queryCollection('conversations', [
    where('eventId', '==', eventId),
  ]);
  return docs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function saveConversationMessage(
  convId: string,
  data: Record<string, unknown>
) {
  return addDoc(collection(db, 'conversations', convId, 'messages'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}
