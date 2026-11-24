import Link from "next/link";
import { ArrowRight, FolderPlus, FolderKanban, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";

const actions = [
  { title: "New project", desc: "Start a garment from measurements", icon: FolderPlus, href: "/projects?new=1" },
  { title: "All projects", desc: "Browse and manage your garments", icon: FolderKanban, href: "/projects" },
  { title: "Materials library", desc: "Fabrics and how they behave", icon: Layers, href: "/materials" },
];

export function QuickActions() {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-ink mb-3">Quick actions</h2>
      <ul className="space-y-1">
        {actions.map(({ title, desc, icon: Icon, href }) => (
          <li key={title}>
            <Link href={href} className="group flex items-center gap-3 p-2.5 -mx-2.5 rounded-lg hover:bg-surface transition-colors">
              <span className="size-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-ink">{title}</span>
                <span className="block text-xs text-ink-2 truncate">{desc}</span>
              </span>
              <ArrowRight className="size-4 text-muted group-hover:text-brand transition-colors" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
