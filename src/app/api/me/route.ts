import { handleRoute } from "@/server/api-error";
import { getMePayload } from "@/server/settings";

export async function GET() {
  return handleRoute(() => getMePayload());
}
