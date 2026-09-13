import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import {
  member as memberTable,
  organization as organizationTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { canAccessTeam, type TeamAccessAction } from "@/lib/auth-gates";
import { isMainAdmin, isTeamAdmin, type OrgRole } from "@/lib/roles";
import { ApiError } from "@/server/api-error";
import { listTeamIdsForUser } from "@/server/org-hooks";

export type AppSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export type AppOrganization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: string | null;
};

export type AppMember = {
  id: string;
  userId: string;
  role: string;
};

export type OrganizationContext = {
  session: AppSession;
  member: AppMember;
  organization: AppOrganization;
};

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

function redirectFromApiError(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.code === "UNAUTHENTICATED") {
      redirect("/login");
    }
    if (error.code === "EMAIL_UNVERIFIED") {
      redirect("/verify-email");
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

export async function getOrganizations() {
  return auth.api.listOrganizations({
    headers: await headers(),
  });
}

async function loadMemberships(userId: string) {
  return db
    .select({
      memberId: memberTable.id,
      userId: memberTable.userId,
      role: memberTable.role,
      organizationId: organizationTable.id,
      name: organizationTable.name,
      slug: organizationTable.slug,
      logo: organizationTable.logo,
      metadata: organizationTable.metadata,
    })
    .from(memberTable)
    .innerJoin(
      organizationTable,
      eq(organizationTable.id, memberTable.organizationId),
    )
    .where(eq(memberTable.userId, userId));
}

function toOrganizationContext(
  session: AppSession,
  row: Awaited<ReturnType<typeof loadMemberships>>[number],
): OrganizationContext {
  return {
    session,
    member: {
      id: row.memberId,
      userId: row.userId,
      role: row.role,
    },
    organization: {
      id: row.organizationId,
      name: row.name,
      slug: row.slug,
      logo: row.logo,
      metadata: row.metadata,
    },
  };
}

async function resolveOrganizationContext(): Promise<OrganizationContext> {
  const session = await requireApiVerifiedEmail();
  const memberships = await loadMemberships(session.user.id);

  if (!memberships.length) {
    throw new ApiError(
      403,
      "Create or join an organization.",
      "NO_ORGANIZATION",
    );
  }

  const activeOrganizationId = (
    session.session as { activeOrganizationId?: string | null }
  ).activeOrganizationId;
  const active =
    memberships.find((row) => row.organizationId === activeOrganizationId) ??
    memberships[0];

  if (active.organizationId !== activeOrganizationId) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: active.organizationId },
    });
  }

  return toOrganizationContext(session, active);
}

export const requireApiOrganization = cache(resolveOrganizationContext);

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
