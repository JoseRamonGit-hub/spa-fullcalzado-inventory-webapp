import { useState, useCallback, useMemo } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { DataTable } from "@/components/ui/data-table";
import { pendingItemColumns } from "./columns";
import { useBatch } from "./hooks/use-batch";
import { useSubmitBatch } from "./hooks/use-submit-batch";
import { UnifiedEntryForm } from "./components/unified-entry-form";
import { ConfirmBatchDialog } from "./components/confirm-batch-dialog";
import { BatchSummaryFooter } from "./components/batch-summary-footer";
import { useModalKeyboardShortcuts } from "@/components/modals/shared/use-modal-keyboard-shortcuts";

type InModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function InModal({ isOpen, onOpenChange }: InModalProps) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { pendingBatchItems, addPendingBatchItem, removePendingBatchItem, clearPendingBatchItems } = useBatch();

  const handleSubmissionSuccess = useCallback(() => {
    setIsConfirmDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { submitPendingBatchItems, isSubmissionPending } = useSubmitBatch({
    pendingBatchItems,
    clearPendingBatchItems,
    onSuccess: handleSubmissionSuccess,
  });

  const handleModalOpenChange = useCallback(
    (isCurrentlyOpen: boolean) => {
      if (!isCurrentlyOpen) {
        clearPendingBatchItems();
      }
      onOpenChange(isCurrentlyOpen);
    },
    [onOpenChange, clearPendingBatchItems],
  );

  const keyboardShortcuts = useMemo(
    () => [
      {
        key: "enter",
        shiftKey: true,
        when: pendingBatchItems.length > 0,
        stopPropagation: true,
        onTrigger: () => setIsConfirmDialogOpen(true),
      },
    ],
    [pendingBatchItems.length],
  );

  useModalKeyboardShortcuts({ enabled: isOpen, shortcuts: keyboardShortcuts });

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleModalOpenChange}
        title="Carga de Inventario"
        description="Busca un producto existente o ingresa un código nuevo para agregarlo al lote."
        dialogClassName="min-w-4xl"
        avoidCloseFromOutsideClick
        descriptionSrOnly
        footer={
          <BatchSummaryFooter
            pendingBatchItems={pendingBatchItems}
            isSubmissionPending={isSubmissionPending}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
        }
      >
        <section className="flex flex-col gap-3 md:gap-4">
          <header>
            <UnifiedEntryForm pendingBatchItems={pendingBatchItems} onAddPendingBatchItem={addPendingBatchItem} />
          </header>

          <article className="bg-card -mx-2 flex h-40 flex-col overflow-hidden rounded-md border md:h-64">
            <DataTable
              columns={pendingItemColumns}
              data={pendingBatchItems}
              emptyMessage="Busca un producto por código o descripción para comenzar."
              meta={{ onRemovePendingBatchItem: removePendingBatchItem }}
              hidePagination
            />
          </article>
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
