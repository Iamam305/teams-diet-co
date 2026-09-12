"use server";

import { and, desc, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { team, teamMember, user, workSession } from "@/db/schema";
import {
  buildAttendanceLog,
  hoursInRangeMs,
  isStaleOpenSession,
  overlapMs,
  startOfUtcDay,
  startOfUtcWeek,
  utcDateKey,
} from "@/lib/attendance";
import { canViewTeamActivity, homePathForRole } from "@/lib/diet-access";
import { createId } from "@/lib/diet-chart";
import { isMainAdmin } from "@/lib/roles";
import { listUserIdsOnTeams, recordActivityEvent } from "@/server/activity";
import { requireOrganization } from "@/server/auth";
import { listTeamIdsForUser } from "@/server/org-hooks";

function actionError(message: string) {
  return { ok: false as const, error: message };
}

export type TeamRosterPerson = {
  userId: string;
  name: string;
  email: string;
  role: string;
  teamNames: string[];
  isWorking: boolean;
  startedAt: string | null;
  lastEndedAt: string | null;
  hoursTodayMs: number;
  hoursThisWeekMs: number;
  daysWithWorkThisWeek: number;
  daysWithoutWorkThisWeek: number;
  isStale: boolean;
};

export type MemberAttendance = {
  person: TeamRosterPerson;
  fromKey: string;
  toKey: string;
  log: ReturnType<typeof buildAttendanceLog>;
};

type VisiblePerson = {
  userId: string;
  name: string;
  email: string;
  role: string;
  teamNames: string[];
};

async function getVisiblePeople() {
  const { session, member, organization } = await requireOrganization();

  if (!canViewTeamActivity(member.role)) {
    return {
      allowed: false as const,
      session,
      member,
      organization,
      people: [] as VisiblePerson[],
    };
  }

  const memberships = await db
    .select({
      userId: teamMember.userId,
      teamId: teamMember.teamId,
      teamName: team.name,
    })
    .from(teamMember)
    .innerJoin(team, eq(team.id, teamMember.teamId))
    .where(eq(team.organizationId, organization.id));

  let visibleMembers = organization.members;
  let visibleMemberships = memberships;

  if (!isMainAdmin(member.role)) {
    const memberTeamIds = await listTeamIdsForUser(
      session.user.id,
      organization.id,
    );
    const allowed = new Set(await listUserIdsOnTeams(memberTeamIds));
    allowed.add(session.user.id);
    visibleMembers = organization.members.filter((item) =>
      allowed.has(item.userId),
    );
    visibleMemberships = memberships.filter((item) =>
      memberTeamIds.includes(item.teamId),
    );
  }

  const people = visibleMembers.map((item) => ({
    userId: item.userId,
    name: item.user?.name ?? "User",
    email: item.user?.email ?? "",
    role: item.role,
    teamNames: visibleMemberships
      .filter((membership) => membership.userId === item.userId)
      .map((membership) => membership.teamName),
  }));

  return {
    allowed: true as const,
    session,
    member,
    organization,
    people,
  };
}

async function loadSessionsForUsers({
  organizationId,
  userIds,
  from,
  to,
}: {
  organizationId: string;
  userIds: string[];
  from: Date;
  to: Date;
}) {
  if (userIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: workSession.id,
      userId: workSession.userId,
      startedAt: workSession.startedAt,
      endedAt: workSession.endedAt,
    })
    .from(workSession)
    .where(
      and(
        eq(workSession.organizationId, organizationId),
        inArray(workSession.userId, userIds),
        lt(workSession.startedAt, to),
        or(isNull(workSession.endedAt), gte(workSession.endedAt, from)),
      ),
    )
    .orderBy(desc(workSession.startedAt));
}

function toRosterPerson(
  person: VisiblePerson,
  sessions: {
    id: string;
    userId: string;
    startedAt: Date;
    endedAt: Date | null;
  }[],
  now: Date,
): TeamRosterPerson {
  const userSessions = sessions.filter(
    (session) => session.userId === person.userId,
  );
  const open = userSessions.find((session) => !session.endedAt) ?? null;
  const lastEnded = userSessions.reduce<Date | null>((latest, session) => {
    if (!session.endedAt) {
      return latest;
    }

    if (!latest || session.endedAt.getTime() > latest.getTime()) {
      return session.endedAt;
    }

    return latest;
  }, null);
  const todayStart = startOfUtcDay(now);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekStart = startOfUtcWeek(now);
  const weekLog = buildAttendanceLog({
    sessions: userSessions,
    from: weekStart,
    to: todayEnd,
    now,
  });

  return {
    userId: person.userId,
    name: person.name,
    email: person.email,
    role: person.role,
    teamNames: person.teamNames,
    isWorking: Boolean(open),
    startedAt: open?.startedAt.toISOString() ?? null,
    lastEndedAt: lastEnded ? lastEnded.toISOString() : null,
    hoursTodayMs: hoursInRangeMs(userSessions, todayStart, todayEnd, now),
    hoursThisWeekMs: hoursInRangeMs(userSessions, weekStart, todayEnd, now),
    daysWithWorkThisWeek: weekLog.daysWithWork,
    daysWithoutWorkThisWeek: weekLog.daysWithoutWork,
    isStale: open ? isStaleOpenSession(open, now) : false,
  };
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

async function endOpenWorkSession({
  organizationId,
  userId,
  closedByUserId,
}: {
  organizationId: string;
  userId: string;
  closedByUserId?: string;
}) {
  const [existing] = await db
    .select()
    .from(workSession)
    .where(
      and(
        eq(workSession.organizationId, organizationId),
        eq(workSession.userId, userId),
        isNull(workSession.endedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    return false;
  }

  await db
    .update(workSession)
    .set({ endedAt: new Date() })
    .where(eq(workSession.id, existing.id));

  await recordActivityEvent({
    organizationId,
    userId,
    type: "work_end",
    metadata:
      closedByUserId && closedByUserId !== userId ? { closedByUserId } : null,
  });

  return true;
}

export async function endWorkAction() {
  try {
    const { session, organization } = await requireOrganization();
    await endOpenWorkSession({
      organizationId: organization.id,
      userId: session.user.id,
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

export async function listTeamRoster() {
  const visible = await getVisiblePeople();

  if (!visible.allowed) {
    return [];
  }

  const now = new Date();
  const todayEnd = new Date(startOfUtcDay(now).getTime() + 24 * 60 * 60 * 1000);
  const lookback = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sessions = await loadSessionsForUsers({
    organizationId: visible.organization.id,
    userIds: visible.people.map((person) => person.userId),
    from: lookback,
    to: todayEnd,
  });

  return visible.people
    .map((person) => toRosterPerson(person, sessions, now))
    .sort((a, b) => {
      if (a.isWorking !== b.isWorking) {
        return a.isWorking ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
}

export async function getMemberAttendance({
  userId,
  from,
  to,
}: {
  userId: string;
  from: Date;
  to: Date;
}) {
  const visible = await getVisiblePeople();

  if (!visible.allowed) {
    redirect(homePathForRole(visible.member.role));
  }

  const person = visible.people.find((item) => item.userId === userId);

  if (!person) {
    redirect("/attendance");
  }

  const now = new Date();
  const lookback = new Date(
    Math.min(from.getTime(), now.getTime() - 90 * 24 * 60 * 60 * 1000),
  );
  const rangeEnd = to.getTime() > now.getTime() ? to : now;
  const sessions = await loadSessionsForUsers({
    organizationId: visible.organization.id,
    userIds: [userId],
    from: lookback,
    to: rangeEnd,
  });
  const roster = toRosterPerson(person, sessions, now);
  const rangeSessions = sessions.filter((session) => {
    const end = session.endedAt ?? now;
    return overlapMs(session.startedAt, end, from, to) > 0;
  });

  return {
    person: roster,
    fromKey: utcDateKey(from),
    toKey: utcDateKey(new Date(to.getTime() - 1)),
    log: buildAttendanceLog({
      sessions: rangeSessions,
      from,
      to,
      now,
    }),
  } satisfies MemberAttendance;
}

export async function closeWorkSessionAction(userId: string) {
  try {
    const visible = await getVisiblePeople();

    if (!visible.allowed) {
      return actionError("You do not have permission to do that.");
    }

    if (!visible.people.some((person) => person.userId === userId)) {
      return actionError("You cannot manage that team member.");
    }

    const closed = await endOpenWorkSession({
      organizationId: visible.organization.id,
      userId,
      closedByUserId: visible.session.user.id,
    });

    if (!closed) {
      return { ok: true as const };
    }

    return { ok: true as const };
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Could not close the session.",
    );
  }
}

export async function recordLogoutAction() {
  try {
    const { session, organization } = await requireOrganization();
    await endOpenWorkSession({
      organizationId: organization.id,
      userId: session.user.id,
    });
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
