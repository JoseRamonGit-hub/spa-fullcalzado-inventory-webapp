import { useState, useCallback, useEffect } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { DataTable } from "@/components/ui/data-table";
import { pendingItemColumns } from "./columns";
import { useBatch } from "./hooks/use-batch";
import { useSubmitBatch } from "./hooks/use-submit-batch";
import { NewProductForm } from "./components/new-product-form";
import { StockIncreaseForm } from "./components/stock-increase-form";
import { ConfirmBatchDialog } from "./components/confirm-batch-dialog";
import { BatchSummaryFooter } from "./components/batch-summary-footer";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type InModalTabValue = "new" | "existing";

type InModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function InModal({ isOpen, onOpenChange }: InModalProps) {
  const [currentActiveTab, setCurrentActiveTab] = useState<InModalTabValue>("new");
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
        setCurrentActiveTab("new");
      }
      onOpenChange(isCurrentlyOpen);
    },
    [onOpenChange, clearPendingBatchItems],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      const isAltKeyActive = event.altKey;
      const isShiftKeyActive = event.shiftKey;
      const keyLowerCase = event.key.toLowerCase();
      const hasPendingBatchItems = pendingBatchItems.length > 0;

      if (isAltKeyActive && keyLowerCase === "n") {
        event.preventDefault();
        setCurrentActiveTab("new");
      }
      if (isAltKeyActive && keyLowerCase === "e") {
        event.preventDefault();
        setCurrentActiveTab("existing");
      }
      if (isShiftKeyActive && event.key === "Enter" && hasPendingBatchItems) {
        event.preventDefault();
        event.stopPropagation();
        setIsConfirmDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, [isOpen, pendingBatchItems.length]);

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleModalOpenChange}
        title="Recepción de Mercancía"
        description="Agrega productos al lote y luego confirma la carga completa."
        dialogClassName="min-w-5xl"
        drawerClassName=""
        avoidCloseFromOutsideClick
        descriptionSrOnly
      >
        <section className="flex flex-col gap-4">
          <header>
            <Tabs value={currentActiveTab} onValueChange={(value) => setCurrentActiveTab(value as InModalTabValue)}>
              <TabsList className="w-full">
                <TabsTrigger value="new" className="flex-1 gap-1.5" aria-keyshortcuts="Alt+N">
                  Nuevo Producto
                  <KbdGroup className="hidden md:flex">
                    <Kbd className="px-1 text-[9px]">Alt</Kbd>
                    <span className="text-[9px]">+</span>
                    <Kbd className="px-1 text-[9px]">N</Kbd>
                  </KbdGroup>
                </TabsTrigger>
                <TabsTrigger value="existing" className="flex-1 gap-1.5" aria-keyshortcuts="Alt+E">
                  Aumentar Existencia
                  <KbdGroup className="hidden md:flex">
                    <Kbd className="px-1 text-[9px]">Alt</Kbd>
                    <span className="text-[9px]">+</span>
                    <Kbd className="px-1 text-[9px]">E</Kbd>
                  </KbdGroup>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-4">
                <NewProductForm onAddPendingBatchItem={addPendingBatchItem} />
              </TabsContent>

              <TabsContent value="existing" className="mt-4">
                <StockIncreaseForm onAddPendingBatchItem={addPendingBatchItem} />
              </TabsContent>
            </Tabs>
          </header>

          <article className="bg-card flex min-h-52 flex-col overflow-hidden rounded-md border">
            <DataTable
              columns={pendingItemColumns}
              data={pendingBatchItems}
              emptyMessage="Agrega productos usando las pestañas de arriba."
              meta={{ onRemovePendingBatchItem: removePendingBatchItem }}
            />
          </article>

          <BatchSummaryFooter
            pendingBatchItems={pendingBatchItems}
            isSubmissionPending={isSubmissionPending}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
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
