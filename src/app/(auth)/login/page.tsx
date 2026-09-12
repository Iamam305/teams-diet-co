import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/server/auth";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/continue");
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
