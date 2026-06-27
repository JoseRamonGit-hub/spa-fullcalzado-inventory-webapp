import { useState } from "react";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import { useBatch } from "./hooks/use-batch";
import { useSubmitBatch } from "./hooks/use-submit-batch";
import { UnifiedEntryForm } from "./components/unified-entry-form";
import { ConfirmBatchDialog } from "./components/confirm-batch-dialog";
import { BatchSummaryFooter } from "./components/batch-summary-footer";
import { useModalKeyboardShortcuts } from "@/components/modals/shared/use-modal-keyboard-shortcuts";
import { PendingBatchPanel } from "./components/pending-batch-panel";
import { BatchSummaryBlock } from "./components/batch-summary-block";

type InModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function InModal({ isOpen, onOpenChange }: InModalProps) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { pendingBatchItems, addPendingBatchItem, removePendingBatchItem, clearPendingBatchItems } = useBatch();

  const handleSubmissionSuccess = () => {
    setIsConfirmDialogOpen(false);
    onOpenChange(false);
  };

  const { submitPendingBatchItems, isSubmissionPending } = useSubmitBatch({
    pendingBatchItems,
    clearPendingBatchItems,
    onSuccess: handleSubmissionSuccess,
  });

  const handleModalOpenChange = (isCurrentlyOpen: boolean) => {
    if (!isCurrentlyOpen) {
      clearPendingBatchItems();
    }
    onOpenChange(isCurrentlyOpen);
  };

  const keyboardShortcuts = [
    {
      key: "enter",
      shiftKey: true,
      when: pendingBatchItems.length > 0,
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
        title="Carga de Inventario"
        description="Busca un producto existente o ingresa un código nuevo para agregarlo al lote."
        dialogClassName="sm:max-w-5xl"
        avoidCloseFromOutsideClick
        footer={
          <BatchSummaryFooter
            pendingBatchItems={pendingBatchItems}
            isSubmissionPending={isSubmissionPending}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
        }
      >
        <section className="flex flex-col gap-3 md:gap-4">
          <UnifiedEntryForm pendingBatchItems={pendingBatchItems} onAddPendingBatchItem={addPendingBatchItem} />

          <div className="grid min-h-0 gap-3 md:grid-cols-[minmax(0,1fr)_17rem]">
            <PendingBatchPanel
              pendingBatchItems={pendingBatchItems}
              onRemovePendingBatchItem={removePendingBatchItem}
            />
            <BatchSummaryBlock pendingBatchItems={pendingBatchItems} />
          </div>
        </section>
      </ResponsiveModal>

      <ConfirmBatchDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        pendingBatchItems={pendingBatchItems}
        isSubmissionPending={isSubmissionPending}
        onConfirmSubmit={submitPendingBatchItems}
      />
    </>
  );
}
