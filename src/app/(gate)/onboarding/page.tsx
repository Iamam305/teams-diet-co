import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/org/onboarding-form";
import { auth } from "@/lib/auth";
import { requirePasswordReady } from "@/server/auth";
import { listCurrentUserInvitations } from "@/server/invitations";

export default async function OnboardingPage() {
  await requirePasswordReady();
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (organizations?.length) {
    redirect("/dashboard");
  }

  const invitations = (await listCurrentUserInvitations()).filter(
    (invitation) => invitation.status === "pending",
  );

  return (
    <OnboardingForm
      invitations={invitations.map((invitation) => ({
        id: invitation.id,
        organizationName:
          "organizationName" in invitation
            ? invitation.organizationName
            : undefined,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      }))}
    />
  );
}
