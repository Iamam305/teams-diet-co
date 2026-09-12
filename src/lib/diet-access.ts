import { isMainAdmin, isTeamAdmin } from "@/lib/roles";

export function canViewDietChart({
  role,
  userId,
  createdByUserId,
  teamId,
  memberTeamIds,
  creatorTeamIds,
}: {
  role: string | null | undefined;
  userId: string;
  createdByUserId: string;
  teamId: string | null;
  memberTeamIds: string[];
  creatorTeamIds?: string[];
}) {
  if (isMainAdmin(role)) {
    return true;
  }

  if (createdByUserId === userId) {
    return true;
  }

  if (!isTeamAdmin(role)) {
    return false;
  }

  if (teamId && memberTeamIds.includes(teamId)) {
    return true;
  }

  return Boolean(creatorTeamIds?.some((id) => memberTeamIds.includes(id)));
}

export function canEditDietChart(input: {
  role: string | null | undefined;
  userId: string;
  createdByUserId: string;
  teamId: string | null;
  memberTeamIds: string[];
  creatorTeamIds?: string[];
}) {
  return canViewDietChart(input);
}

export function canViewTeamActivity(role: string | null | undefined) {
  return isMainAdmin(role) || isTeamAdmin(role);
}

export function homePathForRole(role: string | null | undefined) {
  return canViewTeamActivity(role) ? "/dashboard" : "/diet-charts";
}

export function filterVisibleUserIds({
  role,
  userId,
  memberTeamUserIds,
}: {
  role: string | null | undefined;
  userId: string;
  memberTeamUserIds: string[];
}) {
  if (isMainAdmin(role)) {
    return null;
  }

  if (isTeamAdmin(role)) {
    return Array.from(new Set([userId, ...memberTeamUserIds]));
  }

  return [userId];
}
