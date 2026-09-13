"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useInviteMemberMutation } from "@/hooks/use-mutations";
import { isApiRequestError } from "@/lib/api";
import { ORG_ROLE_LABELS, ORG_ROLES, type OrgRole } from "@/lib/roles";
import { inviteSchema } from "@/lib/validations";

export function InviteDialog({
  teams,
  actorRole,
}: {
  teams: { id: string; name: string }[];
  actorRole: string;
}) {
  const [open, setOpen] = useState(false);
  const inviteMember = useInviteMemberMutation();
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
    try {
      const result = await inviteMember.mutateAsync({
        email: values.email,
        role: values.role,
        teamId: values.teamId,
      });
      toast.success(
        result.provisioned
          ? "Invitation sent with temporary credentials."
          : "Invitation sent.",
      );
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(
        isApiRequestError(error) ? error.message : "Could not send invitation.",
      );
    }
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
        description="New users receive a temporary password they can change later from Settings."
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
            <Button type="submit" loading={inviteMember.isPending}>
              Send invitation
            </Button>
          </FieldGroup>
        </form>
      </Dialog>
    </>
  );
}
