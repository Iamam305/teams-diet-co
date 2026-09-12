import { Skeleton } from "@/components/ui/skeleton";

const THREE = ["one", "two", "three"] as const;
const FOUR = ["one", "two", "three", "four"] as const;
const FIVE = ["one", "two", "three", "four", "five"] as const;
const SIX = ["one", "two", "three", "four", "five", "six"] as const;
const SEVEN = ["one", "two", "three", "four", "five", "six", "seven"] as const;

export function AppShellSkeleton() {
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r border-sidebar-border bg-sidebar p-3 md:block">
        <div className="flex items-center gap-2.5 px-1 py-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
          <Skeleton className="h-8 w-32 md:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-8">
          <PageBodySkeleton />
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function PageBodySkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-3">
        {THREE.map((id) => (
          <Skeleton key={id} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeaderSkeleton />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {THREE.map((id) => (
          <Skeleton key={id} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mb-3 h-6 w-32" />
      <RosterListSkeleton />
      <Skeleton className="mt-8 mb-3 h-6 w-36" />
      <div className="space-y-0 overflow-hidden rounded-xl border">
        {FIVE.map((id) => (
          <div key={id} className="border-b px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RosterListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="space-y-3 md:hidden">
        {FOUR.map((id) => (
          <Skeleton key={id} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        {SIX.map((id) => (
          <div
            key={id}
            className="flex items-center gap-4 border-b px-4 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DietChartsListSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeaderSkeleton />
      <div className="space-y-3 md:hidden">
        {FOUR.map((id) => (
          <Skeleton key={id} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        {SIX.map((id) => (
          <div
            key={id}
            className="grid grid-cols-4 gap-4 border-b px-4 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DietChartEditorSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {FOUR.map((id) => (
          <Skeleton key={id} className="h-16 rounded-lg" />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {SEVEN.map((id) => (
          <Skeleton key={id} className="h-7 w-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export function AttendanceDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-36 rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FOUR.map((id) => (
          <Skeleton key={id} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
  );
}

export function SettingsTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {FOUR.map((id) => (
          <Skeleton key={id} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="hidden space-y-3 md:block">
        {SIX.map((id) => (
          <div key={id} className="flex items-center gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QueryError({
  message = "Could not load this page.",
}: {
  message?: string;
}) {
  return (
    <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
      {message}
    </p>
  );
}

export function SettingsFormSkeleton() {
  return (
    <div className="max-w-lg space-y-4">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
  );
}
