import type { ReactNode } from "react";

export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none print:animate-none">
      {children}
    </div>
  );
}
