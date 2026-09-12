"use client";

import { PageHeader } from "@/components/app/page-header";
import { OrganizationSettingsForm } from "@/components/org/organization-settings-form";
import { SettingsFormSkeleton } from "@/components/skeletons";
import {
  useRequireSettings,
  useSettingsOrganizationQuery,
} from "@/hooks/use-queries";

export default function OrganizationSettingsPage() {
  const me = useRequireSettings("organization");
  const query = useSettingsOrganizationQuery();

  if (me.isPending || query.isPending || !query.data) {
    return (
      <div>
        <PageHeader
          title="Organization"
          description="Update the name, logo, and PDF background. Only Main Admins can change these settings."
        />
        <SettingsFormSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Update the name, logo, and PDF background. Only Main Admins can change these settings."
      />
      <OrganizationSettingsForm
        key={query.data.organization.id}
        organization={query.data.organization}
      />
    </div>
  );
}
