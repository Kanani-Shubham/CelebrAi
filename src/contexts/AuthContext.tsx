import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { getUserProfile } from '../services/firebase/auth';

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
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  idToken: null,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await getUserProfile(user.uid);
    if (p) setProfile(p as UserProfile);
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setIdToken(token);
        const p = await getUserProfile(firebaseUser.uid);
        setProfile(p as UserProfile | null);
      } else {
        setIdToken(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Refresh token every 50 minutes (before 1-hour expiry)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const token = await user.getIdToken(true);
      setIdToken(token);
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, idToken, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
