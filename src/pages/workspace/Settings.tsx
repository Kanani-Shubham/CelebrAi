import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Coins,
  Calendar,
  Clock,
  Bell,
  Eye,
  Palette,
  Lock,
  ChevronRight,
  LogOut,
  User,
  ShieldCheck,
  Mail,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut, resetPassword, updateUserProfile } from '../../services/firebase/auth';
import { toast } from '../../components/ui';
import './Settings.css';

export function Settings() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || profile?.displayName || '');
  const [currency, setCurrency] = useState(profile?.currency || 'INR');
  const [language, setLanguage] = useState(profile?.language || 'English');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        currency,
        language,
      });
      await refreshProfile();
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error('No email address associated with this account');
      return;
    }
    setSendingReset(true);
    try {
      await resetPassword(user.email);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (err) {
      toast.error('Failed to send reset email: ' + (err as Error).message);
    } finally {
      setSendingReset(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out');
      navigate('/signin');
    } catch (err) {
      toast.error('Failed to sign out: ' + (err as Error).message);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-head-info">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-sub">Manage your account preferences and security</p>
      </div>

      {/* Account Profile Form */}
      <div className="settings-group">
        <span className="group-title">Profile & Regional Preferences</span>
        <form onSubmit={handleSaveProfile} style={{ background: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff' }}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-tuxedo-black)', display: 'block', marginBottom: '4px' }}>
                Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff' }}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', padding: '8px 20px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>Save Preferences</span>
          </button>
        </form>
      </div>

      {/* Security Section */}
      <div className="settings-group">
        <span className="group-title">Security & Credentials</span>
        <div className="settings-card">
          <div className="setting-row" onClick={handlePasswordReset} style={{ cursor: 'pointer' }}>
            <div className="st-left">
              <Lock size={16} />
              <div>
                <span>Reset Password via Email</span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {user?.email || 'Send reset link to registered email'}
                </span>
              </div>
            </div>
            <div className="st-right">
              {sendingReset ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
            </div>
          </div>

          <div className="setting-row" onClick={() => navigate('/privacy')} style={{ cursor: 'pointer' }}>
            <div className="st-left">
              <ShieldCheck size={16} />
              <span>Privacy & Consent Controls</span>
            </div>
            <div className="st-right">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="settings-group">
        <span className="group-title">Account Diagnostics</span>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div><strong>Account UID:</strong> <span style={{ fontFamily: 'monospace' }}>{user?.uid || 'Not signed in'}</span></div>
          <div><strong>Email:</strong> {user?.email || 'None'}</div>
          <div><strong>Provider:</strong> {user?.providerData?.[0]?.providerId || 'email/password'}</div>
          <div><strong>Email Verified:</strong> {user?.emailVerified ? '✅ Yes' : '⚠️ Pending'}</div>
        </div>
      </div>

      {/* Sign Out Action */}
      <div style={{ marginTop: '16px' }}>
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
          <span>Sign Out of CelebrAI</span>
        </button>
      </div>
    </div>
  );
}
