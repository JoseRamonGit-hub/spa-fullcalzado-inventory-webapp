import { createLucideIcon } from "lucide-react";

/**
 * Crédito de una Devolución: un billete con la flecha de vuelta, al estilo de los `Banknote*` de Lucide.
 * Separa el dinero que se reconoce al cliente del `DollarSign`/`Banknote` genéricos de cualquier importe.
 */
export const ReturnCredit = createLucideIcon("return-credit", [
  ["path", { d: "M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4", key: "note" }],
  ["circle", { cx: "11", cy: "12", r: "2", key: "seal" }],
  ["path", { d: "M6 12h.01", key: "dot" }],
  ["path", { d: "m17 13.5-2.5 2.5 2.5 2.5", key: "arrow-head" }],
  ["path", { d: "M14.5 16H19a3 3 0 0 1 0 6h-1", key: "arrow-body" }],
]);
