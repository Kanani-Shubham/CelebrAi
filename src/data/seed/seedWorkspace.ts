export interface RunSheetItem {
  id: string;
  time: string;
  title: string;
  location: string;
  duration: string;
  pic: string;
}

export const INITIAL_RUNSHEET: RunSheetItem[] = [
  { id: 'rs-1', time: '8:00 AM', title: 'Vendor Setup', location: 'Venue', duration: '2 hrs', pic: '🔧' },
  { id: 'rs-2', time: '10:00 AM', title: 'Decor Final Touch', location: 'Main Hall', duration: '1 hr', pic: '🌸' },
  { id: 'rs-3', time: '11:00 AM', title: 'Guest Arrival', location: 'Entrance', duration: '1 hr', pic: '🥂' },
  { id: 'rs-4', time: '12:00 PM', title: 'Ceremony', location: 'Garden Area', duration: '1 hr 30m', pic: '💍' },
  { id: 'rs-5', time: '2:00 PM', title: 'Lunch', location: 'Dining Area', duration: '1 hr', pic: '🍽️' },
  { id: 'rs-6', time: '4:00 PM', title: 'Photo Session', location: 'Garden & Indoor', duration: '1 hr', pic: '📸' },
  { id: 'rs-7', time: '6:00 PM', title: 'Cocktail Hour', location: 'Poolside', duration: '1 hr', pic: '🍸' },
];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  tasksCount: number;
  avatar: string;
  permission: 'Full access' | 'Edit access' | 'View only';
}

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Shubham Kanani',
    role: 'Event Owner',
    tasksCount: 12,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    permission: 'Full access',
  },
  {
    id: 'tm-2',
    name: 'Priya Sharma',
    role: 'Venue Coordinator',
    tasksCount: 8,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    permission: 'Edit access',
  },
  {
    id: 'tm-3',
    name: 'Rohan Kapoor',
    role: 'Vendor Manager',
    tasksCount: 10,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    permission: 'Edit access',
  },
  {
    id: 'tm-4',
    name: 'Neha Verma',
    role: 'Guest & RSVP',
    tasksCount: 6,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80',
    permission: 'Edit access',
  },
  {
    id: 'tm-5',
    name: 'Karan Mehta',
    role: 'Logistics & Setup',
    tasksCount: 7,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80',
    permission: 'Edit access',
  },
  {
    id: 'tm-6',
    name: 'Ananya Shah',
    role: 'Design & Decor',
    tasksCount: 9,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    permission: 'View only',
  },
];
