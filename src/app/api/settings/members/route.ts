import { handleRoute } from "@/server/api-error";
import { getSettingsMembers } from "@/server/settings";

export async function GET() {
  return handleRoute(() => getSettingsMembers());
}
