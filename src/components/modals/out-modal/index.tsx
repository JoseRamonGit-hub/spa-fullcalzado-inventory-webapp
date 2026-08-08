import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import { useModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

import { usePendingSaleLines } from "./hooks/use-pending-sales";
import { useSubmitSale } from "./hooks/use-submit-sales";
import { ProductSaleForm } from "./components/product-sale-form";
import { SalesSummaryFooter } from "./components/sales-summary-footer";
import { ConfirmSalesDialog } from "./components/confirm-sales-dialog";
import { useModalKeyboardShortcuts } from "@/components/modals/shared/use-modal-keyboard-shortcuts";
import { PendingSaleLinesPanel } from "./components/pending-sales-panel";
import { SalesSummaryBlock } from "./components/sales-summary-block";

type OutModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function OutModal({ isOpen, onOpenChange }: OutModalProps) {
  const navigate = useNavigate();
  const exchangeRate = useModalExchangeRate();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const {
    pendingSaleLines,
    addPendingSaleLine,
    removePendingSaleLine,
    clearPendingSaleLines,
    totalAmountUsd,
    totalAmountVes,
  } = usePendingSaleLines();

  const handleSubmissionSuccess = () => {
    setIsConfirmDialogOpen(false);
    onOpenChange(false);
    navigate({ to: "/transactions" });
  };

  const { submitSale, isSubmissionPending } = useSubmitSale({
    pendingSaleLines,
    currentExchangeRate: exchangeRate.value,
    clearPendingSaleLines,
    onSuccess: handleSubmissionSuccess,
  });

  const handleModalOpenChange = (isCurrentlyOpen: boolean) => {
    if (!isCurrentlyOpen) {
      clearPendingSaleLines();
    }
    onOpenChange(isCurrentlyOpen);
  };

  const keyboardShortcuts = [
    {
      key: "enter",
      shiftKey: true,
      when: pendingSaleLines.length > 0 && !isConfirmDialogOpen && exchangeRate.isReady,
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
        title="Registrar Venta"
        description="Agrega productos a la Venta y confirma con Shift + Enter."
        dialogClassName="sm:max-w-5xl"
        avoidCloseFromOutsideClick
        avoidCloseFromEsc
        footer={
          <SalesSummaryFooter
            pendingSaleLines={pendingSaleLines}
            exchangeRate={exchangeRate}
            isSubmissionPending={isSubmissionPending}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
        }
      >
        <section className="flex flex-col gap-3 md:gap-4">
          <ProductSaleForm exchangeRate={exchangeRate} onAddPendingSaleLine={addPendingSaleLine} />

          <div className="grid min-h-0 gap-3 md:grid-cols-[minmax(0,1fr)_17rem]">
            <PendingSaleLinesPanel
              pendingSaleLines={pendingSaleLines}
              onRemovePendingSaleLine={removePendingSaleLine}
            />
            <SalesSummaryBlock
              exchangeRate={exchangeRate}
              totalAmountUsd={totalAmountUsd}
              totalAmountVes={totalAmountVes}
            />
          </div>
        </section>
      </ResponsiveModal>

      <ConfirmSalesDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        pendingSaleLines={pendingSaleLines}
        exchangeRate={exchangeRate}
        totalAmountUsd={totalAmountUsd}
        totalAmountVes={totalAmountVes}
        isSubmissionPending={isSubmissionPending}
        onConfirmSubmit={submitSale}
      />
    </>
  );
}
