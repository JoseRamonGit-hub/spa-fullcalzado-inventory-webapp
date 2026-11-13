import { useState } from "react";
import { toast } from "sonner";
import casheaLogo from "@/assets/cashea_logos/cashea_logo_512x512.webp";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import type { TransactionWithRelations } from "@/types";
import { getSalesSummary } from "@/features/transactions/sales-display";
import { formatCalendarDateString, formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { useCasheaOrderForm } from "../hooks/use-cashea-order-form";
import { useAttachCasheaOrder } from "../hooks/useCasheaMutations";
import { CasheaOrderFields } from "./cashea-order-fields";
import { PasteCasheaSummaryButton } from "./paste-cashea-summary-button";

const ATTACH_ERROR_MESSAGE = "No se pudo asociar la Orden Cashea. Revisa la conexión e intenta de nuevo.";

type AttachCasheaOrderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  saleId: string;
  saleLines: TransactionWithRelations[];
};

export function AttachCasheaOrderDialog({ isOpen, onOpenChange, saleId, saleLines }: AttachCasheaOrderDialogProps) {
  const { grossUsd: saleTotalUsd, grossVes: saleTotalVes } = getSalesSummary(saleLines, []);
  const saleDate = saleLines[0]?.date;
  const exchangeRate = saleLines[0]?.exchange_rate;

  const orderForm = useCasheaOrderForm(saleTotalUsd);
  const { order, saleTotalMismatch } = orderForm.evaluation;
  const attachMutation = useAttachCasheaOrder();
  const [isOrderTotalConfirmed, setIsOrderTotalConfirmed] = useState(false);

  async function attachOrder() {
    if (!order) return;
    await attachMutation.mutateAsync({ saleId, order });
    toast.success("Orden Cashea asociada a la venta");
    onOpenChange(false);
  }

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Asociar orden Cashea"
      confirmLabel="Asociar orden"
      pendingLabel="Asociando..."
      submissionErrorMessage={(error) => getBusinessRuleErrorMessage(error, ATTACH_ERROR_MESSAGE)}
      isSubmissionPending={attachMutation.isPending}
      onConfirmSubmit={attachOrder}
      confirmDisabled={!order || (saleTotalMismatch && !isOrderTotalConfirmed)}
      contentClassName="sm:max-w-2xl"
    >
      <section aria-labelledby="attach-cashea-sale" className="bg-card overflow-hidden rounded-lg border">
        <header className="bg-muted/30 text-muted-foreground flex items-baseline justify-between gap-3 border-b px-3 py-1.5 text-xs">
          <h3 id="attach-cashea-sale" className="font-semibold">
            Venta del {formatCalendarDateString(saleDate)}
          </h3>
          <span>
            {saleLines.length} {saleLines.length === 1 ? "renglón" : "renglones"}
          </span>
        </header>
        <ul className="custom-scrollbar divide-border/60 max-h-40 divide-y overflow-y-auto">
          {saleLines.map((line) => (
            <li key={line.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <OverflowTooltip className="text-sm leading-snug font-medium">
                  {line.products.description}
                </OverflowTooltip>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                  <span className="product-code text-xs uppercase">{line.products.code}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-value">
                    {line.quantity} × {formatCurrencyUSD(line.price_usd)}
                  </span>
                </p>
              </div>
              <p className="data-value shrink-0 text-sm font-semibold whitespace-nowrap">
                {formatCurrencyUSD(line.price_usd * line.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-4 border-t px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Total de la venta</p>
            {exchangeRate !== undefined && (
              <p className="text-muted-foreground text-xs">
                Tasa <span className="data-value text-foreground font-medium">{formatCurrencyVES(exchangeRate)}</span>
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="data-value text-lg leading-none font-bold whitespace-nowrap">
              {formatCurrencyUSD(saleTotalUsd)}
            </p>
            <p className="data-value text-muted-foreground mt-1 text-xs font-medium whitespace-nowrap">
              {formatCurrencyVES(saleTotalVes)}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="attach-cashea-order" className="bg-card rounded-lg border">
        <header className="flex items-center gap-3 border-b p-3">
          <img src={casheaLogo} alt="" aria-hidden="true" className="size-8 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1">
            <h3 id="attach-cashea-order" className="text-sm font-semibold">
              Orden Cashea
            </h3>
            <p className="text-muted-foreground text-xs">
              Pega el resumen «Debe pagar» de la orden o escribe los datos.
            </p>
          </div>
          <PasteCasheaSummaryButton orderForm={orderForm} disabled={attachMutation.isPending} />
        </header>
        <div className="p-3">
          <CasheaOrderFields orderForm={orderForm} disabled={attachMutation.isPending} />
        </div>
        {saleTotalMismatch && (
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <Checkbox
              id="attach-cashea-order-total-confirmation"
              checked={isOrderTotalConfirmed}
              onCheckedChange={(checked) => setIsOrderTotalConfirmed(checked === true)}
            />
            <Label htmlFor="attach-cashea-order-total-confirmation" className="text-xs font-medium">
              Confirmo el total de la Orden Cashea
            </Label>
          </div>
        )}
      </section>
    </ModalConfirmDialog>
  );
}
