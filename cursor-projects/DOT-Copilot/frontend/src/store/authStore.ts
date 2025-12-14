import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';
import { apiService } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.login(email, password);
          if (response.data) {
            const token = response.data.token;
            localStorage.setItem('auth_token', token);
            set({
              user: response.data.user,
              token,
              isAuthenticated: true,
              loading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            loading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      resetPassword: async (email: string) => {
        set({ loading: true, error: null });
        try {
          await apiService.resetPassword(email);
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Password reset failed',
            loading: false,
          });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

