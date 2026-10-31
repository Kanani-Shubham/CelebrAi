import { logger } from '../../utils/logger';
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
  X,
  HardDrive,
  Save,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useEvent } from '../../contexts/useEvent';
import { signOut } from '../../services/firebase/auth';
import { validateAvatarFile } from '../../utils/imageCompressor';
import { toast } from '../../components/ui/toast';
import './Profile.css';

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, avatarUrl, updateAvatar } = useAuth();
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
      logger.error('[Profile] Avatar update failed:', err);
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
        className="hidden"
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
          <span className="text-xs text-muted inline-flex items-center gap-1 mt-2">
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
              <strong className="pi-val inline-flex items-center gap-2">
                {email}
                {isVerified ? (
                  <span title="Verified Email" className="inline-flex items-center">
                    <ShieldCheck size={14} className="text-success" />
                  </span>
                ) : (
                  <span title="Unverified Email" className="inline-flex items-center text-warning">
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
              <span className="meta-text capitalize">
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
      <div className="mt-4 p-2">
        <button
          onClick={handleSignOut}
          className="ui-danger-btn"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Photo Preview & Confirmation Modal */}
      {showPreviewModal && previewUrl && (
        <div className="modal-backdrop" onClick={handleCancelPreview}>
          <div className="modal-sheet ui-modal-card-sm" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="ui-modal-title">
                Update Profile Photo
              </h3>
              <button onClick={handleCancelPreview} className="text-muted">
                <X size={20} />
              </button>
            </div>

            <div className="flex-col items-center gap-3 my-2">
              <div className="profile-avatar-circle">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs text-muted">
                {selectedFile?.name} ({selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ''})
              </span>
            </div>

            <div className="profile-notice-box">
              <HardDrive size={15} className="shrink-0 mt-1 text-tuxedo" />
              <span>
                <strong>Saved on this device:</strong> Photo will be resized (512×512) and cached securely in your browser's IndexedDB. It is not synced across devices.
              </span>
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="profile-progress-track">
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-tuxedo-black)', transition: 'width 0.2s ease' }} />
                </div>
                <span className="text-xs text-muted block text-center mt-1">
                  Optimizing and saving to local cache... {uploadProgress}%
                </span>
              </div>
            )}

            {uploadError && (
              <div className="profile-error-box">
                <strong className="block mb-1">Save Issue:</strong>
                {uploadError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={handleCancelPreview}
                disabled={uploading}
              >
                Cancel
              </button>
              <button className="btn btn-primary w-full flex-center gap-2"
                type="button"
                onClick={handleConfirmUpload}
                disabled={uploading}
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
