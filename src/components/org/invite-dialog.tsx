"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORG_ROLE_LABELS, ORG_ROLES, type OrgRole } from "@/lib/roles";
import { inviteSchema } from "@/lib/validations";
import { inviteMemberAction } from "@/server/actions";

export function InviteDialog({
  teams,
  actorRole,
}: {
  teams: { id: string; name: string }[];
  actorRole: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const canInviteOwner = actorRole === ORG_ROLES.owner;
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: ORG_ROLES.member,
      teamId: teams[0]?.id,
    },
  });

  async function onSubmit(values: z.infer<typeof inviteSchema>) {
    setPending(true);
    const result = await inviteMemberAction({
      email: values.email,
      role: values.role,
      teamId: values.teamId,
    });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      result.provisioned
        ? "Invitation sent with temporary credentials."
        : "Invitation sent.",
    );
    setOpen(false);
    form.reset();
    router.refresh();
  }

  const roles = (Object.entries(ORG_ROLE_LABELS) as [OrgRole, string][]).filter(
    ([role]) => canInviteOwner || role !== ORG_ROLES.owner,
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite user</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Invite a teammate"
        description="New users receive a temporary password and must change it after their first login."
      >
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.email)}>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                {...form.register("email")}
              />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select
                value={form.watch("role")}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    form.setValue("role", value as OrgRole);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {ORG_ROLE_LABELS[form.watch("role")]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Team</FieldLabel>
              <Select
                value={form.watch("teamId") ?? ""}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    form.setValue("teamId", value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {teams.find((team) => team.id === form.watch("teamId"))
                      ?.name ?? "Select a team"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending..." : "Send invitation"}
            </Button>
          </FieldGroup>
        </form>
      </Dialog>
    </>
  );
}
