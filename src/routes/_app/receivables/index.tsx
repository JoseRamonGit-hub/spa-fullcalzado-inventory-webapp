import { createFileRoute, redirect } from "@tanstack/react-router";

/** «Cuentas por cobrar» agrupa los módulos de cobro; hoy solo existe Cashea. */
export const Route = createFileRoute("/_app/receivables/")({
  beforeLoad: () => {
    throw redirect({ to: "/receivables/cashea", replace: true });
  },
});
