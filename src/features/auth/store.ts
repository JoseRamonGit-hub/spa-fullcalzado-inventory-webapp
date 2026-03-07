import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (user) => set({ user, isAuthenticated: true, isInitialized: true }),

  clearAuth: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
}));
