import { handleRoute } from "@/server/api-error";
import { cloneDietChartAction } from "@/server/diet-charts";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    return cloneDietChartAction(id);
  });
}
