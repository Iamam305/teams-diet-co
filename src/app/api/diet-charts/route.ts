import type { DietDays } from "@/lib/diet-chart";
import { ApiError, handleRoute } from "@/server/api-error";
import { createDietChartAction, listDietCharts } from "@/server/diet-charts";

export async function GET() {
  return handleRoute(async () => {
    const charts = await listDietCharts();
    return { charts };
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      clientName?: string;
      notes?: string;
      startDate?: string;
      endDate?: string;
      extraClientInfo?: Array<{ key?: string; value?: string }>;
      footnote?: string;
      days?: DietDays;
    } | null;

    if (!body?.title || !body.days) {
      throw new ApiError(400, "Title and days are required.");
    }

    return createDietChartAction({
      title: body.title,
      clientName: body.clientName,
      notes: body.notes,
      startDate: body.startDate,
      endDate: body.endDate,
      extraClientInfo: body.extraClientInfo,
      footnote: body.footnote,
      days: body.days,
    });
  });
}
