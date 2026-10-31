import React from 'react';
import { Calendar, MapPin, Users, DollarSign, Pencil, X, Plus } from 'lucide-react';
import type { AIPlanResult } from '../../../services/ai/groq';

interface PlanOverviewTabProps {
  eventName: string;
  eventDate: string;
  location: string;
  guestCount: number;
  targetBudget: number;
  plan: AIPlanResult;
  newThemeTag: string;
  onOpenOverviewModal: () => void;
  onNewThemeTagChange: (val: string) => void;
  onAddThemeTag: (e: React.FormEvent) => void;
  onDeleteThemeTag: (tag: string) => void;
}

export function PlanOverviewTab({
  eventName,
  eventDate,
  location,
  guestCount,
  targetBudget,
  plan,
  newThemeTag,
  onOpenOverviewModal,
  onNewThemeTagChange,
  onAddThemeTag,
  onDeleteThemeTag,
}: PlanOverviewTabProps) {
  return (
    <>
      <div className="plan-card">
        <div className="plan-card-body">
          <div className="card-header-row">
            <h3 className="plan-event-name">{eventName}</h3>
            <button
              onClick={onOpenOverviewModal}
              className="btn-edit-icon"
              aria-label="Edit event details"
              title="Edit event details"
            >
              <Pencil size={15} /> Edit
            </button>
          </div>
          <div className="plan-meta-grid">
            <div className="plan-meta-item">
              <Calendar size={14} />
              <span>{eventDate}</span>
            </div>
            <div className="plan-meta-item">
              <MapPin size={14} />
              <span>{location}</span>
            </div>
            <div className="plan-meta-item">
              <Users size={14} />
              <span>{guestCount} Guests</span>
            </div>
            <div className="plan-meta-item">
              <DollarSign size={14} />
              <span>₹{targetBudget.toLocaleString('en-IN')} Budget</span>
            </div>
          </div>
        </div>
      </div>

      {/* Concept Summary */}
      <div className="summary-box">
        <div className="card-header-row">
          <span className="summary-label">Concept Summary</span>
          <button
            onClick={onOpenOverviewModal}
            className="btn-edit-icon-sm"
            aria-label="Edit concept summary"
          >
            <Pencil size={13} />
          </button>
        </div>
        <p className="summary-text">{plan.eventSummary}</p>
      </div>

      {/* Suggested Themes with Add/Delete */}
      <div className="theme-box">
        <div className="card-header-row">
          <span className="summary-label">Suggested Themes</span>
        </div>
        <div className="theme-tags-wrap">
          {plan.themeSuggestions.map((th, i) => (
            <span key={i} className="theme-tag">
              <span>{th}</span>
              <button
                type="button"
                onClick={() => onDeleteThemeTag(th)}
                className="theme-tag-del"
                aria-label={`Remove theme ${th}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={onAddThemeTag} className="add-theme-form">
          <input
            type="text"
            placeholder="Add another theme..."
            value={newThemeTag}
            onChange={(e) => onNewThemeTagChange(e.target.value)}
            className="add-theme-input"
          />
          <button
            type="submit"
            disabled={!newThemeTag.trim()}
            className="btn-add-theme"
            aria-label="Add theme tag"
          >
            <Plus size={14} /> Add
          </button>
        </form>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-pill-box">
          <span className="stat-num">{plan.tasks.length}</span>
          <span className="stat-lbl">Tasks</span>
        </div>
        <div className="stat-pill-box">
          <span className="stat-num">{plan.budgetBreakdown.length}</span>
          <span className="stat-lbl">Categories</span>
        </div>
        <div className="stat-pill-box">
          <span className="stat-num">{plan.milestones.length}</span>
          <span className="stat-lbl">Milestones</span>
        </div>
      </div>

      {/* AI Recommendations */}
      {plan.recommendations && plan.recommendations.length > 0 && (
        <div className="recs-box">
          <span className="summary-label">AI Recommendations</span>
          <ul className="recs-list">
            {plan.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
