import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityEvent, user } from "@/db/schema";
import { canViewTeamActivity } from "@/lib/diet-access";
import { isMainAdmin } from "@/lib/roles";
import { listUserIdsOnTeams } from "@/server/activity";
import { requireOrganization } from "@/server/auth";
import { listTeamIdsForUser } from "@/server/org-hooks";

export type ActivityRow = {
  id: string;
  type: string;
  userId: string;
  userName: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

function parseMetadata(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function listActivityEvents(limit = 100): Promise<ActivityRow[]> {
  const { session, member, organization } = await requireOrganization();

  if (!canViewTeamActivity(member.role)) {
    return [];
  }

  const rows = await db
    .select({
      id: activityEvent.id,
      type: activityEvent.type,
      userId: activityEvent.userId,
      userName: user.name,
      entityType: activityEvent.entityType,
      entityId: activityEvent.entityId,
      metadata: activityEvent.metadata,
      createdAt: activityEvent.createdAt,
    })
    .from(activityEvent)
    .innerJoin(user, eq(user.id, activityEvent.userId))
    .where(eq(activityEvent.organizationId, organization.id))
    .orderBy(desc(activityEvent.createdAt))
    .limit(limit);

  const mapped = rows.map((row) => ({
    ...row,
    metadata: parseMetadata(row.metadata),
  }));

  if (isMainAdmin(member.role)) {
    return mapped;
  }

  const memberTeamIds = await listTeamIdsForUser(
    session.user.id,
    organization.id,
  );
  const allowed = new Set(await listUserIdsOnTeams(memberTeamIds));
  allowed.add(session.user.id);
  return mapped.filter((row) => allowed.has(row.userId));
}

export async function listRecentActivity(limit = 8) {
  return listActivityEvents(limit);
}
