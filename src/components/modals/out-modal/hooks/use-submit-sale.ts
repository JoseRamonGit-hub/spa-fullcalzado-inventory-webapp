import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useCreateSale } from "@/features/transactions/hooks/useTransactionMutations";
import type { PendingSaleLine } from "../types";
import type { CasheaOrderInput } from "@/types";
import { getSaleSubmissionErrorMessage } from "@/components/modals/shared/submission-messages";

type SubmitSaleOptions = {
  pendingSaleLines: PendingSaleLine[];
  currentExchangeRate: number;
  /** Orden Cashea validada; `null` en una venta sin Cashea. */
  casheaOrder: CasheaOrderInput | null;
  clearPendingSaleLines: () => void;
  onSuccess: () => void;
};

export function useSubmitSale({
  pendingSaleLines,
  currentExchangeRate,
  casheaOrder,
  clearPendingSaleLines,
  onSuccess,
}: SubmitSaleOptions) {
  const currentUser = useAuthStore((state) => state.user);
  const createSaleMutation = useCreateSale();

  const isSubmissionPending = createSaleMutation.isPending;

  const submitSale = async () => {
    const hasNoLines = pendingSaleLines.length === 0;
    if (!currentUser || hasNoLines) return;

    const salePromise = createSaleMutation.mutateAsync({
      p_items: pendingSaleLines.map((saleLine) => ({
        product_id: saleLine.productId,
        quantity: saleLine.quantity,
        price_usd: saleLine.priceUsd,
        price_ves: saleLine.priceVes,
      })),
      p_exchange_rate: currentExchangeRate,
      ...(casheaOrder && { p_cashea: casheaOrder }),
    });

    const lineCount = pendingSaleLines.length;
    const lineLabel = lineCount === 1 ? "1 renglón" : `${lineCount} renglones`;

    const saleLabel = casheaOrder ? "Venta Cashea" : "venta";

    toast.promise(salePromise, {
      loading: `Registrando ${saleLabel} con ${lineLabel}...`,
      success: casheaOrder ? "Venta Cashea registrada correctamente" : "Venta registrada correctamente",
      error: getSaleSubmissionErrorMessage,
    });

    await salePromise;
    clearPendingSaleLines();
    onSuccess();
  };

  return { submitSale, isSubmissionPending };
}
