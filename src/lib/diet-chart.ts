import { z } from "zod";

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const DEFAULT_MEAL_NAMES = ["Breakfast", "Lunch", "Dinner"] as const;

export const dietMealSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  content: z.string().max(8000),
  recipeUrl: z.string().max(2000),
  sortOrder: z.number().int().nonnegative(),
});

export const dietDaySchema = z.object({
  meals: z.array(dietMealSchema).max(20),
});

export const dietDaysSchema = z.object({
  monday: dietDaySchema,
  tuesday: dietDaySchema,
  wednesday: dietDaySchema,
  thursday: dietDaySchema,
  friday: dietDaySchema,
  saturday: dietDaySchema,
  sunday: dietDaySchema,
});

export type DietMeal = z.infer<typeof dietMealSchema>;
export type DietDay = z.infer<typeof dietDaySchema>;
export type DietDays = z.infer<typeof dietDaysSchema>;

export function createId() {
  return crypto.randomUUID();
}

export function createMeal(
  name: string,
  sortOrder: number,
  extras?: Partial<Pick<DietMeal, "content" | "recipeUrl" | "id">>,
): DietMeal {
  return {
    id: extras?.id ?? createId(),
    name,
    content: extras?.content ?? "",
    recipeUrl: extras?.recipeUrl ?? "",
    sortOrder,
  };
}

export function createDefaultDay(): DietDay {
  return {
    meals: DEFAULT_MEAL_NAMES.map((name, index) => createMeal(name, index)),
  };
}

export function createDefaultDays(): DietDays {
  return {
    monday: createDefaultDay(),
    tuesday: createDefaultDay(),
    wednesday: createDefaultDay(),
    thursday: createDefaultDay(),
    friday: createDefaultDay(),
    saturday: createDefaultDay(),
    sunday: createDefaultDay(),
  };
}

export function cloneDay(day: DietDay): DietDay {
  return {
    meals: day.meals.map((meal, index) =>
      createMeal(meal.name, index, {
        content: meal.content,
        recipeUrl: meal.recipeUrl,
      }),
    ),
  };
}

export function cloneDays(days: DietDays): DietDays {
  return {
    monday: cloneDay(days.monday),
    tuesday: cloneDay(days.tuesday),
    wednesday: cloneDay(days.wednesday),
    thursday: cloneDay(days.thursday),
    friday: cloneDay(days.friday),
    saturday: cloneDay(days.saturday),
    sunday: cloneDay(days.sunday),
  };
}

export function parseDaysJson(value: string): DietDays {
  const parsed = dietDaysSchema.parse(JSON.parse(value));
  return parsed;
}

export function stringifyDays(days: DietDays) {
  return JSON.stringify(days);
}

export function normalizeMealOrder(meals: DietMeal[]) {
  return meals.map((meal, index) => ({ ...meal, sortOrder: index }));
}

export function normalizeDays(days: DietDays): DietDays {
  return {
    monday: { meals: normalizeMealOrder(days.monday.meals) },
    tuesday: { meals: normalizeMealOrder(days.tuesday.meals) },
    wednesday: { meals: normalizeMealOrder(days.wednesday.meals) },
    thursday: { meals: normalizeMealOrder(days.thursday.meals) },
    friday: { meals: normalizeMealOrder(days.friday.meals) },
    saturday: { meals: normalizeMealOrder(days.saturday.meals) },
    sunday: { meals: normalizeMealOrder(days.sunday.meals) },
  };
}

export function collectRecipeUrls(days: DietDays) {
  return WEEKDAYS.flatMap((weekday) =>
    days[weekday].meals
      .map((meal) => meal.recipeUrl.trim())
      .filter((url) => isHttpUrl(url)),
  );
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
