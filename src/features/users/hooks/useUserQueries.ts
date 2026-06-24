import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/usersService";

export const userKeys = {
  all: ["users"] as const,
  managed: () => [...userKeys.all, "managed"] as const,
};

export function useManagedUsers() {
  return useQuery({
    queryKey: userKeys.managed(),
    queryFn: usersService.getManagedUsers,
  });
}
