"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useEndWorkMutation,
  useStartWorkMutation,
} from "@/hooks/use-mutations";
import { isApiRequestError } from "@/lib/api";
import { formatDuration } from "@/lib/format";

type WorkStatusContextValue = {
  activeStartedAt: string | null;
  pending: boolean;
  elapsed: string | null;
  toggle: () => void;
};

const WorkStatusContext = createContext<WorkStatusContextValue | null>(null);

export function WorkStatusProvider({
  startedAt,
  children,
}: {
  startedAt: string | null;
  children: React.ReactNode;
}) {
  const [activeStartedAt, setActiveStartedAt] = useState(startedAt);
  const [now, setNow] = useState<number | null>(null);
  const startWork = useStartWorkMutation();
  const endWork = useEndWorkMutation();
  const pending = startWork.isPending || endWork.isPending;

  useEffect(() => {
    setActiveStartedAt(startedAt);
  }, [startedAt]);

  useEffect(() => {
    if (!activeStartedAt) {
      setNow(null);
      return;
    }

    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeStartedAt]);

  const elapsed =
    activeStartedAt && now
      ? formatDuration(now - new Date(activeStartedAt).getTime())
      : null;

  async function toggle() {
    try {
      if (activeStartedAt) {
        await endWork.mutateAsync();
        setActiveStartedAt(null);
        toast.success("Work ended.");
        return;
      }

      const result = await startWork.mutateAsync();
      setActiveStartedAt(result.startedAt);
      toast.success("Work started.");
    } catch (error) {
      toast.error(
        isApiRequestError(error) ? error.message : "Could not update work.",
      );
    }
  }

  return (
    <WorkStatusContext.Provider
      value={{ activeStartedAt, pending, elapsed, toggle }}
    >
      {children}
    </WorkStatusContext.Provider>
  );
}

export function useWorkStatus() {
  const value = useContext(WorkStatusContext);
  if (!value) {
    throw new Error("useWorkStatus must be used within WorkStatusProvider");
  }
  return value;
}
