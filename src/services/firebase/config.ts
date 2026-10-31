import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock-api-key-for-testing-only',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'celebrai-62487.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'celebrai-62487',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'celebrai-62487.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1009537060981',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1009537060981:web:e81878149e5c07f010683c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-NVETMW4QHP',
};

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey;
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId;

/**
 * Validates that all required client-side Firebase environment variables
 * are present and populated with real credentials.
 */
export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  typeof rawApiKey === 'string' &&
  rawApiKey.length > 10 &&
  !rawApiKey.includes('undefined') &&
  !rawApiKey.includes('placeholder') &&
  !rawApiKey.includes('mock') &&
  !rawApiKey.includes('your_')
);

// Client configuration object: uses provided environment variables with project defaults
// to guarantee seamless live deployment on Netlify without auth/invalid-api-key exceptions.
const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain,
  projectId: rawProjectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics only in browser when Firebase is fully configured with a measurementId
if (typeof window !== 'undefined' && isFirebaseConfigured && firebaseConfig.measurementId) {
  try {
    getAnalytics(app);
  } catch {
    /* analytics optional */
  }
}

export default app;
