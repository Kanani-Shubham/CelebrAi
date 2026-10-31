import type { Guest } from '../../../types';
export type FirestoreGuest = Guest;

export const DIETARY_OPTIONS: FirestoreGuest['dietary'][] = [
  'Vegetarian',
  'Vegan',
  'Non-vegetarian',
  'Halal',
  'Gluten Free',
  'None',
];
