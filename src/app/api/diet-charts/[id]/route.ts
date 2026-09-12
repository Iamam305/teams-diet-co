import type { DietDays } from "@/lib/diet-chart";
import { ApiError, handleRoute } from "@/server/api-error";
import { getDietChart, updateDietChartAction } from "@/server/diet-charts";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    const chart = await getDietChart(id);

    if (!chart) {
      throw new ApiError(404, "Diet chart not found.", "NOT_FOUND");
    }

    return { chart };
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      clientName?: string;
      notes?: string;
      startDate?: string;
      endDate?: string;
      days?: DietDays;
    } | null;

    if (!body?.title || !body.days) {
      throw new ApiError(400, "Title and days are required.");
    }

    return updateDietChartAction({
      id,
      title: body.title,
      clientName: body.clientName,
      notes: body.notes,
      startDate: body.startDate,
      endDate: body.endDate,
      days: body.days,
    });
  });
}
