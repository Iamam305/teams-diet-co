"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { subscribeNavigationProgress } from "@/lib/navigation-progress";

type ProgressState = "idle" | "loading" | "finishing";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProgressState>("idle");
  const [width, setWidth] = useState(0);
  const location = `${pathname}?${searchParams.toString()}`;
  const locationRef = useRef(location);

  useEffect(() => {
    return subscribeNavigationProgress(() => {
      setWidth(0);
      setState("loading");
    });
  }, []);

  useEffect(() => {
    if (state !== "loading") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setWidth(90);
    });

    const timeout = window.setTimeout(() => {
      setState("finishing");
    }, 8000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [state]);

  useEffect(() => {
    if (locationRef.current === location) {
      return;
    }

    locationRef.current = location;

    if (state === "loading") {
      setState("finishing");
    }
  }, [location, state]);

  useEffect(() => {
    if (state !== "finishing") {
      return;
    }

    setWidth(100);
    const timeout = window.setTimeout(() => {
      setState("idle");
      setWidth(0);
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [state]);

  if (state === "idle") {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-100"
    >
      <div
        className="h-0.5 origin-left bg-primary shadow-[0_0_8px] shadow-primary/80 transition-[width,opacity] duration-400 ease-out"
        style={{
          width: `${width}%`,
          opacity: state === "finishing" ? 0 : 1,
        }}
      />
    </div>
  );
}
