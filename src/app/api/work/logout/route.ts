import { handleRoute } from "@/server/api-error";
import { recordLogoutAction } from "@/server/work";

export async function POST() {
  return handleRoute(() => recordLogoutAction());
}
