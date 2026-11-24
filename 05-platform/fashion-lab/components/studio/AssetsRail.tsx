"use client";

import { useState } from "react";
import {
  Search,
  Shirt,
  Sparkles,
  ChevronRight,
  Upload,
  Layers,
  Scissors,
  Award,
  ShoppingBag,
  X,
  PenTool,
  RotateCcw,
  Link2,
  Check,
  Play,
} from "lucide-react";

export interface CustomCutLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  joined?: boolean;
  stitchType?: string;
}

export interface ScratchConfig {
  baseMode: "block" | "exploded" | "croquis";
  neckType: "crew" | "v" | "deepv" | "scoop" | "square" | "stand" | "hood";
  sleeveType: "sleeveless" | "cap" | "short" | "three-quarter" | "long" | "bell";
  shoulderWidth: number;
  chestWidth: number;
  waistWidth: number;
  hipWidth: number;
  garmentLength: number;
  cutSplitMode?:
    | "none"
    | "center-split"
    | "princess"
    | "colorblock-h"
    | "diagonal-sash"
    | "chevron-v"
    | "empire-curve";
  cutY?: number;
  explodeAmount?: number;
  showCroquis?: boolean;
  customCuts?: CustomCutLine[];
  parts: {
    sidePanel: boolean;
    yoke: boolean;
    zipper: boolean;
    placket: boolean;
    pocket: boolean;
    hood: boolean;
    hemband: boolean;
    cuffs: boolean;
    sleeveStripes: boolean;
  };
}

interface Props {
  garments: any[];
  categories: string[];
  selectedGarmentId: string;
  onSelectGarment: (id: string) => void;
  scratchConfig?: ScratchConfig;
  onUpdateScratchConfig?: (next: ScratchConfig) => void;
  onActivateCanvasTool?: (
    tool: "select" | "move" | "scale" | "rotate" | "draw" | "cut" | "join"
  ) => void;
  onOpenDemo?: () => void;
  patterns: any[];
  selectedPatternId: string;
  onSelectPattern: (id: string) => void;
  emblems: any[];
  onAddEmblem: (id: string) => void;
  onUploadImage?: (file: File) => void;
}

const FEATURED_GARMENTS = [
  { id: "track-jacket", name: "Jacket", category: "Outerwear" },
  { id: "hoodie", name: "Hoodie", category: "Tops" },
  { id: "tee", name: "T-Shirt", category: "Tops" },
  { id: "denim-jeans", name: "Wide-Leg Jeans", category: "Bottoms" },
  { id: "drawstring-jeans", name: "Drawstring Jeans", category: "Bottoms" },
  { id: "joggers", name: "Joggers", category: "Bottoms" },
  { id: "blazer", name: "Coat", category: "Formalwear" },
  { id: "crewneck", name: "Sweater", category: "Tops" },
  { id: "zip-hoodie", name: "Zip Hoodie", category: "Outerwear" },
  { id: "polo", name: "Polo", category: "Tops" },
  { id: "soccer-jersey", name: "Jersey", category: "Jerseys" },
];

const CATEGORY_ROWS = [
  { id: "Tops", label: "Tops", icon: Shirt },
  { id: "Bottoms", label: "Bottoms", icon: Scissors },
  { id: "Outerwear", label: "Outerwear", icon: Layers },
  { id: "Jerseys", label: "Activewear", icon: Award },
  { id: "Dresses", label: "Dresses", icon: Sparkles },
  { id: "Accessories", label: "Accessories", icon: ShoppingBag },
];

export function AssetsRail({
  garments,
  selectedGarmentId,
  onSelectGarment,
  scratchConfig,
  onUpdateScratchConfig,
  onActivateCanvasTool,
  onOpenDemo,
  patterns,
  selectedPatternId,
  onSelectPattern,
  emblems,
  onAddEmblem,
  onUploadImage,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "garments" | "graphics" | "logos" | "patterns"
  >("garments");
  const [scratchStep, setScratchStep] = useState<"shape" | "cut" | "join">("shape");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(
    null
  );

  const isScratchSelected = selectedGarmentId === "custom-scratch";

  const updateScratch = (patch: Partial<ScratchConfig>) => {
    if (!scratchConfig || !onUpdateScratchConfig) return;
    onUpdateScratchConfig({
      ...scratchConfig,
      ...patch,
    });
  };

  const toggleScratchPart = (partKey: keyof ScratchConfig["parts"]) => {
    if (!scratchConfig || !onUpdateScratchConfig) return;
    onUpdateScratchConfig({
      ...scratchConfig,
      parts: {
        ...scratchConfig.parts,
        [partKey]: !scratchConfig.parts[partKey],
      },
    });
  };

  const handleJoinAllPieces = () => {
    if (!scratchConfig || !onUpdateScratchConfig) return;
    const joinedCuts = (scratchConfig.customCuts || []).map((c) => ({
      ...c,
      joined: true,
    }));
    onUpdateScratchConfig({
      ...scratchConfig,
      baseMode: "block",
      explodeAmount: 0,
      customCuts: joinedCuts,
    });
  };

  // Determine active fit preset for friendly 1-click selection
  const currentFitId = (() => {
    if (!scratchConfig) return "regular";
    if (scratchConfig.garmentLength <= 475) return "cropped";
    if (scratchConfig.hipWidth >= 195) return "dress";
    if (scratchConfig.waistWidth >= 152) return "oversized";
    if (scratchConfig.waistWidth <= 118) return "fitted";
    return "regular";
  })();

  const applyFriendlyFit = (fit: "cropped" | "fitted" | "regular" | "oversized" | "dress") => {
    if (fit === "cropped") {
      updateScratch({
        shoulderWidth: 112,
        chestWidth: 136,
        waistWidth: 122,
        hipWidth: 130,
        garmentLength: 445,
      });
    } else if (fit === "fitted") {
      updateScratch({
        shoulderWidth: 118,
        chestWidth: 140,
        waistWidth: 112,
        hipWidth: 142,
        garmentLength: 575,
      });
    } else if (fit === "regular") {
      updateScratch({
        shoulderWidth: 126,
        chestWidth: 148,
        waistWidth: 136,
        hipWidth: 148,
        garmentLength: 590,
      });
    } else if (fit === "oversized") {
      updateScratch({
        shoulderWidth: 142,
        chestWidth: 164,
        waistWidth: 160,
        hipWidth: 162,
        garmentLength: 615,
      });
    } else if (fit === "dress") {
      updateScratch({
        shoulderWidth: 116,
        chestWidth: 138,
        waistWidth: 110,
        hipWidth: 215,
        garmentLength: 665,
      });
    }
  };

  // Render authentic vector silhouette thumbnail directly from garment's anatomical zones
  const renderGarmentThumbnail = (g: any, isPrimarySelected: boolean) => {
    try {
      const zones = typeof g?.zones === "function" ? g.zones("front") : [];
      if (!zones || zones.length === 0) throw new Error("No zones");

      const colors: Record<string, string> = isPrimarySelected
        ? {
            primary: "#062D24",
            secondary: "#10B981",
            accent: "#0E6E55",
            tertiary: "#FFFFFF",
          }
        : {
            primary: "#4B5563",
            secondary: "#9CA3AF",
            accent: "#374151",
            tertiary: "#E5E7EB",
          };

      return (
        <svg
          viewBox="40 50 520 600"
          className="w-full h-full object-contain"
          preserveAspectRatio="xMidYMid meet"
        >
          {zones.map((z: any, idx: number) => {
            if (z.strokeOnly) {
              return (
                <path
                  key={idx}
                  d={z.d}
                  fill="none"
                  stroke={colors[z.role] || "#10B981"}
                  strokeWidth={z.width || 4}
                  strokeLinecap="round"
                />
              );
            }
            return (
              <path
                key={idx}
                d={z.d}
                fill={colors[z.role] || "#4B5563"}
                stroke="#ffffff"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      );
    } catch {
      return (
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-muted" fill="currentColor">
          <path d="M30 20 L40 10 L60 10 L70 20 L90 35 L80 50 L70 42 L70 90 L30 90 L30 42 L20 50 L10 35 Z" />
        </svg>
      );
    }
  };

  const displayedGarments = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (q || activeCategoryFilter) {
      return garments
        .filter((g) => {
          const matchesSearch =
            !q ||
            g.name.toLowerCase().includes(q) ||
            g.category?.toLowerCase().includes(q);
          const matchesCat =
            !activeCategoryFilter || g.category === activeCategoryFilter;
          return matchesSearch && matchesCat;
        })
        .slice(0, 9);
    }
    return FEATURED_GARMENTS.map((item) => {
      const matched = garments.find((g) => g.id === item.id) || garments[0];
      return { ...matched, id: item.id, displayName: item.name };
    });
  })();

  const isSeparated =
    scratchConfig?.baseMode === "exploded" ||
    (scratchConfig?.explodeAmount || 0) > 10;

  return (
    <div className="w-[235px] bg-white border-r border-line/80 flex flex-col h-full select-none shrink-0">
      {/* Aligned Column Header */}
      <div className="h-11 px-4 border-b border-line flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-ink tracking-tight">Assets</h3>
        {activeCategoryFilter && (
          <button
            type="button"
            onClick={() => setActiveCategoryFilter(null)}
            className="flex items-center gap-1 text-[10px] font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded-md"
          >
            <span>{activeCategoryFilter}</span>
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Horizontal Sub-Tabs (Garments | Graphics | Logos | Patterns) */}
      <div className="px-3 border-b border-line flex items-center justify-between shrink-0">
        {[
          { id: "garments", label: "Garments" },
          { id: "graphics", label: "Graphics" },
          { id: "logos", label: "Logos" },
          { id: "patterns", label: "Patterns" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 text-[11px] font-semibold transition border-b-2 ${
                isActive
                  ? "text-brand border-brand font-bold"
                  : "text-muted hover:text-ink-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Compact Search Bar */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-surface border border-line/80 rounded-lg pl-8 pr-2.5 py-1.5 text-[11px] text-ink placeholder-muted focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3.5">
        {activeTab === "garments" && (
          <>
            {/* Featured Action Card: Design from Scratch */}
            <button
              type="button"
              onClick={() => onSelectGarment("custom-scratch")}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                isScratchSelected
                  ? "border-brand bg-brand-strong text-white shadow-sm"
                  : "border-dashed border-success/70 bg-brand-soft/60 hover:bg-brand-soft text-ink"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                    isScratchSelected
                      ? "bg-success text-brand-strong"
                      : "bg-brand text-white"
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block truncate">
                    Design from Scratch
                  </span>
                  <p
                    className={`text-[9.5px] truncate ${
                      isScratchSelected ? "text-emerald-200/90" : "text-muted"
                    }`}
                  >
                    3-Step Shape, Cut & Join
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 ${
                  isScratchSelected
                    ? "text-emerald-300 rotate-90"
                    : "text-brand"
                } transition-transform`}
              />
            </button>

            {/* Watch 24s Video Demo Button */}
            {onOpenDemo && (
              <button
                type="button"
                onClick={onOpenDemo}
                className="w-full py-1.5 px-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-1.5 text-[10.5px] font-bold transition shadow-2xs cursor-pointer"
              >
                <Play className="w-3 h-3 fill-success text-success" />
                <span>Watch 24s Video Tutorial</span>
              </button>
            )}

            {/* Simple 3-Step Guided Builder (1. Shape -> 2. Cut -> 3. Join) */}
            {isScratchSelected && scratchConfig && (
              <div className="p-2.5 rounded-xl border border-brand/20/90 bg-surface space-y-2.5">
                {/* 3-Step Segmented Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-white p-0.5 rounded-lg border border-line">
                  {[
                    { id: "shape", label: "1. Shape" },
                    { id: "cut", label: "2. Cut" },
                    { id: "join", label: "3. Join" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setScratchStep(st.id as any);
                        if (st.id === "cut" && onActivateCanvasTool) {
                          onActivateCanvasTool("cut");
                        } else if (st.id === "join" && onActivateCanvasTool) {
                          onActivateCanvasTool("join");
                        }
                      }}
                      className={`py-1.5 rounded-md text-[10px] font-bold transition ${
                        scratchStep === st.id
                          ? "bg-brand text-white shadow-2xs"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* STEP 1: SHAPE (Neckline, Sleeves, Fit) */}
                {scratchStep === "shape" && (
                  <div className="space-y-2.5">
                    {/* Neckline */}
                    <div>
                      <span className="text-[9.5px] font-bold text-ink-2 block mb-1">
                        Neckline
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "crew", label: "Crew" },
                          { id: "v", label: "V-Neck" },
                          { id: "scoop", label: "Scoop" },
                          { id: "square", label: "Square" },
                          { id: "stand", label: "Collar" },
                          { id: "hood", label: "Hoodie" },
                        ].map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() =>
                              updateScratch({
                                neckType: n.id as ScratchConfig["neckType"],
                                parts: {
                                  ...scratchConfig.parts,
                                  hood: n.id === "hood",
                                },
                              })
                            }
                            className={`py-1 px-1 rounded-md text-[10px] font-semibold border transition ${
                              scratchConfig.neckType === n.id
                                ? "bg-brand text-white border-brand font-bold"
                                : "bg-white text-ink-2 border-line hover:border-line-strong"
                            }`}
                          >
                            {n.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sleeves */}
                    <div>
                      <span className="text-[9.5px] font-bold text-ink-2 block mb-1">
                        Sleeves
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "sleeveless", label: "Tank" },
                          { id: "short", label: "Short" },
                          { id: "long", label: "Long" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              updateScratch({
                                sleeveType: s.id as ScratchConfig["sleeveType"],
                              })
                            }
                            className={`py-1 px-1 rounded-md text-[10px] font-semibold border transition ${
                              scratchConfig.sleeveType === s.id
                                ? "bg-brand text-white border-brand font-bold"
                                : "bg-white text-ink-2 border-line hover:border-line-strong"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Friendly Fit & Length */}
                    <div>
                      <span className="text-[9.5px] font-bold text-ink-2 block mb-1">
                        Fit & Length
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: "cropped", label: "Cropped" },
                          { id: "fitted", label: "Tailored Fit" },
                          { id: "regular", label: "Regular Fit" },
                          { id: "oversized", label: "Oversized" },
                          { id: "dress", label: "A-Line Dress" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => applyFriendlyFit(f.id as any)}
                            className={`py-1 px-1.5 rounded-md text-[10px] font-semibold border transition ${
                              currentFitId === f.id
                                ? "bg-brand text-white border-brand font-bold"
                                : "bg-white text-ink-2 border-line hover:border-line-strong"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CUT & DRAW PANELS */}
                {scratchStep === "cut" && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] text-muted leading-snug">
                      Pick a cut style below or drag across the clothes to slice into colorable panels:
                    </p>

                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: "none", label: "Solid (No Cut)" },
                        { id: "center-split", label: "Left / Right Split" },
                        { id: "colorblock-h", label: "Top / Bottom Cut" },
                        { id: "chevron-v", label: "V-Chest Cut" },
                        { id: "diagonal-sash", label: "Diagonal Cut" },
                        { id: "princess", label: "3-Panel Tailor" },
                      ].map((c) => {
                        const active =
                          (scratchConfig.cutSplitMode || "none") === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              updateScratch({
                                cutSplitMode: c.id as ScratchConfig["cutSplitMode"],
                              })
                            }
                            className={`py-1.5 px-1.5 rounded-md text-[10px] font-semibold border transition truncate ${
                              active
                                ? "bg-brand text-white border-brand font-bold"
                                : "bg-white text-ink-2 border-line hover:border-line-strong"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onActivateCanvasTool && onActivateCanvasTool("cut")
                        }
                        className="flex-1 py-1.5 px-2 rounded-lg bg-danger-soft hover:bg-red-100 border border-danger/30 text-danger flex items-center justify-center gap-1 text-[10px] font-bold transition"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Knife Cut</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onActivateCanvasTool && onActivateCanvasTool("draw")
                        }
                        className="flex-1 py-1.5 px-2 rounded-lg bg-brand-soft hover:bg-brand-soft-hover border border-brand/20 text-brand flex items-center justify-center gap-1 text-[10px] font-bold transition"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Draw Panel</span>
                      </button>
                    </div>

                    {(scratchConfig.customCuts?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => updateScratch({ customCuts: [] })}
                        className="w-full py-1 text-[9.5px] font-semibold text-danger hover:underline flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset Custom Knife Cuts</span>
                      </button>
                    )}
                  </div>
                )}

                {/* STEP 3: JOIN & DETAILS */}
                {scratchStep === "join" && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] text-muted leading-snug">
                      Inspect separated pattern pieces with sewing threads or join them into a finished garment:
                    </p>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateScratch({
                            baseMode: "exploded",
                            explodeAmount: 85,
                          })
                        }
                        className={`py-2 px-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition ${
                          isSeparated
                            ? "bg-info text-white border-info"
                            : "bg-white text-ink-2 border-line hover:border-line-strong"
                        }`}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Separate Pieces</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleJoinAllPieces}
                        className={`py-2 px-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition ${
                          !isSeparated
                            ? "bg-brand text-white border-brand"
                            : "bg-white text-ink-2 border-line hover:border-brand"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Join & Sew All</span>
                      </button>
                    </div>

                    {/* Add-on Garment Details */}
                    <div>
                      <span className="text-[9.5px] font-bold text-ink-2 block mb-1">
                        Garment Details
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { key: "sidePanel", label: "Side Panels" },
                          { key: "zipper", label: "Center Zipper" },
                          { key: "pocket", label: "Front Pocket" },
                          { key: "placket", label: "Buttons" },
                        ].map((part) => {
                          const active =
                            scratchConfig.parts[
                              part.key as keyof ScratchConfig["parts"]
                            ];
                          return (
                            <button
                              key={part.key}
                              type="button"
                              onClick={() =>
                                toggleScratchPart(
                                  part.key as keyof ScratchConfig["parts"]
                                )
                              }
                              className={`py-1 px-2 rounded-md text-[10px] font-semibold border transition flex items-center justify-between ${
                                active
                                  ? "bg-brand-soft border-brand text-brand font-bold"
                                  : "bg-white border-line text-ink-2"
                              }`}
                            >
                              <span>{part.label}</span>
                              {active && <Check className="w-2.5 h-2.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pre-Built Templates Header */}
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Ready-Made Templates
              </span>
            </div>

            {/* 3x3 Garment Grid matching mockup */}
            <div className="grid grid-cols-3 gap-2">
              {displayedGarments.map((item: any) => {
                const isSelected = selectedGarmentId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectGarment(item.id)}
                    className={`p-1.5 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center ${
                      isSelected
                        ? "border-brand bg-brand-soft/60 ring-1 ring-brand"
                        : "border-line/70 bg-surface/60 hover:border-line-strong hover:bg-white"
                    }`}
                  >
                    <div className="w-full h-12 flex items-center justify-center p-0.5 mb-1 overflow-hidden pointer-events-none">
                      {renderGarmentThumbnail(item, isSelected)}
                    </div>
                    <span
                      className={`text-[10px] font-semibold truncate w-full leading-tight ${
                        isSelected ? "text-brand font-bold" : "text-ink-2"
                      }`}
                    >
                      {item.displayName || item.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Clean Categories List matching mockup */}
            <div className="pt-2 border-t border-line">
              <p className="text-[11px] font-bold text-ink mb-1.5 px-1">
                Categories
              </p>
              <div className="space-y-0.5">
                {CATEGORY_ROWS.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setActiveCategoryFilter(isActive ? null : cat.id)
                      }
                      className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-medium transition ${
                        isActive
                          ? "bg-brand-soft text-brand font-bold"
                          : "text-ink-2 hover:bg-surface hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-3.5 h-3.5 ${
                            isActive ? "text-brand" : "text-muted"
                          }`}
                        />
                        <span>{cat.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted" />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Graphics Tab */}
        {activeTab === "graphics" && (
          <div className="grid grid-cols-3 gap-2">
            {emblems.slice(0, 24).map((art: any) => (
              <button
                key={art.id}
                type="button"
                onClick={() => onAddEmblem(art.id)}
                title={`Add ${art.name}`}
                className="p-2 rounded-xl border border-line/80 bg-surface hover:border-brand hover:bg-brand-soft transition flex flex-col items-center justify-center text-center group"
              >
                <Sparkles className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-medium text-ink-2 truncate w-full mt-1">
                  {art.name || art.id}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Logos Upload Tab */}
        {activeTab === "logos" && (
          <div className="p-4 border border-dashed border-line-strong rounded-xl text-center hover:border-brand transition bg-surface">
            <Upload className="w-5 h-5 text-muted mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-ink">Upload Artwork</p>
            <p className="text-[10px] text-muted mb-2.5">SVG, PNG, JPG</p>
            <label className="inline-block bg-brand hover:bg-brand-hover text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition">
              Browse Files
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0] && onUploadImage) {
                    onUploadImage(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === "patterns" && (
          <div className="grid grid-cols-2 gap-1.5">
            {patterns.map((pat: any) => {
              const isSelected = selectedPatternId === pat.id;
              return (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => onSelectPattern(pat.id)}
                  className={`p-2 rounded-lg border text-left transition ${
                    isSelected
                      ? "border-brand bg-brand-soft text-brand font-bold"
                      : "border-line/80 bg-surface hover:bg-white text-ink-2"
                  }`}
                >
                  <p className="text-[11px] font-semibold capitalize truncate">
                    {pat.name || pat.id}
                  </p>
                  <p className="text-[9px] text-muted capitalize">
                    {pat.group || "Pattern"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
