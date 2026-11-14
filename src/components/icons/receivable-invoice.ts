import { createLucideIcon } from "lucide-react";

export const ReceivableInvoice = createLucideIcon("receivable-invoice", [
  ["path", { d: "M16 7.5V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5", key: "invoice" }],
  ["path", { d: "M8 8h4", key: "line-1" }],
  ["path", { d: "M8 12h2", key: "line-2" }],
  ["circle", { cx: "17", cy: "16", r: "5", key: "clock" }],
  ["path", { d: "M17 14v2l1.5 1", key: "hands" }],
]);
