import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store";
import { queryClient } from "@/lib/queryClient";
import { toast } from "sonner";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authService.login(email, password),
    onSuccess: async (result) => {
      if (result.success) {
        useAuthStore.getState().setAuth(result.user);
        await router.navigate({ to: "/inventory" });
      } else {
        toast.error(result.error);
      }
    },
  });
}

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
