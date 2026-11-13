import { useEffect } from "react";
import { useStore } from "@tanstack/react-form";
import { useAppForm } from "@/hooks/form";
import {
  EMPTY_CASHEA_ORDER_DRAFT,
  evaluateCasheaOrderDraft,
  type CasheaOrderDraft,
  type CasheaOrderEvaluation,
} from "../cashea-order-draft";

/** Errores de la evaluación en el formato de un validador de formulario de TanStack Form. */
function toFormValidationErrors({ fieldErrors, sumError }: CasheaOrderEvaluation) {
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  if (!hasFieldErrors && !sumError) return undefined;
  return { form: sumError ?? undefined, fields: fieldErrors };
}

/**
 * Formulario de los cinco datos de una Orden Cashea, validado con las reglas de REQ-001 contra el total de la venta.
 * Lo usan «Registrar Venta» y los diálogos que capturan una Orden Cashea; `evaluation.order` dice si se puede confirmar.
 */
export function useCasheaOrderForm(saleTotalUsd: number) {
  const form = useAppForm({
    defaultValues: EMPTY_CASHEA_ORDER_DRAFT,
    validators: {
      onChange: ({ value }: { value: CasheaOrderDraft }) =>
        toFormValidationErrors(evaluateCasheaOrderDraft(value, saleTotalUsd)),
    },
    listeners: {
      // Un campo obligatorio que se deja vacío muestra su error al salir de él.
      onBlur: ({ formApi }) => {
        void formApi.validate("change");
      },
    },
  });

  const draft = useStore(form.store, (state) => state.values);
  const evaluation = evaluateCasheaOrderDraft(draft, saleTotalUsd);

  // El tope del Monto financiado depende del total de la venta, que cambia al agregar o quitar Renglones.
  useEffect(() => {
    void form.validate("change");
  }, [form, saleTotalUsd]);

  return { form, evaluation };
}

export type CasheaOrderForm = ReturnType<typeof useCasheaOrderForm>["form"];
