import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activityEvent, member, team, teamMember } from "@/db/schema";
import type { ActivityType } from "@/lib/activity";
import { createId } from "@/lib/diet-chart";

export async function resolveOrganizationId(
  userId: string,
  activeOrganizationId?: string | null,
) {
  if (activeOrganizationId) {
    return activeOrganizationId;
  }

  const [row] = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1);

  return row?.organizationId ?? null;
}

export async function recordActivityEvent(input: {
  organizationId: string;
  userId: string;
  type: ActivityType;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await db.insert(activityEvent).values({
    id: createId(),
    organizationId: input.organizationId,
    userId: input.userId,
    type: input.type,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: new Date(),
  });
}

export async function recordUserActivity(input: {
  userId: string;
  activeOrganizationId?: string | null;
  type: ActivityType;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const organizationId = await resolveOrganizationId(
    input.userId,
    input.activeOrganizationId,
  );

  if (!organizationId) {
    return;
  }

  await recordActivityEvent({
    organizationId,
    userId: input.userId,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  });
}

export async function listUserIdsOnTeams(teamIds: string[]) {
  if (teamIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({ userId: teamMember.userId })
    .from(teamMember)
    .where(inArray(teamMember.teamId, teamIds));

  return Array.from(new Set(rows.map((row) => row.userId)));
}

export async function listTeamIdsForUsers(
  userIds: string[],
  organizationId: string,
) {
  if (userIds.length === 0) {
    return new Map<string, string[]>();
  }

  const rows = await db
    .select({
      userId: teamMember.userId,
      teamId: teamMember.teamId,
    })
    .from(teamMember)
    .innerJoin(team, eq(team.id, teamMember.teamId))
    .where(
      and(
        eq(team.organizationId, organizationId),
        inArray(teamMember.userId, userIds),
      ),
    );

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const current = map.get(row.userId) ?? [];
    current.push(row.teamId);
    map.set(row.userId, current);
  }
  return map;
}
