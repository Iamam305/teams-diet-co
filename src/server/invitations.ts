import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { invitation, organization } from "@/db/schema";
import type { PublicInvitationResponse } from "@/lib/api-types";
import { auth } from "@/lib/auth";
import { invitationDisplayStatus } from "@/lib/auth-gates";
import { getSession, requireApiPasswordReady } from "@/server/auth";

export async function listCurrentUserInvitations() {
  const session = await getSession();

  if (!session?.user.emailVerified) {
    return [];
  }

  try {
    return (
      (await auth.api.listUserInvitations({
        headers: await headers(),
      })) ?? []
    );
  } catch {
    return [];
  }
}

export async function listMineInvitations() {
  await requireApiPasswordReady();
  const invitations = (await listCurrentUserInvitations()).filter(
    (item) => item.status === "pending",
  );

  return invitations.map((item) => ({
    id: item.id,
    organizationName:
      "organizationName" in item ? item.organizationName : undefined,
    role: item.role ?? "member",
    expiresAt:
      item.expiresAt instanceof Date
        ? item.expiresAt.toISOString()
        : String(item.expiresAt),
    status: item.status,
  }));
}

export async function getPublicInvitation(
  id: string,
): Promise<PublicInvitationResponse> {
  const session = await getSession();
  const signedIn = Boolean(session);
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
    return { signedIn, invitation: { status: "missing" } };
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

    return {
      signedIn,
      invitation: { status: displayStatus },
    };
  }

  return {
    signedIn,
    invitation: {
      status: "pending",
      id: row.id,
      organizationName: row.organizationName,
      role: row.role ?? "member",
      expiresAt: row.expiresAt.toISOString(),
    },
  };
}
