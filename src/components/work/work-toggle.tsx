"use client";

import { Button } from "@/components/ui/button";
import { useWorkStatus } from "@/components/work/work-status";
import { formatTime } from "@/lib/format";

export function WorkStatusLabel() {
  const { activeStartedAt } = useWorkStatus();
  return <>{activeStartedAt ? "Working now" : "Not working"}</>;
}

export function WorkToggle() {
  const { activeStartedAt, pending, elapsed, toggle } = useWorkStatus();
  const punchInTime = activeStartedAt ? formatTime(activeStartedAt) : null;

  return (
    <div className="flex items-center gap-2">
      {elapsed ? (
        <span className="text-[11px] text-muted-foreground tabular-nums sm:text-xs">
          {punchInTime ? `${punchInTime} · ${elapsed}` : elapsed}
        </span>
      ) : null}
      <Button
        type="button"
        variant={activeStartedAt ? "destructive" : "default"}
        size="sm"
        loading={pending}
        onClick={toggle}
      >
        {activeStartedAt ? "End Work" : "Start Work"}
      </Button>
    </div>
  );
}
