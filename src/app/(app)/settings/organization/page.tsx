import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationSettingsForm } from "@/components/org/organization-settings-form";
import { auth } from "@/lib/auth";
import { canAccessSettings } from "@/lib/roles";
import { requireOrganization } from "@/server/auth";

export default async function OrganizationSettingsPage() {
  const { organization, member } = await requireOrganization();

  if (!canAccessSettings(member.role, "organization")) {
    redirect("/dashboard");
  }

  const allowed = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions: { organization: ["update"] } },
  });

  if (!allowed?.success) {
    redirect("/dashboard");
  }

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Update the name, logo, and PDF background. Only Main Admins can change these settings."
      />
      <OrganizationSettingsForm
        organization={{
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
          metadata: organization.metadata,
        }}
      />
    </div>
  );
}
