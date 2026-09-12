"use client";

import { useParams } from "next/navigation";
import { InvitationCard } from "@/components/auth/invitation-card";
import { SettingsFormSkeleton } from "@/components/skeletons";
import { usePublicInvitationQuery } from "@/hooks/use-queries";

export default function InvitePage() {
  const params = useParams<{ id: string }>();
  const query = usePublicInvitationQuery(params.id);

  if (query.isPending || !query.data) {
    return <SettingsFormSkeleton />;
  }

  return (
    <InvitationCard
      signedIn={query.data.signedIn}
      invitation={query.data.invitation}
    />
  );
}
