import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { CasheaOrderFormApi } from "../hooks/use-cashea-order-form";

type CasheaOrderFieldsProps = {
  /** Lo que devuelve `useCasheaOrderForm`; su dueño lo limpia con `orderForm.form.reset()`. */
  orderForm: CasheaOrderFormApi;
  disabled?: boolean;
  /**
   * Lo que aparece cuando el total de la orden difiere del de la venta. Por defecto, el aviso de que habrá que
   * confirmarlo más adelante; quien pide la confirmación en el mismo lugar pasa aquí su casilla.
   */
  saleTotalMismatchNotice?: ReactNode;
};

const DEFAULT_SALE_TOTAL_MISMATCH_NOTICE = (
  <p className="border-warning/40 bg-warning/8 text-warning-foreground rounded-md border px-3 py-2 text-xs font-medium">
    El total de la orden difiere del total de la venta. Podrás registrarla, pero tendrás que confirmarlo.
  </p>
);

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

// Desde 384 px los tres montos comparten fila; antes de eso el Monto financiado baja solo a la suya.
const TEXT_FIELD_CELL = "min-w-0 @sm:col-span-3 @2xl:col-span-1";
const AMOUNT_FIELD_CELL = "min-w-0 @sm:col-span-2 @2xl:col-span-1";

/** Los cinco datos de una Orden Cashea con la verificación de la suma contra el total. */
export function CasheaOrderFields({
  orderForm,
  disabled = false,
  saleTotalMismatchNotice = DEFAULT_SALE_TOTAL_MISMATCH_NOTICE,
}: CasheaOrderFieldsProps) {
  const { form, evaluation, fieldOptions } = orderForm;
  const { sumDifferenceUsd, sumError, saleTotalMismatch } = evaluation;

  return (
    <div className="@container flex flex-col gap-3">
      <fieldset
        disabled={disabled}
        className="grid min-w-0 grid-cols-2 items-start gap-3 @sm:grid-cols-6 @2xl:grid-cols-5"
      >
        <div className={TEXT_FIELD_CELL}>
          <form.AppField {...fieldOptions("orderNumber")}>
            {(field) => <field.TextField label="N° de orden" placeholder="6400685" {...TEXT_INPUT_PROPS} />}
          </form.AppField>
        </div>

        <div className={TEXT_FIELD_CELL}>
          <form.AppField {...fieldOptions("invoiceNumber")}>
            {(field) => <field.TextField label="N° de factura" placeholder="551-000738" {...TEXT_INPUT_PROPS} />}
          </form.AppField>
        </div>

        <div className={AMOUNT_FIELD_CELL}>
          <form.AppField {...fieldOptions("totalUsd")}>
            {(field) => <field.TextFieldGroup label="Total de la orden" {...AMOUNT_INPUT_PROPS} />}
          </form.AppField>
        </div>

        <div className={AMOUNT_FIELD_CELL}>
          <form.AppField {...fieldOptions("paidTodayUsd")}>
            {(field) => <field.TextFieldGroup label="Cobrado hoy" {...AMOUNT_INPUT_PROPS} />}
          </form.AppField>
        </div>

        <div className={cn(AMOUNT_FIELD_CELL, "col-span-2")}>
          <form.AppField {...fieldOptions("financedUsd")}>
            {(field) => <field.TextFieldGroup label="Monto financiado" {...AMOUNT_INPUT_PROPS} />}
          </form.AppField>
        </div>
      </fieldset>

      {/* Como el Monto financiado se calcula solo, casi siempre cuadra: la suma solo se menciona cuando no. */}
      {sumError && sumDifferenceUsd !== null && (
        <p role="alert" className="text-destructive text-xs font-medium">
          {sumError}: {sumDifferenceUsd < 0 ? "faltan" : "sobran"}{" "}
          <span className="data-value">{formatCurrencyUSD(Math.abs(sumDifferenceUsd))}</span>
        </p>
      )}

      {saleTotalMismatch && saleTotalMismatchNotice}
    </div>
  );
}
