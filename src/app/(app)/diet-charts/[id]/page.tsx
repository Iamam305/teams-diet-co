import { notFound } from "next/navigation";
import { DietChartEditor } from "@/components/diet/diet-chart-editor";
import { formatDateTime } from "@/lib/format";
import { parseOrgBranding } from "@/lib/org-branding";
import { requireOrganization } from "@/server/auth";
import { getDietChart } from "@/server/diet-charts";

export default async function DietChartEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ organization }, chart] = await Promise.all([
    requireOrganization(),
    getDietChart(id),
  ]);

  if (!chart) {
    notFound();
  }

  return (
    <DietChartEditor
      branding={parseOrgBranding(organization)}
      chart={{
        id: chart.id,
        title: chart.title,
        clientName: chart.clientName,
        notes: chart.notes,
        startDate: chart.startDate,
        endDate: chart.endDate,
        days: chart.days,
        createdByName: chart.createdByName,
        updatedByName: chart.updatedByName,
        updatedAtLabel: formatDateTime(chart.updatedAt),
      }}
    />
  );
}
