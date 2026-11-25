export type CasheaParseResult = {
  orderNumber: string | null;
  totalUsd: number | null;
  paidTodayUsd: number | null;
  financedUsd: number | null;
  invoiceNumber: string | null;
};

export function readInvoiceNumber(value: string): string | null {
  return /^[\p{L}\d-]*\d[\p{L}\d-]*$/u.test(value) ? value : null;
}

/** Lee montos del panel con punto o coma decimal y separadores de miles. */
export function readPanelAmount(value: string): number | null {
  const match = /^(?:\$\s*)?(\d+(?:[.,]\d+)*)$/.exec(value);
  if (!match) return null;

  const digits = match[1];
  const separators = digits.replace(/\d/g, "");
  const lastSeparator = separators.at(-1);
  let integer = digits;
  let fraction = "0";

  if (lastSeparator) {
    const lastSeparatorIndex = digits.lastIndexOf(lastSeparator);
    const trailingDigits = digits.length - lastSeparatorIndex - 1;
    const usesBothSeparators = separators.includes(".") && separators.includes(",");
    if (usesBothSeparators || (separators.length === 1 && trailingDigits <= 2)) {
      integer = digits.slice(0, lastSeparatorIndex);
      fraction = digits.slice(lastSeparatorIndex + 1);
    }
    if (!/^\d+$|^[1-9]\d{0,2}(?:[.,]\d{3})+$/.test(integer)) return null;
  }

  const cents = Math.round(Number(`${integer.replace(/[.,]/g, "")}.${fraction}`) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents / 100 : null;
}
