import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { queryClient } from "@/lib/queryClient";

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: async () => {
      // Always runs, even if signOut() threw (best-effort).
      // supabase.auth.signOut({ scope: 'local' }) always clears local
      // storage regardless of network errors, so our app state must match.
      useAuthStore.getState().clearAuth();
      queryClient.clear();
      await router.navigate({ to: "/login", replace: true });
    },
  });
}
