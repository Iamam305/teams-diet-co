export const ORG_ROLES = {
  owner: "owner",
  teamAdmin: "team-admin",
  member: "member",
} as const;

export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Main Admin",
  "team-admin": "Team Admin",
  member: "Team Member",
};

export const INVITABLE_ROLES: OrgRole[] = [
  ORG_ROLES.owner,
  ORG_ROLES.teamAdmin,
  ORG_ROLES.member,
];

export function parseOrgRoles(role: string | null | undefined): OrgRole[] {
  if (!role) {
    return [];
  }

  return role
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is OrgRole =>
      Object.values(ORG_ROLES).includes(value as OrgRole),
    );
}

export function hasOrgRole(role: string | null | undefined, expected: OrgRole) {
  return parseOrgRoles(role).includes(expected);
}

export function isMainAdmin(role: string | null | undefined) {
  return hasOrgRole(role, ORG_ROLES.owner);
}

export function isTeamAdmin(role: string | null | undefined) {
  return hasOrgRole(role, ORG_ROLES.teamAdmin);
}

export function getPrimaryRoleLabel(role: string | null | undefined) {
  if (isMainAdmin(role)) {
    return ORG_ROLE_LABELS.owner;
  }

  if (isTeamAdmin(role)) {
    return ORG_ROLE_LABELS["team-admin"];
  }

  if (hasOrgRole(role, ORG_ROLES.member)) {
    return ORG_ROLE_LABELS.member;
  }

  return "Member";
}

export type SettingsArea =
  | "organization"
  | "teams"
  | "members"
  | "invitations"
  | "activity";

export function canAccessSettings(
  role: string | null | undefined,
  area: SettingsArea,
) {
  if (isMainAdmin(role)) {
    return true;
  }

  if (isTeamAdmin(role)) {
    return (
      area === "teams" ||
      area === "members" ||
      area === "invitations" ||
      area === "activity"
    );
  }

  return false;
}
