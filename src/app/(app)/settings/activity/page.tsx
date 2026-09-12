"use client";

import { PageHeader } from "@/components/app/page-header";
import { ActivityTable } from "@/components/settings/activity-table";
import { SettingsTableSkeleton } from "@/components/skeletons";
import { useActivityQuery, useRequireSettings } from "@/hooks/use-queries";

export default function ActivitySettingsPage() {
  const me = useRequireSettings("activity");
  const query = useActivityQuery();

  if (me.isPending || query.isPending) {
    return (
      <div>
        <PageHeader
          title="Activity"
          description="Login, work, and diet chart activity for people you can manage."
        />
        <SettingsTableSkeleton />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div>
        <PageHeader
          title="Activity"
          description="Login, work, and diet chart activity for people you can manage."
        />
        <p className="text-sm text-muted-foreground">
          Could not load activity.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Login, work, and diet chart activity for people you can manage."
      />
      <ActivityTable rows={query.data ?? []} />
    </div>
  );
}
