const MAX_RATE_DECIMALS = 4;

export type ParsedRate = { rate: number } | { error: string } | { empty: true };

/** Lee la tasa que escribe el usuario. Acepta coma o punto decimal y tolera el separador final mientras se escribe. */
export function parseExchangeRateInput(rawValue: string): ParsedRate {
  const value = rawValue.trim();
  if (value === "") return { empty: true };

  const match = /^(\d+)(?:[.,](\d*))?$/.exec(value);
  if (!match) return { error: "Solo números y coma decimal" };

  const [, integerPart, decimalPart = ""] = match;
  if (decimalPart.length > MAX_RATE_DECIMALS) return { error: `Máximo ${MAX_RATE_DECIMALS} decimales` };

  const rate = Number(`${integerPart}.${decimalPart || "0"}`);
  if (rate <= 0) return { error: "Debe ser mayor que cero" };

  return { rate };
}

/** Valor editable de una tasa: coma decimal y sin separador de miles, para reescribirla tal cual. */
export function toExchangeRateInput(rate: number | null | undefined) {
  if (!rate) return "";
  // Al menos dos decimales, como se muestra la tasa en el resto de la app; los demás se conservan.
  const hasAtMostTwoDecimals = Math.abs(rate * 100 - Math.round(rate * 100)) < 1e-9;
  const text = hasAtMostTwoDecimals ? rate.toFixed(2) : String(rate);
  return text.replace(".", ",");
}
