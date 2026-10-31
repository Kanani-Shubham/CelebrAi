import type { EventItem } from '../../../types';
import React, { useState } from 'react';
import type { AIPlanResult } from '../../../services/ai/groq';
import type { TaskItem, BudgetItem, MilestoneItem } from './types';
import { toast } from '../../../components/ui/toast';

interface UsePlanModalsStateProps {
  plan: AIPlanResult | null;
  setPlan: React.Dispatch<React.SetStateAction<AIPlanResult | null>>;
  targetEvent: EventItem | Record<string, unknown> | null;
  setTargetEvent: React.Dispatch<React.SetStateAction<EventItem | Record<string, unknown> | null>>;
}

export function usePlanModalsState({
  plan,
  setPlan,
  targetEvent,
  setTargetEvent,
}: UsePlanModalsStateProps) {
  // Overview state
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [overviewForm, setOverviewForm] = useState({
    eventName: '',
    conceptSummary: '',
    location: '',
    guestCount: 100,
    budget: 0,
  });
  const [newThemeTag, setNewThemeTag] = useState('');

  // Task state
  const [taskModalMode, setTaskModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingTaskIdx, setEditingTaskIdx] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState<TaskItem>({
    title: '',
    category: 'General',
    priority: 'medium',
    suggestedDueDate: null,
  });

  // Budget state
  const [budgetModalMode, setBudgetModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingBudgetIdx, setEditingBudgetIdx] = useState<number | null>(null);
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    notes: '',
  });

  // Milestone state
  const [milestoneModalMode, setMilestoneModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingMilestoneIdx, setEditingMilestoneIdx] = useState<number | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<{
    title: string;
    description: string;
    targetDate: string | null;
  }>({
    title: '',
    description: '',
    targetDate: null,
  });

  // Overview handlers
  const openOverviewModal = () => {
    if (!targetEvent || !plan) return;
    setOverviewForm({
      eventName: String(targetEvent.eventName || 'Our Celebration'),
      conceptSummary: plan.eventSummary,
      location: String(targetEvent.location || 'India'),
      guestCount: Number(targetEvent.guestCount) || 100,
      budget: Number(targetEvent.budget) || 0,
    });
    setIsOverviewModalOpen(true);
  };

  const handleSaveOverview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overviewForm.eventName.trim()) {
      toast.error('Event title cannot be empty.');
      return;
    }
    setTargetEvent((prev) =>
      prev
        ? {
            ...prev,
            eventName: overviewForm.eventName.trim(),
            location: overviewForm.location.trim(),
            guestCount: overviewForm.guestCount,
            budget: overviewForm.budget,
          }
        : null
    );

    setPlan((prev) =>
      prev
        ? {
            ...prev,
            eventSummary: overviewForm.conceptSummary.trim(),
          }
        : null
    );

    setIsOverviewModalOpen(false);
    toast.success('Event details updated.');
  };

  const handleAddThemeTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newThemeTag.trim();
    if (!tag || !plan) return;
    if (plan.themeSuggestions.includes(tag)) {
      toast.error('Theme already exists.');
      return;
    }
    setPlan({
      ...plan,
      themeSuggestions: [...plan.themeSuggestions, tag],
    });
    setNewThemeTag('');
    toast.success('Theme suggestion added.');
  };

  const handleDeleteThemeTag = (tagToRemove: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      themeSuggestions: plan.themeSuggestions.filter((t) => t !== tagToRemove),
    });
  };

  // Task handlers
  const openAddTask = () => {
    setTaskForm({
      title: '',
      category: 'General',
      priority: 'medium',
      suggestedDueDate: '',
    });
    setTaskModalMode('add');
  };

  const openEditTask = (idx: number) => {
    if (!plan || !plan.tasks[idx]) return;
    const t = plan.tasks[idx];
    setTaskForm({
      title: t.title,
      category: t.category,
      priority: t.priority as 'high' | 'medium' | 'low',
      suggestedDueDate: t.suggestedDueDate || '',
    });
    setEditingTaskIdx(idx);
    setTaskModalMode('edit');
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    if (!taskForm.title.trim()) {
      toast.error('Task title is required.');
      return;
    }

    if (taskModalMode === 'add') {
      setPlan({
        ...plan,
        tasks: [taskForm, ...plan.tasks],
      });
      toast.success('New task added to plan.');
    } else if (taskModalMode === 'edit' && editingTaskIdx !== null) {
      const updated = [...plan.tasks];
      updated[editingTaskIdx] = taskForm;
      setPlan({
        ...plan,
        tasks: updated,
      });
      toast.success('Task updated successfully.');
    }
    setTaskModalMode(null);
    setEditingTaskIdx(null);
  };

  const handleDeleteTask = (idx: number) => {
    if (!plan) return;
    const taskToDelete = plan.tasks[idx];
    if (window.confirm(`Delete task "${taskToDelete.title}"?`)) {
      setPlan({
        ...plan,
        tasks: plan.tasks.filter((_, i) => i !== idx),
      });
      toast.success('Task deleted.');
    }
  };

  // Budget handlers
  const openAddBudget = () => {
    setBudgetForm({
      category: '',
      amount: '',
      notes: '',
    });
    setBudgetModalMode('add');
  };

  const openEditBudget = (idx: number) => {
    if (!plan || !plan.budgetBreakdown[idx]) return;
    const b = plan.budgetBreakdown[idx];
    setBudgetForm({
      category: b.category,
      amount: String(b.estimatedAmount),
      notes: b.notes || '',
    });
    setEditingBudgetIdx(idx);
    setBudgetModalMode('edit');
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    if (!budgetForm.category.trim()) {
      toast.error('Category name is required.');
      return;
    }
    const num = parseFloat(budgetForm.amount);
    if (isNaN(num) || num < 0) {
      toast.error('Please enter a valid, non-negative budget amount.');
      return;
    }

    const newItem: BudgetItem = {
      category: budgetForm.category.trim(),
      estimatedAmount: num,
      currency: '₹',
      notes: budgetForm.notes.trim() || undefined,
    };

    if (budgetModalMode === 'add') {
      setPlan({
        ...plan,
        budgetBreakdown: [...plan.budgetBreakdown, newItem],
      });
      toast.success('Budget category added.');
    } else if (budgetModalMode === 'edit' && editingBudgetIdx !== null) {
      const updated = [...plan.budgetBreakdown];
      updated[editingBudgetIdx] = newItem;
      setPlan({
        ...plan,
        budgetBreakdown: updated,
      });
      toast.success('Budget category updated.');
    }
    setBudgetModalMode(null);
    setEditingBudgetIdx(null);
  };

  const handleDeleteBudget = (idx: number) => {
    if (!plan) return;
    const item = plan.budgetBreakdown[idx];
    if (window.confirm(`Remove budget allocation for "${item.category}"?`)) {
      setPlan({
        ...plan,
        budgetBreakdown: plan.budgetBreakdown.filter((_, i) => i !== idx),
      });
      toast.success('Budget item removed.');
    }
  };

  // Milestone handlers
  const openAddMilestone = () => {
    setMilestoneForm({
      title: '',
      description: '',
      targetDate: null,
    });
    setMilestoneModalMode('add');
  };

  const openEditMilestone = (idx: number) => {
    if (!plan || !plan.milestones[idx]) return;
    const m = plan.milestones[idx];
    setMilestoneForm({
      title: m.title,
      description: m.description,
      targetDate: m.targetDate ?? null,
    });
    setEditingMilestoneIdx(idx);
    setMilestoneModalMode('edit');
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    if (!milestoneForm.title.trim()) {
      toast.error('Milestone title is required.');
      return;
    }

    const newMilestone: MilestoneItem = {
      title: milestoneForm.title.trim(),
      description: milestoneForm.description.trim(),
      targetDate: null,
    };

    if (milestoneModalMode === 'add') {
      setPlan({
        ...plan,
        milestones: [...plan.milestones, newMilestone],
      });
      toast.success('New milestone added.');
    } else if (milestoneModalMode === 'edit' && editingMilestoneIdx !== null) {
      const updated = [...plan.milestones];
      updated[editingMilestoneIdx] = newMilestone;
      setPlan({
        ...plan,
        milestones: updated,
      });
      toast.success('Milestone updated.');
    }
    setMilestoneModalMode(null);
    setEditingMilestoneIdx(null);
  };

  const handleDeleteMilestone = (idx: number) => {
    if (!plan) return;
    const m = plan.milestones[idx];
    if (window.confirm(`Delete milestone "${m.title}"?`)) {
      setPlan({
        ...plan,
        milestones: plan.milestones.filter((_, i) => i !== idx),
      });
      toast.success('Milestone removed.');
    }
  };

  return {
    // Overview
    isOverviewModalOpen,
    overviewForm,
    newThemeTag,
    setIsOverviewModalOpen,
    setOverviewForm,
    setNewThemeTag,
    openOverviewModal,
    handleSaveOverview,
    handleAddThemeTag,
    handleDeleteThemeTag,

    // Tasks
    taskModalMode,
    taskForm,
    setTaskModalMode,
    setTaskForm,
    openAddTask,
    openEditTask,
    handleSaveTask,
    handleDeleteTask,

    // Budget
    budgetModalMode,
    budgetForm,
    setBudgetModalMode,
    setBudgetForm,
    openAddBudget,
    openEditBudget,
    handleSaveBudget,
    handleDeleteBudget,

    // Milestones
    milestoneModalMode,
    milestoneForm,
    setMilestoneModalMode,
    setMilestoneForm,
    openAddMilestone,
    openEditMilestone,
    handleSaveMilestone,
    handleDeleteMilestone,
  };
}
