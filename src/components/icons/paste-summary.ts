import { createLucideIcon } from "lucide-react";

/**
 * Pegar un resumen copiado: el portapapeles con la hoja ya pegada delante, el gesto de «Pegar» de los editores.
 * El `ClipboardPaste` de Lucide saca una flecha del portapapeles y se lee como «exportar».
 */
export const PasteSummary = createLucideIcon("paste-summary", [
  ["rect", { x: "6", y: "2", width: "6", height: "4", rx: "1", key: "clip" }],
  // El tablero se corta antes de la hoja para que su trazo no se vea a través de ella.
  ["path", { d: "M6 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2", key: "board-left" }],
  ["path", { d: "M12 4h1a2 2 0 0 1 2 2v1", key: "board-right" }],
  ["rect", { x: "11", y: "11", width: "10", height: "11", rx: "2", key: "sheet" }],
  ["path", { d: "M14 15h4", key: "line-1" }],
  ["path", { d: "M14 18h2", key: "line-2" }],
]);
