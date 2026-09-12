import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { OrgRole } from "@/lib/roles";
import { requireApiPasswordReady, requirePermission } from "@/server/auth";
import { inviteMemberWithCredentials } from "@/server/invite";

export async function inviteMemberAction(input: {
  email: string;
  role: OrgRole;
  teamId?: string;
}) {
  const result = await inviteMemberWithCredentials(input);
  return result;
}

export async function cancelInvitationAction(invitationId: string) {
  await requirePermission({ invitation: ["cancel"] });
  await auth.api.cancelInvitation({
    headers: await headers(),
    body: { invitationId },
  });
  return { ok: true as const };
}

export async function acceptInvitationAction(invitationId: string) {
  await requireApiPasswordReady();
  const result = await auth.api.acceptInvitation({
    headers: await headers(),
    body: { invitationId },
  });
  return { result };
}

export async function rejectInvitationAction(invitationId: string) {
  await requireApiPasswordReady();
  await auth.api.rejectInvitation({
    headers: await headers(),
    body: { invitationId },
  });
  return { ok: true as const };
}
