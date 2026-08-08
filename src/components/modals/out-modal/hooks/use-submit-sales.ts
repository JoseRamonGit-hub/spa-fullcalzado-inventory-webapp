import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useCreateSale } from "@/features/transactions/hooks/useTransactionMutations";
import type { PendingSale } from "../types";

type UseSubmitSalesProps = {
  pendingSales: PendingSale[];
  currentExchangeRate: number;
  clearPendingSales: () => void;
  onSuccess: () => void;
};

export function useSubmitSales({
  pendingSales,
  currentExchangeRate,
  clearPendingSales,
  onSuccess,
}: UseSubmitSalesProps) {
  const currentUser = useAuthStore((state) => state.user);
  const createSaleMutation = useCreateSale();

  const isSubmissionPending = createSaleMutation.isPending;

  const submitPendingSales = async () => {
    const hasNoSales = pendingSales.length === 0;
    if (!currentUser || hasNoSales) return;

    const salePromise = createSaleMutation.mutateAsync({
      p_items: pendingSales.map((sale) => ({
        product_id: sale.productId,
        quantity: sale.quantity,
        price_usd: sale.priceUsd,
        price_ves: sale.priceVes,
      })),
      p_exchange_rate: currentExchangeRate,
    });

    const lineCount = pendingSales.length;
    const lineLabel = lineCount === 1 ? "1 renglón" : `${lineCount} renglones`;

    toast.promise(salePromise, {
      loading: `Registrando venta con ${lineLabel}...`,
      success: "Venta registrada correctamente",
      error: "Error al registrar la venta",
    });

    await salePromise;
    clearPendingSales();
    onSuccess();
  };

  return { submitPendingSales, isSubmissionPending };
}
