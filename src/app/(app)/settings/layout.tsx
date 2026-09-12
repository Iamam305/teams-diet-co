"use client";

import type { ReactNode } from "react";
import { SettingsNav } from "@/components/app/settings-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeQuery } from "@/hooks/use-queries";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { data: me, isPending } = useMeQuery();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 md:hidden">
        {isPending || !me ? (
          <Skeleton className="h-11 w-full rounded-xl" />
        ) : (
          <SettingsNav role={me.role} />
        )}
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
        {children}
      </div>
    </div>
  );
}
