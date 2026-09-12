"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export default function VerifyEmailPage() {
  const [pending, setPending] = useState(false);

  async function resend() {
    setPending(true);
    const session = await authClient.getSession();
    const email = session.data?.user.email;

    if (!email) {
      setPending(false);
      toast.error("Sign in first, then request another verification email.");
      return;
    }

    const { error } = await authClient.sendVerificationEmail({ email });
    setPending(false);

    if (error) {
      toast.error(
        getAuthErrorMessage(error, "Could not resend verification email."),
      );
      return;
    }

    toast.success("Verification email sent if your account still needs it.");
  }

  return (
    <AuthCard
      title="Verify your email"
      description="We sent a verification link to your inbox. Open it to continue."
    >
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={resend}
          loading={pending}
        >
          Resend verification email
        </Button>
        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
