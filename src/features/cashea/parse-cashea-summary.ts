import { readOrderDetail } from "./cashea-summary/order-detail";
import { readLabeledSummary } from "./cashea-summary/labeled-summary";
import type { CasheaParseResult } from "./cashea-summary/values";

export type { CasheaParseResult } from "./cashea-summary/values";

/** Cada lector devuelve null si su formato no coincide. Los formatos con estructura van antes del resumen por etiquetas. */
const structuredFormats: ReadonlyArray<(lines: readonly string[]) => CasheaParseResult | null> = [readOrderDetail];

/**
 * Lee los cinco campos de una Orden Cashea. Los campos que el formato no permite reconocer quedan en null.
 * La validación de los montos y la confirmación de la orden se hacen en el formulario.
 */
export function parseCasheaSummary(text: string): CasheaParseResult {
  const lines = text
    .normalize("NFC")
    .split(/[\r\n\u2028\u2029]+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const fields = readSummary(lines);
  return {
    ...fields,
    financedUsd: fields.financedUsd ?? remainingUsd(fields.totalUsd, fields.paidTodayUsd),
  };
}

function readSummary(lines: readonly string[]): CasheaParseResult {
  for (const read of structuredFormats) {
    const fields = read(lines);
    if (fields) return fields;
  }
  return readLabeledSummary(lines);
}

function remainingUsd(totalUsd: number | null, paidTodayUsd: number | null): number | null {
  if (totalUsd === null || paidTodayUsd === null) return null;

  const remainingCents = Math.round(totalUsd * 100) - Math.round(paidTodayUsd * 100);
  return remainingCents > 0 ? remainingCents / 100 : null;
}
