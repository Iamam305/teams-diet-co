import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { InvitationCard } from "@/components/auth/invitation-card";
import { db } from "@/db";
import { invitation, organization } from "@/db/schema";
import { invitationDisplayStatus } from "@/lib/auth-gates";
import { getSession, userMustChangePassword } from "@/server/auth";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (session && (await userMustChangePassword(session.user.id))) {
    redirect("/change-password");
  }
  const [row] = await db
    .select({
      id: invitation.id,
      status: invitation.status,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      organizationName: organization.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(organization.id, invitation.organizationId))
    .where(eq(invitation.id, id))
    .limit(1);

  if (!row) {
    return (
      <InvitationCard
        signedIn={Boolean(session)}
        invitation={{ status: "missing" }}
      />
    );
  }

  const status = invitationDisplayStatus({
    status: row.status,
    expiresAt: row.expiresAt,
  });

  if (status !== "pending") {
    const displayStatus =
      status === "accepted" ||
      status === "rejected" ||
      status === "canceled" ||
      status === "expired"
        ? status
        : "missing";

    return (
      <InvitationCard
        signedIn={Boolean(session)}
        invitation={{ status: displayStatus }}
      />
    );
  }

  return (
    <InvitationCard
      signedIn={Boolean(session)}
      invitation={{
        status: "pending",
        id: row.id,
        organizationName: row.organizationName,
        role: row.role ?? "member",
        expiresAt: row.expiresAt,
      }}
    />
  );
}
