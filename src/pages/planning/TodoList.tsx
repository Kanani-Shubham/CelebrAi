import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { useTasks } from './tasks/useTasks';
import { TaskCard } from './tasks/TaskCard';
import { TaskModal } from './tasks/TaskModal';
import type { FirestoreTask } from './tasks/types';
import './TodoList.css';

export function TodoList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent } = useEvent();
  const eventId = activeEvent?.id;

  const {
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
    reload,
  } = useTasks(eventId, user, activeEvent);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Overdue' | 'Today' | 'Upcoming' | 'Completed'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<FirestoreTask | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredTasks = getFilteredTasks(search, activeFilter);
  const progressPct = tasks.length > 0 ? Math.round((metrics.completed / tasks.length) * 100) : 0;

  const openAddModal = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const openEditModal = (task: FirestoreTask) => {
    setMenuOpen(null);
    setEditingTask(task);
    setShowModal(true);
  };

  const handleModalSave = async (taskData: {
    title: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string | null;
  }) => {
    if (editingTask) {
      return editTask(editingTask.id, taskData);
    } else {
      return addTask(taskData);
    }
  };

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
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Tabs with Live Status Counts */}
      <div className="todo-filter-chips">
        {(
          [
            { key: 'All', label: 'All', count: tasks.length },
            { key: 'Today', label: 'Due Today', count: metrics.dueToday },
            { key: 'Overdue', label: 'Overdue', count: metrics.overdue },
            { key: 'Upcoming', label: 'Pending', count: metrics.pending },
            { key: 'Completed', label: 'Completed', count: metrics.completed },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`filter-chip ${activeFilter === tab.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.key)}
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
          <button type="button" onClick={reload}>Retry</button>
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
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSaving={savingId === task.id}
              isMenuOpen={menuOpen === task.id}
              onToggle={toggleTask}
              onToggleMenu={() => setMenuOpen(menuOpen === task.id ? null : task.id)}
              onEdit={openEditModal}
              onDelete={removeTask}
            />
          ))}

          {filteredTasks.length === 0 && tasks.length > 0 && (
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
      <TaskModal
        isOpen={showModal}
        editingTask={editingTask}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
        }}
        onSave={handleModalSave}
      />
    </div>
  );
}
