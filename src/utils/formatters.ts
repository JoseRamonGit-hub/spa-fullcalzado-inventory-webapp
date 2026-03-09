/**
 * @file formatters.ts
 * @description Utility functions for formatting numbers, currency, and dates consistently
 * across the application, localized to Venezuela (es-VE, America/Caracas).
 */

// ============================================================================
// Constants & Configuration
// ============================================================================
const LOCALE_VE = "es-VE";
const LOCALE_US = "en-US";
const LOCALE_CA = "en-CA"; // Used for YYYY-MM-DD backend format
const TIMEZONE_CCS = "America/Caracas";

// ============================================================================
// Number & Currency Formatters Options
// ============================================================================
const currencyUsdFormatter = new Intl.NumberFormat(LOCALE_US, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyVesFormatter = new Intl.NumberFormat(LOCALE_VE, {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ============================================================================
// Date & Time Formatters Options
// ============================================================================
const dateDisplayFormatter = new Intl.DateTimeFormat(LOCALE_VE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TIMEZONE_CCS,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE_VE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: TIMEZONE_CCS,
});

const timeDisplayFormatter = new Intl.DateTimeFormat(LOCALE_VE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: TIMEZONE_CCS,
});

const dateBackendFormatter = new Intl.DateTimeFormat(LOCALE_CA, {
  timeZone: TIMEZONE_CCS,
});

// ============================================================================
// Helper Functions
// ============================================================================
// Shared date input type to avoid repeating
type DateInput = string | Date | number | null;

/**
 * Safely parses a flexible date input into a valid Date object.
 * Returns null if the parsed date is invalid.
 */
function safelyParseDate(date?: DateInput): Date | null {
  if (!date) return null;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ============================================================================
// Exported Formatting Functions
// ============================================================================

export function formatCurrencyUSD(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "$0.00";
  return currencyUsdFormatter.format(value);
}

export function formatCurrencyVES(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "0,00 Bs.";
  return `${currencyVesFormatter.format(value)} Bs.`;
}

export function formatDate(dateInput?: DateInput): string {
  const date = safelyParseDate(dateInput);
  return date ? dateDisplayFormatter.format(date) : "";
}

export function formatDateTime(dateInput?: DateInput): string {
  const date = safelyParseDate(dateInput);
  return date ? dateTimeFormatter.format(date) : "";
}

export function formatTime(dateInput?: DateInput): string {
  const date = safelyParseDate(dateInput);
  return date ? timeDisplayFormatter.format(date) : "";
}

export function formatDateForBackend(dateInput?: DateInput): string {
  const date = safelyParseDate(dateInput);
  return date ? dateBackendFormatter.format(date) : "";
}
