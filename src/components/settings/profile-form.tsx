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
import { useInvalidateAppQueries } from "@/hooks/use-mutations";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { profileSchema } from "@/lib/validations";

export function ProfileForm({
  name,
  username,
}: {
  name: string;
  username: string;
}) {
  const invalidate = useInvalidateAppQueries();
  const [pending, setPending] = useState(false);
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, username },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setPending(true);
    const { error } = await authClient.updateUser({
      name: values.name.trim(),
      username: values.username.trim(),
    });
    setPending(false);

    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not update profile."));
      return;
    }

    toast.success("Profile updated.");
    invalidate();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg">
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" autoComplete="name" {...form.register("name")} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.username)}>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            {...form.register("username")}
          />
          <FieldError>{form.formState.errors.username?.message}</FieldError>
        </Field>
        <Button type="submit" loading={pending}>
          Save profile
        </Button>
      </FieldGroup>
    </form>
  );
}
