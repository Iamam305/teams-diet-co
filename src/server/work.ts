"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { user, workSession } from "@/db/schema";
import { canViewTeamActivity } from "@/lib/diet-access";
import { createId } from "@/lib/diet-chart";
import { isMainAdmin } from "@/lib/roles";
import { listUserIdsOnTeams, recordActivityEvent } from "@/server/activity";
import { requireOrganization } from "@/server/auth";
import { listTeamIdsForUser } from "@/server/org-hooks";

function actionError(message: string) {
  return { ok: false as const, error: message };
}

export async function getActiveWorkSession(userId?: string) {
  const { session, organization } = await requireOrganization();
  const [row] = await db
    .select()
    .from(workSession)
    .where(
      and(
        eq(workSession.organizationId, organization.id),
        eq(workSession.userId, userId ?? session.user.id),
        isNull(workSession.endedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function startWorkAction() {
  try {
    const { session, organization } = await requireOrganization();
    const existing = await getActiveWorkSession(session.user.id);

    if (existing) {
      return {
        ok: true as const,
        startedAt: existing.startedAt.toISOString(),
      };
    }

    const now = new Date();
    await db.insert(workSession).values({
      id: createId(),
      organizationId: organization.id,
      userId: session.user.id,
      startedAt: now,
      endedAt: null,
    });

    await recordActivityEvent({
      organizationId: organization.id,
      userId: session.user.id,
      type: "work_start",
    });

    return { ok: true as const, startedAt: now.toISOString() };
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Could not start work.",
    );
  }
}

export async function endWorkAction() {
  try {
    const { session, organization } = await requireOrganization();
    const existing = await getActiveWorkSession(session.user.id);

    if (!existing) {
      return { ok: true as const };
    }

    await db
      .update(workSession)
      .set({ endedAt: new Date() })
      .where(eq(workSession.id, existing.id));

    await recordActivityEvent({
      organizationId: organization.id,
      userId: session.user.id,
      type: "work_end",
    });

    return { ok: true as const };
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Could not end work.",
    );
  }
}

export async function listWorkingUsers() {
  const { session, member, organization } = await requireOrganization();

  if (!canViewTeamActivity(member.role)) {
    return [];
  }

  const rows = await db
    .select({
      userId: workSession.userId,
      name: user.name,
      startedAt: workSession.startedAt,
    })
    .from(workSession)
    .innerJoin(user, eq(user.id, workSession.userId))
    .where(
      and(
        eq(workSession.organizationId, organization.id),
        isNull(workSession.endedAt),
      ),
    )
    .orderBy(desc(workSession.startedAt));

  if (isMainAdmin(member.role)) {
    return rows;
  }

  const memberTeamIds = await listTeamIdsForUser(
    session.user.id,
    organization.id,
  );
  const allowed = new Set(await listUserIdsOnTeams(memberTeamIds));
  return rows.filter((row) => allowed.has(row.userId));
}

export async function recordLogoutAction() {
  try {
    const { session, organization } = await requireOrganization();
    await recordActivityEvent({
      organizationId: organization.id,
      userId: session.user.id,
      type: "logout",
    });
    return { ok: true as const };
  } catch {
    return { ok: true as const };
  }
}
