import type { EventItem } from '../../types';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { type Event } from '../../contexts/EventContext';
import { useEvent } from '../../contexts/useEvent';
import { useAuth } from '../../contexts/useAuth';
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
import { toast } from '../../components/ui/toast';
import { logger } from '../../utils/logger';

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
import { usePlanModalsState } from './plan/usePlanModalsState';

import './AIPlanPreview.css';

export function AIPlanPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeEvent, setActiveEvent, refresh: refreshEvents } = useEvent();
  const { user, idToken } = useAuth();

  const queryEventId = searchParams.get('eventId');
  const [targetEvent, setTargetEvent] = useState<EventItem | Record<string, unknown> | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'budget' | 'timeline'>('overview');
  const [plan, setPlan] = useState<AIPlanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const modals = usePlanModalsState({
    plan,
    setPlan,
    targetEvent,
    setTargetEvent,
  });

  // Resolve target event from query params or localStorage
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
        setTargetEvent(activeEvent);
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

  const fetchOrGeneratePlan = useCallback(async () => {
    const evt = targetEvent;
    if (!evt) return;
    if (evt.savedPlan) {
      setPlan(validateAIPlan(evt.savedPlan));
      return;
    }
    try {
      const result = await generateEventPlan(
        {
          eventName: String(evt.eventName || 'Our Celebration'),
          eventType: String(evt.eventType || 'Celebration'),
          eventDate: String(evt.eventDate || evt.date || 'TBD'),
          location: String(evt.location || 'India'),
          guestCount: Number(evt.guestCount) || 100,
          budget: Number(evt.budget) || 0,
          currency: String(evt.currency || '₹'),
          theme: String(evt.theme || 'Classic Elegance'),
          requirements: String(evt.requirements || ''),
        },
        idToken || ''
      );
      setPlan(validateAIPlan(result));
    } catch (err) {
      setError((err as Error).message || 'Failed to generate plan.');
    }
  }, [targetEvent, idToken]);

  useEffect(() => {
    if (!targetEvent) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        await fetchOrGeneratePlan();
      } catch (err) {
        if (isMounted) setError((err as Error).message || 'Failed to generate plan.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [targetEvent, fetchOrGeneratePlan]);

  const totalAllocatedBudget = plan?.budgetBreakdown
    ? plan.budgetBreakdown.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 0), 0)
    : 0;

  const targetBudget = Number(targetEvent?.budget) || 0;
  const budgetDifference = targetBudget - totalAllocatedBudget;

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
          <div className="plan-offline-notice" role="status">
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
                newThemeTag={modals.newThemeTag}
                onOpenOverviewModal={modals.openOverviewModal}
                onNewThemeTagChange={modals.setNewThemeTag}
                onAddThemeTag={modals.handleAddThemeTag}
                onDeleteThemeTag={modals.handleDeleteThemeTag}
              />
            )}

            {activeTab === 'tasks' && (
              <PlanTasksTab
                tasks={plan.tasks}
                onOpenAddTask={modals.openAddTask}
                onOpenEditTask={modals.openEditTask}
                onDeleteTask={modals.handleDeleteTask}
              />
            )}

            {activeTab === 'budget' && (
              <PlanBudgetTab
                budgetBreakdown={plan.budgetBreakdown}
                totalAllocatedBudget={totalAllocatedBudget}
                targetBudget={targetBudget}
                budgetDifference={budgetDifference}
                onOpenAddBudget={modals.openAddBudget}
                onOpenEditBudget={modals.openEditBudget}
                onDeleteBudget={modals.handleDeleteBudget}
              />
            )}

            {activeTab === 'timeline' && (
              <PlanTimelineTab
                milestones={plan.milestones}
                onOpenAddMilestone={modals.openAddMilestone}
                onOpenEditMilestone={modals.openEditMilestone}
                onDeleteMilestone={modals.handleDeleteMilestone}
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
        isOpen={modals.isOverviewModalOpen}
        form={modals.overviewForm}
        onFormChange={modals.setOverviewForm}
        onClose={() => modals.setIsOverviewModalOpen(false)}
        onSave={modals.handleSaveOverview}
      />

      <TaskModal
        mode={modals.taskModalMode}
        form={modals.taskForm}
        onFormChange={modals.setTaskForm}
        onClose={() => modals.setTaskModalMode(null)}
        onSave={modals.handleSaveTask}
      />

      <BudgetModal
        mode={modals.budgetModalMode}
        form={modals.budgetForm}
        onFormChange={modals.setBudgetForm}
        onClose={() => modals.setBudgetModalMode(null)}
        onSave={modals.handleSaveBudget}
      />

      <MilestoneModal
        mode={modals.milestoneModalMode}
        form={modals.milestoneForm}
        onFormChange={modals.setMilestoneForm}
        onClose={() => modals.setMilestoneModalMode(null)}
        onSave={modals.handleSaveMilestone}
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
