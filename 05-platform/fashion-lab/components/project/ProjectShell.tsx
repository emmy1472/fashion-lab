'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FileText, Loader2 } from 'lucide-react';
import {
  garmentStore,
  useGarmentProject,
  useGarmentSaveStatus,
} from '@/lib/production/store';
import type { GarmentProject } from '@/lib/production/types';
import {
  PROJECT_STAGES,
  STAGE_PHASES,
  getStageBySlug,
  formatGarmentCategory,
  projectHref,
  type ProjectStage,
} from '@/lib/production/stages';
import { TechPackModal } from '@/components/production/TechPackModal';
import { Button, ButtonLink } from '@/components/ui/button';

/** Stages whose completion can be derived from real project data. */
function isStageComplete(stage: ProjectStage, project: GarmentProject): boolean {
  switch (stage.slug) {
    case 'trims':
      return project.components.length > 0 && project.components.every((c) => c.status === 'ready');
    case 'assembly':
      return project.assemblySequence.length > 0 && project.assemblySequence.every((s) => s.completed);
    case 'finishing':
      return (
        project.finishing.inspectionChecklist.length > 0 &&
        project.finishing.inspectionChecklist.every((i) => i.verified)
      );
    default:
      return false;
  }
}

function SaveIndicator() {
  const save = useGarmentSaveStatus();

  if (save.status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }
  if (save.status === 'error') {
    return (
      <span className="text-xs font-medium text-danger" title={save.syncError ?? undefined}>
        Couldn&apos;t save
      </span>
    );
  }
  if (save.isDirty) {
    return <span className="text-xs text-ink-2">Unsaved changes</span>;
  }
  if (save.status === 'saved') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-ink-2"
        title={save.lastSavedAt ? `Last saved ${new Date(save.lastSavedAt).toLocaleString()}` : undefined}
      >
        <Check className="w-3.5 h-3.5 text-brand" aria-hidden />
        Saved
      </span>
    );
  }
  return null;
}

export function ProjectShell({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const project = useGarmentProject();
  const segment = useSelectedLayoutSegment();
  const currentStage = getStageBySlug(segment);
  const [missingId, setMissingId] = useState<string | null>(null);
  const [isTechPackOpen, setIsTechPackOpen] = useState(false);

  // `project` is read above so this re-evaluates whenever the store changes.
  const isReady = project.id === projectId && garmentStore.isLoaded(projectId);
  const isMissing = !isReady && missingId === projectId;

  // Load the project named in the URL into the shared store.
  useEffect(() => {
    if (garmentStore.isLoaded(projectId)) return;
    let cancelled = false;
    garmentStore.loadProject(projectId).then((ok) => {
      if (!cancelled && !ok) setMissingId(projectId);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Remember where the user is so "Continue" resumes here.
  useEffect(() => {
    if (isReady && currentStage && project.activeStage !== currentStage.id) {
      garmentStore.setActiveStage(currentStage.id);
    }
  }, [isReady, currentStage, project.activeStage]);

  if (isMissing) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <h1 className="text-lg font-semibold text-ink">Project not found</h1>
          <p className="text-sm text-ink-2 mt-1">
            It may have been deleted, or it was saved in a different browser.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-brand hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const stageIndex = currentStage ? PROJECT_STAGES.indexOf(currentStage) : -1;
  const nextStage = stageIndex >= 0 ? PROJECT_STAGES[stageIndex + 1] : undefined;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      <header className="bg-white border-b border-line shrink-0">
        {/* Project identity and actions */}
        <div className="h-14 px-4 sm:px-6 flex items-center gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Projects</span>
          </Link>
          <span className="text-line-strong" aria-hidden>
            /
          </span>
          <div className="min-w-0 flex items-baseline gap-2">
            <h1 className="text-[15px] font-semibold text-ink truncate">
              {isReady ? project.name : 'Loading project…'}
            </h1>
            {isReady && (
              <span className="hidden sm:inline text-xs text-muted shrink-0">
                {formatGarmentCategory(project.garmentCategory)}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            {isReady && <SaveIndicator />}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsTechPackOpen(true)}
              disabled={!isReady}
              className="hidden sm:inline-flex"
            >
              <FileText className="text-muted" aria-hidden />
              Tech pack
            </Button>
            {nextStage && isReady && (
              <ButtonLink href={projectHref(projectId, nextStage.slug)} size="sm">
                <span className="hidden md:inline">Next: {nextStage.name}</span>
                <span className="md:hidden">Next</span>
                <ArrowRight aria-hidden />
              </ButtonLink>
            )}
          </div>
        </div>

        {/* The one place stages are navigated */}
        <nav aria-label="Project stages" className="px-2 sm:px-4 flex items-stretch overflow-x-auto">
          {STAGE_PHASES.map((phase, phaseIdx) => (
            <div key={phase} className="flex items-stretch shrink-0">
              {phaseIdx > 0 && <div className="w-px bg-line my-2.5 mx-1" aria-hidden />}
              <span className="hidden 2xl:flex items-center px-2 text-xs font-medium uppercase tracking-wider text-muted">
                {phase}
              </span>
              {PROJECT_STAGES.filter((s) => s.phase === phase).map((stage) => {
                const isActive = stage.slug === currentStage?.slug;
                const isDone = isReady && isStageComplete(stage, project);
                return (
                  <Link
                    key={stage.slug}
                    href={projectHref(projectId, stage.slug)}
                    aria-current={isActive ? 'page' : undefined}
                    title={stage.description}
                    className={`relative flex items-center gap-2 px-2 py-2.5 text-[13px] whitespace-nowrap transition-colors ${
                      isActive
                        ? 'text-ink font-semibold'
                        : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        isActive
                          ? 'bg-brand text-white'
                          : isDone
                          ? 'bg-brand-soft text-brand'
                          : 'bg-surface-2 text-ink-2'
                      }`}
                    >
                      {isDone && !isActive ? <Check className="w-3 h-3" aria-label="complete" /> : stage.id}
                    </span>
                    {stage.name}
                    {isActive && (
                      <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </header>

      {!isReady ? (
        <div className="flex-1 flex items-center justify-center text-sm text-ink-2 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading project…
        </div>
      ) : currentStage?.fullBleed ? (
        <div className="flex-1 min-h-0 overflow-hidden pb-16 md:pb-0">{children}</div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">{children}</div>
        </div>
      )}

      <TechPackModal isOpen={isTechPackOpen} onClose={() => setIsTechPackOpen(false)} />
    </div>
  );
}
