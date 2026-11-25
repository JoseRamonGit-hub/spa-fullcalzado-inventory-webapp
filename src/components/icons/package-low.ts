import { createLucideIcon } from "lucide-react";

/**
 * Stock bajo: la caja de Inventario (`Package`) con una flecha que baja, como los `Package*` de Lucide.
 * El `TriangleAlert` genérico se confundía con los avisos de error del dashboard.
 */
export const PackageLow = createLucideIcon("package-low", [
  ["path", { d: "M12 22V12", key: "front-edge" }],
  ["path", { d: "M3.29 7 12 12l8.71-5", key: "top-edges" }],
  ["path", { d: "m7.5 4.27 8.997 5.148", key: "tape" }],
  [
    "path",
    {
      d: "M21 11V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l.5-.285",
      key: "box",
    },
  ],
  ["path", { d: "M19 14v7", key: "arrow-shaft" }],
  ["path", { d: "m16 18 3 3 3-3", key: "arrow-head" }],
]);
