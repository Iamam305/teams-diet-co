import { redirect } from "next/navigation";
import { postAuthDestination } from "@/lib/auth-gates";
import { homePathForRole } from "@/lib/diet-access";
import {
  getOrganizations,
  requireOrganization,
  requireSession,
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
  const hasOrganization = Boolean(organizations?.length);
  let homePath = "/diet-charts";

  if (session.user.emailVerified && hasOrganization && !pendingInvite) {
    const { member } = await requireOrganization();
    homePath = homePathForRole(member.role);
  }

  redirect(
    postAuthDestination({
      emailVerified: Boolean(session.user.emailVerified),
      hasOrganization,
      pendingInviteId: pendingInvite?.id,
      homePath,
    }),
  );
}
