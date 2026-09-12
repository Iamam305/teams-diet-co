"use client";

import { PageHeader } from "@/components/app/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { SettingsFormSkeleton } from "@/components/skeletons";
import { useMeQuery } from "@/hooks/use-queries";

export default function ProfileSettingsPage() {
  const me = useMeQuery();

  if (me.isPending || !me.data) {
    return (
      <div>
        <PageHeader
          title="Profile"
          description="Update how your name appears across Team Diet Co."
        />
        <SettingsFormSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Update how your name appears across Team Diet Co."
      />
      <ProfileForm
        key={`${me.data.user.name}-${me.data.user.username ?? ""}`}
        name={me.data.user.name}
        username={me.data.user.username ?? ""}
      />
    </div>
  );
}
