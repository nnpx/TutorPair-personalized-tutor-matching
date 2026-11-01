import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@tutorpair/shared';

export interface UserState {
  id: string;
  email: string;
  role: UserRole;
  cognito_sub?: string;
}

interface AuthStore {
  user: UserState | null;
  isLoading: boolean;
  setUser: (user: UserState | null) => void;
  clearUser: () => void;
}

/**
 * Zustand Global Auth Store
 * -------------------------------------------------------------
 * - Manages the authenticated user's client-side state (id, email, role).
 * - Uses `persist` middleware with `localStorage` so the session survives browser refreshes (F5).
 * - Gated route guards (ProtectedRoute) and Axios interceptors read from this store.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'tutorpair-auth-session', // Key in localStorage
    }
  )
);
