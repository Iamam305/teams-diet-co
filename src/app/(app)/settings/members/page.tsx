import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { MembersManager } from "@/components/org/members-manager";
import { db } from "@/db";
import { teamMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/diet-access";
import { canAccessSettings, isMainAdmin } from "@/lib/roles";
import { requireOrganization } from "@/server/auth";

export default async function MembersSettingsPage() {
  const { organization, member, session } = await requireOrganization();

  if (!canAccessSettings(member.role, "members")) {
    redirect(homePathForRole(member.role));
  }

  const teamMemberships = await db.select().from(teamMember);
  const userTeams = isMainAdmin(member.role)
    ? (organization.teams ?? [])
    : ((await auth.api.listUserTeams({
        headers: await headers(),
      })) ?? []);
  const visibleTeamIds = new Set(userTeams.map((team) => team.id));
  const visibleMembers = isMainAdmin(member.role)
    ? organization.members
    : organization.members.filter((item) =>
        teamMemberships.some(
          (membership) =>
            membership.userId === item.userId &&
            visibleTeamIds.has(membership.teamId),
        ),
      );

  return (
    <div>
      <PageHeader
        title="Members"
        description="Manage roles and team assignments."
      />
      <MembersManager
        actorRole={member.role}
        actorUserId={session.user.id}
        members={visibleMembers.map((item) => ({
          id: item.id,
          userId: item.userId,
          role: item.role,
          user: {
            name: item.user?.name,
            email: item.user?.email,
          },
        }))}
        teams={userTeams}
        teamMembers={teamMemberships.filter((item) =>
          visibleTeamIds.has(item.teamId),
        )}
      />
    </div>
  );
}
