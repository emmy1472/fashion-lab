"use client";

import { useSidebar } from "./SidebarContext";

export function SidebarSpacer() {
  const { isCollapsed } = useSidebar();
  return (
    <div
      className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[68px]" : "w-60"
      }`}
    />
  );
}
