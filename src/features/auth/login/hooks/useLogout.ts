import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear local state immediately — no network required.
      useAuthStore.getState().clearAuth();
      useBusinessStore.getState().clear();
      queryClient.clear();
      // Best-effort: revoke the server-side session in the background.
      // Not awaited so a dropped connection never blocks the UX.
      void authService.logout();
    },
    onSuccess: async () => {
      await router.navigate({ to: "/login", replace: true });
    },
  });
}
