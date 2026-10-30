import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase/config';
import { getUserProfile, syncUserRecord } from '../services/firebase/auth';
import { getAvatarBlob, saveAvatarBlob, deleteAvatarBlob } from '../services/storage/indexedDBAvatar';
import { compressAndResizeAvatar } from '../utils/imageCompressor';

type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  country: string;
  language: string;
  currency: string;
  planningStyle: string;
  subscription: string;
  aiUsageToday: number;
  aiUsageTotal: number;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  idToken: string | null;
  isConfigured: boolean;
  avatarUrl: string | null;
  refreshProfile: () => Promise<void>;
  updateAvatar: (
    file: File,
    onProgress?: (progress: number) => void
  ) => Promise<{ originalSize: number; compressedSize: number; mimeType: string }>;
  removeAvatar: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  idToken: null,
  isConfigured: true,
  avatarUrl: null,
  refreshProfile: async () => {},
  updateAvatar: async () => ({ originalSize: 0, compressedSize: 0, mimeType: 'image/webp' }),
  removeAvatar: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user || !isFirebaseConfigured) return;
    try {
      const p = await getUserProfile(user.uid);
      if (p) setProfile(p as UserProfile);
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh profile:', err);
    }
  }, [user]);

  // Updates avatar locally in IndexedDB without using Firebase Storage
  const updateAvatar = useCallback(
    async (file: File, onProgress?: (progress: number) => void) => {
      if (!user) {
        throw new Error('You must be signed in to update your profile photo.');
      }

      // 1. Compress & resize to max 512x512 WebP (or JPEG fallback) under 300KB
      const { blob, originalSize, compressedSize, mimeType } = await compressAndResizeAvatar(
        file,
        onProgress
      );

      // 2. Persist Blob in local IndexedDB 'celebrai-local-cache' -> 'avatars' with key user.uid
      await saveAvatarBlob(user.uid, blob);

      // 3. Revoke previous Object URL to avoid memory leaks
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
      }

      // 4. Create new Object URL for the current session
      const newUrl = URL.createObjectURL(blob);
      activeObjectUrlRef.current = newUrl;
      setAvatarUrl(newUrl);

      return { originalSize, compressedSize, mimeType };
    },
    [user]
  );

  const removeAvatar = useCallback(async () => {
    if (!user) return;
    await deleteAvatarBlob(user.uid);
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
    setAvatarUrl(null);
  }, [user]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Process redirect sign-in ONLY when explicitly initiated via redirect flow
    if (typeof window !== 'undefined' && sessionStorage.getItem('celebrai_auth_redirect_pending') === 'true') {
      sessionStorage.removeItem('celebrai_auth_redirect_pending');
      getRedirectResult(auth)
        .then(async (credential) => {
          if (credential?.user) {
            await syncUserRecord(credential.user);
          }
        })
        .catch((err) => {
          console.warn('[AuthContext] getRedirectResult check:', err);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Isolate accounts: revoke previous user's cached object URL immediately
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
      setAvatarUrl(null);

      setUser(firebaseUser);

      if (firebaseUser) {
        // Load user's local avatar from IndexedDB (database: celebrai-local-cache, store: avatars)
        try {
          const cachedBlob = await getAvatarBlob(firebaseUser.uid);
          if (cachedBlob) {
            const url = URL.createObjectURL(cachedBlob);
            activeObjectUrlRef.current = url;
            setAvatarUrl(url);
          } else if (firebaseUser.photoURL) {
            setAvatarUrl(firebaseUser.photoURL);
          }
        } catch (avatarErr) {
          console.warn('[AuthContext] Error loading cached avatar:', avatarErr);
          if (firebaseUser.photoURL) {
            setAvatarUrl(firebaseUser.photoURL);
          }
        }

        try {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
        } catch (tokenErr) {
          console.warn('[AuthContext] Error retrieving ID token:', tokenErr);
        }

        try {
          const p = await getUserProfile(firebaseUser.uid);
          if (p) {
            setProfile(p as UserProfile);
          } else {
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Celebration Host',
              currency: 'INR',
              language: 'English',
              subscription: 'free',
            } as UserProfile);
          }
        } catch (profileErr) {
          console.warn('[AuthContext] Profile load error, applying fallback session:', profileErr);
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Celebration Host',
            currency: 'INR',
            language: 'English',
            subscription: 'free',
          } as UserProfile);
        }
      } else {
        setIdToken(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        idToken,
        isConfigured: isFirebaseConfigured,
        avatarUrl,
        refreshProfile,
        updateAvatar,
        removeAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
