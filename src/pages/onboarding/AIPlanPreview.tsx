import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Clock,
  Pencil,
  Trash2,
  Plus,
  X,
  LogIn,
  Check,
  Tag,
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
import './AIPlanPreview.css';

interface TaskItem {
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  suggestedDueDate: string | null;
}

interface BudgetItem {
  category: string;
  estimatedAmount: number;
  currency: string;
  notes?: string;
}

interface MilestoneItem {
  title: string;
  description: string;
  targetDate: string | null;
}

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

  // --- Modals and Editing State ---
  // 1. Overview modal
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [overviewForm, setOverviewForm] = useState({
    eventName: '',
    conceptSummary: '',
    location: '',
    guestCount: 100,
    budget: 0,
  });
  const [newThemeTag, setNewThemeTag] = useState('');

  // 2. Task modal
  const [taskModalMode, setTaskModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingTaskIdx, setEditingTaskIdx] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState<TaskItem>({
    title: '',
    category: 'General',
    priority: 'medium',
    suggestedDueDate: null,
  });

  // 3. Budget modal
  const [budgetModalMode, setBudgetModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingBudgetIdx, setEditingBudgetIdx] = useState<number | null>(null);
  const [budgetForm, setBudgetForm] = useState<{ category: string; amount: string; notes: string }>({
    category: '',
    amount: '',
    notes: '',
  });

  // 4. Milestone modal
  const [milestoneModalMode, setMilestoneModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingMilestoneIdx, setEditingMilestoneIdx] = useState<number | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<MilestoneItem>({
    title: '',
    description: '',
    targetDate: null,
  });

  // 5. Auth prompt modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Resolve target event data safely without unnecessary permissions errors
  useEffect(() => {
    async function resolveEvent() {
      // Priority 1: Check activeEvent from context
      if (activeEvent && (!queryEventId || activeEvent.id === queryEventId)) {
        setTargetEvent(activeEvent as unknown as Record<string, unknown>);
        return;
      }

      // Priority 2: Check localStorage 'celebrai_events'
      try {
        const cached = localStorage.getItem('celebrai_events');
        if (cached) {
          const list: Event[] = JSON.parse(cached);
          const match = queryEventId ? list.find(e => e.id === queryEventId) : list[0];
          if (match) {
            setTargetEvent(match as unknown as Record<string, unknown>);
            return;
          }
        }
      } catch (err) {
        console.warn('Local events parse error:', err);
      }

      // Priority 3: If queryEventId is a real Firestore document ID and user is authenticated
      if (queryEventId && !queryEventId.startsWith('evt-') && user) {
        try {
          const doc = await getDocById('events', queryEventId);
          if (doc) {
            setTargetEvent(doc);
            return;
          }
        } catch (err) {
          console.warn('Could not fetch event from Firestore:', err);
        }
      }

      // Priority 4: Fallback if event context was empty
      if (!targetEvent) {
        setTargetEvent({
          id: queryEventId || `evt-${Date.now()}`,
          eventName: 'My Celebration',
          eventType: 'Celebration',
          eventDate: '',
          location: '',
          guestCount: 0,
          budget: 0,
          theme: '',
        });
      }
    }
    resolveEvent();
  }, [queryEventId, activeEvent, user]);

  // 2. Generate or load AI plan for this event
  const fetchOrGeneratePlan = useCallback(async () => {
    if (!targetEvent) return;

    // Check if event already has saved plan
    if (targetEvent.savedPlan) {
      try {
        const validated = validateAIPlan(targetEvent.savedPlan);
        setPlan(validated);
        setPlanSaved(true);
        setLoading(false);
        return;
      } catch {
        // regenerate
      }
    }

    setLoading(true);
    setError(null);

    const eventName = String(targetEvent.eventName || 'Our Celebration');
    const eventType = String(targetEvent.eventType || 'Event');
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
      console.error('[AIPlanPreview] Generation failed:', err);
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

  // Dynamic budget calculation: recalculates immediately when amounts change
  const totalAllocatedBudget = useMemo(() => {
    if (!plan?.budgetBreakdown) return 0;
    return plan.budgetBreakdown.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 0), 0);
  }, [plan?.budgetBreakdown]);

  const targetBudget = Number(targetEvent?.budget) || 0;
  const budgetDifference = targetBudget - totalAllocatedBudget;

  // --- Handlers for Editing Overview ---
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
    setTargetEvent(prev => prev ? {
      ...prev,
      eventName: overviewForm.eventName.trim(),
      location: overviewForm.location.trim(),
      guestCount: overviewForm.guestCount,
      budget: overviewForm.budget,
    } : null);

    setPlan(prev => prev ? {
      ...prev,
      eventSummary: overviewForm.conceptSummary.trim(),
    } : null);

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
      themeSuggestions: plan.themeSuggestions.filter(t => t !== tagToRemove),
    });
  };

  // --- Handlers for Editing Tasks ---
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

  // --- Handlers for Editing Budget ---
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

  // --- Handlers for Editing Timeline ---
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

  // --- 3. Save Approved Plan to Firestore (Atomic Batch) ---
  const handleSavePlan = async () => {
    if (!plan || !targetEvent || planSaved || savingPlan) return;

    // Check Authentication: If not signed in, show Auth Modal and preserve draft
    if (!user) {
      try {
        localStorage.setItem(
          'celebrai_pending_plan',
          JSON.stringify({ event: targetEvent, plan })
        );
      } catch (err) {
        console.warn('Could not cache draft to localStorage:', err);
      }
      setShowAuthModal(true);
      return;
    }

    setSavingPlan(true);
    try {
      // Execute atomic Firestore batch write (Event + Tasks + Expenses)
      const savedEventId = await saveApprovedEventPlan(user.uid, targetEvent, plan);

      // Construct verified event model
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
        milestones: plan.milestones.map(m => ({
          title: m.title,
          description: m.description,
          targetDate: m.targetDate || undefined,
        })),
        savedPlan: plan,
      };

      // Synchronize local storage and EventContext
      try {
        const stored = localStorage.getItem('celebrai_events');
        const list: Event[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter(e => e.id !== targetEvent.id && e.id !== savedEventId);
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
      console.error('[AIPlanPreview] Save plan error:', err);
      toast.error('Failed to save plan: ' + ((err as Error).message || 'Missing or insufficient permissions'));
    } finally {
      setSavingPlan(false);
    }
  };

  // Google quick sign-in from the modal
  const handleGoogleSignInFromModal = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
      toast.success('Signed in successfully! Saving plan...');
      // Will be triggered automatically when user becomes available, or user can click save
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
          {plan?._model === AI_OFFLINE_ENGINE_ID
            ? AI_OFFLINE_BADGE
            : `Powered by ${AI_MODEL_LABEL}`}
        </div>
        <h1 className="ai-plan-title">Your AI Event Plan ✨</h1>
        <p className="ai-plan-subtitle">
          Tailored blueprint generated for <strong>{eventName}</strong> based on your preferences.
        </p>
        {plan?._model === AI_OFFLINE_ENGINE_ID && (
          <div className="plan-offline-notice" role="status" style={{ marginTop: '12px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.3)', color: '#b45309', fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>ℹ️</span>
            <span>Deterministic offline blueprint (AI proxy unavailable — generated locally by template engine)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="plan-tabs" role="tablist">
        {(['overview', 'tasks', 'budget', 'timeline'] as const).map(tab => (
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
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                <div className="plan-card">
                  <div className="plan-card-body">
                    <div className="card-header-row">
                      <h3 className="plan-event-name">{eventName}</h3>
                      <button
                        onClick={openOverviewModal}
                        className="btn-edit-icon"
                        aria-label="Edit event details"
                        title="Edit event details"
                      >
                        <Pencil size={15} /> Edit
                      </button>
                    </div>
                    <div className="plan-meta-grid">
                      <div className="plan-meta-item">
                        <Calendar size={14} />
                        <span>{eventDate}</span>
                      </div>
                      <div className="plan-meta-item">
                        <MapPin size={14} />
                        <span>{location}</span>
                      </div>
                      <div className="plan-meta-item">
                        <Users size={14} />
                        <span>{guestCount} Guests</span>
                      </div>
                      <div className="plan-meta-item">
                        <DollarSign size={14} />
                        <span>₹{targetBudget.toLocaleString('en-IN')} Budget</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Concept Summary */}
                <div className="summary-box">
                  <div className="card-header-row">
                    <span className="summary-label">Concept Summary</span>
                    <button
                      onClick={openOverviewModal}
                      className="btn-edit-icon-sm"
                      aria-label="Edit concept summary"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                  <p className="summary-text">{plan.eventSummary}</p>
                </div>

                {/* Suggested Themes with Add/Delete */}
                <div className="theme-box">
                  <div className="card-header-row">
                    <span className="summary-label">Suggested Themes</span>
                  </div>
                  <div className="theme-tags-wrap">
                    {plan.themeSuggestions.map((th, i) => (
                      <span key={i} className="theme-tag">
                        <span>{th}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteThemeTag(th)}
                          className="theme-tag-del"
                          aria-label={`Remove theme ${th}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddThemeTag} className="add-theme-form">
                    <input
                      type="text"
                      placeholder="Add another theme..."
                      value={newThemeTag}
                      onChange={e => setNewThemeTag(e.target.value)}
                      className="add-theme-input"
                    />
                    <button
                      type="submit"
                      disabled={!newThemeTag.trim()}
                      className="btn-add-theme"
                      aria-label="Add theme tag"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </form>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                  <div className="stat-pill-box">
                    <span className="stat-num">{plan.tasks.length}</span>
                    <span className="stat-lbl">Tasks</span>
                  </div>
                  <div className="stat-pill-box">
                    <span className="stat-num">{plan.budgetBreakdown.length}</span>
                    <span className="stat-lbl">Categories</span>
                  </div>
                  <div className="stat-pill-box">
                    <span className="stat-num">{plan.milestones.length}</span>
                    <span className="stat-lbl">Milestones</span>
                  </div>
                </div>

                {/* AI Recommendations */}
                {plan.recommendations && plan.recommendations.length > 0 && (
                  <div className="recs-box">
                    <span className="summary-label">AI Recommendations</span>
                    <ul className="recs-list">
                      {plan.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              <div className="tab-pane-container">
                <div className="tab-pane-header">
                  <div>
                    <h3 className="section-heading">Tasks ({plan.tasks.length})</h3>
                    <p className="section-subheading">Personalize your task list before saving.</p>
                  </div>
                  <button onClick={openAddTask} className="btn-add-action" aria-label="Add new task">
                    <Plus size={16} /> Add Task
                  </button>
                </div>

                <div className="tasks-preview-list">
                  {plan.tasks.map((task, i) => (
                    <div key={i} className="interactive-card task-card">
                      <div className="card-main-info">
                        <strong className="card-title">{task.title}</strong>
                        <div className="card-sub-info">
                          <span className="category-pill">{task.category}</span>
                          {task.suggestedDueDate && (
                            <span className="due-date-pill">Due: {task.suggestedDueDate}</span>
                          )}
                        </div>
                      </div>
                      <div className="card-actions">
                        <span className={`task-priority-tag priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => openEditTask(i)}
                          className="btn-icon-action"
                          aria-label={`Edit task ${task.title}`}
                          title="Edit Task"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(i)}
                          className="btn-icon-action btn-danger"
                          aria-label={`Delete task ${task.title}`}
                          title="Delete Task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BUDGET TAB */}
            {activeTab === 'budget' && (
              <div className="tab-pane-container">
                {/* Dynamic Budget Banner with real-time recalculation */}
                <div className="budget-summary-banner">
                  <div className="budget-summary-row">
                    <div>
                      <span className="summary-label-sm">Total Estimated Budget</span>
                      <h2 className="budget-sum-val">₹{totalAllocatedBudget.toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="budget-target-col">
                      <span className="summary-label-sm">Target Budget</span>
                      <span className="budget-target-val">₹{targetBudget.toLocaleString('en-IN')}</span>
                      <span className={`budget-status-pill ${budgetDifference >= 0 ? 'status-ok' : 'status-over'}`}>
                        {budgetDifference >= 0
                          ? `₹${budgetDifference.toLocaleString('en-IN')} remaining`
                          : `₹${Math.abs(budgetDifference).toLocaleString('en-IN')} over target`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="tab-pane-header">
                  <div>
                    <h3 className="section-heading">Budget Allocations ({plan.budgetBreakdown.length})</h3>
                    <p className="section-subheading">Amounts recalculate immediately when updated.</p>
                  </div>
                  <button onClick={openAddBudget} className="btn-add-action" aria-label="Add budget item">
                    <Plus size={16} /> Add Category
                  </button>
                </div>

                <div className="budget-preview-list">
                  {plan.budgetBreakdown.map((b, i) => (
                    <div key={i} className="interactive-card budget-card">
                      <div className="card-main-info">
                        <strong className="card-title">{b.category}</strong>
                        {b.notes && <p className="card-notes">{b.notes}</p>}
                      </div>
                      <div className="card-actions">
                        <span className="budget-amount-display">
                          ₹{Number(b.estimatedAmount).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => openEditBudget(i)}
                          className="btn-icon-action"
                          aria-label={`Edit ${b.category} allocation`}
                          title="Edit Allocation"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(i)}
                          className="btn-icon-action btn-danger"
                          aria-label={`Delete ${b.category} allocation`}
                          title="Delete Allocation"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="tab-pane-container">
                <div className="tab-pane-header">
                  <div>
                    <h3 className="section-heading">Milestones ({plan.milestones.length})</h3>
                    <p className="section-subheading">Key deadlines and progress markers.</p>
                  </div>
                  <button onClick={openAddMilestone} className="btn-add-action" aria-label="Add milestone">
                    <Plus size={16} /> Add Milestone
                  </button>
                </div>

                <div className="timeline-preview-list">
                  {plan.milestones.map((m, i) => (
                    <div key={i} className="interactive-card milestone-card">
                      <div className="milestone-icon-wrap">
                        <Clock size={16} />
                      </div>
                      <div className="card-main-info">
                        <strong className="card-title">{m.title}</strong>
                        <p className="card-notes">{m.description}</p>
                      </div>
                      <div className="card-actions">
                        <button
                          onClick={() => openEditMilestone(i)}
                          className="btn-icon-action"
                          aria-label={`Edit milestone ${m.title}`}
                          title="Edit Milestone"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(i)}
                          className="btn-icon-action btn-danger"
                          aria-label={`Delete milestone ${m.title}`}
                          title="Delete Milestone"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* ======================================================== */}
      {/* MODAL 1: EDIT OVERVIEW */}
      {/* ======================================================== */}
      {isOverviewModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsOverviewModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Event Overview</h3>
              <button
                onClick={() => setIsOverviewModalOpen(false)}
                className="btn-icon-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOverview} className="modal-form">
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  required
                  value={overviewForm.eventName}
                  onChange={e => setOverviewForm({ ...overviewForm, eventName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Concept Summary</label>
                <textarea
                  rows={4}
                  value={overviewForm.conceptSummary}
                  onChange={e => setOverviewForm({ ...overviewForm, conceptSummary: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    value={overviewForm.location}
                    onChange={e => setOverviewForm({ ...overviewForm, location: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    value={overviewForm.guestCount}
                    onChange={e => setOverviewForm({ ...overviewForm, guestCount: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsOverviewModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT TASK */}
      {/* ======================================================== */}
      {taskModalMode && (
        <div className="modal-backdrop" onClick={() => setTaskModalMode(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {taskModalMode === 'add' ? 'Add New Task' : 'Edit Task'}
              </h3>
              <button
                onClick={() => setTaskModalMode(null)}
                className="btn-icon-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="modal-form">
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Confirm catering tasting menu"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Catering">Catering</option>
                    <option value="Decor">Decor</option>
                    <option value="Photography">Photography</option>
                    <option value="Invitations">Invitations</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Attire">Attire</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="form-select"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date / Target Timeframe</label>
                <input
                  type="text"
                  placeholder="e.g. 2 weeks before or 2026-11-15"
                  value={taskForm.suggestedDueDate || ''}
                  onChange={e => setTaskForm({ ...taskForm, suggestedDueDate: e.target.value.trim() ? e.target.value : null })}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setTaskModalMode(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {taskModalMode === 'add' ? 'Add Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT BUDGET ITEM */}
      {/* ======================================================== */}
      {budgetModalMode && (
        <div className="modal-backdrop" onClick={() => setBudgetModalMode(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {budgetModalMode === 'add' ? 'Add Budget Category' : 'Edit Budget Item'}
              </h3>
              <button
                onClick={() => setBudgetModalMode(null)}
                className="btn-icon-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="modal-form">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Photography & Videography"
                  value={budgetForm.category}
                  onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  placeholder="e.g. 50000"
                  value={budgetForm.amount}
                  onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Breakdown</label>
                <input
                  type="text"
                  placeholder="e.g. Full-day coverage, edited album, highlight video"
                  value={budgetForm.notes}
                  onChange={e => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setBudgetModalMode(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {budgetModalMode === 'add' ? 'Add Category' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ADD / EDIT MILESTONE */}
      {/* ======================================================== */}
      {milestoneModalMode && (
        <div className="modal-backdrop" onClick={() => setMilestoneModalMode(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {milestoneModalMode === 'add' ? 'Add Milestone' : 'Edit Milestone'}
              </h3>
              <button
                onClick={() => setMilestoneModalMode(null)}
                className="btn-icon-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="modal-form">
              <div className="form-group">
                <label className="form-label">Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Venue Booking Confirmation"
                  value={milestoneForm.title}
                  onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Status Details</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sign contract and deposit paid for venue."
                  value={milestoneForm.description}
                  onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setMilestoneModalMode(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {milestoneModalMode === 'add' ? 'Add Milestone' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: AUTH PROMPT (SAVE PLAN REQUIREMENT) */}
      {/* ======================================================== */}
      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Sign In to Save Plan</h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="btn-icon-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-modal-content">
              <div className="auth-modal-icon">
                <LogIn size={28} />
              </div>
              <h4 className="auth-modal-h4">Save Your Tailored Blueprint</h4>
              <p className="auth-modal-desc">
                Your AI-generated tasks, budget breakdown, and milestones are ready. Create an account or sign in to save this event securely to your CelebrAI workspace.
              </p>

              <button
                type="button"
                className="btn btn-primary btn-full google-signin-btn"
                onClick={handleGoogleSignInFromModal}
                disabled={authLoading}
              >
                {authLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                }}
              >
                Sign In with Email / Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
