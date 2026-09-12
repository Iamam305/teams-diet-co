import { describe, expect, it } from "vitest";
import {
  canViewDietChart,
  canViewTeamActivity,
  filterVisibleUserIds,
} from "@/lib/diet-access";

describe("diet chart access", () => {
  it("lets members view their own charts only", () => {
    expect(
      canViewDietChart({
        role: "member",
        userId: "u1",
        createdByUserId: "u1",
        teamId: "t1",
        memberTeamIds: ["t1"],
      }),
    ).toBe(true);

    expect(
      canViewDietChart({
        role: "member",
        userId: "u1",
        createdByUserId: "u2",
        teamId: "t1",
        memberTeamIds: ["t1"],
      }),
    ).toBe(false);
  });

  it("lets team admins view charts from their teams", () => {
    expect(
      canViewDietChart({
        role: "team-admin",
        userId: "admin",
        createdByUserId: "u2",
        teamId: "t1",
        memberTeamIds: ["t1"],
      }),
    ).toBe(true);

    expect(
      canViewDietChart({
        role: "team-admin",
        userId: "admin",
        createdByUserId: "u2",
        teamId: "t2",
        memberTeamIds: ["t1"],
        creatorTeamIds: ["t2"],
      }),
    ).toBe(false);

    expect(
      canViewDietChart({
        role: "team-admin",
        userId: "admin",
        createdByUserId: "u2",
        teamId: null,
        memberTeamIds: ["t1"],
        creatorTeamIds: ["t1"],
      }),
    ).toBe(true);
  });

  it("lets main admins view every chart", () => {
    expect(
      canViewDietChart({
        role: "owner",
        userId: "owner",
        createdByUserId: "u2",
        teamId: null,
        memberTeamIds: [],
      }),
    ).toBe(true);
  });

  it("scopes activity visibility", () => {
    expect(canViewTeamActivity("owner")).toBe(true);
    expect(canViewTeamActivity("team-admin")).toBe(true);
    expect(canViewTeamActivity("member")).toBe(false);
    expect(
      filterVisibleUserIds({
        role: "member",
        userId: "u1",
        memberTeamUserIds: ["u2"],
      }),
    ).toEqual(["u1"]);
    expect(
      filterVisibleUserIds({
        role: "owner",
        userId: "owner",
        memberTeamUserIds: ["u2"],
      }),
    ).toBeNull();
  });
});
