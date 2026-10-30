import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Check,
  MoreVertical,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Edit2,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { getEventTasks, createTask, updateTask, deleteTask } from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
import {
  calculateTaskStatus,
  validateTaskDueDate,
  aggregateTaskMetrics,
  type TaskStatus,
} from '../../utils/taskCalculations';
import { runTaskAndEventAudit } from '../../services/notifications/notificationEngine';
import './TodoList.css';

interface FirestoreTask {
  id: string;
  title: string;
  dueDate?: string | null;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  completedAt?: unknown;
  eventId: string;
  createdBy?: string;
  createdAt?: unknown;
}

const CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Decor',
  'Guests',
  'Invitations',
  'Entertainment',
  'Transport',
  'Other',
];

export function TodoList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent } = useEvent();

  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Overdue' | 'Today' | 'Upcoming' | 'Completed'>('All');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<FirestoreTask | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Venue');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const eventId = activeEvent?.id;

  const loadTasks = useCallback(async () => {
    if (!eventId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getEventTasks(eventId);
      const loadedTasks = data as FirestoreTask[];
      setTasks(loadedTasks);

      // Trigger smart notification audit check for tasks & deadlines
      if (user && activeEvent && !activeEvent.id.startsWith('evt-')) {
        runTaskAndEventAudit({
          userId: user.uid,
          event: activeEvent,
          tasks: loadedTasks,
        }).catch(err => console.warn('[TodoList] Audit trigger skipped:', err));
      }
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load tasks';
      setError(msg);
      console.error('[TodoList] Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, user, activeEvent]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Aggregate metrics using single source of truth function
  const metrics = useMemo(() => {
    return aggregateTaskMetrics(tasks);
  }, [tasks]);

  const toggleTask = async (task: FirestoreTask) => {
    if (savingId) return;
    setSavingId(task.id);
    const newCompleted = !task.completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;

    // Optimistic update
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
      // Revert on failure
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
      toast.error('Failed to update task');
      console.error('[TodoList] Toggle error:', err);
    } finally {
      setSavingId(null);
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setCategory('Venue');
    setPriority('Medium');
    setDueDate('');
    setShowModal(true);
  };

  const openEditModal = (task: FirestoreTask) => {
    setMenuOpen(null);
    setEditingTask(task);
    setTitle(task.title || '');
    setCategory(task.category || 'Venue');
    setPriority(task.priority || 'Medium');
    setDueDate(task.dueDate || '');
    setShowModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventId || !user) return;

    // Validate Due Date
    if (dueDate) {
      const validation = validateTaskDueDate(dueDate);
      if (!validation.isValid) {
        toast.error(validation.error || 'Please enter a valid calendar date (YYYY-MM-DD)');
        return;
      }

      // Past date rule: Require explicit user confirmation before saving incomplete task as Overdue
      if (validation.isPast && (!editingTask || !editingTask.completed)) {
        const confirmed = window.confirm(
          `Notice: The selected deadline (${dueDate}) is in the past.\n\nSaving this incomplete task will immediately mark it as Overdue.\n\nDo you want to proceed with this deadline?`
        );
        if (!confirmed) {
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (editingTask) {
        const updatedFields = {
          title: title.trim(),
          category,
          priority,
          dueDate: dueDate || null,
        };

        await updateTask(editingTask.id, updatedFields);
        setTasks(prev =>
          prev.map(t => (t.id === editingTask.id ? { ...t, ...updatedFields } : t))
        );
        toast.success('Task updated successfully');
      } else {
        const newTaskData = {
          title: title.trim(),
          category,
          priority,
          dueDate: dueDate || null,
          completed: false,
        };

        const id = await createTask(eventId, newTaskData);
        const newTask: FirestoreTask = {
          id,
          ...newTaskData,
          eventId,
          createdBy: user.uid,
        };
        setTasks(prev => [newTask, ...prev]);
        toast.success('Task added successfully');
      }

      setShowModal(false);
      setEditingTask(null);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save task');
      console.error('[TodoList] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    setMenuOpen(null);
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
      console.error('[TodoList] Delete error:', err);
    }
  };

  // Filter tasks using unified status calculations
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.category.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const status: TaskStatus = calculateTaskStatus(task);

    if (activeFilter === 'Completed') return status === 'Completed';
    if (activeFilter === 'Overdue') return status === 'Overdue';
    if (activeFilter === 'Today') return status === 'Due Today';
    if (activeFilter === 'Upcoming') return status === 'Pending' || status === 'Due Today';
    return true;
  });

  const progressPct = tasks.length > 0 ? Math.round((metrics.completed / tasks.length) * 100) : 0;

  // Empty state when no event selected
  if (!eventId) {
    return (
      <div className="todo-list-page">
        <div className="todo-top-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft size={22} />
          </button>
          <h1 className="todo-heading">Tasks</h1>
        </div>
        <div className="empty-state-container">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No event selected</h3>
          <p className="empty-state-text">Select or create an event from the dashboard to manage tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list-page">
      {/* Top Header with Back Navigation */}
      <div className="todo-top-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          title="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="todo-title-wrap">
          <h1 className="todo-heading">Tasks & Run Sheet</h1>
          <span className="todo-sub-heading">
            {activeEvent?.eventName ? `Planning "${activeEvent.eventName}"` : 'Event tasks'}
          </span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="todo-progress-card">
        <div className="todo-progress-info">
          <span className="todo-progress-text">
            <strong>{metrics.completed}</strong> of <strong>{tasks.length}</strong> tasks completed
          </span>
          <span className="todo-progress-percent">{progressPct}%</span>
        </div>
        <div className="todo-bar-track">
          <div className="todo-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Search Input */}
      <div className="todo-search-wrap">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search tasks by name or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Tabs with Live Status Counts */}
      <div className="todo-filter-chips">
        {[
          { key: 'All', label: 'All', count: tasks.length },
          { key: 'Today', label: 'Due Today', count: metrics.dueToday },
          { key: 'Overdue', label: 'Overdue', count: metrics.overdue },
          { key: 'Upcoming', label: 'Pending', count: metrics.pending },
          { key: 'Completed', label: 'Completed', count: metrics.completed },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`filter-chip ${activeFilter === tab.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.key as any)}
          >
            <span>{tab.label}</span>
            <span className="filter-count">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="tasks-loading-state">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading tasks...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="tasks-error-state">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button type="button" onClick={loadTasks}>Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No tasks yet</h3>
          <p className="empty-state-text">Add your first task to start coordinating this celebration.</p>
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add First Task</span>
          </button>
        </div>
      )}

      {/* Task list */}
      {!loading && !error && (
        <div className="todo-items-list">
          {filteredTasks.map(task => {
            const status = calculateTaskStatus(task);
            return (
              <div
                key={task.id}
                className={`task-card-item status-${status.toLowerCase().replace(/\s+/g, '-')} ${task.completed ? 'completed' : ''} ${savingId === task.id ? 'saving' : ''}`}
              >
                <div
                  className={`task-check-circle ${task.completed ? 'checked' : ''}`}
                  onClick={() => toggleTask(task)}
                  role="checkbox"
                  aria-checked={task.completed}
                  title={task.completed ? 'Mark pending' : 'Mark completed'}
                >
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </div>

                <div className="task-content-col">
                  <div className="task-line-top">
                    <span className="task-name">{task.title}</span>

                    <span className={`task-status-pill pill-${status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {status === 'Overdue' && <AlertTriangle size={11} />}
                      {status === 'Due Today' && <Clock size={11} />}
                      {status === 'Completed' && <Check size={11} />}
                      <span>{status}</span>
                    </span>

                    <span className={`priority-pill priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>

                    <button
                      type="button"
                      className="task-menu-btn"
                      onClick={e => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === task.id ? null : task.id);
                      }}
                      aria-label="Task options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {menuOpen === task.id && (
                      <div className="task-menu-dropdown">
                        <button
                          type="button"
                          className="task-menu-item"
                          onClick={() => openEditModal(task)}
                        >
                          <Edit2 size={13} />
                          <span>Edit / Reschedule</span>
                        </button>
                        <button
                          type="button"
                          className="task-menu-item delete"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="task-line-bottom">
                    <span className="task-due-date">
                      {task.dueDate ? (
                        task.completed ? (
                          `Completed · Due was ${task.dueDate}`
                        ) : status === 'Overdue' ? (
                          `Overdue deadline: ${task.dueDate}`
                        ) : status === 'Due Today' ? (
                          `Due Today (${task.dueDate})`
                        ) : (
                          `Due on ${task.dueDate}`
                        )
                      ) : (
                        'No deadline set'
                      )}
                    </span>
                    <span className="task-category-tag">{task.category}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && filteredTasks.length === 0 && tasks.length > 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              No tasks match your "{activeFilter}" filter.
            </p>
          )}
        </div>
      )}

      {/* Floating Add Task Button */}
      <button type="button" className="add-task-floating-btn" onClick={openAddModal}>
        <Plus size={20} />
        <span>Add Task</span>
      </button>

      {/* Add / Edit Task Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title font-serif">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Confirm photographer arrival time"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Due Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
                <span className="date-hint">
                  {dueDate && validateTaskDueDate(dueDate).isPast && (
                    <span className="past-date-warning">
                      ⚠️ Note: This date is in the past. If saved incomplete, this task will be marked Overdue.
                    </span>
                  )}
                </span>
              </div>

              <div className="modal-btn-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving || !title.trim()}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : editingTask ? (
                    'Save Changes'
                  ) : (
                    'Add Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
