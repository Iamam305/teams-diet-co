import type { DietDays } from "@/lib/diet-chart";
import type { OrgBranding } from "@/lib/org-branding";

export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  };
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    metadata: unknown;
  };
  branding: OrgBranding;
  workStartedAt: string | null;
};

export type TeamRosterPerson = {
  userId: string;
  name: string;
  email: string;
  role: string;
  teamNames: string[];
  isWorking: boolean;
  startedAt: string | null;
  lastStartedAt: string | null;
  lastEndedAt: string | null;
  hoursTodayMs: number;
  hoursThisWeekMs: number;
  daysWithWorkThisWeek: number;
  daysWithoutWorkThisWeek: number;
  isStale: boolean;
};

export type AttendanceDaySession = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
  isOpen: boolean;
  isStale: boolean;
};

export type AttendanceDay = {
  date: string;
  hasWork: boolean;
  durationMs: number;
  sessions: AttendanceDaySession[];
};

export type AttendanceLog = {
  days: AttendanceDay[];
  totalMs: number;
  daysWithWork: number;
  daysWithoutWork: number;
  averageMsOnWorkDays: number;
};

export type MemberAttendance = {
  person: TeamRosterPerson;
  fromKey: string;
  toKey: string;
  log: AttendanceLog;
};

export type DietChartListItem = {
  id: string;
  title: string;
  clientName: string | null;
  teamId: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdByName: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
};

export type ActivityRow = {
  id: string;
  type: string;
  userId: string;
  userName: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type SettingsMember = {
  id: string;
  userId: string;
  role: string;
  user: {
    name?: string | null;
    email?: string | null;
  };
};

export type SettingsTeam = {
  id: string;
  name: string;
};

export type SettingsMembersResponse = {
  actorRole: string;
  actorUserId: string;
  members: SettingsMember[];
  teams: SettingsTeam[];
  teamMembers: { teamId: string; userId: string }[];
};

export type SettingsTeamsResponse = {
  role: string;
  teams: SettingsTeam[];
};

export type SettingsInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
};

export type SettingsInvitationsResponse = {
  actorRole: string;
  teams: SettingsTeam[];
  invitations: SettingsInvitation[];
};

export type SettingsOrganizationResponse = {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    metadata: unknown;
  };
};

export type PendingInvitation = {
  id: string;
  organizationName?: string | null;
  role: string;
  expiresAt: string;
  status: string;
};

export type PublicInvitationResponse = {
  signedIn: boolean;
  invitation:
    | {
        status: "pending";
        id: string;
        organizationName: string;
        role: string;
        expiresAt: string;
      }
    | { status: "expired" | "canceled" | "accepted" | "rejected" | "missing" };
};
