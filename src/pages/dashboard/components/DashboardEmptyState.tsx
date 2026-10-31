import { Plus, Sparkles, Calendar, Store, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardEmptyStateProps {
  displayName?: string | null;
}

export function DashboardEmptyState({ displayName }: DashboardEmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="home-dashboard">
      <div className="hero-countdown-card hd-hero-card">
        <div>
          <span className="hd-hero-subtitle">
            Welcome to CelebrAI{displayName ? `, ${displayName}` : ''}
          </span>
          <h1 className="font-serif hd-hero-title">
            Let’s Plan Your Next Celebration
          </h1>
          <p className="hd-hero-desc">
            You don’t have an active celebration yet. Create an event manually or let our AI assistant build a tailored master plan, budget breakdown, and checklist in seconds.
          </p>
        </div>

        <div className="hd-hero-actions">
          <button className="btn btn-primary hd-hero-btn" onClick={() => navigate('/create-event')}>
            <Plus size={18} />
            <span>Create Your First Event</span>
          </button>
          <button className="btn btn-secondary hd-hero-btn" onClick={() => navigate('/create-event')}>
            <Sparkles size={18} className="text-violet" />
            <span>AI Wizard Planning</span>
          </button>
        </div>
      </div>

      {/* Quick access tiles */}
      <div className="quick-action-tiles mt-4">
        <button className="action-tile" onClick={() => navigate('/events')}>
          <div className="tile-icon-bg"><Calendar size={20} /></div>
          <span>All Events</span>
        </button>
        <button className="action-tile" onClick={() => navigate('/ai')}>
          <div className="tile-icon-bg"><Sparkles size={20} /></div>
          <span>AI Assistant</span>
        </button>
        <button className="action-tile" onClick={() => navigate('/vendors')}>
          <div className="tile-icon-bg"><Store size={20} /></div>
          <span>Vendors</span>
        </button>
        <button className="action-tile" onClick={() => navigate('/decor')}>
          <div className="tile-icon-bg"><Palette size={20} /></div>
          <span>Decor Ideas</span>
        </button>
      </div>
    </div>
  );
}
