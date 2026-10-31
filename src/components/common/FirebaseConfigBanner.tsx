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
    <div style={{
      background: '#FFFBEB',
      borderBottom: '1px solid #FDE68A',
      padding: '10px 16px',
      fontSize: '13px',
      color: '#92400E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      position: 'relative',
      zIndex: 9999,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
        <span>
          <strong>Firebase Configuration Pending:</strong> Set your 6 <code>VITE_FIREBASE_*</code> environment variables in Netlify Site Configuration to enable live Cloud Authentication & Firestore.
        </span>
        <button
          onClick={handleCopyNames}
          style={{
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: '#B45309',
          }}
        >
          {copied ? <Check size={12} /> : <Key size={12} />}
          <span>{copied ? 'Copied Names' : 'Copy Variable Names'}</span>
        </button>
      </div>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#B45309',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
