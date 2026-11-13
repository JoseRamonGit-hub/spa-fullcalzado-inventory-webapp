import { getBusinessRuleErrorMessage } from "@/lib/errors";

export const MODAL_SUBMISSION_ERROR_MESSAGES = {
  inventoryLoad: "No se completó toda la carga. Revisa el inventario antes de intentarlo de nuevo.",
  sale: "No se pudo registrar la venta. Revisa la conexión e intenta de nuevo.",
  refund: "No se pudo registrar la devolución. Revisa la conexión e intenta de nuevo.",
  exchange: "No se pudo registrar el cambio. Revisa la conexión e intenta de nuevo.",
} as const;

/** Mensaje del servidor si una regla de negocio rechazó la venta; el genérico en cualquier otro caso. */
export function getSaleSubmissionErrorMessage(error: unknown): string {
  return getBusinessRuleErrorMessage(error, MODAL_SUBMISSION_ERROR_MESSAGES.sale);
}
