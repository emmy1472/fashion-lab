"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GLOBAL_NAV, isNavItemActive } from "./navigation";

export function MobileNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-sidebar/95 backdrop-blur-md border-t border-sidebar-line flex items-center justify-around z-40 px-3"
    >
      {GLOBAL_NAV.map((item) => {
        const isActive = isNavItemActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg text-xs transition-colors ${
              isActive ? "text-line font-semibold" : "text-muted hover:text-white"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-accent" : ""}`} aria-hidden />
            <span>{item.name === "Materials library" ? "Materials" : item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
