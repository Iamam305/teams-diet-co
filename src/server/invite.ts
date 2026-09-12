import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { member as memberTable, team, user } from "@/db/schema";
import { getAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth";
import { inviteProvisioningPlan } from "@/lib/auth-gates";
import {
  invitationCredentialsEmailHtml,
  invitationExistingUserEmailHtml,
  sendEmail,
} from "@/lib/email";
import { ORG_ROLES, type OrgRole } from "@/lib/roles";
import { requirePermission } from "@/server/auth";

function generateTemporaryPassword() {
  return randomBytes(12).toString("base64url");
}

function usernameFromEmail(email: string) {
  const localPart = email
    .split("@")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 20);

  const base = localPart && localPart.length >= 3 ? localPart : "user";
  return `${base}${randomBytes(2).toString("hex")}`;
}

async function uniqueUsername(email: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = usernameFromEmail(email);
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, candidate))
      .limit(1);

    if (!existing) {
      return candidate;
    }
  }

  return `user${randomBytes(6).toString("hex")}`;
}

async function findUserByEmail(email: string) {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);

  return existing ?? null;
}

export async function inviteMemberWithCredentials(input: {
  email: string;
  role: OrgRole;
  teamId?: string;
  organizationId?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const { organization, member } = await requirePermission({
    invitation: ["create"],
  });
  const organizationId = input.organizationId ?? organization.id;

  if (member.role !== ORG_ROLES.owner && input.role === ORG_ROLES.owner) {
    throw new Error("Only Main Admins can invite Main Admins.");
  }

  if (member.role === ORG_ROLES.teamAdmin && !input.teamId) {
    throw new Error("Team Admins must invite users to a specific team.");
  }

  const requestHeaders = await headers();
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const [alreadyMember] = await db
      .select({ id: memberTable.id })
      .from(memberTable)
      .where(
        and(
          eq(memberTable.userId, existingUser.id),
          eq(memberTable.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (alreadyMember) {
      throw new Error("This person is already a member of the organization.");
    }
  }

  const provisioning = inviteProvisioningPlan(
    existingUser ? { id: existingUser.id } : null,
  );
  let temporaryPassword: string | null = null;
  let username: string | null = existingUser?.username ?? null;

  if (provisioning.provisionAccount) {
    const ctx = await auth.$context;
    temporaryPassword = generateTemporaryPassword();
    username = await uniqueUsername(email);
    const hashedPassword = await ctx.password.hash(temporaryPassword);
    const createdUser = await ctx.internalAdapter.createUser(
      {
        email,
        name: email.split("@")[0] ?? "Invited user",
        emailVerified: true,
        username,
        displayUsername: username,
        mustChangePassword: true,
      },
      { method: "email-password" },
    );

    if (!createdUser) {
      throw new Error("Could not create the invited user.");
    }

    await ctx.internalAdapter.createAccount({
      userId: createdUser.id,
      accountId: createdUser.id,
      providerId: "credential",
      password: hashedPassword,
    });
  }

  const invitation = await auth.api.createInvitation({
    headers: requestHeaders,
    body: {
      email,
      role: input.role,
      organizationId,
      teamId: input.teamId,
      resend: true,
    },
  });

  if (!invitation) {
    throw new Error("Could not create the invitation.");
  }

  const [teamRow] = input.teamId
    ? await db
        .select({ name: team.name })
        .from(team)
        .where(eq(team.id, input.teamId))
        .limit(1)
    : [null];

  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  const inviteUrl = `${appUrl}/invite/${invitation.id}`;
  const expiresLabel = new Date(invitation.expiresAt).toLocaleDateString();

  try {
    if (temporaryPassword && username) {
      await sendEmail({
        to: email,
        subject: `You are invited to ${organization.name}`,
        html: invitationCredentialsEmailHtml({
          organizationName: organization.name,
          teamName: teamRow?.name,
          loginUrl,
          email,
          username,
          password: temporaryPassword,
          inviteUrl,
          expiresLabel,
        }),
      });
    } else {
      await sendEmail({
        to: email,
        subject: `You are invited to ${organization.name}`,
        html: invitationExistingUserEmailHtml({
          organizationName: organization.name,
          teamName: teamRow?.name,
          loginUrl,
          inviteUrl,
          expiresLabel,
        }),
      });
    }
  } catch (error) {
    await auth.api.cancelInvitation({
      headers: requestHeaders,
      body: { invitationId: invitation.id },
    });
    throw new Error(
      error instanceof Error
        ? error.message
        : "Invitation email could not be sent.",
    );
  }

  return {
    invitationId: invitation.id,
    provisioned: Boolean(temporaryPassword),
  };
}
