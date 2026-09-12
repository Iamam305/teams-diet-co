import { resolveAttendanceRange } from "@/lib/attendance";
import { ApiError, handleRoute } from "@/server/api-error";
import { getMemberAttendance } from "@/server/work";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  return handleRoute(async () => {
    const { userId } = await context.params;
    const url = new URL(request.url);
    const range = resolveAttendanceRange(
      url.searchParams.get("from") ?? undefined,
      url.searchParams.get("to") ?? undefined,
    );
    const attendance = await getMemberAttendance({
      userId,
      from: range.from,
      to: range.to,
    });

    if (!attendance) {
      throw new ApiError(404, "Member not found.", "NOT_FOUND");
    }

    return attendance;
  });
}
