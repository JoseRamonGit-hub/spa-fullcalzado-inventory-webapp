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

      <section className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
        <p className="text-muted-foreground text-xs font-medium tabular-nums">
          {!hasPendingSales
            ? "Sin ventas pendientes"
            : `${pendingSalesCount} venta${isMultipleSales ? "s" : ""} en cola`}
        </p>
        <Button
          disabled={!hasPendingSales || isSubmissionPending}
          onClick={onOpenConfirmDialog}
          className="w-full gap-3 shrink-0 md:w-auto"
        >
          <ShoppingCart data-icon="inline-start" />
          <span className="truncate">
            {isSubmissionPending
              ? "Registrando..."
              : hasPendingSales
                ? `Registrar ${pendingSalesCount} venta${isMultipleSales ? "s" : ""}`
                : "Registrar ventas"}
          </span>
          <KbdGroup className="hidden opacity-60 md:flex" aria-hidden="true">
            <Kbd>Shift ⇧</Kbd>
            <span>+</span>
            <Kbd>Enter</Kbd>
          </KbdGroup>
        </Button>
      </section>
    </footer>
  );
}
