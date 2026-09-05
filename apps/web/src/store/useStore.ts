import { create } from 'zustand';
import { User, Workspace } from '../types';
import { api } from '../services/api';

interface AppState {
  user: User | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeTab: 'dashboard' | 'tasks' | 'jobs' | 'interview' | 'calendar' | 'rag';
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspaceId: (id: string) => void;
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'jobs' | 'interview' | 'calendar' | 'rag') => void;
  initSession: () => Promise<void>;
  logout: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  workspaces: [],
  activeWorkspaceId: null,
  activeTab: 'dashboard',
  isLoading: true,

  setUser: (user) => set({ user }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  initSession: async () => {
    set({ isLoading: true });
    try {
      // Check if we have token
      const token = localStorage.getItem('flowdesk_token');
      if (token) {
        const userData = await api.getMe();
        set({
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            targetRole: userData.targetRole,
            defaultWorkspaceId: userData.workspaces?.[0]?.id
          },
          workspaces: userData.workspaces || [],
          activeWorkspaceId: userData.workspaces?.[0]?.id || null,
          isLoading: false
        });
        return;
      }

      // Auto-login with default seeded demo user for zero-friction experience
      const loginRes = await api.login('aina@flowdesk.dev', 'password123');
      api.setToken(loginRes.token);
      const workspaces = await api.getWorkspaces();
      set({
        user: loginRes.user,
        workspaces,
        activeWorkspaceId: workspaces[0]?.id || loginRes.user.defaultWorkspaceId,
        isLoading: false
      });
    } catch (err) {
      console.warn('Session init warning (API may still be bootstrapping):', err);
      set({ isLoading: false });
    }
  },

  logout: () => {
    api.clearToken();
    set({ user: null, workspaces: [], activeWorkspaceId: null });
  }
}));
