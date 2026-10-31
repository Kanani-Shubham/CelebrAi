import { useState } from 'react';
import { AlertCircle, X, Key, Check } from 'lucide-react';
import { isFirebaseConfigured } from '../../services/firebase/config';

export function FirebaseConfigBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isFirebaseConfigured || dismissed) {
    return null;
  }

  const envList = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const handleCopyNames = () => {
    navigator.clipboard.writeText(envList.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="firebase-banner-wrap">
      <div className="firebase-banner-content">
        <AlertCircle size={16} color="#D97706" className="shrink-0" />
        <span>
          <strong>Firebase Configuration Pending:</strong> Set your 6 <code>VITE_FIREBASE_*</code> environment variables in Netlify Site Configuration to enable live Cloud Authentication & Firestore.
        </span>
        <button
          onClick={handleCopyNames}
          className="firebase-badge-btn"
        >
          {copied ? <Check size={12} /> : <Key size={12} />}
          <span>{copied ? 'Copied Names' : 'Copy Variable Names'}</span>
        </button>
      </div>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="firebase-close-btn"
      >
        <X size={16} />
      </button>
    </div>
  );
}
