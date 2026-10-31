export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  assignedTo?: string[];
}

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Book wedding venue',
    dueDate: '15 Apr 2026',
    category: 'Venue',
    priority: 'High',
    completed: false,
    assignedTo: ['Priya Sharma'],
  },
  {
    id: 'task-2',
    title: 'Finalize guest list',
    dueDate: '30 Apr 2026',
    category: 'Guests',
    priority: 'Medium',
    completed: false,
    assignedTo: ['Neha Verma'],
  },
  {
    id: 'task-3',
    title: 'Meet photographer',
    dueDate: '12 Mar 2026',
    category: 'Photography',
    priority: 'Low',
    completed: true,
    assignedTo: ['Rohan Kapoor'],
  },
  {
    id: 'task-4',
    title: 'Order invitations',
    dueDate: '18 May 2026',
    category: 'Invitations',
    priority: 'Medium',
    completed: false,
    assignedTo: ['Ananya Shah'],
  },
  {
    id: 'task-5',
    title: 'Plan decor theme',
    dueDate: '22 May 2026',
    category: 'Decor',
    priority: 'Low',
    completed: false,
    assignedTo: ['Ananya Shah', 'Priya Sharma'],
  },
  {
    id: 'task-6',
    title: 'Schedule food tasting with caterer',
    dueDate: '5 Jun 2026',
    category: 'Catering',
    priority: 'High',
    completed: false,
    assignedTo: ['Karan Mehta'],
  },
];
