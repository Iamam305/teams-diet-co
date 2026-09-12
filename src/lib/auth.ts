import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { nextCookies } from "better-auth/next-js";
import { organization, username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import {
  resetPasswordEmailHtml,
  sendEmail,
  verificationEmailHtml,
} from "@/lib/email";
import { ac, organizationRoles } from "@/lib/permissions";
import { recordUserActivity } from "@/server/activity";
import { organizationHooks } from "@/server/org-hooks";

export const auth = betterAuth({
  appName: "Team Diet Co",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter((origin): origin is string => Boolean(origin)),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
      team: schema.team,
      teamMember: schema.teamMember,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your DietCo password",
        html: resetPasswordEmailHtml(url),
      });
    },
    onPasswordReset: async ({ user }) => {
      await db
        .update(schema.user)
        .set({ mustChangePassword: false })
        .where(eq(schema.user.id, user.id));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your DietCo email",
        html: verificationEmailHtml(url),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (createdSession) => {
          try {
            const sessionRecord = createdSession as typeof createdSession & {
              activeOrganizationId?: string | null;
            };
            await recordUserActivity({
              userId: sessionRecord.userId,
              activeOrganizationId: sessionRecord.activeOrganizationId,
              type: "login",
            });
          } catch {
            return;
          }
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/change-password" && ctx.path !== "/reset-password") {
        return;
      }

      const activeSession = ctx.context.newSession ?? ctx.context.session;
      const userId = activeSession?.user.id;

      if (!userId) {
        return;
      }

      await ctx.context.internalAdapter.updateUser(userId, {
        mustChangePassword: false,
      });

      await setSessionCookie(ctx, {
        session: activeSession.session,
        user: {
          ...activeSession.user,
          mustChangePassword: false,
        } as typeof activeSession.user,
      });
    }),
  },
  plugins: [
    username(),
    organization({
      ac,
      roles: organizationRoles,
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,
      teams: {
        enabled: true,
        allowRemovingAllTeams: false,
      },
      organizationHooks,
    }),
    nextCookies(),
  ],
});

export function authError(
  message: string,
  status: "BAD_REQUEST" | "FORBIDDEN" | "UNAUTHORIZED" = "BAD_REQUEST",
) {
  return new APIError(status, { message });
}
