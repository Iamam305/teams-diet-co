import { ApiError, handleRoute } from "@/server/api-error";
import { closeWorkSessionAction } from "@/server/work";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const body = (await request.json().catch(() => null)) as {
      userId?: string;
    } | null;

    if (!body?.userId) {
      throw new ApiError(400, "A user id is required.");
    }

    return closeWorkSessionAction(body.userId);
  });
}
