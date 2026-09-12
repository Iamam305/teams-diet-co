import { describe, expect, it } from "vitest";
import { createDefaultDays } from "@/lib/diet-chart";
import {
  dietChartFormSchema,
  dietChartMetaSchema,
  passwordSchema,
  slugFromName,
} from "@/lib/validations";

describe("validations", () => {
  it("rejects short passwords", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("long-enough-pass").success).toBe(true);
  });

  it("builds slugs from names", () => {
    expect(slugFromName("Acme Health Co")).toBe("acme-health-co");
  });

  it("accepts optional diet chart dates and rejects an earlier end date", () => {
    const valid = dietChartMetaSchema.safeParse({
      title: "Weekly plan",
      startDate: "2026-09-14",
      endDate: "2026-09-20",
    });
    expect(valid.success).toBe(true);

    const missingDates = dietChartMetaSchema.safeParse({
      title: "Weekly plan",
    });
    expect(missingDates.success).toBe(true);

    const reversed = dietChartMetaSchema.safeParse({
      title: "Weekly plan",
      startDate: "2026-09-20",
      endDate: "2026-09-14",
    });
    expect(reversed.success).toBe(false);
  });

  it("validates a full diet chart form payload", () => {
    const result = dietChartFormSchema.safeParse({
      title: "Client week",
      clientName: "Ada",
      notes: "",
      startDate: "",
      endDate: "",
      days: createDefaultDays(),
    });
    expect(result.success).toBe(true);
  });
});
