import { describe, expect, it } from "vitest";
import { addDays, daysInRange, todayISO, weekdayIndex } from "./dates";

describe("dates", () => {
  it("addDays shifts calendar dates", () => {
    expect(addDays("2026-08-25", 1)).toBe("2026-08-26");
    expect(addDays("2026-08-25", -1)).toBe("2026-08-24");
  });

  it("daysInRange is inclusive", () => {
    expect(daysInRange("2026-08-24", "2026-08-26")).toEqual([
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
    ]);
  });

  it("weekdayIndex matches JS getDay", () => {
    expect(weekdayIndex("2026-08-25")).toBe(new Date(2026, 7, 25).getDay());
  });

  it("todayISO returns YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
