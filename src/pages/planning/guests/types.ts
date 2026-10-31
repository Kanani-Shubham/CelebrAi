export interface FirestoreGuest {
  id: string;
  name: string;
  partySize: number;
  dietary: 'Vegetarian' | 'Vegan' | 'Non-vegetarian' | 'Halal' | 'Gluten Free' | 'None';
  status: 'Accepted' | 'Pending' | 'Declined';
  accessible?: boolean;
  eventId: string;
  phone?: string;
  email?: string;
}

export const DIETARY_OPTIONS: FirestoreGuest['dietary'][] = [
  'Vegetarian',
  'Vegan',
  'Non-vegetarian',
  'Halal',
  'Gluten Free',
  'None',
];
