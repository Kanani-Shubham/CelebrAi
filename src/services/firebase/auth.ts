import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
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

function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/invalid-api-key': 'Firebase API key is missing or invalid. Please configure VITE_FIREBASE_API_KEY in Netlify site settings.',
    'auth/unauthorized-domain': 'celebr-ai.netlify.app is not authorized in Firebase Console. Add it in Firebase Console -> Authentication -> Settings -> Authorized Domains.',
  };
  return messages[code] ?? 'An error occurred. Please try again.';
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  checkConfig();
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
}

export async function signIn(email: string, password: string): Promise<User> {
  checkConfig();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  checkConfig();
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;
  // Create user doc if first sign-in
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? '',
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
  return user;
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
}

export { getAuthErrorMessage, onAuthStateChanged, type User };
