import { getMovementSignedQuantity } from "@/features/movements/movement-presentation";
import type { InventoryMovement } from "@/types";
import { formatDateForBackend } from "@/utils/formatters";

export const LOW_STOCK_THRESHOLD = 3;

export type StockLevel = "out" | "low" | "ok";

export function getStockLevel(stock: number): StockLevel {
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

function calendarDayNumber(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** Whole calendar days (Caracas time) between a timestamp and today. */
export function getCalendarDaysSince(dateInput: string | null, today: Date = new Date()): number | null {
  const from = formatDateForBackend(dateInput);
  const to = formatDateForBackend(today);
  if (!from || !to) return null;
  return Math.max(0, calendarDayNumber(to) - calendarDayNumber(from));
}

export function formatRelativeDays(days: number): string {
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

export type StockPoint = { time: number; stock: number };

const toTime = (value: string | null) => (value ? new Date(value).getTime() : Number.NaN);

/**
 * Rebuilds the stock level over time from the history events, closing with the current stock
 * so the line always ends at today's value.
 */
export function buildStockSeries(
  events: Pick<InventoryMovement, "type" | "quantity" | "stock_before" | "created_at">[],
  currentStock: number,
  now: number = Date.now(),
): StockPoint[] {
  const points: StockPoint[] = [];
  const ordered = events
    .filter((event) => event.stock_before != null && getMovementSignedQuantity(event) != null)
    .filter((event) => !Number.isNaN(toTime(event.created_at)))
    .sort((a, b) => toTime(a.created_at) - toTime(b.created_at));

  for (const event of ordered) {
    const time = toTime(event.created_at);
    const stockBefore = event.stock_before ?? 0;
    if (points.length === 0) points.push({ time, stock: stockBefore });
    points.push({ time, stock: stockBefore + (getMovementSignedQuantity(event) ?? 0) });
  }

  if (points.length === 0) return points;
  points.push({ time: Math.max(now, points[points.length - 1].time), stock: currentStock });
  return points;
}
