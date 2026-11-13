/** Código que PostgREST entrega para un `raise exception` simple: una regla de negocio de una RPC. */
const BUSINESS_RULE_ERROR_CODE = "P0001";

/** Error relanzado por un servicio que conserva el código del error de Supabase. */
export class ServiceError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export function toServiceError(error: { message: string; code?: string }): ServiceError {
  return new ServiceError(error.message, error.code || undefined);
}

/**
 * Mensaje para el usuario: el del servidor cuando una regla de negocio rechazó la operación,
 * y el genérico en cualquier otro caso (fallo de red, error inesperado).
 */
export function getBusinessRuleErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ServiceError && error.code === BUSINESS_RULE_ERROR_CODE && error.message) {
    return error.message;
  }
  return fallbackMessage;
}
