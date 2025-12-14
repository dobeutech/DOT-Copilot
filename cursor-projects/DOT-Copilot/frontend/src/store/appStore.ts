import { create } from 'zustand';
import type {
  Fleet,
  TrainingProgram,
  Module,
  Lesson,
  Assignment,
  Notification,
  User,
} from '../types';
import { apiService } from '../services/api';

interface AppState {
  // Data
  fleets: Fleet[];
  trainingPrograms: TrainingProgram[];
  modules: Module[];
  lessons: Lesson[];
  assignments: Assignment[];
  notifications: Notification[];
  users: User[];

  // Loading states
  loading: {
    fleets: boolean;
    trainingPrograms: boolean;
    modules: boolean;
    lessons: boolean;
    assignments: boolean;
    notifications: boolean;
    users: boolean;
  };

  // Actions
  fetchFleets: () => Promise<void>;
  fetchTrainingPrograms: () => Promise<void>;
  fetchModules: (fleetId?: string) => Promise<void>;
  fetchLessons: (moduleId?: string) => Promise<void>;
  fetchAssignments: (userId?: string) => Promise<void>;
  fetchNotifications: (userId?: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  fleets: [],
  trainingPrograms: [],
  modules: [],
  lessons: [],
  assignments: [],
  notifications: [],
  users: [],

  loading: {
    fleets: false,
    trainingPrograms: false,
    modules: false,
    lessons: false,
    assignments: false,
    notifications: false,
    users: false,
  },

  fetchFleets: async () => {
    set((state) => ({ loading: { ...state.loading, fleets: true } }));
    try {
      const response = await apiService.getFleets();
      if (response.data) {
        set({ fleets: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch fleets:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, fleets: false } }));
    }
  },

  fetchTrainingPrograms: async () => {
    set((state) => ({ loading: { ...state.loading, trainingPrograms: true } }));
    try {
      const response = await apiService.getTrainingPrograms();
      if (response.data) {
        set({ trainingPrograms: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch training programs:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, trainingPrograms: false } }));
    }
  },

  fetchModules: async (fleetId?: string) => {
    set((state) => ({ loading: { ...state.loading, modules: true } }));
    try {
      const response = await apiService.getModules(fleetId);
      if (response.data) {
        set({ modules: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, modules: false } }));
    }
  },

  fetchLessons: async (moduleId?: string) => {
    set((state) => ({ loading: { ...state.loading, lessons: true } }));
    try {
      const response = await apiService.getLessons(moduleId);
      if (response.data) {
        set({ lessons: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, lessons: false } }));
    }
  },

  fetchAssignments: async (userId?: string) => {
    set((state) => ({ loading: { ...state.loading, assignments: true } }));
    try {
      const response = await apiService.getAssignments(userId);
      if (response.data) {
        set({ assignments: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, assignments: false } }));
    }
  },

  fetchNotifications: async (userId?: string) => {
    set((state) => ({ loading: { ...state.loading, notifications: true } }));
    try {
      const response = await apiService.getNotifications(userId);
      if (response.data) {
        set({ notifications: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, notifications: false } }));
    }
  },

  fetchUsers: async () => {
    set((state) => ({ loading: { ...state.loading, users: true } }));
    try {
      const response = await apiService.getUsers();
      if (response.data) {
        set({ users: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, users: false } }));
    }
  },
}));

