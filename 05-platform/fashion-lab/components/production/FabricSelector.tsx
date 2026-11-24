/**
 * FASHION-LAB: LUXURY ATELIER FABRIC LIBRARY & MATERIAL PHYSICS
 * 
 * Module 3: Material Management & Cloth Physics:
 * - 10 Industrial Fabric Categories (Cotton, Denim, Silk, Wool, Poly, Linen, Leather, Satin, Chiffon, Velvet)
 * - Physical & PBR parameters: GSM, thickness, stretch, bending, shear, density, friction, roughness, sheen
 * - Immediate live application to the 3D XPBD cloth simulation and cutting marker
 */

'use client';

import { useState } from 'react';
import {
  Layers,
  Check,
  Sliders,
  Sparkles,
  Info,
  Scale,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useGarmentProject, garmentStore } from '@/lib/production/store';
import { FABRIC_LIBRARY } from '@/lib/production/fabrics';
import { FabricMaterial } from '@/lib/production/types';

export function FabricSelector() {
  const project = useGarmentProject();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fabrics = Object.values(FABRIC_LIBRARY);
  const categories = ['all', 'cotton', 'denim', 'silk', 'wool', 'polyester', 'linen', 'leather', 'satin', 'chiffon', 'velvet'];

  const filteredFabrics = selectedCategory === 'all'
    ? fabrics
    : fabrics.filter((f) => f.category === selectedCategory);

  const handleSelectFabric = (fabric: FabricMaterial) => {
    garmentStore.setFabric(fabric.id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Editorial Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full">
              <Layers className="w-3.5 h-3.5 text-success" />
              Stage 3 of 8 · Material Physics
            </span>
            <span className="text-xs text-muted font-mono">10 Industrial Material Classes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink leading-tight">
            Fabric Library & Material Physics Lab
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Selecting a fabric updates both the PBR optical shader and the XPBD physical solver parameters (stretch stiffness, bending resistance, density, and friction).
          </p>
        </div>

        {/* Active Selected Fabric Chip */}
        <div className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-line shadow-2xs">
          <div
            className="w-10 h-10 rounded-xl border border-line-strong shadow-xs shrink-0"
            style={{ backgroundColor: project.fabric.baseColor }}
          />
          <div>
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Active Fabric</span>
            <span className="text-sm font-semibold text-ink block">{project.fabric.name}</span>
            <span className="text-[11px] text-brand font-mono font-bold">
              {project.fabric.weightGSM} GSM · {project.fabric.thicknessMm}mm
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-brand text-white shadow-xs'
                : 'bg-white text-ink-2 hover:text-ink border border-line/80 hover:bg-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Fabric Swatch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredFabrics.map((fabric) => {
          const isActive = project.fabric.id === fabric.id;

          return (
            <div
              key={fabric.id}
              onClick={() => handleSelectFabric(fabric)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-4 group relative ${
                isActive
                  ? 'bg-white border-success ring-2 ring-success/20 shadow-md'
                  : 'bg-white border-line/80 hover:border-line-strong hover:shadow-xs'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl border border-line-strong/80 shadow-xs group-hover:scale-105 transition-transform shrink-0"
                    style={{ backgroundColor: fabric.baseColor }}
                  />
                  <div>
                    <h3 className="text-base font-semibold text-ink group-hover:text-brand transition-colors">
                      {fabric.name}
                    </h3>
                    <span className="text-xs font-mono font-semibold text-brand uppercase tracking-wider">
                      {fabric.category} · {fabric.weightGSM} GSM · {fabric.thicknessMm}mm
                    </span>
                  </div>
                </div>

                {isActive && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand bg-brand-soft px-2.5 py-1 rounded-full border border-brand/20">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> ACTIVE
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-ink-2 leading-relaxed bg-surface/70 p-3.5 rounded-xl border border-line/60">
                {fabric.description}
              </p>

              {/* Physical Coefficients Metric Bars */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-muted">Stretch Stiffness:</span>
                    <span className="font-mono text-ink font-bold">
                      {Math.round(fabric.stretchStiffness * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${fabric.stretchStiffness * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-muted">Bending / Fold Rigidity:</span>
                    <span className="font-mono text-ink font-bold">
                      {Math.round(fabric.bendingStiffness * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${fabric.bendingStiffness * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-muted">Surface Roughness:</span>
                    <span className="font-mono text-ink font-bold">
                      {Math.round(fabric.roughness * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-600 rounded-full transition-all"
                      style={{ width: `${fabric.roughness * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-muted">Specular Sheen:</span>
                    <span className="font-mono text-ink font-bold">
                      {Math.round(fabric.sheen * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-600 rounded-full transition-all"
                      style={{ width: `${fabric.sheen * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
