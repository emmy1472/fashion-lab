/**
 * Single source of truth for the garment project workflow.
 * Every stage lives under /projects/[id]/[slug].
 */

import {
  Ruler,
  PenTool,
  Layers,
  Scissors,
  ListChecks,
  Shirt,
  Flame,
  Sparkles,
  Store,
  type LucideIcon,
} from 'lucide-react';

export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type StageSlug =
  | 'measurements'
  | 'design'
  | 'fabric'
  | 'cutting'
  | 'trims'
  | 'assembly'
  | 'finishing'
  | 'fitting'
  | 'showroom';

export type StagePhase = 'Fit' | 'Design' | 'Make' | 'Present';

export interface ProjectStage {
  id: StageNumber;
  slug: StageSlug;
  name: string;
  description: string;
  phase: StagePhase;
  icon: LucideIcon;
  /** Full-bleed workspaces (e.g. the CAD studio) manage their own scrolling and padding. */
  fullBleed?: boolean;
}

export const PROJECT_STAGES: ProjectStage[] = [
  { id: 1, slug: 'measurements', name: 'Measurements', description: 'Body profile the pattern is drafted from', phase: 'Fit', icon: Ruler },
  { id: 2, slug: 'design', name: 'Design & pattern', description: '2D pattern, 3D preview and artwork', phase: 'Design', icon: PenTool, fullBleed: true },
  { id: 3, slug: 'fabric', name: 'Fabric', description: 'Choose the material and its physical behaviour', phase: 'Design', icon: Layers },
  { id: 4, slug: 'cutting', name: 'Cutting', description: 'Marker layout and fabric yield', phase: 'Make', icon: Scissors },
  { id: 5, slug: 'trims', name: 'Trims & BOM', description: 'Components and bill of materials', phase: 'Make', icon: ListChecks },
  { id: 6, slug: 'assembly', name: 'Assembly', description: 'Sewing sequence', phase: 'Make', icon: Shirt },
  { id: 7, slug: 'finishing', name: 'Finishing & QA', description: 'Pressing and final inspection', phase: 'Make', icon: Flame },
  { id: 8, slug: 'fitting', name: 'Virtual fitting', description: 'Try the garment on a 3D body', phase: 'Present', icon: Sparkles },
  { id: 9, slug: 'showroom', name: 'Showroom', description: 'Present, price and publish', phase: 'Present', icon: Store },
];

export const STAGE_PHASES: StagePhase[] = ['Fit', 'Design', 'Make', 'Present'];

export function getStageBySlug(slug: string | null | undefined): ProjectStage | undefined {
  return PROJECT_STAGES.find((s) => s.slug === slug);
}

export function getStageById(id: number | null | undefined): ProjectStage | undefined {
  return PROJECT_STAGES.find((s) => s.id === id);
}

const CATEGORY_LABELS: Record<string, string> = {
  't-shirt': 'T-shirt',
  shirt: 'Shirt',
  trouser: 'Trousers',
  dress: 'Dress',
  jacket: 'Jacket',
  hoodie: 'Hoodie',
};

export function formatGarmentCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function projectHref(projectId: string, slug?: StageSlug): string {
  const base = `/projects/${encodeURIComponent(projectId)}`;
  return slug ? `${base}/${slug}` : base;
}
