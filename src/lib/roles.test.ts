import { describe, expect, it } from "vitest";
import {
  canAccessSettings,
  hasOrgRole,
  isMainAdmin,
  isTeamAdmin,
  ORG_ROLES,
  parseOrgRoles,
} from "@/lib/roles";

describe("org roles", () => {
  it("parses comma-separated roles", () => {
    expect(parseOrgRoles("owner,team-admin")).toEqual([
      ORG_ROLES.owner,
      ORG_ROLES.teamAdmin,
    ]);
  });

  it("identifies main admins", () => {
    expect(isMainAdmin("owner")).toBe(true);
    expect(isMainAdmin("team-admin")).toBe(false);
    expect(hasOrgRole("member", ORG_ROLES.member)).toBe(true);
  });

  it("identifies team admins", () => {
    expect(isTeamAdmin("team-admin")).toBe(true);
    expect(isTeamAdmin("owner")).toBe(false);
  });

  it("restricts settings by role", () => {
    expect(canAccessSettings("owner", "organization")).toBe(true);
    expect(canAccessSettings("team-admin", "organization")).toBe(false);
    expect(canAccessSettings("team-admin", "teams")).toBe(true);
    expect(canAccessSettings("member", "invitations")).toBe(false);
    expect(canAccessSettings("member", "members")).toBe(false);
    expect(canAccessSettings("team-admin", "activity")).toBe(true);
    expect(canAccessSettings("member", "activity")).toBe(false);
    expect(canAccessSettings("owner", "activity")).toBe(true);
  });
});
