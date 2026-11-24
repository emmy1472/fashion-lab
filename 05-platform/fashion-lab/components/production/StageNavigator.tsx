/**
 * FASHION-LAB: 9-STAGE PRODUCTION LIFECYCLE NAVIGATOR
 * 
 * Provides unified, progressive navigation across all 9 digital garment production stages:
 * 1. Body Measurements & Avatar
 * 2. Garment Design & 2D Pattern Drafting
 * 3. Fabric Library & Material Physics
 * 4. Fabric Layout & Cutting Preparation
 * 5. Component Trimming & BOM
 * 6. Sewing & Assembly Sequence
 * 7. Ironing, Pressing & Finishing
 * 8. Virtual Dressing & Fit Heatmap
 * 9. Presentation, Tech Pack & Commerce
 * 
 * Visually distinguishes:
 * - Completed Stages (Forest Green with Checkmark)
 * - Active Stage (Vibrant Forest with White Pulsing Beacon)
 * - Stages Requiring Attention (Subtle Amber Warning with QA Alert)
 * - Pending Stages (Muted Charcoal with Clear Icons)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Ruler,
  Scissors,
  Layers,
  Shirt,
  Flame,
  Activity,
  ShoppingBag,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useGarmentProject, garmentStore } from '@/lib/production/store';
import { TechPackModal } from './TechPackModal';

export const STAGES = [
  { id: 1, name: '1. Measurements', href: '/measurements', icon: Ruler },
  { id: 2, name: '2. 2D Patterns', href: '/studio?mode=cad', icon: Scissors },
  { id: 3, name: '3. Fabric Physics', href: '/materials', icon: Layers },
  { id: 4, name: '4. Cutting Marker', href: '/production?tab=cutting', icon: Scissors },
  { id: 5, name: '5. Components BOM', href: '/production?tab=components', icon: Layers },
  { id: 6, name: '6. Assembly Order', href: '/production?tab=assembly', icon: Shirt },
  { id: 7, name: '7. Finishing QA', href: '/production?tab=finishing', icon: Flame },
  { id: 8, name: '8. Virtual Fitting', href: '/fitting', icon: Activity },
  { id: 9, name: '9. Fashion Showroom', href: '/showroom', icon: ShoppingBag },
];

export function StageNavigator() {
  const project = useGarmentProject();
  const [isTechPackOpen, setIsTechPackOpen] = useState(false);

  // Check if Finishing QA stage requires inspection attention
  const hasFinishingPending = project.finishing.inspectionChecklist.some(
    (item) => item.critical && !item.verified
  );

  const handleStageClick = (stage: typeof STAGES[0]) => {
    garmentStore.setActiveStage(stage.id as any);
  };

  return (
    <>
      <div className="w-full bg-ink border-b border-sidebar-line px-4 py-2 flex items-center justify-between text-xs overflow-x-auto select-none gap-4">
        {/* Stages Breadcrumb Bar (Horizontally scrollable with zero clipping) */}
        <div className="flex items-center gap-1.5 min-w-max flex-1">
          {STAGES.map((s, idx) => {
            const isActive = project.activeStage === s.id;
            const isCompleted = project.activeStage > s.id;
            const isAttention = s.id === 7 && hasFinishingPending && !isActive;
            const Icon = s.icon;

            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <Link
                  href={s.href}
                  onClick={() => handleStageClick(s)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand text-white font-bold ring-1 ring-success shadow-xs'
                      : isCompleted
                      ? 'bg-[#1F3329] text-emerald-300 hover:text-white border border-brand/40'
                      : isAttention
                      ? 'bg-amber-950/40 text-amber-300 border border-amber-600/40 hover:text-white'
                      : 'text-muted hover:text-line hover:bg-[#202E26]'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  )}
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isAttention ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{s.name}</span>
                  {isAttention && (
                    <span className="text-[9px] bg-warning/20 text-amber-300 font-mono font-bold px-1 rounded-sm">
                      QA
                    </span>
                  )}
                </Link>

                {idx < STAGES.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#2B3F35] shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Tech Pack Trigger */}
        <button
          onClick={() => setIsTechPackOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/15 hover:bg-accent/25 text-line border border-accent/30 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-accent" />
          <span className="hidden sm:inline">Factory Tech Pack</span>
          <span className="sm:hidden">Tech Pack</span>
        </button>
      </div>

      <TechPackModal
        isOpen={isTechPackOpen}
        onClose={() => setIsTechPackOpen(false)}
      />
    </>
  );
}
