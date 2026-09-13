"use client";

import { PageHeader } from "@/components/app/page-header";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default function SecuritySettingsPage() {
  return (
    <div>
      <PageHeader
        title="Security"
        description="Change the password you use to sign in."
      />
      <ChangePasswordForm />
    </div>
  );
}
