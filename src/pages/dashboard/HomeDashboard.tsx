import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Palette,
  PieChart,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { useAuth } from '../../contexts/useAuth';
import {
  getEventTasks,
  updateTask,
  getEventExpenses,
  getEventGuests,
} from '../../services/firebase/firestore';
import type { TaskItem } from '../../types';
import { calculateDaysCountdown } from '../../utils/dateUtils';
import {
  calculateTaskStatus,
  aggregateTaskMetrics,
} from '../../utils/taskCalculations';
import { runTaskAndEventAudit } from '../../services/notifications/notificationEngine';
import { logger } from '../../utils/logger';

import { DashboardEmptyState } from './components/DashboardEmptyState';
import { DashboardCountdownHero } from './components/DashboardCountdownHero';
import { DashboardMetricsGrid } from './components/DashboardMetricsGrid';
import { DashboardFocusTasks } from './components/DashboardFocusTasks';

import './HomeDashboard.css';

export function HomeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent, loading: eventLoading } = useEvent();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  const eventId = activeEvent?.id;

  useEffect(() => {
    let ignore = false;
    async function loadDashboard() {
      if (!eventId || eventId.startsWith('demo-') || eventId.startsWith('evt-sample')) {
        if (!ignore) {
          setTasksTotal(12);
          setTotalSpent(285000);
          setGuestCount(250);
          setRsvpCount(180);
          setLoadingData(false);
        }
        return;
      }

      try {
        const taskDocs = await getEventTasks(eventId);
        if (ignore) return;
        setTasks(taskDocs);
        setTasksTotal(taskDocs.length);

        if (user && activeEvent && !activeEvent.id.startsWith('evt-')) {
          runTaskAndEventAudit({
            userId: user.uid,
            event: activeEvent,
            tasks: taskDocs,
          }).catch(err => logger.warn('[HomeDashboard] Audit check skipped:', err));
        }

        const expenseDocs = await getEventExpenses(eventId);
        if (ignore) return;
        const spent = expenseDocs.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        setTotalSpent(spent);

        const guestDocs = await getEventGuests(eventId);
        if (ignore) return;
        const totalGuests = guestDocs.reduce((sum, g) => sum + (Number(g.partySize) || 1), 0);
        const confirmedRsvps = guestDocs
          .filter(g => g.status === 'Accepted')
          .reduce((sum, g) => sum + (Number(g.partySize) || 1), 0);

        setGuestCount(totalGuests > 0 ? totalGuests : Number(activeEvent?.guestCount) || 0);
        setRsvpCount(confirmedRsvps);
      } catch (err) {
        logger.warn('[HomeDashboard] Error loading dashboard records from Firestore:', err);
      } finally {
        if (!ignore) setLoadingData(false);
      }
    }

    void loadDashboard();
    return () => {
      ignore = true;
    };
  }, [eventId, user, activeEvent]);

  const toggleTask = async (task: TaskItem) => {
    const newCompleted = !task.completed;
    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, completed: newCompleted } : t))
    );

    try {
      if (eventId && !eventId.startsWith('evt-demo') && !eventId.startsWith('demo-')) {
        await updateTask(task.id, { completed: newCompleted });
      }
    } catch (err) {
      logger.error('[HomeDashboard] Error toggling task:', err);
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
    }
  };

  const countdown = useMemo(() => {
    return calculateDaysCountdown(activeEvent?.eventDate || activeEvent?.date);
  }, [activeEvent?.eventDate, activeEvent?.date]);

  const taskMetrics = useMemo(() => aggregateTaskMetrics(tasks), [tasks]);

  const focusTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const statusA = calculateTaskStatus(a);
      const statusB = calculateTaskStatus(b);
      const score = (s: string) => (s === 'Overdue' ? 0 : s === 'Due Today' ? 1 : 2);
      if (score(statusA) !== score(statusB)) return score(statusA) - score(statusB);

      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [tasks]);

  const plannedBudget = Number(activeEvent?.budget) || 0;
  const budgetLeft = Math.max(0, plannedBudget - totalSpent);

  if (eventLoading || (eventId && loadingData && tasks.length === 0)) {
    return (
      <div className="home-dashboard flex-center min-h-60">
        <Loader2 className="animate-spin text-tuxedo" size={32} />
      </div>
    );
  }

  if (!activeEvent) {
    return <DashboardEmptyState displayName={user?.displayName} />;
  }

  return (
    <div className="home-dashboard">
      {/* Hero Banner with real active event */}
      <DashboardCountdownHero event={activeEvent} countdown={countdown} />

      {/* 4 Stat Badges computed from real records */}
      <DashboardMetricsGrid
        budgetLeft={budgetLeft}
        completedTasks={taskMetrics.completed}
        totalTasks={tasks.length || tasksTotal}
        overdueTasks={taskMetrics.overdue}
        guestCount={guestCount}
        rsvpCount={rsvpCount}
      />

      {/* 4 Quick Action Square Tiles */}
      <div className="quick-action-tiles">
        <button className="action-tile" onClick={() => navigate('/vendors')}>
          <div className="tile-icon-bg">
            <Store size={20} />
          </div>
          <span>Vendors</span>
        </button>

        <button className="action-tile" onClick={() => navigate('/decor')}>
          <div className="tile-icon-bg">
            <Palette size={20} />
          </div>
          <span>Decor</span>
        </button>

        <button className="action-tile" onClick={() => navigate('/budget')}>
          <div className="tile-icon-bg">
            <PieChart size={20} />
          </div>
          <span>Budget</span>
        </button>

        <button className="action-tile" onClick={() => navigate('/team')}>
          <div className="tile-icon-bg">
            <UserCheck size={20} />
          </div>
          <span>Team</span>
        </button>
      </div>

      {/* Urgent Tasks Section */}
      <DashboardFocusTasks
        tasks={focusTasks}
        totalTasksCount={tasks.length || tasksTotal}
        onToggleTask={toggleTask}
      />
    </div>
  );
}
