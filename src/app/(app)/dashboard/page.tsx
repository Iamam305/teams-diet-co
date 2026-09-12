"use client";

import { PageHeader } from "@/components/app/page-header";
import { RosterList } from "@/components/attendance/roster-list";
import { DashboardSkeleton, QueryError } from "@/components/skeletons";
import {
  useActivityQuery,
  useRequireTeamActivity,
  useRosterQuery,
} from "@/hooks/use-queries";
import { activityTypeLabel } from "@/lib/activity";
import { formatDateTime } from "@/lib/format";

export default function DashboardPage() {
  const me = useRequireTeamActivity();
  const roster = useRosterQuery();
  const activity = useActivityQuery(8);

  if (me.isPending || roster.isPending || activity.isPending || !me.data) {
    return <DashboardSkeleton />;
  }

  if (roster.isError || activity.isError) {
    return (
      <div className="mx-auto max-w-5xl">
        <QueryError message="Could not load the dashboard." />
      </div>
    );
  }

  const people = roster.data ?? [];
  const rows = activity.data ?? [];
  const workingCount = people.filter((person) => person.isWorking).length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dashboard"
        description={`Live work status for your team. ${me.data.user.name} can see who is punched in right now.`}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Working now" value={String(workingCount)} />
        <SummaryCard
          label="Not working"
          value={String(people.length - workingCount)}
        />
        <SummaryCard label="Team size" value={String(people.length)} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold">Team roster</h2>
        <RosterList people={people} mode="dashboard" />
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">
          Recent activity
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            No recent team activity.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card shadow-sm">
            {rows.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm">
                <p className="font-medium">
                  {item.userName} · {activityTypeLabel(item.type)}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
