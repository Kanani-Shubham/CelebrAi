import { logger } from '../../utils/logger';
/**
 * CelebrAI Smart Notification Engine
 * 
 * Implements twice-daily proactive checks (Morning 9:00 AM & Evening 6:00 PM)
 * for tasks, deadlines, and celebration milestones.
 * 
 * Infrastructure Policy:
 * - Operates transparently on Firebase Spark Free Plan without introducing paid Cloud Scheduler costs.
 * - Runs automatically on app lifecycle events (app open, focus, route change) and maintains a periodic timer while active.
 * - Persists all notification records to Firestore 'notifications' with strict deduplication keys.
 * - Dispatches browser notifications via Web Notifications API when permission is granted.
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { calculateTaskStatus, validateTaskDueDate, calculateEventLifecycle } from '../../utils/taskCalculations';

export interface NotificationRecord {
  id?: string;
  userId: string;
  eventId: string;
  title: string;
  message: string;
  type: 'task' | 'rsvp' | 'budget' | 'system';
  deduplicationKey: string;
  createdAt: unknown;
  read: boolean;
  link?: string;
}

export interface UserNotificationPreferences {
  enabled: boolean;
  morningTime: string; // e.g. "09:00"
  eveningTime: string; // e.g. "18:00"
  categories: {
    tasks: boolean;
    rsvp: boolean;
    budget: boolean;
    deadlines: boolean;
  };
  timezone?: string;
}

export const DEFAULT_NOTIFICATION_PREFS: UserNotificationPreferences = {
  enabled: true,
  morningTime: '09:00',
  eveningTime: '18:00',
  categories: {
    tasks: true,
    rsvp: true,
    budget: true,
    deadlines: true,
  },
};

/**
 * Returns infrastructure capability status.
 */
export function getNotificationInfrastructureInfo() {
  return {
    firebasePlan: 'Spark (Free)',
    backgroundPushWhileClosed: false,
    inAppLifecycleAudits: true,
    webNotificationApi: typeof window !== 'undefined' && 'Notification' in window,
    costDependency: 'Google Cloud Scheduler & 24/7 Cloud Functions require Blaze plan upgrade.',
  };
}

/**
 * Generates an ISO Date string YYYY-MM-DD for the target timezone.
 */
function getTodayStringInTimezone(timezone?: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Checks if current local hour falls in the morning (>= 9 AM) or evening (>= 6 PM) cycle.
 */
export function getCurrentAuditCycle(
  prefs: UserNotificationPreferences = DEFAULT_NOTIFICATION_PREFS
): 'morning' | 'evening' {
  const now = new Date();
  const currentHour = now.getHours();

  const eveningHour = parseInt(prefs.eveningTime.split(':')[0], 10) || 18;

  if (currentHour >= eveningHour) {
    return 'evening';
  }
  return 'morning';
}

/**
 * Checks if a notification with the given deduplication key was already generated today.
 */
async function hasNotificationBeenSent(
  userId: string,
  deduplicationKey: string
): Promise<boolean> {
  try {
    const notifCol = collection(db, 'notifications');
    const q = query(
      notifCol,
      where('userId', '==', userId),
      where('deduplicationKey', '==', deduplicationKey),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    logger.warn('[NotificationEngine] Deduplication lookup error:', err);
    return false;
  }
}

/**
 * Persists a new notification and triggers browser notification if permitted.
 * Returns true if a new notification was saved, false if skipped due to deduplication.
 */
async function dispatchNotification(data: {
  userId: string;
  eventId: string;
  title: string;
  message: string;
  type: 'task' | 'rsvp' | 'budget' | 'system';
  deduplicationKey: string;
  link?: string;
}): Promise<boolean> {
  const alreadySent = await hasNotificationBeenSent(data.userId, data.deduplicationKey);
  if (alreadySent) {
    return false;
  }

  // 1. Persist to Firestore
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: data.userId,
      eventId: data.eventId,
      title: data.title,
      message: data.message,
      type: data.type,
      deduplicationKey: data.deduplicationKey,
      read: false,
      link: data.link || '/notifications',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    logger.warn('[NotificationEngine] Failed to save notification to Firestore:', err);
  }

  // 2. Dispatch browser notification if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(data.title, {
        body: data.message,
        icon: '/assets/branding/celebrai-icon.png',
      });
    } catch {
      // Browser notification dispatch failure ignored gracefully
    }
  }

  return true;
}

/**
 * Core Smart Notification Audit
 * Evaluates real tasks and event deadlines against morning/evening cycle rules.
 */
export async function runTaskAndEventAudit(params: {
  userId: string;
  event: { id: string; eventName?: string; eventDate?: string; date?: string };
  tasks: { id: string; title: string; dueDate?: string | null; completed?: boolean; priority?: string }[];
  preferences?: UserNotificationPreferences;
}): Promise<number> {
  const { userId, event, tasks, preferences = DEFAULT_NOTIFICATION_PREFS } = params;

  if (!preferences.enabled || !userId || !event?.id) {
    return 0;
  }

  const todayStr = getTodayStringInTimezone(preferences.timezone);
  const cycle = getCurrentAuditCycle(preferences);
  const eventName = event.eventName || 'your celebration';
  let generatedCount = 0;

  // 1. Analyze task statuses
  const overdueTasks: typeof tasks = [];
  const dueTodayTasks: typeof tasks = [];
  const dueTomorrowTasks: typeof tasks = [];

  for (const t of tasks) {
    if (t.completed) continue;
    const status = calculateTaskStatus(t);

    if (status === 'Overdue') {
      overdueTasks.push(t);
    } else if (status === 'Due Today') {
      dueTodayTasks.push(t);
    } else if (t.dueDate) {
      const val = validateTaskDueDate(t.dueDate);
      if (val.diffDays === 1) {
        dueTomorrowTasks.push(t);
      }
    }
  }

  // 2. Morning Check (9:00 AM)
  if (cycle === 'morning') {
    // Alert: Overdue work
    if (overdueTasks.length > 0 && preferences.categories.tasks) {
      const dedupKey = `notif_${userId}_${event.id}_${todayStr}_morning_overdue`;
      const title = `${overdueTasks.length} task${overdueTasks.length === 1 ? ' is' : 's are'} overdue`;
      const message = overdueTasks.length === 1
        ? `"${overdueTasks[0].title}" has passed its deadline. Reschedule or mark it complete.`
        : `You have ${overdueTasks.length} overdue tasks for "${eventName}". Review your action items.`;

      const sent = await dispatchNotification({
        userId,
        eventId: event.id,
        title,
        message,
        type: 'task',
        deduplicationKey: dedupKey,
        link: '/tasks',
      });
      if (sent) generatedCount++;
    }

    // Alert: Tasks Due Today
    if (dueTodayTasks.length > 0 && preferences.categories.tasks) {
      const dedupKey = `notif_${userId}_${event.id}_${todayStr}_morning_duetoday`;
      const title = `${dueTodayTasks.length} task${dueTodayTasks.length === 1 ? '' : 's'} due today`;
      const message = dueTodayTasks.length === 1
        ? `"${dueTodayTasks[0].title}" is due today for "${eventName}".`
        : `You have ${dueTodayTasks.length} tasks scheduled for today. Keep up the momentum!`;

      const sent = await dispatchNotification({
        userId,
        eventId: event.id,
        title,
        message,
        type: 'task',
        deduplicationKey: dedupKey,
        link: '/tasks',
      });
      if (sent) generatedCount++;
    }

    // Alert: Tasks Due Tomorrow
    if (dueTomorrowTasks.length > 0 && preferences.categories.tasks) {
      const dedupKey = `notif_${userId}_${event.id}_${todayStr}_morning_duetomorrow`;
      const title = `Upcoming tomorrow: ${dueTomorrowTasks[0].title}`;
      const message = `Deadline approaching: "${dueTomorrowTasks[0].title}" is due tomorrow for "${eventName}".`;

      const sent = await dispatchNotification({
        userId,
        eventId: event.id,
        title,
        message,
        type: 'task',
        deduplicationKey: dedupKey,
        link: '/tasks',
      });
      if (sent) generatedCount++;
    }
  }

  // 3. Evening Check (6:00 PM)
  if (cycle === 'evening') {
    const incompleteCount = overdueTasks.length + dueTodayTasks.length;
    if (incompleteCount > 0 && preferences.categories.tasks) {
      const dedupKey = `notif_${userId}_${event.id}_${todayStr}_evening_review`;
      const title = `Evening Check: ${incompleteCount} task${incompleteCount === 1 ? '' : 's'} remaining`;
      const message = `You still have ${incompleteCount} pending action item${incompleteCount === 1 ? '' : 's'} for "${eventName}". Wrap up or reschedule before tomorrow.`;

      const sent = await dispatchNotification({
        userId,
        eventId: event.id,
        title,
        message,
        type: 'task',
        deduplicationKey: dedupKey,
        link: '/tasks',
      });
      if (sent) generatedCount++;
    }
  }

  // 4. Event Countdown Milestone Alert (3 days, 2 days, 1 day before event)
  const eventDateStr = event.eventDate || event.date;
  if (eventDateStr && preferences.categories.deadlines) {
    const lifecycle = calculateEventLifecycle(eventDateStr);
    if (lifecycle.daysRemaining !== null && lifecycle.daysRemaining > 0 && lifecycle.daysRemaining <= 3) {
      const dedupKey = `notif_${userId}_${event.id}_${todayStr}_countdown_${lifecycle.daysRemaining}`;
      const pendingTotal = tasks.filter(t => !t.completed).length;
      const title = `"${eventName}" is in ${lifecycle.daysRemaining} day${lifecycle.daysRemaining === 1 ? '' : 's'}!`;
      const message = pendingTotal > 0
        ? `Only ${lifecycle.daysRemaining} days remaining, and ${pendingTotal} task${pendingTotal === 1 ? ' is' : 's are'} still in progress.`
        : `Your celebration is just ${lifecycle.daysRemaining} days away! All core items are on track.`;

      const sent = await dispatchNotification({
        userId,
        eventId: event.id,
        title,
        message,
        type: 'system',
        deduplicationKey: dedupKey,
        link: '/overview',
      });
      if (sent) generatedCount++;
    }
  }

  return generatedCount;
}
