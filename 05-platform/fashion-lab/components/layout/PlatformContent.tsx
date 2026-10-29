"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "./TopNav";

export function PlatformContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio");

  if (isStudio) {
    return (
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopNav />
      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
