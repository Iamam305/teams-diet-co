import { describe, expect, it } from "vitest";
import {
  cloneDay,
  cloneDays,
  createDefaultDays,
  createMeal,
  isHttpUrl,
  normalizeDays,
  normalizeMealOrder,
  parseDaysJson,
  stringifyDays,
  WEEKDAYS,
} from "@/lib/diet-chart";

describe("diet chart documents", () => {
  it("creates a week with breakfast lunch and dinner", () => {
    const days = createDefaultDays();

    expect(WEEKDAYS.every((day) => days[day].meals.length === 3)).toBe(true);
    expect(days.monday.meals.map((meal) => meal.name)).toEqual([
      "Breakfast",
      "Lunch",
      "Dinner",
    ]);
  });

  it("clones a day without reusing meal ids", () => {
    const original = createDefaultDays().monday;
    original.meals[0].content = "Oats";
    const cloned = cloneDay(original);

    expect(cloned.meals[0].content).toBe("Oats");
    expect(cloned.meals[0].id).not.toBe(original.meals[0].id);
  });

  it("clones a full week without reusing meal ids", () => {
    const original = createDefaultDays();
    original.friday.meals[1].content = "Salad";
    const cloned = cloneDays(original);

    expect(cloned.friday.meals[1].content).toBe("Salad");
    expect(cloned.friday.meals[1].id).not.toBe(original.friday.meals[1].id);
  });

  it("round-trips days json", () => {
    const days = createDefaultDays();
    expect(parseDaysJson(stringifyDays(days))).toEqual(days);
  });

  it("normalizes meal order and validates http urls", () => {
    const meals = [createMeal("Dinner", 9), createMeal("Breakfast", 2)];
    expect(normalizeMealOrder(meals).map((meal) => meal.sortOrder)).toEqual([
      0, 1,
    ]);
    expect(isHttpUrl("https://example.com/recipe")).toBe(true);
    expect(isHttpUrl("not-a-url")).toBe(false);
  });

  it("normalizes meal sort order across every weekday", () => {
    const days = createDefaultDays();
    days.monday.meals[0].sortOrder = 9;
    expect(normalizeDays(days).monday.meals[0].sortOrder).toBe(0);
  });
});
