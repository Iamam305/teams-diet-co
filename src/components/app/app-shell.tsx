"use client";

import {
  ClipboardListIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkStatusProvider } from "@/components/work/work-status";
import { WorkToggle } from "@/components/work/work-toggle";
import { authClient } from "@/lib/auth-client";
import { canAccessSettings, getPrimaryRoleLabel } from "@/lib/roles";
import { SETTINGS_NAV } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";
import { recordLogoutAction } from "@/server/work";

const primaryNav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    match: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/diet-charts",
    label: "Diet Charts",
    match: "/diet-charts",
    icon: ClipboardListIcon,
  },
  {
    href: "/settings/profile",
    label: "Settings",
    match: "/settings",
    icon: SettingsIcon,
  },
];

export function AppShell({
  children,
  userName,
  userEmail,
  organizationName,
  organizationLogo,
  role,
  workStartedAt,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  organizationName: string;
  organizationLogo: string | null;
  role: string;
  workStartedAt: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await recordLogoutAction();
    await authClient.signOut();
    toast.success("Signed out.");
    router.replace("/login");
    router.refresh();
  }

  const settingsItems = SETTINGS_NAV.filter(
    (item) => !item.area || canAccessSettings(role, item.area),
  );

  return (
    <WorkStatusProvider startedAt={workStartedAt}>
      <div className="relative z-10 flex min-h-svh">
        <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground print:hidden md:flex md:flex-col">
          <div className="border-b border-sidebar-border px-4 py-4">
            <div className="flex items-center gap-2.5">
              {organizationLogo ? (
                // biome-ignore lint/performance/noImgElement: org logo is a stored data URL
                <img
                  src={organizationLogo}
                  alt=""
                  className="size-9 rounded-lg bg-sidebar-accent object-contain p-1"
                />
              ) : (
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-sidebar-accent text-sm font-semibold text-sidebar-primary">
                  {organizationName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{organizationName}</p>
                <p className="text-xs text-sidebar-foreground/65">
                  {getPrimaryRoleLabel(role)}
                </p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isSettings = item.match === "/settings";
              const active = pathname.startsWith(item.match);

              return (
                <div key={item.href} className="flex flex-col gap-1">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active &&
                        !isSettings &&
                        "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                      isSettings &&
                        active &&
                        "font-medium text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" />
                    {item.label}
                  </Link>
                  {isSettings && active ? (
                    <div className="mb-1 ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
                      {settingsItems.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "rounded-lg px-2.5 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            pathname === sub.href &&
                              "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                          )}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur-md print:hidden md:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Open menu"
                  className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                >
                  <MenuIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {primaryNav.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => router.push(item.href)}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {settingsItems.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => router.push(item.href)}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="font-medium">{organizationName}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <WorkToggle />
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 items-center rounded-lg border border-border bg-card px-2.5 text-sm hover:bg-muted">
                  {userName}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {userEmail}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/settings/profile")}
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 print:p-0 md:px-8">{children}</main>
        </div>
      </div>
    </WorkStatusProvider>
  );
}
