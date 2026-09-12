"use client";

import { PageHeader } from "@/components/app/page-header";
import { RosterList } from "@/components/attendance/roster-list";
import {
  PageHeaderSkeleton,
  QueryError,
  RosterListSkeleton,
} from "@/components/skeletons";
import { useRequireTeamActivity, useRosterQuery } from "@/hooks/use-queries";

export default function AttendancePage() {
  const me = useRequireTeamActivity();
  const roster = useRosterQuery();

  if (me.isPending || roster.isPending || !me.data) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeaderSkeleton />
        <RosterListSkeleton />
      </div>
    );
  }

  if (roster.isError) {
    return (
      <div className="mx-auto max-w-5xl">
        <QueryError message="Could not load attendance." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Attendance"
        description="Hours and workdays this week, with a full punch log for each person."
      />
      <RosterList people={roster.data ?? []} mode="attendance" />
    </div>
  );
}
