"use client";

import { PageHeader } from "@/components/app/page-header";
import { InvitationsTable } from "@/components/org/invitations-table";
import { InviteDialog } from "@/components/org/invite-dialog";
import { SettingsTableSkeleton } from "@/components/skeletons";
import {
  useRequireSettings,
  useSettingsInvitationsQuery,
} from "@/hooks/use-queries";

export default function InvitationsSettingsPage() {
  const me = useRequireSettings("invitations");
  const query = useSettingsInvitationsQuery();

  if (me.isPending || query.isPending || !query.data) {
    return (
      <div>
        <PageHeader
          title="Invitations"
          description="Invite people with a role and team. New accounts get a temporary password they can change later."
        />
        <SettingsTableSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invitations"
        description="Invite people with a role and team. New accounts get a temporary password they can change later."
        actions={
          <InviteDialog
            teams={query.data.teams}
            actorRole={query.data.actorRole}
          />
        }
      />
      <InvitationsTable invitations={query.data.invitations} />
    </div>
  );
}
