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

type TabValue = "new" | "existing";

interface InModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InModal({ open, onOpenChange }: InModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("new");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { batchItems, addItem, removeItem, clearBatch } = useBatch();

  const handleSuccess = useCallback(() => {
    setConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { submitBatch, isPending } = useSubmitBatch({
    batchItems,
    clearBatch,
    onSuccess: handleSuccess,
  });

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        clearBatch();
        setActiveTab("new");
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, clearBatch],
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setActiveTab("new");
      }
      if (e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setActiveTab("existing");
      }
      if (e.shiftKey && e.key === "Enter" && batchItems.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setConfirmOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, batchItems.length]);

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleOpenChange}
        title="Recepción de Mercancía"
        description="Agrega productos al lote y luego confirma la carga completa."
        dialogClassName="min-w-5xl"
        drawerClassName=""
        avoidCloseFromOutsideClick
        descriptionSrOnly
      >
        <section className="flex flex-col gap-4">
          <header>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
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
                <NewProductForm onAddToBatch={addItem} />
              </TabsContent>

              <TabsContent value="existing" className="mt-4">
                <StockIncreaseForm onAddToBatch={addItem} />
              </TabsContent>
            </Tabs>
          </header>

          <article className="bg-card flex min-h-52 flex-col overflow-hidden rounded-md border">
            <DataTable
              columns={pendingItemColumns}
              data={batchItems}
              emptyMessage="Agrega productos usando las pestañas de arriba."
              meta={{ onRemoveItem: removeItem }}
            />
          </article>

          <BatchSummaryFooter
            batchItems={batchItems}
            isPending={isPending}
            onConfirmOpen={() => setConfirmOpen(true)}
          />
        </section>
      </ResponsiveModal>

      <ConfirmBatchDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        batchItems={batchItems}
        isPending={isPending}
        onConfirm={submitBatch}
      />
    </>
  );
}
