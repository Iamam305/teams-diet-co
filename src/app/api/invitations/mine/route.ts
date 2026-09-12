import { handleRoute } from "@/server/api-error";
import { listMineInvitations } from "@/server/invitations";

export async function GET() {
  return handleRoute(async () => {
    const invitations = await listMineInvitations();
    return { invitations };
  });
}
