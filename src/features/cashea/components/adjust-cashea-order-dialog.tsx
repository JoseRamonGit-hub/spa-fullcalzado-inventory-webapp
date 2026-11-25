import { CasheaOrderNumber } from "@/features/cashea/components/cashea-order-number";
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
import { CasheaOrderProducts } from "./cashea-order-products";
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
      title={
        <>
          Ajustar orden Cashea <CasheaOrderNumber value={order.order_number} />
        </>
      }
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
      <section className="bg-card overflow-hidden rounded-md border">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-2 text-sm">
          <div>
            Total de la venta{" "}
            <strong className="data-value ml-1">{saleTotalUsd === null ? "—" : formatCurrencyUSD(saleTotalUsd)}</strong>
          </div>
          <span className="text-muted-foreground text-xs">{formatCalendarDateString(order.sale_date)}</span>
        </div>
        <div className="custom-scrollbar max-h-44 overflow-y-auto">
          <CasheaOrderProducts saleId={order.sale_id} isOpen={isOpen} />
        </div>
      </section>

      <CasheaOrderFormCard orderForm={orderForm} disabled={adjustMutation.isPending} />

      {noteField}
    </ModalConfirmDialog>
  );
}
