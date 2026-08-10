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

const calendarDateDisplayFormatter = new Intl.DateTimeFormat(LOCALE_VE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
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

export function formatCurrencyVES(value: number, options?: { includeCurrency?: boolean }): string {
  const formattedValue = typeof value !== "number" || isNaN(value) ? "0,00" : currencyVesFormatter.format(value);
  return options?.includeCurrency === false ? formattedValue : `${formattedValue} Bs.`;
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

/**
 * Serializes a day selected in a calendar without converting its local calendar components to another timezone.
 */
export function formatCalendarDateForBackend(date?: Date): string {
  if (!date || isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formats a calendar day while preserving the day selected by the user. */
export function formatCalendarDate(date?: Date): string {
  const dateString = formatCalendarDateForBackend(date);
  if (!dateString) return "";

  return calendarDateDisplayFormatter.format(new Date(`${dateString}T00:00:00Z`));
}

/** Formats a backend YYYY-MM-DD value without applying the browser timezone. */
export function formatCalendarDateString(dateString?: string): string {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return "";

  const date = new Date(`${dateString}T00:00:00Z`);
  return isNaN(date.getTime()) ? "" : calendarDateDisplayFormatter.format(date);
}
