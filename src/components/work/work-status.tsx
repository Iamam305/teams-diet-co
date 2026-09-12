"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { formatDuration } from "@/lib/format";
import { endWorkAction, startWorkAction } from "@/server/work";

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
  const [pending, startTransition] = useTransition();

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

  function toggle() {
    startTransition(async () => {
      if (activeStartedAt) {
        const result = await endWorkAction();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setActiveStartedAt(null);
        toast.success("Work ended.");
        return;
      }

      const result = await startWorkAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setActiveStartedAt(result.startedAt);
      toast.success("Work started.");
    });
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
