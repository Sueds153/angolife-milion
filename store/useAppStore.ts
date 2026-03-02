import { create } from 'zustand';
import { UserProfile, AppNotification } from '../types';

interface AppState {
  // Auth State
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  
  // UI State
  isDarkMode: boolean;
  isAuthModalOpen: boolean;
  authMode: 'login' | 'register';
  
  // Notifications
  notifications: AppNotification[];
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setIsAuthenticated: (status: boolean) => void;
  setIsAuthLoading: (status: boolean) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleTheme: () => void;
  setAuthModal: (open: boolean, mode?: 'login' | 'register') => void;
  addNotification: (notification: AppNotification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  isDarkMode: localStorage.getItem('theme') === 'dark' || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme')),
  isAuthModalOpen: false,
  authMode: 'login',
  notifications: [],

  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
  
  setDarkMode: (isDark) => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDarkMode: isDark });
  },
  
  toggleTheme: () => set((state) => {
    const newDark = !state.isDarkMode;
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: newDark };
  }),

  setAuthModal: (isOpen, mode = 'login') => set({ isAuthModalOpen: isOpen, authMode: mode }),
  
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications].slice(0, 5) 
  })),
  
  removeNotification: (id) => set((state) => ({ 
    notifications: state.notifications.filter(n => n.id !== id) 
  })),
  
  clearNotifications: () => set({ notifications: [] }),
}));
