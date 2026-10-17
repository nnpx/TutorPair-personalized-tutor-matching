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

const initialUserStr = localStorage.getItem('tp_mock_user');
const initialUser: UserState | null = initialUserStr ? JSON.parse(initialUserStr) : null;
if (initialUser) {
  (window as any).__TP_CURRENT_USER__ = initialUser;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: initialUser,
  isLoading: false,
  setUser: (user) => {
    (window as any).__TP_CURRENT_USER__ = user;
    if (user) {
      localStorage.setItem('tp_mock_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tp_mock_user');
    }
    set({ user });
  },
  clearUser: () => {
    (window as any).__TP_CURRENT_USER__ = null;
    localStorage.removeItem('tp_mock_user');
    set({ user: null });
  },
}));
