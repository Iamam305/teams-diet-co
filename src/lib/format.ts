export function formatIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export function formatDateRange(
  startDate?: string | null,
  endDate?: string | null,
) {
  const start = startDate?.trim();
  const end = endDate?.trim();

  if (start && end) {
    return `${formatIsoDate(start)} - ${formatIsoDate(end)}`;
  }

  if (start) {
    return `From ${formatIsoDate(start)}`;
  }

  if (end) {
    return `Until ${formatIsoDate(end)}`;
  }

  return "";
}

export function formatDateTime(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
