import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";

import { usePendingSales } from "./hooks/use-pending-sales";
import { useSubmitSales } from "./hooks/use-submit-sales";
import { ProductSaleForm } from "./components/product-sale-form";
import { SalesSummaryFooter } from "./components/sales-summary-footer";
import { ConfirmSalesDialog } from "./components/confirm-sales-dialog";
import { useModalKeyboardShortcuts } from "@/components/modals/shared/use-modal-keyboard-shortcuts";
import { PendingSalesPanel } from "./components/pending-sales-panel";
import { SalesSummaryBlock } from "./components/sales-summary-block";

type OutModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function OutModal({ isOpen, onOpenChange }: OutModalProps) {
  const navigate = useNavigate();
  const { data: exchangeRateData, isLoading: isExchangeRateLoading } = useExchangeRate();
  const currentExchangeRate = exchangeRateData?.rate ?? 0;
  const isExchangeRateReady = !!exchangeRateData?.rate;

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { pendingSales, addPendingSale, removePendingSale, clearPendingSales, totalAmountUsd, totalAmountVes } =
    usePendingSales();

  const handleSubmissionSuccess = () => {
    setIsConfirmDialogOpen(false);
    onOpenChange(false);
    navigate({ to: "/transactions" });
  };

  const { submitPendingSales, isSubmissionPending } = useSubmitSales({
    pendingSales,
    currentExchangeRate,
    clearPendingSales,
    onSuccess: handleSubmissionSuccess,
  });

  const handleModalOpenChange = (isCurrentlyOpen: boolean) => {
    if (!isCurrentlyOpen) {
      clearPendingSales();
    }
    onOpenChange(isCurrentlyOpen);
  };

  const keyboardShortcuts = [
    {
      key: "enter",
      shiftKey: true,
      when: pendingSales.length > 0 && !isConfirmDialogOpen && isExchangeRateReady,
      stopPropagation: true,
      onTrigger: () => setIsConfirmDialogOpen(true),
    },
  ];

  useModalKeyboardShortcuts({ enabled: isOpen, shortcuts: keyboardShortcuts });

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleModalOpenChange}
        title="Registrar Ventas"
        description="Agrega productos al lote y confirma con Shift + Enter."
        dialogClassName="sm:max-w-5xl"
        avoidCloseFromOutsideClick
        avoidCloseFromEsc
        footer={
          <SalesSummaryFooter
            pendingSales={pendingSales}
            currentExchangeRate={currentExchangeRate}
            isExchangeRateLoading={isExchangeRateLoading}
            isSubmissionPending={isSubmissionPending}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
        }
      >
        <section className="flex flex-col gap-3 md:gap-4">
          <ProductSaleForm
            currentExchangeRate={currentExchangeRate}
            isExchangeRateReady={isExchangeRateReady}
            onAddPendingSale={addPendingSale}
          />

          <div className="grid min-h-0 gap-3 md:grid-cols-[minmax(0,1fr)_17rem]">
            <PendingSalesPanel pendingSales={pendingSales} onRemovePendingSale={removePendingSale} />
            <SalesSummaryBlock
              currentExchangeRate={currentExchangeRate}
              isExchangeRateLoading={isExchangeRateLoading}
              totalAmountUsd={totalAmountUsd}
              totalAmountVes={totalAmountVes}
            />
          </div>
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
