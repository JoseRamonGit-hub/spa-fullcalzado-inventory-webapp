import { useState, useCallback, useEffect } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { DataTable } from "@/components/ui/data-table";
import { pendingSaleColumns } from "./columns";

import { usePendingSales } from "./hooks/use-pending-sales";
import { useSubmitSales } from "./hooks/use-submit-sales";
import { ProductSaleForm } from "./components/product-sale-form";
import { SalesSummaryFooter } from "./components/sales-summary-footer";
import { ConfirmSalesDialog } from "./components/confirm-sales-dialog";

type OutModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const INITIAL_FALLBACK_RATE = 0;

export function OutModal({ isOpen, onOpenChange }: OutModalProps) {
  const { data: exchangeRateData } = useExchangeRate();
  const currentExchangeRate = exchangeRateData?.rate ?? INITIAL_FALLBACK_RATE;

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { pendingSales, addPendingSale, removePendingSale, clearPendingSales, totalAmountUsd, totalAmountVes } =
    usePendingSales();

  const handleSubmissionSuccess = useCallback(() => {
    setIsConfirmDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { submitPendingSales, isSubmissionPending } = useSubmitSales({
    pendingSales,
    currentExchangeRate,
    clearPendingSales,
    onSuccess: handleSubmissionSuccess,
  });

  const handleModalOpenChange = useCallback(
    (isCurrentlyOpen: boolean) => {
      if (!isCurrentlyOpen) {
        clearPendingSales();
      }
      onOpenChange(isCurrentlyOpen);
    },
    [onOpenChange, clearPendingSales],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      const hasPendingSales = pendingSales.length > 0;
      if (event.shiftKey && event.key === "Enter" && hasPendingSales && !isConfirmDialogOpen) {
        event.preventDefault();
        event.stopPropagation();
        setIsConfirmDialogOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, [isOpen, pendingSales.length, isConfirmDialogOpen]);

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleModalOpenChange}
        title="Registrar Ventas"
        description="Agrega productos al lote y confirma con Shift + Enter."
        dialogClassName="sm:max-w-4xl"
        avoidCloseFromOutsideClick
        avoidCloseFromEsc
        descriptionSrOnly
        footer={
          <SalesSummaryFooter
            pendingSales={pendingSales}
            currentExchangeRate={currentExchangeRate}
            totalAmountUsd={totalAmountUsd}
            totalAmountVes={totalAmountVes}
            isSubmissionPending={isSubmissionPending}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
        }
      >
        <section className="flex flex-col gap-4">
          <ProductSaleForm currentExchangeRate={currentExchangeRate} onAddPendingSale={addPendingSale} />

          <article className="bg-card h-56 overflow-hidden rounded-md border md:h-64">
            <DataTable
              columns={pendingSaleColumns}
              data={pendingSales}
              emptyMessage="Agrega ventas usando el buscador de arriba."
              meta={{ onRemovePendingSale: removePendingSale }}
            />
          </article>
        </section>
      </ResponsiveModal>

      <ConfirmSalesDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        pendingSales={pendingSales}
        currentExchangeRate={currentExchangeRate}
        totalAmountUsd={totalAmountUsd}
        totalAmountVes={totalAmountVes}
        isSubmissionPending={isSubmissionPending}
        onConfirmSubmit={submitPendingSales}
      />
    </>
  );
}
