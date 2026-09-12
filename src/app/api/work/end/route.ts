import { handleRoute } from "@/server/api-error";
import { endWorkAction } from "@/server/work";

export async function POST() {
  return handleRoute(() => endWorkAction());
}
