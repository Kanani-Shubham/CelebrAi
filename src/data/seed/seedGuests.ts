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
