import { useState } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { COMPACT_FIELD_LABEL_CLASS_NAME } from "@/components/forms/field-wrapper";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { CasheaOrderDraft, CasheaOrderDraftField, CasheaOrderEvaluation } from "../cashea-order-draft";

type CasheaOrderFieldsProps = {
  draft: CasheaOrderDraft;
  /** Resultado de `evaluateCasheaOrderDraft` para `draft`; lo calcula el dueño del estado para decidir si se puede confirmar. */
  evaluation: CasheaOrderEvaluation;
  onDraftChange: (draft: CasheaOrderDraft) => void;
  disabled?: boolean;
  /** Prefijo de los `id` de los campos, para usar el componente en varios diálogos a la vez. */
  idPrefix?: string;
};

type FieldConfig = {
  name: CasheaOrderDraftField;
  label: string;
  isAmount: boolean;
  placeholder: string;
};

const FIELDS: FieldConfig[] = [
  { name: "orderNumber", label: "N° de orden", isAmount: false, placeholder: "6400685" },
  { name: "invoiceNumber", label: "N° de factura", isAmount: false, placeholder: "551-000738" },
  { name: "totalUsd", label: "Total de la orden", isAmount: true, placeholder: "0.00" },
  { name: "paidTodayUsd", label: "Cobrado hoy", isAmount: true, placeholder: "0.00" },
  { name: "financedUsd", label: "Monto financiado", isAmount: true, placeholder: "0.00" },
];

/**
 * Los cinco datos de una Orden Cashea con la verificación de la suma. Componente controlado: el dueño del estado
 * guarda el borrador y lo limpia, y decide si se puede confirmar con `evaluation.order`.
 */
export function CasheaOrderFields({
  draft,
  evaluation,
  onDraftChange,
  disabled = false,
  idPrefix = "cashea",
}: CasheaOrderFieldsProps) {
  const [touchedFields, setTouchedFields] = useState<Partial<Record<CasheaOrderDraftField, boolean>>>({});

  const { fieldErrors, orderTotalUsd, sumUsd, sumDifferenceUsd, sumError, saleTotalMismatch } = evaluation;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {FIELDS.map((field) => {
          const inputId = `${idPrefix}-${field.name}`;
          const errorMessage = touchedFields[field.name] ? fieldErrors[field.name] : undefined;
          const isInvalid = Boolean(errorMessage);

          return (
            <Field
              key={field.name}
              data-invalid={isInvalid}
              className={cn("min-w-0 gap-1.5", field.name === "financedUsd" && "col-span-2 md:col-span-1")}
            >
              <FieldLabel htmlFor={inputId} className={COMPACT_FIELD_LABEL_CLASS_NAME}>
                {field.label}
              </FieldLabel>
              <InputGroup>
                {field.isAmount && <InputGroupAddon align="inline-start">$</InputGroupAddon>}
                <InputGroupInput
                  id={inputId}
                  name={field.name}
                  value={draft[field.name]}
                  placeholder={field.placeholder}
                  inputMode={field.isAmount ? "decimal" : "text"}
                  autoComplete="off"
                  disabled={disabled}
                  aria-invalid={isInvalid}
                  className={field.isAmount ? "tabular-nums" : undefined}
                  onChange={(event) => onDraftChange({ ...draft, [field.name]: event.target.value })}
                  onBlur={() => setTouchedFields((current) => ({ ...current, [field.name]: true }))}
                />
              </InputGroup>
              {errorMessage && <FieldError className="text-xs">{errorMessage}</FieldError>}
            </Field>
          );
        })}
      </div>

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
