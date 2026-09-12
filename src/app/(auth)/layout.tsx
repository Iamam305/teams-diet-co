import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-full flex-1 items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}
