"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { canAccessSettings } from "@/lib/roles";
import { SETTINGS_NAV } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

export function SettingsNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = SETTINGS_NAV.filter(
    (item) => !item.area || canAccessSettings(role, item.area),
  );

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground",
            pathname === item.href &&
              "bg-primary font-medium text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
