import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@tutorpair/shared';

export interface UserState {
  id: string;
  email: string;
  role: UserRole;
  cognito_sub?: string;
}

export interface AuthStore {
  user: UserState | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: UserState | null, token?: string | null) => void;
  setAuth: (user: UserState | null, token: string | null) => void;
  clearUser: () => void;
  clearAuth: () => void;
}

/**
 * Zustand Global Auth Store
 * -------------------------------------------------------------
 * - Manages the authenticated user's client-side state (id, email, role, cognito_sub)
 *   and authentic login token.
 * - Uses `persist` middleware with `localStorage` so the session survives browser refreshes (F5).
 * - Gated route guards (ProtectedRoute) and Axios interceptors read from this store.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setUser: (user, token) =>
        set((state) => ({
          user,
          token: token !== undefined ? token : user ? state.token : null,
        })),
      setAuth: (user, token) => set({ user, token }),
      clearUser: () => set({ user: null, token: null }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'tutorpair-auth-session', // Key in localStorage
    }
  )
);
