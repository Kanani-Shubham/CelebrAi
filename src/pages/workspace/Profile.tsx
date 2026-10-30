import React, { useState, useRef } from 'react';
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
  ShieldAlert,
  Loader2,
  Check,
  X,
  HardDrive,
  Save,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { signOut } from '../../services/firebase/auth';
import { validateAvatarFile } from '../../utils/imageCompressor';
import { toast } from '../../components/ui';
import './Profile.css';

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, avatarUrl, updateAvatar } = useAuth();
  const { events } = useEvent();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const name = user?.displayName || profile?.displayName || 'Celebration Host';
  const email = user?.email || profile?.email || 'No email attached';
  const photo = avatarUrl || user?.photoURL || profile?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
  const phone = user?.phoneNumber || (profile as unknown as { phone?: string })?.phone || 'Not provided';
  const isVerified = user?.emailVerified;

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file format');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setShowPreviewModal(true);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowPreviewModal(false);
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !user) {
      toast.error('Please select an image file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const stats = await updateAvatar(selectedFile, (pct) => {
        setUploadProgress(pct);
      });

      const origMB = (stats.originalSize / (1024 * 1024)).toFixed(2);
      const compKB = Math.round(stats.compressedSize / 1024);
      toast.success(`Photo optimized (${origMB}MB → ${compKB}KB) and saved to this device!`);
      handleCancelPreview();
    } catch (err) {
      console.error('[Profile] Avatar update failed:', err);
      const msg = (err as Error).message || 'Failed to save avatar';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

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
        <h1 className="profile-title font-serif">My Profile</h1>
        <p className="profile-sub">Manage your account details and celebration workspace</p>
      </div>

      {/* Hidden file picker input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Avatar with Camera Icon */}
      <div className="profile-avatar-center">
        <div className="profile-avatar-wrap">
          <img src={photo} alt={name} />
          <button
            type="button"
            className="avatar-camera-btn"
            onClick={handleCameraClick}
            aria-label="Upload profile photo"
            title="Upload profile photo"
          >
            <Camera size={14} />
          </button>
        </div>
        {avatarUrl && (
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <HardDrive size={12} /> Saved on this device
          </span>
        )}
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
                {isVerified ? (
                  <span title="Verified Email" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <ShieldCheck size={14} style={{ color: '#16a34a' }} />
                  </span>
                ) : (
                  <span title="Unverified Email" style={{ display: 'inline-flex', alignItems: 'center', color: '#ea580c' }}>
                    <ShieldAlert size={14} />
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
                <span className="pi-label">Account Settings & Preferences</span>
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

      {/* Photo Preview & Confirmation Modal */}
      {showPreviewModal && previewUrl && (
        <div className="modal-backdrop" onClick={handleCancelPreview}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, margin: 'auto', background: 'white', borderRadius: 'var(--radius-2xl)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--color-tuxedo-black)', margin: 0 }}>
                Update Profile Photo
              </h3>
              <button onClick={handleCancelPreview} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, margin: '14px 0 10px' }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-morning-fog)', boxShadow: 'var(--shadow-md)' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {selectedFile?.name} ({selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ''})
              </span>
            </div>

            <div style={{
              background: '#FAF7F2',
              border: '1px solid #ECE6DE',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              fontSize: '11.5px',
              color: '#827A76',
              lineHeight: '1.45',
            }}>
              <HardDrive size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#171F20' }} />
              <span>
                <strong>Saved on this device:</strong> Photo will be resized (512×512) and cached securely in your browser's IndexedDB. It is not synced across devices.
              </span>
            </div>

            {uploading && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ height: 6, background: 'var(--color-morning-fog)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-tuxedo-black)', transition: 'width 0.2s ease' }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', textAlign: 'center', marginTop: 4 }}>
                  Optimizing and saving to local cache... {uploadProgress}%
                </span>
              </div>
            )}

            {uploadError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                color: '#991b1b',
                fontSize: '12px',
                lineHeight: '1.4',
              }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Save Issue:</strong>
                {uploadError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={handleCancelPreview}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={handleConfirmUpload}
                disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save to Device</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
