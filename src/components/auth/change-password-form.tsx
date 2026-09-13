"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { changePasswordSchema } from "@/lib/validations";

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof changePasswordSchema>) {
    setPending(true);
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);

    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not change password."));
      return;
    }

    toast.success("Password updated.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg">
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.currentPassword)}>
          <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...form.register("currentPassword")}
          />
          <FieldError>
            {form.formState.errors.currentPassword?.message}
          </FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.newPassword)}>
          <FieldLabel htmlFor="newPassword">New password</FieldLabel>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...form.register("newPassword")}
          />
          <FieldError>{form.formState.errors.newPassword?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.confirmPassword)}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
          <FieldError>
            {form.formState.errors.confirmPassword?.message}
          </FieldError>
        </Field>
        <Button type="submit" loading={pending}>
          Save password
        </Button>
      </FieldGroup>
    </form>
  );
}
