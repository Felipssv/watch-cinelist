import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_active?: boolean;
  created_at?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser, refreshToken?: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (token, user, refreshToken) =>
        set({ token, refreshToken: refreshToken ?? null, user, isAuthenticated: true }),

      setToken: (token) => set({ token }),

      logout: () =>
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'cinelist-auth',
    }
  )
);
