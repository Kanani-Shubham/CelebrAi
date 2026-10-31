import { Check, Plus, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskItem } from '../../../types';
import { calculateTaskStatus } from '../../../utils/taskCalculations';
import { formatDisplayDate } from '../../../utils/dateUtils';

interface DashboardFocusTasksProps {
  tasks: TaskItem[];
  totalTasksCount: number;
  onToggleTask: (task: TaskItem) => void;
}

export function DashboardFocusTasks({
  tasks,
  totalTasksCount,
  onToggleTask,
}: DashboardFocusTasksProps) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-section">
      <div className="section-head-row">
        <h2 className="section-title font-serif">Tasks to Focus On</h2>
        <button className="section-link" onClick={() => navigate('/tasks')}>
          View All ({totalTasksCount})
        </button>
      </div>

      <div className="urgent-tasks-card">
        {tasks.length === 0 ? (
          <div className="hd-empty-box">
            <p className="text-sm mb-3">No pending tasks recorded for this celebration.</p>
            <button className="btn btn-secondary btn-sm rounded-full" onClick={() => navigate('/tasks')}>
              <Plus size={14} /> Add First Task
            </button>
          </div>
        ) : (
          tasks.slice(0, 3).map((task) => {
            const status = calculateTaskStatus(task);
            return (
              <div
                key={task.id}
                className={`urgent-task-item ${task.completed ? 'completed' : ''} status-${status.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onToggleTask(task)}
              >
                <div className={`task-check-circle ${task.completed ? 'checked' : ''}`}>
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="task-info">
                  <span className="task-title-text">{task.title}</span>
                  <div className="task-meta">
                    <span className={`task-status-pill pill-${status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {status === 'Overdue' && <AlertTriangle size={10} />}
                      {status === 'Due Today' && <Clock size={10} />}
                      {status === 'Completed' && <Check size={10} />}
                      <span>{status}</span>
                    </span>
                    {task.dueDate && <span>Due: {formatDisplayDate(task.dueDate)}</span>}
                    {task.priority && (
                      <span className={`task-priority-tag priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
