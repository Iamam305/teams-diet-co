"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { api } from "@/lib/api";
import type { DietDays } from "@/lib/diet-chart";
import type { OrgRole } from "@/lib/roles";

export function useInvalidateAppQueries() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    void queryClient.invalidateQueries({ queryKey: queryKeys.roster });
    void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    void queryClient.invalidateQueries({ queryKey: ["activity"] });
    void queryClient.invalidateQueries({ queryKey: ["settings"] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dietCharts });
    void queryClient.invalidateQueries({ queryKey: ["diet-chart"] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.myInvitations });
  };
}

type DietChartPayload = {
  title: string;
  clientName?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  days: DietDays;
};

export function useStartWorkMutation() {
  const invalidate = useInvalidateAppQueries();

  return useMutation({
    mutationFn: () =>
      api<{ startedAt: string }>("/api/work/start", { method: "POST" }),
    onSuccess: invalidate,
  });
}

export function useEndWorkMutation() {
  const invalidate = useInvalidateAppQueries();

  return useMutation({
    mutationFn: () => api("/api/work/end", { method: "POST" }),
    onSuccess: invalidate,
  });
}

export function useLogoutWorkMutation() {
  return useMutation({
    mutationFn: () => api("/api/work/logout", { method: "POST" }),
  });
}

export function useCloseWorkMutation() {
  const invalidate = useInvalidateAppQueries();

  return useMutation({
    mutationFn: (userId: string) =>
      api("/api/work/close", {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),
    onSuccess: invalidate,
  });
}

export function useCreateDietChartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DietChartPayload) =>
      api<{ id: string }>("/api/diet-charts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dietCharts });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useUpdateDietChartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: DietChartPayload & { id: string }) =>
      api<{ updatedAt: string }>(`/api/diet-charts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dietCharts });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dietChart(variables.id),
      });
    },
  });
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; role: OrgRole; teamId?: string }) =>
      api<{ invitationId: string; provisioned: boolean }>("/api/invitations", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.settingsInvitations,
      });
    },
  });
}

export function useCancelInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/invitations/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.settingsInvitations,
      });
    },
  });
}

export function useAcceptInvitationMutation() {
  const invalidate = useInvalidateAppQueries();

  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/invitations/${id}/accept`, { method: "POST" }),
    onSuccess: invalidate,
  });
}

export function useRejectInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/invitations/${id}/reject`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myInvitations });
      void queryClient.invalidateQueries({
        queryKey: ["invitations", "public"],
      });
    },
  });
}
