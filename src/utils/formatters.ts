const currencyUsdFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyVesFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateDisplayFormatter = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateBackendFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Caracas",
});

export function formatCurrencyUSD(value: number): string {
  return currencyUsdFormatter.format(value);
}

export function formatCurrencyVES(value: number): string {
  return currencyVesFormatter.format(value);
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return dateDisplayFormatter.format(d);
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return dateTimeFormatter.format(d);
}

export function formatDateForBackend(date: Date | string | number): string {
  const d = new Date(date);
  return dateBackendFormatter.format(d);
}

export function formatTime12h(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  if (isNaN(hour)) return time;
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${String(hour12).padStart(2, "0")}:${m} ${ampm}`;
}
