import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireVerifiedEmail, userMustChangePassword } from "@/server/auth";

export default async function ChangePasswordPage() {
  const session = await requireVerifiedEmail();

  if (!(await userMustChangePassword(session.user.id))) {
    redirect("/continue");
  }

  return <ChangePasswordForm required />;
}
