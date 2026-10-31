import { logger } from '../utils/logger';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  type User,
  onAuthStateChanged,
  getRedirectResult,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase/config';
import { getUserProfile, syncUserRecord } from '../services/firebase/auth';
import {
  saveAvatarBlob,
  getAvatarBlob,
  deleteAvatarBlob,
} from '../services/storage/indexedDBAvatar';
import { compressAndResizeAvatar } from '../utils/imageCompressor';
import { AuthContext, type UserProfile } from './authContextDef';

export { type UserProfile, type AuthContextType } from './authContextDef';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user || !isFirebaseConfigured) return;
    try {
      const p = await getUserProfile(user.uid);
      if (p) setProfile(p as UserProfile);
    } catch (err) {
      logger.warn('[AuthContext] Failed to refresh profile:', err);
    }
  }, [user]);

  const updateAvatar = useCallback(
    async (file: File, onProgress?: (progress: number) => void) => {
      if (!user) throw new Error('Must be logged in to update avatar');

      const { blob, originalSize, compressedSize, mimeType } = await compressAndResizeAvatar(
        file,
        onProgress
      );

      await saveAvatarBlob(user.uid, blob);

      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
      }
      const objUrl = URL.createObjectURL(blob);
      activeObjectUrlRef.current = objUrl;
      setAvatarUrl(objUrl);

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
    if (!isFirebaseConfigured) return;

    if (typeof window !== 'undefined' && sessionStorage.getItem('celebrai_auth_redirect_pending') === 'true') {
      sessionStorage.removeItem('celebrai_auth_redirect_pending');
      getRedirectResult(auth)
        .then(async (credential) => {
          if (credential?.user) {
            await syncUserRecord(credential.user);
          }
        })
        .catch((err) => {
          logger.warn('[AuthContext] getRedirectResult check:', err);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
      setAvatarUrl(null);

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
        } catch {
          setIdToken(null);
        }

        try {
          const blob = await getAvatarBlob(firebaseUser.uid);
          if (blob) {
            const objUrl = URL.createObjectURL(blob);
            activeObjectUrlRef.current = objUrl;
            setAvatarUrl(objUrl);
          }
        } catch (err) {
          logger.warn('[AuthContext] Local avatar load error:', err);
        }

        try {
          const prof = await getUserProfile(firebaseUser.uid);
          if (prof) {
            setProfile(prof as UserProfile);
          } else {
            await syncUserRecord(firebaseUser);
            const fresh = await getUserProfile(firebaseUser.uid);
            if (fresh) setProfile(fresh as UserProfile);
          }
        } catch (err) {
          logger.warn('[AuthContext] User profile load error:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIdToken(null);
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
