"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Scissors,
  PenTool,
  Link2,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  SkipForward,
  SkipBack,
  Layers,
  Box,
  Sliders,
  Award,
} from "lucide-react";
import { renderSVG } from "@/lib/studio/render.js";
import { DEFAULT_SCRATCH_CONFIG } from "@/lib/studio/garments.js";
import { ScratchConfig } from "./AssetsRail";
import { StudioCanvasTool } from "./CanvasStage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRunLiveOnCanvas?: () => void;
  onTryModule?: (moduleConfig: {
    tool: StudioCanvasTool;
    scratchPatch?: Partial<ScratchConfig>;
    patternId?: string;
  }) => void;
}

interface MasterclassChapter {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  start: number;
  end: number;
  toolBadge: string;
  caption: string;
  expertKeys: Array<{ label: string; detail: string }>;
  proTip: string;
  tryAction: {
    label: string;
    tool: StudioCanvasTool;
    scratchPatch?: Partial<ScratchConfig>;
    patternId?: string;
  };
}

const TOTAL_DURATION = 48; // 48-second comprehensive 6-module masterclass

const CHAPTERS: MasterclassChapter[] = [
  {
    id: 0,
    code: "01",
    title: "Silhouette & Sloper Architecture",
    subtitle: "Drafting Your Base Block from Scratch",
    start: 0,
    end: 8,
    toolBadge: "1. SHAPE · SLOPER BLOCK",
    caption:
      "Start by clicking 'Design from Scratch' → '1. Shape'. Morph the Neckline (Crew, V-Neck, Collar, Hood), Sleeve length, and Fit Grading on the tailor's dress form.",
    expertKeys: [
      {
        label: "Anatomical Dress Form Guides",
        detail:
          "Align your neckline and waist taper with the BUST, WAIST, and HIP tailor tapes and the left CM scale ruler.",
      },
      {
        label: "Instant Silhouette Grading",
        detail:
          "Switch between Cropped, Tailored Fit, Regular, Oversized, or A-Line Dress to grade both 2D and 3D meshes simultaneously.",
      },
      {
        label: "Collar & Hood Construction",
        detail:
          "Selecting 'Collar' or 'Hoodie' automatically constructs a 3D stand collar or draped cloth hood with drawstrings.",
      },
    ],
    proTip:
      "Always establish your base silhouette (Neckline + Sleeve + Fit) in Step 1 before slicing custom colorblock panels in Step 2.",
    tryAction: {
      label: "Practice Step 1: Shape Block",
      tool: "move",
      scratchPatch: {
        baseMode: "block",
        neckType: "stand",
        sleeveType: "long",
        explodeAmount: 0,
      },
    },
  },
  {
    id: 1,
    code: "02",
    title: "Laser Seam Cutting & Panel Splitting",
    subtitle: "Slicing Garments into Colorblock Zones",
    start: 8,
    end: 16,
    toolBadge: "2. CUT · SEAM KNIFE",
    caption:
      "Select the 'Cut' tool in the top toolbar. Use 1-click Tailor Cuts (V-Chest, Princess 3-Pc, Left/Right, Diagonal) or drag the red Laser Knife across the garment!",
    expertKeys: [
      {
        label: "Drag-to-Cut Laser Knife",
        detail:
          "With 'Cut' active, click and drag a line across any part of the garment to physically slice it into a new fabric zone.",
      },
      {
        label: "1-Click Couture Splits",
        detail:
          "Use Princess 3-Panel, V-Chest Chevron, or Diagonal Cuts for instant symmetrical tailoring.",
      },
      {
        label: "Independent Panel Coloring",
        detail:
          "Every cut creates a selectable panel in the right-hand Properties Inspector so you can color each piece separately.",
      },
    ],
    proTip:
      "Every custom knife cut is automatically clipped to the garment's exact silhouette and projected onto the 3D cloth UV map.",
    tryAction: {
      label: "Practice Step 2: Cut Panels",
      tool: "cut",
      scratchPatch: {
        baseMode: "block",
        cutSplitMode: "chevron-v",
        cutY: 325,
        explodeAmount: 0,
      },
    },
  },
  {
    id: 2,
    code: "03",
    title: "Exploded Pattern & Sewing Assembly",
    subtitle: "Inspecting Cut Pieces & Joining Seams",
    start: 16,
    end: 24,
    toolBadge: "3. JOIN · SEWING TABLE",
    caption:
      "Switch to 'Join' and click 'Separate Pieces' to lay out your flat cut pattern with 6mm seam allowances and sewing threads—then click 'Sew & Join All' to assemble!",
    expertKeys: [
      {
        label: "Exploded Flat Sloper View",
        detail:
          "Click 'Separate Pieces' to inspect individual cut blocks (Bodice, Sleeves, Collar, Cut Panels) with cyan dashed seam allowances.",
      },
      {
        label: "Live Sewing Basting Threads",
        detail:
          "Emerald and blue basting threads show exactly which armscye, collar, and bodice edges will be sewn together.",
      },
      {
        label: "Hardware & Tailoring Parts",
        detail:
          "In '3. Join', toggle + Center Zipper, + Front Pocket, + Side Panels, or + Buttons to add 3D hardware.",
      },
    ],
    proTip:
      "You can also drag across any separated seam with the 'Join' tool to add custom lockstitch seam lines while assembling the garment.",
    tryAction: {
      label: "Practice Step 3: Separate & Join",
      tool: "join",
      scratchPatch: {
        baseMode: "exploded",
        cutSplitMode: "chevron-v",
        explodeAmount: 85,
      },
    },
  },
  {
    id: 3,
    code: "04",
    title: "Symmetrical CAD Drawing & Appliqués",
    subtitle: "Sketching Stitches & Filled Fabric Shapes",
    start: 24,
    end: 32,
    toolBadge: "4. DRAW · MIRROR CAD PEN",
    caption:
      "Select 'Draw' in the toolbar. Keep 'Mirror' on to draw symmetrical topstitch seams on both sides at once, or toggle 'Filled Shape' to create custom pockets & patches!",
    expertKeys: [
      {
        label: "Real-Time Mirror Symmetry",
        detail:
          "With 'Mirror' active, every stroke you draw on the left side is mirrored across the center grainline automatically.",
      },
      {
        label: "Stitch Line vs. Filled Shape",
        detail:
          "Toggle 'Filled Shape' in the floating Draw bar to close your stroke into a solid fabric panel with double-needle topstitching.",
      },
      {
        label: "Movable Vector Sketch Layers",
        detail:
          "Every drawn seam or panel becomes a layer you can select, move, resize, rotate, or recolor anytime.",
      },
    ],
    proTip:
      "Use gold (#F59E0B) or white (#FFFFFF) Stitch Lines over dark emerald panels to create high-contrast couture topstitching.",
    tryAction: {
      label: "Practice Step 4: Mirror Draw",
      tool: "draw",
      scratchPatch: {
        baseMode: "block",
        explodeAmount: 0,
      },
    },
  },
  {
    id: 4,
    code: "05",
    title: "Textile Patterns, Colorways & Graphics",
    subtitle: "Applying Weaves, Crests & Typography",
    start: 32,
    end: 40,
    toolBadge: "5. TEXTILES & GRAPHICS",
    caption:
      "Click any garment zone with 'Select' to apply custom colors, surface patterns (Stripes, Checker, Camo, Gradient), vector crests, and custom typography.",
    expertKeys: [
      {
        label: "Direct On-Canvas Zone Picking",
        detail:
          "In 'Select' mode, click any panel directly on the garment to target it, then pick a swatch or hex color on the right.",
      },
      {
        label: "All-Over Textile Patterns",
        detail:
          "Open 'Assets → Patterns' to apply woven stripes, checker, camo, or gradients and adjust the Pattern Scale slider.",
      },
      {
        label: "Smart Bounding-Box Handles",
        detail:
          "Click any logo or text layer to drag it, pull the 4 corner handles to resize, or drag the top stem to rotate.",
      },
    ],
    proTip:
      "Use the Layers icon in the top toolbar to reorder layers (Bring Forward / Send Backward), duplicate crests, or lock finished elements.",
    tryAction: {
      label: "Practice Step 5: Patterns & Logos",
      tool: "move",
      patternId: "stripes-v",
    },
  },
  {
    id: 5,
    code: "06",
    title: "3D Cloth Drape & Factory Tech Pack",
    subtitle: "Inspecting in 3D & Exporting Production Files",
    start: 40,
    end: 48,
    toolBadge: "6. 3D DRAPE & TECH PACK",
    caption:
      "Orbit the 3D Draped Cloth model on the right (or click '3D Preview' for full-screen), toggle Studio Lighting, and click 'Export' for 300 DPI PNG, CAD SVG, or Tech Pack!",
    expertKeys: [
      {
        label: "Interactive 3D Cloth Orbit",
        detail:
          "Drag on the 3D viewport to inspect front, side, and back drape with micro-woven and ribbed fabric bump textures.",
      },
      {
        label: "Full-Screen 3D Preview Tab",
        detail:
          "Click the '3D Preview' tab at the top of the canvas to expand the 3D cloth simulation across the entire center stage.",
      },
      {
        label: "Production-Ready Exports",
        detail:
          "Click 'Export' in the top-right header to download 300 DPI Mockup PNGs, Vector CAD SVGs, or a complete Project Spec.",
      },
    ],
    proTip:
      "Press Ctrl+Z / Ctrl+Y at any time to step backward or forward through up to 50 studio actions.",
    tryAction: {
      label: "Practice Step 6: Full Studio",
      tool: "move",
    },
  },
];

export function ScratchDemoModal({
  isOpen,
  onClose,
  onRunLiveOnCanvas,
  onTryModule,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 1.5>(1);
  const [time, setTime] = useState(0); // 0 to 48s

  useEffect(() => {
    if (!isOpen) {
      setTime(0);
      setIsPlaying(true);
      return;
    }
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTime((prev) => {
        const next = prev + 0.08 * speed;
        return next >= TOTAL_DURATION ? 0 : Number(next.toFixed(2));
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, speed]);

  const activeChapter =
    CHAPTERS.find((c) => time >= c.start && time < c.end) ||
    CHAPTERS[CHAPTERS.length - 1];

  // Progress inside current 8-second module (0..1)
  const localT = Math.max(0, Math.min(1, (time - activeChapter.start) / 8));

  // Build a real, frame-accurate `project` object fed directly into the production `renderSVG` engine!
  const demoRenderState = useMemo(() => {
    // 1. Dynamic Scratch Config across the 6 modules
    const sc: any = {
      ...JSON.parse(JSON.stringify(DEFAULT_SCRATCH_CONFIG)),
      showCroquis: true,
      baseMode: "block",
      neckType: "crew",
      sleeveType: "short",
      shoulderWidth: 126,
      chestWidth: 148,
      waistWidth: 136,
      hipWidth: 148,
      garmentLength: 590,
      cutSplitMode: "none",
      cutY: 330,
      explodeAmount: 0,
      customCuts: [],
      parts: {
        sidePanel: true,
        yoke: false,
        zipper: false,
        placket: false,
        pocket: false,
        hood: false,
        hemband: true,
        cuffs: true,
        sleeveStripes: false,
      },
    };

    // Module 1 (0..8s): Morph Neckline, Sleeves & Fit
    if (activeChapter.id === 0) {
      if (localT < 0.3) {
        sc.neckType = "crew";
        sc.sleeveType = "sleeveless";
        sc.garmentLength = 460;
      } else if (localT < 0.65) {
        sc.neckType = "v";
        sc.sleeveType = "short";
        sc.waistWidth = 114;
        sc.garmentLength = 580;
      } else {
        sc.neckType = "stand";
        sc.sleeveType = "long";
        sc.shoulderWidth = 134;
        sc.waistWidth = 128;
        sc.garmentLength = 605;
        sc.parts.zipper = true;
      }
    } else {
      // Modules 2..6 build upon the tailored long-sleeve stand-collar jacket block
      sc.neckType = "stand";
      sc.sleeveType = "long";
      sc.shoulderWidth = 132;
      sc.waistWidth = 128;
      sc.garmentLength = 600;
      sc.parts.zipper = true;
    }

    // Module 2 (8..16s): Laser Seam Cutting & Panel Splitting
    if (activeChapter.id === 1) {
      if (localT < 0.35) {
        sc.cutSplitMode = "center-split";
      } else if (localT < 0.68) {
        sc.cutSplitMode = "princess";
      } else {
        sc.cutSplitMode = "chevron-v";
        sc.cutY = 330;
      }
    } else if (activeChapter.id >= 2) {
      sc.cutSplitMode = "chevron-v";
      sc.cutY = 330;
    }

    // Module 3 (16..24s): Exploded Flat Pattern & Sewing Assembly
    if (activeChapter.id === 2) {
      sc.parts.pocket = localT > 0.5;
      // Smoothly separate 0 -> 90% then sew back 90% -> 0%
      if (localT < 0.55) {
        const k = Math.min(1, localT / 0.35);
        sc.baseMode = "exploded";
        sc.explodeAmount = Math.round(90 * k);
      } else {
        const k = Math.max(0, 1 - (localT - 0.55) / 0.35);
        sc.explodeAmount = Math.round(90 * k);
        sc.baseMode = sc.explodeAmount > 10 ? "exploded" : "block";
      }
    } else if (activeChapter.id >= 3) {
      sc.parts.pocket = true;
    }

    // Module 4 (24..32s): Symmetrical CAD Drawing & Filled Pocket Panels
    const frontLayers: any[] = [];
    if (activeChapter.id >= 3) {
      const drawK =
        activeChapter.id === 3 ? Math.min(1, Math.max(0.1, localT / 0.7)) : 1;
      const endY = Math.round(250 + 185 * drawK);
      frontLayers.push({
        id: "demo-sym-seam",
        name: "Couture Seam",
        kind: "path",
        d: `M 235 250 Q 262 ${(250 + endY) / 2} 242 ${endY}`,
        mirrorD: `M 365 250 Q 338 ${(250 + endY) / 2} 358 ${endY}`,
        stroke: "#F59E0B",
        strokeWidth: 4,
        dash: "7 4",
        closedPanel: activeChapter.id === 3 && localT > 0.65,
        fillPath:
          activeChapter.id === 3 && localT > 0.65 ? "#0E6E55" : "none",
        x: 300,
        y: 350,
        scale: 1,
        rotation: 0,
        visible: true,
      });
    }

    // Module 5 & 6 (32..48s): Textile Patterns, Crests & Typography
    const bodyStyle =
      activeChapter.id === 4 && localT > 0.25 && localT < 0.75
        ? "stripes-v"
        : "solid";

    if (activeChapter.id >= 4) {
      const logoScale =
        activeChapter.id === 4
          ? 0.38 + 0.14 * Math.sin(localT * Math.PI)
          : 0.46;
      frontLayers.push(
        {
          id: "demo-crest",
          name: "Atelier Crest",
          kind: "art",
          artId: "gen-shield",
          x: 348,
          y: 258,
          scale: logoScale,
          rotation: 0,
          visible: true,
        },
        {
          id: "demo-brand",
          name: "Brand Typography",
          kind: "text",
          text: "FASHION-LAB",
          font: "Montserrat",
          size: 22,
          x: 300,
          y: 368,
          scale: 1,
          rotation: 0,
          fill: "#FFFFFF",
          visible: true,
        }
      );
    }

    const zoneColors: Record<string, string> = {
      body: "#062D24",
      cutTop:
        activeChapter.id === 4 && localT > 0.6 ? "#0E6E55" : "#10B981",
      cutL: "#10B981",
      cutR: "#10B981",
      cutBottom: "#0E6E55",
      panelL: "#10B981",
      panelR: "#10B981",
      collar: "#0E6E55",
      sleeveL: "#0A3A2F",
      sleeveR: "#0A3A2F",
      cuffL: "#10B981",
      cuffR: "#10B981",
      hemBand: "#0E6E55",
      pocket: "#0A3A2F",
      zipper: "#FFFFFF",
    };

    const zonesObj: Record<string, any> = {};
    for (const [k, col] of Object.entries(zoneColors)) {
      zonesObj[k] = {
        style: k === "body" ? bodyStyle : "solid",
        colors: [col, "#0E6E55", "#FFFFFF"],
        params: { scale: 55, width: 20, gap: 20, size: 65 },
      };
    }

    const projectFront = {
      name: "Masterclass Demo",
      garment: "custom-scratch",
      scratchConfig: sc,
      view: "front",
      zones: zonesObj,
      layers: {
        front: frontLayers,
        back: [
          {
            id: "demo-back-num",
            name: "Back Number",
            kind: "text",
            text: "01",
            font: "Anton",
            size: 96,
            x: 300,
            y: 330,
            scale: 1,
            rotation: 0,
            fill: "#FFFFFF",
            visible: true,
          },
        ],
      },
      mockup: {
        shading: true,
        texture: "knit",
      },
    };

    const frontSvg = renderSVG(projectFront, {
      view: "front",
      guides: activeChapter.id === 4,
      width: 600,
      height: 700,
    });

    const backSvg = renderSVG(
      { ...projectFront, view: "back" },
      {
        view: "back",
        width: 600,
        height: 700,
      }
    );

    return { frontSvg, backSvg, sc };
  }, [activeChapter.id, localT]);

  if (!isOpen) return null;

  const formatSec = (s: number) => {
    const sec = Math.floor(s);
    return `0:${sec < 10 ? "0" : ""}${sec}`;
  };

  const jumpToChapter = (idx: number) => {
    const target = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, idx))];
    setTime(target.start + 0.05);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-[#0B1411] text-white rounded-2xl border border-emerald-500/25 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Masterclass Header */}
        <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#0E1B17]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10B981] to-[#0E6E55] text-[#062D24] flex items-center justify-center shadow-md">
              <Award className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-tight text-white">
                  FASHION-LAB Studio Masterclass
                </h3>
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                  6 Expert Modules · 48s
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/60">
                Complete visual guide to sloper drafting, laser cutting, pattern joining, symmetry CAD, and 3D cloth simulation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6-Module Navigation Tabs */}
        <div className="grid grid-cols-6 border-b border-white/10 bg-[#0D1814] px-3 pt-1.5 gap-1 shrink-0">
          {CHAPTERS.map((chap) => {
            const isCurrent = activeChapter.id === chap.id;
            const isDone = time >= chap.end;
            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => jumpToChapter(chap.id)}
                className={`pb-2 px-2 pt-1 rounded-t-lg text-left border-b-2 transition cursor-pointer ${
                  isCurrent
                    ? "border-[#10B981] bg-white/5 text-white"
                    : isDone
                    ? "border-emerald-500/40 text-emerald-300/80 hover:text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#10B981]">
                    Module {chap.code}
                  </span>
                  {isDone && <CheckCircle2 className="w-3 h-3 text-[#10B981]" />}
                </div>
                <span className="text-[10.5px] font-bold block truncate">
                  {chap.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Split Body: Left Cinema Stage + Right Expert Mastery Playbook */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[390px]">
          {/* Left: Real-Time Production Engine Cinema Stage */}
          <div className="flex-1 relative bg-[radial-gradient(circle_at_center,#132A23_0%,#08100E_100%)] flex flex-col justify-between overflow-hidden p-4">
            {/* Subtle Blueprint Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

            {/* Top HUD Overlay Bar inside Video */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[10px] font-extrabold tracking-wider text-emerald-300 uppercase">
                  {activeChapter.toolBadge}
                </span>
              </div>

              {/* Simulated Active Studio Tool Pill */}
              <div className="flex items-center gap-1 bg-black/55 backdrop-blur-md border border-white/10 rounded-xl p-1 text-[10px] font-bold">
                {[
                  { id: 0, label: "1. Shape", icon: Sliders },
                  { id: 1, label: "2. Cut", icon: Scissors },
                  { id: 2, label: "3. Join", icon: Link2 },
                  { id: 3, label: "4. Draw", icon: PenTool },
                  { id: 4, label: "5. Style", icon: Layers },
                  { id: 5, label: "6. 3D", icon: Box },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeChapter.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition ${
                        active
                          ? "bg-[#10B981] text-[#062D24] font-extrabold shadow-xs"
                          : "text-gray-400"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center Dual Viewport: Real 2D Production CAD + Synchronized 3D / Back Turnaround */}
            <div className="relative z-10 flex-1 flex items-center justify-center gap-6 my-1 overflow-hidden">
              {/* Primary 2D CAD Blueprint Stage (Powered by Real renderSVG) */}
              <div className="relative w-[245px] h-[285px] bg-white/95 rounded-2xl border border-emerald-400/40 shadow-2xl flex items-center justify-center p-2 overflow-hidden">
                <div className="absolute top-2 left-2.5 text-[9px] font-extrabold uppercase tracking-wider text-[#0E6E55] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-emerald-200">
                  {demoRenderState.sc.explodeAmount > 10
                    ? `Exploded Cut Sloper (${demoRenderState.sc.explodeAmount}%)`
                    : "2D Pattern & Croquis"}
                </div>

                <div
                  className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: demoRenderState.frontSvg }}
                />

                {/* Animated Laser Cut Overlay during Module 2 */}
                {activeChapter.id === 1 && (
                  <svg
                    viewBox="0 0 600 700"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <line
                      x1="135"
                      y1="295"
                      x2={135 + 330 * Math.min(1, localT * 1.4)}
                      y2={
                        localT < 0.35
                          ? 295
                          : 295 + 65 * Math.sin(Math.min(1, localT * 1.4) * Math.PI)
                      }
                      stroke="#EF4444"
                      strokeWidth="4"
                      strokeDasharray="10 6"
                    />
                    <circle
                      cx={135 + 330 * Math.min(1, localT * 1.4)}
                      cy={
                        localT < 0.35
                          ? 295
                          : 295 + 65 * Math.sin(Math.min(1, localT * 1.4) * Math.PI)
                      }
                      r="8"
                      fill="#EF4444"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                  </svg>
                )}

                {/* Symmetry Axis Overlay during Module 4 */}
                {activeChapter.id === 3 && (
                  <div className="absolute inset-y-3 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-[#10B981] pointer-events-none" />
                )}
              </div>

              {/* Secondary Live 3D Drape & Back Turnaround Preview Card */}
              <div className="relative w-[195px] h-[285px] bg-[#0F221C] rounded-2xl border border-emerald-500/30 shadow-xl flex flex-col items-center justify-between p-3 overflow-hidden">
                <div className="w-full flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-300">
                    3D Cloth & Back Spec
                  </span>
                  <span className="text-[8.5px] font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded">
                    360° Sync
                  </span>
                </div>

                <div
                  style={{
                    transform:
                      activeChapter.id === 5
                        ? `rotateY(${Math.round(Math.sin(localT * Math.PI * 2) * 22)}deg) scale(1.04)`
                        : "none",
                  }}
                  className="w-full flex-1 flex items-center justify-center transition-transform duration-150 [&>svg]:w-full [&>svg]:h-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)]"
                  dangerouslySetInnerHTML={{
                    __html:
                      activeChapter.id === 5 && localT > 0.45
                        ? demoRenderState.backSvg
                        : demoRenderState.frontSvg,
                  }}
                />

                <div className="w-full bg-black/40 rounded-lg px-2.5 py-1.5 border border-white/10 flex items-center justify-between text-[9px]">
                  <span className="text-gray-300 font-medium">Mesh Density</span>
                  <span className="text-[#34D399] font-extrabold">
                    123.5K Vertices
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Teleprompter Caption Bar */}
            <div className="relative z-10 bg-black/75 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-emerald-50 leading-relaxed">
                {activeChapter.caption}
              </p>
              <span className="text-[10px] font-extrabold text-[#34D399] shrink-0 bg-[#10B981]/15 px-2.5 py-1 rounded-lg border border-[#10B981]/30">
                Module {activeChapter.code} / 06
              </span>
            </div>
          </div>

          {/* Right: Expert Designer Playbook & Direct "Try This Module" Action */}
          <div className="w-full lg:w-[325px] bg-[#0F1D18] border-l border-white/10 p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10B981]">
                  Module {activeChapter.code} · Expert Playbook
                </span>
                <h4 className="text-sm font-extrabold text-white mt-0.5">
                  {activeChapter.title}
                </h4>
                <p className="text-[11px] text-gray-400">
                  {activeChapter.subtitle}
                </p>
              </div>

              {/* 3 Key Expert Techniques */}
              <div className="space-y-2">
                {activeChapter.expertKeys.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#10B981]/20 text-[#34D399] text-[9.5px] font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-white">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-relaxed pl-5">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pro Tip Box */}
              <div className="p-2.5 rounded-xl bg-[#062D24]/90 border border-[#10B981]/30">
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#34D399] block mb-0.5">
                  ★ Atelier Pro Tip
                </span>
                <p className="text-[10px] text-emerald-100/90 leading-relaxed">
                  {activeChapter.proTip}
                </p>
              </div>
            </div>

            {/* Interactive "Practice This Module Now" Button */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              {onTryModule && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTryModule(activeChapter.tryAction);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-[#062D24] font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer"
                >
                  <span>{activeChapter.tryAction.label}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Video Transport & "Auto-Build on My Canvas" Bar */}
        <div className="px-6 py-3 bg-[#0E1B17] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <button
              type="button"
              onClick={() => jumpToChapter(activeChapter.id - 1)}
              title="Previous Module"
              className="p-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="w-8 h-8 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#062D24] flex items-center justify-center transition cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => jumpToChapter(activeChapter.id + 1)}
              title="Next Module"
              className="p-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setTime(0);
                setIsPlaying(true);
              }}
              title="Restart Masterclass"
              className="p-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Toggle (1x / 1.5x) */}
            <button
              type="button"
              onClick={() => setSpeed((s) => (s === 1 ? 1.5 : 1))}
              className="px-2 py-1 rounded-lg border border-white/15 text-[10px] font-extrabold text-emerald-300 hover:bg-white/10 transition cursor-pointer"
            >
              {speed}x
            </button>

            {/* Scrubber Timeline */}
            <input
              type="range"
              min={0}
              max={TOTAL_DURATION}
              step={0.1}
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              className="flex-1 h-1.5 accent-[#10B981] cursor-pointer"
            />
            <span className="text-[11px] font-bold text-gray-400 tabular-nums">
              {formatSec(time)} / 0:48
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRunLiveOnCanvas && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRunLiveOnCanvas();
                }}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-[#34D399] border border-[#10B981]/40 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Build Demo on My Canvas</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-gray-900 text-xs font-extrabold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Close Masterclass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
