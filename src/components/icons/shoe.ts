import { createLucideIcon } from "lucide-react";

/**
 * Unidades de calzado: una zapatilla de perfil. Lucide no trae zapato y el `ShoppingCart` ya es el icono de Ventas.
 */
export const Shoe = createLucideIcon("shoe", [
  [
    "path",
    {
      d: "M3 5h3.5a3.5 3.5 0 0 0 5 1.4l6.6 3.7A6 6 0 0 1 22 15.5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1z",
      key: "upper",
    },
  ],
  ["path", { d: "M2 15h20", key: "sole" }],
  ["path", { d: "m12.5 9.5 1-1.5", key: "lace-1" }],
  ["path", { d: "m15.5 11.2 1-1.5", key: "lace-2" }],
]);
