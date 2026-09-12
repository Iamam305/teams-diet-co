import type { OrgRole } from "@/lib/roles";
import { inviteMemberAction } from "@/server/actions";
import { ApiError, handleRoute } from "@/server/api-error";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const body = (await request.json().catch(() => null)) as {
      email?: string;
      role?: OrgRole;
      teamId?: string;
    } | null;

    if (!body?.email || !body.role) {
      throw new ApiError(400, "Email and role are required.");
    }

    return inviteMemberAction({
      email: body.email,
      role: body.role,
      teamId: body.teamId,
    });
  });
}
