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

  useEffect(() => {
    if (!isOpen || currentActiveTab !== "new") return;
    requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('input[name="code"]')?.focus();
    });
  }, [isOpen, currentActiveTab]);

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleModalOpenChange}
        title="Carga de Inventario"
        description="Agrega productos al lote y luego confirma la carga completa."
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
        <section className="flex flex-col gap-4">
          <header className="-mx-6 -mt-6">
            <Tabs
              value={currentActiveTab}
              onValueChange={(value) => setCurrentActiveTab(value as InModalTabValue)}
              className="gap-0"
            >
              <TabsList className="h-10 w-full rounded-none border-x-0 border-t-0 p-0">
                <TabsTrigger value="new" className="flex-1 gap-1.5 rounded-none" aria-keyshortcuts="Alt+N">
                  Nuevo Producto
                  <KbdGroup className="hidden md:flex">
                    <Kbd className="px-1 text-[9px]">Alt</Kbd>
                    <span className="text-[9px]">+</span>
                    <Kbd className="px-1 text-[9px]">N</Kbd>
                  </KbdGroup>
                </TabsTrigger>
                <TabsTrigger value="existing" className="flex-1 gap-1.5 rounded-none" aria-keyshortcuts="Alt+E">
                  Aumentar Existencia
                  <KbdGroup className="hidden md:flex">
                    <Kbd className="px-1 text-[9px]">Alt</Kbd>
                    <span className="text-[9px]">+</span>
                    <Kbd className="px-1 text-[9px]">E</Kbd>
                  </KbdGroup>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="px-4 pt-3 md:px-6 md:pt-4">
                <NewProductForm onAddPendingBatchItem={addPendingBatchItem} />
              </TabsContent>

              <TabsContent value="existing" className="px-4 pt-3 md:px-6 md:pt-4">
                <StockIncreaseForm onAddPendingBatchItem={addPendingBatchItem} />
              </TabsContent>
            </Tabs>
          </header>

          <article className="bg-card -mx-2 flex h-56 flex-col overflow-hidden rounded-md border md:h-64">
            <DataTable
              columns={pendingItemColumns}
              data={pendingBatchItems}
              emptyMessage="Agrega productos usando las pestañas de arriba."
              meta={{ onRemovePendingBatchItem: removePendingBatchItem }}
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
