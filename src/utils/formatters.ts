const currencyUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyVesFormatter = new Intl.NumberFormat("es-VE", {
  style: "decimal",
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
  const formmattedAmount = `${currencyVesFormatter.format(value)} Bs.`;
  return formmattedAmount;
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
  if (!time) return time;

  const hour24 = parseInt(time.slice(0, 2), 10);
  const minute = time.slice(3, 5);

  if (isNaN(hour24) || !minute) return time;

  const ampm = hour24 >= 12 ? "p. m." : "a. m.";
  const hour12 = hour24 % 12 || 12;
  const formattedHour = hour12 < 10 ? `0${hour12}` : hour12;

  return `${formattedHour}:${minute} ${ampm}`;
}
