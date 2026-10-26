import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAJIbokbJORhzk2_9133jElW0K_VwjihFY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'celebrai-62487.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'celebrai-62487',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'celebrai-62487.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1009537060981',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1009537060981:web:e81878149e5c07f010683c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-NVETMW4QHP',
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

// Analytics only in browser with measurementId
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try { getAnalytics(app); } catch { /* analytics optional */ }
}

export default app;
