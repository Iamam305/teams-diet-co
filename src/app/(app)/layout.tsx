import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { parseOrgBranding } from "@/lib/org-branding";
import { requireOrganization } from "@/server/auth";
import { getActiveWorkSession } from "@/server/work";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { session, organization, member } = await requireOrganization();
  const workSession = await getActiveWorkSession(session.user.id);
  const branding = parseOrgBranding(organization);

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      organizationName={branding.name}
      organizationLogo={branding.logo}
      role={member.role}
      workStartedAt={workSession?.startedAt.toISOString() ?? null}
    >
      {children}
    </AppShell>
  );
}
