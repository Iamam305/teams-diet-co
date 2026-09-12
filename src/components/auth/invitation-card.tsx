"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getPrimaryRoleLabel } from "@/lib/roles";
import {
  acceptInvitationAction,
  rejectInvitationAction,
} from "@/server/actions";

export type InvitationState =
  | {
      status: "pending";
      id: string;
      organizationName: string;
      role: string;
      expiresAt: Date | string;
    }
  | { status: "expired" | "canceled" | "accepted" | "rejected" | "missing" };

export function InvitationCard({
  invitation,
  signedIn,
}: {
  invitation: InvitationState;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function accept() {
    if (invitation.status !== "pending") {
      return;
    }
    setPending(true);
    const result = await acceptInvitationAction(invitation.id);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Invitation accepted.");
    router.replace("/continue");
    router.refresh();
  }

  async function reject() {
    if (invitation.status !== "pending") {
      return;
    }
    setPending(true);
    const result = await rejectInvitationAction(invitation.id);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Invitation declined.");
    router.replace("/onboarding");
    router.refresh();
  }

  if (invitation.status !== "pending") {
    const copy = {
      expired: "This invitation has expired.",
      canceled: "This invitation was revoked.",
      accepted: "This invitation was already accepted.",
      rejected: "This invitation was already declined.",
      missing: "We could not find this invitation.",
    }[invitation.status];

    return (
      <AuthCard title="Invitation">
        <Alert variant="destructive">
          <AlertTitle>Invitation unavailable</AlertTitle>
          <AlertDescription>{copy}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            className="w-full"
            onClick={() => router.push(signedIn ? "/onboarding" : "/login")}
          >
            Continue
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Organization invitation"
      description={`Join ${invitation.organizationName} as ${getPrimaryRoleLabel(invitation.role)}.`}
    >
      {!signedIn ? (
        <Alert className="mb-4">
          <AlertDescription>
            Sign in with the account that received this invitation, then return
            to accept it.
          </AlertDescription>
        </Alert>
      ) : null}
      <p className="mb-4 text-sm text-muted-foreground">
        Expires {new Date(invitation.expiresAt).toLocaleString()}.
      </p>
      {signedIn ? (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={accept} disabled={pending}>
            {pending ? "Working..." : "Accept"}
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={reject}
            disabled={pending}
          >
            Decline
          </Button>
        </div>
      ) : (
        <Button
          className="w-full"
          onClick={() => {
            router.push(`/login?next=/invite/${invitation.id}`);
          }}
        >
          Sign in to accept
        </Button>
      )}
    </AuthCard>
  );
}
