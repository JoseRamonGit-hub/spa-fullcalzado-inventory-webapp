import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { businessKeys } from "@/features/business/hooks/useBusinessQueries";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { usersService } from "@/services/usersService";
import type { CreateUserInput, ManagedUser, UpdateUserInput } from "@/types";
import { userKeys } from "./useUserQueries";

function syncCurrentUser(user: ManagedUser) {
  const currentUser = useAuthStore.getState().user;
  if (currentUser?.id === user.id) {
    useAuthStore.getState().setAuth(user);
  }
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersService.createUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.managed() });
      await queryClient.invalidateQueries({ queryKey: businessKeys.all });
      toast.success("Usuario creado correctamente.");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersService.updateUser(input),
    onSuccess: async (user) => {
      syncCurrentUser(user);
      await queryClient.invalidateQueries({ queryKey: userKeys.managed() });
      await queryClient.invalidateQueries({ queryKey: businessKeys.all });
      toast.success("Usuario actualizado correctamente.");
    },
    onError: (error) => toast.error(error.message),
  });
}
