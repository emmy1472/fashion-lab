"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { StudioHeader } from "./StudioHeader";
import { AssetsRail, ScratchConfig } from "./AssetsRail";
import {
  CanvasStage,
  StudioCanvasTool,
  PieceTransform,
  VectorShapeNode,
  HumanFitMeasurements,
} from "./CanvasStage";
import { PropertiesInspector } from "./PropertiesInspector";
import { Live3DPanel } from "./Live3DPanel";
import { ScratchDemoModal } from "./ScratchDemoModal";
import { OutfitBuilderModal } from "./OutfitBuilderModal";

// Core studio engines from cloPRO
import {
  garmentList,
  getGarment,
  CATEGORIES,
  DEFAULT_SCRATCH_CONFIG,
} from "@/lib/studio/garments.js";
import { STYLES } from "@/lib/studio/patterns.js";
import { allArt } from "@/lib/studio/graphics.js";
import { renderSVG, render3DTextureSVG } from "@/lib/studio/render.js";
import { exportMockupPNG, exportSVG, exportProject } from "@/lib/studio/export.js";

interface Props {
  initialGarmentId?: string;
}

interface StudioSnapshot {
  garmentId: string;
  scratchConfig: ScratchConfig;
  zoneColors: Record<string, string>;
  pieceTransforms?: Record<string, PieceTransform>;
  layersByView: { front: any[]; back: any[] };
  patternId: string;
  patternScale: number;
}

export function StudioWorkspace({ initialGarmentId = "track-jacket" }: Props) {
  const [selectedGarmentId, setSelectedGarmentId] = useState(initialGarmentId);
  const [scratchConfig, setScratchConfig] = useState<ScratchConfig>(
    () => JSON.parse(JSON.stringify(DEFAULT_SCRATCH_CONFIG)) as ScratchConfig
  );
  const [requestedTool, setRequestedTool] = useState<{
    tool: StudioCanvasTool;
    seq: number;
  } | null>(null);
  const [activeView, setActiveView] = useState<"front" | "back">("front");
  const [patternScale, setPatternScale] = useState(75);
  const [selectedPatternId, setSelectedPatternId] = useState("solid");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("layer-logo");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("body");
  const [pieceTransforms, setPieceTransforms] = useState<
    Record<string, PieceTransform>
  >({});
  const [isWireframe, setIsWireframe] = useState(false);
  const [showPatternGuide, setShowPatternGuide] = useState(true);
  const [is3DPreviewActive, setIs3DPreviewActive] = useState(false);
  const [showPrintGuides, setShowPrintGuides] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isOutfitBuilderOpen, setIsOutfitBuilderOpen] = useState(false);

  // Layers partitioned by view (front and back)
  const [layersByView, setLayersByView] = useState<{ front: any[]; back: any[] }>({
    front: [
      {
        id: "layer-logo",
        name: "Logo",
        kind: "art",
        artId: "gen-shield",
        x: 348,
        y: 268,
        scale: 0.45,
        rotation: 0,
        flipX: false,
        visible: true,
        locked: false,
      },
      {
        id: "layer-brand",
        name: "Front Panel",
        kind: "text",
        text: "FASHION-LAB",
        font: "Montserrat",
        size: 22,
        x: 300,
        y: 355,
        scale: 1,
        rotation: 0,
        flipX: false,
        fill: "#FFFFFF",
        visible: true,
        locked: false,
      },
    ],
    back: [
      {
        id: "layer-back-num",
        name: "Back Panel",
        kind: "text",
        text: "10",
        font: "Anton",
        size: 110,
        x: 300,
        y: 340,
        scale: 1,
        rotation: 0,
        flipX: false,
        fill: "#FFFFFF",
        visible: true,
        locked: false,
      },
    ],
  });

  const [textTypography, setTextTypography] = useState({
    text: "FASHION-LAB",
    fontFamily: "Montserrat",
    fontSize: 22,
  });

  // Active Garment Definition (dynamically constructed when custom-scratch is selected)
  const garment = useMemo(
    () => getGarment(selectedGarmentId, scratchConfig),
    [selectedGarmentId, scratchConfig]
  );

  // Dynamic zones for active view
  const zones = useMemo(() => {
    if (typeof garment.zones === "function") {
      return garment.zones(activeView);
    }
    return [
      { id: "body", label: "Main Body", role: "primary" },
      { id: "collar", label: "Collar & Trim", role: "accent" },
      { id: "sleeveL", label: "Left Sleeve", role: "secondary" },
      { id: "sleeveR", label: "Right Sleeve", role: "secondary" },
    ];
  }, [garment, activeView]);

  // Zone colors dictionary (includes all Garment, Cut & Split Panel defaults)
  const [zoneColors, setZoneColors] = useState<Record<string, string>>({
    body: "#062D24",
    cutL: "#10B981",
    cutR: "#10B981",
    cutTop: "#10B981",
    cutBottom: "#0E6E55",
    panelL: "#10B981",
    panelR: "#10B981",
    yoke: "#0E6E55",
    collar: "#0E6E55",
    hood: "#062D24",
    hoodLining: "#0E6E55",
    drawstring: "#FFFFFF",
    placket: "#0E6E55",
    laces: "#FFFFFF",
    zipper: "#FFFFFF",
    sleeveL: "#0A3A2F",
    sleeveR: "#0A3A2F",
    sleeveStripe: "#10B981",
    shoulderStripe: "#10B981",
    cuffL: "#10B981",
    cuffR: "#10B981",
    pocket: "#0A3A2F",
    waistband: "#062D24",
    hemBand: "#0E6E55",
    stripeL: "#10B981",
    stripeR: "#10B981",
    bodice: "#0E6E55",
    brim: "#0E6E55",
    closure: "#10B981",
    cuff: "#10B981",
    handles: "#0E6E55",
  });

  // Unified 50-Step Undo/Redo History across all studio operations
  const [history, setHistory] = useState<StudioSnapshot[]>(() => [
    {
      garmentId: initialGarmentId,
      scratchConfig: JSON.parse(JSON.stringify(DEFAULT_SCRATCH_CONFIG)),
      zoneColors: {
        body: "#062D24",
        cutL: "#10B981",
        cutR: "#10B981",
        cutTop: "#10B981",
        cutBottom: "#0E6E55",
        panelL: "#10B981",
        panelR: "#10B981",
        collar: "#0E6E55",
        zipper: "#FFFFFF",
        sleeveL: "#0A3A2F",
        sleeveR: "#0A3A2F",
        cuffL: "#10B981",
        cuffR: "#10B981",
        pocket: "#0A3A2F",
        waistband: "#062D24",
        hemBand: "#0E6E55",
        handles: "#0E6E55",
      },
      layersByView: {
        front: [
          {
            id: "layer-logo",
            name: "Logo",
            kind: "art",
            artId: "gen-shield",
            x: 348,
            y: 268,
            scale: 0.45,
            rotation: 0,
            flipX: false,
            visible: true,
            locked: false,
          },
          {
            id: "layer-brand",
            name: "Front Panel",
            kind: "text",
            text: "FASHION-LAB",
            font: "Montserrat",
            size: 22,
            x: 300,
            y: 355,
            scale: 1,
            rotation: 0,
            flipX: false,
            fill: "#FFFFFF",
            visible: true,
            locked: false,
          },
        ],
        back: [
          {
            id: "layer-back-num",
            name: "Back Panel",
            kind: "text",
            text: "10",
            font: "Anton",
            size: 110,
            x: 300,
            y: 340,
            scale: 1,
            rotation: 0,
            flipX: false,
            fill: "#FFFFFF",
            visible: true,
            locked: false,
          },
        ],
      },
      patternId: "solid",
      patternScale: 75,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushSnapshot = useCallback(
    (partial: Partial<StudioSnapshot>) => {
      setHistory((prev) => {
        const nextSnap: StudioSnapshot = {
          garmentId: partial.garmentId ?? selectedGarmentId,
          scratchConfig: partial.scratchConfig ?? scratchConfig,
          zoneColors: partial.zoneColors ?? zoneColors,
          pieceTransforms: partial.pieceTransforms ?? pieceTransforms,
          layersByView: partial.layersByView ?? layersByView,
          patternId: partial.patternId ?? selectedPatternId,
          patternScale: partial.patternScale ?? patternScale,
        };
        const sliced = prev.slice(0, historyIndex + 1);
        sliced.push(JSON.parse(JSON.stringify(nextSnap)));
        if (sliced.length > 50) sliced.shift();
        setHistoryIndex(sliced.length - 1);
        return sliced;
      });
    },
    [
      historyIndex,
      selectedGarmentId,
      scratchConfig,
      zoneColors,
      pieceTransforms,
      layersByView,
      selectedPatternId,
      patternScale,
    ]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const snap = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setSelectedGarmentId(snap.garmentId);
      if (snap.scratchConfig) {
        setScratchConfig(JSON.parse(JSON.stringify(snap.scratchConfig)));
      }
      setZoneColors(snap.zoneColors);
      setPieceTransforms(snap.pieceTransforms || {});
      setLayersByView(JSON.parse(JSON.stringify(snap.layersByView)));
      setSelectedPatternId(snap.patternId);
      setPatternScale(snap.patternScale);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const snap = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setSelectedGarmentId(snap.garmentId);
      if (snap.scratchConfig) {
        setScratchConfig(JSON.parse(JSON.stringify(snap.scratchConfig)));
      }
      setZoneColors(snap.zoneColors);
      setPieceTransforms(snap.pieceTransforms || {});
      setLayersByView(JSON.parse(JSON.stringify(snap.layersByView)));
      setSelectedPatternId(snap.patternId);
      setPatternScale(snap.patternScale);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts for Undo (Ctrl+Z), Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo]);

  // When changing clothes, adapt zone colors and push to history
  const handleSelectGarment = (id: string) => {
    setSelectedGarmentId(id);
    const newGarment = getGarment(id, scratchConfig);
    const updatedZones: Record<string, string> = { ...zoneColors };

    const roleMap: Record<string, string> = {
      primary: zoneColors.body || "#062D24",
      secondary: zoneColors.panelL || zoneColors.sleeveL || "#10B981",
      accent: zoneColors.collar || "#0E6E55",
      tertiary: "#FFFFFF",
    };

    // Modern Baggy Wide-Leg Denim Jeans: apply authentic stone-wash light blue or washed-black palette
    // (still fully recolorable afterwards — every piece stays selectable in 2D & 3D)
    const isDenimJeans = id === "denim-jeans" || id === "jeans" || id === "drawstring-jeans";
    if (isDenimJeans) {
      if (id === "drawstring-jeans") {
        Object.assign(updatedZones, {
          body: "#2A2D34", // Washed Black / Dark Charcoal Denim
          waistband: "#24272D",
          pocket: "#2A2D34",
          placket: "#24272D",
          yoke: "#2A2D34",
          cuff: "#2A2D34",
          collar: "#1E2024",
          drawstring: "#E2E8F0", // Off-white / Cream flat drawcord
        });
      } else {
        Object.assign(updatedZones, {
          body: "#6B9AC4", // Stone-washed vintage light blue denim
          waistband: "#5A88B2",
          pocket: "#6B9AC4",
          placket: "#5A88B2",
          yoke: "#5A88B2",
          cuff: "#6B9AC4",
          collar: "#8B5A2B", // Classic leather brand patch
        });
      }
    }

    if (typeof newGarment.zones === "function") {
      const viewsToCheck = newGarment.views || ["front", "back"];
      for (const v of viewsToCheck) {
        for (const z of newGarment.zones(v)) {
          if (!updatedZones[z.id]) {
            updatedZones[z.id] = roleMap[z.role] || "#062D24";
          }
        }
      }
    }
    setZoneColors(updatedZones);
    setSelectedZoneId("body");
    pushSnapshot({ garmentId: id, zoneColors: updatedZones });
  };

  // Update Scratch Pattern Builder Config
  const handleUpdateScratchConfig = useCallback(
    (nextConfig: ScratchConfig) => {
      setSelectedGarmentId("custom-scratch");
      setScratchConfig(nextConfig);
      const built = getGarment("custom-scratch", nextConfig);
      const updatedZones: Record<string, string> = { ...zoneColors };
      const roleMap: Record<string, string> = {
        primary: zoneColors.body || "#062D24",
        secondary: zoneColors.panelL || "#10B981",
        accent: zoneColors.collar || "#0E6E55",
        tertiary: "#FFFFFF",
      };
      if (typeof built.zones === "function") {
        for (const v of ["front", "back"]) {
          for (const z of built.zones(v)) {
            if (!updatedZones[z.id]) {
              updatedZones[z.id] = roleMap[z.role] || "#10B981";
            }
          }
        }
      }
      setZoneColors(updatedZones);
      pushSnapshot({
        garmentId: "custom-scratch",
        scratchConfig: nextConfig,
        zoneColors: updatedZones,
      });
    },
    [zoneColors, pushSnapshot]
  );

  // Interactive Knife Cut Line Handler from CanvasStage ("cut" tool)
  const handleAddCutLine = useCallback(
    (cut: { x1: number; y1: number; x2: number; y2: number }) => {
      const existing = scratchConfig.customCuts || [];
      const idx = existing.length + 1;
      const newCutId = `cutCustom_${Date.now()}`;
      const cutSwatches = ["#10B981", "#0E6E55", "#F59E0B", "#FFFFFF", "#0284c7"];
      const nextCutColor = cutSwatches[(idx - 1) % cutSwatches.length];

      const nextConfig: ScratchConfig = {
        ...scratchConfig,
        customCuts: [
          ...existing,
          {
            id: newCutId,
            x1: cut.x1,
            y1: cut.y1,
            x2: cut.x2,
            y2: cut.y2,
            joined: false,
          },
        ],
      };

      const nextColors = {
        ...zoneColors,
        [newCutId]: nextCutColor,
      };

      setSelectedGarmentId("custom-scratch");
      setScratchConfig(nextConfig);
      setZoneColors(nextColors);
      setSelectedZoneId(newCutId);
      pushSnapshot({
        garmentId: "custom-scratch",
        scratchConfig: nextConfig,
        zoneColors: nextColors,
      });
    },
    [scratchConfig, zoneColors, pushSnapshot]
  );

  // Join & Sew All Seams Handler
  const handleJoinAllSeams = useCallback(() => {
    const joinedCuts = (scratchConfig.customCuts || []).map((c) => ({
      ...c,
      joined: true,
    }));
    const nextConfig: ScratchConfig = {
      ...scratchConfig,
      baseMode:
        scratchConfig.baseMode === "exploded" ? "block" : scratchConfig.baseMode,
      explodeAmount: 0,
      customCuts: joinedCuts,
    };
    setScratchConfig(nextConfig);
    pushSnapshot({ scratchConfig: nextConfig });
  }, [scratchConfig, pushSnapshot]);

  const handleColorChange = (zoneId: string, color: string) => {
    const nextColors = { ...zoneColors, [zoneId]: color };
    setZoneColors(nextColors);
    pushSnapshot({ zoneColors: nextColors });
  };

  // CorelDRAW Separated Piece Transform (Move, 8-Handle Scale W/H, Rotate, Seam Outline, Contour)
  const handleTransformPiece = useCallback(
    (
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
    ) => {
      if (!zoneId) return;
      setPieceTransforms((prev) => {
        if (delta.reset) {
          const next = { ...prev };
          delete next[zoneId];
          if (delta.commitHistory) {
            setTimeout(() => pushSnapshot({ pieceTransforms: next }), 0);
          }
          return next;
        }

        const cur: PieceTransform = prev[zoneId] || {};
        const nextDx =
          delta.dx !== undefined
            ? Math.max(-220, Math.min(220, Number(((cur.dx || 0) + delta.dx).toFixed(1))))
            : cur.dx || 0;
        const nextDy =
          delta.dy !== undefined
            ? Math.max(-220, Math.min(220, Number(((cur.dy || 0) + delta.dy).toFixed(1))))
            : cur.dy || 0;
        const nextScaleX =
          delta.scaleXAbs !== undefined
            ? Math.max(0.4, Math.min(2.2, Number(delta.scaleXAbs.toFixed(3))))
            : delta.scaleX !== undefined
            ? Math.max(
                0.4,
                Math.min(2.2, Number(((cur.scaleX || 1) * delta.scaleX).toFixed(3)))
              )
            : cur.scaleX || 1;
        const nextScaleY =
          delta.scaleYAbs !== undefined
            ? Math.max(0.4, Math.min(2.2, Number(delta.scaleYAbs.toFixed(3))))
            : delta.scaleY !== undefined
            ? Math.max(
                0.4,
                Math.min(2.2, Number(((cur.scaleY || 1) * delta.scaleY).toFixed(3)))
              )
            : cur.scaleY || 1;
        const nextRot =
          delta.rotationAbs !== undefined
            ? Number(delta.rotationAbs.toFixed(1))
            : delta.rotation !== undefined
            ? Number((((cur.rotation || 0) + delta.rotation) % 360).toFixed(1))
            : cur.rotation || 0;
        const nextOutline =
          delta.outlineColor !== undefined ? delta.outlineColor : cur.outlineColor;
        const nextContour =
          delta.contourOffset !== undefined
            ? delta.contourOffset
            : Boolean(cur.contourOffset);

        const next: Record<string, PieceTransform> = {
          ...prev,
          [zoneId]: {
            dx: nextDx,
            dy: nextDy,
            scaleX: nextScaleX,
            scaleY: nextScaleY,
            rotation: nextRot,
            outlineColor: nextOutline,
            contourOffset: nextContour,
          },
        };

        if (delta.commitHistory) {
          setTimeout(() => pushSnapshot({ pieceTransforms: next }), 0);
        }
        return next;
      });
    },
    [pushSnapshot]
  );

  const handleSelectPattern = (patId: string) => {
    setSelectedPatternId(patId);
    pushSnapshot({ patternId: patId });
  };

  const handlePatternScaleChange = (scale: number) => {
    setPatternScale(scale);
  };

  // Layer Transforms (Move, Scale, Rotate, Flip, CorelDRAW Nodes, PowerClip, Color)
  const handleTransformLayer = useCallback(
    (
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
    ) => {
      setLayersByView((prev) => {
        const list = prev[activeView];
        const targetId = id || selectedLayerId || list[0]?.id;
        if (!targetId) return prev;

        const nextList = list.map((layer) => {
          if (layer.id !== targetId) return layer;
          if (layer.locked) return layer;

          const nextX =
            delta.x !== undefined
              ? Math.max(80, Math.min(520, Number((layer.x + delta.x).toFixed(2))))
              : layer.x;
          const nextY =
            delta.y !== undefined
              ? Math.max(80, Math.min(630, Number((layer.y + delta.y).toFixed(2))))
              : layer.y;
          const nextScale =
            delta.scaleAbs !== undefined
              ? Math.max(0.15, Math.min(3.5, Number(delta.scaleAbs.toFixed(3))))
              : delta.scale !== undefined
              ? Math.max(0.15, Math.min(3.5, Number((layer.scale * delta.scale).toFixed(3))))
              : layer.scale;
          const nextRotation =
            delta.rotationAbs !== undefined
              ? Number(delta.rotationAbs.toFixed(1))
              : delta.rotation !== undefined
              ? Number((((layer.rotation || 0) + delta.rotation) % 360).toFixed(1))
              : layer.rotation || 0;
          const nextFlipX =
            delta.flipX !== undefined ? delta.flipX : Boolean(layer.flipX);

          return {
            ...layer,
            x: nextX,
            y: nextY,
            scale: nextScale,
            rotation: nextRotation,
            flipX: nextFlipX,
            ...(delta.nodes !== undefined ? { nodes: delta.nodes } : {}),
            ...(delta.clipToBody !== undefined ? { clipToBody: delta.clipToBody } : {}),
            ...(delta.symmetry !== undefined ? { symmetry: delta.symmetry } : {}),
            ...(delta.fillPath !== undefined ? { fillPath: delta.fillPath } : {}),
            ...(delta.stroke !== undefined ? { stroke: delta.stroke } : {}),
            ...(delta.outlineColor !== undefined
              ? { outlineColor: delta.outlineColor }
              : {}),
            ...(delta.fill !== undefined ? { fill: delta.fill } : {}),
          };
        });

        const nextByView = { ...prev, [activeView]: nextList };
        if (delta.commitHistory) {
          setTimeout(() => pushSnapshot({ layersByView: nextByView }), 0);
        }
        return nextByView;
      });
    },
    [activeView, selectedLayerId, pushSnapshot]
  );

  // Live Human Clothing Pattern Fit Nodes Handler (Shoulder, Chest, Waist, Hip, Hem)
  const handleUpdateFitFromNodes = useCallback(
    (patch: Partial<HumanFitMeasurements>, commitHistory = false) => {
      setSelectedGarmentId("custom-scratch");
      setScratchConfig((prev) => {
        const nextConfig: ScratchConfig = {
          ...prev,
          ...(patch.shoulderWidth !== undefined
            ? { shoulderWidth: patch.shoulderWidth }
            : {}),
          ...(patch.chestWidth !== undefined ? { chestWidth: patch.chestWidth } : {}),
          ...(patch.waistTaper !== undefined ? { waistWidth: patch.waistTaper } : {}),
          ...(patch.hipWidth !== undefined ? { hipWidth: patch.hipWidth } : {}),
          ...(patch.hemLength !== undefined ? { garmentLength: patch.hemLength } : {}),
        };
        if (commitHistory) {
          setTimeout(
            () =>
              pushSnapshot({
                garmentId: "custom-scratch",
                scratchConfig: nextConfig,
              }),
            0
          );
        }
        return nextConfig;
      });
    },
    [pushSnapshot]
  );

  // Add Freehand CAD Sketch Stroke / CorelDRAW Editable Vector Shape / Join Stitch Layer (kind: "path")
  const handleAddSketchLayer = useCallback(
    (sketch: {
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
    }) => {
      const sketchCount =
        layersByView[activeView].filter((l) => l.kind === "path").length + 1;
      const labelPrefix = sketch.closedPanel
        ? "Fabric Shape"
        : sketch.stitchStyle === "join"
        ? "Joined Seam"
        : "CAD Sketch";
      const newLayer = {
        id: `layer-sketch-${Date.now()}`,
        name: sketch.name || `${labelPrefix} #${sketchCount}`,
        kind: "path",
        d: sketch.d,
        mirrorD: sketch.mirrorD || "",
        nodes: sketch.nodes,
        symmetry: Boolean(sketch.symmetry),
        clipToBody: sketch.clipToBody !== false,
        stroke: sketch.stroke,
        strokeWidth: sketch.strokeWidth,
        dash: sketch.dash || "",
        closedPanel: Boolean(sketch.closedPanel),
        fillPath: sketch.fillPath || "none",
        stitchStyle: sketch.stitchStyle || "",
        x: 300,
        y: 350,
        scale: 1,
        rotation: 0,
        flipX: false,
        visible: true,
        locked: false,
      };
      const nextByView = {
        ...layersByView,
        [activeView]: [...layersByView[activeView], newLayer],
      };
      setLayersByView(nextByView);
      setSelectedLayerId(newLayer.id);
      pushSnapshot({ layersByView: nextByView });
    },
    [activeView, layersByView, pushSnapshot]
  );

  // Add Graphic Emblem
  const handleAddEmblem = (artId: string) => {
    const newLayer = {
      id: `layer-${Date.now()}`,
      name: `Emblem (${artId.replace("gen-", "")})`,
      kind: "art",
      artId,
      x: 300,
      y: 310,
      scale: 0.75,
      rotation: 0,
      flipX: false,
      visible: true,
      locked: false,
    };
    const nextByView = {
      ...layersByView,
      [activeView]: [...layersByView[activeView], newLayer],
    };
    setLayersByView(nextByView);
    setSelectedLayerId(newLayer.id);
    pushSnapshot({ layersByView: nextByView });
  };

  // Add Uploaded Logo Image
  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const newLayer = {
        id: `layer-img-${Date.now()}`,
        name: file.name.slice(0, 15),
        kind: "image",
        src,
        x: 300,
        y: 330,
        scale: 1,
        rotation: 0,
        flipX: false,
        visible: true,
        locked: false,
      };
      const nextByView = {
        ...layersByView,
        [activeView]: [...layersByView[activeView], newLayer],
      };
      setLayersByView(nextByView);
      setSelectedLayerId(newLayer.id);
      pushSnapshot({ layersByView: nextByView });
    };
    reader.readAsDataURL(file);
  };

  // Remove Layer
  const handleRemoveLayer = (id: string) => {
    const nextByView = {
      ...layersByView,
      [activeView]: layersByView[activeView].filter((l) => l.id !== id),
    };
    setLayersByView(nextByView);
    if (selectedLayerId === id) {
      setSelectedLayerId(nextByView[activeView][0]?.id || null);
    }
    pushSnapshot({ layersByView: nextByView });
  };

  // Duplicate Layer
  const handleDuplicateLayer = (id: string) => {
    const list = layersByView[activeView];
    const src = list.find((l) => l.id === id) || list[0];
    if (!src) return;
    const copy = {
      ...src,
      id: `layer-copy-${Date.now()}`,
      name: `${src.name} Copy`,
      x: Math.min(480, (src.x ?? 300) + 24),
      y: Math.min(580, (src.y ?? 350) + 24),
      locked: false,
    };
    const nextByView = {
      ...layersByView,
      [activeView]: [...list, copy],
    };
    setLayersByView(nextByView);
    setSelectedLayerId(copy.id);
    pushSnapshot({ layersByView: nextByView });
  };

  // Reorder Layer (Bring Forward / Send Backward)
  const handleReorderLayer = (id: string, dir: "up" | "down") => {
    const list = [...layersByView[activeView]];
    const idx = list.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const targetIdx = dir === "up" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [item] = list.splice(idx, 1);
    list.splice(targetIdx, 0, item);
    const nextByView = { ...layersByView, [activeView]: list };
    setLayersByView(nextByView);
    pushSnapshot({ layersByView: nextByView });
  };

  // Toggle Layer Visibility
  const handleToggleLayerVisibility = (id: string) => {
    const nextByView = {
      ...layersByView,
      [activeView]: layersByView[activeView].map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    };
    setLayersByView(nextByView);
    pushSnapshot({ layersByView: nextByView });
  };

  // Toggle Layer Lock
  const handleToggleLayerLock = (id: string) => {
    const nextByView = {
      ...layersByView,
      [activeView]: layersByView[activeView].map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l
      ),
    };
    setLayersByView(nextByView);
  };

  // Apply Typography
  const handleUpdateTypography = (typo: { text: string; fontFamily: string; fontSize: number }) => {
    setTextTypography(typo);
    const list = layersByView[activeView];
    const hasTextLayer = list.some((l) => l.kind === "text");
    let nextList: any[];
    if (hasTextLayer) {
      nextList = list.map((l) =>
        l.kind === "text"
          ? {
              ...l,
              text: typo.text,
              font: typo.fontFamily,
              size: typo.fontSize,
              visible: true,
            }
          : l
      );
    } else {
      const newLayer = {
        id: `layer-text-${Date.now()}`,
        name: typo.text || "Custom Text",
        kind: "text",
        text: typo.text,
        font: typo.fontFamily,
        size: typo.fontSize,
        x: 300,
        y: 360,
        scale: 1,
        rotation: 0,
        flipX: false,
        fill: "#FFFFFF",
        visible: true,
        locked: false,
      };
      nextList = [...list, newLayer];
      setSelectedLayerId(newLayer.id);
    }
    const nextByView = { ...layersByView, [activeView]: nextList };
    setLayersByView(nextByView);
    pushSnapshot({ layersByView: nextByView });
  };

  // Generate cloPRO project object structure with active pattern scale & scratchConfig
  const buildProjectData = useCallback(
    (view: "front" | "back") => {
      const renderedZones: Record<string, any> = {};
      const viewZones = typeof garment.zones === "function" ? garment.zones(view) : [];
      const scaleRatio = patternScale / 75;

      viewZones.forEach((z: any) => {
        renderedZones[z.id] = {
          style: z.id === "body" ? selectedPatternId || "solid" : "solid",
          colors: [zoneColors[z.id] || "#062D24", zoneColors.panelL || "#10B981", "#FFFFFF"],
          params: {
            scale: Math.round(60 * scaleRatio),
            width: Math.round(24 * scaleRatio),
            gap: Math.round(24 * scaleRatio),
            size: Math.round(75 * scaleRatio),
          },
        };
      });

      return {
        name:
          selectedGarmentId === "custom-scratch"
            ? "Custom Scratch Pattern"
            : "Urban Jacket Collection",
        garment: selectedGarmentId,
        scratchConfig,
        pieceTransforms,
        wireframe: isWireframe,
        view,
        zones: renderedZones,
        layers: layersByView,
        palette: ["#062D24", "#10B981", "#0E6E55", "#FFFFFF"],
      };
    },
    [
      garment,
      selectedGarmentId,
      scratchConfig,
      pieceTransforms,
      isWireframe,
      zoneColors,
      selectedPatternId,
      patternScale,
      layersByView,
    ]
  );

  // Dynamic Front & Back SVG generation
  const frontSvgMarkup = useMemo(() => {
    try {
      return renderSVG(buildProjectData("front"), {
        view: "front",
        guides: showPrintGuides && activeView === "front",
        patternGuide: showPatternGuide,
        selected: selectedLayerId,
        width: 600,
        height: 700,
      });
    } catch {
      return `<svg viewBox="0 0 600 700" width="600" height="700"></svg>`;
    }
  }, [buildProjectData, showPrintGuides, showPatternGuide, activeView, selectedLayerId]);

  const backSvgMarkup = useMemo(() => {
    try {
      return renderSVG(buildProjectData("back"), {
        view: "back",
        guides: showPrintGuides && activeView === "back",
        patternGuide: showPatternGuide,
        selected: selectedLayerId,
        width: 600,
        height: 700,
      });
    } catch {
      return `<svg viewBox="0 0 600 700" width="600" height="700"></svg>`;
    }
  }, [buildProjectData, showPrintGuides, showPatternGuide, activeView, selectedLayerId]);

  // Current SVG rendered in 2D stage
  const currentSvgMarkup = activeView === "front" ? frontSvgMarkup : backSvgMarkup;

  // Borderless 3D UV Texture SVGs (mapped to 3D torso UV islands without 2D sleeve/outline bleed)
  const front3DTextureSvg = useMemo(() => {
    try {
      return render3DTextureSVG(buildProjectData("front"), { view: "front" });
    } catch {
      return frontSvgMarkup;
    }
  }, [buildProjectData, frontSvgMarkup]);

  const back3DTextureSvg = useMemo(() => {
    try {
      return render3DTextureSVG(buildProjectData("back"), { view: "back" });
    } catch {
      return backSvgMarkup;
    }
  }, [buildProjectData, backSvgMarkup]);

  // Real Export Actions
  const handleExport = async (format: "png" | "svg" | "pdf" | "zip") => {
    const proj = buildProjectData(activeView);
    try {
      if (format === "svg") {
        await exportSVG(proj, activeView);
      } else if (format === "png") {
        await exportMockupPNG(proj, activeView, 3);
      } else if (format === "pdf" || format === "zip") {
        exportProject(proj);
      }
    } catch (err: any) {
      alert(`Exporting ${format.toUpperCase()}: ${err.message || "Completed"}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8F9FA] overflow-hidden">
      {/* Studio Header matching mockup */}
      <StudioHeader
        projectName={
          selectedGarmentId === "custom-scratch"
            ? "Custom Scratch Design"
            : "Urban Jacket Collection"
        }
        onExport={handleExport}
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onOpenOutfitBuilder={() => setIsOutfitBuilderOpen(true)}
      />

      {/* Structured 4-Column Workspace Card Container matching mockup */}
      <div className="flex-1 flex overflow-hidden min-h-0 mx-4 mb-4 mt-3 rounded-2xl border border-gray-200/80 bg-white shadow-2xs">
        {/* Column 1: Assets & Catalog Rail */}
        <AssetsRail
          garments={garmentList()}
          categories={CATEGORIES}
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={handleSelectGarment}
          scratchConfig={scratchConfig}
          onUpdateScratchConfig={handleUpdateScratchConfig}
          onActivateCanvasTool={(tool) =>
            setRequestedTool((prev) => ({
              tool,
              seq: (prev?.seq || 0) + 1,
            }))
          }
          onOpenDemo={() => setIsDemoModalOpen(true)}
          patterns={STYLES}
          selectedPatternId={selectedPatternId}
          onSelectPattern={handleSelectPattern}
          emblems={allArt()}
          onAddEmblem={handleAddEmblem}
          onUploadImage={handleUploadImage}
        />

        {/* Column 2: 2D Interactive Canvas Stage (hidden only when Full 3D Preview is active) */}
        {!is3DPreviewActive && (
          <CanvasStage
            svgMarkup={currentSvgMarkup}
            frontSvgMarkup={frontSvgMarkup}
            backSvgMarkup={backSvgMarkup}
            activeView={activeView}
            onToggleView={setActiveView}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            layers={layersByView[activeView]}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onTransformLayer={handleTransformLayer}
            pieceTransforms={pieceTransforms}
            onTransformPiece={handleTransformPiece}
            zoneColors={zoneColors}
            onColorChange={handleColorChange}
            isWireframe={isWireframe}
            onToggleWireframe={() => setIsWireframe((w) => !w)}
            showPatternGuide={showPatternGuide}
            onTogglePatternGuide={() => setShowPatternGuide((p) => !p)}
            fitMeasurements={{
              shoulderWidth: scratchConfig.shoulderWidth || 0,
              chestWidth: scratchConfig.chestWidth || 0,
              waistTaper: scratchConfig.waistWidth || 0,
              hipWidth: scratchConfig.hipWidth || 0,
              hemLength: scratchConfig.garmentLength || 0,
            }}
            onUpdateFitFromNodes={handleUpdateFitFromNodes}
            onAddSketchLayer={handleAddSketchLayer}
            onAddCutLine={handleAddCutLine}
            onSelectCutPreset={(mode) =>
              handleUpdateScratchConfig({
                ...scratchConfig,
                cutSplitMode: mode,
              })
            }
            activeCutPreset={scratchConfig.cutSplitMode || "none"}
            explodeAmount={scratchConfig.explodeAmount || 0}
            onChangeExplodeAmount={(val) =>
              handleUpdateScratchConfig({
                ...scratchConfig,
                explodeAmount: val,
                baseMode: val > 10 ? "exploded" : "block",
              })
            }
            onJoinAllSeams={handleJoinAllSeams}
            requestedTool={requestedTool}
            onDuplicateLayer={handleDuplicateLayer}
            onRemoveLayer={handleRemoveLayer}
            onReorderLayer={handleReorderLayer}
            onToggleLayerVisibility={handleToggleLayerVisibility}
            onToggleLayerLock={handleToggleLayerLock}
            onAddQuickText={() =>
              handleUpdateTypography({
                text: "NEW TEXT",
                fontFamily: "Montserrat",
                fontSize: 28,
              })
            }
            onAddQuickEmblem={() => handleAddEmblem("gen-shield")}
            selectedZoneId={selectedZoneId}
            zones={zones}
            onSelectZone={(zoneId) => setSelectedZoneId(zoneId)}
            showPrintGuides={showPrintGuides}
            onTogglePrintGuides={() => setShowPrintGuides((g) => !g)}
            is3DPreviewActive={is3DPreviewActive}
            onToggle3DPreview={setIs3DPreviewActive}
          />
        )}

        {/* Column 3: Properties & Layer Inspector */}
        <PropertiesInspector
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          zoneColors={zoneColors}
          onColorChange={handleColorChange}
          pieceTransforms={pieceTransforms}
          onTransformPiece={handleTransformPiece}
          patternScale={patternScale}
          onPatternScaleChange={handlePatternScaleChange}
          layers={layersByView[activeView]}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onRemoveLayer={handleRemoveLayer}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleLayerLock={handleToggleLayerLock}
          textTypography={textTypography}
          onUpdateTypography={handleUpdateTypography}
        />

        {/* Column 4: Synchronous Live 3D Viewport with Real-time UV Projection & Parametric Morphing */}
        <Live3DPanel
          garmentId={selectedGarmentId}
          garmentCategory={garment.category}
          garmentName={garment.name}
          frontSvgMarkup={front3DTextureSvg}
          backSvgMarkup={back3DTextureSvg}
          zoneColors={zoneColors}
          scratchConfig={scratchConfig}
          expanded={is3DPreviewActive}
          onExitExpanded={() => setIs3DPreviewActive(false)}
        />
      </div>

      {/* Video Walkthrough Modal for "Design from Scratch" */}
      <ScratchDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onTryModule={(mod) => {
          setSelectedGarmentId("custom-scratch");
          if (mod.scratchPatch) {
            setScratchConfig((prev) => ({
              ...prev,
              ...mod.scratchPatch,
            }));
          }
          if (mod.patternId) {
            setSelectedPatternId(mod.patternId);
          }
          setRequestedTool((prev) => ({
            tool: mod.tool,
            seq: (prev?.seq || 0) + 1,
          }));
        }}
        onRunLiveOnCanvas={() => {
          // Step 1: Select custom-scratch base shape
          setSelectedGarmentId("custom-scratch");
          setScratchConfig((prev) => ({
            ...prev,
            baseMode: "block",
            neckType: "stand",
            sleeveType: "long",
            cutSplitMode: "none",
            explodeAmount: 0,
          }));
          // Step 2 (after 900ms): Slice into V-Chest Cut panels
          setTimeout(() => {
            setScratchConfig((prev) => ({
              ...prev,
              cutSplitMode: "chevron-v",
              cutY: 325,
            }));
          }, 900);
          // Step 3 (after 2000ms): Separate into exploded flat pattern pieces with sewing threads
          setTimeout(() => {
            setScratchConfig((prev) => ({
              ...prev,
              baseMode: "exploded",
              explodeAmount: 85,
            }));
          }, 2000);
          // Step 4 (after 3600ms): Sew & Join all pieces together into the finished garment
          setTimeout(() => {
            setScratchConfig((prev) => ({
              ...prev,
              baseMode: "block",
              explodeAmount: 0,
            }));
          }, 3600);
        }}
      />

      {/* Outfit Builder / Mannequin Fit Check Modal */}
      <OutfitBuilderModal
        isOpen={isOutfitBuilderOpen}
        onClose={() => setIsOutfitBuilderOpen(false)}
        currentGarmentId={selectedGarmentId}
        currentZoneColors={zoneColors}
        currentScratchConfig={scratchConfig}
        currentFrontSvg={front3DTextureSvg}
        currentBackSvg={back3DTextureSvg}
      />
    </div>
  );
}
