import { describe, expect, it } from "vitest";
import { member, owner, teamAdmin } from "@/lib/permissions";

describe("organization access control", () => {
  it("gives main admins organization and team management", () => {
    expect(owner.statements.organization).toEqual(
      expect.arrayContaining(["update", "delete"]),
    );
    expect(owner.statements.team).toEqual(
      expect.arrayContaining(["create", "update", "delete"]),
    );
  });

  it("limits team admins to assigned-team operations", () => {
    expect(teamAdmin.statements.organization).toEqual([]);
    expect(teamAdmin.statements.team).toEqual(["update"]);
    expect(teamAdmin.statements.invitation).toEqual(["create", "cancel"]);
    expect(teamAdmin.statements.member).toEqual(["update", "delete"]);
  });

  it("keeps team members read-only", () => {
    expect(member.statements.member).toEqual([]);
    expect(member.statements.invitation).toEqual([]);
    expect(member.statements.team).toEqual([]);
  });
});
