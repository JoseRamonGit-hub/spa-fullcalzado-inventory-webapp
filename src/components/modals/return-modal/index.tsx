import { useState, useCallback, useEffect } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { usePendingReturn } from "./hooks/use-pending-return";
import { useSubmitReturn } from "./hooks/use-submit-return";
import { ProductReturnForm } from "./components/product-return-form";
import { ReturnItemsPanel } from "./components/return-items-panel";
import { ReturnSummaryFooter } from "./components/return-summary-footer";
import { ConfirmReturnDialog } from "./components/confirm-return-dialog";
import type { PendingReturnItem, PendingExchangeItem } from "./types";

type ReturnTabValue = "return" | "exchange";

type ReturnModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const INITIAL_FALLBACK_RATE = 0;

export function ReturnModal({ isOpen, onOpenChange }: ReturnModalProps) {
  const { data: exchangeRateData } = useExchangeRate();
  const currentExchangeRate = exchangeRateData?.rate ?? INITIAL_FALLBACK_RATE;

  const [currentTab, setCurrentTab] = useState<ReturnTabValue>("return");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const {
    returnItems,
    exchangeItems,
    addReturnItem,
    removeReturnItem,
    addExchangeItem,
    removeExchangeItem,
    clearAll,
    creditUsd,
    newPurchaseUsd,
    differenceUsd,
    differenceVes,
    returnType,
  } = usePendingReturn();

  const handleSubmissionSuccess = useCallback(() => {
    setIsConfirmDialogOpen(false);
    setNotes("");
    onOpenChange(false);
  }, [onOpenChange]);

  const { submitReturn, isSubmissionPending } = useSubmitReturn({
    returnItems,
    exchangeItems,
    returnType,
    currentExchangeRate,
    notes,
    clearAll,
    onSuccess: handleSubmissionSuccess,
  });

  const handleModalOpenChange = useCallback(
    (isCurrentlyOpen: boolean) => {
      if (!isCurrentlyOpen) {
        clearAll();
        setNotes("");
        setCurrentTab("return");
      }
      onOpenChange(isCurrentlyOpen);
    },
    [onOpenChange, clearAll],
  );

  // ── Keyboard shortcuts: Alt+D (devolver), Alt+C (cambiar), Shift+Enter (confirmar) ──
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.altKey && key === "d") {
        e.preventDefault();
        setCurrentTab("return");
      }
      if (e.altKey && key === "c") {
        e.preventDefault();
        setCurrentTab("exchange");
      }
      if (e.shiftKey && e.key === "Enter" && returnItems.length > 0 && !isConfirmDialogOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsConfirmDialogOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, returnItems.length, isConfirmDialogOpen]);

  // ── Handlers ───────────────────────────────────────────────
  const handleAddReturnItem = useCallback(
    (item: {
      productId: string;
      code: string;
      description: string;
      quantity: number;
      priceUsd: number;
      priceVes: number;
    }) => {
      const pendingItem: PendingReturnItem = {
        _tempId: crypto.randomUUID(),
        productId: item.productId,
        code: item.code,
        description: item.description,
        quantity: item.quantity,
        priceUsd: item.priceUsd,
        priceVes: item.priceVes,
        totalUsd: item.quantity * item.priceUsd,
        totalVes: item.quantity * item.priceVes,
      };
      addReturnItem(pendingItem);
    },
    [addReturnItem],
  );

  const handleAddExchangeItem = useCallback(
    (item: {
      productId: string;
      code: string;
      description: string;
      quantity: number;
      priceUsd: number;
      priceVes: number;
      availableStock: number;
    }) => {
      const pendingItem: PendingExchangeItem = {
        _tempId: crypto.randomUUID(),
        productId: item.productId,
        code: item.code,
        description: item.description,
        quantity: item.quantity,
        priceUsd: item.priceUsd,
        priceVes: item.priceVes,
        totalUsd: item.quantity * item.priceUsd,
        totalVes: item.quantity * item.priceVes,
        availableStock: item.availableStock,
      };
      addExchangeItem(pendingItem);
    },
    [addExchangeItem],
  );

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleModalOpenChange}
        title="Devolución / Cambio"
        description="Registra devoluciones o cambios de productos."
        dialogClassName="sm:max-w-4xl"
        avoidCloseFromOutsideClick
        avoidCloseFromEsc
        descriptionSrOnly
        footer={
          <ReturnSummaryFooter
            hasReturnItems={returnItems.length > 0}
            returnType={returnType}
            creditUsd={creditUsd}
            newPurchaseUsd={newPurchaseUsd}
            differenceUsd={differenceUsd}
            differenceVes={differenceVes}
            currentExchangeRate={currentExchangeRate}
            isSubmissionPending={isSubmissionPending}
            notes={notes}
            onNotesChange={setNotes}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
        }
      >
        <section className="flex flex-col gap-4">
          <header className="-mx-6 -mt-6">
            <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as ReturnTabValue)} className="gap-0">
              <TabsList className="h-10 w-full rounded-none border-x-0 border-t-0 p-0">
                <TabsTrigger value="return" className="flex-1 gap-1.5 rounded-none" aria-keyshortcuts="Alt+D">
                  Entrada
                  {returnItems.length > 0 && (
                    <span className="bg-primary/10 text-primary rounded-full px-1.5 text-[10px] font-semibold tabular-nums">
                      {returnItems.length}
                    </span>
                  )}
                  <KbdGroup className="hidden md:flex">
                    <Kbd className="px-1 text-[9px]">Alt</Kbd>
                    <span className="text-[9px]">+</span>
                    <Kbd className="px-1 text-[9px]">D</Kbd>
                  </KbdGroup>
                </TabsTrigger>
                <TabsTrigger value="exchange" className="flex-1 gap-1.5 rounded-none" aria-keyshortcuts="Alt+C">
                  Salida
                  {exchangeItems.length > 0 && (
                    <span className="bg-primary/10 text-primary rounded-full px-1.5 text-[10px] font-semibold tabular-nums">
                      {exchangeItems.length}
                    </span>
                  )}
                  <KbdGroup className="hidden md:flex">
                    <Kbd className="px-1 text-[9px]">Alt</Kbd>
                    <span className="text-[9px]">+</span>
                    <Kbd className="px-1 text-[9px]">C</Kbd>
                  </KbdGroup>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="return" className="px-4 pt-3 md:px-6 md:pt-4">
                <ProductReturnForm currentExchangeRate={currentExchangeRate} onAddItem={handleAddReturnItem} />
              </TabsContent>

              <TabsContent value="exchange" className="px-4 pt-3 md:px-6 md:pt-4">
                <ProductReturnForm
                  currentExchangeRate={currentExchangeRate}
                  requireStock
                  onAddItem={handleAddExchangeItem}
                />
              </TabsContent>
            </Tabs>
          </header>

          <article className="bg-card -mx-2 flex h-56 flex-col overflow-hidden rounded-md border md:h-64">
            <ReturnItemsPanel
              returnItems={returnItems}
              exchangeItems={exchangeItems}
              onRemoveReturnItem={removeReturnItem}
              onRemoveExchangeItem={removeExchangeItem}
            />
          </article>
        </section>
      </ResponsiveModal>

      <ConfirmReturnDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        returnItems={returnItems}
        exchangeItems={exchangeItems}
        returnType={returnType}
        creditUsd={creditUsd}
        differenceUsd={differenceUsd}
        differenceVes={differenceVes}
        currentExchangeRate={currentExchangeRate}
        isSubmissionPending={isSubmissionPending}
        notes={notes}
        onConfirmSubmit={submitReturn}
      />
    </>
  );
}
