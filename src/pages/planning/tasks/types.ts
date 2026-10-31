export interface FirestoreTask {
  id: string;
  title: string;
  dueDate?: string | null;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  completedAt?: unknown;
  eventId: string;
  createdBy?: string;
  createdAt?: unknown;
}

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
