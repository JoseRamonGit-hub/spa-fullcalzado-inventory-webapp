import { createLucideIcon } from "lucide-react";

/**
 * Dinero que quedó en caja: un fajo de billetes, a diferencia del recibo de lo facturado.
 * El `CircleDollarSign` de Lucide solo dice «dinero» y no distingue el Total producido del Total facturado.
 */
export const CashStack = createLucideIcon("cash-stack", [
  ["path", { d: "M6 5h14a2 2 0 0 1 2 2v8", key: "back-note" }],
  ["rect", { x: "2", y: "9", width: "16", height: "10", rx: "2", key: "front-note" }],
  ["circle", { cx: "10", cy: "14", r: "2", key: "seal" }],
]);
