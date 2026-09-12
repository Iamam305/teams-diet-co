import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { CreateDietChartButton } from "@/components/diet/create-diet-chart-button";
import { WorkStatusLabel, WorkToggle } from "@/components/work/work-toggle";
import { activityTypeLabel } from "@/lib/activity";
import { canViewTeamActivity } from "@/lib/diet-access";
import { formatDateTime } from "@/lib/format";
import { getPrimaryRoleLabel } from "@/lib/roles";
import { requireOrganization } from "@/server/auth";
import { listRecentDietCharts } from "@/server/diet-charts";
import { listRecentActivity } from "@/server/queries";
import { listWorkingUsers } from "@/server/work";

export default async function DashboardPage() {
  const { organization, member, session } = await requireOrganization();
  const [charts, workingUsers, activity] = await Promise.all([
    listRecentDietCharts(6),
    canViewTeamActivity(member.role) ? listWorkingUsers() : Promise.resolve([]),
    canViewTeamActivity(member.role)
      ? listRecentActivity(6)
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name}. You are signed into ${organization.name} as ${getPrimaryRoleLabel(member.role)}.`}
        actions={<CreateDietChartButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Work status</p>
          <p className="mt-1 text-lg font-semibold">
            <WorkStatusLabel />
          </p>
          <div className="mt-3">
            <WorkToggle />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Diet charts</p>
          <p className="mt-1 text-2xl font-semibold">{charts.length}</p>
          <Link
            href="/diet-charts"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View all charts
          </Link>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Your role</p>
          <p className="mt-1 text-2xl font-semibold">
            {getPrimaryRoleLabel(member.role)}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Recent diet charts
          </h2>
          <Link
            href="/diet-charts"
            className="text-sm text-primary hover:underline"
          >
            Open library
          </Link>
        </div>
        {charts.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            No diet charts yet. Create one to start a weekly plan.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {charts.map((chart) => (
              <Link
                key={chart.id}
                href={`/diet-charts/${chart.id}`}
                className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/40"
              >
                <p className="font-medium">{chart.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {chart.clientName ? `${chart.clientName} · ` : null}
                  Updated {formatDateTime(chart.updatedAt)} by{" "}
                  {chart.updatedByName}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {canViewTeamActivity(member.role) ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold">
              Currently working
            </h2>
            {workingUsers.length === 0 ? (
              <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                Nobody is marked as working right now.
              </p>
            ) : (
              <ul className="divide-y rounded-xl border bg-card shadow-sm">
                {workingUsers.map((item) => (
                  <li key={item.userId} className="px-4 py-3 text-sm">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">
                      Since {formatDateTime(item.startedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold">
              Recent activity
            </h2>
            {activity.length === 0 ? (
              <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                No recent team activity.
              </p>
            ) : (
              <ul className="divide-y rounded-xl border bg-card shadow-sm">
                {activity.map((item) => (
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
      ) : null}
    </div>
  );
}
