"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ADMIN_NAV, GLOBAL_NAV, isNavItemActive } from "./navigation";

/** Top bar for global (non-project) pages. Inside a project the ProjectShell header is used instead. */
export function TopNav() {
  const pathname = usePathname() ?? "";
  const current = [...GLOBAL_NAV, ...ADMIN_NAV].find((item) => isNavItemActive(item, pathname));

  return (
    <header className="h-14 bg-card border-b border-line sticky top-0 z-20 px-4 sm:px-6 md:px-8 flex items-center justify-between gap-4">
      <span className="text-[15px] font-semibold text-ink truncate">{current?.name ?? "Fashion-Lab"}</span>
      {pathname !== "/projects" && (
        <ButtonLink href="/projects?new=1" size="sm">
          <Plus aria-hidden /> New project
        </ButtonLink>
      )}
    </header>
  );
}
