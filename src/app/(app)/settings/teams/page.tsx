import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { TeamsManager } from "@/components/org/teams-manager";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/diet-access";
import { canAccessSettings, isMainAdmin } from "@/lib/roles";
import { requireOrganization } from "@/server/auth";

export default async function TeamsSettingsPage() {
  const { member, organization } = await requireOrganization();

  if (!canAccessSettings(member.role, "teams")) {
    redirect(homePathForRole(member.role));
  }

  const userTeams = isMainAdmin(member.role)
    ? (organization.teams ?? [])
    : ((await auth.api.listUserTeams({
        headers: await headers(),
      })) ?? []);

  return (
    <div>
      <PageHeader
        title="Teams"
        description={
          isMainAdmin(member.role)
            ? "Create, rename, and remove teams in this organization."
            : "Rename the teams assigned to you."
        }
      />
      <TeamsManager teams={userTeams} role={member.role} />
    </div>
  );
}
