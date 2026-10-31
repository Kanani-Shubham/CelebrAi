import type { TaskItem } from '../../../types';

export type FirestoreTask = TaskItem & {
  completedAt?: unknown;
};

export const CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Decor',
  'Guests',
  'Invitations',
  'Entertainment',
  'Transport',
  'Other',
];
