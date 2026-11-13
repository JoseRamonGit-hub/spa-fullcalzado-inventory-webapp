/** Claves de las consultas Cashea del negocio activo; las consultas se añaden con la página Cashea. */
export const casheaKeys = {
  all: ["cashea"] as const,
  business: (businessId: string | null) => [...casheaKeys.all, businessId] as const,
};
