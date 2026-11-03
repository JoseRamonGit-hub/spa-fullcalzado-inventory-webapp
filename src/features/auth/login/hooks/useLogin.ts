import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { useQueryClient } from "@tanstack/react-query";
import { accessibleBusinessesQueryOptions } from "@/features/business/hooks/useBusinessQueries";
import { getSafeRedirect, saveLastLoginEmail } from "../utils/login-utils";

/**
 * Errors are not toasted: the login form renders `error.message` inline,
 * next to the fields the user has to fix.
 */
export function useLogin(redirectTo?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authService.login(email, password);
      if (!result.success) throw new Error(result.error);
      return result.user;
    },
    onSuccess: async (user, { email }) => {
      saveLastLoginEmail(email);
      useBusinessStore.getState().clear();
      useAuthStore.getState().setAuth(user);
      void queryClient.prefetchQuery(accessibleBusinessesQueryOptions(user.id));

      const safeRedirect = getSafeRedirect(redirectTo);
      if (safeRedirect) {
        await router.navigate({ href: safeRedirect });
      } else {
        await router.navigate({ to: "/dashboard" });
      }
    },
  });
}
