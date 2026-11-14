import { createLucideIcon } from "lucide-react";

/**
 * Icono del Panel principal al estilo lucide (24×24, trazo de 2 y extremos redondeados):
 * un tablero con su rótulo y una tendencia al alza. Al crearse con `createLucideIcon`
 * acepta las mismas props que cualquier icono de lucide.
 */
export const DashboardPanel = createLucideIcon("dashboard-panel", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "panel" }],
  ["path", { d: "M7 8h4", key: "label" }],
  ["path", { d: "m7 16 3.5-3.5 2.5 2.5L17 11", key: "trend" }],
]);
