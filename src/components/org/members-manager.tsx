"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  getPrimaryRoleLabel,
  isMainAdmin,
  ORG_ROLE_LABELS,
  type OrgRole,
} from "@/lib/roles";

type MemberRow = {
  id: string;
  userId: string;
  role: string;
  user: { name?: string | null; email?: string | null };
};

export function MembersManager({
  members,
  teams,
  teamMembers,
  actorRole,
  actorUserId,
}: {
  members: MemberRow[];
  teams: { id: string; name: string }[];
  teamMembers: { teamId: string; userId: string }[];
  actorRole: string;
  actorUserId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const canManage = isMainAdmin(actorRole) || actorRole.includes("team-admin");

  function teamsForUser(userId: string) {
    return teamMembers
      .filter((item) => item.userId === userId)
      .map((item) => teams.find((team) => team.id === item.teamId)?.name)
      .filter(Boolean)
      .join(", ");
  }

  async function updateRole(memberId: string, role: OrgRole) {
    setPending(true);
    const { error } = await authClient.organization.updateMemberRole({
      memberId,
      role,
    });
    setPending(false);
    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not update role."));
      return;
    }
    toast.success("Role updated.");
    router.refresh();
  }

  async function removeMember(emailOrId: string) {
    setPending(true);
    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: emailOrId,
    });
    setPending(false);
    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not remove member."));
      return;
    }
    toast.success("Member removed.");
    router.refresh();
  }

  async function assignTeam(userId: string, teamId: string) {
    setPending(true);
    const { error } = await authClient.organization.addTeamMember({
      teamId,
      userId,
    });
    setPending(false);
    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not add to team."));
      return;
    }
    toast.success("Added to team.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3 md:hidden">
        {members.map((member) => (
          <li
            key={member.id}
            className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
          >
            <div>
              <p className="font-medium">{member.user.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground">
                {member.user.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {teamsForUser(member.userId) || "No team"}
              </p>
            </div>
            {canManage && member.userId !== actorUserId ? (
              <Select
                value={member.role.split(",")[0]}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    updateRole(member.id, value as OrgRole);
                  }
                }}
                disabled={pending}
              >
                <SelectTrigger>
                  <SelectValue>
                    {ORG_ROLE_LABELS[member.role.split(",")[0] as OrgRole] ??
                      getPrimaryRoleLabel(member.role)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ORG_ROLE_LABELS) as [OrgRole, string][])
                    .filter(
                      ([role]) => isMainAdmin(actorRole) || role !== "owner",
                    )
                    .map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary">
                {getPrimaryRoleLabel(member.role)}
              </Badge>
            )}
            {canManage ? (
              <div className="flex flex-col gap-2">
                <Select
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      assignTeam(member.userId, value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue>Add to team</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {member.userId !== actorUserId ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => removeMember(member.user.email ?? member.id)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Teams</TableHead>
              {canManage ? <TableHead>Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{member.user.name ?? "User"}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {canManage && member.userId !== actorUserId ? (
                    <Select
                      value={member.role.split(",")[0]}
                      onValueChange={(value) => {
                        if (typeof value === "string") {
                          updateRole(member.id, value as OrgRole);
                        }
                      }}
                      disabled={pending}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {ORG_ROLE_LABELS[
                            member.role.split(",")[0] as OrgRole
                          ] ?? getPrimaryRoleLabel(member.role)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(ORG_ROLE_LABELS) as [OrgRole, string][]
                        )
                          .filter(
                            ([role]) =>
                              isMainAdmin(actorRole) || role !== "owner",
                          )
                          .map(([role, label]) => (
                            <SelectItem key={role} value={role}>
                              {label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">
                      {getPrimaryRoleLabel(member.role)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{teamsForUser(member.userId) || "-"}</TableCell>
                {canManage ? (
                  <TableCell className="space-y-2">
                    <Select
                      onValueChange={(value) => {
                        if (typeof value === "string") {
                          assignTeam(member.userId, value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue>Add to team</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {member.userId !== actorUserId ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pending}
                        onClick={() =>
                          removeMember(member.user.email ?? member.id)
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
