import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import type { MilestoneItem } from './types';

interface PlanTimelineTabProps {
  milestones: MilestoneItem[];
  onOpenAddMilestone: () => void;
  onOpenEditMilestone: (idx: number) => void;
  onDeleteMilestone: (idx: number) => void;
}

export function PlanTimelineTab({
  milestones,
  onOpenAddMilestone,
  onOpenEditMilestone,
  onDeleteMilestone,
}: PlanTimelineTabProps) {
  return (
    <div className="tab-pane-container">
      <div className="tab-pane-header">
        <div>
          <h3 className="section-heading">Milestones ({milestones.length})</h3>
          <p className="section-subheading">Key deadlines and progress markers.</p>
        </div>
        <button onClick={onOpenAddMilestone} className="btn-add-action" aria-label="Add milestone">
          <Plus size={16} /> Add Milestone
        </button>
      </div>

      <div className="timeline-preview-list">
        {milestones.map((m, i) => (
          <div key={i} className="interactive-card milestone-card">
            <div className="milestone-icon-wrap">
              <Clock size={16} />
            </div>
            <div className="card-main-info">
              <strong className="card-title">{m.title}</strong>
              <p className="card-notes">{m.description}</p>
            </div>
            <div className="card-actions">
              <button
                onClick={() => onOpenEditMilestone(i)}
                className="btn-icon-action"
                aria-label={`Edit milestone ${m.title}`}
                title="Edit Milestone"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => onDeleteMilestone(i)}
                className="btn-icon-action btn-danger"
                aria-label={`Delete milestone ${m.title}`}
                title="Delete Milestone"
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
