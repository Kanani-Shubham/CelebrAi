import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useEvent, type Event } from '../../contexts/EventContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  generateEventPlan,
  validateAIPlan,
  type AIPlanResult,
} from '../../services/ai/groq';
import {
  AI_MODEL_LABEL,
  AI_OFFLINE_BADGE,
  AI_OFFLINE_ENGINE_ID,
} from '../../config/ai';
import {
  getDocById,
  saveApprovedEventPlan,
} from '../../services/firebase/firestore';
import { signInWithGoogle } from '../../services/firebase/auth';
import { toast } from '../../components/ui';
import { logger } from '../../utils/logger';

import type { TaskItem, BudgetItem, MilestoneItem } from './plan/types';
import { PlanOverviewTab } from './plan/PlanOverviewTab';
import { PlanTasksTab } from './plan/PlanTasksTab';
import { PlanBudgetTab } from './plan/PlanBudgetTab';
import { PlanTimelineTab } from './plan/PlanTimelineTab';
import {
  OverviewModal,
  TaskModal,
  BudgetModal,
  MilestoneModal,
  AuthModal,
} from './plan/PlanModals';

import './AIPlanPreview.css';

export function AIPlanPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeEvent, setActiveEvent, refresh: refreshEvents } = useEvent();
  const { user, idToken } = useAuth();

  const queryEventId = searchParams.get('eventId');
  const [targetEvent, setTargetEvent] = useState<Record<string, unknown> | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'budget' | 'timeline'>('overview');
  const [plan, setPlan] = useState<AIPlanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  // Modals state
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [overviewForm, setOverviewForm] = useState({
    eventName: '',
    conceptSummary: '',
    location: '',
    guestCount: 100,
    budget: 0,
  });
  const [newThemeTag, setNewThemeTag] = useState('');

  const [taskModalMode, setTaskModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingTaskIdx, setEditingTaskIdx] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState<TaskItem>({
    title: '',
    category: 'General',
    priority: 'medium',
    suggestedDueDate: null,
  });

  const [budgetModalMode, setBudgetModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingBudgetIdx, setEditingBudgetIdx] = useState<number | null>(null);
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    notes: '',
  });

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

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Resolve target event from query params or localStorage
  useEffect(() => {
    async function resolveEvent() {
      if (queryEventId) {
        try {
          const doc = await getDocById('events', queryEventId);
          if (doc) {
            setTargetEvent(doc);
            return;
          }
        } catch (err) {
          logger.warn('[AIPlanPreview] Failed to fetch event by ID:', err);
        }
      }

      try {
        const cached = localStorage.getItem('celebrai_pending_event');
        if (cached) {
          const parsed = JSON.parse(cached);
          setTargetEvent(parsed);
          return;
        }
      } catch (err) {
        logger.warn('[AIPlanPreview] Failed to read pending event cache:', err);
      }

      if (activeEvent) {
        setTargetEvent(activeEvent as unknown as Record<string, unknown>);
        return;
      }

      try {
        const stored = localStorage.getItem('celebrai_events');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            setTargetEvent(list[0]);
            return;
          }
        }
      } catch {
        // ignore
      }

      // Default fallback event
      setTargetEvent({
        id: 'evt-demo',
        eventName: 'Grand Gala Celebration',
        eventType: 'Wedding',
        eventDate: '2026-11-20',
        location: 'Mumbai, India',
        guestCount: 200,
        budget: 500000,
        currency: '₹',
        theme: 'Royal Elegance',
      });
    }

    resolveEvent();
  }, [queryEventId, activeEvent]);

  // 2. Fetch or Generate AI Plan
  const fetchOrGeneratePlan = useCallback(async () => {
    if (!targetEvent) return;

    if (targetEvent.savedPlan) {
      setPlan(validateAIPlan(targetEvent.savedPlan));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const eventName = String(targetEvent.eventName || 'Our Celebration');
    const eventType = String(targetEvent.eventType || 'Celebration');
    const eventDate = String(targetEvent.eventDate || targetEvent.date || 'TBD');
    const location = String(targetEvent.location || 'India');
    const guestCount = Number(targetEvent.guestCount) || 100;
    const budget = Number(targetEvent.budget) || 0;
    const currency = String(targetEvent.currency || '₹');
    const theme = String(targetEvent.theme || 'Classic Elegance');
    const requirements = String(targetEvent.requirements || '');

    try {
      const result = await generateEventPlan(
        {
          eventName,
          eventType,
          eventDate,
          location,
          guestCount,
          budget,
          currency,
          theme,
          requirements,
        },
        idToken || ''
      );

      const validated = validateAIPlan(result);
      setPlan(validated);
    } catch (err) {
      logger.error('[AIPlanPreview] Generation failed:', err);
      setError((err as Error).message || 'Failed to generate AI plan. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [targetEvent, idToken]);

  useEffect(() => {
    if (targetEvent) {
      fetchOrGeneratePlan();
    }
  }, [targetEvent, fetchOrGeneratePlan]);

  const totalAllocatedBudget = useMemo(() => {
    if (!plan?.budgetBreakdown) return 0;
    return plan.budgetBreakdown.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 0), 0);
  }, [plan?.budgetBreakdown]);

  const targetBudget = Number(targetEvent?.budget) || 0;
  const budgetDifference = targetBudget - totalAllocatedBudget;

  // Handlers for Overview
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

  // Handlers for Tasks
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

  // Handlers for Budget
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

  // Handlers for Milestones
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

  // Save approved plan
  const handleSavePlan = async () => {
    if (!plan || !targetEvent || planSaved || savingPlan) return;

    if (!user) {
      try {
        localStorage.setItem(
          'celebrai_pending_plan',
          JSON.stringify({ event: targetEvent, plan })
        );
      } catch (err) {
        logger.warn('Could not cache draft to localStorage:', err);
      }
      setShowAuthModal(true);
      return;
    }

    setSavingPlan(true);
    try {
      const savedEventId = await saveApprovedEventPlan(user.uid, targetEvent, plan);

      const verifiedEvent: Event = {
        id: savedEventId,
        ownerId: user.uid,
        eventName: String(targetEvent.eventName || 'Our Celebration'),
        eventType: String(targetEvent.eventType || 'Celebration'),
        eventDate: String(targetEvent.eventDate || targetEvent.date || 'TBD'),
        location: String(targetEvent.location || 'TBD'),
        guestCount: Number(targetEvent.guestCount) || 0,
        budget: totalAllocatedBudget > 0 ? totalAllocatedBudget : Number(targetEvent.budget) || 0,
        currency: String(targetEvent.currency || '₹'),
        theme: String(targetEvent.theme || ''),
        coverImage: String(targetEvent.coverImage || ''),
        status: 'active',
        tasksTotal: plan.tasks.length,
        tasksDone: 0,
        daysLeft: 30,
        planSummary: plan.eventSummary,
        themeSuggestions: plan.themeSuggestions,
        milestones: plan.milestones.map((m) => ({
          title: m.title,
          description: m.description,
          targetDate: m.targetDate || undefined,
        })),
        savedPlan: plan,
      };

      try {
        const stored = localStorage.getItem('celebrai_events');
        const list: Event[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((e) => e.id !== targetEvent.id && e.id !== savedEventId);
        const updated = [verifiedEvent, ...filtered];
        localStorage.setItem('celebrai_events', JSON.stringify(updated));
        localStorage.setItem('celebrai_active_event', savedEventId);
        localStorage.removeItem('celebrai_pending_plan');
      } catch {
        // ignore
      }

      setActiveEvent(verifiedEvent);
      await refreshEvents();
      setPlanSaved(true);
      toast.success('Event plan approved & saved! Tasks and budget allocations created.');
      navigate('/dashboard');
    } catch (err) {
      logger.error('[AIPlanPreview] Save plan error:', err);
      toast.error('Failed to save plan: ' + ((err as Error).message || 'Missing or insufficient permissions'));
    } finally {
      setSavingPlan(false);
    }
  };

  const handleGoogleSignInFromModal = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
      toast.success('Signed in successfully! Saving plan...');
    } catch (err) {
      toast.error((err as Error).message || 'Sign in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const eventName = String(targetEvent?.eventName || 'Our Celebration');
  const eventDate = String(targetEvent?.eventDate || targetEvent?.date || 'TBD');
  const location = String(targetEvent?.location || 'India');
  const guestCount = Number(targetEvent?.guestCount) || 100;

  return (
    <div className="page-container ai-plan-page">
      <header className="page-header-nav">
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
      </header>

      <div className="ai-plan-hero">
        <div className={`ai-badge ${plan?._model === AI_OFFLINE_ENGINE_ID ? 'ai-badge-fallback' : ''}`}>
          <Sparkles size={14} />
          {plan?._model === AI_OFFLINE_ENGINE_ID ? AI_OFFLINE_BADGE : `Powered by ${AI_MODEL_LABEL}`}
        </div>
        <h1 className="ai-plan-title">Your AI Event Plan ✨</h1>
        <p className="ai-plan-subtitle">
          Tailored blueprint generated for <strong>{eventName}</strong> based on your preferences.
        </p>
        {plan?._model === AI_OFFLINE_ENGINE_ID && (
          <div
            className="plan-offline-notice"
            role="status"
            style={{
              marginTop: '12px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(217, 119, 6, 0.1)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              color: '#b45309',
              fontSize: 'var(--text-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>ℹ️</span>
            <span>Deterministic offline blueprint (AI proxy unavailable — generated locally by template engine)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="plan-tabs" role="tablist">
        {(['overview', 'tasks', 'budget', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`plan-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="plan-content">
        {loading ? (
          <div className="plan-loading-box">
            <Loader2 size={36} className="animate-spin spinner-violet" />
            <h3 className="loading-title">Generating Master Event Blueprint...</h3>
            <p className="loading-sub">
              Groq AI is analyzing your requirements, generating tailored tasks, budget allocations, and key milestones.
            </p>
          </div>
        ) : error ? (
          <div className="plan-error-box">
            <AlertCircle size={32} className="error-icon" />
            <h3 className="error-title">Plan Generation Problem</h3>
            <p className="error-desc">{error}</p>
            <button className="btn btn-primary btn-pill" onClick={fetchOrGeneratePlan}>
              Try Again
            </button>
          </div>
        ) : plan ? (
          <>
            {activeTab === 'overview' && (
              <PlanOverviewTab
                eventName={eventName}
                eventDate={eventDate}
                location={location}
                guestCount={guestCount}
                targetBudget={targetBudget}
                plan={plan}
                newThemeTag={newThemeTag}
                onOpenOverviewModal={openOverviewModal}
                onNewThemeTagChange={setNewThemeTag}
                onAddThemeTag={handleAddThemeTag}
                onDeleteThemeTag={handleDeleteThemeTag}
              />
            )}

            {activeTab === 'tasks' && (
              <PlanTasksTab
                tasks={plan.tasks}
                onOpenAddTask={openAddTask}
                onOpenEditTask={openEditTask}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeTab === 'budget' && (
              <PlanBudgetTab
                budgetBreakdown={plan.budgetBreakdown}
                totalAllocatedBudget={totalAllocatedBudget}
                targetBudget={targetBudget}
                budgetDifference={budgetDifference}
                onOpenAddBudget={openAddBudget}
                onOpenEditBudget={openEditBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {activeTab === 'timeline' && (
              <PlanTimelineTab
                milestones={plan.milestones}
                onOpenAddMilestone={openAddMilestone}
                onOpenEditMilestone={openEditMilestone}
                onDeleteMilestone={handleDeleteMilestone}
              />
            )}

            {/* Sticky Bottom Action */}
            <div className="plan-bottom-bar">
              <button
                className="btn btn-primary plan-save-btn"
                onClick={handleSavePlan}
                disabled={savingPlan || planSaved}
              >
                {savingPlan ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving Plan, Tasks & Budget to Event...</span>
                  </>
                ) : planSaved ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Plan Saved! Go to Dashboard</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Approve & Save Plan to Event</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Modals */}
      <OverviewModal
        isOpen={isOverviewModalOpen}
        form={overviewForm}
        onFormChange={setOverviewForm}
        onClose={() => setIsOverviewModalOpen(false)}
        onSave={handleSaveOverview}
      />

      <TaskModal
        mode={taskModalMode}
        form={taskForm}
        onFormChange={setTaskForm}
        onClose={() => setTaskModalMode(null)}
        onSave={handleSaveTask}
      />

      <BudgetModal
        mode={budgetModalMode}
        form={budgetForm}
        onFormChange={setBudgetForm}
        onClose={() => setBudgetModalMode(null)}
        onSave={handleSaveBudget}
      />

      <MilestoneModal
        mode={milestoneModalMode}
        form={milestoneForm}
        onFormChange={setMilestoneForm}
        onClose={() => setMilestoneModalMode(null)}
        onSave={handleSaveMilestone}
      />

      <AuthModal
        isOpen={showAuthModal}
        authLoading={authLoading}
        onClose={() => setShowAuthModal(false)}
        onGoogleSignIn={handleGoogleSignInFromModal}
        onEmailSignIn={() => {
          setShowAuthModal(false);
          navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }}
      />
    </div>
  );
}
