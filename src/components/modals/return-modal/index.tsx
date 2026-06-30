import { useState } from "react";
import { ResponsiveModal } from "@/components/modals/shared/responsive-modal";
import { useModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { usePendingReturn } from "./hooks/use-pending-return";
import { useSubmitReturn } from "./hooks/use-submit-return";
import { ProductReturnForm } from "./components/product-return-form";
import { ReturnItemsPanel } from "./components/return-items-panel";
import { ReturnSummaryFooter } from "./components/return-summary-footer";
import { ConfirmReturnDialog } from "./components/confirm-return-dialog";
import type { PendingReturnItem, PendingExchangeItem, ReturnSummary } from "./types";
import { useModalKeyboardShortcuts } from "@/components/modals/shared/use-modal-keyboard-shortcuts";

type ReturnTabValue = "return" | "exchange";

type ReturnModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function ReturnModal({ isOpen, onOpenChange }: ReturnModalProps) {
  const exchangeRate = useModalExchangeRate();

  const [activeTab, setActiveTab] = useState<ReturnTabValue>("return");
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
  const summary: ReturnSummary = {
    returnType,
    creditUsd,
    newPurchaseUsd,
    differenceUsd,
    differenceVes,
  };

  const handleSubmissionSuccess = () => {
    setIsConfirmDialogOpen(false);
    setNotes("");
    onOpenChange(false);
  };

  const { submitReturn, isSubmissionPending } = useSubmitReturn({
    returnItems,
    exchangeItems,
    returnType: summary.returnType,
    currentExchangeRate: exchangeRate.value,
    notes,
    clearAll,
    onSuccess: handleSubmissionSuccess,
  });

  const handleModalOpenChange = (isCurrentlyOpen: boolean) => {
    if (!isCurrentlyOpen) {
      clearAll();
      setNotes("");
      setActiveTab("return");
    }
    onOpenChange(isCurrentlyOpen);
  };

  const keyboardShortcuts = [
    {
      key: "d",
      altKey: true,
      onTrigger: () => setActiveTab("return"),
    },
    {
      key: "c",
      altKey: true,
      onTrigger: () => setActiveTab("exchange"),
    },
    {
      key: "enter",
      shiftKey: true,
      when: returnItems.length > 0 && !isConfirmDialogOpen && exchangeRate.isReady,
      stopPropagation: true,
      onTrigger: () => setIsConfirmDialogOpen(true),
    },
  ];

  useModalKeyboardShortcuts({ enabled: isOpen, shortcuts: keyboardShortcuts });

  const handleAddReturnItem = (item: Omit<PendingReturnItem, "tempId" | "totalUsd" | "totalVes">) => {
    addReturnItem({
      ...item,
      tempId: crypto.randomUUID(),
      totalUsd: item.quantity * item.priceUsd,
      totalVes: item.quantity * item.priceVes,
    });
  };

  const handleAddExchangeItem = (item: Omit<PendingExchangeItem, "tempId" | "totalUsd" | "totalVes">) => {
    addExchangeItem({
      ...item,
      tempId: crypto.randomUUID(),
      totalUsd: item.quantity * item.priceUsd,
      totalVes: item.quantity * item.priceVes,
    });
  };

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleModalOpenChange}
        title="Devolución"
        description="Registra devoluciones o cambios de productos."
        dialogClassName="sm:max-w-4xl"
        bodyClassName="md:overflow-y-hidden"
        avoidCloseFromOutsideClick
        avoidCloseFromEsc
        footer={
          <ReturnSummaryFooter
            hasReturnItems={returnItems.length > 0}
            summary={summary}
            exchangeRate={exchangeRate}
            isSubmissionPending={isSubmissionPending}
            notes={notes}
            onNotesChange={setNotes}
            onOpenConfirmDialog={() => setIsConfirmDialogOpen(true)}
          />
        }
      >
        <section className="flex flex-col gap-3 md:gap-4">
          <header className="-mx-4 -mt-3 md:-mx-6 md:-mt-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReturnTabValue)} className="gap-0">
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
                <ProductReturnForm exchangeRate={exchangeRate} onAddItem={handleAddReturnItem} />
              </TabsContent>

              <TabsContent value="exchange" className="px-4 pt-3 md:px-6 md:pt-4">
                <ProductReturnForm exchangeRate={exchangeRate} requireStock onAddItem={handleAddExchangeItem} />
              </TabsContent>
            </Tabs>
          </header>

          <article className="bg-card -mx-2 flex h-40 flex-col overflow-hidden rounded-md border md:h-64">
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
        summary={summary}
        exchangeRate={exchangeRate}
        isSubmissionPending={isSubmissionPending}
        notes={notes}
        onConfirmSubmit={submitReturn}
      />
    </>
  );
}
