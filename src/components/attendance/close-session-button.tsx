"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCloseWorkMutation } from "@/hooks/use-mutations";
import { isApiRequestError } from "@/lib/api";

export function CloseSessionButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const closeSession = useCloseWorkMutation();

  async function onClose() {
    try {
      await closeSession.mutateAsync(userId);
      toast.success(`Ended work for ${name}.`);
    } catch (error) {
      toast.error(
        isApiRequestError(error)
          ? error.message
          : "Could not close the session.",
      );
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      loading={closeSession.isPending && closeSession.variables === userId}
      onClick={onClose}
    >
      Close session
    </Button>
  );
}
