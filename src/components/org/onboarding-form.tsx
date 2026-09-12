"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getPrimaryRoleLabel } from "@/lib/roles";
import { organizationSchema, slugFromName } from "@/lib/validations";
import {
  acceptInvitationAction,
  rejectInvitationAction,
} from "@/server/actions";

type PendingInvitation = {
  id: string;
  organizationName?: string | null;
  role: string;
  expiresAt: Date | string;
  status: string;
};

export function OnboardingForm({
  invitations,
}: {
  invitations: PendingInvitation[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const form = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: "", slug: "" },
  });

  async function onCreate(values: z.infer<typeof organizationSchema>) {
    setPending(true);
    const slugCheck = await authClient.organization.checkSlug({
      slug: values.slug,
    });

    if (slugCheck.error || slugCheck.data?.status === false) {
      setPending(false);
      form.setError("slug", { message: "That slug is already taken." });
      return;
    }

    const { error } = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
    });
    setPending(false);

    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not create organization."));
      return;
    }

    toast.success("Organization created.");
    router.replace("/continue");
    router.refresh();
  }

  async function accept(id: string) {
    setPending(true);
    const result = await acceptInvitationAction(id);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Invitation accepted.");
    router.replace("/continue");
    router.refresh();
  }

  async function reject(id: string) {
    setPending(true);
    const result = await rejectInvitationAction(id);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Invitation declined.");
    router.refresh();
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
      <AuthCard
        title="Create an organization"
        description="Start a new workspace and become its Main Admin."
      >
        <form onSubmit={form.handleSubmit(onCreate)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldLabel htmlFor="name">Organization name</FieldLabel>
              <Input
                id="name"
                {...form.register("name", {
                  onChange: (event) => {
                    if (!form.formState.dirtyFields.slug) {
                      form.setValue("slug", slugFromName(event.target.value), {
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.slug)}>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input id="slug" {...form.register("slug")} />
              <FieldError>{form.formState.errors.slug?.message}</FieldError>
            </Field>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating..." : "Create organization"}
            </Button>
          </FieldGroup>
        </form>
      </AuthCard>

      <Card>
        <CardHeader>
          <CardTitle>Join an organization</CardTitle>
          <CardDescription>
            Accept an invitation sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You do not have any pending invitations.
            </p>
          ) : (
            invitations.map((invitation) => (
              <div key={invitation.id} className="rounded-lg border p-3">
                <p className="font-medium">
                  {invitation.organizationName ?? "Organization"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getPrimaryRoleLabel(invitation.role)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => accept(invitation.id)}
                    disabled={pending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject(invitation.id)}
                    disabled={pending}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
