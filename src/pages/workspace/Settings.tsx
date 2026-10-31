import { logger } from '../../utils/logger';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Coins,
  Lock,
  ChevronRight,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { signOut, resetPassword, updateUserProfile } from '../../services/firebase/auth';
import { toast } from '../../components/ui/toast';
import './Settings.css';

export function Settings() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || profile?.displayName || '');
  const [currency, setCurrency] = useState(profile?.currency || 'INR');
  const [language, setLanguage] = useState(profile?.language || 'English');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile?.displayName) setDisplayName(profile.displayName);
    if (profile?.currency) setCurrency(profile.currency);
    if (profile?.language) setLanguage(profile.language);
  }

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim() || displayName.trim().length < 2) {
      toast.error('Display name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        currency,
        language,
      });
      await refreshProfile();
      toast.success('Preferences saved successfully');
    } catch (err) {
      logger.error('[Settings] Failed to save profile:', err);
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
      logger.error('[Settings] Password reset error:', err);
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
      <div className="settings-header-bar">
        <button
          type="button"
          onClick={handleBack}
          className="icon-btn settings-back-btn"
          aria-label="Go back to profile"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="settings-head-info">
          <h1 className="settings-title font-serif">Settings</h1>
          <p className="settings-sub">Manage your account preferences and security</p>
        </div>
      </div>

      {/* Account Profile Form */}
      <div className="settings-group">
        <span className="group-title">Profile & Regional Preferences</span>
        <form onSubmit={handleSaveProfile} className="ui-card-xl flex-col gap-4">
          <div>
            <label className="ui-field-label">
              <User size={14} /> Full Name / Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="form-input"
            />
          </div>

          <div className="grid-2-col gap-3">
            <div>
              <label className="ui-field-label">
                <Coins size={14} /> Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="form-input"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>

            <div>
              <label className="ui-field-label">
                <Globe size={14} /> Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="form-input"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary btn btn-primary rounded-full items-center gap-2 p-2"
            type="submit"
            disabled={saving}
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
          <div className="setting-row cursor-pointer" onClick={handlePasswordReset}>
            <div className="st-left">
              <Lock size={16} />
              <div>
                <span>Reset Password via Email</span>
                <span className="text-xs text-muted block">
                  {user?.email ? `Send reset link to ${user.email}` : 'Send reset link to registered email'}
                </span>
              </div>
            </div>
            <div className="st-right">
              {sendingReset ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
            </div>
          </div>

          <div className="setting-row cursor-pointer" onClick={() => navigate('/privacy')}>
            <div className="st-left">
              <ShieldCheck size={16} />
              <div>
                <span>Privacy & Consent Controls</span>
                <span className="text-xs text-muted block">
                  Manage data retention and AI processing preferences
                </span>
              </div>
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
        <div className="ui-surface-card flex-col gap-2 text-xs text-muted">
          <div><strong>Account UID:</strong> <span className="font-mono text-tuxedo">{user?.uid || 'Not signed in'}</span></div>
          <div><strong>Email Address:</strong> <span className="text-tuxedo">{user?.email || 'None'}</span></div>
          <div><strong>Sign-In Provider:</strong> <span className="text-tuxedo">{user?.providerData?.[0]?.providerId || 'password'}</span></div>
          <div className="inline-flex items-center gap-1">
            <strong>Email Verification:</strong>
            {user?.emailVerified ? (
              <span className="text-success inline-flex items-center gap-1 font-medium">
                <ShieldCheck size={14} /> Verified
              </span>
            ) : (
              <span className="text-warning inline-flex items-center gap-1 font-medium">
                <ShieldAlert size={14} /> Pending verification
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out Action */}
      <div className="mt-4">
        <button
          onClick={handleSignOut}
          className="ui-danger-btn"
        >
          <LogOut size={16} />
          <span>Sign Out of CelebrAI</span>
        </button>
      </div>
    </div>
  );
}
