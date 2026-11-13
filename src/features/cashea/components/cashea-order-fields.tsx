import { cn } from "@/lib/utils";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { CasheaOrderEvaluation } from "../cashea-order-draft";
import type { CasheaOrderForm } from "../hooks/use-cashea-order-form";

type CasheaOrderFieldsProps = {
  /** Formulario creado con `useCasheaOrderForm`; su dueño lo limpia con `form.reset()`. */
  form: CasheaOrderForm;
  /** Evaluación de `useCasheaOrderForm`: suma, diferencia y advertencia de total distinto. */
  evaluation: CasheaOrderEvaluation;
  disabled?: boolean;
};

const AMOUNT_INPUT_PROPS = { inputMode: "decimal", autoComplete: "off", placeholder: "0.00" } as const;

/** Los cinco datos de una Orden Cashea con la verificación de la suma contra el total. */
export function CasheaOrderFields({ form, evaluation, disabled = false }: CasheaOrderFieldsProps) {
  const { orderTotalUsd, sumUsd, sumDifferenceUsd, sumError, saleTotalMismatch } = evaluation;

  return (
    <div className="flex flex-col gap-3">
      <fieldset disabled={disabled} className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-5">
        <form.AppField name="orderNumber">
          {(field) => <field.TextField label="N° de orden" compact autoComplete="off" placeholder="6400685" />}
        </form.AppField>

        <form.AppField name="invoiceNumber">
          {(field) => <field.TextField label="N° de factura" compact autoComplete="off" placeholder="551-000738" />}
        </form.AppField>

        <form.AppField name="totalUsd">
          {(field) => <field.TextFieldGroup label="Total de la orden" compact leftAddon="$" {...AMOUNT_INPUT_PROPS} />}
        </form.AppField>

        <form.AppField name="paidTodayUsd">
          {(field) => <field.TextFieldGroup label="Cobrado hoy" compact leftAddon="$" {...AMOUNT_INPUT_PROPS} />}
        </form.AppField>

        <div className="col-span-2 min-w-0 md:col-span-1">
          <form.AppField name="financedUsd">
            {(field) => <field.TextFieldGroup label="Monto financiado" compact leftAddon="$" {...AMOUNT_INPUT_PROPS} />}
          </form.AppField>
        </div>
      </fieldset>

      <div
        className={cn(
          "bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border px-3 py-2 text-xs",
          sumError && "border-destructive/30 bg-destructive/8",
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
        {sumError && sumDifferenceUsd !== null && (
          <p role="alert" className="text-destructive basis-full font-medium">
            {sumError}. Diferencia: {formatCurrencyUSD(Math.abs(sumDifferenceUsd))}
          </p>
        )}
      </div>

      {saleTotalMismatch && (
        <p className="border-warning/40 bg-warning/8 text-warning-foreground rounded-md border px-3 py-2 text-xs font-medium">
          El total de la orden difiere del total de la venta. Podrás registrarla, pero tendrás que confirmarlo.
        </p>
      )}
    </div>
  );
}
