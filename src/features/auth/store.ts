import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"
import { authService } from "@/services/authService"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  restoreSession: () => Promise<void>
  isAdmin: () => boolean
  getRole: () => User["role"] | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      restoreSession: async () => {
        if (get().user) return
        const profile = await authService.getSession()
        if (profile) {
          set({ user: profile, isAuthenticated: true })
        }
      },

      isAdmin: () => get().user?.role === "admin",
      getRole: () => get().user?.role ?? null,
    }),
    {
      name: "auth-storage",
    },
  ),
)

