import { useStore } from "@tanstack/react-form";
import { toast } from "sonner";
import { ConfirmDialogSummarySection, ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import type { RadioGroupFieldOption } from "@/components/forms/radio-group-field";
import { COMPACT_FIELD_LABEL_CLASS_NAME } from "@/components/forms/field-wrapper";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/form";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import type { CasheaOrder, CasheaVoidReason } from "@/types";
import { formatCalendarDateString, formatCurrencyUSD } from "@/utils/formatters";
import { requiredText, validateOnBlur } from "@/utils/form-validators";
import { casheaVoidReasonLabels } from "../cashea-receivables";
import { useVoidCasheaOrder } from "../hooks/useCasheaMutations";

const VOID_ERROR_MESSAGE = "No se pudo anular la Orden Cashea. Revisa la conexión e intenta de nuevo.";

const reasonOptions = [
  {
    value: "customer_return",
    label: casheaVoidReasonLabels.customer_return,
    description: "Anular la orden no registra la devolución: si la mercancía volvió, regístrala en Devoluciones.",
  },
  {
    value: "registration_error",
    label: casheaVoidReasonLabels.registration_error,
    description: "La venta no era Cashea o la orden se registró por error.",
  },
] satisfies (RadioGroupFieldOption & { value: CasheaVoidReason })[];

type VoidCasheaOrderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: CasheaOrder;
};

export function VoidCasheaOrderDialog({ isOpen, onOpenChange, order }: VoidCasheaOrderDialogProps) {
  const voidMutation = useVoidCasheaOrder();
  const form = useAppForm({ defaultValues: { reason: "" as CasheaVoidReason | "", note: "" } });
  const { reason, note } = useStore(form.store, (state) => state.values);
  const orderVoid = reason && note.trim() ? { orderId: order.id, reason, note: note.trim() } : null;

  async function voidOrder() {
    if (!orderVoid) return;
    await voidMutation.mutateAsync(orderVoid);
    toast.success("Orden Cashea anulada");
    onOpenChange(false);
  }

  const summary = [
    { label: "N° de orden", value: order.order_number },
    { label: "N° de factura", value: order.invoice_number },
    { label: "Fecha de la venta", value: formatCalendarDateString(order.sale_date) },
    { label: "Monto financiado", value: formatCurrencyUSD(order.financed_usd) },
  ];

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Anular orden Cashea"
      description="La venta sigue facturada y el inventario no cambia."
      confirmLabel="Anular orden"
      pendingLabel="Anulando..."
      submissionErrorMessage={(error) => getBusinessRuleErrorMessage(error, VOID_ERROR_MESSAGE)}
      isSubmissionPending={voidMutation.isPending}
      onConfirmSubmit={voidOrder}
      confirmDisabled={!orderVoid}
    >
      <ConfirmDialogSummarySection>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {summary.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className={COMPACT_FIELD_LABEL_CLASS_NAME}>{label}</dt>
              <dd className="data-value truncate font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </ConfirmDialogSummarySection>

      <FieldGroup className="gap-4">
        <form.AppField
          name="reason"
          validators={{ onChange: requiredText("Elige el motivo de la anulación") }}
          listeners={{ onBlur: validateOnBlur }}
        >
          {(field) => (
            <field.RadioGroupField label="Motivo" options={reasonOptions} disabled={voidMutation.isPending} compact />
          )}
        </form.AppField>

        <form.AppField
          name="note"
          validators={{ onChange: requiredText("Escribe una nota para la anulación") }}
          listeners={{ onBlur: validateOnBlur }}
        >
          {(field) => (
            <field.TextareaField
              label="Nota"
              placeholder="Explica por qué se anula la orden"
              rows={3}
              disabled={voidMutation.isPending}
              compact
            />
          )}
        </form.AppField>
      </FieldGroup>
    </ModalConfirmDialog>
  );
}
