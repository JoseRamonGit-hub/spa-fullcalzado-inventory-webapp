import type { CasheaOrderInput } from "@/types";

/** Los cinco datos de una Orden Cashea tal como los escribe el cajero. */
export type CasheaOrderDraft = {
  orderNumber: string;
  invoiceNumber: string;
  totalUsd: string;
  paidTodayUsd: string;
  financedUsd: string;
};

export type CasheaOrderDraftField = keyof CasheaOrderDraft;

export const EMPTY_CASHEA_ORDER_DRAFT: CasheaOrderDraft = {
  orderNumber: "",
  invoiceNumber: "",
  totalUsd: "",
  paidTodayUsd: "",
  financedUsd: "",
};

export type CasheaOrderEvaluation = {
  fieldErrors: Partial<Record<CasheaOrderDraftField, string>>;
  /** Total de la orden interpretado, cuando es un monto válido. */
  orderTotalUsd: number | null;
  /** Cobrado hoy + Monto financiado, cuando ambos son válidos. */
  sumUsd: number | null;
  /** Suma menos el total de la orden, cuando los tres montos son válidos. */
  sumDifferenceUsd: number | null;
  sumError: string | null;
  /** El total de la orden difiere del total de la venta: el cajero debe confirmarlo, pero no bloquea. */
  saleTotalMismatch: boolean;
  /** La Orden Cashea lista para la RPC; `null` mientras haya algún error. */
  order: CasheaOrderInput | null;
};

const MAX_TEXT_LENGTH = 40;
/** Tolerancia de $0.01, expresada en centavos. */
const TOLERANCE_CENTS = 1;

const MESSAGES = {
  required: "Campo obligatorio",
  textTooLong: `Máximo ${MAX_TEXT_LENGTH} caracteres`,
  invalidAmount: "Monto inválido",
  tooManyDecimals: "Máximo dos decimales",
  mustBePositive: "Debe ser mayor a 0",
  mustNotBeNegative: "No puede ser negativo",
  financedExceedsSale: "No puede superar el total de la venta",
  sumMismatch: "Cobrado hoy + Monto financiado debe coincidir con el total de la orden",
} as const;

type ParsedAmount = { cents: number } | { error: string };

/** Interpreta un monto en dólares con punto o coma decimal; trabaja en centavos para evitar errores de coma flotante. */
function parseAmount(rawValue: string): ParsedAmount {
  const value = rawValue.trim();
  if (value === "") return { error: MESSAGES.required };

  const match = /^(-?)(\d+)(?:[.,](\d+))?$/.exec(value);
  if (!match) return { error: MESSAGES.invalidAmount };

  const [, sign, integerPart, decimalPart = ""] = match;
  if (decimalPart.length > 2) return { error: MESSAGES.tooManyDecimals };

  const cents = Number(integerPart) * 100 + Number(decimalPart.padEnd(2, "0"));
  return { cents: sign === "-" ? -cents : cents };
}

function validateText(rawValue: string): string | null {
  const value = rawValue.trim();
  if (value === "") return MESSAGES.required;
  if (value.length > MAX_TEXT_LENGTH) return MESSAGES.textTooLong;
  return null;
}

const toCents = (usd: number) => Math.round(usd * 100);
const fromCents = (cents: number) => cents / 100;

/**
 * Monto financiado que corresponde a un total de la orden y un Cobrado hoy: la diferencia, con dos decimales.
 * `null` mientras alguno de los dos no sea un monto válido o lo Cobrado hoy supere el total.
 */
export function calculateFinancedUsd(totalUsd: string, paidTodayUsd: string): string | null {
  const total = parseAmount(totalUsd);
  const paidToday = parseAmount(paidTodayUsd);
  if (!("cents" in total) || !("cents" in paidToday) || paidToday.cents < 0) return null;

  const financedCents = total.cents - paidToday.cents;
  return financedCents < 0 ? null : fromCents(financedCents).toFixed(2);
}

/**
 * Aplica las reglas de REQ-001 a los datos que escribe el cajero. La RPC repite estas reglas:
 * el formulario no es la autoridad.
 */
export function evaluateCasheaOrderDraft(draft: CasheaOrderDraft, saleTotalUsd: number): CasheaOrderEvaluation {
  const fieldErrors: CasheaOrderEvaluation["fieldErrors"] = {};

  const orderNumberError = validateText(draft.orderNumber);
  if (orderNumberError) fieldErrors.orderNumber = orderNumberError;

  const invoiceNumberError = validateText(draft.invoiceNumber);
  if (invoiceNumberError) fieldErrors.invoiceNumber = invoiceNumberError;

  const total = parseAmount(draft.totalUsd);
  const paidToday = parseAmount(draft.paidTodayUsd);
  const financed = parseAmount(draft.financedUsd);

  if ("error" in total) fieldErrors.totalUsd = total.error;
  else if (total.cents <= 0) fieldErrors.totalUsd = MESSAGES.mustBePositive;

  if ("error" in paidToday) fieldErrors.paidTodayUsd = paidToday.error;
  else if (paidToday.cents < 0) fieldErrors.paidTodayUsd = MESSAGES.mustNotBeNegative;

  const saleTotalCents = toCents(saleTotalUsd);
  if ("error" in financed) fieldErrors.financedUsd = financed.error;
  else if (financed.cents <= 0) fieldErrors.financedUsd = MESSAGES.mustBePositive;
  else if (financed.cents > saleTotalCents) fieldErrors.financedUsd = MESSAGES.financedExceedsSale;

  const sumCents = "cents" in paidToday && "cents" in financed ? paidToday.cents + financed.cents : null;
  const sumDifferenceCents = sumCents !== null && "cents" in total ? sumCents - total.cents : null;
  const sumError =
    sumDifferenceCents !== null && Math.abs(sumDifferenceCents) > TOLERANCE_CENTS ? MESSAGES.sumMismatch : null;

  const saleTotalMismatch = "cents" in total && Math.abs(total.cents - saleTotalCents) > TOLERANCE_CENTS;

  const isValid = Object.keys(fieldErrors).length === 0 && sumError === null;
  const order =
    isValid && "cents" in total && "cents" in paidToday && "cents" in financed
      ? {
          order_number: draft.orderNumber.trim(),
          invoice_number: draft.invoiceNumber.trim(),
          total_usd: fromCents(total.cents),
          paid_today_usd: fromCents(paidToday.cents),
          financed_usd: fromCents(financed.cents),
        }
      : null;

  return {
    fieldErrors,
    orderTotalUsd: "cents" in total && !fieldErrors.totalUsd ? fromCents(total.cents) : null,
    sumUsd: sumCents === null ? null : fromCents(sumCents),
    sumDifferenceUsd: sumDifferenceCents === null ? null : fromCents(sumDifferenceCents),
    sumError,
    saleTotalMismatch,
    order,
  };
}
