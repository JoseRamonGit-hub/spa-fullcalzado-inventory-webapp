import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import type { ConfirmableCasheaOrderFormApi } from "../hooks/use-cashea-order-form";
import { CasheaOrderFields } from "./cashea-order-fields";
import { PasteCasheaSummaryButton } from "./paste-cashea-summary-button";

type CasheaOrderFormCardProps = {
  orderForm: ConfirmableCasheaOrderFormApi;
  disabled: boolean;
};

export function CasheaOrderFormCard({ orderForm, disabled }: CasheaOrderFormCardProps) {
  const titleId = useId();
  const confirmationId = useId();

  return (
    <section aria-labelledby={titleId} className="bg-card rounded-lg border shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <h3 id={titleId} className="text-sm font-semibold">
          Datos de la orden Cashea
        </h3>
        <PasteCasheaSummaryButton orderForm={orderForm} disabled={disabled} />
      </div>
      <div className="p-3">
        <CasheaOrderFields
          orderForm={orderForm}
          disabled={disabled}
          saleTotalMismatchNotice={
            <Field orientation="horizontal" className="bg-warning/10 rounded-md px-3 py-2">
              <Checkbox
                id={confirmationId}
                checked={orderForm.isOrderTotalConfirmed}
                onCheckedChange={(checked) => orderForm.setIsOrderTotalConfirmed(checked === true)}
                disabled={disabled}
              />
              <FieldLabel htmlFor={confirmationId} className="text-xs font-medium">
                El total no coincide con la venta. Confirmo que es correcto.
              </FieldLabel>
            </Field>
          }
        />
      </div>
    </section>
  );
}
