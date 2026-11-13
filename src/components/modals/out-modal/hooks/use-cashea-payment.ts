import { useState } from "react";
import { useCasheaOrderForm } from "@/features/cashea/hooks/use-cashea-order-form";

/** Estado de «Pago con Cashea» en «Registrar Venta»: el formulario de la Orden Cashea y si permite confirmar. */
export function useCasheaPayment(saleTotalUsd: number) {
  const [isCasheaPayment, setIsCasheaPayment] = useState(false);
  const orderForm = useCasheaOrderForm(saleTotalUsd);

  const casheaOrder = isCasheaPayment ? orderForm.evaluation.order : null;

  const clearCasheaPayment = () => {
    setIsCasheaPayment(false);
    orderForm.form.reset();
  };

  return {
    isCasheaPayment,
    setIsCasheaPayment,
    /** Formulario de la Orden Cashea, para `CasheaOrderFields`. */
    orderForm,
    /** Orden Cashea lista para enviar; `null` en una venta sin Cashea o con datos incompletos. */
    casheaOrder,
    /** «Pago con Cashea» está activo y algún dato falta o es inválido: no se puede confirmar. */
    isCasheaIncomplete: isCasheaPayment && casheaOrder === null,
    clearCasheaPayment,
  };
}
