import Link from "next/link";
import { CloseSessionButton } from "@/components/attendance/close-session-button";
import { WorkStatusBadge } from "@/components/attendance/work-status-badge";
import { attendanceRangePresets } from "@/lib/attendance";
import { formatDateTime, formatDuration, formatIsoDate } from "@/lib/format";
import { getPrimaryRoleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { MemberAttendance } from "@/server/work";

export function AttendanceDetail({
  attendance,
}: {
  attendance: MemberAttendance;
}) {
  const presets = attendanceRangePresets();
  const { person, log, fromKey, toKey } = attendance;
  const rangeLinks = [
    { label: "This week", ...presets.thisWeek },
    { label: "Last week", ...presets.lastWeek },
    { label: "This month", ...presets.thisMonth },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-heading text-lg font-semibold">{person.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {person.email}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getPrimaryRoleLabel(person.role)}
              {person.teamNames.length
                ? ` · ${person.teamNames.join(", ")}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkStatusBadge
              isWorking={person.isWorking}
              isStale={person.isStale}
            />
            {person.isWorking ? (
              <CloseSessionButton userId={person.userId} name={person.name} />
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {person.isWorking && person.startedAt
            ? `In since ${formatDateTime(person.startedAt)}`
            : person.lastEndedAt
              ? `Last out ${formatDateTime(person.lastEndedAt)}`
              : "No work sessions recorded yet."}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {rangeLinks.map((item) => {
          const active = item.fromKey === fromKey && item.toKey === toKey;
          return (
            <Link
              key={item.label}
              href={`/attendance/${person.userId}?from=${item.fromKey}&to=${item.toKey}`}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Time in range"
          value={formatDuration(log.totalMs)}
        />
        <SummaryCard label="Days with work" value={String(log.daysWithWork)} />
        <SummaryCard
          label="Days without work"
          value={String(log.daysWithoutWork)}
        />
        <SummaryCard
          label="Avg on work days"
          value={formatDuration(log.averageMsOnWorkDays)}
        />
      </div>

      {log.days.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          No days in this range.
        </p>
      ) : (
        <ul className="space-y-3">
          {log.days.map((day) => (
            <li
              key={day.date}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{formatIsoDate(day.date)}</p>
                  <p className="text-sm text-muted-foreground">
                    {day.hasWork
                      ? `${formatDuration(day.durationMs)} on this day`
                      : "No work"}
                  </p>
                </div>
                <WorkStatusBadge isWorking={day.hasWork} tone="day" />
              </div>
              {day.sessions.length > 0 ? (
                <ul className="mt-3 space-y-2 border-t pt-3">
                  {day.sessions.map((session) => (
                    <li
                      key={`${session.id}-${day.date}`}
                      className="text-sm text-muted-foreground"
                    >
                      <span className="text-foreground">
                        In {formatDateTime(session.startedAt)}
                      </span>
                      {" · "}
                      {session.endedAt
                        ? `Out ${formatDateTime(session.endedAt)}`
                        : "Still open"}
                      {" · "}
                      {formatDuration(session.durationMs)}
                      {session.isStale ? " · long shift" : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
