import { useState } from "react";
import { EMPTY_CASHEA_ORDER_DRAFT, evaluateCasheaOrderDraft } from "@/features/cashea/cashea-order-draft";

/** Estado de «Pago con Cashea» en «Registrar Venta»: los datos de la Orden Cashea y si permiten confirmar. */
export function useCasheaPayment(saleTotalUsd: number) {
  const [isCasheaPayment, setIsCasheaPayment] = useState(false);
  const [draft, setDraft] = useState(EMPTY_CASHEA_ORDER_DRAFT);

  const evaluation = evaluateCasheaOrderDraft(draft, saleTotalUsd);
  const casheaOrder = isCasheaPayment ? evaluation.order : null;

  const clearCasheaPayment = () => {
    setIsCasheaPayment(false);
    setDraft(EMPTY_CASHEA_ORDER_DRAFT);
  };

  return {
    isCasheaPayment,
    setIsCasheaPayment,
    draft,
    setDraft,
    evaluation,
    /** Orden Cashea lista para enviar; `null` en una venta sin Cashea o con datos incompletos. */
    casheaOrder,
    /** «Pago con Cashea» está activo y algún dato falta o es inválido: no se puede confirmar. */
    isCasheaIncomplete: isCasheaPayment && casheaOrder === null,
    clearCasheaPayment,
  };
}
