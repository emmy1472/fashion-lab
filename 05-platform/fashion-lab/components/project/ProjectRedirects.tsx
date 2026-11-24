'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { garmentStore, useGarmentProject } from '@/lib/production/store';
import { getStageById, projectHref, type StageSlug } from '@/lib/production/stages';

function Redirecting() {
  return (
    <div className="flex-1 flex items-center justify-center gap-2 p-8 text-sm text-ink-2">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Opening project…
    </div>
  );
}

/** /projects/[id] → the stage the user was last on. Rendered inside ProjectShell, so the project is loaded. */
export function ResumeProject({ projectId }: { projectId: string }) {
  const router = useRouter();
  const project = useGarmentProject();

  useEffect(() => {
    if (project.id !== projectId) return;
    const stage = getStageById(project.activeStage) ?? getStageById(1)!;
    router.replace(projectHref(projectId, stage.slug));
  }, [project.id, project.activeStage, projectId, router]);

  return <Redirecting />;
}

/** Old top-level routes (/studio, /measurements, …) → the same stage in the last-used project. */
export function RedirectToActiveProject({ stage }: { stage: StageSlug }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(projectHref(garmentStore.getActiveProjectId(), stage));
  }, [router, stage]);

  return <Redirecting />;
}
