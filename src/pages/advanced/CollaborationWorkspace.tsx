import { useState } from 'react';
import { UserPlus, MoreVertical, ShieldCheck, Edit3, Eye, ArrowRight } from 'lucide-react';
import { INITIAL_TEAM, type TeamMember } from '../../data/seed';
import './CollaborationWorkspace.css';

export function CollaborationWorkspace() {
  const [activeTab, setActiveTab] = useState<'members' | 'tasks' | 'comments' | 'activity'>('members');
  const [members] = useState<TeamMember[]>(INITIAL_TEAM.slice(0, 5));

  return (
    <div className="collab-workspace-page">
      <div className="collab-head-info">
        <h1 className="collab-title">Team Workspace</h1>
        <p className="collab-sub">Plan together, stay aligned.</p>
      </div>

      {/* Tabs */}
      <div className="collab-tabs-row">
        {(['members', 'tasks', 'comments', 'activity'] as const).map(tab => (
          <button
            key={tab}
            className={`collab-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Invite Member Card */}
      <div className="invite-member-card">
        <div className="invite-icon-circle">
          <UserPlus size={20} />
        </div>
        <h3 className="invite-card-title">Invite Team Member</h3>
        <p className="invite-card-desc">
          Add your partner, friends or planners to collaborate on this event.
        </p>
        <button className="invite-email-btn">
          <span>Invite via Email</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Team Members List */}
      <div className="collab-members-section">
        <div className="section-head">
          <span className="section-title">Team Members ({members.length})</span>
        </div>

        <div className="members-card-list">
          {members.map(m => (
            <div key={m.id} className="collab-member-row">
              <div className="cm-avatar">
                <img src={m.avatar} alt={m.name} />
              </div>

              <div className="cm-info">
                <h4 className="cm-name">{m.name}</h4>
                <span className="cm-perm">{m.role} · {m.permission}</span>
              </div>

              <button className="cm-dots-btn">
                <MoreVertical size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Section */}
      <div className="collab-permissions-section">
        <div className="perm-header">
          <span className="section-title">Permissions</span>
          <button className="learn-more-link">Learn more</button>
        </div>

        <div className="perm-cards-grid">
          <div className="perm-card">
            <ShieldCheck size={16} />
            <strong>Full access</strong>
            <span>Can edit everything</span>
          </div>

          <div className="perm-card">
            <Edit3 size={16} />
            <strong>Edit access</strong>
            <span>Can add &amp; edit</span>
          </div>

          <div className="perm-card">
            <Eye size={16} />
            <strong>View only</strong>
            <span>Can view details</span>
          </div>
        </div>
      </div>
    </div>
  );
}
