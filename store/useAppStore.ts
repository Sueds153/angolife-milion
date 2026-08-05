import { create } from "zustand";
import { UserProfile, AppNotification } from "../types";
import { SystemSettings, Ad } from "../services/api/ads.service";

interface AppState {
  // Auth State
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  // UI State
  isDarkMode: boolean;
  isAuthModalOpen: boolean;
  authMode: "login" | "register";
  passwordRecovery: boolean;

  // Settings & Ads
  systemSettings: SystemSettings | null;
  activeAds: Ad[];

  // Notifications
  notifications: AppNotification[];

  // Actions
  setUser: (user: UserProfile | null) => void;
  setIsAuthenticated: (status: boolean) => void;
  setIsAuthLoading: (status: boolean) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleTheme: () => void;
  setAuthModal: (open: boolean, mode?: "login" | "register") => void;
  setPasswordRecovery: (open: boolean) => void;
  addNotification: (notification: AppNotification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setSystemSettings: (settings: SystemSettings) => void;
  setActiveAds: (ads: Ad[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  isDarkMode:
    localStorage.getItem("theme") === "dark" ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches &&
      !localStorage.getItem("theme")),
  isAuthModalOpen: false,
  authMode: "login",
  passwordRecovery: false,
  notifications: [],
  systemSettings: null,
  activeAds: [],

  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

  setDarkMode: (isDark) => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    set({ isDarkMode: isDark });
  },

  toggleTheme: () =>
    set((state) => {
      const newDark = !state.isDarkMode;
      localStorage.setItem("theme", newDark ? "dark" : "light");
      return { isDarkMode: newDark };
    }),

  setAuthModal: (isOpen, mode = "login") =>
    set({ isAuthModalOpen: isOpen, authMode: mode }),

  setPasswordRecovery: (open) => set({ passwordRecovery: open }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 5),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
  setSystemSettings: (systemSettings) => set({ systemSettings }),
  setActiveAds: (activeAds) => set({ activeAds }),
}));
