import { describe, expect, it } from "vitest";
import { getProductHistoryRange } from "./product-history-filter";

describe("getProductHistoryRange", () => {
  const today = "2026-08-08";

  it("resolves the preset periods with inclusive Caracas calendar limits", () => {
    expect(getProductHistoryRange("last-30-days", undefined, today)).toEqual({
      startDate: "2026-07-10",
      endDate: "2026-08-08",
      showAll: false,
    });
    expect(getProductHistoryRange("last-90-days", undefined, today)).toEqual({
      startDate: "2026-05-11",
      endDate: "2026-08-08",
      showAll: false,
    });
    expect(getProductHistoryRange("all", undefined, today)).toEqual({
      startDate: undefined,
      endDate: undefined,
      showAll: true,
    });
  });

  it("accepts an inclusive custom range and rejects incomplete, future, and reversed ranges", () => {
    expect(getProductHistoryRange("custom", { startDate: today, endDate: today }, today)).toEqual({
      startDate: today,
      endDate: today,
      showAll: false,
    });
    expect(getProductHistoryRange("custom", { startDate: "2026-08-09", endDate: "2026-08-09" }, today)).toBeNull();
    expect(getProductHistoryRange("custom", { startDate: "2026-08-08", endDate: "2026-08-07" }, today)).toBeNull();
    expect(getProductHistoryRange("custom", { startDate: "2026-08-08" }, today)).toBeNull();
  });
});
