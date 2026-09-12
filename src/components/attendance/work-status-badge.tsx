import { Badge } from "@/components/ui/badge";

export function WorkStatusBadge({
  isWorking,
  isStale,
  tone = "live",
}: {
  isWorking: boolean;
  isStale?: boolean;
  tone?: "live" | "day";
}) {
  if (tone === "day") {
    return isWorking ? (
      <Badge>Work</Badge>
    ) : (
      <Badge variant="secondary">No work</Badge>
    );
  }

  if (isWorking && isStale) {
    return <Badge variant="destructive">Long shift</Badge>;
  }

  if (isWorking) {
    return <Badge>Working</Badge>;
  }

  return <Badge variant="secondary">Not working</Badge>;
}
