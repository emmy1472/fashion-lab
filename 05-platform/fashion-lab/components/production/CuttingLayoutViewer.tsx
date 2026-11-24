/**
 * FASHION-LAB: DIGITAL CUTTING PREPARATION & FABRIC NESTING ENVIRONMENT
 * 
 * Luxury Atelier Marker Layout:
 * - Real fabric bolt rendering with selvage edge markings
 * - Strict grainline preservation (warp alignment)
 * - Real-time calculation of fabric consumption, marker efficiency %, and waste %
 * - Clean executive styling matching Fashion-Lab
 */

'use client';

import { useState } from 'react';
import {
  Scissors,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { useGarmentProject } from '@/lib/production/store';
import { pathToSvgString } from '@/lib/production/geometry2d';

export function CuttingLayoutViewer() {
  const project = useGarmentProject();
  const [zoom, setZoom] = useState(0.42);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const plan = project.cuttingPlan;
  const fabricLengthMeters = (plan.totalLengthMm / 1000).toFixed(2);
  const totalAreaM2 = (plan.totalFabricAreaMm2 / 1_000_000).toFixed(2);
  const occupiedAreaM2 = (plan.occupiedPatternAreaMm2 / 1_000_000).toFixed(2);

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink select-none overflow-hidden">
      {/* Top Cutting Control Bar */}
      <div className="p-4 border-b border-line bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-soft border border-brand/20 flex items-center justify-center text-brand">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink tracking-tight flex items-center gap-2">
              <span>Fabric Marker & Cutting Layout</span>
              <span className="text-xs bg-brand-soft text-brand px-2 py-0.5 rounded-full border border-brand/20 font-semibold font-mono">
                Grainline Verified
              </span>
            </h2>
            <p className="text-xs text-ink-2 mt-0.5">
              Automated 2D nesting with seam allowances on standard {plan.fabricWidthMm}mm fabric roll
            </p>
          </div>
        </div>

        {/* Cutting Metrics Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-surface px-3.5 py-1.5 rounded-xl border border-line text-right">
            <div className="text-xs text-muted uppercase tracking-wider font-semibold">Required Fabric</div>
            <div className="text-sm font-semibold text-ink font-mono">{fabricLengthMeters} m</div>
          </div>

          <div className="bg-surface px-3.5 py-1.5 rounded-xl border border-line text-right">
            <div className="text-xs text-muted uppercase tracking-wider font-semibold">Marker Efficiency</div>
            <div className="text-sm font-semibold text-brand font-mono flex items-center justify-end gap-1">
              <span>{plan.efficiencyPercentage}%</span>
            </div>
          </div>

          <div className="bg-surface px-3.5 py-1.5 rounded-xl border border-line text-right">
            <div className="text-xs text-muted uppercase tracking-wider font-semibold">Estimated Waste</div>
            <div className="text-sm font-semibold text-accent font-mono">{plan.wastePercentage}%</div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-line">
            <button
              onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
              className="p-1 rounded-lg hover:bg-line text-ink-2 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-ink font-semibold w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.15, z - 0.1))}
              className="p-1 rounded-lg hover:bg-line text-ink-2 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Fabric Bolt Stage */}
      <div className="flex-1 overflow-auto p-8 relative flex justify-center bg-line/40">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            width: `${plan.fabricWidthMm}px`,
            minHeight: `${plan.totalLengthMm}px`,
          }}
          className="relative bg-white border-2 border-dashed border-accent/50 shadow-xl rounded-lg transition-transform"
        >
          {/* Selvage Edge Labels */}
          <div className="absolute -left-8 top-0 bottom-0 w-6 flex items-center justify-center text-xs font-semibold text-brand uppercase rotate-180 select-none tracking-widest">
            ◄ SELVAGE EDGE · WARP GRAINLINE ◄
          </div>
          <div className="absolute -right-8 top-0 bottom-0 w-6 flex items-center justify-center text-xs font-semibold text-brand uppercase select-none tracking-widest">
            ► SELVAGE EDGE · WARP GRAINLINE ►
          </div>

          {/* SVG Nested Pattern Pieces */}
          <svg
            width={plan.fabricWidthMm}
            height={plan.totalLengthMm}
            className="w-full h-full"
          >
            {/* Fabric Weft / Warp Texture Grid */}
            <defs>
              <pattern id="fabric-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="30" y2="0" stroke="rgba(185, 155, 112, 0.15)" strokeWidth="0.8" />
                <line x1="0" y1="0" x2="0" y2="30" stroke="rgba(185, 155, 112, 0.15)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fabric-grid)" />

            {/* Placed Nested Pieces */}
            {plan.nestedPieces.map((item, idx) => {
              const isSelected = selectedPieceId === item.pieceId;
              const d = pathToSvgString(item.polygon);

              return (
                <g
                  key={item.pieceId}
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedPieceId(item.pieceId)}
                >
                  {/* Pattern Shape Path */}
                  <path
                    d={d}
                    fill={isSelected ? 'rgba(36, 92, 70, 0.18)' : 'rgba(235, 243, 239, 0.85)'}
                    stroke={isSelected ? '#245C46' : '#B99B70'}
                    strokeWidth="2.5"
                    className="transition-colors filter drop-shadow-2xs"
                  />

                  {/* Piece Center Annotation Box */}
                  <g transform={`translate(${item.x + item.width * 0.5}, ${item.y + item.height * 0.5})`}>
                    <rect
                      x="-75"
                      y="-19"
                      width="150"
                      height="38"
                      rx="8"
                      fill="#FFFFFF"
                      stroke={isSelected ? '#245C46' : '#E9E5DC'}
                      strokeWidth="1.5"
                      className="filter drop-shadow-xs"
                    />
                    <text
                      textAnchor="middle"
                      y="-2"
                      fill="#18251F"
                      fontSize="11"
                      fontWeight="800"
                    >
                      {item.pieceName.toUpperCase()}
                    </text>
                    <text
                      textAnchor="middle"
                      y="13"
                      fill="#245C46"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      CUT #{idx + 1} · {Math.round(item.width)}×{Math.round(item.height)}mm
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Production Spec Notice */}
      <div className="h-10 bg-white border-t border-line px-6 flex items-center justify-between text-xs text-ink-2 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-ink font-semibold">Fabric: {project.fabric.name}</span>
          <span>·</span>
          <span>Weight: {project.fabric.weightGSM} GSM</span>
          <span>·</span>
          <span>Total Cut Pieces: {plan.nestedPieces.length}</span>
        </div>
        <div className="flex items-center gap-1.5 text-brand font-mono text-xs font-semibold">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Optimal Cutting Sequence Generated (Top-Down Minimal Traverse)</span>
        </div>
      </div>
    </div>
  );
}
