export const queryKeys = {
  me: ["me"] as const,
  roster: ["roster"] as const,
  attendance: (userId: string, from?: string | null, to?: string | null) =>
    ["attendance", userId, from ?? null, to ?? null] as const,
  dietCharts: ["diet-charts"] as const,
  dietChart: (id: string) => ["diet-chart", id] as const,
  activity: (limit?: number) => ["activity", limit ?? 100] as const,
  settingsMembers: ["settings", "members"] as const,
  settingsTeams: ["settings", "teams"] as const,
  settingsInvitations: ["settings", "invitations"] as const,
  settingsOrganization: ["settings", "organization"] as const,
  myInvitations: ["invitations", "mine"] as const,
  publicInvitation: (id: string) => ["invitations", "public", id] as const,
};
