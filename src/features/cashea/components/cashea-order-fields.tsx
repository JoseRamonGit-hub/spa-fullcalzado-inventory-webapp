import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { CasheaOrderFormApi } from "../hooks/use-cashea-order-form";

type CasheaOrderFieldsProps = {
  /** Lo que devuelve `useCasheaOrderForm`; su dueño lo limpia con `orderForm.form.reset()`. */
  orderForm: CasheaOrderFormApi;
  disabled?: boolean;
};

// Misma altura (32 px) que los campos de «Agregar producto» en el mismo modal.
const TEXT_INPUT_PROPS = { compact: true, autoComplete: "off", className: "h-8 text-sm" } as const;

const AMOUNT_INPUT_PROPS = {
  compact: true,
  leftAddon: "$",
  inputMode: "decimal",
  autoComplete: "off",
  placeholder: "0.00",
  groupClassName: "h-8",
  className: "text-sm tabular-nums",
} as const;

/** Los cinco datos de una Orden Cashea con la verificación de la suma contra el total. */
export function CasheaOrderFields({ orderForm, disabled = false }: CasheaOrderFieldsProps) {
  const { form, evaluation, fieldOptions } = orderForm;
  const { orderTotalUsd, sumUsd, sumDifferenceUsd, sumError, saleTotalMismatch } = evaluation;
  const hasSumCheck = sumUsd !== null || orderTotalUsd !== null;
  const sumMatches = sumUsd !== null && orderTotalUsd !== null && !sumError;

  return (
    <div className="flex flex-col gap-3">
      <fieldset disabled={disabled} className="grid min-w-0 grid-cols-2 items-start gap-3 md:grid-cols-5">
        <form.AppField {...fieldOptions("orderNumber")}>
          {(field) => <field.TextField label="N° de orden" placeholder="6400685" {...TEXT_INPUT_PROPS} />}
        </form.AppField>

        <form.AppField {...fieldOptions("invoiceNumber")}>
          {(field) => <field.TextField label="N° de factura" placeholder="551-000738" {...TEXT_INPUT_PROPS} />}
        </form.AppField>

        <form.AppField {...fieldOptions("totalUsd")}>
          {(field) => <field.TextFieldGroup label="Total de la orden" {...AMOUNT_INPUT_PROPS} />}
        </form.AppField>

        <form.AppField {...fieldOptions("paidTodayUsd")}>
          {(field) => <field.TextFieldGroup label="Cobrado hoy" {...AMOUNT_INPUT_PROPS} />}
        </form.AppField>

        <div className="col-span-2 min-w-0 md:col-span-1">
          <form.AppField {...fieldOptions("financedUsd")}>
            {(field) => <field.TextFieldGroup label="Monto financiado" {...AMOUNT_INPUT_PROPS} />}
          </form.AppField>
        </div>
      </fieldset>

      {/* Sin montos escritos no hay nada que verificar: la fila de guiones solo añadía ruido. */}
      {hasSumCheck && (
        <div
          className={cn(
            "bg-muted/60 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md px-3 py-1.5 text-xs",
            sumError && "bg-destructive/8",
          )}
        >
          <p className="text-muted-foreground">
            Cobrado hoy + Monto financiado:{" "}
            <span data-testid="cashea-sum" className="data-value text-foreground font-semibold">
              {sumUsd === null ? "—" : formatCurrencyUSD(sumUsd)}
            </span>
          </p>
          <p className="text-muted-foreground">
            Total de la orden:{" "}
            <span data-testid="cashea-order-total" className="data-value text-foreground font-semibold">
              {orderTotalUsd === null ? "—" : formatCurrencyUSD(orderTotalUsd)}
            </span>
          </p>
          {sumMatches && (
            <p className="text-success ml-auto flex items-center gap-1 font-medium">
              <CircleCheck className="size-3.5" aria-hidden="true" />
              Cuadra
            </p>
          )}
          {sumError && sumDifferenceUsd !== null && (
            <p role="alert" className="text-destructive basis-full font-medium">
              {sumError}. Diferencia: {formatCurrencyUSD(Math.abs(sumDifferenceUsd))}
            </p>
          )}
        </div>
      )}

      {saleTotalMismatch && (
        <p className="border-warning/40 bg-warning/8 text-warning-foreground rounded-md border px-3 py-2 text-xs font-medium">
          El total de la orden difiere del total de la venta. Podrás registrarla, pero tendrás que confirmarlo.
        </p>
      )}
    </div>
  );
}
