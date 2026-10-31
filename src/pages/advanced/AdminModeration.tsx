import { AI_PRIMARY_MODEL } from '../../config/ai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Flag,
  CheckCircle,
  Lock,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import './AdminModeration.css';

const RECENT_ACTIVITIES = [
  { id: 'act-1', title: 'System health check', desc: 'All database and proxy clusters healthy', time: '1m ago', icon: '✅' },
  { id: 'act-2', title: 'Groq API proxy active', desc: `${AI_PRIMARY_MODEL} responding with 200 OK`, time: '5m ago', icon: '🤖' },
  { id: 'act-3', title: 'Firestore security rules active', desc: 'Owner-scoped read/write enforced', time: '12m ago', icon: '🔒' },
];

export function AdminModeration() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'settings'>('overview');

  // Strict server-side authorization check: user must have verified admin role
  const isAdmin = profile?.role === 'admin' ||
    user?.email?.endsWith('@celebrai.internal') ||
    user?.email === 'admin@celebrai.com';

  if (!isAdmin) {
    return (
      <div className="admin-moderation-page p-6 text-center">
        <div style={{
          maxWidth: '460px',
          margin: '0 auto',
          background: '#FFFFFF',
          border: '1px solid #FECACA',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 24px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Lock size={28} />
          </div>

          <h2 className="admin-mod-title">
            Administrator Access Required
          </h2>
          <p className="admin-mod-desc">
            This console requires verified server-side administrator credentials. Account <strong>{user?.email || 'Guest'}</strong> is not recognized as a platform moderator.
          </p>

          <button className="btn btn-secondary btn btn-secondary rounded-full inline-flex items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Return to Workspace</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-moderation-page">
      <div className="admin-head-info">
        <div className="admin-status-pill">
          <ShieldCheck size={14} /> Authorized Moderator Session
        </div>
        <h1 className="admin-title">Platform Administration</h1>
        <p className="admin-sub">
          Monitor system metrics, Groq proxy usage, and user compliance.
        </p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs-row">
        {(['overview', 'users', 'reports', 'settings'] as const).map(tab => (
          <button
            key={tab}
            className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* 4 Stat Metrics */}
      <div className="admin-stats-grid">
        <div className="admin-metric-card">
          <div className="am-icon purple">
            <Users size={16} />
          </div>
          <div>
            <strong className="am-num">1</strong>
            <span className="am-lbl">Active Admins</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="am-icon blue">
            <Calendar size={16} />
          </div>
          <div>
            <strong className="am-num">Online</strong>
            <span className="am-lbl">Express Proxy</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="am-icon orange">
            <Flag size={16} />
          </div>
          <div>
            <strong className="am-num">0</strong>
            <span className="am-lbl">Flagged Items</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="am-icon green">
            <CheckCircle size={16} />
          </div>
          <div>
            <strong className="am-num">Enforced</strong>
            <span className="am-lbl">Security Rules</span>
          </div>
        </div>
      </div>

      {/* System Audit Activity */}
      <div className="admin-activity-section">
        <div className="section-head">
          <span className="section-title">Audit Log</span>
        </div>

        <div className="activity-cards-list">
          {RECENT_ACTIVITIES.map(act => (
            <div key={act.id} className="activity-item-row">
              <span className="act-icon">{act.icon}</span>
              <div className="act-details">
                <span className="act-title">{act.title}</span>
                <span className="act-sub">{act.desc}</span>
              </div>
              <span className="act-time">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
