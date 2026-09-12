import { handleRoute } from "@/server/api-error";
import { listTeamRoster } from "@/server/work";

export async function GET() {
  return handleRoute(async () => {
    const people = await listTeamRoster();
    return { people };
  });
}
