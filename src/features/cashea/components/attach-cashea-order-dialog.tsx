import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import { SaleSummaryTable } from "@/components/modals/shared/sale-summary";
import { getSalesSummary } from "@/features/transactions/sales-display";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import type { TransactionWithRelations } from "@/types";
import { formatCalendarDateString, formatCurrencyVES } from "@/utils/formatters";
import { useCasheaOrderForm } from "../hooks/use-cashea-order-form";
import { useAttachCasheaOrder } from "../hooks/useCasheaMutations";
import { CasheaOrderSection } from "./cashea-order-section";

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
      description={`Venta del ${formatCalendarDateString(saleDate)}.`}
      confirmLabel="Asociar orden"
      pendingLabel="Asociando..."
      submissionErrorMessage={(error) => getBusinessRuleErrorMessage(error, ATTACH_ERROR_MESSAGE)}
      isSubmissionPending={attachMutation.isPending}
      onConfirmSubmit={attachOrder}
      confirmDisabled={!order || (saleTotalMismatch && !isOrderTotalConfirmed)}
      contentClassName="data-[size=default]:sm:max-w-xl"
    >
      <SaleSummaryTable
        lines={saleLines.map((line) => ({
          key: line.id,
          code: line.products.code,
          description: line.products.description,
          quantity: line.quantity,
          totalUsd: line.price_usd * line.quantity,
        }))}
        totalUsd={saleTotalUsd}
        totalVes={saleTotalVes}
        exchangeRate={exchangeRate === undefined ? null : formatCurrencyVES(exchangeRate)}
      />

      <CasheaOrderSection
        title="Orden Cashea"
        description="Pega el resumen «Debe pagar» de la orden o escribe los datos."
        orderForm={orderForm}
        disabled={attachMutation.isPending}
      >
        {saleTotalMismatch && (
          <div className="border-warning/40 bg-warning/10 flex items-center gap-2 rounded-b-md border-t px-3 py-2">
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
      </CasheaOrderSection>
    </ModalConfirmDialog>
  );
}
