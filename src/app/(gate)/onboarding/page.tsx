"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OnboardingForm } from "@/components/org/onboarding-form";
import { SettingsTableSkeleton } from "@/components/skeletons";
import { useMeQuery, useMyInvitationsQuery } from "@/hooks/use-queries";
import { isApiRequestError } from "@/lib/api";
import { homePathForRole } from "@/lib/diet-access";

export default function OnboardingPage() {
  const router = useRouter();
  const me = useMeQuery();
  const query = useMyInvitationsQuery();

  useEffect(() => {
    if (me.data) {
      router.replace(homePathForRole(me.data.role));
    }
  }, [me.data, router]);

  useEffect(() => {
    if (!query.error || !isApiRequestError(query.error)) {
      return;
    }

    if (query.error.code === "UNAUTHENTICATED") {
      router.replace("/login");
      return;
    }

    if (query.error.code === "EMAIL_UNVERIFIED") {
      router.replace("/verify-email");
      return;
    }

    if (query.error.code === "PASSWORD_CHANGE_REQUIRED") {
      router.replace("/change-password");
    }
  }, [query.error, router]);

  if (me.isPending || me.data || query.isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <SettingsTableSkeleton />
      </div>
    );
  }

  return <OnboardingForm invitations={query.data ?? []} />;
}
