import { headers } from "next/headers";
import { db } from "@/db";
import { teamMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { parseOrgBranding } from "@/lib/org-branding";
import { canAccessSettings, isMainAdmin } from "@/lib/roles";
import { ApiError } from "@/server/api-error";
import { requireApiOrganization } from "@/server/auth";
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

export async function getMePayload() {
  const { session, member, organization } = await requireApiOrganization();
  const workSession = await getActiveWorkSession(session.user.id);
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

  return {
    actorRole: member.role,
    actorUserId: session.user.id,
    members: visibleMembers.map((item) => ({
      id: item.id,
      userId: item.userId,
      role: item.role,
      user: {
        name: item.user?.name,
        email: item.user?.email,
      },
    })),
    teams: userTeams.map((team) => ({ id: team.id, name: team.name })),
    teamMembers: teamMemberships
      .filter((item) => visibleTeamIds.has(item.teamId))
      .map((item) => ({ teamId: item.teamId, userId: item.userId })),
  };
}

export async function getSettingsTeams() {
  const { member, organization } = await requireApiOrganization();
  forbidIfCannotAccess(member.role, "teams");

  const userTeams = isMainAdmin(member.role)
    ? (organization.teams ?? [])
    : ((await auth.api.listUserTeams({
        headers: await headers(),
      })) ?? []);

  return {
    role: member.role,
    teams: userTeams.map((team) => ({ id: team.id, name: team.name })),
  };
}

export async function getSettingsInvitations() {
  const { organization, member } = await requireApiOrganization();
  forbidIfCannotAccess(member.role, "invitations");

  const teams = isMainAdmin(member.role)
    ? (organization.teams ?? [])
    : ((await auth.api.listUserTeams({
        headers: await headers(),
      })) ?? []);

  return {
    actorRole: member.role,
    teams: teams.map((team) => ({ id: team.id, name: team.name })),
    invitations: (organization.invitations ?? []).map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role ?? "member",
      status: invitation.status,
      expiresAt:
        invitation.expiresAt instanceof Date
          ? invitation.expiresAt.toISOString()
          : String(invitation.expiresAt),
    })),
  };
}

export async function getSettingsOrganization() {
  const { organization, member } = await requireApiOrganization();
  forbidIfCannotAccess(member.role, "organization");

  const allowed = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions: { organization: ["update"] } },
  });

  if (!allowed?.success) {
    throw new ApiError(
      403,
      "You do not have permission to do that.",
      "FORBIDDEN",
    );
  }

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
