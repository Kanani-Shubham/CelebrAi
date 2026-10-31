import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Share2,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  PlusCircle,
  Store,
  UserCheck,
  Wallet,
  CalendarCheck,
} from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
import { toast } from '../../components/ui';
import { formatDisplayDate } from '../../utils/dateUtils';
import './EventOverview.css';

export function EventOverview() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { events, activeEvent, setActiveEvent } = useEvent();
  const [activeTab, setActiveTab] = useState<'planning' | 'guests' | 'vendors' | 'gallery'>('planning');

  const currentEvent = (id ? events.find(e => e.id === id) : null) || activeEvent || events[0];

  if (!currentEvent) {
    return (
      <div className="event-overview-page" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-tuxedo-black)' }}>No Event Selected</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Please select an existing celebration or create a new one.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/events')}
          style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)' }}
        >
          View All Celebrations
        </button>
      </div>
    );
  }

  const tasksTotal = currentEvent.tasksTotal || 0;
  const tasksDone = currentEvent.tasksDone || 0;
  const progressPercent = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentEvent.eventName,
        text: `Planning ${currentEvent.eventName} on CelebrAI`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard');
    }
  };

  return (
    <div className="event-overview-page">
      {/* Top Header Bar */}
      <div className="overview-header">
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
        <div className="header-actions">
          <button className="icon-btn" onClick={handleShare} aria-label="Share">
            <Share2 size={20} />
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              setActiveEvent(currentEvent);
              navigate('/dashboard');
            }}
            title="Set as Active Event"
          >
            <CalendarCheck size={20} />
          </button>
        </div>
      </div>

      {/* Hero Cover Image */}
      <div className="overview-cover-wrap">
        <img
          src={currentEvent.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
          alt={currentEvent.eventName}
        />
      </div>

      {/* Main Details Card */}
      <div className="overview-details-card">
        <div className="title-row">
          <h1 className="overview-event-name">{currentEvent.eventName}</h1>
          <span className="event-type-badge">{currentEvent.eventType || 'Event'}</span>
        </div>

        <div className="meta-grid">
          <div className="meta-col">
            <div className="meta-item">
              <Calendar size={14} />
              <span>{formatDisplayDate(currentEvent.eventDate || currentEvent.date)}</span>
            </div>
            <div className="meta-item">
              <Users size={14} />
              <span>{currentEvent.guestCount || 0} Guests</span>
            </div>
          </div>
          <div className="meta-col">
            <div className="meta-item">
              <MapPin size={14} />
              <span>{currentEvent.location || 'Location TBD'}</span>
            </div>
            <div className="meta-item">
              <DollarSign size={14} />
              <span>₹{(Number(currentEvent.budget) || 0).toLocaleString('en-IN')} Budget</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="overview-tabs">
          {(['planning', 'guests', 'vendors', 'gallery'] as const).map(tab => (
            <button
              key={tab}
              className={`overview-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'guests') navigate('/guests');
                if (tab === 'vendors') navigate('/vendors');
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Planning Progress Bar */}
        <div className="progress-section">
          <div className="progress-text-row">
            <span className="progress-title">Planning Progress</span>
            <span className="progress-pct">{progressPercent}%</span>
          </div>
          <div className="overview-progress-track">
            <div className="overview-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="progress-subtext">
            {tasksDone} of {tasksTotal} tasks completed
          </span>
        </div>

        {/* Quick Actions Row */}
        <div className="quick-actions-section">
          <h3 className="section-subtitle">Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="qa-button" onClick={() => navigate('/tasks')}>
              <div className="qa-icon-wrap">
                <PlusCircle size={18} />
              </div>
              <span>Tasks</span>
            </button>

            <button className="qa-button" onClick={() => navigate('/vendors')}>
              <div className="qa-icon-wrap">
                <Store size={18} />
              </div>
              <span>Vendors</span>
            </button>

            <button className="qa-button" onClick={() => navigate('/guests')}>
              <div className="qa-icon-wrap">
                <UserCheck size={18} />
              </div>
              <span>Guests</span>
            </button>

            <button className="qa-button" onClick={() => navigate('/budget')}>
              <div className="qa-icon-wrap">
                <Wallet size={18} />
              </div>
              <span>Budget</span>
            </button>
          </div>
        </div>

        {/* Key Details Section */}
        <div className="key-details-section">
          <div className="kd-header">
            <h3 className="section-subtitle">Key Details</h3>
          </div>
          <div className="kd-info-box">
            <div className="kd-row">
              <span className="kd-label">Theme</span>
              <span className="kd-value">{currentEvent.theme || 'Classic Elegance'}</span>
            </div>
            <div className="kd-row">
              <span className="kd-label">Venue</span>
              <span className="kd-value">{currentEvent.location || 'To Be Finalized'}</span>
            </div>
            <div className="kd-row">
              <span className="kd-label">Status</span>
              <span className="kd-value" style={{ textTransform: 'capitalize' }}>
                {currentEvent.status || 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
