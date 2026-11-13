import { useState } from "react";
import { useCasheaOrderForm } from "@/features/cashea/hooks/use-cashea-order-form";

/** Estado de «Pago con Cashea» en «Registrar Venta»: el formulario de la Orden Cashea y si permite confirmar. */
export function useCasheaPayment(saleTotalUsd: number) {
  const [isCasheaPayment, setIsCasheaPayment] = useState(false);
  const { form, evaluation } = useCasheaOrderForm(saleTotalUsd);

  const casheaOrder = isCasheaPayment ? evaluation.order : null;

  const clearCasheaPayment = () => {
    setIsCasheaPayment(false);
    form.reset();
  };

  return {
    isCasheaPayment,
    setIsCasheaPayment,
    form,
    evaluation,
    /** Orden Cashea lista para enviar; `null` en una venta sin Cashea o con datos incompletos. */
    casheaOrder,
    /** «Pago con Cashea» está activo y algún dato falta o es inválido: no se puede confirmar. */
    isCasheaIncomplete: isCasheaPayment && casheaOrder === null,
    clearCasheaPayment,
  };
}
