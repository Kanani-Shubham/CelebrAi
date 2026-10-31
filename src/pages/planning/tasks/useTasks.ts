import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../../../utils/logger';
import { toast } from '../../../components/ui/toast';
import {
  getEventTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../../../services/firebase/firestore';
import {
  calculateTaskStatus,
  aggregateTaskMetrics,
  type TaskStatus,
} from '../../../utils/taskCalculations';
import { runTaskAndEventAudit } from '../../../services/notifications/notificationEngine';
import type { EventItem } from '../../../types';
import type { FirestoreTask } from './types';

export function useTasks(
  eventId?: string,
  user?: { uid: string } | null,
  activeEvent?: EventItem | null
) {
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchTasks() {
      if (!eventId) {
        if (!ignore) {
          setTasks([]);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await getEventTasks(eventId);
        if (ignore) return;
        const loadedTasks = data as unknown as FirestoreTask[];
        setTasks(loadedTasks);
        if (user && activeEvent && !activeEvent.id.startsWith('evt-')) {
          runTaskAndEventAudit({
            userId: user.uid,
            event: activeEvent,
            tasks: loadedTasks,
          }).catch(err => logger.warn('[TodoList] Audit trigger skipped:', err));
        }
      } catch (err) {
        if (!ignore) setError((err as Error).message || 'Failed to load tasks');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchTasks();
    return () => { ignore = true; };
  }, [eventId, user, activeEvent]);

  const loadTasks = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await getEventTasks(eventId);
      setTasks(data as unknown as FirestoreTask[]);
    } catch (err) {
      setError((err as Error).message || 'Failed to load tasks');
    }
  }, [eventId]);

  const metrics = useMemo(() => aggregateTaskMetrics(tasks), [tasks]);

  const toggleTask = async (task: FirestoreTask) => {
    if (savingId) return;
    setSavingId(task.id);
    const newCompleted = !task.completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;

    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, completed: newCompleted, completedAt } : t))
    );

    try {
      await updateTask(task.id, {
        completed: newCompleted,
        completedAt,
      });
      toast.success(newCompleted ? 'Task marked completed' : 'Task reopened as pending');
    } catch (err) {
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
      toast.error('Failed to update task');
      logger.error('[TodoList] Toggle error:', err);
    } finally {
      setSavingId(null);
    }
  };

  const addTask = async (newTaskData: {
    title: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string | null;
  }) => {
    if (!eventId || !user) return false;
    try {
      const id = await createTask(eventId, {
        ...newTaskData,
        completed: false,
      });
      const newTask: FirestoreTask = {
        id,
        ...newTaskData,
        completed: false,
        eventId,
        createdBy: user.uid,
      };
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task added successfully');
      return true;
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save task');
      logger.error('[TodoList] Save error:', err);
      return false;
    }
  };

  const editTask = async (
    id: string,
    updatedFields: {
      title: string;
      category: string;
      priority: 'High' | 'Medium' | 'Low';
      dueDate: string | null;
    }
  ) => {
    try {
      await updateTask(id, updatedFields);
      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updatedFields } : t))
      );
      toast.success('Task updated successfully');
      return true;
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save task');
      logger.error('[TodoList] Save error:', err);
      return false;
    }
  };

  const removeTask = async (taskId: string, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
      return;
    }

    const previous = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
    } catch (err) {
      setTasks(previous);
      toast.error('Failed to delete task');
      logger.error('[TodoList] Delete error:', err);
    }
  };

  const getFilteredTasks = (
    search: string,
    filter: 'All' | 'Overdue' | 'Today' | 'Upcoming' | 'Completed'
  ) => {
    return tasks.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.category.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      const status: TaskStatus = calculateTaskStatus(task);
      if (filter === 'Completed') return status === 'Completed';
      if (filter === 'Overdue') return status === 'Overdue';
      if (filter === 'Today') return status === 'Due Today';
      if (filter === 'Upcoming') return status === 'Pending' || status === 'Due Today';
      return true;
    });
  };

  return {
    tasks,
    loading,
    savingId,
    error,
    metrics,
    toggleTask,
    addTask,
    editTask,
    removeTask,
    getFilteredTasks,
    reload: loadTasks,
  };
}
