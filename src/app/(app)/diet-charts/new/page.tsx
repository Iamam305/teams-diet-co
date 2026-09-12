"use client";

import { DietChartEditor } from "@/components/diet/diet-chart-editor";
import { DietChartEditorSkeleton } from "@/components/skeletons";
import { useMeQuery } from "@/hooks/use-queries";
import { createDefaultDays } from "@/lib/diet-chart";

export default function NewDietChartPage() {
  const me = useMeQuery();

  if (me.isPending || !me.data) {
    return <DietChartEditorSkeleton />;
  }

  return (
    <DietChartEditor
      mode="create"
      branding={me.data.branding}
      chart={{
        title: "",
        clientName: null,
        notes: null,
        startDate: null,
        endDate: null,
        days: createDefaultDays(),
        createdByName: me.data.user.name,
        updatedByName: me.data.user.name,
        updatedAtLabel: "",
      }}
    />
  );
}
