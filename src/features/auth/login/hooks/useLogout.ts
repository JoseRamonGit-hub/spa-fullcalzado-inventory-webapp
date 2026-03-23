import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { queryClient } from "@/lib/queryClient";

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Clear local state immediately — no network required.
      useAuthStore.getState().clearAuth();
      queryClient.clear();
      // Best-effort: revoke the server-side session in the background.
      // Not awaited so a dropped connection never blocks the UX.
      authService.logout().catch(() => {});
    },
    onSuccess: async () => {
      await router.navigate({ to: "/login", replace: true });
    },
  });
}
