import { handleRoute } from "@/server/api-error";
import { getSettingsInvitations } from "@/server/settings";

export async function GET() {
  return handleRoute(() => getSettingsInvitations());
}
