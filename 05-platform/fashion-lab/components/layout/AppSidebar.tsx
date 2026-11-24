"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { ADMIN_NAV, GLOBAL_NAV, isNavItemActive, type NavItem } from "./navigation";
import { garmentStore, useGarmentProject } from "@/lib/production/store";
import { getStageById, projectHref } from "@/lib/production/stages";

interface ContinueTarget {
  href: string;
  name: string;
  stageName: string;
}

function subscribeToProjectChanges(callback: () => void) {
  const a = garmentStore.subscribe(callback);
  const b = garmentStore.subscribeSaveStatus(callback);
  return () => {
    a();
    b();
  };
}

/** The project the user last worked on. Read from local persistence on the client only. */
function useContinueTarget(): ContinueTarget | null {
  const project = useGarmentProject();
  const activeId = useSyncExternalStore(
    subscribeToProjectChanges,
    () => garmentStore.getActiveProjectId(),
    () => null
  );

  return useMemo(() => {
    if (!activeId) return null;
    const source =
      activeId === project.id
        ? { id: project.id, name: project.name, activeStage: project.activeStage }
        : garmentStore.listLocalProjects().find((p) => p.id === activeId);
    if (!source) return null;
    const stage = getStageById(source.activeStage) ?? getStageById(1)!;
    return { href: projectHref(source.id, stage.slug), name: source.name, stageName: stage.name };
  }, [activeId, project.id, project.name, project.activeStage]);
}

function NavLink({ item, isCollapsed, isActive }: { item: NavItem; isCollapsed: boolean; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.name : undefined}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
        isCollapsed ? "justify-center py-2.5" : "px-3 py-2"
      } ${
        isActive
          ? "bg-brand text-white font-medium"
          : "text-line/80 hover:bg-sidebar-line hover:text-white"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-accent"}`} aria-hidden />
      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const { isCollapsed, toggleSidebar } = useSidebar();
  const continueTarget = useContinueTarget();

  return (
    <aside
      className={`bg-sidebar text-white flex flex-col h-screen fixed left-0 top-0 z-30 select-none border-r border-sidebar-line transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {/* Brand */}
      <div className="h-14 px-3 border-b border-sidebar-line flex items-center justify-between shrink-0">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "mx-auto" : ""}`}
        >
          <div className="w-8 h-8 rounded-lg bg-brand border border-accent/40 flex items-center justify-center shrink-0">
            <span className="font-serif font-semibold text-xs text-line">FL</span>
          </div>
          {!isCollapsed && <span className="text-sm font-semibold tracking-wide truncate">Fashion-Lab</span>}
        </Link>
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg text-line/60 hover:text-white hover:bg-sidebar-line transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="pt-2 flex justify-center">
          <button
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            className="p-1.5 rounded-lg text-line/60 hover:text-white hover:bg-sidebar-line transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        <nav aria-label="Main" className="space-y-1">
          {GLOBAL_NAV.map((item) => (
            <NavLink key={item.href} item={item} isCollapsed={isCollapsed} isActive={isNavItemActive(item, pathname)} />
          ))}
        </nav>

        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-muted">Admin</div>
          )}
          <nav aria-label="Admin" className="space-y-1">
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} isCollapsed={isCollapsed} isActive={isNavItemActive(item, pathname)} />
            ))}
          </nav>
        </div>
      </div>

      {/* Continue where you left off */}
      {continueTarget && !isCollapsed && (
        <div className="p-3 border-t border-sidebar-line">
          <Link
            href={continueTarget.href}
            className="group block p-2.5 rounded-lg bg-sidebar-raised hover:bg-sidebar-line border border-sidebar-line transition-colors"
          >
            <div className="text-xs text-muted">Continue</div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{continueTarget.name}</div>
                <div className="text-xs text-accent truncate">{continueTarget.stageName}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-white shrink-0" aria-hidden />
            </div>
          </Link>
        </div>
      )}

      {/* User */}
      <div className="p-3 border-t border-sidebar-line">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} p-1.5`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-line text-ink flex items-center justify-center font-semibold text-xs shrink-0">
            EA
          </div>
          {!isCollapsed && (
            <p className="text-sm text-white truncate">Emmanuel Akinmolayan</p>
          )}
        </div>
      </div>
    </aside>
  );
}
