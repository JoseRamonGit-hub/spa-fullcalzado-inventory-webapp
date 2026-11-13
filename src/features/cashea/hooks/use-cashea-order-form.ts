import { useEffect } from "react";
import { useStore } from "@tanstack/react-form";
import { useAppForm } from "@/hooks/form";
import {
  EMPTY_CASHEA_ORDER_DRAFT,
  evaluateCasheaOrderDraft,
  type CasheaOrderDraft,
  type CasheaOrderDraftField,
} from "../cashea-order-draft";

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
    },
  });

  // El tope del Monto financiado depende del total de la venta, que cambia al agregar o quitar Renglones.
  useEffect(() => {
    if (form.getFieldMeta("financedUsd")?.isTouched) void form.validateField("financedUsd", "change");
  }, [form, saleTotalUsd]);

  return { form, evaluation, fieldOptions };
}

/** Lo que devuelve `useCasheaOrderForm`; se entrega completo a `CasheaOrderFields`. */
export type CasheaOrderFormApi = ReturnType<typeof useCasheaOrderForm>;
