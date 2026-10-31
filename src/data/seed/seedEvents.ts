export interface EventData {
  id: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  date?: string;
  location: string;
  guestCount: number;
  budget: number;
  currency: string;
  theme: string;
  coverImage: string;
  tasksDone: number;
  tasksTotal: number;
  status: 'active' | 'past' | 'archived';
  daysLeft: number;
  ownerId?: string;
  requirements?: string;
  planSummary?: string;
  themeSuggestions?: string[];
  savedPlan?: unknown;
  milestones?: { targetDate?: string; title: string; description?: string }[];
}

export const INITIAL_EVENTS: EventData[] = [
  {
    id: 'evt-1',
    eventName: 'Celine & James Wedding',
    eventType: 'Wedding',
    eventDate: '7 March 2028',
    location: 'Ahmedabad, Gujarat',
    guestCount: 250,
    budget: 800000,
    currency: '₹',
    theme: 'Traditional + Modern',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    tasksDone: 3,
    tasksTotal: 24,
    status: 'active',
    daysLeft: 699,
  },
  {
    id: 'evt-2',
    eventName: "Riya's Birthday",
    eventType: 'Birthday',
    eventDate: '12 May 2027',
    location: 'Mumbai, Maharashtra',
    guestCount: 60,
    budget: 150000,
    currency: '₹',
    theme: 'Pastel Dream',
    coverImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    tasksDone: 5,
    tasksTotal: 18,
    status: 'active',
    daysLeft: 420,
  },
  {
    id: 'evt-3',
    eventName: 'Tech Fest 2027',
    eventType: 'College Event',
    eventDate: '20 Aug 2027',
    location: 'Bangalore, Karnataka',
    guestCount: 500,
    budget: 650000,
    currency: '₹',
    theme: 'Cyber Glow',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    tasksDone: 8,
    tasksTotal: 32,
    status: 'active',
    daysLeft: 512,
  },
  {
    id: 'evt-4',
    eventName: 'Community Diwali Fest',
    eventType: 'Community',
    eventDate: '1 Nov 2026',
    location: 'Ahmedabad, Gujarat',
    guestCount: 350,
    budget: 300000,
    currency: '₹',
    theme: 'Warm Festive Diyas',
    coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
    tasksDone: 12,
    tasksTotal: 28,
    status: 'active',
    daysLeft: 230,
  },
];
