"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { fetchProjectList, type ProjectListItem } from "@/lib/production/projectList";
import { formatGarmentCategory, getStageById, projectHref } from "@/lib/production/stages";
import { Card, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export function RecentProjects() {
  const [projects, setProjects] = useState<ProjectListItem[] | null>(null);

  useEffect(() => {
    fetchProjectList().then((list) => setProjects(list.slice(0, 4)));
  }, []);

  return (
    <Card className="p-6">
      <CardHeader
        className="mb-5"
        title="Recent projects"
        actions={
          <Link href="/projects" className="text-sm font-medium text-brand hover:underline flex items-center gap-1">
            View all <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      />

      {projects === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-ink-2">No projects yet.</p>
          <ButtonLink href="/projects?new=1" size="sm" className="mt-3">
            <Plus aria-hidden /> New project
          </ButtonLink>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map((p) => {
            const stage = getStageById(p.active_stage);
            return (
              <li key={p.id}>
                <Link
                  href={projectHref(p.id)}
                  className="group block rounded-xl border border-line p-4 hover:border-brand/40 hover:shadow-sm transition"
                >
                  <div className="text-sm font-semibold text-ink group-hover:text-brand truncate">
                    {p.name}
                  </div>
                  <div className="mt-1 text-xs text-ink-2 flex items-center gap-1.5">
                    <span>{formatGarmentCategory(p.garment_category)}</span>
                    {stage && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{stage.name}</span>
                      </>
                    )}
                    <span aria-hidden>·</span>
                    <span>
                      {new Date(p.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
