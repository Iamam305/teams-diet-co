import { describe, expect, it } from "vitest";
import {
  canAccessTeam,
  canChangeOwnerMembership,
  invitationDisplayStatus,
  inviteProvisioningPlan,
  postAuthDestination,
  reInviteDecision,
} from "@/lib/auth-gates";

describe("invite provisioning", () => {
  it("creates credentials for new users without rotating later", () => {
    expect(inviteProvisioningPlan(null)).toEqual({
      provisionAccount: true,
      rotatePassword: false,
    });
  });

  it("never rotates passwords for existing users", () => {
    expect(inviteProvisioningPlan({ id: "user_1" })).toEqual({
      provisionAccount: false,
      rotatePassword: false,
    });
  });
});

describe("invitation lifecycle", () => {
  it("marks pending invitations expired after the deadline", () => {
    expect(
      invitationDisplayStatus({
        status: "pending",
        expiresAt: "2020-01-01T00:00:00.000Z",
        now: new Date("2024-01-01"),
      }),
    ).toBe("expired");
  });

  it("keeps cancelled and accepted invitations as-is", () => {
    expect(
      invitationDisplayStatus({
        status: "canceled",
        expiresAt: "2030-01-01T00:00:00.000Z",
      }),
    ).toBe("canceled");
    expect(
      invitationDisplayStatus({
        status: "accepted",
        expiresAt: "2020-01-01T00:00:00.000Z",
      }),
    ).toBe("accepted");
  });

  it("cancels a previous pending invite when re-inviting", () => {
    expect(
      reInviteDecision({
        previousStatus: "pending",
        cancelPendingOnReInvite: true,
      }),
    ).toEqual({ previousStatus: "canceled", issueNew: true });
  });
});

describe("last owner protection", () => {
  it("blocks removing or demoting the last main admin", () => {
    expect(
      canChangeOwnerMembership({
        ownerCount: 1,
        targetIsOwner: true,
        action: "remove",
      }),
    ).toBe(false);
    expect(
      canChangeOwnerMembership({
        ownerCount: 1,
        targetIsOwner: true,
        nextRoleIsOwner: false,
        action: "update-role",
      }),
    ).toBe(false);
  });

  it("allows removing an owner when another remains", () => {
    expect(
      canChangeOwnerMembership({
        ownerCount: 2,
        targetIsOwner: true,
        action: "remove",
      }),
    ).toBe(true);
  });
});

describe("team access", () => {
  it("lets main admins manage any team", () => {
    expect(
      canAccessTeam({
        role: "owner",
        teamId: "team_a",
        memberTeamIds: [],
        action: "delete",
      }),
    ).toBe(true);
  });

  it("limits team admins to teams they belong to", () => {
    expect(
      canAccessTeam({
        role: "team-admin",
        teamId: "team_a",
        memberTeamIds: ["team_a"],
        action: "update",
      }),
    ).toBe(true);
    expect(
      canAccessTeam({
        role: "team-admin",
        teamId: "team_b",
        memberTeamIds: ["team_a"],
        action: "invite",
      }),
    ).toBe(false);
    expect(
      canAccessTeam({
        role: "team-admin",
        memberTeamIds: ["team_a"],
        action: "create",
      }),
    ).toBe(false);
  });

  it("keeps team members read-only on their own teams", () => {
    expect(
      canAccessTeam({
        role: "member",
        teamId: "team_a",
        memberTeamIds: ["team_a"],
        action: "read",
      }),
    ).toBe(true);
    expect(
      canAccessTeam({
        role: "member",
        teamId: "team_a",
        memberTeamIds: ["team_a"],
        action: "update",
      }),
    ).toBe(false);
  });
});

describe("forced password-change gate", () => {
  it("sends provisioned users to change-password before invites or the app", () => {
    expect(
      postAuthDestination({
        emailVerified: true,
        mustChangePassword: true,
        hasOrganization: false,
        pendingInviteId: "inv_1",
      }),
    ).toBe("/change-password");
  });

  it("sends pending invites after the password is ready", () => {
    expect(
      postAuthDestination({
        emailVerified: true,
        mustChangePassword: false,
        hasOrganization: false,
        pendingInviteId: "inv_1",
      }),
    ).toBe("/invite/inv_1");
  });

  it("sends members with an org to the dashboard by default", () => {
    expect(
      postAuthDestination({
        emailVerified: true,
        mustChangePassword: false,
        hasOrganization: true,
      }),
    ).toBe("/dashboard");
  });

  it("uses a role-specific home path after the org gate", () => {
    expect(
      postAuthDestination({
        emailVerified: true,
        mustChangePassword: false,
        hasOrganization: true,
        homePath: "/diet-charts",
      }),
    ).toBe("/diet-charts");
  });
});
