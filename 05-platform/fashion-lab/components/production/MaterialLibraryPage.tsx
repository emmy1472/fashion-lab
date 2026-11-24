/**
 * FASHION-LAB: LUXURY MATERIAL & FABRIC PHYSICS LIBRARY
 * 
 * Module 3: Comprehensive material curation and cloth physics simulation lab:
 * - High-DPI tactile fabric swatches with weave textures (Jersey, Twill, Satin, Linen, Leather)
 * - Material classification (Cotton, Denim, Silk, Wool, Polyester, Linen, Leather, Velvet)
 * - Physical properties: GSM, thickness, Young's modulus, bending rigidity, shear modulus, friction
 * - PBR optical maps: roughness, metallic, sheen, bump scale
 * - Real-time "Apply to Active Project" propagation across 2D pattern, 3D cloth solver, and BOM
 */

'use client';

import { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  Check,
  Sparkles,
  Info,
  Sliders,
  Scale,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useGarmentProject, garmentStore } from '@/lib/production/store';
import { FABRIC_LIBRARY } from '@/lib/production/fabrics';
import { FabricMaterial } from '@/lib/production/types';
import { PageHeader } from '@/components/ui/page-header';

const CATEGORIES = [
  { id: 'all', label: 'All Substrates' },
  { id: 'cotton', label: 'Cotton & Knits' },
  { id: 'denim', label: 'Denim & Twill' },
  { id: 'silk', label: 'Silk & Satin' },
  { id: 'wool', label: 'Woolens & Suiting' },
  { id: 'linen', label: 'Linen' },
  { id: 'leather', label: 'Leather & Suede' },
  { id: 'polyester', label: 'Performance & Technical' },
];

export function MaterialLibraryPage() {
  const project = useGarmentProject();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedFabric, setInspectedFabric] = useState<FabricMaterial | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const fabrics = Object.values(FABRIC_LIBRARY);

  // Filter fabrics based on category and search query
  const filteredFabrics = fabrics.filter((fabric) => {
    const matchesCategory = selectedCategory === 'all' || fabric.category === selectedCategory;
    const matchesQuery =
      fabric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fabric.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fabric.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleApplyFabric = (fabricId: string) => {
    garmentStore.setFabric(fabricId);
    setAppliedId(fabricId);
    setTimeout(() => setAppliedId(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none">
      <PageHeader
        title="Fabrics"
        meta={
          <>
            In use on <span className="text-ink">{project.name}</span>: <span className="text-ink font-medium">{project.fabric.name}</span>
          </>
        }
        description="Each fabric's weight, stretch and stiffness drive the 3D drape and the cutting layout."
      />

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-line shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-brand text-white shadow-xs font-semibold'
                  : 'bg-surface text-ink-2 hover:text-ink hover:bg-line'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by fiber, weight, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-line rounded-xl pl-9 pr-3 py-1.5 text-xs text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
          />
        </div>
      </div>

      {/* Fabric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFabrics.map((fabric) => {
          const isCurrentActive = project.fabric.id === fabric.id;
          const isJustApplied = appliedId === fabric.id;

          return (
            <div
              key={fabric.id}
              className={`bg-white rounded-2xl border transition-all flex flex-col overflow-hidden group shadow-xs ${
                isCurrentActive
                  ? 'border-brand ring-1 ring-brand shadow-sm'
                  : 'border-line hover:border-accent'
              }`}
            >
              {/* Swatch Header Preview */}
              <div
                className="h-36 relative p-4 flex flex-col justify-between overflow-hidden"
                style={{
                  backgroundColor: fabric.baseColor,
                  backgroundImage: `
                    radial-gradient(circle at 10% 20%, rgba(255,255,255,0.15) 0%, transparent 40%),
                    linear-gradient(135deg, rgba(0,0,0,0.08) 25%, transparent 25%),
                    linear-gradient(225deg, rgba(0,0,0,0.08) 25%, transparent 25%)
                  `,
                  backgroundSize: '100% 100%, 8px 8px, 8px 8px',
                }}
              >
                {/* Category & Status Pills */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-ink shadow-2xs">
                    {fabric.category}
                  </span>
                  {isCurrentActive && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand px-2.5 py-0.5 rounded-full shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" /> Active
                    </span>
                  )}
                </div>

                {/* Tactile Texture Spec Tag */}
                <div className="z-10 flex items-center justify-between bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-xl text-white">
                  <span className="text-xs font-mono font-semibold">{fabric.weightGSM} GSM</span>
                  <span className="text-xs font-mono text-white/90">{fabric.thicknessMm}mm thick</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-ink leading-tight group-hover:text-brand transition-colors">
                    {fabric.name}
                  </h3>
                  <p className="text-xs text-ink-2 mt-1.5 line-clamp-2 leading-relaxed">
                    {fabric.description}
                  </p>
                </div>

                {/* Mechanical Physics Meter Strip */}
                <div className="space-y-2 pt-2 border-t border-line">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Stretch Modulus:</span>
                      <span className="font-mono text-ink font-semibold">{Math.round(fabric.stretchStiffness * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${fabric.stretchStiffness * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Bending Rigidity:</span>
                      <span className="font-mono text-ink font-semibold">{Math.round(fabric.bendingStiffness * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${fabric.bendingStiffness * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInspectedFabric(fabric)}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-line hover:bg-surface text-xs font-semibold text-ink transition text-center cursor-pointer"
                  >
                    Inspect Specs
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyFabric(fabric.id)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-brand-soft text-brand border border-brand/30'
                        : isJustApplied
                        ? 'bg-brand text-white'
                        : 'bg-brand hover:bg-brand-hover text-white shadow-xs'
                    }`}
                  >
                    {isCurrentActive ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Applied</span>
                      </>
                    ) : isJustApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Updated!</span>
                      </>
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Technical Specification Inspection Modal */}
      {inspectedFabric && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-line shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs uppercase font-semibold text-accent">
                  XPBD Physical Material Card
                </span>
                <h2 className="text-xl font-semibold text-ink mt-0.5">{inspectedFabric.name}</h2>
              </div>
              <button
                onClick={() => setInspectedFabric(null)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-line text-ink flex items-center justify-center font-semibold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">{inspectedFabric.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-surface border border-line">
                <div className="text-xs text-muted uppercase">Fabric Weight</div>
                <div className="text-base font-semibold font-mono text-ink mt-0.5">{inspectedFabric.weightGSM} GSM</div>
              </div>

              <div className="p-3 rounded-2xl bg-surface border border-line">
                <div className="text-xs text-muted uppercase">Calibrated Gauge</div>
                <div className="text-base font-semibold font-mono text-ink mt-0.5">{inspectedFabric.thicknessMm} mm</div>
              </div>

              <div className="p-3 rounded-2xl bg-surface border border-line">
                <div className="text-xs text-muted uppercase">Mass Density</div>
                <div className="text-base font-semibold font-mono text-ink mt-0.5">{inspectedFabric.densityKgM3} kg/m³</div>
              </div>

              <div className="p-3 rounded-2xl bg-surface border border-line">
                <div className="text-xs text-muted uppercase">Young&apos;s Stretch Modulus</div>
                <div className="text-base font-semibold font-mono text-brand mt-0.5">{inspectedFabric.stretchStiffness}</div>
              </div>

              <div className="p-3 rounded-2xl bg-surface border border-line">
                <div className="text-xs text-muted uppercase">Bending Rigidity</div>
                <div className="text-base font-semibold font-mono text-accent mt-0.5">{inspectedFabric.bendingStiffness}</div>
              </div>

              <div className="p-3 rounded-2xl bg-surface border border-line">
                <div className="text-xs text-muted uppercase">Shear Resistance</div>
                <div className="text-base font-semibold font-mono text-ink mt-0.5">{inspectedFabric.shearStiffness}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full border border-line-strong"
                  style={{ backgroundColor: inspectedFabric.baseColor }}
                />
                <span className="text-xs text-muted font-mono">
                  PBR Roughness: {inspectedFabric.roughness} | Metallic: {inspectedFabric.metallic}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleApplyFabric(inspectedFabric.id);
                  setInspectedFabric(null);
                }}
                className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
              >
                Apply to Current Garment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
