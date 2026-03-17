import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ShoppingCart } from "lucide-react";
import { SalesSummaryBlock } from "./sales-summary-block";
import type { PendingSale } from "../types";

interface SalesSummaryFooterProps {
  pendingSales: PendingSale[];
  currentExchangeRate: number;
  totalAmountUsd: number;
  totalAmountVes: number;
  isSubmissionPending: boolean;
  onOpenConfirmDialog: () => void;
}

export function SalesSummaryFooter({
  pendingSales,
  currentExchangeRate,
  totalAmountUsd,
  totalAmountVes,
  isSubmissionPending,
  onOpenConfirmDialog,
}: SalesSummaryFooterProps) {
  const pendingSalesCount = pendingSales.length;
  const hasPendingSales = pendingSalesCount > 0;
  const isMultipleSales = pendingSalesCount > 1;

  return (
    <footer className="flex w-full flex-col gap-3">
      <SalesSummaryBlock
        currentExchangeRate={currentExchangeRate}
        totalAmountUsd={totalAmountUsd}
        totalAmountVes={totalAmountVes}
      />

      <section className="flex w-full items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tabular-nums">
          {!hasPendingSales
            ? "Sin ventas pendientes"
            : `${pendingSalesCount} venta${isMultipleSales ? "s" : ""} en cola`}
        </p>
        <Button disabled={!hasPendingSales || isSubmissionPending} onClick={onOpenConfirmDialog}>
          <ShoppingCart data-icon="inline-start" />
          {isSubmissionPending
            ? "Registrando..."
            : `Registrar ${hasPendingSales ? pendingSalesCount : ""} venta${!hasPendingSales || isMultipleSales ? "s" : ""}`}
          <KbdGroup className="hidden md:flex">
            <Kbd className="ml-1">Shift ⇧</Kbd>
            <span>+</span>
            <Kbd>Enter</Kbd>
          </KbdGroup>
        </Button>
      </section>
    </footer>
  );
}
