"use client";

import { useParams } from "next/navigation";
import { DietChartEditor } from "@/components/diet/diet-chart-editor";
import { DietChartEditorSkeleton } from "@/components/skeletons";
import { useDietChartQuery, useMeQuery } from "@/hooks/use-queries";
import { isApiRequestError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export default function DietChartEditorPage() {
  const params = useParams<{ id: string }>();
  const me = useMeQuery();
  const chartQuery = useDietChartQuery(params.id);

  if (me.isPending || chartQuery.isPending || !me.data) {
    return <DietChartEditorSkeleton />;
  }

  if (chartQuery.error || !chartQuery.data) {
    const message =
      isApiRequestError(chartQuery.error) &&
      chartQuery.error.code === "NOT_FOUND"
        ? "This diet chart was not found."
        : "Could not load this diet chart.";

    return (
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="font-medium">{message}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been removed, or you may not have access.
        </p>
      </div>
    );
  }

  const chart = chartQuery.data;

  return (
    <DietChartEditor
      branding={me.data.branding}
      chart={{
        id: chart.id,
        title: chart.title,
        clientName: chart.clientName,
        notes: chart.notes,
        startDate: chart.startDate,
        endDate: chart.endDate,
        extraClientInfo: chart.extraClientInfo,
        footnote: chart.footnote,
        days: chart.days,
        createdByName: chart.createdByName,
        updatedByName: chart.updatedByName,
        updatedAtLabel: formatDateTime(chart.updatedAt),
      }}
    />
  );
}
