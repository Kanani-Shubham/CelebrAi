import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';

export type { UserProfile };

export type AuthContextType = {
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

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  idToken: null,
  isConfigured: true,
  avatarUrl: null,
  refreshProfile: async () => {},
  updateAvatar: async () => ({ originalSize: 0, compressedSize: 0, mimeType: 'image/jpeg' }),
  removeAvatar: async () => {},
});
