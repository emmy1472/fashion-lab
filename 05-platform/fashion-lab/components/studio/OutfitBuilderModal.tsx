"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  X,
  Shirt,
  Scissors,
  RotateCcw,
  Sun,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Plus,
  Layers,
  User,
} from "lucide-react";
import {
  createMannequinPedestal,
  buildGarment3DModel,
  ScratchConfig3D,
} from "./garment3DBuilder";
import { getGarment } from "@/lib/studio/garments.js";
import { render3DTextureSVG } from "@/lib/studio/render.js";

// ─── Garment Catalog (tops + bottoms shown in outfit picker) ──────────────────
const TOPS_CATALOG = [
  { id: "track-jacket", name: "Track Jacket", emoji: "🧥" },
  { id: "hoodie", name: "Hoodie", emoji: "👕" },
  { id: "tee", name: "T-Shirt", emoji: "👕" },
  { id: "zip-hoodie", name: "Zip Hoodie", emoji: "🧥" },
  { id: "crewneck", name: "Crewneck", emoji: "👕" },
  { id: "polo", name: "Polo", emoji: "👕" },
  { id: "blazer", name: "Coat/Blazer", emoji: "🧥" },
  { id: "soccer-jersey", name: "Jersey", emoji: "🏅" },
];
const BOTTOMS_CATALOG = [
  { id: "denim-jeans", name: "Wide-Leg Jeans", emoji: "👖" },
  { id: "drawstring-jeans", name: "Drawstring Jeans", emoji: "👖" },
  { id: "joggers", name: "Joggers", emoji: "👖" },
];

// ─── Default zone colours per garment kind ────────────────────────────────────
function defaultZones(garmentId: string): Record<string, string> {
  if (garmentId === "denim-jeans" || garmentId === "jeans") {
    return { body: "#6B9AC4", waistband: "#5A88B2", pocket: "#6B9AC4", placket: "#5A88B2", yoke: "#5A88B2", cuff: "#6B9AC4", collar: "#8B5A2B" };
  }
  if (garmentId === "drawstring-jeans") {
    return { body: "#2A2D34", waistband: "#24272D", pocket: "#2A2D34", placket: "#24272D", yoke: "#2A2D34", cuff: "#2A2D34", collar: "#1E2024", drawstring: "#E2E8F0" };
  }
  if (garmentId === "joggers") {
    return { body: "#1C1C1C", waistband: "#333", cuff: "#1C1C1C", pocket: "#1C1C1C" };
  }
  if (garmentId === "hoodie" || garmentId === "zip-hoodie") {
    return { body: "#062D24", collar: "#0E6E55", hood: "#0A5040", cuffL: "#0E6E55", cuffR: "#0E6E55", waistband: "#0E6E55" };
  }
  if (garmentId === "tee") {
    return { body: "#062D24", collar: "#0A5040", sleeveL: "#062D24", sleeveR: "#062D24" };
  }
  if (garmentId === "track-jacket") {
    return { body: "#062D24", collar: "#0E6E55", panelL: "#0E6E55", panelR: "#0E6E55", sleeveL: "#062D24", sleeveR: "#062D24" };
  }
  return { body: "#062D24", collar: "#0E6E55" };
}

// ─── Apply zone colors to a mesh group (mirrors Live3DPanel effect 5) ─────────
function applyZoneColorsToGroup(
  group: THREE.Group,
  zoneColors: Record<string, string>
) {
  const primaryColor = zoneColors.body || "#062D24";
  const collarColor = zoneColors.collar || zoneColors.waistband || zoneColors.hemBand || "#0E6E55";
  const hoodColor = zoneColors.hood || collarColor;
  const sleeveLColor = zoneColors.sleeveL || primaryColor;
  const sleeveRColor = zoneColors.sleeveR || sleeveLColor;
  const cuffLColor = zoneColors.cuffL || sleeveLColor;
  const cuffRColor = zoneColors.cuffR || sleeveRColor;
  const sleeveStripeColor = zoneColors.sleeveStripe || zoneColors.shoulderStripe || collarColor || "#FFFFFF";
  const pocketColor = zoneColors.pocket || primaryColor;
  const placketColor = zoneColors.placket || collarColor || "#10B981";
  const drawstringColor = zoneColors.drawstring || zoneColors.laces || "#FFFFFF";
  const zipperColor = zoneColors.zipper || "#FFFFFF";
  const waistbandColor = zoneColors.waistband || zoneColors.hemBand || collarColor || primaryColor;
  const yokeColor = zoneColors.yoke || waistbandColor || primaryColor;
  const bottomCuffColor = zoneColors.cuff || zoneColors.cuffL || collarColor || primaryColor;

  group.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      if (!(mat instanceof THREE.MeshStandardMaterial)) return;
      const n = mat.name;
      if (n === "mat_collar") mat.color.set(collarColor);
      else if (n === "mat_hood") mat.color.set(hoodColor);
      else if (n === "mat_sleeve_l" || n === "mat_sleeve") mat.color.set(sleeveLColor);
      else if (n === "mat_sleeve_r") mat.color.set(sleeveRColor);
      else if (n === "mat_cuff_l" || n === "mat_trim") mat.color.set(cuffLColor);
      else if (n === "mat_cuff_r") mat.color.set(cuffRColor);
      else if (n === "mat_sleeve_stripe") mat.color.set(sleeveStripeColor);
      else if (n === "mat_pocket") mat.color.set(pocketColor);
      else if (n === "mat_placket") mat.color.set(placketColor);
      else if (n === "mat_drawstring") mat.color.set(drawstringColor);
      else if (n === "mat_waistband") mat.color.set(waistbandColor);
      else if (n === "mat_yoke") mat.color.set(yokeColor);
      else if (n === "mat_cuff") mat.color.set(bottomCuffColor);
      else if (n === "mat_zipper") mat.color.set(zipperColor);
      else if (n === "mat_inside_lining") mat.color.set(primaryColor).multiplyScalar(0.62);
      mat.needsUpdate = true;
    });
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface OutfitBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass the currently designed garment so it appears pre-slotted */
  currentGarmentId: string;
  currentZoneColors: Record<string, string>;
  currentScratchConfig?: ScratchConfig3D;
  currentFrontSvg: string;
  currentBackSvg: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function OutfitBuilderModal({
  isOpen,
  onClose,
  currentGarmentId,
  currentZoneColors,
  currentScratchConfig,
  currentFrontSvg,
  currentBackSvg,
}: OutfitBuilderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Two mesh groups — one top, one bottom
  const topGroupRef = useRef<THREE.Group | null>(null);
  const bottomGroupRef = useRef<THREE.Group | null>(null);
  const pedestalRef = useRef<THREE.Group | null>(null);
  const isRotatingRef = useRef(true);

  // Offscreen canvases / textures (top garment)
  const topFrontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const topBackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const topFrontTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const topBackTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Offscreen canvases / textures (bottom garment)
  const botFrontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const botBackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const botFrontTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const botBackTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const [gltfShirtModel, setGltfShirtModel] = useState<THREE.Group | null>(null);
  const [isRotating, setIsRotating] = useState(true);

  // Outfit slot state
  const currentIsTop = (() => {
    try {
      const g = getGarment(currentGarmentId, {});
      return g.kind === "top" || g.kind === "outerwear";
    } catch {
      return true;
    }
  })();

  const [topId, setTopId] = useState<string>(currentIsTop ? currentGarmentId : "hoodie");
  const [bottomId, setBottomId] = useState<string>(!currentIsTop ? currentGarmentId : "denim-jeans");
  const [topColors, setTopColors] = useState<Record<string, string>>(
    currentIsTop ? currentZoneColors : defaultZones("hoodie")
  );
  const [bottomColors, setBottomColors] = useState<Record<string, string>>(
    !currentIsTop ? currentZoneColors : defaultZones("denim-jeans")
  );
  const [editingSlot, setEditingSlot] = useState<"top" | "bottom">("top");
  const [showTopPicker, setShowTopPicker] = useState(false);
  const [showBottomPicker, setShowBottomPicker] = useState(false);
  const [fitNote, setFitNote] = useState<string | null>(null);

  // ── Init Three.js scene (runs once when modal opens) ────────────────────────
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const w = containerRef.current.clientWidth || 560;
    const h = containerRef.current.clientHeight || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F0F2F5");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 0, 3.4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // OrbitControls — full 360
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.5;
    controls.maxDistance = 6.0;
    controls.maxPolarAngle = Math.PI / 1.6;
    controls.target.set(0, -0.15, 0); // center between head and knees
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd0d5e0, 0.9));
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xf0f8ff, 1.2);
    fill.position.set(-4, 2, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(0, 4, -4);
    scene.add(rim);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.10 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.56;
    floor.receiveShadow = true;
    scene.add(floor);

    // Pedestal (full-body mannequin)
    const pedestal = createMannequinPedestal("Tops");
    pedestalRef.current = pedestal;
    scene.add(pedestal);

    // Offscreen canvases — top garment
    const mkCanvas = () => {
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 1024;
      return c;
    };
    const mkTex = (canvas: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(canvas);
      t.flipY = false;
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };

    topFrontCanvasRef.current = mkCanvas();
    topBackCanvasRef.current = mkCanvas();
    topFrontTextureRef.current = mkTex(topFrontCanvasRef.current);
    topBackTextureRef.current = mkTex(topBackCanvasRef.current);

    botFrontCanvasRef.current = mkCanvas();
    botBackCanvasRef.current = mkCanvas();
    botFrontTextureRef.current = mkTex(botFrontCanvasRef.current);
    botBackTextureRef.current = mkTex(botBackCanvasRef.current);

    // Load GLB
    new GLTFLoader().load(
      "/models/t_shirt_mod.glb",
      (gltf) => setGltfShirtModel(gltf.scene),
      undefined,
      (err) => console.warn("GLB:", err)
    );

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      if (isRotatingRef.current) {
        if (topGroupRef.current) topGroupRef.current.rotation.y += 0.004;
        if (bottomGroupRef.current) bottomGroupRef.current.rotation.y += 0.004;
        if (pedestalRef.current) pedestalRef.current.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const rw = containerRef.current.clientWidth || 560;
      const rh = containerRef.current.clientHeight || 640;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      controls.dispose();
      sceneRef.current = null;
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Rebuild Top mesh whenever topId changes ────────────────────────────────
  const buildTopMesh = useCallback(() => {
    if (!sceneRef.current || !topFrontTextureRef.current) return;
    if (topGroupRef.current) {
      sceneRef.current.remove(topGroupRef.current);
      topGroupRef.current.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).geometry.dispose();
      });
      topGroupRef.current = null;
    }
    const group = buildGarment3DModel({
      garmentId: topId,
      category: "Tops",
      frontTexture: topFrontTextureRef.current,
      backTexture: topBackTextureRef.current,
      zoneColors: topColors,
      gltfShirtModel,
      scratchConfig: topId === currentGarmentId ? currentScratchConfig : undefined,
    });
    topGroupRef.current = group;
    sceneRef.current.add(group);
    applyZoneColorsToGroup(group, topColors);
  }, [topId, gltfShirtModel, topColors, currentGarmentId, currentScratchConfig]);

  // ── Rebuild Bottom mesh whenever bottomId changes ─────────────────────────
  const buildBottomMesh = useCallback(() => {
    if (!sceneRef.current || !botFrontTextureRef.current) return;
    if (bottomGroupRef.current) {
      sceneRef.current.remove(bottomGroupRef.current);
      bottomGroupRef.current.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).geometry.dispose();
      });
      bottomGroupRef.current = null;
    }
    const group = buildGarment3DModel({
      garmentId: bottomId,
      category: "Bottoms",
      frontTexture: botFrontTextureRef.current,
      backTexture: botBackTextureRef.current,
      zoneColors: bottomColors,
      gltfShirtModel,
      scratchConfig: bottomId === currentGarmentId ? currentScratchConfig : undefined,
    });
    bottomGroupRef.current = group;
    sceneRef.current.add(group);
    applyZoneColorsToGroup(group, bottomColors);
  }, [bottomId, gltfShirtModel, bottomColors, currentGarmentId, currentScratchConfig]);

  useEffect(() => {
    if (isOpen && sceneRef.current) buildTopMesh();
  }, [isOpen, buildTopMesh]);

  useEffect(() => {
    if (isOpen && sceneRef.current) buildBottomMesh();
  }, [isOpen, buildBottomMesh]);

  // ── Sync top texture from current design's SVG (if current is top) ─────────
  useEffect(() => {
    if (!isOpen || !topFrontCanvasRef.current || !topFrontTextureRef.current) return;
    if (topId !== currentGarmentId) return;

    const paint = (svgMarkup: string, canvas: HTMLCanvasElement, tex: THREE.CanvasTexture, bg: string) => {
      const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        tex.needsUpdate = true;
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    };

    const bg = topColors.body || "#062D24";
    if (topFrontCanvasRef.current && topFrontTextureRef.current)
      paint(currentFrontSvg, topFrontCanvasRef.current, topFrontTextureRef.current, bg);
    if (topBackCanvasRef.current && topBackTextureRef.current)
      paint(currentBackSvg, topBackCanvasRef.current, topBackTextureRef.current, bg);
  }, [isOpen, topId, currentGarmentId, currentFrontSvg, currentBackSvg, topColors.body]);

  // ── Sync bottom texture from current design's SVG (if current is bottom) ───
  useEffect(() => {
    if (!isOpen || !botFrontCanvasRef.current || !botFrontTextureRef.current) return;
    if (bottomId !== currentGarmentId) return;

    const paint = (svgMarkup: string, canvas: HTMLCanvasElement, tex: THREE.CanvasTexture, bg: string) => {
      const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        tex.needsUpdate = true;
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    };

    const bg = bottomColors.body || "#062D24";
    if (botFrontCanvasRef.current && botFrontTextureRef.current)
      paint(currentFrontSvg, botFrontCanvasRef.current, botFrontTextureRef.current, bg);
    if (botBackCanvasRef.current && botBackTextureRef.current)
      paint(currentBackSvg, botBackCanvasRef.current, botBackTextureRef.current, bg);
  }, [isOpen, bottomId, currentGarmentId, currentFrontSvg, currentBackSvg, bottomColors.body]);

  // ── Live-recolor top zone colors ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !topGroupRef.current) return;
    applyZoneColorsToGroup(topGroupRef.current, topColors);
  }, [isOpen, topColors]);

  // ── Live-recolor bottom zone colors ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !bottomGroupRef.current) return;
    applyZoneColorsToGroup(bottomGroupRef.current, bottomColors);
  }, [isOpen, bottomColors]);

  // ── Keep isRotating ref in sync ───────────────────────────────────────────
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // ── Fit check heuristic ────────────────────────────────────────────────────
  useEffect(() => {
    const notes: string[] = [];
    const topBodyColor = (topColors.body || "#000").toLowerCase();
    const botBodyColor = (bottomColors.body || "#000").toLowerCase();
    if (topBodyColor === botBodyColor) notes.push("Matching monochrome — clean tonal look ✓");
    if ((topId === "track-jacket" || topId === "zip-hoodie") && bottomId === "denim-jeans") {
      notes.push("Classic streetwear pairing ✓");
    }
    if (topId === "blazer" && bottomId === "denim-jeans") {
      notes.push("Smart-casual contrast — works well ✓");
    }
    if (topId === "hoodie" && bottomId === "joggers") {
      notes.push("Comfortable athleisure combo ✓");
    }
    setFitNote(notes.length > 0 ? notes[notes.length - 1] : null);
  }, [topId, bottomId, topColors.body, bottomColors.body]);

  // ── Reset camera ──────────────────────────────────────────────────────────
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 0, 3.4);
    controlsRef.current.target.set(0, -0.15, 0);
    controlsRef.current.update();
    setIsRotating(true);
  };

  // ── Color editor for active slot ─────────────────────────────────────────
  const activeColors = editingSlot === "top" ? topColors : bottomColors;
  const setActiveColors = editingSlot === "top" ? setTopColors : setBottomColors;

  const COLOR_SWATCHES = [
    "#062D24","#0E6E55","#10B981","#34D399","#FFFFFF","#000000",
    "#1D4ED8","#6B9AC4","#2A2D34","#8B5A2B","#F59E0B","#EF4444",
    "#EC4899","#7C3AED","#64748B","#CBD5E1","#FDE68A","#FCA5A5",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[820px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="h-14 bg-gradient-to-r from-[#062D24] to-[#0E6E55] flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Outfit Builder</h2>
              <p className="text-[10px] text-emerald-200">Combine garments on a mannequin to check fit &amp; style</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* Left panel — slot selectors + color editor */}
          <div className="w-64 shrink-0 border-r border-gray-100 flex flex-col overflow-y-auto bg-[#F9FAFB]">

            {/* Slot tabs */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setEditingSlot("top")}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  editingSlot === "top"
                    ? "text-[#0E6E55] border-b-2 border-[#0E6E55] bg-white"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <Shirt className="w-3.5 h-3.5" /> Top
              </button>
              <button
                type="button"
                onClick={() => setEditingSlot("bottom")}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  editingSlot === "bottom"
                    ? "text-[#0E6E55] border-b-2 border-[#0E6E55] bg-white"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <Scissors className="w-3.5 h-3.5" /> Bottom
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1">

              {/* Garment picker */}
              {editingSlot === "top" ? (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Top Garment</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowTopPicker(!showTopPicker); setShowBottomPicker(false); }}
                      className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 hover:border-emerald-400 transition"
                    >
                      <span>{TOPS_CATALOG.find(g => g.id === topId)?.emoji} {TOPS_CATALOG.find(g => g.id === topId)?.name || topId}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    {showTopPicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 max-h-52 overflow-y-auto">
                        {TOPS_CATALOG.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              setTopId(g.id);
                              if (g.id !== currentGarmentId) setTopColors(defaultZones(g.id));
                              setShowTopPicker(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-emerald-50 transition ${topId === g.id ? "font-bold text-[#0E6E55]" : "text-gray-700"}`}
                          >
                            <span>{g.emoji}</span>
                            <span>{g.name}</span>
                            {topId === g.id && <CheckCircle2 className="w-3 h-3 ml-auto text-[#0E6E55]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Bottom Garment</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowBottomPicker(!showBottomPicker); setShowTopPicker(false); }}
                      className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 hover:border-emerald-400 transition"
                    >
                      <span>{BOTTOMS_CATALOG.find(g => g.id === bottomId)?.emoji} {BOTTOMS_CATALOG.find(g => g.id === bottomId)?.name || bottomId}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    {showBottomPicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1">
                        {BOTTOMS_CATALOG.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              setBottomId(g.id);
                              if (g.id !== currentGarmentId) setBottomColors(defaultZones(g.id));
                              setShowBottomPicker(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-emerald-50 transition ${bottomId === g.id ? "font-bold text-[#0E6E55]" : "text-gray-700"}`}
                          >
                            <span>{g.emoji}</span>
                            <span>{g.name}</span>
                            {bottomId === g.id && <CheckCircle2 className="w-3 h-3 ml-auto text-[#0E6E55]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Color editor */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {editingSlot === "top" ? "Top Colors" : "Bottom Colors"}
                </p>

                {/* Primary color */}
                <div className="mb-3">
                  <label className="text-[10px] text-gray-500 font-medium block mb-1">Body / Main</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeColors.body || "#062D24"}
                      onChange={e => setActiveColors(prev => ({ ...prev, body: e.target.value }))}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={activeColors.body || "#062D24"}
                      onChange={e => setActiveColors(prev => ({ ...prev, body: e.target.value }))}
                      className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1 font-mono"
                    />
                  </div>
                </div>

                {/* Accent color */}
                <div className="mb-3">
                  <label className="text-[10px] text-gray-500 font-medium block mb-1">
                    {editingSlot === "top" ? "Collar / Trim" : "Waistband / Yoke"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingSlot === "top" ? (activeColors.collar || "#0E6E55") : (activeColors.waistband || "#5A88B2")}
                      onChange={e => setActiveColors(prev => ({
                        ...prev,
                        [editingSlot === "top" ? "collar" : "waistband"]: e.target.value,
                        [editingSlot === "top" ? "collar" : "yoke"]: e.target.value,
                      }))}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingSlot === "top" ? (activeColors.collar || "#0E6E55") : (activeColors.waistband || "#5A88B2")}
                      onChange={e => setActiveColors(prev => ({
                        ...prev,
                        [editingSlot === "top" ? "collar" : "waistband"]: e.target.value,
                        [editingSlot === "top" ? "collar" : "yoke"]: e.target.value,
                      }))}
                      className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1 font-mono"
                    />
                  </div>
                </div>

                {/* Swatch palette */}
                <p className="text-[10px] text-gray-400 mb-2">Quick palette</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {COLOR_SWATCHES.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setActiveColors(prev => ({ ...prev, body: col }))}
                      className="w-7 h-7 rounded-lg border border-gray-200 hover:scale-110 transition-transform"
                      style={{ background: col }}
                      title={col}
                    />
                  ))}
                </div>
              </div>

              {/* Outfit summary cards */}
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Outfit</p>
                <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl p-2 shadow-xs">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: topColors.body || "#062D24" }}>
                    <Shirt className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 truncate flex-1">
                    {TOPS_CATALOG.find(g => g.id === topId)?.name || topId}
                  </span>
                  <button type="button" onClick={() => setEditingSlot("top")} className="text-[10px] text-emerald-600 font-bold hover:underline">Edit</button>
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl p-2 shadow-xs">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: bottomColors.body || "#6B9AC4" }}>
                    <Scissors className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 truncate flex-1">
                    {BOTTOMS_CATALOG.find(g => g.id === bottomId)?.name || bottomId}
                  </span>
                  <button type="button" onClick={() => setEditingSlot("bottom")} className="text-[10px] text-emerald-600 font-bold hover:underline">Edit</button>
                </div>
              </div>

              {/* Fit note */}
              {fitNote && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                  {fitNote}
                </div>
              )}
            </div>
          </div>

          {/* Right panel — 3D viewport */}
          <div className="flex-1 relative bg-[#ECEEF2] overflow-hidden flex flex-col">
            {/* 3D canvas */}
            <div ref={containerRef} className="flex-1 cursor-grab active:cursor-grabbing" />

            {/* Viewport toolbar overlay */}
            <div className="absolute left-3 top-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-1 flex flex-col gap-1 shadow z-10">
              <button
                type="button"
                title="Reset Camera"
                onClick={resetCamera}
                className="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title={isRotating ? "Pause Turntable" : "Start Turntable"}
                onClick={() => setIsRotating(!isRotating)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${isRotating ? "bg-emerald-100 text-[#0E6E55]" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Lighting"
                className="w-7 h-7 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-gray-100 flex items-center justify-center transition"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Label overlay */}
            <div className="absolute right-3 top-3 bg-white/90 border border-gray-200 rounded-xl px-3 py-2 shadow z-10">
              <p className="text-[11px] font-bold text-gray-800">
                {TOPS_CATALOG.find(g => g.id === topId)?.name}
                <span className="text-gray-400 font-normal"> + </span>
                {BOTTOMS_CATALOG.find(g => g.id === bottomId)?.name}
              </p>
              <p className="text-[10px] text-gray-400">Outfit Fit Check</p>
            </div>

            {/* Bottom hint */}
            <div className="absolute bottom-3 inset-x-3 flex justify-center z-10 pointer-events-none">
              <div className="bg-black/50 text-white text-[10px] font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Sparkles className="w-3 h-3 inline mr-1 text-emerald-400" />
                Drag to orbit · Scroll to zoom · Both garments render together on mannequin
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
