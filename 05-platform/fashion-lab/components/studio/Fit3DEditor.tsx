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
      className={`absolute top-11 bottom-0 right-0 z-30 flex flex-col bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200 transition-all duration-300 animate-in slide-in-from-right ${
        isExpanded ? "w-[360px]" : "w-full max-w-[320px]"
      }`}
    >
      {/* 3D Editor Top Header */}
      <div className="h-12 border-b border-gray-100 px-4 flex items-center justify-between bg-white/90 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#0E6E55] flex items-center justify-center shadow-2xs">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 leading-tight">3D Fit & Style Editor</h3>
            <p className="text-[10px] text-gray-500 truncate max-w-[170px]">{garmentName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            title="Reset All Adjustments to Default"
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close 3D Editor"
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation Pill Strip */}
      <div className="grid grid-cols-4 p-1.5 bg-gray-50/80 border-b border-gray-100 gap-1 text-[10.5px] font-semibold shrink-0">
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
                ? "bg-white text-[#0E6E55] font-bold shadow-2xs border border-gray-200/70"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span className="leading-none">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Scrollable Adjustments Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-gray-700">
        {/* ── TAB 1: SILHOUETTE & FIT ── */}
        {activeSubTab === "silhouette" && (
          <div className="space-y-4">
            {/* Quick One-Click Fit Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Instant Silhouette Presets
                </span>
                {fitConfig.fitPreset && (
                  <span className="text-[10px] font-bold text-[#0E6E55] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
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
                        ? "border-[#0E6E55] bg-[#ECFDF5] shadow-2xs ring-1 ring-[#0E6E55]/30"
                        : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{p.icon}</span>
                      <div>
                        <div className="font-bold text-gray-900 text-xs">{p.label}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{p.desc}</div>
                      </div>
                    </div>
                    {fitConfig.fitPreset === key && (
                      <Check className="w-4 h-4 text-[#0E6E55] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Precision Fit Sliders */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Torso Proportions & Ease
              </span>

              {/* Chest Width / Ease */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Chest Width (Ease)</span>
                  <span className="font-mono font-bold text-[#0E6E55]">
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
                  className="w-full accent-[#0E6E55] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Tailored (85%)</span>
                  <span>Regular (100%)</span>
                  <span>Oversized (130%)</span>
                </div>
              </div>

              {/* Torso Depth / Front-to-Back Volume */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Torso Depth (Volume)</span>
                  <span className="font-mono font-bold text-[#0E6E55]">
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
                  className="w-full accent-[#0E6E55] cursor-pointer"
                />
              </div>

              {/* Garment Length (Crop vs Longline) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Garment Length</span>
                  <span className="font-mono font-bold text-[#0E6E55]">
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
                  className="w-full accent-[#0E6E55] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Boxy Crop</span>
                  <span>Standard</span>
                  <span>Longline</span>
                </div>
              </div>

              {/* Drop Shoulder */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Drop Shoulder Slouch</span>
                  <span className="font-mono font-bold text-[#0E6E55]">
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
                  className="w-full accent-[#0E6E55] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Sleeve Architecture & Drapery
            </span>

            {/* Sleeve Length */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Sleeve Extension</span>
                <span className="font-mono font-bold text-[#0E6E55]">
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
                className="w-full accent-[#0E6E55] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>Short</span>
                <span>3/4 Length</span>
                <span>Wrist</span>
                <span>Oversized</span>
              </div>
            </div>

            {/* Sleeve Fullness / Bicep Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Sleeve Fullness & Bicep Width</span>
                <span className="font-mono font-bold text-[#0E6E55]">
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
                className="w-full accent-[#0E6E55] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>Streamlined</span>
                <span>Standard</span>
                <span>Billowy Balloon</span>
              </div>
            </div>

            {/* Wrist Cuff Snugness */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Wrist Cuff Gather / Opening</span>
                <span className="font-mono font-bold text-[#0E6E55]">
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
                className="w-full accent-[#0E6E55] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>Snug Elastic</span>
                <span>Relaxed</span>
                <span>Flared Bell</span>
              </div>
            </div>

            {/* Drape & Cloth Creases Intensity */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Organic Fold & Crease Intensity</span>
                <span className="font-mono font-bold text-[#0E6E55]">
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
                className="w-full accent-[#0E6E55] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400">
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
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
                      ? "border-[#0E6E55] bg-[#ECFDF5] shadow-2xs ring-1 ring-[#0E6E55]/30"
                      : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{f.icon}</span>
                    {fitConfig.fabricType === key && (
                      <Check className="w-3.5 h-3.5 text-[#0E6E55]" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-[11px] leading-tight">{f.label}</div>
                    <div className="text-[9px] text-gray-500 truncate">{f.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Sliders for Fine-Tuning */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Surface Micro-Optics
              </span>

              {/* Surface Roughness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Surface Roughness</span>
                  <span className="font-mono font-bold text-[#0E6E55]">
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
                  className="w-full accent-[#0E6E55] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Gloss / Lustre</span>
                  <span>Medium Soft</span>
                  <span>Pure Matte</span>
                </div>
              </div>

              {/* Fabric Sheen (Specular Micro-Fibers) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Micro-Fiber Sheen</span>
                  <span className="font-mono font-bold text-[#0E6E55]">
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
                  className="w-full accent-[#0E6E55] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Zero Glare (Cotton)</span>
                  <span>Silky Glow</span>
                  <span>High Lustre Satin</span>
                </div>
              </div>

              {/* Textile Weave Depth */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Textile Weave Bump Depth</span>
                  <span className="font-mono font-bold text-[#0E6E55]">
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
                  className="w-full accent-[#0E6E55] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Hardware Trims & Metallurgy
            </span>

            {/* Zipper Metal Finish */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700">Zipper Track & Slider Finish</span>
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
                        ? "border-[#0E6E55] bg-[#ECFDF5] shadow-2xs ring-1 ring-[#0E6E55]/30"
                        : "border-gray-200/80 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: z.hex }}
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-xs leading-none">{z.label}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{z.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-start gap-2 text-emerald-900 text-[11px]">
              <Info className="w-4 h-4 text-[#0E6E55] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Real-time Morphing:</span> Every adjustment recalculates the 123,500-vertex 3D cloth simulation instantly.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3D Editor Bottom Dock Bar */}
      <div className="p-3 border-t border-gray-100 bg-white/95 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
          <span>Reset Fit</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 rounded-xl bg-[#0E6E55] hover:bg-[#09503E] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}
