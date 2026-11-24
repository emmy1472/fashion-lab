import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Settings,
  UserCog,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Global destinations only. Per-garment work (measurements, design, production, fitting,
 * showroom) lives inside a project — see lib/production/stages.ts.
 */
export const GLOBAL_NAV: NavItem[] = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Materials library", href: "/materials", icon: Layers },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { name: "Users", href: "/admin/users", icon: UserCog },
  { name: "Verification", href: "/admin/verification", icon: ShieldCheck },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
}
