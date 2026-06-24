import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { accessibleBusinessesQueryOptions } from "@/features/business/hooks/useBusinessQueries";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authService.login(email, password);
      if (!result.success) throw new Error(result.error);
      return result.user;
    },
    onSuccess: async (user) => {
      useBusinessStore.getState().clear();
      useAuthStore.getState().setAuth(user);
      void queryClient.prefetchQuery(accessibleBusinessesQueryOptions(user.id));
      await router.navigate({ to: "/inventory" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
