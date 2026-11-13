import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import { useModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

import { usePendingSaleLines } from "./hooks/use-pending-sale-lines";
import { useSubmitSale } from "./hooks/use-submit-sale";
import { ProductSaleForm } from "./components/product-sale-form";
import { SalesSummaryFooter } from "./components/sales-summary-footer";
import { ConfirmSaleDialog } from "./components/confirm-sale-dialog";
import { useModalKeyboardShortcuts } from "@/components/modals/shared/use-modal-keyboard-shortcuts";
import { PendingSaleLinesPanel } from "./components/pending-sale-lines-panel";
import { SalesSummaryBlock } from "./components/sales-summary-block";
import { CasheaPaymentSection } from "./components/cashea-payment-section";
import { useCasheaPayment } from "./hooks/use-cashea-payment";

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

  const casheaPayment = useCasheaPayment(totalAmountUsd);
  const { casheaOrder, isCasheaIncomplete } = casheaPayment;
  const canOpenConfirmDialog = pendingSaleLines.length > 0 && exchangeRate.isReady && !isCasheaIncomplete;

  // Los datos Cashea se limpian junto con los Renglones pendientes.
  const clearSale = () => {
    clearPendingSaleLines();
    casheaPayment.clearCasheaPayment();
  };

  const handleSubmissionSuccess = () => {
    setIsConfirmDialogOpen(false);
    onOpenChange(false);
    navigate({ to: "/transactions" });
  };

  const { submitSale, isSubmissionPending } = useSubmitSale({
    pendingSaleLines,
    currentExchangeRate: exchangeRate.value,
    casheaOrder,
    clearPendingSaleLines: clearSale,
    onSuccess: handleSubmissionSuccess,
  });

  const openConfirmDialog = () => {
    if (canOpenConfirmDialog) setIsConfirmDialogOpen(true);
  };

  const handleModalOpenChange = (isCurrentlyOpen: boolean) => {
    if (!isCurrentlyOpen) {
      clearSale();
    }
    onOpenChange(isCurrentlyOpen);
  };

  const keyboardShortcuts = [
    {
      key: "enter",
      shiftKey: true,
      when: canOpenConfirmDialog && !isConfirmDialogOpen,
      stopPropagation: true,
      onTrigger: openConfirmDialog,
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
            isCasheaIncomplete={isCasheaIncomplete}
            onOpenConfirmDialog={openConfirmDialog}
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

          <CasheaPaymentSection
            isCasheaPayment={casheaPayment.isCasheaPayment}
            onCasheaPaymentChange={casheaPayment.setIsCasheaPayment}
            draft={casheaPayment.draft}
            evaluation={casheaPayment.evaluation}
            onDraftChange={casheaPayment.setDraft}
            disabled={isSubmissionPending}
          />
        </section>
      </ResponsiveModal>

      <ConfirmSaleDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        pendingSaleLines={pendingSaleLines}
        exchangeRate={exchangeRate}
        totalAmountUsd={totalAmountUsd}
        totalAmountVes={totalAmountVes}
        casheaOrder={casheaOrder}
        casheaSaleTotalMismatch={casheaPayment.evaluation.saleTotalMismatch}
        isSubmissionPending={isSubmissionPending}
        onConfirmSubmit={submitSale}
      />
    </>
  );
}
