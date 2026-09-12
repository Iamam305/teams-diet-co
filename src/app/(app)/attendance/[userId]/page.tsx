import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { AttendanceDetail } from "@/components/attendance/attendance-detail";
import { resolveAttendanceRange } from "@/lib/attendance";
import { canViewTeamActivity, homePathForRole } from "@/lib/diet-access";
import { requireOrganization } from "@/server/auth";
import { getMemberAttendance } from "@/server/work";

export default async function AttendanceMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { member } = await requireOrganization();

  if (!canViewTeamActivity(member.role)) {
    redirect(homePathForRole(member.role));
  }

  const { userId } = await params;
  const query = await searchParams;
  const range = resolveAttendanceRange(query.from, query.to);
  const attendance = await getMemberAttendance({
    userId,
    from: range.from,
    to: range.to,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Attendance log"
        description={`Work sessions from ${range.fromKey} to ${range.toKey}.`}
      />
      <AttendanceDetail attendance={attendance} />
    </div>
  );
}
