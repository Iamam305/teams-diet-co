import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ActivityTable } from "@/components/settings/activity-table";
import { homePathForRole } from "@/lib/diet-access";
import { canAccessSettings } from "@/lib/roles";
import { requireOrganization } from "@/server/auth";
import { listActivityEvents } from "@/server/queries";

export default async function ActivitySettingsPage() {
  const { member } = await requireOrganization();

  if (!canAccessSettings(member.role, "activity")) {
    redirect(homePathForRole(member.role));
  }

  const rows = await listActivityEvents();

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Login, work, and diet chart activity for people you can manage."
      />
      <ActivityTable rows={rows} />
    </div>
  );
}
