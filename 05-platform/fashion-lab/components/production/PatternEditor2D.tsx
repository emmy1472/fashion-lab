/**
 * FASHION-LAB: PROFESSIONAL 2D GARMENT PATTERN CAD DRAFTING STUDIO
 * 
 * High-End Atelier Patternmaking Environment:
 * - Professional drafting mat with millimeter grid and adaptive coordinate transforms
 * - Automatic Fit-to-Content: Guarantees all pattern pieces (front, back, sleeves, collar)
 *   are 100% visible with zero clipping
 * - Adaptive Dimension Tags & Piece Labels scaled for instant legibility at any zoom
 * - Mouse Wheel Zoom & Left-Drag Panning
 * - Real-time seam length matching validation with tolerance indicators
 * - Parametric tailoring ease and dimension sliders
 */

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Scissors,
  Ruler,
  Check,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';
import { useGarmentProject, garmentStore } from '@/lib/production/store';
import { pathToSvgString, polygonBoundingBox, computeNotchTicks } from '@/lib/production/geometry2d';
import { GarmentSize, STANDARD_SIZES, SIZE_NEST_COLORS, gradePatternNest } from '@/lib/production/grading';
import { downloadDxfAamaFile } from '@/lib/production/exportDxfAama';

export function PatternEditor2D() {
  const project = useGarmentProject();
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string>('piece_front_bodice');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showSeamAllowance, setShowSeamAllowance] = useState(true);
  const [showGrainlines, setShowGrainlines] = useState(true);
  const [showNotches, setShowNotches] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [isSpecPanelOpen, setIsSpecPanelOpen] = useState(false);
  const [zoom, setZoom] = useState(0.42);
  const [pan, setPan] = useState({ x: 120, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Parametric controls state
  const [activeSize, setActiveSize] = useState<GarmentSize>('M');
  const [showGradeNest, setShowGradeNest] = useState(false);
  const [chestEase, setChestEase] = useState(70);
  const [sleeveLength, setSleeveLength] = useState(215);
  const [lengthDelta, setLengthDelta] = useState(0);
  const [neckStyle, setNeckStyle] = useState<'crew' | 'v'>('crew');
  const [seamAllowance, setSeamAllowance] = useState(10);

  // Computes graded nest outlines across XS through XXL when Grade Nest view is active
  const gradedNest = useMemo(() => {
    if (!showGradeNest) return null;
    return gradePatternNest(STANDARD_SIZES, {
      chestEaseMm: chestEase,
      sleeveLengthMm: sleeveLength,
      lengthDeltaMm: lengthDelta,
      neckStyle,
      seamAllowanceMm: seamAllowance,
    });
  }, [showGradeNest, chestEase, sleeveLength, lengthDelta, neckStyle, seamAllowance]);

  const handleSizeChange = (size: GarmentSize) => {
    setActiveSize(size);
    garmentStore.gradeToSize(size, {
      chestEaseMm: chestEase,
      sleeveLengthMm: sleeveLength,
      lengthDeltaMm: lengthDelta,
      neckStyle,
      seamAllowanceMm: seamAllowance,
    });
  };

  const selectedPiece =
    project.patternPieces.find((p) => p.id === selectedPieceId) || project.patternPieces[0];

  // Automatic Fit-To-Content: Computes overall bounding box of all pattern pieces
  const fitToContent = useCallback(() => {
    if (!svgContainerRef.current) return;
    const containerW = svgContainerRef.current.clientWidth || 600;
    const containerH = svgContainerRef.current.clientHeight || 700;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const piece of project.patternPieces) {
      const bbox = polygonBoundingBox(piece.seamLine);
      minX = Math.min(minX, piece.position2D.x + bbox.minX);
      maxX = Math.max(maxX, piece.position2D.x + bbox.maxX);
      minY = Math.min(minY, piece.position2D.y + bbox.minY);
      maxY = Math.max(maxY, piece.position2D.y + bbox.maxY);
    }

    if (!isFinite(minX)) return;

    const totalW = maxX - minX;
    const totalH = maxY - minY;
    const padding = 50;

    const availableW = Math.max(200, containerW - padding * 2);
    const availableH = Math.max(200, containerH - padding * 2);

    const fitZoom = Math.max(0.18, Math.min(1.1, Math.min(availableW / totalW, availableH / totalH)));
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;

    const fitPanX = containerW * 0.5 - centerX * fitZoom;
    const fitPanY = containerH * 0.5 - centerY * fitZoom;

    setZoom(Number(fitZoom.toFixed(3)));
    setPan({ x: Math.round(fitPanX), y: Math.round(fitPanY) });
  }, [project.patternPieces]);

  // Fit on initial mount and when container size changes
  useEffect(() => {
    if (!svgContainerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      fitToContent();
    });
    resizeObserver.observe(svgContainerRef.current);
    // Initial call
    fitToContent();
    return () => resizeObserver.disconnect();
  }, [fitToContent]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((z) => Math.max(0.15, Math.min(2.5, Number((z * zoomDelta).toFixed(3)))));
  };

  const handleParametricUpdate = (key: string, value: any) => {
    let newChestEase = chestEase;
    let newSleeveLen = sleeveLength;
    let newLengthDelta = lengthDelta;
    let newNeckStyle = neckStyle;
    let newSa = seamAllowance;

    if (key === 'chestEase') { newChestEase = value; setChestEase(value); }
    if (key === 'sleeveLength') { newSleeveLen = value; setSleeveLength(value); }
    if (key === 'lengthDelta') { newLengthDelta = value; setLengthDelta(value); }
    if (key === 'neckStyle') { newNeckStyle = value; setNeckStyle(value); }
    if (key === 'seamAllowance') { newSa = value; setSeamAllowance(value); }

    garmentStore.updatePatternDraftOptions({
      chestEaseMm: newChestEase,
      sleeveLengthMm: newSleeveLen,
      lengthDeltaMm: newLengthDelta,
      neckStyle: newNeckStyle,
      seamAllowanceMm: newSa,
    });
  };

  // Adaptive label scaling: ensures text and notch tags remain readable across all zoom levels
  const labelScale = Math.max(0.75, Math.min(1.8, 0.48 / Math.max(0.18, zoom)));

  return (
    <div className="flex h-full w-full bg-surface text-ink relative overflow-hidden select-none">
      {/* Top Floating CAD Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-line shadow-sm text-xs">
        <div className="flex items-center gap-2 font-bold text-brand mr-1 border-r border-line pr-2.5">
          <div className="w-5 h-5 rounded-lg bg-brand-soft flex items-center justify-center text-brand">
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <span>2D Pattern Drafting</span>
        </div>

        <button
          onClick={() => setShowSeamAllowance((v) => !v)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            showSeamAllowance
              ? 'bg-brand text-white shadow-xs'
              : 'bg-surface text-ink-2 hover:text-ink'
          }`}
          title="Toggle Seam Allowance (Cut Line)"
        >
          SA (+{seamAllowance}mm)
        </button>

        <button
          onClick={() => setShowGrainlines((v) => !v)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            showGrainlines
              ? 'bg-brand text-white shadow-xs'
              : 'bg-surface text-ink-2 hover:text-ink'
          }`}
          title="Toggle Warp Grainline Orientation"
        >
          Grainlines
        </button>

        <button
          onClick={() => setShowNotches((v) => !v)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            showNotches
              ? 'bg-brand text-white shadow-xs'
              : 'bg-surface text-ink-2 hover:text-ink'
          }`}
          title="Toggle Construction Notches"
        >
          Notches
        </button>

        <button
          onClick={() => setShowDimensions((v) => !v)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            showDimensions
              ? 'bg-brand text-white shadow-xs'
              : 'bg-surface text-ink-2 hover:text-ink'
          }`}
          title="Toggle Dimension Annotations"
        >
          Dimensions
        </button>

        {/* Grade Nest Overlay Toggle */}
        <button
          onClick={() => setShowGradeNest((v) => !v)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
            showGradeNest
              ? 'bg-[#8B5CF6] text-white shadow-xs'
              : 'bg-surface text-ink-2 hover:text-ink'
          }`}
          title="Toggle Multi-Size Graded Nest Overlay (XS - XXL)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Grade Nest</span>
        </button>

        {/* Multi-Size Pattern Grading Selector */}
        <div className="flex items-center gap-0.5 bg-surface p-0.5 rounded-xl border border-line">
          {STANDARD_SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => handleSizeChange(sz)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono transition cursor-pointer ${
                activeSize === sz
                  ? 'bg-brand text-white shadow-2xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
              title={`Grade patterns to Size ${sz} (ISO 8559-1)`}
            >
              {sz}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-line mx-1" />

        {/* Export DXF-AAMA Button */}
        <button
          onClick={() => downloadDxfAamaFile(project, activeSize)}
          className="px-2.5 py-1 rounded-xl bg-brand hover:bg-brand-hover text-white transition cursor-pointer flex items-center gap-1 font-semibold text-[11px] shadow-2xs active:scale-95"
          title="Download ASTM D6673 / AAMA-DXF for Gerber, Lectra, Optitex & CNC Cutters"
        >
          <Download className="w-3.5 h-3.5" />
          <span>DXF-AAMA</span>
        </button>

        <div className="h-4 w-[1px] bg-line mx-1" />

        <button
          onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.08).toFixed(3))))}
          className="p-1 rounded-lg bg-surface hover:bg-line text-ink transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono text-muted w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(0.15, Number((z - 0.08).toFixed(3))))}
          className="p-1 rounded-lg bg-surface hover:bg-line text-ink transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={fitToContent}
          className="p-1.5 rounded-lg bg-brand-soft hover:bg-brand-soft-hover text-brand transition cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
          title="Fit All Pattern Pieces to Viewport"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit All</span>
        </button>

        <div className="h-4 w-[1px] bg-line mx-1" />

        <button
          onClick={() => setIsSpecPanelOpen(!isSpecPanelOpen)}
          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
            isSpecPanelOpen
              ? 'bg-brand text-white'
              : 'bg-surface text-ink-2 hover:bg-line'
          }`}
          title={isSpecPanelOpen ? "Hide Specifications Panel" : "Show Specifications Panel"}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Eases</span>
        </button>
      </div>

      {/* Main Drafting Table SVG Canvas */}
      <div
        ref={svgContainerRef}
        className="flex-1 h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(185, 155, 112, 0.30) 1px, transparent 0),
              linear-gradient(to right, rgba(233, 229, 220, 0.8) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(233, 229, 220, 0.8) 1px, transparent 1px)
            `,
            backgroundSize: `20px 20px, 100px 100px, 100px 100px`,
          }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {project.patternPieces.map((piece) => {
              const isSelected = piece.id === selectedPieceId;
              const bbox = polygonBoundingBox(piece.seamLine);

              return (
                <g
                  key={piece.id}
                  transform={`translate(${piece.position2D.x}, ${piece.position2D.y}) rotate(${piece.rotation2D})`}
                  className="cursor-pointer transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPieceId(piece.id);
                  }}
                >
                  {/* Outer Cut Line with Seam Allowance (dashed line) */}
                  {showSeamAllowance && piece.cutLine && (
                    <path
                      d={pathToSvgString(piece.cutLine)}
                      fill="none"
                      stroke={isSelected ? '#245C46' : '#94A3B8'}
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="transition-colors"
                    />
                  )}

                  {/* Graded Multi-Size Nest Overlays (ISO 8559-1 CAD Layer) */}
                  {showGradeNest && gradedNest && STANDARD_SIZES.map((sz) => {
                    const gradedPiece = gradedNest[sz]?.find((p) => p.pieceKey === piece.pieceKey);
                    if (!gradedPiece || sz === activeSize) return null;
                    return (
                      <path
                        key={`nest-${sz}-${piece.id}`}
                        d={pathToSvgString(gradedPiece.seamLine)}
                        fill="none"
                        stroke={SIZE_NEST_COLORS[sz]}
                        strokeWidth="1.8"
                        strokeDasharray="5 3"
                        opacity="0.85"
                      />
                    );
                  })}

                  {/* Inner Seam Line (actual stitched boundary) */}
                  <path
                    d={pathToSvgString(piece.seamLine)}
                    fill={isSelected ? 'rgba(235, 243, 239, 0.95)' : 'rgba(255, 255, 255, 0.90)'}
                    stroke={isSelected ? '#245C46' : '#18251F'}
                    strokeWidth={isSelected ? '3.5' : '2'}
                    className="transition-all filter drop-shadow-xs"
                  />

                  {/* Grainline Vector */}
                  {showGrainlines && (
                    <g>
                      <line
                        x1={piece.grainline.start.x}
                        y1={piece.grainline.start.y}
                        x2={piece.grainline.end.x}
                        y2={piece.grainline.end.y}
                        stroke="#245C46"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      {/* Grainline Arrowheads */}
                      <polygon
                        points={`${piece.grainline.start.x},${piece.grainline.start.y - 8} ${piece.grainline.start.x - 5},${piece.grainline.start.y + 4} ${piece.grainline.start.x + 5},${piece.grainline.start.y + 4}`}
                        fill="#245C46"
                      />
                      <polygon
                        points={`${piece.grainline.end.x},${piece.grainline.end.y + 8} ${piece.grainline.end.x - 5},${piece.grainline.end.y - 4} ${piece.grainline.end.x + 5},${piece.grainline.end.y - 4}`}
                        fill="#245C46"
                      />
                      <text
                        x={piece.grainline.start.x + 14}
                        y={(piece.grainline.start.y + piece.grainline.end.y) * 0.5}
                        fill="#245C46"
                        fontSize={Math.round(12 * labelScale)}
                        fontWeight="700"
                        letterSpacing="1"
                        transform={`rotate(90, ${piece.grainline.start.x + 14}, ${(piece.grainline.start.y + piece.grainline.end.y) * 0.5})`}
                      >
                        WARP GRAINLINE
                      </text>
                    </g>
                  )}

                  {/* Piece Header Label Box (Adaptively Scaled for Legibility) */}
                  <g transform={`translate(${(bbox.minX + bbox.maxX) * 0.5}, ${(bbox.minY + bbox.maxY) * 0.5}) scale(${labelScale})`}>
                    <rect
                      x="-95"
                      y="-24"
                      width="190"
                      height="48"
                      rx="12"
                      fill="#FFFFFF"
                      stroke={isSelected ? '#245C46' : '#CBD5E1'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="filter drop-shadow-md"
                    />
                    <text
                      textAnchor="middle"
                      y="-3"
                      fill="#18251F"
                      fontSize="13"
                      fontWeight="800"
                    >
                      {piece.name.toUpperCase()}
                    </text>
                    <text
                      textAnchor="middle"
                      y="16"
                      fill="#245C46"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      CUT {piece.cutCount} · {piece.isMirrored ? 'MIRRORED' : 'ON FOLD'}
                    </text>
                  </g>

                  {/* Individual Boundary Edges & Adaptive Dimensions */}
                  {piece.boundary.map((edge) => {
                    const isEdgeSelected = selectedEdgeId === edge.id;
                    const midX = (edge.startPoint.x + edge.endPoint.x) * 0.5;
                    const midY = (edge.startPoint.y + edge.endPoint.y) * 0.5;

                    return (
                      <g
                        key={edge.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPieceId(piece.id);
                          setSelectedEdgeId(edge.id);
                        }}
                      >
                        {/* Interactive Click Buffer */}
                        <line
                          x1={edge.startPoint.x}
                          y1={edge.startPoint.y}
                          x2={edge.endPoint.x}
                          y2={edge.endPoint.y}
                          stroke={isEdgeSelected ? '#B99B70' : 'transparent'}
                          strokeWidth="10"
                          strokeLinecap="round"
                        />

                        {/* Edge Arc-Length Dimension Tag (Adaptively Scaled) */}
                        {showDimensions && (
                          <g transform={`translate(${midX}, ${midY - 8 * labelScale}) scale(${labelScale})`}>
                            <rect
                              x="-32"
                              y="-12"
                              width="64"
                              height="20"
                              rx="6"
                              fill={isEdgeSelected ? '#B99B70' : '#FFFFFF'}
                              stroke={isEdgeSelected ? '#8F7146' : '#E2E8F0'}
                              strokeWidth="1.2"
                              className="filter drop-shadow-xs"
                            />
                            <text
                              y="3"
                              fill={isEdgeSelected ? '#FFFFFF' : '#18251F'}
                              fontSize="11"
                              fontWeight="700"
                              textAnchor="middle"
                              className="pointer-events-none font-mono"
                            >
                              {Math.round(edge.arcLength)}mm
                            </text>
                          </g>
                        )}

                        {/* Construction Notches (Accurate Perpendicular Normal Slit Ticks) */}
                        {showNotches && (() => {
                          const notchTicks = computeNotchTicks(edge, Math.max(7, edge.seamAllowance));
                          return notchTicks.map((tick, tIdx) => (
                            <g key={tIdx}>
                              <line
                                x1={tick.p0.x}
                                y1={tick.p0.y}
                                x2={tick.p1.x}
                                y2={tick.p1.y}
                                stroke="#DC2626"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              {tick.isDouble && tick.secondTick && (
                                <line
                                  x1={tick.secondTick.p0.x}
                                  y1={tick.secondTick.p0.y}
                                  x2={tick.secondTick.p1.x}
                                  y2={tick.secondTick.p1.y}
                                  stroke="#DC2626"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                              )}
                              <circle cx={tick.p0.x} cy={tick.p0.y} r="2.5" fill="#DC2626" />
                            </g>
                          ));
                        })()}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Grade Nest Legend (ISO 8559-1 Standards) */}
        {showGradeNest && (
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-line shadow-md text-xs select-none">
            <div className="font-bold text-ink mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand" />
              <span>Multi-Size Grade Nest (ISO 8559-1)</span>
            </div>
            <div className="flex items-center gap-3">
              {STANDARD_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleSizeChange(sz)}
                  className={`flex items-center gap-1 text-[11px] font-mono cursor-pointer transition ${
                    sz === activeSize ? 'font-bold text-ink underline underline-offset-2' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${sz === activeSize ? 'ring-2 ring-offset-1 ring-ink' : ''}`}
                    style={{ backgroundColor: SIZE_NEST_COLORS[sz] }}
                  />
                  <span>{sz}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Properties & Seam Validation Inspector Panel */}
      {isSpecPanelOpen && (
        <div className="w-80 h-full bg-white border-l border-line flex flex-col z-20 overflow-y-auto shadow-lg animate-in slide-in-from-right-2">
          {/* Panel Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold text-ink">Pattern Specifications</h2>
            </div>
            <button
              onClick={() => setIsSpecPanelOpen(false)}
              className="p-1 text-muted hover:text-ink transition rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Parametric Dimension Adjustments */}
          <div className="p-5 border-b border-line space-y-4">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-brand" /> Parametric Eases & Block
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-ink-2">Chest Circumference Ease:</span>
                <span className="font-mono text-brand font-bold">+{chestEase} mm</span>
              </div>
              <input
                type="range"
                min="20"
                max="160"
                step="5"
                value={chestEase}
                onChange={(e) => handleParametricUpdate('chestEase', Number(e.target.value))}
                className="w-full accent-brand h-1.5 bg-line rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-ink-2">Sleeve Length (Crown to Cuff):</span>
                <span className="font-mono text-brand font-bold">{sleeveLength} mm</span>
              </div>
              <input
                type="range"
                min="140"
                max="350"
                step="5"
                value={sleeveLength}
                onChange={(e) => handleParametricUpdate('sleeveLength', Number(e.target.value))}
                className="w-full accent-brand h-1.5 bg-line rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-ink-2">Body Length Adjustment:</span>
                <span className="font-mono text-brand font-bold">
                  {lengthDelta >= 0 ? `+${lengthDelta}` : lengthDelta} mm
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="10"
                value={lengthDelta}
                onChange={(e) => handleParametricUpdate('lengthDelta', Number(e.target.value))}
                className="w-full accent-brand h-1.5 bg-line rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-ink-2 font-medium block">Neckline Architecture:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleParametricUpdate('neckStyle', 'crew')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    neckStyle === 'crew'
                      ? 'bg-brand text-white border-brand shadow-xs'
                      : 'bg-surface text-ink-2 border-line hover:bg-line'
                  }`}
                >
                  Crew Neck
                </button>
                <button
                  onClick={() => handleParametricUpdate('neckStyle', 'v')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    neckStyle === 'v'
                      ? 'bg-brand text-white border-brand shadow-xs'
                      : 'bg-surface text-ink-2 border-line hover:bg-line'
                  }`}
                >
                  V-Neckline
                </button>
              </div>
            </div>
          </div>

          {/* Seam Length Matching Validation */}
          <div className="p-5 border-b border-line space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand stroke-[3]" /> Seam Matching
              </h3>
              <span className="text-[10px] text-muted font-medium">Tolerance: ±4mm</span>
            </div>

            <div className="space-y-2.5">
              {project.sewingRelationships.map((rel) => {
                const pieceA = project.patternPieces.find((p) => p.id === rel.edgeA.pieceId);
                const pieceB = project.patternPieces.find((p) => p.id === rel.edgeB.pieceId);
                const edgeA = pieceA?.boundary.find((e) => e.id === rel.edgeA.edgeId);
                const edgeB = pieceB?.boundary.find((e) => e.id === rel.edgeB.edgeId);

                const lenA = edgeA ? Math.round(edgeA.arcLength) : 0;
                const lenB = edgeB ? Math.round(edgeB.arcLength) : 0;
                const diff = Math.abs(lenA - lenB);
                const isMatch = diff <= rel.toleranceMm;

                return (
                  <div
                    key={rel.id}
                    className="bg-surface p-3 rounded-xl border border-line text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{rel.name}</span>
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-brand font-bold bg-brand-soft px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" /> MATCH ({diff}mm)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-warning font-bold bg-warning-soft px-2 py-0.5 rounded-full border border-warning/30">
                          <AlertTriangle className="w-3 h-3" /> EASE ({diff}mm)
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-[11px] text-ink-2 font-mono">
                      <span>{pieceA?.name}: {lenA}mm</span>
                      <span>↔</span>
                      <span>{pieceB?.name}: {lenB}mm</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Piece Details */}
          <div className="p-4 bg-surface border-t border-line space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase">{selectedPiece.name}</span>
              <span className="text-[10px] text-brand font-mono font-bold">
                {selectedPiece.boundary.length} Edges · {selectedPiece.seamLine.length} Vertices
              </span>
            </div>
            <p className="text-[11px] text-ink-2">
              3D Anchor: <span className="text-ink font-mono font-semibold">{selectedPiece.arrangement3D.anchor}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
