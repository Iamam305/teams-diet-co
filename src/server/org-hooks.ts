import { APIError } from "better-auth/api";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { member, team, teamMember } from "@/db/schema";
import { canChangeOwnerMembership } from "@/lib/auth-gates";
import { isMainAdmin, isTeamAdmin } from "@/lib/roles";

async function getMemberRole(userId: string, organizationId: string) {
  const [row] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    )
    .limit(1);

  return row?.role ?? null;
}

async function isUserOnTeam(userId: string, teamId: string) {
  const [row] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(and(eq(teamMember.userId, userId), eq(teamMember.teamId, teamId)))
    .limit(1);

  return Boolean(row);
}

export async function listTeamIdsForUser(
  userId: string,
  organizationId: string,
) {
  const rows = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .innerJoin(team, eq(team.id, teamMember.teamId))
    .where(
      and(
        eq(teamMember.userId, userId),
        eq(team.organizationId, organizationId),
      ),
    );

  return rows.map((row) => row.teamId);
}

async function countOwners(organizationId: string) {
  const rows = await db
    .select({ role: member.role })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  return rows.filter((row) => isMainAdmin(row.role)).length;
}

async function assertNotLastOwner({
  organizationId,
  targetRole,
  nextRole,
  action,
}: {
  organizationId: string;
  targetRole: string;
  nextRole?: string;
  action: "remove" | "update-role";
}) {
  const allowed = canChangeOwnerMembership({
    ownerCount: await countOwners(organizationId),
    targetIsOwner: isMainAdmin(targetRole),
    nextRoleIsOwner: nextRole ? isMainAdmin(nextRole) : false,
    action,
  });

  if (!allowed) {
    forbid("The last Main Admin cannot be removed or demoted.");
  }
}

function forbid(message: string): never {
  throw new APIError("FORBIDDEN", { message });
}

async function getActorUserId() {
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    forbid("You must be signed in.");
  }

  return session.user.id;
}

export async function assertCanCreateInvitation({
  userId,
  organizationId,
  teamId,
  role,
}: {
  userId: string;
  organizationId: string;
  teamId?: string;
  role: string;
}) {
  const memberRole = await getMemberRole(userId, organizationId);

  if (isMainAdmin(memberRole)) {
    return;
  }

  if (!isTeamAdmin(memberRole)) {
    forbid("You do not have permission to send invitations.");
  }

  if (!teamId) {
    forbid("Team Admins must invite users to a specific team.");
  }

  if (!(await isUserOnTeam(userId, teamId))) {
    forbid("You can only invite users to teams you belong to.");
  }

  if (role.split(",").some((value) => value.trim() === "owner")) {
    forbid("Team Admins cannot invite Main Admins.");
  }
}

export async function assertCanMutateTeam({
  userId,
  organizationId,
  teamId,
  action,
}: {
  userId: string;
  organizationId: string;
  teamId?: string;
  action: "create" | "update" | "delete";
}) {
  const memberRole = await getMemberRole(userId, organizationId);

  if (isMainAdmin(memberRole)) {
    return;
  }

  if (action === "create" || action === "delete") {
    forbid("Only Main Admins can create or delete teams.");
  }

  if (!isTeamAdmin(memberRole)) {
    forbid("You do not have permission to update this team.");
  }

  if (!teamId || !(await isUserOnTeam(userId, teamId))) {
    forbid("You can only manage teams you belong to.");
  }
}

export async function assertCanMutateTeamMember({
  actorUserId,
  organizationId,
  teamId,
}: {
  actorUserId: string;
  organizationId: string;
  teamId: string;
}) {
  const memberRole = await getMemberRole(actorUserId, organizationId);

  if (isMainAdmin(memberRole)) {
    return;
  }

  if (!isTeamAdmin(memberRole)) {
    forbid("You do not have permission to manage team members.");
  }

  if (!(await isUserOnTeam(actorUserId, teamId))) {
    forbid("You can only manage members of teams you belong to.");
  }
}

export async function assertCanUpdateMemberRole({
  actorUserId,
  organizationId,
  targetRole,
  newRole,
}: {
  actorUserId: string;
  organizationId: string;
  targetRole: string;
  newRole: string;
}) {
  const memberRole = await getMemberRole(actorUserId, organizationId);

  if (isMainAdmin(memberRole)) {
    await assertNotLastOwner({
      organizationId,
      targetRole,
      nextRole: newRole,
      action: "update-role",
    });
    return;
  }

  if (!isTeamAdmin(memberRole)) {
    forbid("You do not have permission to update member roles.");
  }

  if (isMainAdmin(targetRole) || isMainAdmin(newRole)) {
    forbid("Team Admins cannot change Main Admin roles.");
  }
}

export const organizationHooks = {
  beforeCreateInvitation: async ({
    invitation,
    inviter,
    organization,
  }: {
    invitation: {
      email: string;
      role: string;
      organizationId: string;
      teamId?: string;
    };
    inviter: { id: string };
    organization: { id: string };
  }) => {
    await assertCanCreateInvitation({
      userId: inviter.id,
      organizationId: organization.id,
      teamId: invitation.teamId,
      role: invitation.role,
    });
  },
  beforeCreateTeam: async ({
    user,
    organization,
  }: {
    user?: { id: string };
    organization: { id: string };
  }) => {
    if (!user) {
      return;
    }

    await assertCanMutateTeam({
      userId: user.id,
      organizationId: organization.id,
      action: "create",
    });
  },
  beforeUpdateTeam: async ({
    team,
    user,
    organization,
  }: {
    team: { id: string };
    user: { id: string };
    organization: { id: string };
  }) => {
    await assertCanMutateTeam({
      userId: user.id,
      organizationId: organization.id,
      teamId: team.id,
      action: "update",
    });
  },
  beforeDeleteTeam: async ({
    user,
    organization,
  }: {
    user?: { id: string };
    organization: { id: string };
  }) => {
    if (!user) {
      return;
    }

    await assertCanMutateTeam({
      userId: user.id,
      organizationId: organization.id,
      action: "delete",
    });
  },
  beforeAddTeamMember: async ({
    teamMember: incoming,
    organization,
  }: {
    teamMember: { teamId: string; userId: string };
    user: { id: string };
    organization: { id: string };
  }) => {
    await assertCanMutateTeamMember({
      actorUserId: await getActorUserId(),
      organizationId: organization.id,
      teamId: incoming.teamId,
    });
  },
  beforeRemoveTeamMember: async ({
    teamMember: incoming,
    organization,
  }: {
    teamMember: { teamId: string };
    user: { id: string };
    organization: { id: string };
  }) => {
    await assertCanMutateTeamMember({
      actorUserId: await getActorUserId(),
      organizationId: organization.id,
      teamId: incoming.teamId,
    });
  },
  beforeUpdateMemberRole: async ({
    member: target,
    newRole,
    organization,
  }: {
    member: { role: string };
    newRole: string;
    user: { id: string };
    organization: { id: string };
  }) => {
    await assertCanUpdateMemberRole({
      actorUserId: await getActorUserId(),
      organizationId: organization.id,
      targetRole: target.role,
      newRole,
    });
  },
  beforeRemoveMember: async ({
    member: target,
    organization,
  }: {
    member: { role: string };
    organization: { id: string };
  }) => {
    await assertNotLastOwner({
      organizationId: organization.id,
      targetRole: target.role,
      action: "remove",
    });
  },
};
