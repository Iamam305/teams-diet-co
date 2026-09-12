"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { closeWorkSessionAction } from "@/server/work";

export function CloseSessionButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function closeSession() {
    setPending(true);
    const result = await closeWorkSessionAction(userId);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Ended work for ${name}.`);
    router.refresh();
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={closeSession}
    >
      {pending ? "Closing..." : "Close session"}
    </Button>
  );
}
