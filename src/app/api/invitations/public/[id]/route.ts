import { handleRoute } from "@/server/api-error";
import { getPublicInvitation } from "@/server/invitations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    return getPublicInvitation(id);
  });
}
