"use client";

import Link from "next/link";
import { Palette, Scissors, Users, FolderPlus, ArrowRight, Sparkles } from "lucide-react";

export function HeroBanner() {
  const quickActions = [
    {
      title: "Start New Design",
      desc: "Open the 2D/3D studio",
      icon: Palette,
      href: "/studio",
      iconColor: "text-[#10B981]",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Generate Pattern",
      desc: "Create using FreeSewing",
      icon: Scissors,
      href: "/measurements",
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Find Talent",
      desc: "Designers, Tailors, Models",
      icon: Users,
      href: "/marketplace",
      iconColor: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Join a Project",
      desc: "Collaborate with others",
      icon: FolderPlus,
      href: "/projects",
      iconColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Featured Editorial Promo Card */}
      <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062D24] via-[#094033] to-[#0E6E55] text-white p-8 flex flex-col justify-between shadow-sm min-h-[220px]">
        {/* Subtle patterned overlay decoration */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none flex items-center justify-center">
          <Sparkles className="w-64 h-64 text-emerald-300 transform rotate-12 translate-x-12" />
        </div>

        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981]/20 text-emerald-300 border border-emerald-400/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Fashion Studio
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Design Beyond Limits
          </h2>
          <p className="text-sm text-emerald-100/80 leading-relaxed mb-6">
            From 2D sketches to 3D previews, from custom patterns to production — Fashion-Lab has everything you need.
          </p>
        </div>

        <div className="relative z-10">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 bg-white text-[#062D24] hover:bg-emerald-50 text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <span>Explore Design Studio</span>
            <ArrowRight className="w-4 h-4 text-[#0E6E55]" />
          </Link>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-xs flex flex-col justify-between">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2.5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200/70 transition-all group"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${action.bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className={`w-4 h-4 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 group-hover:text-[#0E6E55] transition-colors leading-tight">
                    {action.title}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {action.desc}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0E6E55] group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
