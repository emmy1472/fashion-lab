"use client";

import { ArrowUpRight } from "lucide-react";

interface Metric {
  title: string;
  value: string;
  change: string;
  period: string;
}

const metrics: Metric[] = [
  {
    title: "Total Projects",
    value: "12",
    change: "+ 20%",
    period: "vs last 30 days",
  },
  {
    title: "Active Collaborations",
    value: "5",
    change: "+ 25%",
    period: "vs last 30 days",
  },
  {
    title: "Marketplace Views",
    value: "248",
    change: "+ 32%",
    period: "vs last 30 days",
  },
  {
    title: "Earnings (This Month)",
    value: "$1,240",
    change: "+ 18%",
    period: "vs last 30 days",
  },
];

export function MetricCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.title}
          className="bg-white rounded-2xl p-5 border border-gray-200/70 shadow-xs hover:shadow-sm transition"
        >
          <p className="text-xs font-medium text-gray-500 mb-2">{m.title}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              {m.value}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#0E6E55] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 text-[#10B981]" />
              {m.change}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{m.period}</p>
        </div>
      ))}
    </div>
  );
}
