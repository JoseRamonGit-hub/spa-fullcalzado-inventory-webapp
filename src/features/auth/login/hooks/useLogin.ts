import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { toast } from "sonner";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authService.login(email, password);
      if (!result.success) throw new Error(result.error);
      return result.user;
    },
    onSuccess: async (user) => {
      useAuthStore.getState().setAuth(user);
      await router.navigate({ to: "/inventory" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
