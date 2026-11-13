/** Lo que `parseCasheaSummary` reconoce en el resumen de una orden copiado del panel de Cashea. */
export type CasheaParseResult = {
  orderNumber: string | null;
  totalUsd: number | null;
  paidTodayUsd: number | null;
  financedUsd: number | null;
  invoiceNumber: string | null;
};

type SummaryField = keyof CasheaParseResult;

/**
 * Etiquetas de cada campo, de la más larga a la más corta, sobre el texto en minúsculas y sin acentos. Se buscan como
 * palabras completas: «ID» no coincide dentro de otra palabra.
 */
const LABELS: Record<SummaryField, string[]> = {
  orderNumber: [String.raw`n\s*[°º]\s*de\s+orden`, String.raw`#\s*orden`, "orden"],
  totalUsd: [String.raw`monto\s+total`, "total"],
  paidTodayUsd: [String.raw`cobrado\s+hoy`, String.raw`cobrar\s+hoy`, String.raw`pago\s+inicial`],
  financedUsd: ["financiado"],
  invoiceNumber: [String.raw`#\s*de\s+factura`, "factura", "id"],
};

const ORDER_NUMBER_SHAPE = /^\d+$/;
const INVOICE_NUMBER_SHAPE = /^[\p{L}\d-]*\d[\p{L}\d-]*$/u;

/** Unifica saltos de línea, tabulaciones y espacios (incluido el de no separación) en un solo espacio. */
function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Minúsculas y sin acentos, carácter por carácter, para que cada posición coincida con la del texto original. */
function fold(text: string): string {
  return text
    .split("")
    .map((char) => char.normalize("NFD")[0].toLowerCase()[0])
    .join("");
}

/**
 * Interpreta un monto como `$ 185.6`, `92,80`, `1.234,56` o `1,234.56`: con coma y punto, el último separador es el
 * decimal; con uno solo, es decimal si le siguen uno o dos dígitos y de miles si le siguen tres. Redondea a centavos e
 * ignora los montos negativos o iguales a cero. Distinto de la validación del formulario: aquí se lee el formato del
 * panel, no lo que escribe el cajero.
 */
function readPanelAmount(token: string): number | null {
  const match = /^\$?(\d+(?:[.,]\d+)*)$/.exec(token);
  if (!match) return null;

  const digits = match[1];
  const separators = digits.replace(/\d/g, "");
  const lastSeparator = separators.at(-1);
  let integerPart = digits;
  let decimalPart = "";

  if (lastSeparator) {
    const decimalStart = digits.lastIndexOf(lastSeparator) + 1;
    const trailingDigits = digits.length - decimalStart;
    const isDecimal = new Set(separators).size === 2 || (separators.length === 1 && trailingDigits <= 2);
    if (isDecimal) {
      integerPart = digits.slice(0, decimalStart - 1);
      decimalPart = digits.slice(decimalStart);
    }
    // Lo que queda a la izquierda solo admite separadores de miles: grupos de tres dígitos tras un primero sin ceros.
    if (!/^\d+$/.test(integerPart) && !/^[1-9]\d{0,2}(?:[.,]\d{3})+$/.test(integerPart)) return null;
  }

  const cents = Math.round(Number(`${integerPart.replace(/[.,]/g, "")}.${decimalPart || "0"}`) * 100);
  return cents > 0 ? cents / 100 : null;
}

/**
 * Valor que sigue a una etiqueta: el siguiente token tras «:» o «#», unido al «$» que lo precede y sin la puntuación
 * que lo cierra («185.60.», «6400685,»).
 */
function valueAfter(text: string, labelEnd: number): string {
  const match = /^[\s:#]*(\$\s*)?(\S*)/.exec(text.slice(labelEnd));
  if (!match) return "";
  return `${match[1] ? "$" : ""}${match[2].replace(/[.,;:]+$/, "")}`;
}

/**
 * Prueba cada aparición de las etiquetas del campo y devuelve el primer valor que `read` acepta; si lo que sigue a una
 * aparición no tiene la forma del campo, prueba la siguiente.
 */
function readField<T>(text: string, field: SummaryField, read: (value: string) => T | null): T | null {
  const folded = fold(text);
  for (const label of LABELS[field]) {
    const pattern = new RegExp(String.raw`(?<![\p{L}\p{N}])${label}(?![\p{L}\p{N}])`, "gu");
    for (const match of folded.matchAll(pattern)) {
      const value = read(valueAfter(text, match.index + match[0].length));
      if (value !== null) return value;
    }
  }
  return null;
}

const matching = (shape: RegExp) => (value: string) => (shape.test(value) ? value : null);

/**
 * Lee del resumen de una Orden Cashea los cinco datos que reconoce por su etiqueta. Nunca lanza excepciones ni emite
 * avisos: lo que no reconoce queda en `null` para que el cajero lo escriba. No valida la aritmética (eso es del
 * formulario) ni devuelve otros datos del texto.
 */
export function parseCasheaSummary(text: string): CasheaParseResult {
  const normalized = normalize(text);
  const totalUsd = readField(normalized, "totalUsd", readPanelAmount);
  const paidTodayUsd = readField(normalized, "paidTodayUsd", readPanelAmount);
  const financedUsd =
    readField(normalized, "financedUsd", readPanelAmount) ?? deriveFinancedUsd(totalUsd, paidTodayUsd);

  return {
    orderNumber: readField(normalized, "orderNumber", matching(ORDER_NUMBER_SHAPE)),
    totalUsd,
    paidTodayUsd,
    financedUsd,
    invoiceNumber: readField(normalized, "invoiceNumber", matching(INVOICE_NUMBER_SHAPE)),
  };
}

/** Sin etiqueta de financiado, lo deriva del total menos el pago inicial, solo si queda mayor que cero. */
function deriveFinancedUsd(totalUsd: number | null, paidTodayUsd: number | null): number | null {
  if (totalUsd === null || paidTodayUsd === null) return null;
  const financedCents = Math.round(totalUsd * 100) - Math.round(paidTodayUsd * 100);
  return financedCents > 0 ? financedCents / 100 : null;
}
