import { z } from "zod";
import { dietDaysSchema } from "@/lib/diet-chart";

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password is too long");

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or username"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Enter a valid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(
      /^[a-zA-Z0-9._]+$/,
      "Username can only include letters, numbers, dots, and underscores",
    ),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "Choose a different password",
    path: ["newPassword"],
  });

export const organizationSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .max(48, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens"),
});

export const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
});

export const inviteSchema = z.object({
  email: z.email("Enter a valid email"),
  role: z.enum(["owner", "team-admin", "member"]),
  teamId: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(
      /^[a-zA-Z0-9._]+$/,
      "Username can only include letters, numbers, dots, and underscores",
    ),
});

const optionalDateField = z
  .string()
  .max(10)
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Enter a valid date",
  });

function datesAreInOrder(startDate?: string, endDate?: string) {
  const start = startDate?.trim();
  const end = endDate?.trim();
  return !start || !end || end >= start;
}

export const extraClientInfoItemSchema = z.object({
  key: z.string().trim().min(1, "Label is required").max(80),
  value: z.string().max(500),
});

export const extraClientInfoSchema = z
  .array(extraClientInfoItemSchema)
  .max(20);

export type ExtraClientInfoItem = z.infer<typeof extraClientInfoItemSchema>;

/** Form rows may be blank while editing; empty keys are dropped on save. */
export const extraClientInfoFormItemSchema = z.object({
  key: z.string().max(80),
  value: z.string().max(500),
});

export function normalizeExtraClientInfo(
  items: Array<{ key?: string; value?: string }> | undefined | null,
): ExtraClientInfoItem[] {
  if (!items?.length) {
    return [];
  }

  return extraClientInfoSchema.parse(
    items
      .map((item) => ({
        key: item.key?.trim() ?? "",
        value: item.value?.trim() ?? "",
      }))
      .filter((item) => item.key.length > 0),
  );
}

export function parseExtraClientInfoJson(
  value: string | null | undefined,
): ExtraClientInfoItem[] {
  if (!value?.trim()) {
    return [];
  }

  try {
    return normalizeExtraClientInfo(JSON.parse(value) as Array<{ key?: string; value?: string }>);
  } catch {
    return [];
  }
}

export function stringifyExtraClientInfo(items: ExtraClientInfoItem[]) {
  return items.length > 0 ? JSON.stringify(items) : null;
}

export const dietChartMetaSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    clientName: z.string().max(120).optional(),
    notes: z.string().max(4000).optional(),
    startDate: optionalDateField.optional(),
    endDate: optionalDateField.optional(),
    extraClientInfo: extraClientInfoSchema.optional(),
    footnote: z.string().max(2000).optional(),
  })
  .refine((value) => datesAreInOrder(value.startDate, value.endDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const dietChartFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    clientName: z.string().max(120),
    notes: z.string().max(4000),
    startDate: optionalDateField,
    endDate: optionalDateField,
    extraClientInfo: z.array(extraClientInfoFormItemSchema).max(20),
    footnote: z.string().max(2000),
    days: dietDaysSchema,
  })
  .refine((value) => datesAreInOrder(value.startDate, value.endDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type DietChartFormValues = z.input<typeof dietChartFormSchema>;

export function slugFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
