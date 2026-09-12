"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { resetPasswordSchema } from "@/lib/validations";

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) {
      toast.error("This reset link is missing or invalid.");
      return;
    }

    setPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });
    setPending(false);

    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not reset password."));
      return;
    }

    toast.success("Password updated. Sign in with your new password.");
    router.replace("/login");
  }

  return (
    <AuthCard
      title="Reset password"
      description="Choose a new password for your account."
    >
      {!token ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            This reset link is invalid or has expired. Request a new one.
          </AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
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
          <Button type="submit" disabled={pending || !token} className="w-full">
            {pending ? "Updating..." : "Update password"}
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
