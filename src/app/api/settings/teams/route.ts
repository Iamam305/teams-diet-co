import { handleRoute } from "@/server/api-error";
import { getSettingsTeams } from "@/server/settings";

export async function GET() {
  return handleRoute(() => getSettingsTeams());
}
