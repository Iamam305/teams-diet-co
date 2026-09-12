import { DietChartEditor } from "@/components/diet/diet-chart-editor";
import { createDefaultDays } from "@/lib/diet-chart";
import { parseOrgBranding } from "@/lib/org-branding";
import { requireOrganization } from "@/server/auth";

export default async function NewDietChartPage() {
  const { organization, session } = await requireOrganization();

  return (
    <DietChartEditor
      mode="create"
      branding={parseOrgBranding(organization)}
      chart={{
        title: "",
        clientName: null,
        notes: null,
        startDate: null,
        endDate: null,
        days: createDefaultDays(),
        createdByName: session.user.name,
        updatedByName: session.user.name,
        updatedAtLabel: "",
      }}
    />
  );
}
