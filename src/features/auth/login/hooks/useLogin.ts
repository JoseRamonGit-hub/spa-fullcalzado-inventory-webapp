import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { toast } from "sonner";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authService.login(email, password),
    onSuccess: async (result) => {
      if (result.success) {
        useAuthStore.getState().setAuth(result.user);
        await router.navigate({ to: "/inventory" });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
