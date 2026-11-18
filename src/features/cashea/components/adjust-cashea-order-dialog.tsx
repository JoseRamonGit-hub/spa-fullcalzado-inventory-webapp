import { Pen } from "lucide-react";
import { toast } from "sonner";
import { ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import type { CasheaOrder } from "@/types";
import { formatCalendarDateString, formatCurrencyUSD } from "@/utils/formatters";
import { isSameCasheaOrder, toCasheaOrderDraft } from "../cashea-order-draft";
import { useConfirmableCasheaOrderForm } from "../hooks/use-cashea-order-form";
import { useCasheaNoteField } from "../hooks/use-cashea-note-field";
import { useAdjustCasheaOrder } from "../hooks/useCasheaMutations";
import { useCasheaSaleTotal } from "../hooks/useCasheaQueries";
import { CasheaDialogSummary } from "./cashea-dialog-summary";
import { CasheaBadgedLogo } from "./cashea-logo-icon";
import { CasheaOrderFormCard } from "./cashea-order-form-card";

const ADJUST_ERROR_MESSAGE = "No se pudo ajustar la Orden Cashea. Revisa la conexión e intenta de nuevo.";

type AdjustCasheaOrderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: CasheaOrder;
};

export function AdjustCasheaOrderDialog({ isOpen, onOpenChange, order }: AdjustCasheaOrderDialogProps) {
  const { data: saleTotalUsd = null, isPending: isSaleTotalPending } = useCasheaSaleTotal(order.sale_id);
  const orderForm = useConfirmableCasheaOrderForm(saleTotalUsd, toCasheaOrderDraft(order));
  const adjustMutation = useAdjustCasheaOrder();
  const { note, noteField } = useCasheaNoteField({
    requiredMessage: "Escribe una nota para el ajuste",
    placeholder: "Explica qué se corrige",
    disabled: adjustMutation.isPending,
  });

  const adjustedOrder = orderForm.confirmedOrder;
  const adjustment =
    !isSaleTotalPending && adjustedOrder && note && !isSameCasheaOrder(adjustedOrder, order)
      ? { orderId: order.id, order: adjustedOrder, note }
      : null;

  async function adjustOrder() {
    if (!adjustment) return;
    await adjustMutation.mutateAsync(adjustment);
    toast.success("Orden Cashea ajustada");
    onOpenChange(false);
  }

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Ajustar orden Cashea #${order.order_number}`}
      media={
        <CasheaBadgedLogo
          badgeIcon={<Pen strokeWidth={2.5} aria-hidden="true" />}
          badgeClassName="bg-exchange text-exchange-foreground [&_svg]:size-2.5"
        />
      }
      confirmLabel="Guardar ajuste"
      pendingLabel="Guardando..."
      submissionErrorMessage={(error) => getBusinessRuleErrorMessage(error, ADJUST_ERROR_MESSAGE)}
      isSubmissionPending={adjustMutation.isPending}
      onConfirmSubmit={adjustOrder}
      confirmDisabled={!adjustment}
    >
      <CasheaDialogSummary
        label="Datos de la venta"
        rows={[
          { label: "Fecha de la venta", value: formatCalendarDateString(order.sale_date) },
          {
            label: "Total de la venta",
            value: saleTotalUsd === null ? "—" : formatCurrencyUSD(saleTotalUsd),
            isKey: true,
          },
        ]}
      />

      <CasheaOrderFormCard orderForm={orderForm} disabled={adjustMutation.isPending} />

      {noteField}
    </ModalConfirmDialog>
  );
}
