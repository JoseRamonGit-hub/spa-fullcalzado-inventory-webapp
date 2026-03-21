import { useCallback } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useCreateReturn } from "@/features/returns/hooks/useReturnMutations";
import type { PendingReturnItem, PendingExchangeItem } from "../types";

type UseSubmitReturnProps = {
  returnItems: readonly PendingReturnItem[];
  exchangeItems: readonly PendingExchangeItem[];
  returnType: "exchange" | "refund";
  currentExchangeRate: number;
  notes: string;
  clearAll: () => void;
  onSuccess: () => void;
};

export function useSubmitReturn({
  returnItems,
  exchangeItems,
  returnType,
  currentExchangeRate,
  notes,
  clearAll,
  onSuccess,
}: UseSubmitReturnProps) {
  const currentUser = useAuthStore((state) => state.user);
  const createReturnMutation = useCreateReturn();

  const isSubmissionPending = createReturnMutation.isPending;

  const submitReturn = useCallback(async () => {
    if (!currentUser || returnItems.length === 0) return;

    const payload = {
      p_type: returnType as "exchange" | "refund",
      p_returned_items: returnItems.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price_usd: item.priceUsd,
        price_ves: item.priceVes,
      })),
      p_new_items:
        exchangeItems.length > 0
          ? exchangeItems.map((item) => ({
              product_id: item.productId,
              quantity: item.quantity,
              price_usd: item.priceUsd,
              price_ves: item.priceVes,
            }))
          : null,
      p_exchange_rate: currentExchangeRate,
      p_user_id: currentUser.id,
      p_notes: notes || undefined,
    };

    const label = returnType === "exchange" ? "cambio" : "devolución";

    const returnPromise = createReturnMutation.mutateAsync(payload);

    toast.promise(returnPromise, {
      loading: `Registrando ${label}...`,
      success: `${label.charAt(0).toUpperCase() + label.slice(1)} registrado correctamente`,
      error: (err: Error) => err.message || `Error al registrar el ${label}`,
    });

    await returnPromise;
    clearAll();
    onSuccess();
  }, [
    currentUser,
    returnItems,
    exchangeItems,
    returnType,
    currentExchangeRate,
    notes,
    createReturnMutation,
    clearAll,
    onSuccess,
  ]);

  return { submitReturn, isSubmissionPending };
}
