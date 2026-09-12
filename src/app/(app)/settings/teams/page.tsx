"use client";

import { PageHeader } from "@/components/app/page-header";
import { TeamsManager } from "@/components/org/teams-manager";
import { SettingsTableSkeleton } from "@/components/skeletons";
import { useRequireSettings, useSettingsTeamsQuery } from "@/hooks/use-queries";
import { isMainAdmin } from "@/lib/roles";

export default function TeamsSettingsPage() {
  const me = useRequireSettings("teams");
  const query = useSettingsTeamsQuery();

  if (me.isPending || query.isPending || !query.data) {
    return (
      <div>
        <PageHeader
          title="Teams"
          description="Create, rename, and remove teams in this organization."
        />
        <SettingsTableSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Teams"
        description={
          isMainAdmin(query.data.role)
            ? "Create, rename, and remove teams in this organization."
            : "Rename the teams assigned to you."
        }
      />
      <TeamsManager teams={query.data.teams} role={query.data.role} />
    </div>
  );
}
