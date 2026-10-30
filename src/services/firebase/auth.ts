import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

function checkConfig() {
  if (!isFirebaseConfigured) {
    throw {
      code: 'auth/invalid-api-key',
      message: 'Firebase is not yet configured on this deployment. Please add VITE_FIREBASE_API_KEY in your Netlify site settings.',
    };
  }
}

export type AuthError = {
  code: string;
  message: string;
};

// Singleton Google Auth Provider configured once
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Global concurrency guard to prevent multiple overlapping auth popups/requests
let isAuthInProgress = false;

export function getIsAuthInProgress(): boolean {
  return isAuthInProgress;
}

export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network connection failed. Please check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled before completing.',
    'auth/cancelled-popup-request': 'Only one sign-in window can be open at a time.',
    'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups or use redirect sign-in.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase Console. Please enable Google provider in Firebase Authentication.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Console. Please add localhost and your domain in Firebase Console -> Authentication -> Settings -> Authorized Domains.',
    'auth/invalid-credential': 'Invalid credentials provided. Please check your email and password.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/invalid-api-key': 'Firebase API key is missing or invalid. Please configure VITE_FIREBASE_API_KEY in your environment.',
  };
  return messages[code] ?? 'Authentication failed. Please try again.';
}

export async function syncUserRecord(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? 'Celebration Host',
        photoURL: user.photoURL ?? '',
        country: '',
        language: 'English',
        currency: 'INR',
        planningStyle: 'Traditional',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscription: 'free',
        aiUsageToday: 0,
        aiUsageTotal: 0,
      });
    }
  } catch (err) {
    console.warn('[Auth] Failed to sync user record to Firestore:', err);
  }
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  checkConfig();
  if (isAuthInProgress) {
    throw {
      code: 'auth/cancelled-popup-request',
      message: 'Authentication is already in progress. Please wait.',
    };
  }

  isAuthInProgress = true;
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email,
      displayName,
      country: '',
      language: 'English',
      currency: 'INR',
      planningStyle: 'Traditional',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      subscription: 'free',
      aiUsageToday: 0,
      aiUsageTotal: 0,
    });
    return credential.user;
  } finally {
    isAuthInProgress = false;
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  checkConfig();
  if (isAuthInProgress) {
    throw {
      code: 'auth/cancelled-popup-request',
      message: 'Authentication is already in progress. Please wait.',
    };
  }

  isAuthInProgress = true;
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } finally {
    isAuthInProgress = false;
  }
}

/**
 * Initiates Google authentication using a popup window.
 * Invoked directly and synchronously from the user's click action.
 */
export async function signInWithGoogle(): Promise<User> {
  checkConfig();
  if (isAuthInProgress) {
    throw {
      code: 'auth/cancelled-popup-request',
      message: 'Authentication is already in progress. Please wait.',
    };
  }

  isAuthInProgress = true;
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;
    await syncUserRecord(user);
    return user;
  } catch (err: unknown) {
    console.error('[Auth] Google popup sign-in error:', err);
    throw err;
  } finally {
    isAuthInProgress = false;
  }
}

/**
 * Alternative Google authentication strategy using full page redirect.
 * Used when popups are blocked by browser settings or extensions.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  checkConfig();
  if (isAuthInProgress) return;

  isAuthInProgress = true;
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('celebrai_auth_redirect_pending', 'true');
    }
    await signInWithRedirect(auth, googleProvider);
  } finally {
    isAuthInProgress = false;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });

  // Keep Firebase Auth in sync with display name or photo
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (typeof data.displayName === 'string' && data.displayName.trim().length > 0) {
      authUpdates.displayName = data.displayName.trim();
    }
    if (typeof data.photoURL === 'string') {
      authUpdates.photoURL = data.photoURL;
    }
    if (Object.keys(authUpdates).length > 0) {
      try {
        await updateProfile(auth.currentUser, authUpdates);
      } catch (err) {
        console.warn('[auth] Could not update auth profile directly:', err);
      }
    }
  }
}

export { getRedirectResult, onAuthStateChanged, type User };
