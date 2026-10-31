import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';
import { useEvent } from '../../contexts/useEvent';
import { queryCollection, createDoc, deleteDocById } from '../../services/firebase/firestore';
import { where } from 'firebase/firestore';
import { toast } from '../../components/ui/toast';
import './TeamResponsibilities.css';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  tasksCount: number;
  avatar: string;
  permission: string;
  eventId?: string;
}

const DEFAULT_TEAM: TeamMember[] = [
  { id: 'tm-1', name: 'Maya Sharma', role: 'Lead Planner & Host', tasksCount: 8, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', permission: 'Full Admin' },
  { id: 'tm-2', name: 'Karan Patel', role: 'Logistics & Venue Coordinator', tasksCount: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', permission: 'Editor' },
];

export function TeamResponsibilities() {
  const { activeEvent } = useEvent();
  const eventId = activeEvent?.id;

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All Team' | 'By Role'>('All Team');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Logistics');
  const [newPermission, setNewPermission] = useState('Editor');

  useEffect(() => {
    let ignore = false;
    async function fetchTeam() {
      if (!eventId) {
        if (!ignore) {
          setTeam(DEFAULT_TEAM);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await queryCollection('team', [
          where('eventId', '==', eventId),
        ]);
        if (ignore) return;
        if (data && data.length > 0) {
          setTeam(data as unknown as TeamMember[]);
        } else {
          setTeam(DEFAULT_TEAM);
        }
      } catch {
        if (!ignore) setTeam(DEFAULT_TEAM);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchTeam();
    return () => { ignore = true; };
  }, [eventId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    const newMember = {
      name: newName.trim(),
      role: newRole.trim() || 'Contributor',
      tasksCount: 0,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      permission: newPermission,
      eventId: eventId || 'default',
    };

    if (eventId) {
      try {
        const docId = await createDoc('team', newMember);
        setTeam(prev => [...prev, { id: docId, ...newMember }]);
        toast.success(`${newName} added to event team!`);
      } catch (err) {
        toast.error('Failed to add team member: ' + (err as Error).message);
      }
    } else {
      setTeam(prev => [...prev, { id: `tm-${Date.now()}`, ...newMember }]);
      toast.success(`${newName} added`);
    }

    setNewName('');
    setShowAddModal(false);
    setSaving(false);
  };

  const handleRemoveMember = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeam(prev => prev.filter(m => m.id !== id));
    if (eventId && !id.startsWith('tm-')) {
      try {
        await deleteDocById('team', id);
        toast.success('Team member removed');
      } catch {
        toast.error('Failed to remove member');
      }
    }
  };

  return (
    <div className="team-responsibilities-page">
      <div className="team-head-info">
        <h1 className="team-title">Team &amp; Responsibilities</h1>
        <p className="team-sub">
          Organize your event committee and delegate tasks for {activeEvent?.eventName || 'your celebration'}
        </p>
      </div>

      {/* Tabs */}
      <div className="team-tabs-row">
        {(['All Team', 'By Role'] as const).map(tab => (
          <button
            key={tab}
            className={`team-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Team Member List */}
      <div className="team-members-list">
        {loading ? (
          <div className="ui-center-empty">
            <Loader2 className="animate-spin mx-auto text-tuxedo" size={24} />
          </div>
        ) : (
          team.map(member => (
            <div key={member.id} className="team-member-card">
              <div className="tm-avatar">
                <img src={member.avatar} alt={member.name} />
              </div>

              <div className="tm-details">
                <h3 className="tm-name">{member.name}</h3>
                <span className="tm-role">{member.role} · {member.permission}</span>
              </div>

              <div className="inline-flex items-center gap-2">
                <span className="text-xs text-muted">{member.tasksCount} tasks</span>
                <button
                  onClick={(e) => handleRemoveMember(member.id, e)}
                  className="ui-icon-btn-ghost"
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Team Member Button */}
      <div className="team-sticky-footer">
        <button className="btn-add-team" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="ui-modal-backdrop"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="ui-modal-card-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="ui-modal-header">
              <h3 className="ui-modal-title">
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="ui-icon-btn-ghost"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="flex-col gap-3">
              <div>
                <label className="ui-field-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Diya Patel"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  className="w-full p-2 border-default rounded-md"
                />
              </div>

              <div>
                <label className="ui-field-label">Role</label>
                <input
                  type="text"
                  placeholder="e.g. Catering Coordinator"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full p-2 border-default rounded-md"
                />
              </div>

              <div>
                <label className="ui-field-label">Permission Level</label>
                <select
                  value={newPermission}
                  onChange={e => setNewPermission(e.target.value)}
                  className="w-full p-2 border-default rounded-md bg-white"
                >
                  <option value="Editor">Editor (Edit tasks &amp; notes)</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                  <option value="Full Admin">Full Admin</option>
                </select>
              </div>

              <div className="flex-between justify-end gap-2 mt-2">
                <button className="btn btn-secondary btn btn-secondary rounded-full"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary btn btn-primary rounded-full"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
