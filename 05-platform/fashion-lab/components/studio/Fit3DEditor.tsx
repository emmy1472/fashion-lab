"use client";

import React, { useState } from "react";
import {
  Sliders,
  Scissors,
  RotateCcw,
  Sparkles,
  Layers,
  Palette,
  Check,
  X,
  Maximize2,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  GarmentFit3DConfig,
  DEFAULT_FIT_3D_CONFIG,
  FIT_3D_PRESETS,
  FABRIC_3D_PRESETS,
} from "./garment3DBuilder";

interface Fit3DEditorProps {
  fitConfig: GarmentFit3DConfig;
  onChange: (newConfig: GarmentFit3DConfig) => void;
  onReset: () => void;
  onClose: () => void;
  garmentCategory?: string;
  garmentName?: string;
  isExpanded?: boolean;
}

export function Fit3DEditor({
  fitConfig,
  onChange,
  onReset,
  onClose,
  garmentCategory = "Outerwear",
  garmentName = "Garment",
  isExpanded = false,
}: Fit3DEditorProps) {
  const [activeSubTab, setActiveSubTab] = useState<"silhouette" | "sleeves" | "fabric" | "hardware">("silhouette");

  const updateParam = <K extends keyof GarmentFit3DConfig>(key: K, value: GarmentFit3DConfig[K]) => {
    onChange({
      ...fitConfig,
      [key]: value,
      // If user manually adjusts a slider, mark preset as custom
      ...(key !== "fitPreset" ? { fitPreset: undefined } : {}),
    });
  };

  const applyFitPreset = (presetKey: string) => {
    const preset = FIT_3D_PRESETS[presetKey];
    if (!preset) return;
    onChange({
      ...fitConfig,
      ...preset,
      fitPreset: presetKey as any,
    });
  };

  const applyFabricPreset = (fabricKey: string) => {
    const preset = FABRIC_3D_PRESETS[fabricKey];
    if (!preset) return;
    onChange({
      ...fitConfig,
      fabricType: fabricKey as any,
      roughness: preset.roughness,
      sheen: preset.sheen,
      bumpScale: preset.bumpScale,
    });
  };

  return (
    <div
      className={`absolute top-11 bottom-0 right-0 z-30 flex flex-col bg-white/95 backdrop-blur-md shadow-2xl border-l border-line transition-all duration-300 animate-in slide-in-from-right ${
        isExpanded ? "w-[360px]" : "w-full max-w-[320px]"
      }`}
    >
      {/* 3D Editor Top Header */}
      <div className="h-12 border-b border-line px-4 flex items-center justify-between bg-white/90 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-soft text-brand flex items-center justify-center shadow-2xs">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink leading-tight">3D Fit & Style Editor</h3>
            <p className="text-[10px] text-muted truncate max-w-[170px]">{garmentName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            title="Reset All Adjustments to Default"
            className="w-7 h-7 rounded-lg text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close 3D Editor"
            className="w-7 h-7 rounded-lg text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation Pill Strip */}
      <div className="grid grid-cols-4 p-1.5 bg-surface/80 border-b border-line gap-1 text-[10.5px] font-semibold shrink-0">
        {[
          { id: "silhouette", label: "Fit & Cut", icon: "📐" },
          { id: "sleeves", label: "Sleeves", icon: "✂️" },
          { id: "fabric", label: "Fabric", icon: "🧵" },
          { id: "hardware", label: "Trim", icon: "⚙️" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-1.5 px-1 rounded-lg text-center transition flex flex-col items-center gap-0.5 ${
              activeSubTab === tab.id
                ? "bg-white text-brand font-bold shadow-2xs border border-line/70"
                : "text-muted hover:text-ink hover:bg-surface-2/50"
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span className="leading-none">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Scrollable Adjustments Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-ink-2">
        {/* ── TAB 1: SILHOUETTE & FIT ── */}
        {activeSubTab === "silhouette" && (
          <div className="space-y-4">
            {/* Quick One-Click Fit Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Instant Silhouette Presets
                </span>
                {fitConfig.fitPreset && (
                  <span className="text-[10px] font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(FIT_3D_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyFitPreset(key)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      fitConfig.fitPreset === key
                        ? "border-brand bg-brand-soft shadow-2xs ring-1 ring-brand/30"
                        : "border-line/80 bg-white hover:border-line-strong hover:bg-surface/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{p.icon}</span>
                      <div>
                        <div className="font-bold text-ink text-xs">{p.label}</div>
                        <div className="text-[10px] text-muted leading-tight">{p.desc}</div>
                      </div>
                    </div>
                    {fitConfig.fitPreset === key && (
                      <Check className="w-4 h-4 text-brand shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Precision Fit Sliders */}
            <div className="space-y-3 pt-2 border-t border-line">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Torso Proportions & Ease
              </span>

              {/* Chest Width / Ease */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink-2">Chest Width (Ease)</span>
                  <span className="font-mono font-bold text-brand">
                    {Math.round((fitConfig.torsoWidthScale ?? 1.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.30"
                  step="0.01"
                  value={fitConfig.torsoWidthScale ?? 1.0}
                  onChange={(e) => updateParam("torsoWidthScale", parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted">
                  <span>Tailored (85%)</span>
                  <span>Regular (100%)</span>
                  <span>Oversized (130%)</span>
                </div>
              </div>

              {/* Torso Depth / Front-to-Back Volume */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink-2">Torso Depth (Volume)</span>
                  <span className="font-mono font-bold text-brand">
                    {Math.round((fitConfig.torsoDepthScale ?? 1.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.30"
                  step="0.01"
                  value={fitConfig.torsoDepthScale ?? 1.0}
                  onChange={(e) => updateParam("torsoDepthScale", parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
              </div>

              {/* Garment Length (Crop vs Longline) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink-2">Garment Length</span>
                  <span className="font-mono font-bold text-brand">
                    {(fitConfig.garmentLengthScale ?? 1.0) < 0.95
                      ? "Cropped (" + Math.round((fitConfig.garmentLengthScale ?? 1.0) * 100) + "%)"
                      : (fitConfig.garmentLengthScale ?? 1.0) > 1.05
                      ? "Longline (" + Math.round((fitConfig.garmentLengthScale ?? 1.0) * 100) + "%)"
                      : "Standard"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.25"
                  step="0.01"
                  value={fitConfig.garmentLengthScale ?? 1.0}
                  onChange={(e) => updateParam("garmentLengthScale", parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted">
                  <span>Boxy Crop</span>
                  <span>Standard</span>
                  <span>Longline</span>
                </div>
              </div>

              {/* Drop Shoulder */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink-2">Drop Shoulder Slouch</span>
                  <span className="font-mono font-bold text-brand">
                    {Math.round((fitConfig.shoulderDrop ?? 0.0) * 100)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.05"
                  step="0.002"
                  value={fitConfig.shoulderDrop ?? 0.0}
                  onChange={(e) => updateParam("shoulderDrop", parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted">
                  <span>Structured High</span>
                  <span>Subtle Drop</span>
                  <span>Deep Street Slouch</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SLEEVES & DRAPE ── */}
        {activeSubTab === "sleeves" && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
              Sleeve Architecture & Drapery
            </span>

            {/* Sleeve Length */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-ink-2">Sleeve Extension</span>
                <span className="font-mono font-bold text-brand">
                  {(fitConfig.sleeveLengthScale ?? 1.0) <= 0.4
                    ? "Cap / Short"
                    : (fitConfig.sleeveLengthScale ?? 1.0) <= 0.75
                    ? "3/4 Quarter"
                    : (fitConfig.sleeveLengthScale ?? 1.0) > 1.05
                    ? "Extra Long Slouch"
                    : "Standard Full"}
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="1.25"
                step="0.01"
                value={fitConfig.sleeveLengthScale ?? 1.0}
                onChange={(e) => updateParam("sleeveLengthScale", parseFloat(e.target.value))}
                className="w-full accent-brand cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-muted">
                <span>Short</span>
                <span>3/4 Length</span>
                <span>Wrist</span>
                <span>Oversized</span>
              </div>
            </div>

            {/* Sleeve Fullness / Bicep Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-ink-2">Sleeve Fullness & Bicep Width</span>
                <span className="font-mono font-bold text-brand">
                  {Math.round((fitConfig.sleeveVolumeScale ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.35"
                step="0.01"
                value={fitConfig.sleeveVolumeScale ?? 1.0}
                onChange={(e) => updateParam("sleeveVolumeScale", parseFloat(e.target.value))}
                className="w-full accent-brand cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-muted">
                <span>Streamlined</span>
                <span>Standard</span>
                <span>Billowy Balloon</span>
              </div>
            </div>

            {/* Wrist Cuff Snugness */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-ink-2">Wrist Cuff Gather / Opening</span>
                <span className="font-mono font-bold text-brand">
                  {Math.round((fitConfig.cuffSnugness ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.65"
                max="1.35"
                step="0.01"
                value={fitConfig.cuffSnugness ?? 1.0}
                onChange={(e) => updateParam("cuffSnugness", parseFloat(e.target.value))}
                className="w-full accent-brand cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-muted">
                <span>Snug Elastic</span>
                <span>Relaxed</span>
                <span>Flared Bell</span>
              </div>
            </div>

            {/* Drape & Cloth Creases Intensity */}
            <div className="space-y-1 pt-2 border-t border-line">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-ink-2">Organic Fold & Crease Intensity</span>
                <span className="font-mono font-bold text-brand">
                  {Math.round((fitConfig.drapeFoldIntensity ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={fitConfig.drapeFoldIntensity ?? 1.0}
                onChange={(e) => updateParam("drapeFoldIntensity", parseFloat(e.target.value))}
                className="w-full accent-brand cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-muted">
                <span>Crisp Press</span>
                <span>Natural Wear</span>
                <span>Heavy Street Drape</span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: FABRIC & TEXTURE FINISH ── */}
        {activeSubTab === "fabric" && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
              Textile Character & Physical Sheen
            </span>

            {/* Fabric Material Presets */}
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(FABRIC_3D_PRESETS).map(([key, f]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyFabricPreset(key)}
                  className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                    fitConfig.fabricType === key
                      ? "border-brand bg-brand-soft shadow-2xs ring-1 ring-brand/30"
                      : "border-line/80 bg-white hover:border-line-strong hover:bg-surface/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{f.icon}</span>
                    {fitConfig.fabricType === key && (
                      <Check className="w-3.5 h-3.5 text-brand" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-ink text-[11px] leading-tight">{f.label}</div>
                    <div className="text-[9px] text-muted truncate">{f.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Sliders for Fine-Tuning */}
            <div className="space-y-3 pt-2 border-t border-line">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Surface Micro-Optics
              </span>

              {/* Surface Roughness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink-2">Surface Roughness</span>
                  <span className="font-mono font-bold text-brand">
                    {Math.round((fitConfig.roughness ?? 0.62) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.95"
                  step="0.01"
                  value={fitConfig.roughness ?? 0.62}
                  onChange={(e) => updateParam("roughness", parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted">
                  <span>Gloss / Lustre</span>
                  <span>Medium Soft</span>
                  <span>Pure Matte</span>
                </div>
              </div>

              {/* Fabric Sheen (Specular Micro-Fibers) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink-2">Micro-Fiber Sheen</span>
                  <span className="font-mono font-bold text-brand">
                    {Math.round((fitConfig.sheen ?? 0.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.80"
                  step="0.02"
                  value={fitConfig.sheen ?? 0.0}
                  onChange={(e) => updateParam("sheen", parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted">
                  <span>Zero Glare (Cotton)</span>
                  <span>Silky Glow</span>
                  <span>High Lustre Satin</span>
                </div>
              </div>

              {/* Textile Weave Depth */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink-2">Textile Weave Bump Depth</span>
                  <span className="font-mono font-bold text-brand">
                    {Math.round((fitConfig.bumpScale ?? 0.0016) * 10000) / 10} μm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0005"
                  max="0.0040"
                  step="0.0002"
                  value={fitConfig.bumpScale ?? 0.0016}
                  onChange={(e) => updateParam("bumpScale", parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted">
                  <span>Smooth Poplin</span>
                  <span>Woven Twill</span>
                  <span>Heavy Knit/Denim</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: HARDWARE & TRIM ── */}
        {activeSubTab === "hardware" && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
              Hardware Trims & Metallurgy
            </span>

            {/* Zipper Metal Finish */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-ink-2">Zipper Track & Slider Finish</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "silver", label: "Polished Silver", hex: "#E2E8F0", sub: "Chrome shine" },
                  { id: "brass", label: "Antique Brass", hex: "#D97706", sub: "Vintage gold" },
                  { id: "gunmetal", label: "Gunmetal", hex: "#334155", sub: "Dark stealth" },
                  { id: "matte", label: "Matte Enamel", hex: "#0E6E55", sub: "Tonal body color" },
                ].map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => updateParam("zipperFinish", z.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      (fitConfig.zipperFinish || "silver") === z.id
                        ? "border-brand bg-brand-soft shadow-2xs ring-1 ring-brand/30"
                        : "border-line/80 bg-white hover:border-line-strong"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-line-strong shadow-2xs shrink-0"
                      style={{ backgroundColor: z.hex }}
                    />
                    <div>
                      <div className="font-bold text-ink text-xs leading-none">{z.label}</div>
                      <div className="text-[9px] text-muted mt-0.5">{z.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-3 bg-brand-soft/70 rounded-xl border border-emerald-100 flex items-start gap-2 text-emerald-900 text-[11px]">
              <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Real-time Morphing:</span> Every adjustment recalculates the 123,500-vertex 3D cloth simulation instantly.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3D Editor Bottom Dock Bar */}
      <div className="p-3 border-t border-line bg-white/95 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-2 rounded-xl border border-line hover:bg-surface text-ink-2 text-xs font-semibold transition flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-muted" />
          <span>Reset Fit</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}
