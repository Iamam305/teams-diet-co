"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { OrgRole } from "@/lib/roles";
import { requirePasswordReady, requirePermission } from "@/server/auth";
import { inviteMemberWithCredentials } from "@/server/invite";

export async function inviteMemberAction(input: {
  email: string;
  role: OrgRole;
  teamId?: string;
}) {
  try {
    const result = await inviteMemberWithCredentials(input);
    return { ok: true as const, ...result };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Could not send invitation.",
    };
  }
}

export async function cancelInvitationAction(invitationId: string) {
  try {
    await requirePermission({ invitation: ["cancel"] });
    await auth.api.cancelInvitation({
      headers: await headers(),
      body: { invitationId },
    });
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Could not cancel invitation.",
    };
  }
}

export async function acceptInvitationAction(invitationId: string) {
  try {
    await requirePasswordReady();
    const result = await auth.api.acceptInvitation({
      headers: await headers(),
      body: { invitationId },
    });
    return { ok: true as const, result };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Could not accept invitation.",
    };
  }
}

export async function rejectInvitationAction(invitationId: string) {
  try {
    await requirePasswordReady();
    await auth.api.rejectInvitation({
      headers: await headers(),
      body: { invitationId },
    });
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Could not reject invitation.",
    };
  }
}
