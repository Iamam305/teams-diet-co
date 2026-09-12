import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { canAccessTeam, type TeamAccessAction } from "@/lib/auth-gates";
import { isMainAdmin, isTeamAdmin, type OrgRole } from "@/lib/roles";
import { ApiError } from "@/server/api-error";
import { listTeamIdsForUser } from "@/server/org-hooks";

export type AppSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

function redirectFromApiError(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.code === "UNAUTHENTICATED") {
      redirect("/login");
    }
    if (error.code === "EMAIL_UNVERIFIED") {
      redirect("/verify-email");
    }
    if (error.code === "PASSWORD_CHANGE_REQUIRED") {
      redirect("/change-password");
    }
    if (error.code === "NO_ORGANIZATION") {
      redirect("/onboarding");
    }
  }

  throw error;
}

export async function requireApiSession() {
  const session = await getSession();

  if (!session) {
    throw new ApiError(401, "Sign in to continue.", "UNAUTHENTICATED");
  }

  return session;
}

export async function requireSession() {
  try {
    return await requireApiSession();
  } catch (error) {
    redirectFromApiError(error);
  }
}

export async function requireApiVerifiedEmail() {
  const session = await requireApiSession();

  if (!session.user.emailVerified) {
    throw new ApiError(
      403,
      "Verify your email to continue.",
      "EMAIL_UNVERIFIED",
    );
  }

  return session;
}

export async function requireVerifiedEmail() {
  try {
    return await requireApiVerifiedEmail();
  } catch (error) {
    redirectFromApiError(error);
  }
}

export async function userMustChangePassword(userId: string) {
  const [row] = await db
    .select({ mustChangePassword: user.mustChangePassword })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return Boolean(row?.mustChangePassword);
}

export async function requireApiPasswordReady() {
  const session = await requireApiVerifiedEmail();

  if (await userMustChangePassword(session.user.id)) {
    throw new ApiError(
      403,
      "Change your password to continue.",
      "PASSWORD_CHANGE_REQUIRED",
    );
  }

  return session;
}

export async function requirePasswordReady() {
  try {
    return await requireApiPasswordReady();
  } catch (error) {
    redirectFromApiError(error);
  }
}

export async function getOrganizations() {
  return auth.api.listOrganizations({
    headers: await headers(),
  });
}

export async function requireApiOrganization() {
  const session = await requireApiPasswordReady();
  const organizations = await getOrganizations();
  const activeOrganizationId = (
    session.session as { activeOrganizationId?: string | null }
  ).activeOrganizationId;

  if (!organizations?.length) {
    throw new ApiError(
      403,
      "Create or join an organization.",
      "NO_ORGANIZATION",
    );
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
    throw new ApiError(
      403,
      "Create or join an organization.",
      "NO_ORGANIZATION",
    );
  }

  return {
    session,
    member,
    organization: fullOrganization,
    organizations,
  };
}

export async function requireOrganization() {
  try {
    return await requireApiOrganization();
  } catch (error) {
    redirectFromApiError(error);
  }
}

export async function requirePermission(permissions: Record<string, string[]>) {
  const context = await requireApiOrganization();
  const result = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions },
  });

  if (!result?.success) {
    throw new ApiError(
      403,
      "You do not have permission to do that.",
      "FORBIDDEN",
    );
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
  const context = await requireApiOrganization();
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
    throw new ApiError(
      403,
      "You do not have permission to do that.",
      "FORBIDDEN",
    );
  }

  return context;
}
