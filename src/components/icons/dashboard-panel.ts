import { createLucideIcon } from "lucide-react";

export const DashboardPanel = createLucideIcon("dashboard-panel", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "panel" }],
  ["path", { d: "M7 8h4", key: "label" }],
  ["path", { d: "m7 16 3.5-3.5 2.5 2.5L17 11", key: "trend" }],
]);
