import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { dietChart, user } from "@/db/schema";
import { canViewDietChart } from "@/lib/diet-access";
import {
  cloneDays,
  createId,
  type DietDays,
  dietDaysSchema,
  parseDaysJson,
  stringifyDays,
} from "@/lib/diet-chart";
import { isMainAdmin, isTeamAdmin } from "@/lib/roles";
import {
  type ExtraClientInfoItem,
  dietChartMetaSchema,
  normalizeExtraClientInfo,
  parseExtraClientInfoJson,
  stringifyExtraClientInfo,
} from "@/lib/validations";
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
  extraClientInfo: ExtraClientInfoItem[];
  footnote: string | null;
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

function copyTitle(title: string) {
  const suffix = " (copy)";
  const maxBase = 120 - suffix.length;
  const base = title.slice(0, Math.max(1, maxBase));
  return `${base}${suffix}`.slice(0, 120);
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
      extraClientInfoJson: dietChart.extraClientInfoJson,
      footnote: dietChart.footnote,
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
    extraClientInfo: parseExtraClientInfoJson(row.extraClientInfoJson),
    footnote: row.footnote,
    days: parseDaysJson(row.daysJson),
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    createdByName: row.createdByName,
    updatedByName: row.updatedByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type DietChartWriteInput = {
  title: string;
  clientName?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  extraClientInfo?: Array<{ key?: string; value?: string }>;
  footnote?: string;
  days: DietDays;
};

function parseWriteMeta(input: DietChartWriteInput) {
  const extraClientInfo = normalizeExtraClientInfo(input.extraClientInfo);
  return dietChartMetaSchema.parse({
    title: input.title.trim(),
    clientName: input.clientName?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    startDate: input.startDate?.trim() || undefined,
    endDate: input.endDate?.trim() || undefined,
    extraClientInfo,
    footnote: input.footnote?.trim() || undefined,
  });
}

export async function createDietChartAction(input: DietChartWriteInput) {
  const { session, organization, memberTeamIds } =
    await getChartAccessContext();
  const now = new Date();
  const id = createId();
  const meta = parseWriteMeta(input);
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
    extraClientInfoJson: stringifyExtraClientInfo(meta.extraClientInfo ?? []),
    footnote: emptyToNull(meta.footnote),
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

export async function updateDietChartAction(
  input: DietChartWriteInput & { id: string },
) {
  const chart = await getDietChart(input.id);

  if (!chart) {
    throw new ApiError(404, "Diet chart not found.", "NOT_FOUND");
  }

  const meta = parseWriteMeta(input);
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
      extraClientInfoJson: stringifyExtraClientInfo(meta.extraClientInfo ?? []),
      footnote: emptyToNull(meta.footnote),
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

export async function cloneDietChartAction(id: string) {
  const source = await getDietChart(id);

  if (!source) {
    throw new ApiError(404, "Diet chart not found.", "NOT_FOUND");
  }

  return createDietChartAction({
    title: copyTitle(source.title),
    clientName: source.clientName ?? undefined,
    notes: source.notes ?? undefined,
    startDate: source.startDate ?? undefined,
    endDate: source.endDate ?? undefined,
    extraClientInfo: source.extraClientInfo,
    footnote: source.footnote ?? undefined,
    days: cloneDays(source.days),
  });
}

export async function listRecentDietCharts(limit = 6) {
  const charts = await listDietCharts();
  return charts.slice(0, limit);
}
