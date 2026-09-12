import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { CreateDietChartButton } from "@/components/diet/create-diet-chart-button";
import { formatDateTime } from "@/lib/format";
import { listDietCharts } from "@/server/diet-charts";

export default async function DietChartsPage() {
  const charts = await listDietCharts();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Diet charts"
        description="Create weekly plans, open existing charts, and continue later."
        actions={<CreateDietChartButton />}
      />

      {charts.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <p className="font-semibold">No diet charts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with a weekly chart. Breakfast, lunch, and dinner are ready on
            every day.
          </p>
          <div className="mt-4">
            <CreateDietChartButton label="Create diet chart" />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-primary text-left text-primary-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Created by</th>
                <th className="px-4 py-3 font-medium">Last edited</th>
              </tr>
            </thead>
            <tbody>
              {charts.map((chart) => (
                <tr
                  key={chart.id}
                  className="border-b last:border-0 even:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/diet-charts/${chart.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {chart.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {chart.clientName || "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {chart.createdByName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {chart.updatedByName} · {formatDateTime(chart.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
