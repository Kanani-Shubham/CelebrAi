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
  requirements?: string;
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

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  vendorName: string;
  vendorImage: string;
}

export const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    title: 'Advance Payment',
    category: 'Venue',
    date: '12 Mar 2026',
    amount: 100000,
    status: 'Paid',
    vendorName: 'The Grand Venue',
    vendorImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'exp-2',
    title: 'Stage Decoration',
    category: 'Decor',
    date: '28 Mar 2026',
    amount: 75000,
    status: 'Pending',
    vendorName: 'Dream Decor Studio',
    vendorImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'exp-3',
    title: 'Food & Beverages',
    category: 'Catering',
    date: '10 Apr 2026',
    amount: 120000,
    status: 'Paid',
    vendorName: 'Flavors Catering',
    vendorImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'exp-4',
    title: 'Wedding Photography',
    category: 'Photography',
    date: '22 Apr 2026',
    amount: 80000,
    status: 'Pending',
    vendorName: 'Moments Photography',
    vendorImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'exp-5',
    title: 'Invitations Print & Box',
    category: 'Invitations',
    date: '05 May 2026',
    amount: 24000,
    status: 'Paid',
    vendorName: 'Elegant Invites',
    vendorImage: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=200&q=80',
  },
];

export interface GuestItem {
  id: string;
  name: string;
  partySize: number;
  dietary: 'Vegetarian' | 'Vegan' | 'Non-vegetarian' | 'Halal' | 'Gluten Free' | 'None';
  status: 'Accepted' | 'Pending' | 'Declined';
  accessible?: boolean;
  avatar?: string;
  table?: string;
}

export const INITIAL_GUESTS: GuestItem[] = [
  {
    id: 'guest-1',
    name: 'Aarav Mehta',
    partySize: 2,
    dietary: 'Vegetarian',
    status: 'Accepted',
    accessible: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    table: 'Table 4',
  },
  {
    id: 'guest-2',
    name: 'Priya Sharma',
    partySize: 1,
    dietary: 'Vegan',
    status: 'Pending',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    table: 'Table 2',
  },
  {
    id: 'guest-3',
    name: 'Rohan Kapoor',
    partySize: 4,
    dietary: 'Non-vegetarian',
    status: 'Accepted',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    table: 'Table 5',
  },
  {
    id: 'guest-4',
    name: 'Neha Verma',
    partySize: 3,
    dietary: 'Non-vegetarian',
    status: 'Declined',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'guest-5',
    name: 'Karan & Pooja',
    partySize: 2,
    dietary: 'Vegetarian',
    status: 'Accepted',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80',
    table: 'Table 3',
  },
];

export interface VendorItem {
  id: string;
  name: string;
  category: 'Photographer' | 'Venue' | 'Catering' | 'Decor' | 'Invitations';
  location: string;
  priceStart: string;
  rating: number;
  reviewsCount: number;
  image: string;
  saved: boolean;
  capacity?: string;
  features?: string[];
  description?: string;
}

export const INITIAL_VENDORS: VendorItem[] = [
  {
    id: 'v-1',
    name: 'The Grand Orchard',
    category: 'Venue',
    location: 'Ahmedabad, Gujarat',
    priceStart: '₹2,50,000 onwards',
    rating: 4.9,
    reviewsCount: 128,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
    saved: true,
    capacity: '200-500 Capacity',
    features: ['Indoor & Outdoor', 'Parking Available', 'In-house Catering', 'Bridal Suite'],
    description: 'A beautiful garden venue with modern amenities, picturesque floral arches, and lush green lawns perfect for weddings and large celebrations.',
  },
  {
    id: 'v-2',
    name: 'Lens & Love Photography',
    category: 'Photographer',
    location: 'Ahmedabad, Gujarat',
    priceStart: '₹60,000 onwards',
    rating: 4.8,
    reviewsCount: 94,
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    saved: true,
    features: ['Candid Photography', 'Drone Shoots', 'Cinematic Film', 'Same Day Edit'],
    description: 'Specializing in candid and timeless storytelling, capturing moments of raw emotion and natural beauty across luxury weddings.',
  },
  {
    id: 'v-3',
    name: 'Flavors Catering',
    category: 'Catering',
    location: 'Ahmedabad, Gujarat',
    priceStart: '₹1,200 per plate',
    rating: 4.9,
    reviewsCount: 210,
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    saved: false,
    features: ['Live Counters', 'Multi-Cuisine', 'Dessert Bar', 'Custom Mocktails'],
    description: 'Award-winning gastronomic experiences featuring authentic regional specialties alongside global delicacies.',
  },
  {
    id: 'v-4',
    name: 'Dream Decor Studio',
    category: 'Decor',
    location: 'Ahmedabad, Gujarat',
    priceStart: '₹75,000 onwards',
    rating: 4.7,
    reviewsCount: 62,
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
    saved: true,
    features: ['Floral Installations', 'Fairy Lights', 'Bespoke Mandap', 'Theme Design'],
    description: 'Bespoke floral styling and transformative scenography for unforgettable romantic ceremonies.',
  },
];

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
