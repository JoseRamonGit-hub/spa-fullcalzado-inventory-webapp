import { CasheaOrderNumber } from "@/features/cashea/components/cashea-order-number";
import { useStore } from "@tanstack/react-form";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ModalConfirmDialog } from "@/components/modals/shared/modal-ui";
import type { RadioGroupFieldOption } from "@/components/forms/radio-group-field";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/form";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import type { CasheaOrder, CasheaVoidReason } from "@/types";
import { formatCurrencyUSD } from "@/utils/formatters";
import { requiredFieldOptions } from "@/utils/form-validators";
import { casheaVoidReasonLabels } from "../cashea-receivables";
import { CasheaDialogSummary, CasheaOrderInvoice } from "./cashea-dialog-summary";
import { CasheaBadgedLogo } from "./cashea-logo-icon";
import { useVoidCasheaOrder } from "../hooks/useCasheaMutations";

const VOID_ERROR_MESSAGE = "No se pudo anular la Orden Cashea. Revisa la conexión e intenta de nuevo.";

const reasonOptions = [
  {
    value: "customer_return",
    label: casheaVoidReasonLabels.customer_return,
    // Anular la orden no reintegra la mercancía: eso lo hace la Devolución.
    hint: "Registra la devolución en Devoluciones.",
  },
  { value: "registration_error", label: casheaVoidReasonLabels.registration_error },
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

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={
        <>
          Anular orden Cashea <CasheaOrderNumber value={order.order_number} />
        </>
      }
      media={
        <CasheaBadgedLogo
          badgeIcon={<X strokeWidth={3} aria-hidden="true" />}
          badgeClassName="bg-destructive text-white"
        />
      }
      confirmLabel="Anular orden"
      pendingLabel="Anulando..."
      submissionErrorMessage={(error) => getBusinessRuleErrorMessage(error, VOID_ERROR_MESSAGE)}
      isSubmissionPending={voidMutation.isPending}
      onConfirmSubmit={voidOrder}
      confirmDisabled={!orderVoid}
      variant="danger"
    >
      <CasheaDialogSummary
        label="Datos de la orden"
        rows={[
          { label: "Factura", value: <CasheaOrderInvoice order={order} /> },
          { label: "Total de la venta", value: formatCurrencyUSD(order.total_usd) },
          { label: "Cobrado", value: formatCurrencyUSD(order.paid_today_usd) },
          { label: "Financiado por Cashea", value: formatCurrencyUSD(order.financed_usd), isKey: true },
        ]}
      />

      <FieldGroup className="gap-4">
        <form.AppField name="reason" {...requiredFieldOptions("Elige el motivo de la anulación")}>
          {(field) => (
            <field.RadioGroupField label="Motivo" options={reasonOptions} disabled={voidMutation.isPending} compact />
          )}
        </form.AppField>

        <form.AppField name="note" {...requiredFieldOptions("Escribe una nota para la anulación")}>
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
