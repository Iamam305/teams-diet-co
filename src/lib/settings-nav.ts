import type { SettingsArea } from "@/lib/roles";

export const SETTINGS_NAV: Array<{
  href: string;
  label: string;
  area: SettingsArea | null;
}> = [
  { href: "/settings/profile", label: "Profile", area: null },
  { href: "/settings/security", label: "Security", area: null },
  {
    href: "/settings/organization",
    label: "Organization",
    area: "organization",
  },
  { href: "/settings/teams", label: "Teams", area: "teams" },
  { href: "/settings/members", label: "Members", area: "members" },
  {
    href: "/settings/invitations",
    label: "Invitations",
    area: "invitations",
  },
  { href: "/settings/activity", label: "Activity", area: "activity" },
];
