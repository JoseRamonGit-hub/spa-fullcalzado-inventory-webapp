import { useEffect } from "react";
import { useStore } from "@tanstack/react-form";
import { useAppForm } from "@/hooks/form";
import {
  calculateFinancedUsd,
  EMPTY_CASHEA_ORDER_DRAFT,
  evaluateCasheaOrderDraft,
  type CasheaOrderDraft,
  type CasheaOrderDraftField,
} from "../cashea-order-draft";
import { parseCasheaSummary } from "../parse-cashea-summary";

/** Campos de los que se deriva el Monto financiado. */
const FINANCED_INPUT_FIELDS = new Set<CasheaOrderDraftField>(["totalUsd", "paidTodayUsd"]);

/**
 * Formulario de los cinco datos de una Orden Cashea, validado con las reglas de REQ-001 contra el total de la venta.
 * Cada campo se valida por separado: su error aparece al escribir en él o al salir de él, sin tocar los demás.
 * Lo usan «Registrar Venta» y los diálogos que capturan una Orden Cashea; `evaluation.order` dice si se puede confirmar.
 */
export function useCasheaOrderForm(saleTotalUsd: number) {
  const form = useAppForm({ defaultValues: EMPTY_CASHEA_ORDER_DRAFT });

  const draft = useStore(form.store, (state) => state.values);
  const evaluation = evaluateCasheaOrderDraft(draft, saleTotalUsd);

  /** Props de `form.AppField` para un campo: su validador y la validación al salir de él. */
  const fieldOptions = <TName extends CasheaOrderDraftField>(name: TName) => ({
    name,
    validators: {
      onChange: ({ value }: { value: CasheaOrderDraft[TName] }) =>
        evaluateCasheaOrderDraft({ ...form.state.values, [name]: value }, saleTotalUsd).fieldErrors[name],
    },
    listeners: {
      // Un campo obligatorio que se deja vacío muestra su error al salir de él.
      onBlur: ({ fieldApi }: { fieldApi: { validate: (cause: "change") => unknown } }) => {
        fieldApi.validate("change");
      },
      onChange: FINANCED_INPUT_FIELDS.has(name) ? fillFinancedUsd : undefined,
    },
  });

  // El Monto financiado se calcula como total menos Cobrado hoy; el cajero puede corregirlo después.
  function fillFinancedUsd() {
    const { totalUsd, paidTodayUsd } = form.state.values;
    const financedUsd = calculateFinancedUsd(totalUsd, paidTodayUsd);
    if (financedUsd !== null) form.setFieldValue("financedUsd", financedUsd);
  }

  /**
   * Rellena los campos que reconoce en el resumen pegado del panel de Cashea; los demás conservan lo que el cajero
   * escribió, sin recalcular el Monto financiado (el parser ya lo deriva cuando puede). Nada se envía: el cajero revisa
   * y confirma. El texto solo se analiza, no se guarda.
   */
  function fillFromSummary(text: string) {
    const summary = parseCasheaSummary(text);
    const recognized: Record<CasheaOrderDraftField, string | null> = {
      orderNumber: summary.orderNumber,
      invoiceNumber: summary.invoiceNumber,
      totalUsd: formatAmount(summary.totalUsd),
      paidTodayUsd: formatAmount(summary.paidTodayUsd),
      financedUsd: formatAmount(summary.financedUsd),
    };
    for (const [name, value] of Object.entries(recognized) as [CasheaOrderDraftField, string | null][]) {
      if (value !== null) form.setFieldValue(name, value, { dontRunListeners: true });
    }
  }

  // El tope del Monto financiado depende del total de la venta, que cambia al agregar o quitar Renglones.
  useEffect(() => {
    if (form.getFieldMeta("financedUsd")?.isTouched) void form.validateField("financedUsd", "change");
  }, [form, saleTotalUsd]);

  return { form, evaluation, fieldOptions, fillFromSummary };
}

const formatAmount = (usd: number | null) => (usd === null ? null : usd.toFixed(2));

/** Lo que devuelve `useCasheaOrderForm`; se entrega completo a `CasheaOrderFields`. */
export type CasheaOrderFormApi = ReturnType<typeof useCasheaOrderForm>;
