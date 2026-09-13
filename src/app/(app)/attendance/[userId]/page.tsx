"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { Suspense, useEffect } from "react";
import { PageHeader } from "@/components/app/page-header";
import { AttendanceDetail } from "@/components/attendance/attendance-detail";
import { AttendanceDetailSkeleton } from "@/components/skeletons";
import {
  useAttendanceQuery,
  useRequireTeamActivity,
} from "@/hooks/use-queries";
import { isApiRequestError } from "@/lib/api";

export default function AttendanceMemberPage() {
  return (
    <Suspense fallback={<AttendanceDetailSkeleton />}>
      <AttendanceMemberPageInner />
    </Suspense>
  );
}

function AttendanceMemberPageInner() {
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = params.userId;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const me = useRequireTeamActivity();
  const attendance = useAttendanceQuery(userId, from, to);

  useEffect(() => {
    if (!attendance.error || !isApiRequestError(attendance.error)) {
      return;
    }

    if (attendance.error.code === "FORBIDDEN") {
      router.replace("/diet-charts");
      return;
    }

    if (attendance.error.code === "NOT_FOUND") {
      router.replace("/attendance");
    }
  }, [attendance.error, router]);

  if (me.isPending || attendance.isPending || !attendance.data) {
    return <AttendanceDetailSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Attendance log"
        description={`Work sessions from ${attendance.data.fromKey} to ${attendance.data.toKey}.`}
      />
      <AttendanceDetail attendance={attendance.data} />
    </div>
  );
}
