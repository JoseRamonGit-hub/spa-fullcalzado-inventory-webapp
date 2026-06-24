import { requireActiveBusinessId } from "@/features/business/store/useBusinessStore";

export function activeBusinessMutationOptions<TVariables, TData>(
  mutationFn: (businessId: string, variables: TVariables) => Promise<TData>,
) {
  return {
    onMutate: () => ({ businessId: requireActiveBusinessId() }),
    mutationFn: (variables: TVariables) => mutationFn(requireActiveBusinessId(), variables),
  };
}
