"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCancelInvitationMutation } from "@/hooks/use-mutations";
import { isApiRequestError } from "@/lib/api";
import { invitationDisplayStatus } from "@/lib/auth-gates";
import { getPrimaryRoleLabel } from "@/lib/roles";

export function InvitationsTable({
  invitations,
}: {
  invitations: {
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: Date | string;
  }[];
}) {
  const cancelInvitation = useCancelInvitationMutation();

  async function cancel(id: string) {
    try {
      await cancelInvitation.mutateAsync(id);
      toast.success("Invitation cancelled.");
    } catch (error) {
      toast.error(
        isApiRequestError(error)
          ? error.message
          : "Could not cancel invitation.",
      );
    }
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3 md:hidden">
        {invitations.map((invitation) => {
          const status = invitationDisplayStatus({
            status: invitation.status,
            expiresAt: invitation.expiresAt,
          });

          return (
            <li
              key={invitation.id}
              className="space-y-2 rounded-xl border bg-card p-4 shadow-sm"
            >
              <p className="break-all font-medium">{invitation.email}</p>
              <p className="text-sm text-muted-foreground">
                {getPrimaryRoleLabel(invitation.role)} · expires{" "}
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={status === "pending" ? "default" : "secondary"}>
                  {status}
                </Badge>
                {invitation.status === "pending" && status === "pending" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={
                      cancelInvitation.isPending &&
                      cancelInvitation.variables === invitation.id
                    }
                    onClick={() => cancel(invitation.id)}
                  >
                    Revoke
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              const status = invitationDisplayStatus({
                status: invitation.status,
                expiresAt: invitation.expiresAt,
              });

              return (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{getPrimaryRoleLabel(invitation.role)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={status === "pending" ? "default" : "secondary"}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {invitation.status === "pending" && status === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={
                          cancelInvitation.isPending &&
                          cancelInvitation.variables === invitation.id
                        }
                        onClick={() => cancel(invitation.id)}
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
