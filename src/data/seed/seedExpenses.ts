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
