import { redirect } from "next/navigation";
import { postAuthDestination } from "@/lib/auth-gates";
import {
  getOrganizations,
  requireSession,
  userMustChangePassword,
} from "@/server/auth";
import { listCurrentUserInvitations } from "@/server/invitations";

export default async function ContinuePage() {
  const session = await requireSession();
  const organizations = session.user.emailVerified
    ? await getOrganizations()
    : [];
  const pendingInvite = session.user.emailVerified
    ? (await listCurrentUserInvitations()).find(
        (invitation) => invitation.status === "pending",
      )
    : null;

  redirect(
    postAuthDestination({
      emailVerified: Boolean(session.user.emailVerified),
      mustChangePassword: await userMustChangePassword(session.user.id),
      hasOrganization: Boolean(organizations?.length),
      pendingInviteId: pendingInvite?.id,
    }),
  );
}
