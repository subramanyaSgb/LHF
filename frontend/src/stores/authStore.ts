import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/utils/mock-data';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasMinRole: (minRole: UserRole) => boolean;
}

const roleHierarchy: Record<UserRole, number> = {
  viewer: 0,
  operator: 1,
  admin: 2,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, _password: string) => {
        // Mock authentication — replace with real API call
        const user = mockUsers.find((u) => u.username === username);
        if (user) {
          set({
            user,
            token: `mock-jwt-${user.id}-${Date.now()}`,
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
      },

      hasMinRole: (minRole: UserRole) => {
        const { user } = get();
        if (!user) return false;
        return roleHierarchy[user.role] >= roleHierarchy[minRole];
      },
    }),
    {
      name: 'infrasense-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
