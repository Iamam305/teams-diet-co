import { cancelInvitationAction } from "@/server/actions";
import { handleRoute } from "@/server/api-error";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    return cancelInvitationAction(id);
  });
}
