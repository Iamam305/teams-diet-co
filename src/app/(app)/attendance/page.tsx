import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { RosterList } from "@/components/attendance/roster-list";
import { canViewTeamActivity, homePathForRole } from "@/lib/diet-access";
import { requireOrganization } from "@/server/auth";
import { listTeamRoster } from "@/server/work";

export default async function AttendancePage() {
  const { member } = await requireOrganization();

  if (!canViewTeamActivity(member.role)) {
    redirect(homePathForRole(member.role));
  }

  const people = await listTeamRoster();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Attendance"
        description="Hours and workdays this week, with a full punch log for each person."
      />
      <RosterList people={people} mode="attendance" />
    </div>
  );
}
