"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { isMainAdmin } from "@/lib/roles";

export function TeamsManager({
  teams,
  role,
}: {
  teams: { id: string; name: string }[];
  role: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null,
  );
  const canCreate = isMainAdmin(role);

  async function createTeam() {
    if (!name.trim()) {
      return;
    }
    setPending(true);
    const { error } = await authClient.organization.createTeam({
      name: name.trim(),
    });
    setPending(false);
    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not create team."));
      return;
    }
    setName("");
    toast.success("Team created.");
    router.refresh();
  }

  async function saveTeam() {
    if (!editing) {
      return;
    }
    setPending(true);
    const { error } = await authClient.organization.updateTeam({
      teamId: editing.id,
      data: { name: editing.name },
    });
    setPending(false);
    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not update team."));
      return;
    }
    setEditing(null);
    toast.success("Team updated.");
    router.refresh();
  }

  async function removeTeam(teamId: string) {
    setPending(true);
    const { error } = await authClient.organization.removeTeam({ teamId });
    setPending(false);
    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not delete team."));
      return;
    }
    toast.success("Team deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canCreate ? (
        <div className="flex max-w-lg gap-2">
          <Input
            placeholder="New team name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button onClick={createTeam} disabled={pending}>
            Create team
          </Button>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-48">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell>{team.name}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(team)}
                >
                  Rename
                </Button>
                {canCreate ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeTeam(team.id)}
                    disabled={pending}
                  >
                    Delete
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        title="Rename team"
      >
        <div className="space-y-3">
          <Input
            value={editing?.name ?? ""}
            onChange={(event) =>
              setEditing((current) =>
                current ? { ...current, name: event.target.value } : current,
              )
            }
          />
          <Button onClick={saveTeam} disabled={pending}>
            Save
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
