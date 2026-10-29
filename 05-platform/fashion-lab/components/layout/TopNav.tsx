"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Plus } from "lucide-react";
import { format } from "date-fns";

export function TopNav() {
  const pathname = usePathname();
  const todayFormatted = format(new Date(), "EEE, MMM d, yyyy");

  // In Design Studio (/studio), the StudioHeader acts as the authoritative top bar matching mockup
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 sticky top-0 z-20 px-8 flex items-center justify-between shadow-xs">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search designs, projects, or people..."
            className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E6E55]/20 focus:border-[#0E6E55] transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        {/* Date Display */}
        <span className="text-xs font-medium text-gray-500 hidden sm:inline-block">
          {todayFormatted}
        </span>

        {/* Notifications */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-white text-xs ring-2 ring-emerald-500/20 cursor-pointer">
          EA
        </div>

        {/* + New Design CTA Button */}
        <Link
          href="/studio"
          className="bg-[#0E6E55] hover:bg-[#09503E] active:scale-[0.98] text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Design</span>
        </Link>
      </div>
    </header>
  );
}
