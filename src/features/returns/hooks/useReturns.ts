import { useMutation, useQueryClient } from "@tanstack/react-query";
import { returnsService } from "@/services/returnsService";
import type { ProcessReturnPayload } from "@/types/index";

// ---------- Query Keys Factory ----------
export const returnKeys = {
  all: ["returns"] as const,
  lists: () => [...returnKeys.all, "list"] as const,
  list: (date?: string) => [...returnKeys.lists(), { date }] as const,
};

// ---------- Mutations ----------
export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcessReturnPayload) => returnsService.processReturn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: returnKeys.all });
    },
  });
}
