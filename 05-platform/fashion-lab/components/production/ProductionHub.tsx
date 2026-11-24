/**
 * FASHION-LAB: LUXURY ATELIER PRODUCTION ENGINEERING HUB
 * 
 * Modules 4-7: Production Preparation & Manufacturing:
 * - Module 4: Fabric Layout & Cutting Preparation
 * - Module 5: Component Preparation & Bill of Materials
 * - Module 6: Sewing & Garment Assembly Sequence
 * - Module 7: Ironing, Pressing & Finishing Specifications
 */

'use client';

import { Check, ClipboardList } from 'lucide-react';
import { useGarmentProject, garmentStore } from '@/lib/production/store';
import { CuttingLayoutViewer } from './CuttingLayoutViewer';
import { Badge } from '@/components/ui/badge';

export type ProductionStageSlug = 'cutting' | 'trims' | 'assembly' | 'finishing';

/** One production stage (4–7). Navigation between stages is handled by the project shell. */
export function ProductionStage({ stage }: { stage: ProductionStageSlug }) {
  const project = useGarmentProject();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden min-h-[580px]">
        {stage === 'cutting' && <CuttingLayoutViewer />}

        {stage === 'trims' && (
          <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink tracking-tight">Trims & bill of materials</h2>
                <p className="text-sm text-ink-2 mt-1">
                  Everything besides the main fabric: ribbing, tape, thread and labels. Click a status to advance it.
                </p>
              </div>
              {(() => {
                const ready = project.components.filter((c) => c.status === 'ready').length;
                const total = project.components.length;
                return (
                  <Badge tone={ready === total ? 'success' : 'neutral'}>
                    {ready} of {total} ready
                  </Badge>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.components.map((comp) => {
                const targetPiece = project.patternPieces.find((p) => p.id === comp.targetPieceId);
                return (
                  <div
                    key={comp.id}
                    className="bg-white p-5 rounded-2xl border border-line hover:border-accent shadow-2xs space-y-3.5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-brand bg-brand-soft px-2 py-0.5 rounded-md border border-brand/20">
                          {comp.type}
                        </span>
                        <h3 className="text-sm font-semibold text-ink mt-1.5">{comp.name}</h3>
                      </div>
                      <button
                        onClick={() => garmentStore.toggleComponentStatus(comp.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          comp.status === 'ready'
                            ? 'bg-brand-soft text-brand border border-brand/30'
                            : comp.status === 'prepared'
                            ? 'bg-warning-soft text-warning border border-warning/40'
                            : 'bg-surface text-ink-2 border border-line'
                        }`}
                      >
                        {comp.status.toUpperCase()}
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-ink">{comp.materialName}</p>
                    <p className="text-xs text-ink-2 leading-relaxed bg-surface p-3 rounded-xl border border-line">
                      {comp.prepInstructions}
                    </p>

                    <div className="flex justify-between items-center text-xs text-muted pt-2 border-t border-line font-medium">
                      <span>Quantity: <strong className="text-ink font-mono font-semibold">{comp.quantity} {comp.unit}</strong></span>
                      {targetPiece && (
                        <span>Target: <strong className="text-brand font-semibold">{targetPiece.name}</strong></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stage === 'assembly' && (
          <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="border-b border-line pb-4">
              <h2 className="text-lg font-semibold text-ink tracking-tight">Sewing sequence</h2>
              <p className="text-sm text-ink-2 mt-1">
                The order the garment is sewn in. Mark each step as it&apos;s done.
              </p>
            </div>

            <div className="space-y-4">
              {project.assemblySequence.map((step) => (
                <div
                  key={step.stepNumber}
                  className={`p-6 rounded-2xl border transition-all ${
                    step.completed
                      ? 'bg-white border-brand ring-1 ring-brand/20 shadow-xs'
                      : 'bg-white border-line hover:border-accent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-brand-soft text-brand font-semibold font-mono text-xs flex items-center justify-center border border-brand/20 shrink-0">
                        0{step.stepNumber}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                        <span className="text-xs text-brand font-semibold uppercase tracking-wider">
                          Machine: {step.machineType} · {step.stitchDensitySpi} SPI
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => garmentStore.toggleAssemblyStep(step.stepNumber)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        step.completed
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-surface text-ink-2 hover:bg-line'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{step.completed ? 'Done' : 'Mark done'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-ink-2 mt-3 leading-relaxed bg-surface p-3.5 rounded-xl border border-line">
                    {step.instruction}
                  </p>

                  <div className="flex justify-between items-center text-xs text-muted mt-3 pt-2.5 border-t border-line font-medium">
                    <span>Thread: <strong className="text-ink">{step.threadType}</strong></span>
                    <span className="font-mono font-semibold text-brand">
                      {step.sewingRelationshipIds.length} seams
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stage === 'finishing' && (
          <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="border-b border-line pb-4">
              <h2 className="text-lg font-semibold text-ink tracking-tight">Finishing & quality check</h2>
              <p className="text-sm text-ink-2 mt-1">
                Pressing settings, which way each seam is pressed, and the final inspection.
              </p>
            </div>

            {/* Thermal & Steam Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface p-5 rounded-2xl border border-line">
                <span className="text-xs text-muted uppercase tracking-wider font-semibold">Pressing Temperature</span>
                <div className="text-2xl font-semibold text-ink font-mono mt-1">
                  {project.finishing.ironingTemperatureC}°C
                </div>
                <span className="text-xs text-brand font-medium mt-0.5 block">
                  Calibrated for {project.fabric.name}
                </span>
              </div>

              <div className="bg-surface p-5 rounded-2xl border border-line">
                <span className="text-xs text-muted uppercase tracking-wider font-semibold">Steam Level</span>
                <div className="text-2xl font-semibold text-brand uppercase tracking-tight mt-1">
                  {project.finishing.steamLevel}
                </div>
                <span className="text-xs text-muted font-medium mt-0.5 block">
                  High vacuum table exhaustion
                </span>
              </div>

              <div className="bg-surface p-5 rounded-2xl border border-line">
                <span className="text-xs text-muted uppercase tracking-wider font-semibold">Hem Finish</span>
                <div className="text-xs font-semibold text-ink mt-1 leading-snug">
                  {project.finishing.hemFinishMethod}
                </div>
              </div>
            </div>

            {/* Press Directions */}
            <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs space-y-3.5">
              <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
                Directional Seam Pressing Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.finishing.pressDirections.map((dir, idx) => (
                  <div key={idx} className="bg-surface p-3.5 rounded-xl border border-line text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-ink">
                      <span>{dir.seamName}</span>
                      <span className="text-brand uppercase font-semibold">{dir.direction}</span>
                    </div>
                    {dir.notes && <p className="text-xs text-ink-2 font-medium">{dir.notes}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Quality Assurance Checklist */}
            <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-brand" /> Final QA Inspection Checklist
                </h3>
                <span className="text-xs text-muted font-mono font-semibold">
                  {project.finishing.inspectionChecklist.filter((i) => i.verified).length} /{' '}
                  {project.finishing.inspectionChecklist.length} Verified
                </span>
              </div>

              <div className="space-y-2.5">
                {project.finishing.inspectionChecklist.map((item) => (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={item.verified}
                    key={item.id}
                    onClick={() => garmentStore.toggleInspectionCheck(item.id)}
                    className={`w-full text-left flex items-center justify-between gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      item.verified
                        ? 'bg-brand-soft border-brand/40 text-ink'
                        : 'bg-card border-line text-ink-2 hover:border-line-strong'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`size-5 shrink-0 rounded-md flex items-center justify-center border ${
                          item.verified ? 'bg-brand border-brand text-white' : 'border-line-strong bg-card'
                        }`}
                      >
                        {item.verified && <Check className="size-3.5 stroke-[3]" aria-hidden />}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </span>
                    {item.critical && <Badge tone="warning">Critical</Badge>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
