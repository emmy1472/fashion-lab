/**
 * FASHION-LAB: LUXURY ATELIER WORKFLOW STEPPER
 * 
 * Complete 9-stage digital garment production lifecycle navigation:
 * 1. Body Measurements & Avatar Proportions
 * 2. 2D Pattern Drafting & CAD
 * 3. Fabric Physics & Material Lab
 * 4. Cutting Marker & 2D Nesting
 * 5. Trims, Interfacing & Bill of Materials
 * 6. Sewing Sequence & Assembly Engine
 * 7. Pressing, Ironing & Finishing QA
 * 8. Virtual Dressing, Fitting & Strain Heatmaps
 * 9. Presentation, Tech Pack & Fashion Showroom
 */

'use client';

import Link from 'next/link';
import {
  Ruler,
  Scissors,
  Layers,
  FileSpreadsheet,
  Shirt,
  Flame,
  Activity,
  ShoppingBag,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useGarmentProject, garmentStore } from '@/lib/production/store';

export const PRODUCTION_STAGES = [
  { id: 1, name: 'Measurements', subtitle: 'Body Avatar', href: '/measurements', icon: Ruler },
  { id: 2, name: '2D Patterns', subtitle: 'CAD Drafting', href: '/studio?mode=cad', icon: Scissors },
  { id: 3, name: 'Fabric Physics', subtitle: 'Materials Lab', href: '/materials', icon: Layers },
  { id: 4, name: 'Cutting Marker', subtitle: '2D Nesting', href: '/production?tab=cutting', icon: Scissors },
  { id: 5, name: 'Trims & BOM', subtitle: 'Components', href: '/production?tab=components', icon: FileSpreadsheet },
  { id: 6, name: 'Assembly Order', subtitle: 'Sewing Steps', href: '/production?tab=assembly', icon: Shirt },
  { id: 7, name: 'Finishing QA', subtitle: 'Pressing Specs', href: '/production?tab=finishing', icon: Flame },
  { id: 8, name: 'Virtual Fitting', subtitle: 'XPBD Simulation', href: '/fitting', icon: Activity },
  { id: 9, name: 'Showroom', subtitle: 'Commerce & Tech Pack', href: '/showroom', icon: ShoppingBag },
];

export function WorkflowStepper({ activeStageOverride }: { activeStageOverride?: number }) {
  const project = useGarmentProject();
  const currentStage = activeStageOverride ?? project.activeStage;
  const progressPercent = Math.round((currentStage / PRODUCTION_STAGES.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-line p-2 shadow-xs select-none mb-6">
      {/* Mini Progress Status Pill */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-line/60 text-[11px] text-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink uppercase tracking-wider text-[10px]">
            Production Pipeline
          </span>
          <span className="text-line">•</span>
          <span className="font-mono text-brand font-semibold">
            Stage {currentStage} of {PRODUCTION_STAGES.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-2 font-medium">{progressPercent}% Completed</span>
          <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden border border-line">
            <div
              className="h-full bg-brand rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Responsive Horizontal Stepper Track */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pt-2 scrollbar-none">
        {PRODUCTION_STAGES.map((s, idx) => {
          const isActive = currentStage === s.id;
          const isDone = currentStage > s.id;
          const Icon = s.icon;

          return (
            <div key={s.id} className="flex items-center shrink-0">
              <Link
                href={s.href}
                onClick={() => garmentStore.setActiveStage(s.id as any)}
                className={`flex items-center gap-1.5 2xl:gap-2 px-2 2xl:px-2.5 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-xs font-semibold'
                    : isDone
                    ? 'bg-brand-soft text-brand hover:bg-brand-soft-hover font-medium'
                    : 'text-ink-2 hover:text-ink hover:bg-surface'
                }`}
              >
                <div
                  className={`w-5 h-5 2xl:w-6 2xl:h-6 rounded-lg flex items-center justify-center text-[10px] 2xl:text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-brand text-white'
                      : 'bg-line text-ink-2'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[2.5]" /> : <span>{s.id}</span>}
                </div>
                <div className="text-left leading-none">
                  <div className="text-[11px] 2xl:text-xs font-medium whitespace-nowrap">{s.name}</div>
                  <div
                    className={`hidden 2xl:block text-[9px] mt-0.5 leading-none whitespace-nowrap ${
                      isActive ? 'text-emerald-100/90' : isDone ? 'text-brand/80' : 'text-muted'
                    }`}
                  >
                    {s.subtitle}
                  </div>
                </div>
              </Link>

              {idx < PRODUCTION_STAGES.length - 1 && (
                <ChevronRight className="w-3 h-3 text-line-strong mx-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
