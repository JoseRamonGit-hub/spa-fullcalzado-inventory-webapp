import { createLucideIcon } from "lucide-react";

export const CashRegister = createLucideIcon("cash-register", [
  ["rect", { width: "20", height: "6", x: "2", y: "15", rx: "1.5", key: "drawer" }],
  ["path", { d: "M4.5 15 6 10h12l1.5 5", key: "body" }],
  ["rect", { width: "7", height: "4", x: "6", y: "3", rx: "1", key: "display" }],
  ["path", { d: "M9.5 7v3", key: "stand" }],
  ["path", { d: "M10 18h4", key: "handle" }],
]);
