import { handleRoute } from "@/server/api-error";
import { listActivityEvents } from "@/server/queries";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const url = new URL(request.url);
    const parsed = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
    const rows = await listActivityEvents(limit);
    return { rows };
  });
}
