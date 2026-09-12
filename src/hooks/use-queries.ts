"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { queryKeys } from "@/hooks/query-keys";
import { api, isApiRequestError } from "@/lib/api";
import type {
  ActivityRow,
  DietChartListItem,
  DietChartRecord,
  MemberAttendance,
  MeResponse,
  PendingInvitation,
  PublicInvitationResponse,
  SettingsInvitationsResponse,
  SettingsMembersResponse,
  SettingsOrganizationResponse,
  SettingsTeamsResponse,
  TeamRosterPerson,
} from "@/lib/api-types";
import { canViewTeamActivity, homePathForRole } from "@/lib/diet-access";
import { canAccessSettings, type SettingsArea } from "@/lib/roles";

function retryUnlessAuth(failureCount: number, error: Error) {
  if (isApiRequestError(error) && error.status < 500) {
    return false;
  }

  return failureCount < 2;
}

const liveQueryOptions = {
  staleTime: 10_000,
  refetchOnWindowFocus: true,
  retry: retryUnlessAuth,
};

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api<MeResponse>("/api/me"),
    ...liveQueryOptions,
  });
}

export function useAuthGate() {
  const router = useRouter();
  const query = useMeQuery();

  useEffect(() => {
    if (!query.error || !isApiRequestError(query.error)) {
      return;
    }

    if (query.error.status === 401 || query.error.code === "UNAUTHENTICATED") {
      router.replace("/login");
      return;
    }

    if (query.error.code === "EMAIL_UNVERIFIED") {
      router.replace("/verify-email");
      return;
    }

    if (query.error.code === "PASSWORD_CHANGE_REQUIRED") {
      router.replace("/change-password");
      return;
    }

    if (query.error.code === "NO_ORGANIZATION") {
      router.replace("/onboarding");
    }
  }, [query.error, router]);

  return query;
}

export function useRequireTeamActivity() {
  const me = useMeQuery();
  const router = useRouter();

  useEffect(() => {
    if (me.data && !canViewTeamActivity(me.data.role)) {
      router.replace(homePathForRole(me.data.role));
    }
  }, [me.data, router]);

  return me;
}

export function useRequireSettings(area: SettingsArea) {
  const me = useMeQuery();
  const router = useRouter();

  useEffect(() => {
    if (me.data && !canAccessSettings(me.data.role, area)) {
      router.replace(homePathForRole(me.data.role));
    }
  }, [area, me.data, router]);

  return me;
}

export function useRosterQuery() {
  return useQuery({
    queryKey: queryKeys.roster,
    queryFn: async () => {
      const data = await api<{ people: TeamRosterPerson[] }>("/api/roster");
      return data.people;
    },
    ...liveQueryOptions,
  });
}

export function useAttendanceQuery(
  userId: string,
  from?: string | null,
  to?: string | null,
) {
  return useQuery({
    queryKey: queryKeys.attendance(userId, from, to),
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) {
        params.set("from", from);
      }
      if (to) {
        params.set("to", to);
      }
      const query = params.toString();
      return api<MemberAttendance>(
        `/api/attendance/${userId}${query ? `?${query}` : ""}`,
      );
    },
    retry: retryUnlessAuth,
  });
}

export function useDietChartsQuery() {
  return useQuery({
    queryKey: queryKeys.dietCharts,
    queryFn: async () => {
      const data = await api<{ charts: DietChartListItem[] }>(
        "/api/diet-charts",
      );
      return data.charts;
    },
    retry: retryUnlessAuth,
  });
}

export function useDietChartQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.dietChart(id),
    queryFn: async () => {
      const data = await api<{ chart: DietChartRecord }>(
        `/api/diet-charts/${id}`,
      );
      return data.chart;
    },
    retry: retryUnlessAuth,
  });
}

export function useActivityQuery(limit = 100) {
  return useQuery({
    queryKey: queryKeys.activity(limit),
    queryFn: async () => {
      const data = await api<{ rows: ActivityRow[] }>(
        `/api/activity?limit=${limit}`,
      );
      return data.rows;
    },
    retry: retryUnlessAuth,
  });
}

export function useSettingsMembersQuery() {
  return useQuery({
    queryKey: queryKeys.settingsMembers,
    queryFn: () => api<SettingsMembersResponse>("/api/settings/members"),
    retry: retryUnlessAuth,
  });
}

export function useSettingsTeamsQuery() {
  return useQuery({
    queryKey: queryKeys.settingsTeams,
    queryFn: () => api<SettingsTeamsResponse>("/api/settings/teams"),
    retry: retryUnlessAuth,
  });
}

export function useSettingsInvitationsQuery() {
  return useQuery({
    queryKey: queryKeys.settingsInvitations,
    queryFn: () =>
      api<SettingsInvitationsResponse>("/api/settings/invitations"),
    retry: retryUnlessAuth,
  });
}

export function useSettingsOrganizationQuery() {
  return useQuery({
    queryKey: queryKeys.settingsOrganization,
    queryFn: () =>
      api<SettingsOrganizationResponse>("/api/settings/organization"),
    retry: retryUnlessAuth,
  });
}

export function useMyInvitationsQuery() {
  return useQuery({
    queryKey: queryKeys.myInvitations,
    queryFn: async () => {
      const data = await api<{ invitations: PendingInvitation[] }>(
        "/api/invitations/mine",
      );
      return data.invitations;
    },
    retry: retryUnlessAuth,
  });
}

export function usePublicInvitationQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.publicInvitation(id),
    queryFn: () =>
      api<PublicInvitationResponse>(`/api/invitations/public/${id}`),
    retry: retryUnlessAuth,
  });
}
