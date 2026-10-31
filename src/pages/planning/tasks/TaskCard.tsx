import {
  Check,
  MoreVertical,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { calculateTaskStatus } from '../../../utils/taskCalculations';
import type { FirestoreTask } from './types';

interface TaskCardProps {
  task: FirestoreTask;
  isSaving: boolean;
  isMenuOpen: boolean;
  onToggle: (task: FirestoreTask) => void;
  onToggleMenu: () => void;
  onEdit: (task: FirestoreTask) => void;
  onDelete: (id: string, title: string) => void;
}

export function TaskCard({
  task,
  isSaving,
  isMenuOpen,
  onToggle,
  onToggleMenu,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const status = calculateTaskStatus(task);

  return (
    <div
      className={`task-card-item status-${status.toLowerCase().replace(/\s+/g, '-')} ${
        task.completed ? 'completed' : ''
      } ${isSaving ? 'saving' : ''}`}
    >
      <div
        className={`task-check-circle ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu();
            }}
            aria-label="Task options"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div className="task-menu-dropdown">
              <button
                type="button"
                className="task-menu-item"
                onClick={() => onEdit(task)}
              >
                <Edit2 size={13} />
                <span>Edit / Reschedule</span>
              </button>
              <button
                type="button"
                className="task-menu-item delete"
                onClick={() => onDelete(task.id, task.title)}
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
}
