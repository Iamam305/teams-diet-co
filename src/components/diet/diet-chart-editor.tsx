"use client";

import dynamic from "next/dynamic";
import type { DietChartEditorChart } from "@/components/diet/diet-chart-editor-inner";
import type { OrgBranding } from "@/lib/org-branding";

export type { DietChartEditorChart } from "@/components/diet/diet-chart-editor-inner";

const DietChartEditorInner = dynamic(
  () =>
    import("@/components/diet/diet-chart-editor-inner").then(
      (mod) => mod.DietChartEditorInner,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading editor...</p>
    ),
  },
);

export function DietChartEditor({
  chart,
  branding,
  mode = "edit",
}: {
  chart: DietChartEditorChart;
  branding: OrgBranding;
  mode?: "create" | "edit";
}) {
  return <DietChartEditorInner chart={chart} branding={branding} mode={mode} />;
}
