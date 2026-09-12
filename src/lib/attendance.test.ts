import { describe, expect, it } from "vitest";
import {
  addUtcDays,
  buildAttendanceLog,
  hoursInRangeMs,
  isStaleOpenSession,
  overlapMs,
  resolveAttendanceRange,
  STALE_WORK_MS,
  sessionDurationMs,
  startOfUtcWeek,
  utcDateKey,
} from "@/lib/attendance";

describe("attendance dates", () => {
  it("starts weeks on Monday in UTC", () => {
    expect(
      utcDateKey(startOfUtcWeek(new Date("2026-09-09T15:00:00.000Z"))),
    ).toBe("2026-09-07");
    expect(
      utcDateKey(startOfUtcWeek(new Date("2026-09-13T08:00:00.000Z"))),
    ).toBe("2026-09-07");
  });

  it("swaps inverted range params", () => {
    const range = resolveAttendanceRange(
      "2026-09-12",
      "2026-09-07",
      new Date("2026-09-12T12:00:00.000Z"),
    );
    expect(range.fromKey).toBe("2026-09-07");
    expect(range.toKey).toBe("2026-09-12");
  });
});

describe("attendance totals", () => {
  it("marks overlapping days as work and splits duration across midnight", () => {
    const now = new Date("2026-09-09T12:00:00.000Z");
    const log = buildAttendanceLog({
      sessions: [
        {
          id: "s1",
          startedAt: new Date("2026-09-07T22:00:00.000Z"),
          endedAt: new Date("2026-09-08T02:00:00.000Z"),
        },
      ],
      from: new Date("2026-09-07T00:00:00.000Z"),
      to: new Date("2026-09-10T00:00:00.000Z"),
      now,
    });

    expect(log.days).toHaveLength(3);
    expect(log.days[0]?.hasWork).toBe(true);
    expect(log.days[1]?.hasWork).toBe(true);
    expect(log.days[2]?.hasWork).toBe(false);
    expect(log.days[0]?.durationMs).toBe(2 * 60 * 60 * 1000);
    expect(log.days[1]?.durationMs).toBe(2 * 60 * 60 * 1000);
    expect(log.totalMs).toBe(4 * 60 * 60 * 1000);
    expect(log.daysWithWork).toBe(2);
    expect(log.daysWithoutWork).toBe(1);
  });

  it("counts open sessions until now and flags stale shifts", () => {
    const startedAt = new Date("2026-09-07T08:00:00.000Z");
    const now = new Date(startedAt.getTime() + STALE_WORK_MS);
    expect(isStaleOpenSession({ startedAt, endedAt: null }, now)).toBe(true);
    expect(sessionDurationMs({ startedAt, endedAt: null }, now)).toBe(
      STALE_WORK_MS,
    );
  });

  it("counts only overlapping hours in a range", () => {
    const startedAt = new Date("2026-09-07T22:00:00.000Z");
    const endedAt = new Date("2026-09-08T02:00:00.000Z");
    const sessions = [
      {
        id: "s1",
        startedAt,
        endedAt,
      },
    ];
    const from = new Date("2026-09-08T00:00:00.000Z");
    const to = addUtcDays(from, 1);
    expect(hoursInRangeMs(sessions, from, to)).toBe(2 * 60 * 60 * 1000);
    expect(overlapMs(startedAt, endedAt, from, to)).toBe(2 * 60 * 60 * 1000);
  });
});
