import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@tutorpair/shared';

export interface UserState {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthStore {
  user: UserState | null;
  isLoading: boolean;
  setUser: (user: UserState | null) => void;
  clearUser: () => void;
}

/**
 * DEVELOPMENT ONLY MOCK USER
 * -------------------------------------------------------------
 * When running locally without AWS Cognito configured, this default user
 * allows immediate testing of tutor features without manual login.
 * In production, the initial state is populated via AWS Amplify / Cognito session sync.
 */
const DEV_MOCK_TUTOR: UserState | null = import.meta.env.DEV
  ? {
      id: 'mock-tutor-id',
      email: 'tutor@tutorpair.local',
      role: UserRole.TUTOR,
    }
  : null;

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
      // Defaults to mock tutor in local dev mode; null in production
      user: DEV_MOCK_TUTOR,
      isLoading: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'tutorpair-auth-session', // Key in localStorage
    }
  )
);


