export const STALE_WORK_MS = 12 * 60 * 60 * 1000;

export type AttendanceSession = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
};

export type AttendanceDaySession = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMs: number;
  isOpen: boolean;
  isStale: boolean;
};

export type AttendanceDay = {
  date: string;
  hasWork: boolean;
  durationMs: number;
  sessions: AttendanceDaySession[];
};

export type AttendanceLog = {
  days: AttendanceDay[];
  totalMs: number;
  daysWithWork: number;
  daysWithoutWork: number;
  averageMsOnWorkDays: number;
};

export function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date) {
  return new Date(`${utcDateKey(date)}T00:00:00.000Z`);
}

export function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function startOfUtcWeek(date: Date) {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addUtcDays(day, diff);
}

export function startOfUtcMonth(date: Date) {
  const key = utcDateKey(date);
  return new Date(`${key.slice(0, 7)}-01T00:00:00.000Z`);
}

export function parseDateParam(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function sessionDurationMs(
  session: { startedAt: Date; endedAt: Date | null },
  now = new Date(),
) {
  const end = session.endedAt ?? now;
  return Math.max(0, end.getTime() - session.startedAt.getTime());
}

export function overlapMs(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const from = Math.max(start.getTime(), rangeStart.getTime());
  const to = Math.min(end.getTime(), rangeEnd.getTime());
  return Math.max(0, to - from);
}

export function isStaleOpenSession(
  session: { startedAt: Date; endedAt: Date | null },
  now = new Date(),
) {
  return (
    !session.endedAt &&
    now.getTime() - session.startedAt.getTime() >= STALE_WORK_MS
  );
}

export function defaultAttendanceRange(now = new Date()) {
  return {
    from: startOfUtcWeek(now),
    to: addUtcDays(startOfUtcDay(now), 1),
    fromKey: utcDateKey(startOfUtcWeek(now)),
    toKey: utcDateKey(now),
  };
}

export function resolveAttendanceRange(
  fromParam?: string | null,
  toParam?: string | null,
  now = new Date(),
) {
  const fallback = defaultAttendanceRange(now);
  let from = parseDateParam(fromParam) ?? fallback.from;
  let toInclusive = parseDateParam(toParam) ?? startOfUtcDay(now);

  if (toInclusive.getTime() < from.getTime()) {
    const swapped = from;
    from = toInclusive;
    toInclusive = swapped;
  }

  return {
    from,
    to: addUtcDays(toInclusive, 1),
    fromKey: utcDateKey(from),
    toKey: utcDateKey(toInclusive),
  };
}

export function attendanceRangePresets(now = new Date()) {
  const today = startOfUtcDay(now);
  const thisWeekFrom = startOfUtcWeek(now);
  const lastWeekFrom = addUtcDays(thisWeekFrom, -7);

  return {
    thisWeek: {
      fromKey: utcDateKey(thisWeekFrom),
      toKey: utcDateKey(today),
    },
    lastWeek: {
      fromKey: utcDateKey(lastWeekFrom),
      toKey: utcDateKey(addUtcDays(thisWeekFrom, -1)),
    },
    thisMonth: {
      fromKey: utcDateKey(startOfUtcMonth(now)),
      toKey: utcDateKey(today),
    },
  };
}

export function buildAttendanceLog({
  sessions,
  from,
  to,
  now = new Date(),
}: {
  sessions: AttendanceSession[];
  from: Date;
  to: Date;
  now?: Date;
}): AttendanceLog {
  const days: AttendanceDay[] = [];

  for (
    let cursor = startOfUtcDay(from);
    cursor.getTime() < to.getTime();
    cursor = addUtcDays(cursor, 1)
  ) {
    const next = addUtcDays(cursor, 1);
    const daySessions = sessions
      .filter((session) => {
        const end = session.endedAt ?? now;
        return overlapMs(session.startedAt, end, cursor, next) > 0;
      })
      .map((session) => {
        const end = session.endedAt ?? now;
        return {
          id: session.id,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          durationMs: overlapMs(session.startedAt, end, cursor, next),
          isOpen: !session.endedAt,
          isStale: isStaleOpenSession(session, now),
        };
      })
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

    days.push({
      date: utcDateKey(cursor),
      hasWork: daySessions.length > 0,
      durationMs: daySessions.reduce(
        (sum, session) => sum + session.durationMs,
        0,
      ),
      sessions: daySessions,
    });
  }

  const daysWithWork = days.filter((day) => day.hasWork).length;
  const totalMs = days.reduce((sum, day) => sum + day.durationMs, 0);

  return {
    days,
    totalMs,
    daysWithWork,
    daysWithoutWork: days.length - daysWithWork,
    averageMsOnWorkDays: daysWithWork ? Math.round(totalMs / daysWithWork) : 0,
  };
}

export function hoursInRangeMs(
  sessions: AttendanceSession[],
  rangeStart: Date,
  rangeEnd: Date,
  now = new Date(),
) {
  return sessions.reduce((sum, session) => {
    const end = session.endedAt ?? now;
    return sum + overlapMs(session.startedAt, end, rangeStart, rangeEnd);
  }, 0);
}
