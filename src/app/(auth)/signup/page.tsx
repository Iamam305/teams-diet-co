import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getSession } from "@/server/auth";

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <SignupForm />;
}
