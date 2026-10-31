import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from '../../../components/ui/toast';
import { validateTaskDueDate } from '../../../utils/taskCalculations';
import { CATEGORIES, type FirestoreTask } from './types';

interface TaskModalProps {
  isOpen: boolean;
  editingTask: FirestoreTask | null;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string | null;
  }) => Promise<boolean>;
}

export function TaskModal({
  isOpen,
  editingTask,
  onClose,
  onSave,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Venue');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const [prevTask, setPrevTask] = useState(editingTask);
  if (editingTask !== prevTask) {
    setPrevTask(editingTask);
    if (editingTask) {
      setTitle(editingTask.title || '');
      setCategory(editingTask.category || 'Venue');
      setPriority(editingTask.priority || 'Medium');
      setDueDate(editingTask.dueDate || '');
    } else {
      setTitle('');
      setCategory('Venue');
      setPriority('Medium');
      setDueDate('');
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (dueDate) {
      const validation = validateTaskDueDate(dueDate);
      if (!validation.isValid) {
        toast.error(validation.error || 'Please enter a valid calendar date (YYYY-MM-DD)');
        return;
      }

      if (validation.isPast && (!editingTask || !editingTask.completed)) {
        const confirmed = window.confirm(
          `Notice: The selected deadline (${dueDate}) is in the past.\n\nSaving this incomplete task will immediately mark it as Overdue.\n\nDo you want to proceed with this deadline?`
        );
        if (!confirmed) return;
      }
    }

    setSaving(true);
    const success = await onSave({
      title: title.trim(),
      category,
      priority,
      dueDate: dueDate || null,
    });
    setSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title font-serif">
          {editingTask ? 'Edit Task' : 'Add New Task'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Confirm photographer arrival time"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
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
              onChange={(e) => setDueDate(e.target.value)}
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
            <button type="button" className="btn-cancel" onClick={onClose}>
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
  );
}
