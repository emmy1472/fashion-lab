"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  FolderKanban,
  ShoppingBag,
  MessageSquare,
  Users,
  Ruler,
  Scissors,
  UserCog,
  ShieldCheck,
  Settings,
  Sparkles,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const mainNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Design Studio", href: "/studio", icon: Palette },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Messages", href: "/messages", icon: MessageSquare, badge: 3 },
  { name: "Talent", href: "/marketplace/talent", icon: Users },
  { name: "Measurements", href: "/measurements", icon: Ruler },
  { name: "Production", href: "/production", icon: Scissors },
];

const adminNav: NavItem[] = [
  { name: "Users", href: "/admin/users", icon: UserCog },
  { name: "Verification", href: "/admin/verification", icon: ShieldCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#062D24] text-white flex flex-col h-screen fixed left-0 top-0 z-30 select-none border-r border-[#083A2E]">
      {/* Brand Header */}
      <div className="px-4 py-4 border-b border-[#0A3D30]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10B981] to-[#0E6E55] flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-base font-bold tracking-tight text-white block leading-tight">
              Fashion-Lab
            </span>
            <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-medium block truncate">
              Design · Create · Collaborate
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Main Section */}
        <div>
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#0E4B3D] text-white shadow-xs font-semibold"
                      : "text-emerald-100/70 hover:bg-[#0A3A2F] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-[#10B981]" : "text-emerald-300/60"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="bg-[#10B981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Section */}
        <div>
          <h4 className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/60 px-3 mb-1.5">
            Admin
          </h4>
          <nav className="space-y-0.5">
            {adminNav.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#0E4B3D] text-white font-semibold"
                      : "text-emerald-100/70 hover:bg-[#0A3A2F] hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#10B981]" : "text-emerald-300/60"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Profile Pill */}
      <div className="p-3 border-t border-[#0A3D30] bg-[#04211A]/50">
        <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#0A3A2F] transition-colors cursor-pointer">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-white text-[11px] ring-2 ring-[#10B981]/50">
              EA
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#062D24]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate leading-tight">
              Emmanuel Akinmolayan
            </p>
            <p className="text-[10px] text-emerald-300/80 truncate">Designer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
