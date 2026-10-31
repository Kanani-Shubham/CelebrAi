import type { ConversationRecord } from '../../../services/firebase/firestore';

export interface MessageItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  error?: boolean;
}

export function formatHistoryTime(val: unknown): string {
  if (!val) return 'Just now';
  let date: Date;
  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    date = (val as { toDate: () => Date }).toDate();
  } else if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'number') {
    date = new Date(val);
  } else {
    return 'Saved';
  }

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now.getTime() - 86400000);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function groupConversations(convs: ConversationRecord[]) {
  const groups: {
    today: ConversationRecord[];
    yesterday: ConversationRecord[];
    lastWeek: ConversationRecord[];
    older: ConversationRecord[];
  } = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfLastWeek = startOfToday - 7 * 86400000;

  convs.forEach((c) => {
    let t = 0;
    if (c.updatedAt && typeof (c.updatedAt as { toMillis?: () => number }).toMillis === 'function') {
      t = (c.updatedAt as { toMillis: () => number }).toMillis();
    } else if (c.updatedAt instanceof Date) {
      t = c.updatedAt.getTime();
    } else if (typeof c.updatedAt === 'number') {
      t = c.updatedAt;
    } else if (typeof c.updatedAt === 'string') {
      const parsed = Date.parse(c.updatedAt);
      if (!isNaN(parsed)) t = parsed;
    }

    if (t >= startOfToday) {
      groups.today.push(c);
    } else if (t >= startOfYesterday) {
      groups.yesterday.push(c);
    } else if (t >= startOfLastWeek) {
      groups.lastWeek.push(c);
    } else {
      groups.older.push(c);
    }
  });

  return groups;
}
