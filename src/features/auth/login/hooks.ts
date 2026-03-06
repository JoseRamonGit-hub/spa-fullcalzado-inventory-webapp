import { useMutation } from "@tanstack/react-query"
import { authService } from "@/services/authService"
import { useAuthStore } from "@/features/auth/store"

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (result) => {
      if (result.success && result.user) {
        useAuthStore.setState({ user: result.user, isAuthenticated: true })
      }
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      useAuthStore.setState({ user: null, isAuthenticated: false })
    },
  })
}
