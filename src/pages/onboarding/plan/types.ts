export interface TaskItem {
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  suggestedDueDate: string | null;
}

export interface BudgetItem {
  category: string;
  estimatedAmount: number;
  currency: string;
  notes?: string;
}

export interface MilestoneItem {
  title: string;
  description: string;
  targetDate: string | null;
}
