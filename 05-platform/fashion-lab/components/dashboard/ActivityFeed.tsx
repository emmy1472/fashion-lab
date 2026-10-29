"use client";

import { MessageSquare, RefreshCw, ThumbsUp, Mail } from "lucide-react";

interface ActivityItem {
  id: string;
  user: string;
  initials: string;
  avatarBg: string;
  action: string;
  target?: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
}

const activities: ActivityItem[] = [
  {
    id: "act-1",
    user: "Amina Yusuf",
    initials: "AY",
    avatarBg: "bg-emerald-600",
    action: "commented on your design",
    target: "Urban Jacket",
    time: "2 hours ago",
    icon: MessageSquare,
    iconColor: "text-emerald-500",
  },
  {
    id: "act-2",
    user: "Project System",
    initials: "PS",
    avatarBg: "bg-blue-600",
    action: "Project 'Urban Jacket Collection' moved to",
    target: "Production",
    time: "4 hours ago",
    icon: RefreshCw,
    iconColor: "text-blue-500",
  },
  {
    id: "act-3",
    user: "Tunde Bello",
    initials: "TB",
    avatarBg: "bg-amber-600",
    action: "liked your post in the marketplace",
    time: "5 hours ago",
    icon: ThumbsUp,
    iconColor: "text-amber-500",
  },
  {
    id: "act-4",
    user: "Sarah Johnson",
    initials: "SJ",
    avatarBg: "bg-purple-600",
    action: "sent a new commission inquiry",
    time: "1 day ago",
    icon: Mail,
    iconColor: "text-purple-500",
  },
];

export function ActivityFeed() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-xs">
      <h3 className="text-base font-bold text-gray-900 mb-1">Your Activity</h3>
      <p className="text-xs text-gray-500 mb-5">Latest team and project updates</p>

      <div className="space-y-4">
        {activities.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="flex items-start gap-3.5 group">
              <div
                className={`w-9 h-9 rounded-full ${a.avatarBg} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ring-2 ring-white`}
              >
                {a.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-900 leading-snug">
                  <span className="font-bold">{a.user} </span>
                  <span className="text-gray-600">{a.action} </span>
                  {a.target && (
                    <span className="font-semibold text-[#0E6E55]">
                      {a.target}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Icon className={`w-3 h-3 ${a.iconColor}`} />
                  <span className="text-[11px] text-gray-400">{a.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
