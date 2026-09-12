"use client";

import { PageHeader } from "@/components/app/page-header";
import { MembersManager } from "@/components/org/members-manager";
import { SettingsTableSkeleton } from "@/components/skeletons";
import {
  useRequireSettings,
  useSettingsMembersQuery,
} from "@/hooks/use-queries";

export default function MembersSettingsPage() {
  const me = useRequireSettings("members");
  const query = useSettingsMembersQuery();

  if (me.isPending || query.isPending || !query.data) {
    return (
      <div>
        <PageHeader
          title="Members"
          description="Manage roles and team assignments."
        />
        <SettingsTableSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Members"
        description="Manage roles and team assignments."
      />
      <MembersManager
        actorRole={query.data.actorRole}
        actorUserId={query.data.actorUserId}
        members={query.data.members}
        teams={query.data.teams}
        teamMembers={query.data.teamMembers}
      />
    </div>
  );
}
