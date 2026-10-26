import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  generateEventPlan,
  validateAIPlan,
  type AIPlanResult,
} from '../../services/ai/groq';
import {
  getDocById,
  updateEvent,
  createTask,
  createExpense,
} from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
import './AIPlanPreview.css';

export function AIPlanPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeEvent, refresh: refreshEvents } = useEvent();
  const { user, idToken } = useAuth();

  const queryEventId = searchParams.get('eventId');
  const [targetEvent, setTargetEvent] = useState<Record<string, unknown> | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'budget' | 'timeline'>('overview');
  const [plan, setPlan] = useState<AIPlanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  // 1. Resolve target event data
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
          console.warn('Could not fetch event from query ID:', err);
        }
      }
      if (activeEvent) {
        setTargetEvent(activeEvent as unknown as Record<string, unknown>);
      }
    }
    resolveEvent();
  }, [queryEventId, activeEvent]);

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
    const budget = Number(targetEvent.budget) || 500000;
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

  // 3. Save approved plan to Firestore
  const handleSavePlan = async () => {
    if (!plan || !targetEvent || planSaved || savingPlan) return;
    const eventId = String(targetEvent.id || queryEventId || activeEvent?.id);
    if (!eventId) {
      toast.error('No event ID found');
      return;
    }

    setSavingPlan(true);
    try {
      // 1. Create tasks in Firestore
      for (const t of plan.tasks) {
        await createTask(eventId, {
          title: t.title,
          category: t.category,
          priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
          dueDate: t.suggestedDueDate || '',
          completed: false,
        });
      }

      // 2. Create budget breakdown items in Firestore
      for (const b of plan.budgetBreakdown) {
        await createExpense(eventId, {
          vendorName: 'Estimated Allocation',
          title: b.category,
          category: b.category,
          amount: b.estimatedAmount,
          status: 'Pending',
          notes: b.notes || '',
        });
      }

      // 3. Update the event with the plan summary and milestones
      await updateEvent(eventId, {
        planSummary: plan.eventSummary,
        themeSuggestions: plan.themeSuggestions,
        milestones: plan.milestones,
        tasksTotal: plan.tasks.length,
        savedPlan: plan,
      });

      setPlanSaved(true);
      await refreshEvents();
      toast.success('AI plan saved successfully! Tasks and budget are ready.');
      navigate('/dashboard');
    } catch (err) {
      console.error('[AIPlanPreview] Save plan error:', err);
      toast.error('Failed to save plan items: ' + (err as Error).message);
    } finally {
      setSavingPlan(false);
    }
  };

  const eventName = String(targetEvent?.eventName || 'Our Celebration');
  const eventDate = String(targetEvent?.eventDate || targetEvent?.date || 'TBD');
  const location = String(targetEvent?.location || 'India');
  const guestCount = Number(targetEvent?.guestCount) || 100;
  const budget = Number(targetEvent?.budget) || 500000;

  return (
    <div className="page-container ai-plan-page">
      <header className="page-header-nav">
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
      </header>

      <div className="ai-plan-hero">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F3E8FF', color: '#7E57C2', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
          <Sparkles size={14} /> Powered by GPT-OSS 120B
        </div>
        <h1 className="ai-plan-title">Your AI Event Plan ✨</h1>
        <p className="ai-plan-subtitle">
          Tailored blueprint generated for <strong>{eventName}</strong> based on your preferences.
        </p>
      </div>

      <div className="plan-tabs">
        {(['overview', 'tasks', 'budget', 'timeline'] as const).map(tab => (
          <button
            key={tab}
            className={`plan-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="plan-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto', color: '#7E57C2' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', marginTop: '16px', color: 'var(--color-tuxedo-black)' }}>
              Generating Master Event Blueprint...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px', margin: '8px auto 0' }}>
              Groq GPT-OSS 120B is analyzing your requirements, generating tailored tasks, budget allocations, and key milestones.
            </p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-lg)' }}>
            <AlertCircle size={32} style={{ color: '#DC2626', margin: '0 auto 8px' }} />
            <h3 style={{ color: '#991B1B', margin: 0 }}>Plan Generation Problem</h3>
            <p style={{ color: '#7F1D1D', fontSize: '14px', margin: '8px 0 16px' }}>{error}</p>
            <button
              className="btn btn-primary"
              onClick={fetchOrGeneratePlan}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)' }}
            >
              Try Again
            </button>
          </div>
        ) : plan ? (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <div className="plan-card">
                  <div className="plan-card-body">
                    <h3 className="plan-event-name">{eventName}</h3>
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
                        <span>₹{budget.toLocaleString('en-IN')} Budget</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="summary-box">
                  <span className="summary-label">Concept Summary</span>
                  <p className="summary-text">{plan.eventSummary}</p>
                </div>

                {plan.themeSuggestions.length > 0 && (
                  <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '8px' }}>
                      Suggested Themes
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {plan.themeSuggestions.map((th, i) => (
                        <span key={i} style={{ background: '#F7F1E8', color: 'var(--color-tuxedo-black)', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 500 }}>
                          {th}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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

                {plan.recommendations.length > 0 && (
                  <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', marginTop: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '8px' }}>
                      AI Recommendations
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                      {plan.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="tasks-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.tasks.map((task, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#FFFFFF',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--color-tuxedo-black)', display: 'block' }}>{task.title}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{task.category}</span>
                    </div>
                    <span className={`task-priority-tag priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Budget Tab */}
            {activeTab === 'budget' && (
              <div className="budget-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.budgetBreakdown.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#FFFFFF',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--color-tuxedo-black)', display: 'block' }}>{b.category}</strong>
                      {b.notes && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.notes}</span>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--color-tuxedo-black)' }}>
                      ₹{b.estimatedAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="timeline-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.milestones.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#FFFFFF',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', background: '#F7F1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--color-tuxedo-black)', display: 'block' }}>{m.title}</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
                onClick={handleSavePlan}
                disabled={savingPlan || planSaved}
              >
                {savingPlan ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving Tasks & Budget to Event...</span>
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
    </div>
  );
}
