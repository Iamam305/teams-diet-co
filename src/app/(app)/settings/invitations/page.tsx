import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { InvitationsTable } from "@/components/org/invitations-table";
import { InviteDialog } from "@/components/org/invite-dialog";
import { auth } from "@/lib/auth";
import { canAccessSettings, isMainAdmin } from "@/lib/roles";
import { requireOrganization } from "@/server/auth";

export default async function InvitationsSettingsPage() {
  const { organization, member } = await requireOrganization();

  if (!canAccessSettings(member.role, "invitations")) {
    redirect("/dashboard");
  }

  const teams = isMainAdmin(member.role)
    ? (organization.teams ?? [])
    : ((await auth.api.listUserTeams({
        headers: await headers(),
      })) ?? []);

  return (
    <div>
      <PageHeader
        title="Invitations"
        description="Invite people with a role and team. New accounts get a temporary password."
        actions={<InviteDialog teams={teams} actorRole={member.role} />}
      />
      <InvitationsTable invitations={organization.invitations ?? []} />
    </div>
  );
}
