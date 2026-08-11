import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useCreateSale } from "@/features/transactions/hooks/useTransactionMutations";
import type { PendingSaleLine } from "../types";
import { MODAL_SUBMISSION_ERROR_MESSAGES } from "@/components/modals/shared/submission-messages";

type SubmitSaleOptions = {
  pendingSaleLines: PendingSaleLine[];
  currentExchangeRate: number;
  clearPendingSaleLines: () => void;
  onSuccess: () => void;
};

export function useSubmitSale({
  pendingSaleLines,
  currentExchangeRate,
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
    });

    const lineCount = pendingSaleLines.length;
    const lineLabel = lineCount === 1 ? "1 renglón" : `${lineCount} renglones`;

    toast.promise(salePromise, {
      loading: `Registrando venta con ${lineLabel}...`,
      success: "Venta registrada correctamente",
      error: MODAL_SUBMISSION_ERROR_MESSAGES.sale,
    });

    await salePromise;
    clearPendingSaleLines();
    onSuccess();
  };

  return { submitSale, isSubmissionPending };
}
