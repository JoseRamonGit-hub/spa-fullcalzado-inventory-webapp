import { useCallback } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useCreateManyTransactions } from "@/features/transactions/hooks/useTransactions";
import type { PendingSale } from "../types";

interface UseSubmitSalesProps {
  pendingSales: PendingSale[];
  currentExchangeRate: number;
  clearPendingSales: () => void;
  onSuccess: () => void;
}

export function useSubmitSales({
  pendingSales,
  currentExchangeRate,
  clearPendingSales,
  onSuccess,
}: UseSubmitSalesProps) {
  const currentUser = useAuthStore((state) => state.user);
  const createTransactionsMutation = useCreateManyTransactions();

  const isSubmissionPending = createTransactionsMutation.isPending;

  const submitPendingSales = useCallback(async () => {
    const hasNoSales = pendingSales.length === 0;
    if (!currentUser || hasNoSales) return;

    const transactionPayload = pendingSales.map((sale) => ({
      product_id: sale.productId,
      quantity: sale.quantity,
      price_usd: sale.priceUsd,
      price_ves: sale.priceVes,
      exchange_rate: currentExchangeRate,
      user_id: currentUser.id,
    }));

    const salesPromise = createTransactionsMutation.mutateAsync(transactionPayload);
    const totalSalesCount = pendingSales.length;
    const isMultipleSales = totalSalesCount > 1;

    toast.promise(salesPromise, {
      loading: `Registrando ${totalSalesCount} venta${isMultipleSales ? "s" : ""}...`,
      success: `${totalSalesCount} venta${isMultipleSales ? "s" : ""} registrada${
        isMultipleSales ? "s" : ""
      } correctamente`,
      error: "Error al registrar las ventas",
    });

    await salesPromise;
    clearPendingSales();
    onSuccess();
  }, [currentUser, pendingSales, currentExchangeRate, createTransactionsMutation, clearPendingSales, onSuccess]);

  return { submitPendingSales, isSubmissionPending };
}
