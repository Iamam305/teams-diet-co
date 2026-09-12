"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { profileSchema } from "@/lib/validations";

export function ProfileForm({
  name,
  username,
}: {
  name: string;
  username: string;
}) {
  const router = useRouter();
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
    router.refresh();
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
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </FieldGroup>
    </form>
  );
}
