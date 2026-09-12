import { PageHeader } from "@/components/app/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { requireOrganization } from "@/server/auth";

export default async function ProfileSettingsPage() {
  const { session } = await requireOrganization();

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Update how your name appears across Team Diet Co."
      />
      <ProfileForm
        name={session.user.name}
        username={session.user.username ?? ""}
      />
    </div>
  );
}
