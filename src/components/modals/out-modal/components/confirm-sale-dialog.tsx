import { CasheaOrderNumber } from "@/features/cashea/components/cashea-order-number";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import casheaLogo from "@/assets/cashea_logos/cashea_logo_512x512.webp";
import { formatCurrencyUSD } from "@/utils/formatters";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PendingSaleLine } from "../types";
import type { CasheaOrderInput } from "@/types";
import { getSaleSubmissionErrorMessage } from "@/components/modals/shared/submission-messages";
import { ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import { SaleSummaryCard } from "@/components/modals/shared/sale-summary";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

type ConfirmSaleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingSaleLines: PendingSaleLine[];
  exchangeRate: ModalExchangeRate;
  totalAmountUsd: number;
  totalAmountVes: number;
  casheaOrder?: CasheaOrderInput | null;
  casheaSaleTotalMismatch?: boolean;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void | Promise<void>;
};

export function ConfirmSaleDialog({
  isOpen,
  onOpenChange,
  pendingSaleLines,
  exchangeRate,
  totalAmountUsd,
  totalAmountVes,
  casheaOrder = null,
  casheaSaleTotalMismatch = false,
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmSaleDialogProps) {
  const [isOrderTotalConfirmed, setIsOrderTotalConfirmed] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) setIsOrderTotalConfirmed(false);
  }

  const hasOrderTotalMismatch = casheaOrder !== null && casheaSaleTotalMismatch;
  const isOrderTotalPending = hasOrderTotalMismatch && !isOrderTotalConfirmed;
  const orderTotalDifferenceUsd = casheaOrder ? Math.abs(casheaOrder.total_usd - totalAmountUsd) : 0;

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={casheaOrder ? "Confirmar venta Cashea" : "Confirmar venta"}
      confirmLabel="Registrar venta"
      pendingLabel="Registrando..."
      submissionErrorMessage={getSaleSubmissionErrorMessage}
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!exchangeRate.isReady || isOrderTotalPending}
    >
      <SaleSummaryCard
        title="Productos"
        lines={pendingSaleLines.map((saleLine) => ({
          key: saleLine.tempId,
          code: saleLine.code,
          description: saleLine.description,
          quantity: saleLine.quantity,
          priceUsd: saleLine.priceUsd,
          totalUsd: saleLine.totalUsd,
        }))}
        totalUsd={totalAmountUsd}
        totalVes={exchangeRate.isReady ? totalAmountVes : null}
        exchangeRate={exchangeRate.isReady ? exchangeRate.displayValue : null}
        notice={
          !exchangeRate.isReady && (
            <p className="text-warning-foreground dark:text-warning mt-2 flex items-start gap-1.5 text-xs font-medium">
              <TriangleAlert className="text-warning mt-px size-3.5 shrink-0" aria-hidden="true" />
              {exchangeRate.statusMessage}
            </p>
          )
        }
      />

      {casheaOrder && (
        <section aria-labelledby="confirm-sale-cashea" className="bg-card overflow-hidden rounded-md border">
          <header className="bg-muted/70 flex items-center gap-2 border-b px-3 py-2">
            <img src={casheaLogo} alt="" aria-hidden="true" className="size-5 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 [overflow-wrap:anywhere]">
              <h3 id="confirm-sale-cashea" className="text-sm font-normal">
                Pago con Cashea
              </h3>
              <p className="text-muted-foreground text-xs">
                Orden <CasheaOrderNumber value={casheaOrder.order_number} /> · Factura{" "}
                <span className="data-value text-foreground font-normal">{casheaOrder.invoice_number}</span>
              </p>
            </div>
          </header>

          <dl>
            <CasheaAmountRow emphasized label="Inicial" value={formatCurrencyUSD(casheaOrder.paid_today_usd)} />
            <CasheaAmountRow label="Monto financiado" value={formatCurrencyUSD(casheaOrder.financed_usd)} />
            <CasheaAmountRow
              label="Total de la orden"
              value={formatCurrencyUSD(casheaOrder.total_usd)}
              className={cn(hasOrderTotalMismatch && "[&_dd]:text-warning-foreground dark:[&_dd]:text-warning")}
            />
          </dl>

          {hasOrderTotalMismatch && (
            <div className="border-warning/40 bg-warning/10 flex flex-col gap-2 border-t px-3 py-2">
              <p className="text-warning-foreground dark:text-warning flex gap-2 text-xs leading-snug">
                <TriangleAlert className="text-warning mt-px size-4 shrink-0" aria-hidden="true" />
                <span>
                  El total de la orden (<strong>{formatCurrencyUSD(casheaOrder.total_usd)}</strong>) difiere del total
                  de la venta (<strong>{formatCurrencyUSD(totalAmountUsd)}</strong>) por{" "}
                  <strong>{formatCurrencyUSD(orderTotalDifferenceUsd)}</strong>. Verifícalo en el panel de Cashea antes
                  de registrar.
                </span>
              </p>
              <div className="flex items-center gap-2 pl-6">
                <Checkbox
                  id="cashea-order-total-confirmation"
                  checked={isOrderTotalConfirmed}
                  onCheckedChange={(checked) => setIsOrderTotalConfirmed(checked === true)}
                />
                <Label htmlFor="cashea-order-total-confirmation" className="text-xs font-medium">
                  Confirmo el total de la Orden Cashea
                </Label>
              </div>
            </div>
          )}
        </section>
      )}
    </ModalConfirmDialog>
  );
}

type CasheaAmountRowProps = {
  label: string;
  value: string;
  emphasized?: boolean;
  className?: string;
};

function CasheaAmountRow({ label, value, emphasized = false, className }: CasheaAmountRowProps) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 border-t px-3 py-1.5 text-xs leading-5 first:border-t-0",
        emphasized ? "border-border" : "border-border/60",
        className,
      )}
    >
      <dt className={cn("min-w-0", emphasized ? "text-foreground font-semibold" : "text-muted-foreground font-normal")}>
        {label}
      </dt>
      <dd
        className={cn(
          "data-value text-foreground shrink-0 whitespace-nowrap",
          emphasized ? "font-semibold" : "font-normal",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
