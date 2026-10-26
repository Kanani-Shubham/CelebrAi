import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Check,
  MoreVertical,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { getEventTasks, createTask, updateTask, deleteTask } from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
import './TodoList.css';

interface FirestoreTask {
  id: string;
  title: string;
  dueDate: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  eventId: string;
  createdBy?: string;
  createdAt?: unknown;
}

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Guests', 'Invitations', 'Entertainment', 'Transport', 'Other'];

export function TodoList() {
  const { user } = useAuth();
  const { activeEvent } = useEvent();

  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Today' | 'Upcoming' | 'Completed'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Venue');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newDueDate, setNewDueDate] = useState('');
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
      setTasks(data as FirestoreTask[]);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load tasks';
      setError(msg);
      console.error('[TodoList]', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const toggleTask = async (task: FirestoreTask) => {
    if (savingId) return;
    setSavingId(task.id);
    const newCompleted = !task.completed;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t));
    try {
      await updateTask(task.id, { completed: newCompleted });
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
      toast.error('Failed to update task');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !eventId || !user) return;
    setSaving(true);
    try {
      const id = await createTask(eventId, {
        title: newTitle.trim(),
        category: newCategory,
        priority: newPriority,
        dueDate: newDueDate || '',
        completed: false,
      });
      const newTask: FirestoreTask = {
        id,
        title: newTitle.trim(),
        category: newCategory,
        priority: newPriority,
        dueDate: newDueDate || '',
        completed: false,
        eventId,
        createdBy: user.uid,
      };
      setTasks(prev => [newTask, ...prev]);
      setNewTitle('');
      setNewDueDate('');
      setShowAddModal(false);
      toast.success('Task added');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setMenuOpen(null);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
      loadTasks();
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const today = new Date().toISOString().slice(0, 10);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.category.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'Completed') return task.completed;
    if (activeFilter === 'Today') return !task.completed && task.dueDate === today;
    if (activeFilter === 'Upcoming') return !task.completed;
    return true;
  });

  // Empty state when no event selected
  if (!eventId) {
    return (
      <div className="todo-list-page">
        <div className="todo-header">
          <h1 className="todo-heading">Tasks</h1>
        </div>
        <div className="empty-state-container">
          <div className="empty-state-icon">✅</div>
          <h3 className="empty-state-title">No event selected</h3>
          <p className="empty-state-text">Select an event from the dashboard to view its tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list-page">
      <div className="todo-header">
        <div className="todo-title-wrap">
          <h1 className="todo-heading">Tasks</h1>
          <div className="todo-progress-info">
            <span className="todo-progress-text">{completedCount} of {tasks.length} completed</span>
            <span className="todo-progress-percent">{progressPct}%</span>
          </div>
          <div className="todo-bar-track">
            <div className="todo-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="todo-search-wrap">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="todo-filter-chips">
        {(['All', 'Today', 'Upcoming', 'Completed'] as const).map(f => (
          <button
            key={f}
            className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
            {f === 'All' && ` (${tasks.length})`}
            {f === 'Upcoming' && ` (${tasks.filter(t => !t.completed).length})`}
            {f === 'Completed' && ` (${completedCount})`}
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
          <button onClick={loadTasks}>Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No tasks yet</h3>
          <p className="empty-state-text">Add your first task to start planning your event.</p>
        </div>
      )}

      {/* Task list */}
      {!loading && !error && (
        <div className="todo-items-list">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`task-card-item ${task.completed ? 'completed' : ''} ${savingId === task.id ? 'saving' : ''}`}
            >
              <div
                className={`task-check-circle ${task.completed ? 'checked' : ''}`}
                onClick={() => toggleTask(task)}
                role="checkbox"
                aria-checked={task.completed}
              >
                {task.completed && <Check size={12} strokeWidth={3} />}
              </div>

              <div className="task-content-col">
                <div className="task-line-top">
                  <span className="task-name">{task.title}</span>
                  <span className={`priority-pill priority-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                  <button
                    className="task-menu-btn"
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === task.id ? null : task.id); }}
                    aria-label="Task options"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {menuOpen === task.id && (
                    <div className="task-menu-dropdown">
                      <button
                        className="task-menu-item delete"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="task-line-bottom">
                  <span className="task-due-date">
                    {task.dueDate
                      ? task.completed ? `Completed · Due ${task.dueDate}` : `Due ${task.dueDate}`
                      : task.completed ? 'Completed' : 'No due date'}
                  </span>
                  <span className="task-category-tag">{task.category}</span>
                </div>
              </div>
            </div>
          ))}

          {!loading && filteredTasks.length === 0 && tasks.length > 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              No tasks match your filter.
            </p>
          )}
        </div>
      )}

      <button className="add-task-floating-btn" onClick={() => setShowAddModal(true)}>
        <Plus size={20} />
        <span>Add Task</span>
      </button>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Confirm photographer schedule"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value as 'High' | 'Medium' | 'Low')}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                />
              </div>

              <div className="modal-btn-row">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving || !newTitle.trim()}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
