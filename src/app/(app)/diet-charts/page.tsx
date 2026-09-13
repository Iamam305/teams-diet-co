"use client";

import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { CreateDietChartButton } from "@/components/diet/create-diet-chart-button";
import { DietChartsListSkeleton, QueryError } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useCloneDietChartMutation } from "@/hooks/use-mutations";
import { useDietChartsQuery } from "@/hooks/use-queries";
import { isApiRequestError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export default function DietChartsPage() {
  const router = useRouter();
  const chartsQuery = useDietChartsQuery();
  const cloneChart = useCloneDietChartMutation();
  const [cloningId, setCloningId] = useState<string | null>(null);

  async function handleClone(id: string) {
    setCloningId(id);
    try {
      const result = await cloneChart.mutateAsync(id);
      toast.success("Diet chart cloned.");
      router.push(`/diet-charts/${result.id}`);
    } catch (error) {
      toast.error(
        isApiRequestError(error)
          ? error.message
          : "Could not clone diet chart.",
      );
    } finally {
      setCloningId(null);
    }
  }

  if (chartsQuery.isPending) {
    return <DietChartsListSkeleton />;
  }

  if (chartsQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl">
        <QueryError message="Could not load diet charts." />
      </div>
    );
  }

  const charts = chartsQuery.data ?? [];

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
        <>
          <ul className="space-y-3 md:hidden">
            {charts.map((chart) => (
              <li key={chart.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <Link
                  href={`/diet-charts/${chart.id}`}
                  className="block transition-colors hover:text-primary"
                >
                  <p className="font-medium">{chart.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {chart.clientName || "No client name"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {chart.createdByName} · {chart.updatedByName} ·{" "}
                    {formatDateTime(chart.updatedAt)}
                  </p>
                </Link>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={cloningId === chart.id}
                    disabled={cloningId !== null && cloningId !== chart.id}
                    onClick={() => void handleClone(chart.id)}
                  >
                    Clone
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-primary text-left text-primary-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Created by</th>
                  <th className="px-4 py-3 font-medium">Last edited</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {charts.map((chart) => (
                  <tr
                    key={chart.id}
                    className="border-b last:border-0 even:bg-muted/40 transition-colors hover:bg-muted/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/diet-charts/${chart.id}`}
                        className="font-medium transition-colors hover:text-primary hover:underline"
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
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={cloningId === chart.id}
                        disabled={cloningId !== null && cloningId !== chart.id}
                        onClick={() => void handleClone(chart.id)}
                      >
                        Clone
                      </Button>
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
