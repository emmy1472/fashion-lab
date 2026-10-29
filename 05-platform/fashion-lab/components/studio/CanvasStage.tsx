"use client";

import { useState, useRef, useEffect } from "react";
import {
  Scissors,
  FlipHorizontal,
  Grid,
  Layers,
  Undo2,
  Redo2,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Maximize,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  PenTool,
  Link2,
  MousePointer,
  Check,
  Spline,
  Hand,
} from "lucide-react";

export type StudioCanvasTool =
  | "select"
  | "move"
  | "pan"
  | "scale"
  | "rotate"
  | "nodes"
  | "draw"
  | "cut"
  | "join";

export interface VectorShapeNode {
  x: number;
  y: number;
  cx?: number;
  cy?: number;
}

export interface PieceTransform {
  dx?: number;
  dy?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  outlineColor?: string;
  contourOffset?: boolean;
}

export interface HumanFitMeasurements {
  shoulderWidth: number;
  chestWidth: number;
  waistTaper: number;
  hipWidth: number;
  hemLength: number;
}

const CORELDRAW_SWATCHES = [
  "#062D24", // Deep Forest
  "#10B981", // Mint Emerald
  "#0E6E55", // Tailored Green
  "#FFFFFF", // Pure White
  "#111827", // Carbon Black
  "#C89D7C", // Camel Tan
  "#1E3A8A", // Royal Navy
  "#0284C7", // Cyan CAD Blue
  "#F59E0B", // Amber Gold
  "#EF4444", // Crimson Red
  "#991B1B", // Burgundy
  "#7C3AED", // Electric Violet
  "#EC4899", // Magenta Rose
  "#64748B", // Slate Grey
];

// 14 Anatomical Landmarks on the Human Clothing Pattern Guide (600x700 Tailor Grid)
const HUMAN_PATTERN_LANDMARKS: Array<{ id: string; label: string; x: number; y: number }> = [
  { id: "neck-c", label: "Center Neck", x: 300, y: 158 },
  { id: "neck-l", label: "Left Collar", x: 248, y: 122 },
  { id: "neck-r", label: "Right Collar", x: 352, y: 122 },
  { id: "shoulder-l", label: "Left Shoulder Tip", x: 174, y: 138 },
  { id: "shoulder-r", label: "Right Shoulder Tip", x: 426, y: 138 },
  { id: "armpit-l", label: "Left Armhole Scye", x: 152, y: 268 },
  { id: "armpit-r", label: "Right Armhole Scye", x: 448, y: 268 },
  { id: "bust-c", label: "Center Bust Line", x: 300, y: 265 },
  { id: "waist-l", label: "Left Waist Taper", x: 164, y: 392 },
  { id: "waist-c", label: "Center Natural Waist", x: 300, y: 392 },
  { id: "waist-r", label: "Right Waist Taper", x: 436, y: 392 },
  { id: "hip-l", label: "Left Hip Flare", x: 152, y: 525 },
  { id: "hip-r", label: "Right Hip Flare", x: 448, y: 525 },
  { id: "hem-c", label: "Center Hem Line", x: 300, y: 590 },
];

// 1-Click CorelDRAW Editable Clothing Pattern Shapes fitted to the Human Body Guide
const CORELDRAW_PATTERN_SHAPES: Array<{
  id: string;
  label: string;
  symmetry: boolean;
  nodes: VectorShapeNode[];
}> = [
  {
    id: "chest-yoke",
    label: "Chest Yoke",
    symmetry: false,
    nodes: [
      { x: 174, y: 138, cx: 300, cy: 155 },
      { x: 426, y: 138, cx: 442, cy: 198 },
      { x: 448, y: 248, cx: 374, cy: 295 },
      { x: 300, y: 278, cx: 226, cy: 295 },
      { x: 152, y: 248, cx: 158, cy: 198 },
    ],
  },
  {
    id: "corset-bodice",
    label: "Corset Bodice",
    symmetry: false,
    nodes: [
      { x: 205, y: 248, cx: 252, cy: 222 },
      { x: 300, y: 268, cx: 348, cy: 222 },
      { x: 395, y: 248, cx: 418, cy: 320 },
      { x: 382, y: 392, cx: 396, cy: 445 },
      { x: 300, y: 472, cx: 204, cy: 445 },
      { x: 218, y: 392, cx: 182, cy: 320 },
    ],
  },
  {
    id: "side-contour",
    label: "Side Contour (Mirrored)",
    symmetry: true,
    nodes: [
      { x: 152, y: 268, cx: 206, cy: 288 },
      { x: 228, y: 392, cx: 210, cy: 470 },
      { x: 152, y: 545, cx: 145, cy: 410 },
    ],
  },
  {
    id: "patch-pocket",
    label: "Patch Pocket",
    symmetry: false,
    nodes: [
      { x: 330, y: 240 },
      { x: 405, y: 240 },
      { x: 405, y: 315, cx: 367, cy: 338 },
      { x: 330, y: 315 },
    ],
  },
  {
    id: "v-plunge",
    label: "V-Plunge Inset",
    symmetry: false,
    nodes: [
      { x: 236, y: 132, cx: 300, cy: 162 },
      { x: 364, y: 132, cx: 340, cy: 235 },
      { x: 300, y: 332, cx: 260, cy: 235 },
    ],
  },
  {
    id: "diamond-panel",
    label: "Diamond Panel",
    symmetry: false,
    nodes: [
      { x: 300, y: 225, cx: 350, cy: 268 },
      { x: 385, y: 315, cx: 350, cy: 362 },
      { x: 300, y: 405, cx: 250, cy: 362 },
      { x: 215, y: 315, cx: 250, cy: 268 },
    ],
  },
];

interface Props {
  svgMarkup: string;
  frontSvgMarkup?: string;
  backSvgMarkup?: string;
  activeView: "front" | "back";
  onToggleView: (view: "front" | "back") => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  layers?: any[];
  selectedLayerId?: string | null;
  onSelectLayer?: (id: string | null) => void;
  onTransformLayer?: (
    id: string,
    delta: {
      x?: number;
      y?: number;
      scale?: number;
      scaleAbs?: number;
      rotation?: number;
      rotationAbs?: number;
      flipX?: boolean;
      nodes?: VectorShapeNode[];
      clipToBody?: boolean;
      symmetry?: boolean;
      fillPath?: string;
      stroke?: string;
      outlineColor?: string;
      fill?: string;
      commitHistory?: boolean;
    }
  ) => void;
  pieceTransforms?: Record<string, PieceTransform>;
  onTransformPiece?: (
    zoneId: string,
    delta: {
      dx?: number;
      dy?: number;
      scaleX?: number;
      scaleY?: number;
      scaleXAbs?: number;
      scaleYAbs?: number;
      rotation?: number;
      rotationAbs?: number;
      outlineColor?: string;
      contourOffset?: boolean;
      reset?: boolean;
      commitHistory?: boolean;
    }
  ) => void;
  zoneColors?: Record<string, string>;
  onColorChange?: (zoneId: string, color: string) => void;
  isWireframe?: boolean;
  onToggleWireframe?: () => void;
  showPatternGuide?: boolean;
  onTogglePatternGuide?: () => void;
  fitMeasurements?: HumanFitMeasurements;
  onUpdateFitFromNodes?: (
    patch: Partial<HumanFitMeasurements>,
    commitHistory?: boolean
  ) => void;
  onAddSketchLayer?: (sketch: {
    name?: string;
    d: string;
    mirrorD?: string;
    nodes?: VectorShapeNode[];
    symmetry?: boolean;
    clipToBody?: boolean;
    stroke: string;
    strokeWidth: number;
    dash?: string;
    closedPanel?: boolean;
    fillPath?: string;
    stitchStyle?: string;
  }) => void;
  onAddCutLine?: (cut: { x1: number; y1: number; x2: number; y2: number }) => void;
  onSelectCutPreset?: (
    mode:
      | "none"
      | "center-split"
      | "princess"
      | "colorblock-h"
      | "diagonal-sash"
      | "chevron-v"
      | "empire-curve"
  ) => void;
  activeCutPreset?: string;
  explodeAmount?: number;
  onChangeExplodeAmount?: (val: number) => void;
  onJoinAllSeams?: () => void;
  requestedTool?: { tool: StudioCanvasTool; seq: number } | null;
  onDuplicateLayer?: (id: string) => void;
  onRemoveLayer?: (id: string) => void;
  onReorderLayer?: (id: string, dir: "up" | "down") => void;
  onToggleLayerVisibility?: (id: string) => void;
  onToggleLayerLock?: (id: string) => void;
  onAddQuickText?: () => void;
  onAddQuickEmblem?: () => void;
  selectedZoneId?: string;
  zones?: Array<{ id: string; label: string; role: string }>;
  onSelectZone?: (zoneId: string) => void;
  showPrintGuides?: boolean;
  onTogglePrintGuides?: () => void;
  is3DPreviewActive?: boolean;
  onToggle3DPreview?: (active: boolean) => void;
}

export function CanvasStage({
  svgMarkup,
  frontSvgMarkup,
  backSvgMarkup,
  activeView,
  onToggleView,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  layers = [],
  selectedLayerId,
  onSelectLayer,
  onTransformLayer,
  pieceTransforms = {},
  onTransformPiece,
  zoneColors = {},
  onColorChange,
  isWireframe = false,
  onToggleWireframe,
  showPatternGuide = true,
  onTogglePatternGuide,
  fitMeasurements = {
    shoulderWidth: 0,
    chestWidth: 0,
    waistTaper: 0,
    hipWidth: 0,
    hemLength: 0,
  },
  onUpdateFitFromNodes,
  onAddSketchLayer,
  onAddCutLine,
  onSelectCutPreset,
  activeCutPreset = "none",
  explodeAmount = 0,
  onChangeExplodeAmount,
  onJoinAllSeams,
  requestedTool,
  onDuplicateLayer,
  onRemoveLayer,
  onReorderLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onAddQuickText,
  onAddQuickEmblem,
  selectedZoneId = "body",
  zones = [],
  onSelectZone,
  showPrintGuides = false,
  onTogglePrintGuides,
  is3DPreviewActive = false,
  onToggle3DPreview,
}: Props) {
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<StudioCanvasTool>("move");
  const [selectionTarget, setSelectionTarget] = useState<"piece" | "layer">("piece");
  const [swatchTargetMode, setSwatchTargetMode] = useState<"fill" | "outline">("fill");
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number>(0);
  const [snappedLandmark, setSnappedLandmark] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showLayersPopover, setShowLayersPopover] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string>("");
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const [isActivelyPanning, setIsActivelyPanning] = useState(false);

  // Pattern Drawing & Panel Creation States
  const [sketchColor, setSketchColor] = useState("#10B981");
  const [sketchSymmetry, setSketchSymmetry] = useState(true);
  const [sketchClosedPanel, setSketchClosedPanel] = useState(true);
  const [sketchClipToBody, setSketchClipToBody] = useState(true);
  const [liveStroke, setLiveStroke] = useState<{
    d: string;
    mirrorD?: string;
  } | null>(null);

  // Knife Cut Line Drag Preview State
  const [liveCutLine, setLiveCutLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const stageAreaRef = useRef<HTMLDivElement>(null);
  const garmentBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestedTool && requestedTool.seq > 0) {
      setActiveTool(requestedTool.tool);
    }
  }, [requestedTool]);

  // Automatically highlight piece selection box whenever selectedZoneId changes
  useEffect(() => {
    if (selectedZoneId) {
      setSelectionTarget("piece");
    }
  }, [selectedZoneId]);

  const activeLayer =
    layers.find((l) => l.id === selectedLayerId) ||
    layers.find((l) => l.visible !== false) ||
    null;

  const activeZoneLabel =
    zones.find((z) => z.id === selectedZoneId)?.label || selectedZoneId;

  const activePieceTransform: PieceTransform =
    (selectedZoneId && pieceTransforms[selectedZoneId]) || {};
  const pieceScaleW = Math.round((activePieceTransform.scaleX ?? 1) * 100);
  const pieceScaleH = Math.round((activePieceTransform.scaleY ?? 1) * 100);
  const pieceAngle = Math.round(activePieceTransform.rotation ?? 0);

  const flashFeedback = (msg: string) => {
    setStatusFeedback(msg);
  };

  const maxPanX = Math.max(240, Math.round((zoom / 100) * 380));
  const maxPanY = Math.max(280, Math.round((zoom / 100) * 480));

  const clampPan = (x: number, y: number) => ({
    x: Math.max(-maxPanX, Math.min(maxPanX, x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, y)),
  });

  const handleZoomIn = () => setZoom((z) => Math.min(320, z + 20));
  const handleZoomOut = () => setZoom((z) => Math.max(45, z - 20));
  const handlePanVertical = (deltaY: number) => {
    setPan((prev) => clampPan(prev.x, prev.y + deltaY));
  };
  const handleResetView = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
    flashFeedback("Canvas reset to 100% & centered");
  };

  // Hold Spacebar anywhere on canvas to temporarily activate Hand-Drag Pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePanning(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePanning(false);
        setIsActivelyPanning(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handleFlipActiveLayer = () => {
    if (selectionTarget === "layer" && activeLayer && onTransformLayer) {
      onTransformLayer(activeLayer.id, {
        flipX: !activeLayer.flipX,
        commitHistory: true,
      });
      flashFeedback(`Flipped "${activeLayer.name}"`);
    } else {
      onToggleView(activeView === "front" ? "back" : "front");
    }
  };

  // Insert 1-Click CorelDRAW Clothing Shape fitted to Human Pattern Guide
  const handleInsertClothingShape = (
    preset: (typeof CORELDRAW_PATTERN_SHAPES)[number]
  ) => {
    if (!onAddSketchLayer) return;
    const clonedNodes: VectorShapeNode[] = preset.nodes.map((n) => ({ ...n }));
    onAddSketchLayer({
      name: preset.label,
      d: `M ${clonedNodes[0].x} ${clonedNodes[0].y} Z`,
      nodes: clonedNodes,
      symmetry: preset.symmetry,
      clipToBody: sketchClipToBody,
      stroke: sketchColor,
      strokeWidth: 3.5,
      closedPanel: true,
      fillPath: sketchColor,
    });
    setSelectionTarget("layer");
    setSelectedNodeIdx(0);
    setActiveTool("nodes");
    flashFeedback(
      `Inserted "${preset.label}"! Drag ■ Anchor Nodes or ● Curve Handles to sculpt`
    );
  };

  // CorelDRAW Shape Tool: Add Node on active segment
  const handleAddShapeNode = () => {
    if (
      !activeLayer ||
      activeLayer.kind !== "path" ||
      !Array.isArray(activeLayer.nodes) ||
      activeLayer.nodes.length < 2 ||
      !onTransformLayer
    ) {
      return;
    }
    const nodes: VectorShapeNode[] = activeLayer.nodes.map((n: VectorShapeNode) => ({
      ...n,
    }));
    const idx = Math.max(0, Math.min(nodes.length - 1, selectedNodeIdx));
    const cur = nodes[idx];
    const next = nodes[(idx + 1) % nodes.length];
    const midX = Number(
      (cur.cx !== undefined ? (cur.x + 2 * cur.cx + next.x) / 4 : (cur.x + next.x) / 2).toFixed(1)
    );
    const midY = Number(
      (cur.cy !== undefined ? (cur.y + 2 * cur.cy + next.y) / 4 : (cur.y + next.y) / 2).toFixed(1)
    );
    delete cur.cx;
    delete cur.cy;
    nodes.splice(idx + 1, 0, { x: midX, y: midY });
    onTransformLayer(activeLayer.id, { nodes, commitHistory: true });
    setSelectedNodeIdx(idx + 1);
    flashFeedback(`Added CorelDRAW node #${idx + 2} at (${midX}, ${midY})`);
  };

  // CorelDRAW Shape Tool: Delete Selected Node
  const handleDeleteShapeNode = () => {
    if (
      !activeLayer ||
      activeLayer.kind !== "path" ||
      !Array.isArray(activeLayer.nodes) ||
      activeLayer.nodes.length <= 3 ||
      !onTransformLayer
    ) {
      flashFeedback("A closed shape requires at least 3 nodes");
      return;
    }
    const nodes: VectorShapeNode[] = activeLayer.nodes.filter(
      (_: VectorShapeNode, i: number) => i !== selectedNodeIdx
    );
    onTransformLayer(activeLayer.id, { nodes, commitHistory: true });
    setSelectedNodeIdx(Math.max(0, selectedNodeIdx - 1));
    flashFeedback("Deleted selected node");
  };

  // CorelDRAW Shape Tool: Convert Curves to Straight Lines
  const handleStraightenShapeCurves = () => {
    if (
      !activeLayer ||
      activeLayer.kind !== "path" ||
      !Array.isArray(activeLayer.nodes) ||
      !onTransformLayer
    ) {
      return;
    }
    const nodes: VectorShapeNode[] = activeLayer.nodes.map((n: VectorShapeNode) => ({
      x: n.x,
      y: n.y,
    }));
    onTransformLayer(activeLayer.id, { nodes, commitHistory: true });
    flashFeedback("Converted all shape segments to straight lines");
  };

  // Unified CorelDRAW Pointer Engine: Hand-Drag Pan, 8-Handle Piece & Layer Resize, Node & Curve Sculpting, Fit Nodes, Draw, Cut, Join
  useEffect(() => {
    const box = garmentBoxRef.current;
    const stage = stageAreaRef.current || box;
    if (!box || !stage) return;

    let isDragging = false;
    let startClientX = 0;
    let startClientY = 0;
    let targetLayerId: string | null = null;
    let targetPieceId: string | null = null;
    let activeHandle: string = "se";
    let activeNodeIndex: number = -1;
    let activeFitField: string = "";
    let mode:
      | "move"
      | "scale"
      | "rotate"
      | "move-piece"
      | "scale-piece"
      | "rotate-piece"
      | "drag-node"
      | "drag-curve"
      | "drag-fit"
      | "pan"
      | "draw"
      | "cut"
      | "join" = "move";
    let didTransform = false;
    let drawPoints: Array<{ x: number; y: number }> = [];
    let cutStartPt: { x: number; y: number } | null = null;
    let cutEndPt: { x: number; y: number } | null = null;

    const clientToSvgPoint = (clientX: number, clientY: number, snap = false) => {
      const rect = box.getBoundingClientRect();
      const rawX = ((clientX - rect.left) / Math.max(1, rect.width)) * 600;
      const rawY = ((clientY - rect.top) / Math.max(1, rect.height)) * 700;
      let x = Math.max(20, Math.min(580, Number(rawX.toFixed(1))));
      let y = Math.max(20, Math.min(680, Number(rawY.toFixed(1))));

      if (snap && showPatternGuide) {
        let bestDist = 13.5;
        let matched: { label: string; x: number; y: number } | null = null;
        for (const lm of HUMAN_PATTERN_LANDMARKS) {
          const d = Math.hypot(x - lm.x, y - lm.y);
          if (d < bestDist) {
            bestDist = d;
            matched = lm;
          }
        }
        if (matched) {
          x = matched.x;
          y = matched.y;
          setSnappedLandmark({ label: matched.label, x, y });
          return { x, y };
        }
        // Magnetic snap to Human Center Grainline (X = 300)
        if (Math.abs(x - 300) < 9) {
          x = 300;
          setSnappedLandmark({ label: "Center Grainline (X=300)", x: 300, y });
          return { x, y };
        }
      }
      setSnappedLandmark(null);
      return { x, y };
    };

    const pointsToPath = (pts: Array<{ x: number; y: number }>, mirror = false) => {
      if (pts.length === 0) return "";
      return pts
        .map((pt, idx) => {
          const px = mirror ? Number((600 - pt.x).toFixed(1)) : pt.x;
          return `${idx === 0 ? "M" : "L"} ${px} ${pt.y}`;
        })
        .join(" ");
    };

    const simplifyPointsToNodes = (
      pts: Array<{ x: number; y: number }>,
      maxNodes = 7
    ): VectorShapeNode[] => {
      if (pts.length <= maxNodes) {
        return pts.map((p) => ({ x: p.x, y: p.y }));
      }
      const result: VectorShapeNode[] = [];
      for (let i = 0; i < maxNodes; i++) {
        const idx = Math.min(
          pts.length - 1,
          Math.round((i * (pts.length - 1)) / (maxNodes - 1))
        );
        result.push({ x: pts[idx].x, y: pts[idx].y });
      }
      return result;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | SVGElement;
      if (!target) return;

      // Ignore clicks on floating UI buttons, selects, inputs, or labels inside the stage
      if (target.closest("button, select, input, label")) {
        return;
      }

      // 00. Hand-Drag Pan Tool (`activeTool === "pan"`), Spacebar Hold, or Middle-Click
      if (activeTool === "pan" || isSpacePanning || e.button === 1) {
        isDragging = true;
        didTransform = false;
        startClientX = e.clientX;
        startClientY = e.clientY;
        mode = "pan";
        setIsActivelyPanning(true);
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // If user clicked outside the garment box on the empty blueprint grid -> Hand-Drag Pan
      if (!box.contains(target as Node)) {
        isDragging = true;
        didTransform = false;
        startClientX = e.clientX;
        startClientY = e.clientY;
        mode = "pan";
        setIsActivelyPanning(true);
        e.preventDefault();
        return;
      }

      // 0A. CorelDRAW Shape Tool: Drag Square Anchor Node (■)
      const nodeEl = target.closest("[data-node-idx]") as HTMLElement | null;
      if (nodeEl && activeLayer && activeLayer.kind === "path") {
        const idx = Number(nodeEl.getAttribute("data-node-idx"));
        if (!Number.isNaN(idx)) {
          activeNodeIndex = idx;
          setSelectedNodeIdx(idx);
          targetLayerId = activeLayer.id;
          isDragging = true;
          didTransform = false;
          mode = "drag-node";
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }

      // 0B. CorelDRAW Shape Tool: Drag Round Bézier Curve Control Handle (●)
      const curveEl = target.closest("[data-curve-idx]") as HTMLElement | null;
      if (curveEl && activeLayer && activeLayer.kind === "path") {
        const idx = Number(curveEl.getAttribute("data-curve-idx"));
        if (!Number.isNaN(idx)) {
          activeNodeIndex = idx;
          setSelectedNodeIdx(idx);
          targetLayerId = activeLayer.id;
          isDragging = true;
          didTransform = false;
          mode = "drag-curve";
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }

      // 0C. Human Clothing Pattern Fit Node (◆ Shoulder, Chest, Waist, Hip, Hem)
      const fitEl = target.closest("[data-fit-node]") as HTMLElement | null;
      if (fitEl && onUpdateFitFromNodes) {
        activeFitField = fitEl.getAttribute("data-fit-node") || "";
        if (activeFitField) {
          isDragging = true;
          didTransform = false;
          mode = "drag-fit";
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }

      // 1. Cut Mode
      if (activeTool === "cut") {
        isDragging = true;
        mode = "cut";
        const pt = clientToSvgPoint(e.clientX, e.clientY, true);
        cutStartPt = pt;
        cutEndPt = pt;
        setLiveCutLine({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // 2. Draw or Join Mode
      if (activeTool === "draw" || activeTool === "join") {
        isDragging = true;
        mode = activeTool;
        const pt = clientToSvgPoint(e.clientX, e.clientY, true);
        drawPoints = [pt];
        const d = pointsToPath(drawPoints, false);
        const mirrorD = sketchSymmetry ? pointsToPath(drawPoints, true) : undefined;
        setLiveStroke({ d, mirrorD });
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // 3. CorelDRAW 8-Handle Resize (nw, n, ne, e, se, s, sw, w) or Top Rotate Handle
      const handleEl = target.closest("[data-handle]") as HTMLElement | null;
      if (handleEl) {
        const handleType = handleEl.getAttribute("data-handle") || "se";
        const handleOwner = handleEl.getAttribute("data-owner") || selectionTarget;
        activeHandle = handleType;
        isDragging = true;
        didTransform = false;
        startClientX = e.clientX;
        startClientY = e.clientY;

        if (handleOwner === "piece" && selectedZoneId) {
          targetPieceId = selectedZoneId;
          mode = handleType === "rotate" ? "rotate-piece" : "scale-piece";
        } else if (activeLayer) {
          targetLayerId = activeLayer.id;
          mode = handleType === "rotate" ? "rotate" : "scale";
        }
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // 4. Click on Artwork / Text / Drawn Panel Layer -> Select & Drag to Move
      const layerEl = target.closest("[data-layer]") as HTMLElement | SVGElement | null;
      if (layerEl) {
        const clickedId = layerEl.getAttribute("data-layer");
        if (clickedId) {
          setSelectionTarget("layer");
          if (onSelectLayer) onSelectLayer(clickedId);
          targetLayerId = clickedId;
          const found = layers.find((l) => l.id === clickedId);
          if (activeTool === "nodes" && found?.kind === "path") {
            flashFeedback(
              `Editing Nodes of "${found.name}": Drag ■ corners or ● curve handles`
            );
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          isDragging = true;
          didTransform = false;
          startClientX = e.clientX;
          startClientY = e.clientY;
          mode = "move";
          flashFeedback(`Selected Layer: "${found?.name || clickedId}"`);
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }

      // 5. Click on Separated Garment Piece / Cut Panel -> CorelDRAW Pick Selection + Drag to Move
      const zoneEl = target.closest("[data-zone]") as HTMLElement | SVGElement | null;
      if (zoneEl) {
        const zoneId = zoneEl.getAttribute("data-zone");
        if (zoneId) {
          setSelectionTarget("piece");
          if (onSelectZone) onSelectZone(zoneId);
          targetPieceId = zoneId;
          isDragging = true;
          didTransform = false;
          startClientX = e.clientX;
          startClientY = e.clientY;
          mode = "move-piece";
          const zLabel = zones.find((z) => z.id === zoneId)?.label || zoneId;
          flashFeedback(`Selected Piece: ${zLabel} (Drag handles to resize or pick color)`);
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }

      // 6. Drag Background -> Hand-Drag Pan Stage
      isDragging = true;
      didTransform = false;
      startClientX = e.clientX;
      startClientY = e.clientY;
      mode = "pan";
      setIsActivelyPanning(true);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      // 0A. CorelDRAW Anchor Node Dragging with Magnetic Human Guide Snapping
      if (
        mode === "drag-node" &&
        targetLayerId &&
        activeLayer &&
        Array.isArray(activeLayer.nodes) &&
        onTransformLayer
      ) {
        const pt = clientToSvgPoint(e.clientX, e.clientY, true);
        const nextNodes: VectorShapeNode[] = activeLayer.nodes.map(
          (n: VectorShapeNode, i: number) =>
            i === activeNodeIndex ? { ...n, x: pt.x, y: pt.y } : { ...n }
        );
        didTransform = true;
        onTransformLayer(targetLayerId, { nodes: nextNodes });
        return;
      }

      // 0B. CorelDRAW Quadratic Bézier Curve Handle Dragging
      if (
        mode === "drag-curve" &&
        targetLayerId &&
        activeLayer &&
        Array.isArray(activeLayer.nodes) &&
        onTransformLayer
      ) {
        const pt = clientToSvgPoint(e.clientX, e.clientY, true);
        const nextNodes: VectorShapeNode[] = activeLayer.nodes.map(
          (n: VectorShapeNode, i: number) =>
            i === activeNodeIndex ? { ...n, cx: pt.x, cy: pt.y } : { ...n }
        );
        didTransform = true;
        onTransformLayer(targetLayerId, { nodes: nextNodes });
        return;
      }

      // 0C. Human Clothing Pattern Fit Node Dragging (Live Garment Tailoring)
      if (mode === "drag-fit" && activeFitField && onUpdateFitFromNodes) {
        const pt = clientToSvgPoint(e.clientX, e.clientY, false);
        didTransform = true;
        if (activeFitField === "shoulder") {
          const val = Math.max(-20, Math.min(25, Math.round(pt.x - 174)));
          onUpdateFitFromNodes({ shoulderWidth: val }, false);
          flashFeedback(`Human Fit Guide — Shoulder Slope: ${val > 0 ? `+${val}` : val}`);
        } else if (activeFitField === "chest") {
          const val = Math.max(-20, Math.min(30, Math.round(152 - pt.x)));
          onUpdateFitFromNodes({ chestWidth: val }, false);
          flashFeedback(`Human Fit Guide — Bust / Chest Ease: ${val > 0 ? `+${val}` : val}`);
        } else if (activeFitField === "waist") {
          const val = Math.max(-35, Math.min(35, Math.round(164 - pt.x)));
          onUpdateFitFromNodes({ waistTaper: val }, false);
          flashFeedback(`Human Fit Guide — Natural Waist Taper: ${val > 0 ? `+${val}` : val}`);
        } else if (activeFitField === "hip") {
          const val = Math.max(-25, Math.min(35, Math.round(152 - pt.x)));
          onUpdateFitFromNodes({ hipWidth: val }, false);
          flashFeedback(`Human Fit Guide — Hip Flare: ${val > 0 ? `+${val}` : val}`);
        } else if (activeFitField === "hem") {
          const val = Math.max(-60, Math.min(60, Math.round(pt.y - 590)));
          onUpdateFitFromNodes({ hemLength: val }, false);
          flashFeedback(`Human Fit Guide — Garment Hem Length: ${val > 0 ? `+${val}` : val}`);
        }
        return;
      }

      if (mode === "cut" && cutStartPt) {
        const pt = clientToSvgPoint(e.clientX, e.clientY, true);
        cutEndPt = pt;
        setLiveCutLine({
          x1: cutStartPt.x,
          y1: cutStartPt.y,
          x2: pt.x,
          y2: pt.y,
        });
        return;
      }

      if (mode === "draw" || mode === "join") {
        const pt = clientToSvgPoint(e.clientX, e.clientY, true);
        const last = drawPoints[drawPoints.length - 1];
        if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 2.2) {
          drawPoints.push(pt);
          const d = pointsToPath(drawPoints, false);
          const mirrorD = sketchSymmetry ? pointsToPath(drawPoints, true) : undefined;
          setLiveStroke({ d, mirrorD });
        }
        return;
      }

      const rawDx = e.clientX - startClientX;
      const rawDy = e.clientY - startClientY;
      if (Math.abs(rawDx) < 0.5 && Math.abs(rawDy) < 0.5) return;

      startClientX = e.clientX;
      startClientY = e.clientY;

      if (mode === "pan") {
        setPan((prev) => ({
          x: Math.max(-maxPanX, Math.min(maxPanX, prev.x + rawDx)),
          y: Math.max(-maxPanY, Math.min(maxPanY, prev.y + rawDy)),
        }));
        return;
      }

      const rect = box.getBoundingClientRect();
      const svgScaleX = 600 / Math.max(120, rect.width);
      const svgScaleY = 700 / Math.max(140, rect.height);

      // CorelDRAW Piece Manipulation (Move, 8-Handle Stretch/Scale, Rotate)
      if (
        (mode === "move-piece" || mode === "scale-piece" || mode === "rotate-piece") &&
        targetPieceId &&
        onTransformPiece
      ) {
        didTransform = true;
        if (mode === "move-piece") {
          onTransformPiece(targetPieceId, {
            dx: rawDx * svgScaleX,
            dy: rawDy * svgScaleY,
          });
        } else if (mode === "rotate-piece") {
          onTransformPiece(targetPieceId, {
            rotation: rawDx * 0.85,
          });
        } else if (mode === "scale-piece") {
          const signX = activeHandle.includes("w") ? -1 : 1;
          const signY = activeHandle.includes("n") ? -1 : 1;
          const deltaX = rawDx * signX * 0.0065;
          const deltaY = rawDy * signY * 0.0065;

          if (activeHandle === "e" || activeHandle === "w") {
            // CorelDRAW Side Handle: Horizontal Stretch Only
            onTransformPiece(targetPieceId, {
              scaleX: Math.max(0.85, Math.min(1.15, 1 + deltaX)),
            });
          } else if (activeHandle === "n" || activeHandle === "s") {
            // CorelDRAW Top/Bottom Handle: Vertical Stretch Only
            onTransformPiece(targetPieceId, {
              scaleY: Math.max(0.85, Math.min(1.15, 1 + deltaY)),
            });
          } else {
            // CorelDRAW Corner Handle: Proportional Scale
            const uniform = Math.max(0.85, Math.min(1.15, 1 + (deltaX + deltaY) * 0.6));
            onTransformPiece(targetPieceId, {
              scaleX: uniform,
              scaleY: uniform,
            });
          }
        }
        return;
      }

      if (!targetLayerId || !onTransformLayer) return;

      if (mode === "move") {
        didTransform = true;
        onTransformLayer(targetLayerId, {
          x: rawDx * svgScaleX,
          y: rawDy * svgScaleY,
        });
      } else if (mode === "scale") {
        didTransform = true;
        const signX = activeHandle.includes("w") ? -1 : 1;
        const signY = activeHandle.includes("n") ? -1 : 1;
        const scaleMultiplier = Math.max(
          0.85,
          Math.min(1.15, 1 + (rawDx * signX + rawDy * signY) * 0.006)
        );
        onTransformLayer(targetLayerId, {
          scale: scaleMultiplier,
        });
      } else if (mode === "rotate") {
        didTransform = true;
        onTransformLayer(targetLayerId, {
          rotation: rawDx * 0.85,
        });
      }
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      setSnappedLandmark(null);

      if (mode === "drag-fit" && didTransform && onUpdateFitFromNodes) {
        isDragging = false;
        activeFitField = "";
        didTransform = false;
        onUpdateFitFromNodes({}, true);
        return;
      }

      if (mode === "cut") {
        isDragging = false;
        if (
          cutStartPt &&
          cutEndPt &&
          Math.hypot(cutEndPt.x - cutStartPt.x, cutEndPt.y - cutStartPt.y) >= 18 &&
          onAddCutLine
        ) {
          onAddCutLine({
            x1: cutStartPt.x,
            y1: cutStartPt.y,
            x2: cutEndPt.x,
            y2: cutEndPt.y,
          });
          setSelectionTarget("piece");
          flashFeedback("Cut piece separated! Drag handles to resize or click a color swatch");
        }
        cutStartPt = null;
        cutEndPt = null;
        setLiveCutLine(null);
        return;
      }

      if (mode === "draw" || mode === "join") {
        isDragging = false;
        if (drawPoints.length >= 2 && onAddSketchLayer) {
          const d = pointsToPath(drawPoints, false);
          const mirrorD = sketchSymmetry ? pointsToPath(drawPoints, true) : undefined;
          if (mode === "join") {
            onAddSketchLayer({
              d,
              mirrorD,
              stroke: "#10B981",
              strokeWidth: 3.5,
              dash: "6 4",
              stitchStyle: "join",
              clipToBody: sketchClipToBody,
            });
            if (onJoinAllSeams) onJoinAllSeams();
            flashFeedback("Pieces joined & sewn together!");
          } else {
            // Convert drawn stroke into CorelDRAW editable Anchor Nodes & Curve Handles!
            const simplifiedNodes = simplifyPointsToNodes(
              drawPoints,
              sketchClosedPanel ? 6 : 5
            );
            onAddSketchLayer({
              d,
              mirrorD,
              nodes: simplifiedNodes,
              symmetry: sketchSymmetry,
              clipToBody: sketchClipToBody,
              stroke: sketchColor,
              strokeWidth: 4,
              dash: sketchClosedPanel ? "" : "6 4",
              closedPanel: sketchClosedPanel,
              fillPath: sketchClosedPanel ? sketchColor : "none",
            });
            setSelectionTarget("layer");
            setSelectedNodeIdx(0);
            flashFeedback(
              sketchClosedPanel
                ? "Shape drawn! Click 'Nodes' tool to sculpt corners & curves"
                : "Stitch line drawn! Click 'Nodes' tool to bend curves"
            );
          }
        }
        drawPoints = [];
        setLiveStroke(null);
        return;
      }

      if (didTransform && targetPieceId && onTransformPiece) {
        onTransformPiece(targetPieceId, { commitHistory: true });
      }
      if (didTransform && targetLayerId && onTransformLayer) {
        onTransformLayer(targetLayerId, { commitHistory: true });
      }
      isDragging = false;
      setIsActivelyPanning(false);
      targetLayerId = null;
      targetPieceId = null;
      activeNodeIndex = -1;
      activeFitField = "";
      didTransform = false;
    };

    stage.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      stage.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    activeTool,
    isSpacePanning,
    maxPanX,
    maxPanY,
    selectionTarget,
    selectedZoneId,
    activeLayer,
    layers,
    zones,
    sketchColor,
    sketchSymmetry,
    sketchClosedPanel,
    sketchClipToBody,
    showPatternGuide,
    onSelectLayer,
    onTransformLayer,
    onTransformPiece,
    onUpdateFitFromNodes,
    onSelectZone,
    onAddSketchLayer,
    onAddCutLine,
    onJoinAllSeams,
  ]);

  const isSelectMode =
    activeTool === "move" ||
    activeTool === "select" ||
    activeTool === "scale" ||
    activeTool === "rotate";

  // CorelDRAW 8-Handle Bounding Box for Selected Garment Piece / Separated Cut Panel
  const pieceGizmoStyle = (() => {
    if (!isSelectMode || selectionTarget !== "piece" || !selectedZoneId) return null;
    const escaped = selectedZoneId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = svgMarkup.match(
      new RegExp(`data-piece="${escaped}"\\s+data-bbox="([^"]+)"`)
    );
    if (!match) return null;
    const [bx, by, bw, bh, , , brot] = match[1].split(",").map(Number);
    if ([bx, by, bw, bh].some((n) => Number.isNaN(n))) return null;
    const left = (bx / 600) * 100;
    const top = (by / 700) * 100;
    const width = Math.max(7, (bw / 600) * 100);
    const height = Math.max(7, (bh / 700) * 100);
    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
      transform: `rotate(${brot || 0}deg)`,
    };
  })();

  const layerGizmoStyle = (() => {
    if (!isSelectMode || selectionTarget !== "layer") return null;
    if (!activeLayer || activeLayer.visible === false) return null;
    const cx = ((activeLayer.x ?? 300) / 600) * 100;
    const cy = ((activeLayer.y ?? 350) / 700) * 100;
    const baseW =
      activeLayer.kind === "text" ? 34 : activeLayer.kind === "path" ? 38 : 24;
    const baseH =
      activeLayer.kind === "text" ? 11 : activeLayer.kind === "path" ? 32 : 18;
    const scale = activeLayer.scale || 1;
    const w = Math.max(12, Math.min(75, baseW * scale));
    const h = Math.max(8, Math.min(65, baseH * scale));
    return {
      left: `${cx - w / 2}%`,
      top: `${cy - h / 2}%`,
      width: `${w}%`,
      height: `${h}%`,
      transform: `rotate(${activeLayer.rotation || 0}deg)`,
    };
  })();

  return (
    <div className="flex-1 min-w-[360px] bg-white flex flex-col h-full relative overflow-hidden select-none border-r border-gray-200/80">
      {/* Row 1: Aligned Column Header with 2D Design / 3D Preview Tabs */}
      <div className="h-11 px-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6 h-full">
          <button
            type="button"
            onClick={() => onToggle3DPreview && onToggle3DPreview(false)}
            className={`h-full flex items-center text-xs font-bold border-b-2 transition ${
              !is3DPreviewActive
                ? "text-[#0E6E55] border-[#0E6E55]"
                : "text-gray-400 hover:text-gray-700 border-transparent"
            }`}
          >
            2D Design
          </button>
          <button
            type="button"
            onClick={() => onToggle3DPreview && onToggle3DPreview(true)}
            className={`h-full flex items-center text-xs font-semibold border-b-2 transition ${
              is3DPreviewActive
                ? "text-[#0E6E55] border-[#0E6E55] font-bold"
                : "text-gray-400 hover:text-gray-700 border-transparent"
            }`}
          >
            3D Preview
          </button>
        </div>

        {/* Live Active Part Indicator Pill */}
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-[#F8F9FA] px-2.5 py-1 rounded-lg border border-gray-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="truncate max-w-[200px]">
            {statusFeedback || `Selected: ${activeZoneLabel}`}
          </span>
        </div>
      </div>

      {/* Row 2: Simple, Labeled 6-Mode CorelDRAW Toolbar (Select | Hand | Nodes | Draw | Cut | Join) */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-[#FAFBFD] shrink-0 relative z-20">
        {/* Left: 6 Clear Labeled Tools */}
        <div className="flex items-center gap-1 bg-white border border-gray-200/80 rounded-xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setActiveTool("move");
              flashFeedback("Click any piece or shape to color & resize it");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              isSelectMode
                ? "bg-[#0E6E55] text-white font-bold shadow-2xs"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Select</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool("pan");
              flashFeedback(
                "Hand Tool: Drag anywhere to move up, down, left & right as you zoom"
              );
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              activeTool === "pan" || isSpacePanning
                ? "bg-[#0E6E55] text-white font-bold shadow-2xs"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            title="Hand Pan Tool (Or hold Spacebar) — Drag to move up & down through the zoomed workspace"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Hand</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool("nodes");
              const firstPath = layers.find(
                (l) => l.kind === "path" && Array.isArray(l.nodes) && l.visible !== false
              );
              if (firstPath && (!activeLayer || activeLayer.kind !== "path")) {
                setSelectionTarget("layer");
                onSelectLayer?.(firstPath.id);
              }
              flashFeedback(
                "CorelDRAW Shape Tool: Drag ■ Anchor Nodes, ● Curve Handles, or ◆ Human Fit Points"
              );
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              activeTool === "nodes"
                ? "bg-[#0E6E55] text-white font-bold shadow-2xs"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            title="CorelDRAW Shape Tool (Node & Curve Editor + Human Pattern Fit Nodes)"
          >
            <Spline className="w-3.5 h-3.5" />
            <span>Nodes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool("draw");
              flashFeedback(
                "Draw shapes on the Human Pattern Guide or insert a 1-Click Clothing Shape"
              );
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              activeTool === "draw"
                ? "bg-[#0E6E55] text-white font-bold shadow-2xs"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool("cut");
              flashFeedback("Drag a line across the garment to slice it into panels");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              activeTool === "cut"
                ? "bg-[#0E6E55] text-white font-bold shadow-2xs"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Cut</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool("join");
              flashFeedback("Separate cut pieces or sew & join them together");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              activeTool === "join"
                ? "bg-[#0E6E55] text-white font-bold shadow-2xs"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Join</span>
          </button>
        </div>

        {/* Right: Flip, Grid, Layers & Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleFlipActiveLayer}
            title="Flip Selected Layer"
            className="p-1.5 rounded-lg border border-gray-200/80 bg-white text-gray-600 hover:text-gray-900 transition"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowGrid((g) => !g);
              if (onTogglePrintGuides) onTogglePrintGuides();
            }}
            title="Toggle Grid"
            className={`p-1.5 rounded-lg border transition ${
              showGrid
                ? "border-[#0E6E55]/30 bg-[#ECFDF5] text-[#0E6E55]"
                : "border-gray-200/80 bg-white text-gray-600"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowLayersPopover((v) => !v)}
            title="Layers"
            className={`p-1.5 rounded-lg border transition ${
              showLayersPopover
                ? "border-[#0E6E55] bg-[#0E6E55] text-white"
                : "border-gray-200/80 bg-white text-gray-600"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg border border-gray-200/80 bg-white text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg border border-gray-200/80 bg-white text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Canvas Layers Manager Popover */}
        {showLayersPopover && (
          <div className="absolute right-4 top-12 w-64 bg-white rounded-xl border border-gray-200 shadow-xl p-3 z-40 space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-900">
                Layers ({activeView})
              </span>
              <div className="flex items-center gap-1">
                {onAddQuickText && (
                  <button
                    type="button"
                    onClick={onAddQuickText}
                    className="text-[10px] font-bold bg-[#ECFDF5] text-[#0E6E55] px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
                  >
                    + Text
                  </button>
                )}
                {onAddQuickEmblem && (
                  <button
                    type="button"
                    onClick={onAddQuickEmblem}
                    className="text-[10px] font-bold bg-[#ECFDF5] text-[#0E6E55] px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
                  >
                    + Logo
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {layers.map((layer) => {
                const isSel = layer.id === activeLayer?.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => {
                      setSelectionTarget("layer");
                      if (onSelectLayer) onSelectLayer(layer.id);
                    }}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-[11px] cursor-pointer transition ${
                      isSel
                        ? "bg-[#ECFDF5] text-[#0E6E55] font-bold border border-emerald-200"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="truncate max-w-[110px]">
                      {layer.name || layer.text || "Layer"}
                    </span>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onReorderLayer && (
                        <>
                          <button
                            type="button"
                            onClick={() => onReorderLayer(layer.id, "up")}
                            className="p-0.5 text-gray-400 hover:text-gray-700"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReorderLayer(layer.id, "down")}
                            className="p-0.5 text-gray-400 hover:text-gray-700"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {onDuplicateLayer && (
                        <button
                          type="button"
                          onClick={() => onDuplicateLayer(layer.id)}
                          className="p-0.5 text-gray-400 hover:text-[#0E6E55]"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                      {onToggleLayerLock && (
                        <button
                          type="button"
                          onClick={() => onToggleLayerLock(layer.id)}
                          className="p-0.5 text-gray-400 hover:text-amber-600"
                        >
                          {layer.locked ? (
                            <Lock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <Unlock className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      {onToggleLayerVisibility && (
                        <button
                          type="button"
                          onClick={() => onToggleLayerVisibility(layer.id)}
                          className="p-0.5 text-gray-400 hover:text-gray-700"
                        >
                          {layer.visible ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      )}
                      {onRemoveLayer && (
                        <button
                          type="button"
                          onClick={() => onRemoveLayer(layer.id)}
                          className="p-0.5 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Blueprint Stage Area */}
      <div
        ref={stageAreaRef}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 15 : -15;
          setZoom((z) => Math.max(45, Math.min(320, z + delta)));
        }}
        className={`flex-1 relative flex flex-col items-center justify-between overflow-hidden p-4 ${
          isActivelyPanning
            ? "cursor-grabbing"
            : activeTool === "pan" || isSpacePanning
            ? "cursor-grab"
            : ""
        } ${
          showGrid
            ? "bg-[#FAFBFD] bg-[linear-gradient(to_right,#eef2f6_1px,transparent_1px),linear-gradient(to_bottom,#eef2f6_1px,transparent_1px)] bg-[size:28px_28px]"
            : "bg-[#FAFBFD]"
        }`}
      >
        {/* Top Stage Bar: Front/Back + Human Pattern Guide + Wireframe + Context Property Bar */}
        <div className="z-20 flex flex-col items-center gap-1.5 w-full">
          <div className="flex items-center flex-wrap justify-center gap-1.5">
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-gray-200 shadow-2xs">
              <button
                type="button"
                onClick={() => onToggleView("front")}
                className={`px-3.5 py-1 rounded-md text-[11px] font-bold transition ${
                  activeView === "front"
                    ? "bg-[#ECFDF5] text-[#0E6E55] border border-[#10B981]/30"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => onToggleView("back")}
                className={`px-3.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  activeView === "back"
                    ? "bg-[#ECFDF5] text-[#0E6E55] border border-[#10B981]/30 font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Back
              </button>
            </div>

            {onTogglePatternGuide && (
              <button
                type="button"
                onClick={() => {
                  onTogglePatternGuide();
                  flashFeedback(
                    !showPatternGuide
                      ? "Human Clothing Pattern Guide & Snap Landmarks enabled"
                      : "Human Clothing Pattern Guide hidden"
                  );
                }}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition shadow-2xs ${
                  showPatternGuide
                    ? "bg-[#ECFDF5] text-[#0E6E55] border-[#10B981]/40"
                    : "bg-white text-gray-600 border-gray-200 hover:text-gray-900"
                }`}
                title="Toggle Anatomical Dress Form, Tailor Ruler & Human Fit Landmark Snapping"
              >
                {showPatternGuide ? "Pattern Guide: ON" : "Pattern Guide"}
              </button>
            )}

            {onToggleWireframe && (
              <button
                type="button"
                onClick={() => {
                  onToggleWireframe();
                  flashFeedback(
                    !isWireframe
                      ? "CorelDRAW Wireframe View enabled"
                      : "Enhanced Fabric View enabled"
                  );
                }}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition shadow-2xs ${
                  isWireframe
                    ? "bg-[#0284c7] text-white border-[#0284c7]"
                    : "bg-white text-gray-600 border-gray-200 hover:text-gray-900"
                }`}
                title="Toggle CorelDRAW Wireframe Vector Skeleton View"
              >
                {isWireframe ? "Wireframe: ON" : "Wireframe"}
              </button>
            )}
          </div>

          {/* CorelDRAW Context Property Bar when Pick/Select Mode is Active */}
          {isSelectMode && selectedZoneId && (
            <div className="flex items-center flex-wrap justify-center gap-1.5 bg-white/95 backdrop-blur-xs border border-gray-200/90 rounded-xl px-2.5 py-1 shadow-xs text-[10px]">
              {/* Piece Selector Dropdown */}
              <select
                value={selectedZoneId}
                onChange={(e) => {
                  setSelectionTarget("piece");
                  if (onSelectZone) onSelectZone(e.target.value);
                }}
                className="bg-[#ECFDF5] text-[#0E6E55] font-bold rounded-md px-2 py-0.5 border border-emerald-200 focus:outline-none cursor-pointer"
                title="Select separated piece to color or resize"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    Piece: {z.label}
                  </option>
                ))}
              </select>

              {/* Width Stretch (scaleX) */}
              <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5">
                <span className="text-gray-400 font-bold">W:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionTarget("piece");
                    onTransformPiece?.(selectedZoneId, {
                      scaleXAbs: Math.max(0.4, (activePieceTransform.scaleX ?? 1) - 0.08),
                      commitHistory: true,
                    });
                  }}
                  className="px-1 font-bold text-gray-600 hover:text-[#0E6E55]"
                  title="Narrow Piece Width (-8%)"
                >
                  -
                </button>
                <span className="font-bold text-gray-800 min-w-[30px] text-center">
                  {pieceScaleW}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionTarget("piece");
                    onTransformPiece?.(selectedZoneId, {
                      scaleXAbs: Math.min(2.2, (activePieceTransform.scaleX ?? 1) + 0.08),
                      commitHistory: true,
                    });
                  }}
                  className="px-1 font-bold text-gray-600 hover:text-[#0E6E55]"
                  title="Widen Piece Width (+8%)"
                >
                  +
                </button>
              </div>

              {/* Height Stretch (scaleY) */}
              <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5">
                <span className="text-gray-400 font-bold">H:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionTarget("piece");
                    onTransformPiece?.(selectedZoneId, {
                      scaleYAbs: Math.max(0.4, (activePieceTransform.scaleY ?? 1) - 0.08),
                      commitHistory: true,
                    });
                  }}
                  className="px-1 font-bold text-gray-600 hover:text-[#0E6E55]"
                  title="Shorten Piece Height (-8%)"
                >
                  -
                </button>
                <span className="font-bold text-gray-800 min-w-[30px] text-center">
                  {pieceScaleH}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionTarget("piece");
                    onTransformPiece?.(selectedZoneId, {
                      scaleYAbs: Math.min(2.2, (activePieceTransform.scaleY ?? 1) + 0.08),
                      commitHistory: true,
                    });
                  }}
                  className="px-1 font-bold text-gray-600 hover:text-[#0E6E55]"
                  title="Lengthen Piece Height (+8%)"
                >
                  +
                </button>
              </div>

              {/* Rotation Stepper */}
              <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionTarget("piece");
                    onTransformPiece?.(selectedZoneId, {
                      rotation: -10,
                      commitHistory: true,
                    });
                  }}
                  className="px-1 font-bold text-gray-600 hover:text-[#0E6E55]"
                  title="Rotate Piece -10°"
                >
                  ↺
                </button>
                <span className="font-bold text-gray-800 min-w-[24px] text-center">
                  {pieceAngle}°
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionTarget("piece");
                    onTransformPiece?.(selectedZoneId, {
                      rotation: 10,
                      commitHistory: true,
                    });
                  }}
                  className="px-1 font-bold text-gray-600 hover:text-[#0E6E55]"
                  title="Rotate Piece +10°"
                >
                  ↻
                </button>
              </div>

              {/* CorelDRAW Contour Seam Allowance Toggle */}
              <button
                type="button"
                onClick={() => {
                  setSelectionTarget("piece");
                  onTransformPiece?.(selectedZoneId, {
                    contourOffset: !activePieceTransform.contourOffset,
                    commitHistory: true,
                  });
                }}
                className={`px-2 py-0.5 rounded-md font-bold transition ${
                  activePieceTransform.contourOffset
                    ? "bg-[#0284c7] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Toggle CorelDRAW Parallel Seam Allowance Contour"
              >
                Seam Allowance
              </button>

              {/* If activeLayer is a vector shape, quick button to edit its CorelDRAW Nodes */}
              {activeLayer?.kind === "path" && Array.isArray(activeLayer.nodes) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectionTarget("layer");
                    setActiveTool("nodes");
                  }}
                  className="px-2 py-0.5 rounded-md bg-[#0E6E55] text-white font-bold transition"
                >
                  Edit Shape Nodes
                </button>
              )}

              {/* Reset Piece Transform */}
              <button
                type="button"
                onClick={() => {
                  onTransformPiece?.(selectedZoneId, {
                    reset: true,
                    commitHistory: true,
                  });
                  flashFeedback(`Reset "${activeZoneLabel}" to 100%`);
                }}
                className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition"
                title="Reset piece size, position & rotation"
              >
                Reset
              </button>
            </div>
          )}

          {/* Hand-Drag Pan Tool Helper Bar (Move Up/Down through zoomed workspace) */}
          {(activeTool === "pan" || isSpacePanning) && (
            <div className="flex items-center flex-wrap justify-center gap-1.5 bg-white/95 backdrop-blur-xs border border-emerald-200 rounded-xl px-3 py-1.5 shadow-sm text-[10px]">
              <span className="font-bold text-[#0E6E55] flex items-center gap-1">
                <Hand className="w-3 h-3" />
                <span>Drag anywhere to pan workspace:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoom((z) => Math.max(150, z));
                  setPan({ x: 0, y: 170 });
                  flashFeedback("Moved up to Collar & Shoulder view");
                }}
                className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-[#ECFDF5] text-gray-700 hover:text-[#0E6E55] font-bold transition"
              >
                ↑ Top (Collar)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPan({ x: 0, y: 0 });
                  flashFeedback("Centered on Torso");
                }}
                className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-[#ECFDF5] text-gray-700 hover:text-[#0E6E55] font-bold transition"
              >
                ◎ Center (Torso)
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom((z) => Math.max(150, z));
                  setPan({ x: 0, y: -170 });
                  flashFeedback("Moved down to Waist & Hem view");
                }}
                className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-[#ECFDF5] text-gray-700 hover:text-[#0E6E55] font-bold transition"
              >
                ↓ Bottom (Hem)
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("move")}
                className="px-2 py-0.5 rounded-md bg-gray-900 text-white font-bold ml-1"
              >
                Done
              </button>
            </div>
          )}

          {/* CorelDRAW Shape Tool (Nodes & Curves Editor + Human Fit Nodes) Property Bar */}
          {activeTool === "nodes" && (
            <div className="flex flex-col items-center gap-1 bg-white/95 backdrop-blur-xs border border-emerald-200 rounded-xl px-2.5 py-1.5 shadow-sm text-[10px]">
              {activeLayer?.kind === "path" && Array.isArray(activeLayer.nodes) ? (
                <div className="flex items-center flex-wrap justify-center gap-1.5">
                  <span className="font-extrabold text-[#0E6E55] bg-[#ECFDF5] px-2 py-0.5 rounded border border-emerald-200">
                    Shape: {activeLayer.name} ({activeLayer.nodes.length} Nodes)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddShapeNode}
                    className="px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#0E6E55] hover:bg-emerald-100 font-bold border border-emerald-200 transition"
                    title="Insert a new node on the selected segment"
                  >
                    + Add Node
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteShapeNode}
                    className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 font-bold border border-red-200 transition"
                    title="Delete the selected square node"
                  >
                    - Delete Node
                  </button>
                  <button
                    type="button"
                    onClick={handleStraightenShapeCurves}
                    className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold transition"
                    title="Convert curved segments back to straight lines"
                  >
                    Straighten
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onTransformLayer?.(activeLayer.id, {
                        clipToBody: activeLayer.clipToBody === false,
                        commitHistory: true,
                      })
                    }
                    className={`px-2 py-0.5 rounded-md font-bold transition ${
                      activeLayer.clipToBody !== false
                        ? "bg-[#0284c7] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    title="CorelDRAW PowerClip: Automatically clip shape to the human clothing silhouette"
                  >
                    {activeLayer.clipToBody !== false ? "Fit to Garment: ON" : "Fit to Garment"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onTransformLayer?.(activeLayer.id, {
                        symmetry: !activeLayer.symmetry,
                        commitHistory: true,
                      })
                    }
                    className={`px-2 py-0.5 rounded-md font-bold transition ${
                      activeLayer.symmetry
                        ? "bg-[#0E6E55] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    title="Mirror shape across Human Center Grainline (X=300)"
                  >
                    Mirror
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool("move")}
                    className="px-2 py-0.5 rounded-md bg-gray-900 text-white font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center flex-wrap justify-center gap-1">
                  <span className="font-bold text-gray-600 mr-1">
                    Drag ◆ Green Fit Nodes on garment OR insert a Clothing Shape:
                  </span>
                  {CORELDRAW_PATTERN_SHAPES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleInsertClothingShape(preset)}
                      className="px-2 py-0.5 rounded-md bg-[#ECFDF5] hover:bg-emerald-100 text-[#0E6E55] border border-emerald-200 font-bold transition"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CorelDRAW Vector Shape Drawing & 1-Click Clothing Pattern Blocks when Draw is active */}
          {activeTool === "draw" && (
            <div className="flex flex-col items-center gap-1 bg-white/95 backdrop-blur-xs border border-emerald-200 rounded-xl px-3 py-1.5 shadow-sm text-[10px]">
              <div className="flex items-center flex-wrap justify-center gap-2">
                <div className="flex items-center gap-1">
                  {["#10B981", "#0E6E55", "#FFFFFF", "#111827", "#F59E0B", "#EF4444", "#0284C7"].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSketchColor(c)}
                        className={`w-4 h-4 rounded-full border transition ${
                          sketchColor === c
                            ? "ring-2 ring-[#0E6E55] scale-110"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSketchClosedPanel((p) => !p)}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    sketchClosedPanel
                      ? "bg-[#0E6E55] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {sketchClosedPanel ? "Filled Shape" : "Stitch Line"}
                </button>
                <button
                  type="button"
                  onClick={() => setSketchClipToBody((c) => !c)}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    sketchClipToBody
                      ? "bg-[#0284c7] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  title="CorelDRAW PowerClip: Fit drawn shapes cleanly inside the human garment silhouette"
                >
                  {sketchClipToBody ? "Fit to Garment: ON" : "Fit to Garment"}
                </button>
                <button
                  type="button"
                  onClick={() => setSketchSymmetry((s) => !s)}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    sketchSymmetry
                      ? "bg-[#ECFDF5] text-[#0E6E55] border border-emerald-300"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Mirror
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool("nodes")}
                  className="px-2 py-0.5 rounded-md bg-gray-900 text-white font-bold"
                >
                  Edit Nodes
                </button>
              </div>

              {/* Row of 1-Click Editable Clothing Shapes fitted to the Human Pattern Guide */}
              <div className="flex items-center flex-wrap justify-center gap-1 pt-0.5 border-t border-gray-100 w-full">
                <span className="font-bold text-gray-500 mr-0.5">Pattern Shapes:</span>
                {CORELDRAW_PATTERN_SHAPES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleInsertClothingShape(preset)}
                    className="px-1.5 py-0.5 rounded bg-[#F8FAFC] hover:bg-[#ECFDF5] text-gray-700 hover:text-[#0E6E55] border border-gray-200 hover:border-emerald-300 font-semibold transition"
                    title={`Insert editable "${preset.label}" fitted to the human clothing guide`}
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === "cut" && (
            <div className="flex items-center gap-1.5 bg-white border border-emerald-200 rounded-xl px-3 py-1.5 shadow-sm text-[11px]">
              <span className="font-bold text-gray-700">Quick Cut:</span>
              {[
                { id: "center-split", label: "Left / Right" },
                { id: "colorblock-h", label: "Top / Bottom" },
                { id: "chevron-v", label: "V-Cut" },
                { id: "none", label: "Reset" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onSelectCutPreset && onSelectCutPreset(item.id as any)
                  }
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    activeCutPreset === item.id
                      ? "bg-[#0E6E55] text-white font-bold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActiveTool("move")}
                className="px-2 py-0.5 rounded-md bg-gray-900 text-white font-bold ml-1"
              >
                Done
              </button>
            </div>
          )}

          {activeTool === "join" && (
            <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-1.5 shadow-sm text-[11px]">
              <button
                type="button"
                onClick={() =>
                  onChangeExplodeAmount && onChangeExplodeAmount(85)
                }
                className={`px-2.5 py-0.5 rounded-md font-bold transition ${
                  explodeAmount > 10
                    ? "bg-[#0284c7] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Separate Pieces
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onJoinAllSeams) onJoinAllSeams();
                  flashFeedback("All pieces joined & sewn together!");
                }}
                className={`px-2.5 py-0.5 rounded-md font-bold transition flex items-center gap-1 ${
                  explodeAmount <= 10
                    ? "bg-[#0E6E55] text-white"
                    : "bg-emerald-50 text-[#0E6E55] border border-emerald-300"
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Sew & Join All</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("move")}
                className="px-2 py-0.5 rounded-md bg-gray-900 text-white font-bold"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Left Floating 3-Angle Thumbnail Strip matching mockup */}
        <div className="absolute left-3.5 top-20 flex flex-col gap-2 z-10">
          <button
            type="button"
            onClick={() => {
              onToggleView("front");
              setZoom(100);
            }}
            title="Front View"
            className={`w-12 h-13 rounded-xl border p-1 bg-white shadow-2xs transition flex items-center justify-center overflow-hidden ${
              activeView === "front" && zoom <= 115
                ? "border-[#0E6E55] ring-2 ring-[#0E6E55]/25"
                : "border-gray-200/90 opacity-75 hover:opacity-100"
            }`}
          >
            <div
              className="w-full h-full flex items-center justify-center pointer-events-none [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: frontSvgMarkup || svgMarkup }}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleView("back");
              setZoom(100);
            }}
            title="Back View"
            className={`w-12 h-13 rounded-xl border p-1 bg-white shadow-2xs transition flex items-center justify-center overflow-hidden ${
              activeView === "back"
                ? "border-[#0E6E55] ring-2 ring-[#0E6E55]/25"
                : "border-gray-200/90 opacity-75 hover:opacity-100"
            }`}
          >
            <div
              className="w-full h-full flex items-center justify-center pointer-events-none [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: backSvgMarkup || svgMarkup }}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              setZoom((z) => (z > 115 ? 100 : 135));
            }}
            title="Toggle Detail Zoom"
            className={`w-12 h-13 rounded-xl border p-1 bg-white shadow-2xs transition flex items-center justify-center overflow-hidden ${
              zoom > 115
                ? "border-[#0E6E55] ring-2 ring-[#0E6E55]/25"
                : "border-gray-200/90 opacity-75 hover:opacity-100"
            }`}
          >
            <div
              className="w-full h-full flex items-center justify-center pointer-events-none scale-150 [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: frontSvgMarkup || svgMarkup }}
            />
          </button>
        </div>

        {/* CorelDRAW Docked Vertical Color Swatch Strip (Right Side of Stage) */}
        <div
          className="absolute right-2.5 top-20 z-20 bg-white/95 backdrop-blur-xs border border-gray-200/90 rounded-xl p-1.5 shadow-sm flex flex-col items-center gap-1"
          title="CorelDRAW Color Palette: Left-click to color selected Piece or Shape Fill, Right-click (or toggle Line) to color Outline"
        >
          {/* Fill vs Line Stroke Toggle */}
          <button
            type="button"
            onClick={() =>
              setSwatchTargetMode((m) => (m === "fill" ? "outline" : "fill"))
            }
            className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded transition w-full text-center ${
              swatchTargetMode === "fill"
                ? "bg-[#0E6E55] text-white"
                : "bg-gray-900 text-white"
            }`}
            title="Toggle between Fill Color and Seam/Outline Color"
          >
            {swatchTargetMode === "fill" ? "Fill" : "Line"}
          </button>

          <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto py-0.5 px-0.5">
            {CORELDRAW_SWATCHES.map((swatch) => {
              const isLayerTarget =
                (selectionTarget === "layer" || activeTool === "nodes") &&
                activeLayer &&
                (activeLayer.kind === "path" || activeLayer.kind === "text");
              const currentFill = isLayerTarget
                ? activeLayer.fillPath || activeLayer.fill || activeLayer.stroke || "#10B981"
                : zoneColors[selectedZoneId] || "#062D24";
              const currentOutline = isLayerTarget
                ? activeLayer.outlineColor || activeLayer.stroke || ""
                : activePieceTransform.outlineColor || "";
              const isSelectedSwatch =
                swatchTargetMode === "fill"
                  ? currentFill.toLowerCase() === swatch.toLowerCase()
                  : currentOutline.toLowerCase() === swatch.toLowerCase();

              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => {
                    if (isLayerTarget && activeLayer && onTransformLayer) {
                      if (swatchTargetMode === "outline") {
                        onTransformLayer(activeLayer.id, {
                          outlineColor: swatch,
                          stroke: swatch,
                          commitHistory: true,
                        });
                        flashFeedback(
                          `Outline of "${activeLayer.name}" set to ${swatch}`
                        );
                      } else if (activeLayer.kind === "path") {
                        onTransformLayer(activeLayer.id, {
                          fillPath: swatch,
                          stroke: swatch,
                          commitHistory: true,
                        });
                        setSketchColor(swatch);
                        flashFeedback(`Colored shape "${activeLayer.name}" → ${swatch}`);
                      } else {
                        onTransformLayer(activeLayer.id, {
                          fill: swatch,
                          commitHistory: true,
                        });
                        flashFeedback(`Colored text "${activeLayer.name}" → ${swatch}`);
                      }
                      return;
                    }
                    if (!selectedZoneId) return;
                    if (swatchTargetMode === "outline") {
                      onTransformPiece?.(selectedZoneId, {
                        outlineColor: swatch,
                        commitHistory: true,
                      });
                      flashFeedback(`Outline of "${activeZoneLabel}" set to ${swatch}`);
                    } else {
                      onColorChange?.(selectedZoneId, swatch);
                      flashFeedback(`Colored "${activeZoneLabel}" → ${swatch}`);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isLayerTarget && activeLayer && onTransformLayer) {
                      onTransformLayer(activeLayer.id, {
                        outlineColor: swatch,
                        stroke: swatch,
                        commitHistory: true,
                      });
                      flashFeedback(
                        `CorelDRAW Right-Click: "${activeLayer.name}" outline set to ${swatch}`
                      );
                      return;
                    }
                    if (!selectedZoneId) return;
                    onTransformPiece?.(selectedZoneId, {
                      outlineColor: swatch,
                      commitHistory: true,
                    });
                    flashFeedback(
                      `CorelDRAW Right-Click: "${activeZoneLabel}" outline set to ${swatch}`
                    );
                  }}
                  style={{ backgroundColor: swatch }}
                  className={`w-4 h-4 rounded-xs transition-transform hover:scale-125 shrink-0 ${
                    isSelectedSwatch
                      ? "ring-2 ring-[#0E6E55] ring-offset-1 border border-white scale-110"
                      : "border border-gray-300"
                  }`}
                  title={`Click: Fill (${swatch}) | Right-Click: Outline Stroke`}
                />
              );
            })}
          </div>

          {/* Custom Color Picker at bottom of CorelDRAW strip */}
          <label
            title={`Custom ${swatchTargetMode === "fill" ? "Fill" : "Outline"} Color`}
            className="w-4 h-4 rounded-xs border border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:border-[#0E6E55] text-[9px] font-bold text-gray-500"
          >
            +
            <input
              type="color"
              value={zoneColors[selectedZoneId] || "#062D24"}
              onChange={(e) => {
                if (!selectedZoneId) return;
                if (swatchTargetMode === "outline") {
                  onTransformPiece?.(selectedZoneId, {
                    outlineColor: e.target.value,
                    commitHistory: true,
                  });
                } else {
                  onColorChange?.(selectedZoneId, e.target.value);
                }
              }}
              className="sr-only"
            />
          </label>
        </div>

        {/* Center Vector Garment with Interactive CorelDRAW 8-Handle Gizmo, Node Editor & Human Pattern Guide */}
        <div className="flex-1 flex items-center justify-center w-full pl-12 pr-9 my-1 overflow-hidden">
          <div
            ref={garmentBoxRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            }}
            className={`relative transition-transform duration-75 ease-out flex items-center justify-center w-[290px] h-[340px] xl:w-[320px] xl:h-[375px] ${
              isActivelyPanning
                ? "cursor-grabbing"
                : activeTool === "pan" || isSpacePanning
                ? "cursor-grab"
                : activeTool === "draw" || activeTool === "cut" || activeTool === "join"
                ? "cursor-crosshair"
                : "cursor-pointer"
            }`}
          >
            {/* Rendered Garment + Croquis + Cut Panels + Sewing Threads SVG */}
            <div
              className="w-full h-full flex items-center justify-center drop-shadow-md [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />

            {/* Magnetic Snap-to-Human-Pattern-Guide Indicator Ring & Badge */}
            {snappedLandmark && (
              <svg
                viewBox="0 0 600 700"
                className="absolute inset-0 w-full h-full pointer-events-none z-30"
              >
                <circle
                  cx={snappedLandmark.x}
                  cy={snappedLandmark.y}
                  r="13"
                  fill="rgba(2,132,199,0.18)"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
                <circle
                  cx={snappedLandmark.x}
                  cy={snappedLandmark.y}
                  r="4"
                  fill="#0284c7"
                />
                <rect
                  x={Math.min(410, Math.max(20, snappedLandmark.x - 75))}
                  y={Math.max(24, snappedLandmark.y - 30)}
                  width="155"
                  height="18"
                  rx="4"
                  fill="#0f172a"
                />
                <text
                  x={Math.min(487, Math.max(97, snappedLandmark.x))}
                  y={Math.max(36, snappedLandmark.y - 18)}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#38bdf8"
                >
                  ◎ SNAP: {snappedLandmark.label}
                </text>
              </svg>
            )}

            {/* CorelDRAW Shape Tool (`Nodes` Mode): Interactive Vector Node Cage + Human Garment Fit Nodes */}
            {activeTool === "nodes" && (
              <>
                {/* SVG Control Cage & Bézier Tangent Lines for Active Shape Layer */}
                <svg
                  viewBox="0 0 600 700"
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                >
                  {/* Subtle Human Pattern Landmark Target Dots */}
                  {showPatternGuide &&
                    HUMAN_PATTERN_LANDMARKS.map((lm) => (
                      <circle
                        key={lm.id}
                        cx={lm.x}
                        cy={lm.y}
                        r="3.5"
                        fill="#FFFFFF"
                        stroke="#0284c7"
                        strokeWidth="1.5"
                        opacity="0.7"
                      />
                    ))}

                  {activeLayer?.kind === "path" &&
                    Array.isArray(activeLayer.nodes) &&
                    activeLayer.nodes.map((node: VectorShapeNode, i: number) => {
                      const nodes = activeLayer.nodes as VectorShapeNode[];
                      const next = nodes[(i + 1) % nodes.length];
                      const ctrlX = node.cx ?? (node.x + next.x) / 2;
                      const ctrlY = node.cy ?? (node.y + next.y) / 2;
                      return (
                        <g key={`cage-${i}`}>
                          <line
                            x1={node.x}
                            y1={node.y}
                            x2={ctrlX}
                            y2={ctrlY}
                            stroke="#0284c7"
                            strokeWidth="1.3"
                            strokeDasharray="3 3"
                          />
                          <line
                            x1={ctrlX}
                            y1={ctrlY}
                            x2={next.x}
                            y2={next.y}
                            stroke="#0284c7"
                            strokeWidth="1.3"
                            strokeDasharray="3 3"
                          />
                        </g>
                      );
                    })}
                </svg>

                {/* Draggable Square Anchor Nodes (■) & Round Curve Control Handles (●) */}
                {activeLayer?.kind === "path" &&
                  Array.isArray(activeLayer.nodes) &&
                  activeLayer.nodes.map((node: VectorShapeNode, i: number) => {
                    const nodes = activeLayer.nodes as VectorShapeNode[];
                    const next = nodes[(i + 1) % nodes.length];
                    const isClosed = Boolean(activeLayer.closedPanel);
                    const showCurveHandle = isClosed || i < nodes.length - 1;
                    const ctrlX = node.cx ?? Number(((node.x + next.x) / 2).toFixed(1));
                    const ctrlY = node.cy ?? Number(((node.y + next.y) / 2).toFixed(1));
                    const isCurved = node.cx !== undefined && node.cy !== undefined;

                    return (
                      <div key={`node-wrap-${i}`}>
                        {/* Square CorelDRAW Anchor Node (■) */}
                        <div
                          data-node-idx={i}
                          title={`CorelDRAW Anchor Node #${i + 1} (${node.x}, ${node.y}) — Drag to move corner or snap to Human Pattern Guide`}
                          style={{
                            left: `${(node.x / 600) * 100}%`,
                            top: `${(node.y / 700) * 100}%`,
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-2 pointer-events-auto cursor-move z-30 transition-transform hover:scale-125 ${
                            selectedNodeIdx === i
                              ? "bg-[#0284c7] border-white ring-2 ring-[#0284c7] scale-115"
                              : "bg-white border-[#0f172a]"
                          }`}
                        />

                        {/* Round CorelDRAW Curve Control Handle (●) */}
                        {showCurveHandle && (
                          <div
                            data-curve-idx={i}
                            title={`CorelDRAW Curve Handle #${i + 1} — Drag to bend edge into a smooth curve`}
                            style={{
                              left: `${(ctrlX / 600) * 100}%`,
                              top: `${(ctrlY / 700) * 100}%`,
                            }}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border pointer-events-auto cursor-grab active:cursor-grabbing z-30 transition-transform hover:scale-135 ${
                              isCurved
                                ? "bg-[#F59E0B] border-white ring-1 ring-[#F59E0B]"
                                : "bg-[#38bdf8] border-white"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}

                {/* 5 Interactive Human Clothing Pattern Fit Nodes (◆) on the Garment Silhouette */}
                {showPatternGuide &&
                  onUpdateFitFromNodes &&
                  [
                    {
                      id: "shoulder",
                      label: "Shoulder Slope",
                      x: 174 + (fitMeasurements.shoulderWidth || 0),
                      y: 138,
                    },
                    {
                      id: "chest",
                      label: "Bust / Chest Width",
                      x: 152 - (fitMeasurements.chestWidth || 0),
                      y: 268,
                    },
                    {
                      id: "waist",
                      label: "Natural Waist Taper",
                      x: 164 - (fitMeasurements.waistTaper || 0),
                      y: 392,
                    },
                    {
                      id: "hip",
                      label: "Hip Flare",
                      x: 152 - (fitMeasurements.hipWidth || 0),
                      y: 525,
                    },
                    {
                      id: "hem",
                      label: "Garment Hem Length",
                      x: 300,
                      y: 590 + (fitMeasurements.hemLength || 0),
                    },
                  ].map((fp) => (
                    <div
                      key={fp.id}
                      data-fit-node={fp.id}
                      title={`Human Clothing Fit Node: Drag to tailor ${fp.label} on 2D & 3D`}
                      style={{
                        left: `${(fp.x / 600) * 100}%`,
                        top: `${(fp.y / 700) * 100}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rotate-45 w-3 h-3 bg-[#10B981] border-2 border-white shadow-sm pointer-events-auto cursor-ew-resize hover:scale-130 transition-transform z-25"
                    />
                  ))}
              </>
            )}

            {/* Live Freehand Stroke / Panel Preview */}
            {liveStroke && (
              <svg
                viewBox="0 0 600 700"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <path
                  d={
                    sketchClosedPanel && activeTool === "draw"
                      ? `${liveStroke.d} Z`
                      : liveStroke.d
                  }
                  fill={
                    sketchClosedPanel && activeTool === "draw"
                      ? sketchColor
                      : "none"
                  }
                  fillOpacity={sketchClosedPanel ? 0.5 : 0}
                  stroke={activeTool === "join" ? "#0284c7" : sketchColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={sketchClosedPanel ? undefined : "6 4"}
                />
                {liveStroke.mirrorD && (
                  <path
                    d={
                      sketchClosedPanel && activeTool === "draw"
                        ? `${liveStroke.mirrorD} Z`
                        : liveStroke.mirrorD
                    }
                    fill={
                      sketchClosedPanel && activeTool === "draw"
                        ? sketchColor
                        : "none"
                    }
                    fillOpacity={sketchClosedPanel ? 0.5 : 0}
                    stroke={activeTool === "join" ? "#0284c7" : sketchColor}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={sketchClosedPanel ? undefined : "6 4"}
                  />
                )}
              </svg>
            )}

            {/* Live Knife Cut Line Preview */}
            {liveCutLine && (
              <svg
                viewBox="0 0 600 700"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <line
                  x1={liveCutLine.x1}
                  y1={liveCutLine.y1}
                  x2={liveCutLine.x2}
                  y2={liveCutLine.y2}
                  stroke="#EF4444"
                  strokeWidth="3.5"
                  strokeDasharray="8 5"
                />
                <circle
                  cx={liveCutLine.x1}
                  cy={liveCutLine.y1}
                  r="5"
                  fill="#FFFFFF"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                />
                <circle
                  cx={liveCutLine.x2}
                  cy={liveCutLine.y2}
                  r="5"
                  fill="#EF4444"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </svg>
            )}

            {/* Outer Subtle Cyan CAD Bounding Box Frame matching mockup */}
            <div className="absolute inset-3 border border-[#38bdf8]/65 pointer-events-none">
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-[#0284c7]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-[#0284c7]" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-[#0284c7]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-[#0284c7]" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-[#0284c7]" />
            </div>

            {/* CorelDRAW 8-Handle Bounding Box for Selected Separated Piece (`pieceGizmoStyle`) */}
            {pieceGizmoStyle && (
              <div
                style={pieceGizmoStyle}
                className="absolute border border-dashed border-[#0284c7] bg-[#38bdf8]/5 pointer-events-none rounded-xs transition-all duration-75"
              >
                {/* Floating Piece Badge */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0f172a]/90 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  {activeZoneLabel} • {pieceScaleW}%×{pieceScaleH}%
                </div>

                {/* CorelDRAW Center Pivot Crosshair (⊗) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-[#0284c7] flex items-center justify-center bg-white/80">
                  <div className="w-1 h-1 rounded-full bg-[#0284c7]" />
                </div>

                {/* Top Rotation Handle */}
                <div
                  data-handle="rotate"
                  data-owner="piece"
                  title="Drag to rotate separated piece"
                  className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
                >
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-[#0284c7] shadow-xs hover:scale-125 transition-transform" />
                  <div className="w-0.5 h-2 bg-[#0284c7]" />
                </div>

                {/* 4 Proportional Corner Handles (nw, ne, sw, se) */}
                <div
                  data-handle="nw"
                  data-owner="piece"
                  title="Proportional Corner Resize (NW)"
                  className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-[#111827] border border-white rounded-none pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="ne"
                  data-owner="piece"
                  title="Proportional Corner Resize (NE)"
                  className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-[#111827] border border-white rounded-none pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="sw"
                  data-owner="piece"
                  title="Proportional Corner Resize (SW)"
                  className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-[#111827] border border-white rounded-none pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="se"
                  data-owner="piece"
                  title="Proportional Corner Resize (SE)"
                  className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-[#111827] border border-white rounded-none pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform"
                />

                {/* 4 CorelDRAW Non-Proportional Midpoint Stretch Handles (n, s, e, w) */}
                <div
                  data-handle="n"
                  data-owner="piece"
                  title="Stretch Piece Height (North)"
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-[#111827] rounded-none pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="s"
                  data-owner="piece"
                  title="Stretch Piece Height (South)"
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-[#111827] rounded-none pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="w"
                  data-owner="piece"
                  title="Stretch Piece Width (West)"
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-[#111827] rounded-none pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="e"
                  data-owner="piece"
                  title="Stretch Piece Width (East)"
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-[#111827] rounded-none pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform"
                />
              </div>
            )}

            {/* Interactive Draggable Layer Selection Box with 8 Handles & Rotate */}
            {layerGizmoStyle && (
              <div
                style={layerGizmoStyle}
                className="absolute border border-dashed border-[#0E6E55] bg-[#10B981]/5 pointer-events-none rounded-md"
              >
                <div
                  data-handle="rotate"
                  data-owner="layer"
                  title="Drag to rotate"
                  className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
                >
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-[#0E6E55] shadow-xs hover:scale-125 transition-transform" />
                  <div className="w-0.5 h-2 bg-[#0E6E55]" />
                </div>

                <div
                  data-handle="nw"
                  data-owner="layer"
                  title="Drag corner to resize"
                  className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#0E6E55] rounded-xs pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="ne"
                  data-owner="layer"
                  title="Drag corner to resize"
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#0E6E55] rounded-xs pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="sw"
                  data-owner="layer"
                  title="Drag corner to resize"
                  className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#0E6E55] rounded-xs pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  data-handle="se"
                  data-owner="layer"
                  title="Drag corner to resize"
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#0E6E55] rounded-xs pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Compact Pill Control Bar with Hand Pan, Up/Down Workspace Scroll & Zoom */}
        <div className="z-10 flex items-center gap-1.5 bg-white border border-gray-200/90 rounded-xl px-3 py-1.5 shadow-2xs text-gray-600">
          <button
            type="button"
            onClick={() => {
              setActiveTool((t) => (t === "pan" ? "move" : "pan"));
              flashFeedback(
                activeTool === "pan"
                  ? "Switched to Select tool"
                  : "Hand Tool active: Drag to move up & down through the workspace"
              );
            }}
            title="Toggle Hand Drag Tool (Or hold Spacebar to drag workspace up & down)"
            className={`p-1 rounded-md transition ${
              activeTool === "pan" || isSpacePanning
                ? "bg-[#0E6E55] text-white shadow-2xs"
                : "hover:text-[#0E6E55] hover:bg-gray-50"
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handlePanVertical(65)}
            title="Move Workspace View Up (Towards Collar)"
            className="p-1 hover:text-[#0E6E55] hover:bg-gray-50 rounded-md transition"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handlePanVertical(-65)}
            title="Move Workspace View Down (Towards Hem)"
            className="p-1 hover:text-[#0E6E55] hover:bg-gray-50 rounded-md transition"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-gray-200 mx-0.5" />
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+20%)"
            className="p-1 hover:text-[#0E6E55] hover:bg-gray-50 rounded-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-20%)"
            className="p-1 hover:text-[#0E6E55] hover:bg-gray-50 rounded-md transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1 hover:text-[#0E6E55] hover:bg-gray-50 rounded-md disabled:opacity-30 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="Click to reset zoom to 100% & center workspace"
            className="text-[11px] font-bold text-gray-800 hover:text-[#0E6E55] px-1.5 py-0.5 rounded-md hover:bg-gray-50 transition"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1 hover:text-[#0E6E55] hover:bg-gray-50 rounded-md disabled:opacity-30 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="Fit & Center Garment to Stage"
            className="p-1 hover:text-[#0E6E55] hover:bg-gray-50 rounded-md transition"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
