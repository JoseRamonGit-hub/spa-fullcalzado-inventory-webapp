import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { DataTable } from "@/components/ui/data-table";
import { pendingSaleColumns } from "./columns";

import { usePendingSales } from "./hooks/use-pending-sales";
import { useSubmitSales } from "./hooks/use-submit-sales";
import { ProductSaleForm } from "./components/product-sale-form";
import { SalesSummaryFooter } from "./components/sales-summary-footer";
import { ConfirmSalesDialog } from "./components/confirm-sales-dialog";
import { useModalKeyboardShortcuts } from "@/components/modals/shared/use-modal-keyboard-shortcuts";

type OutModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const INITIAL_FALLBACK_RATE = 0;

export function OutModal({ isOpen, onOpenChange }: OutModalProps) {
  const navigate = useNavigate();
  const { data: exchangeRateData, isLoading: isExchangeRateLoading } = useExchangeRate();
  const currentExchangeRate = exchangeRateData?.rate ?? INITIAL_FALLBACK_RATE;
  const isExchangeRateReady = !!exchangeRateData?.rate;

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { pendingSales, addPendingSale, removePendingSale, clearPendingSales, totalAmountUsd, totalAmountVes } =
    usePendingSales();

  const handleSubmissionSuccess = useCallback(() => {
    setIsConfirmDialogOpen(false);
    onOpenChange(false);
    navigate({ to: "/transactions" });
  }, [onOpenChange, navigate]);

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

  const keyboardShortcuts = useMemo(
    () => [
      {
        key: "enter",
        shiftKey: true,
        when: pendingSales.length > 0 && !isConfirmDialogOpen && isExchangeRateReady,
        stopPropagation: true,
        onTrigger: () => setIsConfirmDialogOpen(true),
      },
    ],
    [pendingSales.length, isConfirmDialogOpen, isExchangeRateReady],
  );

  useModalKeyboardShortcuts({ enabled: isOpen, shortcuts: keyboardShortcuts });

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
            isExchangeRateLoading={isExchangeRateLoading}
            totalAmountUsd={totalAmountUsd}
            totalAmountVes={totalAmountVes}
            isSubmissionPending={isSubmissionPending}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
        }
      >
        <section className="flex flex-col gap-4">
          <ProductSaleForm
            currentExchangeRate={currentExchangeRate}
            isExchangeRateReady={isExchangeRateReady}
            onAddPendingSale={addPendingSale}
          />

          <article className="bg-card h-56 overflow-hidden rounded-md border md:h-64">
            <DataTable
              columns={pendingSaleColumns}
              data={pendingSales}
              emptyMessage="Agrega ventas usando el buscador de arriba."
              meta={{ onRemovePendingSale: removePendingSale }}
              hidePagination
            />
          </article>
        </section>
      </ResponsiveModal>

      <ConfirmSalesDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        pendingSales={pendingSales}
        currentExchangeRate={currentExchangeRate}
        isExchangeRateLoading={isExchangeRateLoading}
        totalAmountUsd={totalAmountUsd}
        totalAmountVes={totalAmountVes}
        isSubmissionPending={isSubmissionPending}
        onConfirmSubmit={submitPendingSales}
      />
    </>
  );
}
