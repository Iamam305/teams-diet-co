import { handleRoute } from "@/server/api-error";
import { startWorkAction } from "@/server/work";

export async function POST() {
  return handleRoute(() => startWorkAction());
}
