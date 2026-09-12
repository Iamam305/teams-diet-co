"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardListIcon,
  ClockIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShellSkeleton } from "@/components/skeletons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet } from "@/components/ui/sheet";
import { WorkStatusProvider } from "@/components/work/work-status";
import { WorkToggle } from "@/components/work/work-toggle";
import { useLogoutWorkMutation } from "@/hooks/use-mutations";
import { useAuthGate } from "@/hooks/use-queries";
import { authClient } from "@/lib/auth-client";
import { canViewTeamActivity } from "@/lib/diet-access";
import { canAccessSettings, getPrimaryRoleLabel } from "@/lib/roles";
import { SETTINGS_NAV } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

const allNav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    match: "/dashboard",
    icon: LayoutDashboardIcon,
    adminOnly: true,
  },
  {
    href: "/diet-charts",
    label: "Diet Charts",
    shortLabel: "Charts",
    match: "/diet-charts",
    icon: ClipboardListIcon,
    adminOnly: false,
  },
  {
    href: "/attendance",
    label: "Attendance",
    shortLabel: "Attendance",
    match: "/attendance",
    icon: ClockIcon,
    adminOnly: true,
  },
  {
    href: "/settings/profile",
    label: "Settings",
    shortLabel: "Settings",
    match: "/settings",
    icon: SettingsIcon,
    adminOnly: false,
  },
] as const;

function primaryNav(role: string) {
  return allNav.filter((item) => !item.adminOnly || canViewTeamActivity(role));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending } = useAuthGate();
  const logoutWork = useLogoutWorkMutation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname) {
      setMenuOpen(false);
    }
  }, [pathname]);

  if (isPending || !data) {
    return <AppShellSkeleton />;
  }

  const { user, role, branding, workStartedAt } = data;
  const navItems = primaryNav(role);
  const settingsItems = SETTINGS_NAV.filter(
    (item) => !item.area || canAccessSettings(role, item.area),
  );

  async function signOut() {
    await logoutWork.mutateAsync();
    await authClient.signOut();
    queryClient.clear();
    toast.success("Signed out.");
    router.replace("/login");
  }

  function navClass(active: boolean, isSettings = false) {
    return cn(
      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      active &&
        !isSettings &&
        "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
      isSettings && active && "font-medium text-sidebar-accent-foreground",
    );
  }

  const brand = (
    <div className="flex min-w-0 items-center gap-2.5">
      {branding.logo ? (
        // biome-ignore lint/performance/noImgElement: org logo is a stored data URL
        <img
          src={branding.logo}
          alt=""
          className="size-9 shrink-0 rounded-lg bg-sidebar-accent object-contain p-1"
        />
      ) : (
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sm font-semibold text-sidebar-primary">
          {branding.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium">{branding.name}</p>
        <p className="text-xs text-sidebar-foreground/65">
          {getPrimaryRoleLabel(role)}
        </p>
      </div>
    </div>
  );

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isSettings = item.match === "/settings";
        const active = pathname.startsWith(item.match);

        return (
          <div key={item.href} className="flex flex-col gap-1">
            <Link href={item.href} className={navClass(active, isSettings)}>
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
                      "rounded-lg px-2.5 py-1.5 text-sm text-sidebar-foreground/70 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
  );

  return (
    <WorkStatusProvider startedAt={workStartedAt}>
      <div className="relative z-10 flex min-h-svh">
        <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground print:hidden md:flex md:flex-col">
          <div className="border-b border-sidebar-border px-4 py-4">
            {brand}
          </div>
          <div className="flex-1 overflow-y-auto p-3">{navLinks}</div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur-md print:hidden md:px-6">
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-muted"
                onClick={() => setMenuOpen(true)}
              >
                <MenuIcon className="size-4" />
              </button>
              <p className="min-w-0 truncate font-medium">{branding.name}</p>
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <WorkToggle />
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 max-w-[7.5rem] items-center truncate rounded-lg border border-border bg-card px-2.5 text-sm transition-colors duration-200 hover:bg-muted sm:max-w-none">
                  {user.name}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user.email}
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
          <main className="flex-1 px-4 py-6 pb-24 print:p-0 md:px-8 md:pb-6">
            {children}
          </main>
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] print:hidden md:hidden">
            <div className="grid auto-cols-fr grid-flow-col">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.match);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-2 text-[11px] transition-colors duration-200",
                      active
                        ? "font-medium text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.shortLabel}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen} title={branding.name}>
          <div className="mb-4 px-1 text-xs text-sidebar-foreground/65">
            {getPrimaryRoleLabel(role)}
          </div>
          {navLinks}
        </Sheet>
      </div>
    </WorkStatusProvider>
  );
}
