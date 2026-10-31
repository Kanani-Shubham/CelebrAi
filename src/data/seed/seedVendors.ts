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
