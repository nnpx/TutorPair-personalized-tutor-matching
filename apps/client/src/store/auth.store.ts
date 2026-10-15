import { create } from 'zustand';
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

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
