import { isMainAdmin, isTeamAdmin } from "@/lib/roles";

export type TeamAccessAction =
  | "read"
  | "update"
  | "delete"
  | "create"
  | "invite";

export function inviteProvisioningPlan(existingUser: { id: string } | null) {
  if (!existingUser) {
    return { provisionAccount: true, rotatePassword: false };
  }

  return { provisionAccount: false, rotatePassword: false };
}

export function invitationDisplayStatus({
  status,
  expiresAt,
  now = new Date(),
}: {
  status: string;
  expiresAt: Date | string | null;
  now?: Date;
}) {
  if (
    status === "pending" &&
    expiresAt &&
    new Date(expiresAt).getTime() < now.getTime()
  ) {
    return "expired";
  }

  return status;
}

export function reInviteDecision({
  previousStatus,
  cancelPendingOnReInvite,
}: {
  previousStatus: string;
  cancelPendingOnReInvite: boolean;
}) {
  if (previousStatus === "pending" && cancelPendingOnReInvite) {
    return { previousStatus: "canceled", issueNew: true };
  }

  return { previousStatus, issueNew: true };
}

export function canChangeOwnerMembership({
  ownerCount,
  targetIsOwner,
  nextRoleIsOwner,
  action,
}: {
  ownerCount: number;
  targetIsOwner: boolean;
  nextRoleIsOwner?: boolean;
  action: "remove" | "update-role";
}) {
  if (!targetIsOwner) {
    return true;
  }

  if (action === "remove") {
    return ownerCount > 1;
  }

  if (action === "update-role" && !nextRoleIsOwner) {
    return ownerCount > 1;
  }

  return true;
}

export function canAccessTeam({
  role,
  teamId,
  memberTeamIds,
  action,
}: {
  role: string | null | undefined;
  teamId?: string;
  memberTeamIds: string[];
  action: TeamAccessAction;
}) {
  if (isMainAdmin(role)) {
    return true;
  }

  if (action === "create" || action === "delete") {
    return false;
  }

  if (!teamId || !memberTeamIds.includes(teamId)) {
    return false;
  }

  if (action === "read") {
    return true;
  }

  return isTeamAdmin(role);
}

export function postAuthDestination({
  emailVerified,
  mustChangePassword,
  hasOrganization,
  pendingInviteId,
  homePath = "/dashboard",
}: {
  emailVerified: boolean;
  mustChangePassword: boolean;
  hasOrganization: boolean;
  pendingInviteId?: string | null;
  homePath?: string;
}) {
  if (!emailVerified) {
    return "/verify-email";
  }

  if (mustChangePassword) {
    return "/change-password";
  }

  if (pendingInviteId) {
    return `/invite/${pendingInviteId}`;
  }

  if (!hasOrganization) {
    return "/onboarding";
  }

  return homePath;
}
