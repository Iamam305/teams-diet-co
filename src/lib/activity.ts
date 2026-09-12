export const ACTIVITY_TYPES = [
  "login",
  "logout",
  "work_start",
  "work_end",
  "chart_create",
  "chart_update",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  login: "Signed in",
  logout: "Signed out",
  work_start: "Started work",
  work_end: "Ended work",
  chart_create: "Created diet chart",
  chart_update: "Edited diet chart",
};

export function isActivityType(value: string): value is ActivityType {
  return ACTIVITY_TYPES.includes(value as ActivityType);
}

export function activityTypeLabel(value: string) {
  return isActivityType(value) ? ACTIVITY_TYPE_LABELS[value] : value;
}
