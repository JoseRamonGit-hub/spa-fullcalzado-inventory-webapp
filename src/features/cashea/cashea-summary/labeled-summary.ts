import { readInvoiceNumber, readPanelAmount, type CasheaParseResult } from "./values";

// Prueba primero las etiquetas más específicas, aunque aparezcan más abajo en el texto.
const FIELD_LABELS = {
  orderNumber: [/n\s*[°º]\s*de\s+orden/gu, /#\s*orden/gu, /orden/gu],
  totalUsd: [/monto\s+total/gu, /total/gu],
  paidTodayUsd: [/cobrado\s+hoy/gu, /cobrar\s+hoy/gu, /pago\s+inicial/gu, /inicial/gu],
  financedUsd: [/financiado/gu],
  invoiceNumber: [/#\s*de\s+factura/gu, /factura/gu, /id/gu],
} satisfies Record<keyof CasheaParseResult, RegExp[]>;

/** Resumen «Debe pagar» y otros fragmentos que traen etiquetas junto a sus valores. */
export function readLabeledSummary(lines: readonly string[]): CasheaParseResult {
  const text = lines.join(" ");
  // Conserva las posiciones del original para leer los identificadores con sus letras y ceros iniciales.
  const folded = text.replace(/\p{L}/gu, (letter) => {
    const normalized = letter.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    return normalized.length === letter.length ? normalized : letter;
  });

  function readField<T>(field: keyof CasheaParseResult, read: (value: string) => T | null): T | null {
    for (const label of FIELD_LABELS[field]) {
      const wholeLabel = new RegExp(`(?<![\\p{L}\\p{N}])(?:${label.source})(?![\\p{L}\\p{N}])`, label.flags);
      for (const match of folded.matchAll(wholeLabel)) {
        const remainder = text.slice(match.index + match[0].length);
        const value = /^[\s:#]*((?:\$\s*)?\S+)/.exec(remainder)?.[1]?.replace(/[.,;:]+$/, "") ?? "";
        const parsed = read(value);
        if (parsed !== null) return parsed;
      }
    }
    return null;
  }

  return {
    orderNumber: readField("orderNumber", (value) => (/^\d+$/.test(value) ? value : null)),
    totalUsd: readField("totalUsd", readPanelAmount),
    paidTodayUsd: readField("paidTodayUsd", readPanelAmount),
    financedUsd: readField("financedUsd", readPanelAmount),
    invoiceNumber: readField("invoiceNumber", readInvoiceNumber),
  };
}
