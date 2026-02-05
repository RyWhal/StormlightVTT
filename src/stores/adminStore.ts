import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  isAuthenticated: boolean;
  lastActivity: string | null;

  // Actions
  setAuthenticated: (authenticated: boolean) => void;
  updateActivity: () => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      lastActivity: null,

      setAuthenticated: (authenticated) =>
        set({
          isAuthenticated: authenticated,
          lastActivity: authenticated ? new Date().toISOString() : null,
        }),

      updateActivity: () =>
        set({ lastActivity: new Date().toISOString() }),

      logout: () =>
        set({
          isAuthenticated: false,
          lastActivity: null,
        }),
    }),
    {
      name: 'stormlight-vtt-admin',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
    }
  )
);

// Session timeout check (30 minutes)
export const isAdminSessionValid = (): boolean => {
  const state = useAdminStore.getState();
  if (!state.isAuthenticated || !state.lastActivity) return false;

  const lastActivity = new Date(state.lastActivity);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

  return diffMinutes < 30;
};
