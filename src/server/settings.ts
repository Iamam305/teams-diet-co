import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  invitation,
  member as memberTable,
  team,
  teamMember,
  user,
} from "@/db/schema";
import { parseOrgBranding } from "@/lib/org-branding";
import { canAccessSettings, isMainAdmin } from "@/lib/roles";
import { ApiError } from "@/server/api-error";
import { requireApiOrganization } from "@/server/auth";
import { listTeamIdsForUser } from "@/server/org-hooks";
import { getActiveWorkSession } from "@/server/work";

function forbidIfCannotAccess(
  role: string,
  area: Parameters<typeof canAccessSettings>[1],
) {
  if (!canAccessSettings(role, area)) {
    throw new ApiError(
      403,
      "You do not have permission to do that.",
      "FORBIDDEN",
    );
  }
}

async function listOrganizationTeams(organizationId: string) {
  return db
    .select({ id: team.id, name: team.name })
    .from(team)
    .where(eq(team.organizationId, organizationId));
}

async function visibleTeamIdsForActor(
  role: string,
  userId: string,
  organizationId: string,
) {
  if (isMainAdmin(role)) {
    const teams = await listOrganizationTeams(organizationId);
    return { teams, visibleTeamIds: new Set(teams.map((item) => item.id)) };
  }

  const memberTeamIds = await listTeamIdsForUser(userId, organizationId);
  const teams = (await listOrganizationTeams(organizationId)).filter((item) =>
    memberTeamIds.includes(item.id),
  );
  return { teams, visibleTeamIds: new Set(memberTeamIds) };
}

export async function getMePayload() {
  const { session, member, organization } = await requireApiOrganization();
  const workSession = await getActiveWorkSession(
    organization.id,
    session.user.id,
  );
  const branding = parseOrgBranding(organization);

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      username: session.user.username ?? null,
    },
    role: member.role,
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      metadata: organization.metadata,
    },
    branding,
    workStartedAt: workSession?.startedAt.toISOString() ?? null,
  };
}

export async function getSettingsMembers() {
  const { organization, member, session } = await requireApiOrganization();
  forbidIfCannotAccess(member.role, "members");

  const { teams, visibleTeamIds } = await visibleTeamIdsForActor(
    member.role,
    session.user.id,
    organization.id,
  );
  const teamMemberships = await db
    .select({
      teamId: teamMember.teamId,
      userId: teamMember.userId,
    })
    .from(teamMember)
    .innerJoin(team, eq(team.id, teamMember.teamId))
    .where(eq(team.organizationId, organization.id));
  const orgMembers = await db
    .select({
      id: memberTable.id,
      userId: memberTable.userId,
      role: memberTable.role,
      name: user.name,
      email: user.email,
    })
    .from(memberTable)
    .innerJoin(user, eq(user.id, memberTable.userId))
    .where(eq(memberTable.organizationId, organization.id));
  const visibleMembers = isMainAdmin(member.role)
    ? orgMembers
    : orgMembers.filter((item) =>
        teamMemberships.some(
          (membership) =>
            membership.userId === item.userId &&
            visibleTeamIds.has(membership.teamId),
        ),
      );

  return {
    actorRole: member.role,
    actorUserId: session.user.id,
    members: visibleMembers.map((item) => ({
      id: item.id,
      userId: item.userId,
      role: item.role,
      user: {
        name: item.name,
        email: item.email,
      },
    })),
    teams,
    teamMembers: teamMemberships
      .filter((item) => visibleTeamIds.has(item.teamId))
      .map((item) => ({ teamId: item.teamId, userId: item.userId })),
  };
}

export async function getSettingsTeams() {
  const { member, organization, session } = await requireApiOrganization();
  forbidIfCannotAccess(member.role, "teams");

  const { teams } = await visibleTeamIdsForActor(
    member.role,
    session.user.id,
    organization.id,
  );

  return {
    role: member.role,
    teams,
  };
}

export async function getSettingsInvitations() {
  const { organization, member, session } = await requireApiOrganization();
  forbidIfCannotAccess(member.role, "invitations");

  const { teams } = await visibleTeamIdsForActor(
    member.role,
    session.user.id,
    organization.id,
  );
  const invitations = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    })
    .from(invitation)
    .where(eq(invitation.organizationId, organization.id));

  return {
    actorRole: member.role,
    teams,
    invitations: invitations.map((item) => ({
      id: item.id,
      email: item.email,
      role: item.role ?? "member",
      status: item.status,
      expiresAt: item.expiresAt.toISOString(),
    })),
  };
}

export async function getSettingsOrganization() {
  const { organization, member } = await requireApiOrganization();
  forbidIfCannotAccess(member.role, "organization");

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      metadata: organization.metadata,
    },
  };
}
