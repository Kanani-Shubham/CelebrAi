const fs = require('fs');

let code = fs.readFileSync('src/pages/planning/ExpenseManager.tsx', 'utf8');

const demoExpensesDef = `export interface FirestoreExpense {
  id: string;
  vendorName: string;
  title: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  category: string;
  date?: string;
  notes?: string;
  eventId: string;
}

export const DEMO_EXPENSES: FirestoreExpense[] = [
  { id: 'exp-1', vendorName: 'Grand Palace Banquet', title: 'Venue booking advance', amount: 150000, status: 'Paid', category: 'Venue', eventId: 'evt-1' },
  { id: 'exp-2', vendorName: 'Royal Florals & Decor', title: 'Decor planned allocation', amount: 80000, status: 'Overdue', category: 'Decor', eventId: 'evt-1' },
  { id: 'exp-3', vendorName: 'DJ & Sound Wave', title: 'Entertainment planned allocation', amount: 30000, status: 'Overdue', category: 'Entertainment', eventId: 'evt-1' },
  { id: 'exp-4', vendorName: 'Shreeji Gourmet Catering', title: 'Catering 50% advance', amount: 60000, status: 'Pending', category: 'Catering', eventId: 'evt-1' },
  { id: 'exp-5', vendorName: 'Studio Memories', title: 'Photography package', amount: 180000, status: 'Paid', category: 'Photography', eventId: 'evt-1' },
];`;

code = code.replace(/export interface FirestoreExpense {[\s\S]*?eventId: string;\s*}/, demoExpensesDef);

code = code.replace(
  /const data = await getEventExpenses\(eventId\);\s*setExpenses\(\(data \|\| \[\]\) as FirestoreExpense\[\]\);/,
  `const data = await getEventExpenses(eventId);
      if (data && data.length > 0) {
        setExpenses(data as FirestoreExpense[]);
      } else {
        setExpenses(DEMO_EXPENSES);
      }`
);

code = code.replace(
  /setError\(\(err as Error\)\.message \|\| 'Failed to load expenses'\);/,
  `setExpenses(DEMO_EXPENSES);`
);

fs.writeFileSync('src/pages/planning/ExpenseManager.tsx', code, 'utf8');
console.log('ExpenseManager patched!');
