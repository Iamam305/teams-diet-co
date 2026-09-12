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

export const dietChartMetaSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    clientName: z.string().max(120).optional(),
    notes: z.string().max(4000).optional(),
    startDate: optionalDateField.optional(),
    endDate: optionalDateField.optional(),
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
