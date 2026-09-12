"use client";

import { Button } from "@/components/ui/button";
import { useWorkStatus } from "@/components/work/work-status";

export function WorkStatusLabel() {
  const { activeStartedAt } = useWorkStatus();
  return <>{activeStartedAt ? "Working now" : "Not working"}</>;
}

export function WorkToggle() {
  const { activeStartedAt, pending, elapsed, toggle } = useWorkStatus();

  return (
    <div className="flex items-center gap-2">
      {elapsed ? (
        <span className="text-[11px] text-muted-foreground tabular-nums sm:text-xs">
          {elapsed}
        </span>
      ) : null}
      <Button
        type="button"
        variant={activeStartedAt ? "destructive" : "default"}
        size="sm"
        disabled={pending}
        onClick={toggle}
      >
        {pending ? "Saving..." : activeStartedAt ? "End Work" : "Start Work"}
      </Button>
    </div>
  );
}
