import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

/**
 * Validates that all required client-side Firebase environment variables
 * are present and populated with real credentials.
 */
export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  typeof rawApiKey === 'string' &&
  rawApiKey.length > 10 &&
  !rawApiKey.includes('undefined') &&
  !rawApiKey.includes('your_')
);

// Safe configuration object: uses provided environment variables, or a syntactically
// valid placeholder to prevent top-level module crashes when variables are pending in Netlify.
const firebaseConfig = {
  apiKey: rawApiKey || 'AIzaSyPlaceholderCelebrAIConfigKey12345',
  authDomain: rawAuthDomain || 'celebrai-placeholder.firebaseapp.com',
  projectId: rawProjectId || 'celebrai-placeholder',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'celebrai-placeholder.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1009537060981',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1009537060981:web:placeholder',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
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
