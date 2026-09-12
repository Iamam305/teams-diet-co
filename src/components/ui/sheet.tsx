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
        <DialogPrimitive.Backdrop
          data-slot="overlay-backdrop"
          className="fixed inset-0 z-50 bg-black/40 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none motion-reduce:transition-none md:hidden"
        />
        <DialogPrimitive.Popup
          data-slot="overlay-popup"
          aria-label={title}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(100%,18rem)] flex-col bg-sidebar text-sidebar-foreground shadow-lg outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-left data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-left motion-reduce:animate-none motion-reduce:transition-none md:hidden",
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
