"use client";

import Link from "next/link";
import { ArrowRight, Layers, Eye } from "lucide-react";

interface Project {
  id: string;
  title: string;
  type: string;
  status: "In Progress" | "In Review" | "Approved";
  previewGradient: string;
  garmentIcon: string;
}

const projects: Project[] = [
  {
    id: "proj-1",
    title: "Urban Jacket Collection",
    type: "Design + 3D",
    status: "In Progress",
    previewGradient: "from-emerald-900 via-teal-950 to-slate-900",
    garmentIcon: "🧥",
  },
  {
    id: "proj-2",
    title: "Summer Dress Line",
    type: "Design + Pattern",
    status: "In Review",
    previewGradient: "from-amber-900 via-stone-900 to-slate-900",
    garmentIcon: "👗",
  },
  {
    id: "proj-3",
    title: "Streetwear Brand",
    type: "Design + 3D",
    status: "In Progress",
    previewGradient: "from-blue-950 via-slate-900 to-zinc-900",
    garmentIcon: "👕",
  },
  {
    id: "proj-4",
    title: "Corporate Uniforms",
    type: "Production",
    status: "Approved",
    previewGradient: "from-gray-900 via-slate-950 to-black",
    garmentIcon: "👔",
  },
];

export function RecentProjects() {
  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#0E6E55] border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            In Progress
          </span>
        );
      case "In Review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            In Review
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-[#062D24] border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E6E55]" />
            Approved
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900">Recent Projects</h3>
          <p className="text-xs text-gray-500">Your ongoing fashion workflows</p>
        </div>
        <Link
          href="/projects"
          className="text-xs font-semibold text-[#0E6E55] hover:text-[#09503E] flex items-center gap-1 group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="group block rounded-xl border border-gray-200/80 p-3 hover:border-[#0E6E55]/40 hover:shadow-md transition-all bg-white"
          >
            {/* Thumbnail Canvas Area */}
            <div
              className={`h-36 rounded-lg bg-gradient-to-br ${p.previewGradient} flex items-center justify-center relative overflow-hidden mb-3 group-hover:scale-[1.02] transition-transform`}
            >
              <span className="text-5xl select-none filter drop-shadow-lg">
                {p.garmentIcon}
              </span>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[10px] text-white flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>{p.type}</span>
              </div>
            </div>

            {/* Content Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#0E6E55] transition-colors truncate">
                {p.title}
              </h4>
              <div className="flex items-center justify-between pt-1">
                {getStatusBadge(p.status)}
                <span className="text-gray-400 group-hover:text-[#0E6E55] transition-colors">
                  <Eye className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
