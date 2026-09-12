"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CloseSessionButton } from "@/components/attendance/close-session-button";
import { WorkStatusBadge } from "@/components/attendance/work-status-badge";
import { Input } from "@/components/ui/input";
import type { TeamRosterPerson } from "@/lib/api-types";
import { formatDuration, formatPunchTimes } from "@/lib/format";
import { getPrimaryRoleLabel } from "@/lib/roles";

export function RosterList({
  people,
  mode,
}: {
  people: TeamRosterPerson[];
  mode: "dashboard" | "attendance";
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return people;
    }

    return people.filter((person) => {
      const haystack = [
        person.name,
        person.email,
        getPrimaryRoleLabel(person.role),
        ...person.teamNames,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [people, query]);

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, email, or team"
        aria-label="Search team members"
      />
      {filtered.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          {people.length === 0
            ? "No team members to show yet."
            : "No people match that search."}
        </p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {filtered.map((person) => (
              <li
                key={person.userId}
                className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
              >
                <RosterPersonCard person={person} mode={mode} />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">
                    {mode === "dashboard" ? "Hours today" : "This week"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {mode === "dashboard" ? "Punch" : "Last punch"}
                  </th>
                  <th className="px-4 py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person) => (
                  <tr
                    key={person.userId}
                    className="border-b last:border-0 even:bg-muted/20 transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getPrimaryRoleLabel(person.role)}
                        {person.teamNames.length
                          ? ` · ${person.teamNames.join(", ")}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <WorkStatusBadge
                        isWorking={person.isWorking}
                        isStale={person.isStale}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {mode === "dashboard"
                        ? formatDuration(person.hoursTodayMs)
                        : `${formatDuration(person.hoursThisWeekMs)} · ${person.daysWithWorkThisWeek} days with work`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <PunchTimesLines person={person} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {person.isWorking ? (
                          <CloseSessionButton
                            userId={person.userId}
                            name={person.name}
                          />
                        ) : null}
                        <Link
                          href={`/attendance/${person.userId}`}
                          className="text-sm text-primary transition-colors hover:underline"
                        >
                          View log
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function RosterPersonCard({
  person,
  mode,
}: {
  person: TeamRosterPerson;
  mode: "dashboard" | "attendance";
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{person.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {getPrimaryRoleLabel(person.role)}
            {person.teamNames.length ? ` · ${person.teamNames.join(", ")}` : ""}
          </p>
        </div>
        <WorkStatusBadge
          isWorking={person.isWorking}
          isStale={person.isStale}
        />
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        <PunchTimesLines person={person} />
        <p>
          {mode === "dashboard"
            ? `${formatDuration(person.hoursTodayMs)} today`
            : `${formatDuration(person.hoursThisWeekMs)} this week · ${person.daysWithWorkThisWeek} days with work`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {person.isWorking ? (
          <CloseSessionButton userId={person.userId} name={person.name} />
        ) : null}
        <Link
          href={`/attendance/${person.userId}`}
          className="text-sm font-medium text-primary transition-colors hover:underline"
        >
          View log
        </Link>
      </div>
    </div>
  );
}

function PunchTimesLines({ person }: { person: TeamRosterPerson }) {
  const { lines } = formatPunchTimes(person);

  return (
    <span className="flex flex-col gap-0.5">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </span>
  );
}
