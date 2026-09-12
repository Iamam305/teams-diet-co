import { PageHeader } from "@/components/app/page-header";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireOrganization } from "@/server/auth";

export default async function SecuritySettingsPage() {
  await requireOrganization();

  return (
    <div>
      <PageHeader
        title="Security"
        description="Change the password you use to sign in."
      />
      <ChangePasswordForm embedded />
    </div>
  );
}
