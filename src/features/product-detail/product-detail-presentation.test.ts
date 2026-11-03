import { describe, expect, it } from "vitest";
import { formatProductStagnantDays } from "@/features/inventory/product-stagnation";
import type { InventoryMovement } from "@/types";
import {
  buildStockSeries,
  formatRelativeDays,
  getCalendarDaysSince,
  getStockLevel,
} from "./product-detail-presentation";

type SeriesEvent = Pick<InventoryMovement, "type" | "quantity" | "stock_before" | "created_at">;

describe("product detail presentation", () => {
  it("classifies stock levels", () => {
    expect(getStockLevel(0)).toBe("out");
    expect(getStockLevel(3)).toBe("low");
    expect(getStockLevel(4)).toBe("ok");
  });

  it("counts calendar days in Caracas time", () => {
    const today = new Date("2026-11-03T15:00:00Z"); // 11:00 a. m. in Caracas
    expect(getCalendarDaysSince("2026-11-03T13:10:00Z", today)).toBe(0);
    // 03:30 UTC on the 3rd is still the 2nd in Caracas
    expect(getCalendarDaysSince("2026-11-03T03:30:00Z", today)).toBe(1);
    expect(getCalendarDaysSince("2026-10-24T12:00:00Z", today)).toBe(10);
    expect(getCalendarDaysSince(null, today)).toBeNull();
  });

  it("formats relative days", () => {
    expect(formatRelativeDays(0)).toBe("Hoy");
    expect(formatRelativeDays(1)).toBe("Ayer");
    expect(formatRelativeDays(5)).toBe("Hace 5 días");
  });

  it("never shows negative days without sales", () => {
    expect(formatProductStagnantDays(-1)).toBe("0 días");
    expect(formatProductStagnantDays(1)).toBe("1 día");
    expect(formatProductStagnantDays(null)).toBe("—");
  });

  it("rebuilds the stock line in chronological order and closes on the current stock", () => {
    const events: SeriesEvent[] = [
      { type: "exit", quantity: 2, stock_before: 13, created_at: "2026-11-03T13:10:00Z" },
      { type: "entry", quantity: 14, stock_before: 0, created_at: "2026-10-18T15:00:00Z" },
      { type: "activation", quantity: 0, stock_before: 14, created_at: "2026-10-19T15:00:00Z" },
    ];
    const now = Date.parse("2026-11-03T15:00:00Z");

    expect(buildStockSeries(events, 11, now).map((point) => point.stock)).toEqual([0, 14, 11, 11]);
    expect(buildStockSeries([], 11, now)).toEqual([]);
  });
});
