import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { canAccessTeam, type TeamAccessAction } from "@/lib/auth-gates";
import { isMainAdmin, isTeamAdmin, type OrgRole } from "@/lib/roles";
import { listTeamIdsForUser } from "@/server/org-hooks";

export type AppSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireVerifiedEmail() {
  const session = await requireSession();

  if (!session.user.emailVerified) {
    redirect("/verify-email");
  }

  return session;
}

export async function userMustChangePassword(userId: string) {
  const [row] = await db
    .select({ mustChangePassword: user.mustChangePassword })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return Boolean(row?.mustChangePassword);
}

export async function requirePasswordReady() {
  const session = await requireVerifiedEmail();

  if (await userMustChangePassword(session.user.id)) {
    redirect("/change-password");
  }

  return session;
}

export async function getOrganizations() {
  return auth.api.listOrganizations({
    headers: await headers(),
  });
}

export async function requireOrganization() {
  const session = await requirePasswordReady();
  const organizations = await getOrganizations();
  const activeOrganizationId = (
    session.session as { activeOrganizationId?: string | null }
  ).activeOrganizationId;

  if (!organizations?.length) {
    redirect("/onboarding");
  }

  const organizationId =
    activeOrganizationId &&
    organizations.some(
      (organization) => organization.id === activeOrganizationId,
    )
      ? activeOrganizationId
      : organizations[0].id;

  if (organizationId !== activeOrganizationId) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId },
    });
  }

  const fullOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId },
  });

  const member = fullOrganization?.members.find(
    (item) => item.userId === session.user.id,
  );

  if (!member || !fullOrganization) {
    redirect("/onboarding");
  }

  return {
    session,
    member,
    organization: fullOrganization,
    organizations,
  };
}

export async function requirePermission(permissions: Record<string, string[]>) {
  const context = await requireOrganization();
  const result = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions },
  });

  if (!result?.success) {
    throw new Error("You do not have permission to do that.");
  }

  return context;
}

export function assertAssignableRole(actorRole: string, nextRole: OrgRole) {
  if (isMainAdmin(actorRole)) {
    return true;
  }

  if (isTeamAdmin(actorRole) && nextRole !== "owner") {
    return true;
  }

  return false;
}

export async function requireTeamAccess(
  teamId: string,
  action: TeamAccessAction,
) {
  const context = await requireOrganization();
  const memberTeamIds = await listTeamIdsForUser(
    context.session.user.id,
    context.organization.id,
  );

  if (
    !canAccessTeam({
      role: context.member.role,
      teamId,
      memberTeamIds,
      action,
    })
  ) {
    throw new Error("You do not have permission to do that.");
  }

  return context;
}
