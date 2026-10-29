"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Palette,
  FolderKanban,
  MessageSquare,
  User,
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Studio", href: "/studio", icon: Palette },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Messages", href: "/messages", icon: MessageSquare, badge: 3 },
    { name: "Profile", href: "/settings", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#062D24] border-t border-[#0A3D30] flex items-center justify-around z-40 px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? "text-[#10B981]" : "text-emerald-100/60 hover:text-white"
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 mb-0.5" />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-[#10B981] text-white text-[9px] font-bold px-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
