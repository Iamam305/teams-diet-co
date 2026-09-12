import { handleRoute } from "@/server/api-error";
import { getSettingsOrganization } from "@/server/settings";

export async function GET() {
  return handleRoute(() => getSettingsOrganization());
}
