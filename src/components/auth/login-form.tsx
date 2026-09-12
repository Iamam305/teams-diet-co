"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage, looksLikeEmail } from "@/lib/auth-errors";
import { loginSchema } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/continue";
  const [pending, setPending] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setPending(true);
    const identifier = values.identifier.trim();

    const { error } = looksLikeEmail(identifier)
      ? await authClient.signIn.email({
          email: identifier,
          password: values.password,
        })
      : await authClient.signIn.username({
          username: identifier,
          password: values.password,
        });

    setPending(false);

    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not sign in."));
      return;
    }

    const destination = nextPath.startsWith("/") ? nextPath : "/continue";
    const homePaths = new Set(["/dashboard", "/diet-charts", "/attendance"]);
    router.replace(homePaths.has(destination) ? "/continue" : destination);
    router.refresh();
  }

  return (
    <AuthCard
      title="Sign in"
      description="Use your email or username and password."
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field data-invalid={Boolean(form.formState.errors.identifier)}>
            <FieldLabel htmlFor="identifier">Email or username</FieldLabel>
            <Input
              id="identifier"
              autoComplete="username"
              {...form.register("identifier")}
            />
            <FieldError>{form.formState.errors.identifier?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </FieldGroup>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <Link href="/forgot-password" className="hover:text-primary">
          Forgot password?
        </Link>
        <p>
          Need an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
