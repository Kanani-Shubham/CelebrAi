import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { TaskItem } from './types';

interface PlanTasksTabProps {
  tasks: TaskItem[];
  onOpenAddTask: () => void;
  onOpenEditTask: (idx: number) => void;
  onDeleteTask: (idx: number) => void;
}

export function PlanTasksTab({
  tasks,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
}: PlanTasksTabProps) {
  return (
    <div className="tab-pane-container">
      <div className="tab-pane-header">
        <div>
          <h3 className="section-heading">Tasks ({tasks.length})</h3>
          <p className="section-subheading">Personalize your task list before saving.</p>
        </div>
        <button onClick={onOpenAddTask} className="btn-add-action" aria-label="Add new task">
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="tasks-preview-list">
        {tasks.map((task, i) => (
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
                onClick={() => onOpenEditTask(i)}
                className="btn-icon-action"
                aria-label={`Edit task ${task.title}`}
                title="Edit Task"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => onDeleteTask(i)}
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
  );
}
