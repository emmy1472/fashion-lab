"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { garmentStore } from "@/lib/production/store";
import { fetchProjectList, type ProjectListItem } from "@/lib/production/projectList";
import { PROJECT_STAGES, getStageById, projectHref } from "@/lib/production/stages";

/** The project the user last opened, with where they are in its 9 stages. */
export function ContinueCard() {
  const [project, setProject] = useState<ProjectListItem | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchProjectList().then((list) => {
      if (cancelled) return;
      const activeId = garmentStore.getActiveProjectId();
      setProject(list.find((p) => p.id === activeId) ?? list[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (project === undefined) {
    return <div className="h-40 rounded-2xl bg-card border border-line animate-pulse" />;
  }
  if (project === null) return null;

  const stage = getStageById(project.active_stage) ?? PROJECT_STAGES[0];

  return (
    <section
      aria-label="Continue working"
      className="rounded-2xl bg-brand-strong text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
    >
      <div className="min-w-0">
        <p className="text-sm text-white/70">Continue working on</p>
        <h2 className="text-2xl font-semibold mt-1 truncate">{project.name}</h2>
        <p className="text-sm text-white/80 mt-1">
          Stage {stage.id} of {PROJECT_STAGES.length} · {stage.name}
        </p>

        {/* Stage position — one segment per stage */}
        <div className="flex gap-1 mt-5 max-w-md" aria-hidden>
          {PROJECT_STAGES.map((s) => (
            <span
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${s.id <= stage.id ? "bg-accent" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>

      <ButtonLink
        href={projectHref(project.id, stage.slug)}
        variant="secondary"
        className="border-transparent shrink-0"
      >
        Open {stage.name.toLowerCase()} <ArrowRight aria-hidden />
      </ButtonLink>
    </section>
  );
}
