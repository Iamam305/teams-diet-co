import type { ReactNode } from "react";
import { SettingsNav } from "@/components/app/settings-nav";
import { requireOrganization } from "@/server/auth";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { member } = await requireOrganization();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 md:hidden">
        <SettingsNav role={member.role} />
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
        {children}
      </div>
    </div>
  );
}
