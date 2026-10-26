import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Settings as SettingsIcon,
  ChevronRight,
  Camera,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { signOut } from '../../services/firebase/auth';
import { toast } from '../../components/ui';
import './Profile.css';

export function Profile() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { events } = useEvent();

  const name = user?.displayName || profile?.displayName || 'Celebration Host';
  const email = user?.email || profile?.email || 'No email attached';
  const photo = user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
  const phone = user?.phoneNumber || (profile as unknown as { phone?: string })?.phone || 'Not provided';
  const isVerified = user?.emailVerified;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/signin');
    } catch (err) {
      toast.error('Failed to sign out: ' + (err as Error).message);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-head-info">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-sub">Manage your account details and celebration workspace</p>
      </div>

      {/* Avatar with Camera Icon */}
      <div className="profile-avatar-center">
        <div className="profile-avatar-wrap">
          <img src={photo} alt={name} />
          <button className="avatar-camera-btn" onClick={() => navigate('/settings')} aria-label="Change photo">
            <Camera size={14} />
          </button>
        </div>
      </div>

      {/* Personal Info Group */}
      <div className="profile-section-card">
        <div className="profile-info-row" onClick={() => navigate('/settings')}>
          <div className="pi-left">
            <User size={16} />
            <div>
              <span className="pi-label">Full Name</span>
              <strong className="pi-val">{name}</strong>
            </div>
          </div>
          <ChevronRight size={16} className="pi-arrow" />
        </div>

        <div className="profile-info-row" onClick={() => navigate('/settings')}>
          <div className="pi-left">
            <Mail size={16} />
            <div>
              <span className="pi-label">Email Address</span>
              <strong className="pi-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {email}
                {isVerified && (
                  <span title="Verified Email" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <ShieldCheck size={14} style={{ color: '#16a34a' }} />
                  </span>
                )}
              </strong>
            </div>
          </div>
          <ChevronRight size={16} className="pi-arrow" />
        </div>

        <div className="profile-info-row" onClick={() => navigate('/settings')}>
          <div className="pi-left">
            <Phone size={16} />
            <div>
              <span className="pi-label">Phone</span>
              <strong className="pi-val">{phone}</strong>
            </div>
          </div>
          <ChevronRight size={16} className="pi-arrow" />
        </div>
      </div>

      {/* Account Section */}
      <div className="profile-account-group">
        <span className="group-label">Account & Subscriptions</span>
        <div className="profile-section-card">
          <div className="profile-info-row" onClick={() => navigate('/events')}>
            <div className="pi-left">
              <Calendar size={16} />
              <div>
                <span className="pi-label">My Celebrations</span>
              </div>
            </div>
            <div className="pi-right-meta">
              <span className="meta-text">{events.length} Event{events.length === 1 ? '' : 's'}</span>
              <ChevronRight size={16} className="pi-arrow" />
            </div>
          </div>

          <div className="profile-info-row" onClick={() => navigate('/subscription')}>
            <div className="pi-left">
              <CreditCard size={16} />
              <div>
                <span className="pi-label">Plan & AI Tokens</span>
              </div>
            </div>
            <div className="pi-right-meta">
              <span className="meta-text" style={{ textTransform: 'capitalize' }}>
                {profile?.subscription || 'Standard Free'}
              </span>
              <ChevronRight size={16} className="pi-arrow" />
            </div>
          </div>

          <div className="profile-info-row" onClick={() => navigate('/settings')}>
            <div className="pi-left">
              <SettingsIcon size={16} />
              <div>
                <span className="pi-label">Account Settings & Password</span>
              </div>
            </div>
            <ChevronRight size={16} className="pi-arrow" />
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div style={{ marginTop: '20px', padding: '0 4px' }}>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #fee2e2',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
