"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 md:hidden" />
        <DialogPrimitive.Popup
          aria-label={title}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(100%,18rem)] flex-col bg-sidebar text-sidebar-foreground shadow-lg outline-none md:hidden",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-sidebar-border px-4 py-3">
            <DialogPrimitive.Title className="truncate font-medium">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close menu"
                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                />
              }
            >
              <XIcon />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-3">{children}</div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
