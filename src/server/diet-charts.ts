import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { dietChart, user } from "@/db/schema";
import { canViewDietChart } from "@/lib/diet-access";
import {
  createId,
  type DietDays,
  dietDaysSchema,
  parseDaysJson,
  stringifyDays,
} from "@/lib/diet-chart";
import { isMainAdmin, isTeamAdmin } from "@/lib/roles";
import { dietChartMetaSchema } from "@/lib/validations";
import { listTeamIdsForUsers, recordActivityEvent } from "@/server/activity";
import { ApiError } from "@/server/api-error";
import { requireApiOrganization } from "@/server/auth";
import { listTeamIdsForUser } from "@/server/org-hooks";

const createdByUser = alias(user, "created_by_user");
const updatedByUser = alias(user, "updated_by_user");

export type DietChartListItem = {
  id: string;
  title: string;
  clientName: string | null;
  teamId: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdByName: string;
  updatedByName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DietChartRecord = {
  id: string;
  organizationId: string;
  teamId: string | null;
  title: string;
  clientName: string | null;
  notes: string | null;
  startDate: string | null;
  endDate: string | null;
  days: DietDays;
  createdByUserId: string;
  updatedByUserId: string;
  createdByName: string;
  updatedByName: string;
  createdAt: Date;
  updatedAt: Date;
};

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function getChartAccessContext() {
  const context = await requireApiOrganization();
  const memberTeamIds = await listTeamIdsForUser(
    context.session.user.id,
    context.organization.id,
  );

  return { ...context, memberTeamIds };
}

export async function listDietCharts(): Promise<DietChartListItem[]> {
  const { session, member, organization, memberTeamIds } =
    await getChartAccessContext();

  const rows = await db
    .select({
      id: dietChart.id,
      title: dietChart.title,
      clientName: dietChart.clientName,
      teamId: dietChart.teamId,
      createdByUserId: dietChart.createdByUserId,
      updatedByUserId: dietChart.updatedByUserId,
      createdByName: createdByUser.name,
      updatedByName: updatedByUser.name,
      createdAt: dietChart.createdAt,
      updatedAt: dietChart.updatedAt,
    })
    .from(dietChart)
    .innerJoin(createdByUser, eq(createdByUser.id, dietChart.createdByUserId))
    .innerJoin(updatedByUser, eq(updatedByUser.id, dietChart.updatedByUserId))
    .where(eq(dietChart.organizationId, organization.id))
    .orderBy(desc(dietChart.updatedAt));

  if (isMainAdmin(member.role)) {
    return rows;
  }

  if (isTeamAdmin(member.role)) {
    const creatorTeams = await listTeamIdsForUsers(
      rows.map((row) => row.createdByUserId),
      organization.id,
    );

    return rows.filter((row) =>
      canViewDietChart({
        role: member.role,
        userId: session.user.id,
        createdByUserId: row.createdByUserId,
        teamId: row.teamId,
        memberTeamIds,
        creatorTeamIds: creatorTeams.get(row.createdByUserId),
      }),
    );
  }

  return rows.filter((row) => row.createdByUserId === session.user.id);
}

export async function getDietChart(
  id: string,
): Promise<DietChartRecord | null> {
  const { session, member, organization, memberTeamIds } =
    await getChartAccessContext();

  const [row] = await db
    .select({
      id: dietChart.id,
      organizationId: dietChart.organizationId,
      teamId: dietChart.teamId,
      title: dietChart.title,
      clientName: dietChart.clientName,
      notes: dietChart.notes,
      startDate: dietChart.startDate,
      endDate: dietChart.endDate,
      daysJson: dietChart.daysJson,
      createdByUserId: dietChart.createdByUserId,
      updatedByUserId: dietChart.updatedByUserId,
      createdByName: createdByUser.name,
      updatedByName: updatedByUser.name,
      createdAt: dietChart.createdAt,
      updatedAt: dietChart.updatedAt,
    })
    .from(dietChart)
    .innerJoin(createdByUser, eq(createdByUser.id, dietChart.createdByUserId))
    .innerJoin(updatedByUser, eq(updatedByUser.id, dietChart.updatedByUserId))
    .where(
      and(eq(dietChart.id, id), eq(dietChart.organizationId, organization.id)),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const creatorTeams = await listTeamIdsForUsers(
    [row.createdByUserId],
    organization.id,
  );

  if (
    !canViewDietChart({
      role: member.role,
      userId: session.user.id,
      createdByUserId: row.createdByUserId,
      teamId: row.teamId,
      memberTeamIds,
      creatorTeamIds: creatorTeams.get(row.createdByUserId),
    })
  ) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organizationId,
    teamId: row.teamId,
    title: row.title,
    clientName: row.clientName,
    notes: row.notes,
    startDate: row.startDate,
    endDate: row.endDate,
    days: parseDaysJson(row.daysJson),
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    createdByName: row.createdByName,
    updatedByName: row.updatedByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createDietChartAction(input: {
  title: string;
  clientName?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  days: DietDays;
}) {
  const { session, organization, memberTeamIds } =
    await getChartAccessContext();
  const now = new Date();
  const id = createId();
  const meta = dietChartMetaSchema.parse({
    title: input.title.trim(),
    clientName: input.clientName?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    startDate: input.startDate?.trim() || undefined,
    endDate: input.endDate?.trim() || undefined,
  });
  const days = dietDaysSchema.parse(input.days);
  const activeTeamId = (session.session as { activeTeamId?: string | null })
    .activeTeamId;
  const teamId =
    activeTeamId && memberTeamIds.includes(activeTeamId)
      ? activeTeamId
      : (memberTeamIds[0] ?? null);

  await db.insert(dietChart).values({
    id,
    organizationId: organization.id,
    teamId,
    title: meta.title,
    clientName: meta.clientName ?? null,
    notes: meta.notes ?? null,
    startDate: emptyToNull(meta.startDate),
    endDate: emptyToNull(meta.endDate),
    daysJson: stringifyDays(days),
    createdByUserId: session.user.id,
    updatedByUserId: session.user.id,
    createdAt: now,
    updatedAt: now,
  });

  await recordActivityEvent({
    organizationId: organization.id,
    userId: session.user.id,
    type: "chart_create",
    entityType: "diet_chart",
    entityId: id,
    metadata: { title: meta.title },
  });

  return { id };
}

export async function updateDietChartAction(input: {
  id: string;
  title: string;
  clientName?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  days: DietDays;
}) {
  const chart = await getDietChart(input.id);

  if (!chart) {
    throw new ApiError(404, "Diet chart not found.", "NOT_FOUND");
  }

  const meta = dietChartMetaSchema.parse({
    title: input.title.trim(),
    clientName: input.clientName?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    startDate: input.startDate?.trim() || undefined,
    endDate: input.endDate?.trim() || undefined,
  });
  const days = dietDaysSchema.parse(input.days);
  const { session, organization } = await requireApiOrganization();
  const now = new Date();

  await db
    .update(dietChart)
    .set({
      title: meta.title,
      clientName: meta.clientName ?? null,
      notes: meta.notes ?? null,
      startDate: emptyToNull(meta.startDate),
      endDate: emptyToNull(meta.endDate),
      daysJson: stringifyDays(days),
      updatedByUserId: session.user.id,
      updatedAt: now,
    })
    .where(eq(dietChart.id, input.id));

  await recordActivityEvent({
    organizationId: organization.id,
    userId: session.user.id,
    type: "chart_update",
    entityType: "diet_chart",
    entityId: input.id,
    metadata: { title: meta.title },
  });

  return { updatedAt: now.toISOString() };
}

export async function listRecentDietCharts(limit = 6) {
  const charts = await listDietCharts();
  return charts.slice(0, limit);
}
