"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  RotateCcw,
  Sun,
  Camera,
  Play,
  Pause,
  Sparkles,
  Maximize2,
  Box,
  Layers,
  Download,
  Eye,
  Sliders,
  Check,
} from "lucide-react";
import {
  createMannequinPedestal,
  buildGarment3DModel,
  ScratchConfig3D,
} from "./garment3DBuilder";

interface Props {
  garmentId?: string;
  garmentCategory?: string;
  garmentName?: string;
  frontSvgMarkup: string;
  backSvgMarkup: string;
  zoneColors?: Record<string, string>;
  scratchConfig?: ScratchConfig3D;
  expanded?: boolean;
  onExitExpanded?: () => void;
}

export function Live3DPanel({
  garmentId = "track-jacket",
  garmentCategory = "Outerwear",
  garmentName = "Urban Track Jacket",
  frontSvgMarkup,
  backSvgMarkup,
  zoneColors = {},
  scratchConfig,
  expanded = false,
  onExitExpanded,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"view" | "render">("view");
  const [isRotating, setIsRotating] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [lightingMode, setLightingMode] = useState<"studio" | "dramatic" | "warm">("studio");
  const [renderPreset, setRenderPreset] = useState<"softbox" | "runway" | "cyber">("softbox");
  const [isCapturing, setIsCapturing] = useState(false);
  const [gltfShirtModel, setGltfShirtModel] = useState<THREE.Group | null>(null);
  const isRotatingRef = useRef(isRotating);

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const garmentMeshGroupRef = useRef<THREE.Group | null>(null);
  const pedestalRef = useRef<THREE.Group | null>(null);

  const frontTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const backTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Studio lighting references for live mode toggling
  const lightsRef = useRef<{
    ambient?: THREE.AmbientLight;
    key?: THREE.DirectionalLight;
    fill?: THREE.DirectionalLight;
    rim?: THREE.DirectionalLight;
  }>({});

  // 1. Initialize Scene, Camera, Renderer, Pedestal, and OrbitControls
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 340;
    const height = containerRef.current.clientHeight || 520;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F8F9FA");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 2.9);
    cameraRef.current = camera;

    // WebGL Renderer with High Precision & Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // OrbitControls for 360 inspection
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.2;
    controls.maxDistance = 5.0;
    controls.maxPolarAngle = Math.PI / 1.75;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 3-Point Studio Lighting Rig + Hemisphere Cloth Grazing Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 0.85);
    hemiLight.position.set(0, 6, 0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2.8, 4.5, 3.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 1.35);
    fillLight.position.set(-3.8, 1.8, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.15);
    rimLight.position.set(0, 3.5, -4.2);
    scene.add(rimLight);

    lightsRef.current = { ambient: ambientLight, key: keyLight, fill: fillLight, rim: rimLight };

    // Soft Shadow-Catcher Floor
    const floorGeom = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -1.56;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Setup 1024x1024 Offscreen Canvases for dynamic UV texture projection
    const frontCanvas = document.createElement("canvas");
    frontCanvas.width = 1024;
    frontCanvas.height = 1024;
    frontCanvasRef.current = frontCanvas;

    const backCanvas = document.createElement("canvas");
    backCanvas.width = 1024;
    backCanvas.height = 1024;
    backCanvasRef.current = backCanvas;

    const frontTexture = new THREE.CanvasTexture(frontCanvas);
    frontTexture.flipY = false;
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    frontTexture.wrapS = THREE.ClampToEdgeWrapping;
    frontTexture.wrapT = THREE.ClampToEdgeWrapping;
    frontTextureRef.current = frontTexture;

    const backTexture = new THREE.CanvasTexture(backCanvas);
    backTexture.flipY = false;
    backTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.wrapS = THREE.ClampToEdgeWrapping;
    backTexture.wrapT = THREE.ClampToEdgeWrapping;
    backTextureRef.current = backTexture;

    // Load T-Shirt GLB in background with state hook
    const loader = new GLTFLoader();
    loader.load(
      "/models/t_shirt_mod.glb",
      (gltf) => {
        setGltfShirtModel(gltf.scene);
      },
      undefined,
      (err) => console.warn("GLB preload note:", err)
    );

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (isRotatingRef.current && garmentMeshGroupRef.current) {
        garmentMeshGroupRef.current.rotation.y += 0.0045;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler + ResizeObserver for flex container transitions
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth || 300;
      const h = containerRef.current.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // 2. Manage Mannequin Pedestal per Category
  useEffect(() => {
    if (!sceneRef.current) return;

    if (pedestalRef.current) {
      sceneRef.current.remove(pedestalRef.current);
      pedestalRef.current = null;
    }

    const newPedestal = createMannequinPedestal(garmentCategory);
    pedestalRef.current = newPedestal;
    sceneRef.current.add(newPedestal);
  }, [garmentCategory]);

  // 3. Re-build 3D Garment Mesh whenever garmentId, category, or gltfShirtModel changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove existing garment model
    if (garmentMeshGroupRef.current) {
      sceneRef.current.remove(garmentMeshGroupRef.current);
      garmentMeshGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
        }
      });
      garmentMeshGroupRef.current = null;
    }

    // Build the new garment mesh
    const newGarmentMesh = buildGarment3DModel({
      garmentId,
      category: garmentCategory,
      frontTexture: frontTextureRef.current,
      backTexture: backTextureRef.current,
      zoneColors,
      gltfShirtModel,
      scratchConfig,
    });

    // Apply wireframe mode if active
    newGarmentMesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => ((m as any).wireframe = isWireframe));
        } else if (mesh.material) {
          (mesh.material as any).wireframe = isWireframe;
        }
      }
    });

    garmentMeshGroupRef.current = newGarmentMesh;
    sceneRef.current.add(newGarmentMesh);
  }, [garmentId, garmentCategory, gltfShirtModel, scratchConfig]);

  // 4. Dynamic Real-time UV Texture Projection (rasterize SVG markups to canvases)
  useEffect(() => {
    if (!frontCanvasRef.current || !frontTextureRef.current) return;

    const primaryColor = zoneColors.body || "#062D24";

    // Front View SVG
    const frontImg = new Image();
    const frontSvgBlob = new Blob([frontSvgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const frontUrl = URL.createObjectURL(frontSvgBlob);

    frontImg.onload = () => {
      const ctx = frontCanvasRef.current?.getContext("2d");
      if (ctx && frontCanvasRef.current) {
        ctx.clearRect(0, 0, frontCanvasRef.current.width, frontCanvasRef.current.height);
        // Paint rich background matching primary zone
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, frontCanvasRef.current.width, frontCanvasRef.current.height);
        // Draw rasterized SVG
        ctx.drawImage(frontImg, 0, 0, frontCanvasRef.current.width, frontCanvasRef.current.height);
        if (frontTextureRef.current) {
          frontTextureRef.current.needsUpdate = true;
        }
      }
      URL.revokeObjectURL(frontUrl);
    };
    frontImg.onerror = () => {
      URL.revokeObjectURL(frontUrl);
    };
    frontImg.src = frontUrl;

    // Back View SVG
    if (!backCanvasRef.current || !backTextureRef.current) return;
    const backImg = new Image();
    const backSvgBlob = new Blob([backSvgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const backUrl = URL.createObjectURL(backSvgBlob);

    backImg.onload = () => {
      const ctx = backCanvasRef.current?.getContext("2d");
      if (ctx && backCanvasRef.current) {
        ctx.clearRect(0, 0, backCanvasRef.current.width, backCanvasRef.current.height);
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, backCanvasRef.current.width, backCanvasRef.current.height);
        ctx.drawImage(backImg, 0, 0, backCanvasRef.current.width, backCanvasRef.current.height);
        if (backTextureRef.current) {
          backTextureRef.current.needsUpdate = true;
        }
      }
      URL.revokeObjectURL(backUrl);
    };
    backImg.onerror = () => {
      URL.revokeObjectURL(backUrl);
    };
    backImg.src = backUrl;
  }, [frontSvgMarkup, backSvgMarkup, zoneColors]);

  // 5. Update every 2D zone color on all 3D garment parts (sleeves L/R, cuffs L/R, collar, hood, pocket, placket, zipper, drawstrings, waistband, lining) in real-time
  useEffect(() => {
    if (!garmentMeshGroupRef.current) return;

    const primaryColor = zoneColors.body || "#062D24";
    const collarColor =
      zoneColors.collar || zoneColors.waistband || zoneColors.hemBand || "#0E6E55";
    const hoodColor = zoneColors.hood || collarColor || primaryColor;
    const sleeveLColor = zoneColors.sleeveL || primaryColor;
    const sleeveRColor = zoneColors.sleeveR || sleeveLColor;
    const cuffLColor = zoneColors.cuffL || sleeveLColor;
    const cuffRColor = zoneColors.cuffR || sleeveRColor;
    const sleeveStripeColor =
      zoneColors.sleeveStripe || zoneColors.shoulderStripe || collarColor || "#FFFFFF";
    const pocketColor = zoneColors.pocket || primaryColor;
    const placketColor = zoneColors.placket || collarColor || "#10B981";
    const drawstringColor = zoneColors.drawstring || zoneColors.laces || "#FFFFFF";
    const zipperColor = zoneColors.zipper || "#FFFFFF";
    const waistbandColor =
      zoneColors.waistband || zoneColors.hemBand || collarColor || primaryColor;
    const yokeColor = zoneColors.yoke || waistbandColor || primaryColor;
    const bottomCuffColor =
      zoneColors.cuff || zoneColors.cuffL || collarColor || primaryColor;

    const applyColorToMaterial = (mat: THREE.Material) => {
      if (!(mat instanceof THREE.MeshStandardMaterial)) return;
      const matName = mat.name;
      if (matName === "mat_collar") {
        mat.color.set(collarColor);
      } else if (matName === "mat_hood") {
        mat.color.set(hoodColor);
      } else if (matName === "mat_sleeve_l" || matName === "mat_sleeve") {
        mat.color.set(sleeveLColor);
      } else if (matName === "mat_sleeve_r") {
        mat.color.set(sleeveRColor);
      } else if (matName === "mat_cuff_l" || matName === "mat_trim") {
        mat.color.set(cuffLColor);
      } else if (matName === "mat_cuff_r") {
        mat.color.set(cuffRColor);
      } else if (matName === "mat_sleeve_stripe") {
        mat.color.set(sleeveStripeColor);
      } else if (matName === "mat_pocket") {
        mat.color.set(pocketColor);
      } else if (matName === "mat_placket") {
        mat.color.set(placketColor);
      } else if (matName === "mat_drawstring") {
        mat.color.set(drawstringColor);
      } else if (matName === "mat_waistband") {
        mat.color.set(waistbandColor);
      } else if (matName === "mat_yoke") {
        mat.color.set(yokeColor);
      } else if (matName === "mat_cuff") {
        mat.color.set(bottomCuffColor);
      } else if (matName === "mat_zipper") {
        mat.color.set(zipperColor);
      } else if (matName === "mat_inside_lining") {
        mat.color.set(primaryColor).multiplyScalar(0.62);
      }
      mat.needsUpdate = true;
    };

    garmentMeshGroupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(applyColorToMaterial);
        } else if (mesh.material) {
          applyColorToMaterial(mesh.material);
        }
      }
    });
  }, [zoneColors]);

  // 6. Camera Presets
  const setCameraAngle = (angle: "front" | "perspective" | "back" | "detail") => {
    if (!cameraRef.current || !controlsRef.current) return;
    setIsRotating(false);
    if (angle === "front") {
      cameraRef.current.position.set(0, 0.1, 2.8);
    } else if (angle === "perspective") {
      cameraRef.current.position.set(1.8, 0.4, 2.2);
    } else if (angle === "back") {
      cameraRef.current.position.set(0, 0.1, -2.8);
    } else if (angle === "detail") {
      cameraRef.current.position.set(0, 0.35, 1.4);
    }
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // 7. Lighting Mode Toggle
  const toggleLighting = () => {
    const nextMode = lightingMode === "studio" ? "dramatic" : lightingMode === "dramatic" ? "warm" : "studio";
    setLightingMode(nextMode);
    const { ambient, key, fill, rim } = lightsRef.current;
    if (!ambient || !key || !fill || !rim) return;

    if (nextMode === "studio") {
      ambient.intensity = 1.25;
      key.color.set(0xffffff);
      key.intensity = 2.4;
      fill.color.set(0xecfdf5);
      rim.color.set(0x10b981);
    } else if (nextMode === "dramatic") {
      ambient.intensity = 0.5;
      key.color.set(0xffffff);
      key.intensity = 3.6;
      fill.color.set(0x062d24);
      rim.color.set(0x38bdf8);
    } else if (nextMode === "warm") {
      ambient.intensity = 1.1;
      key.color.set(0xfef3c7);
      key.intensity = 2.8;
      fill.color.set(0xfbbf24);
      rim.color.set(0xf59e0b);
    }
  };

  // 8. Snapshot Capture
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    setIsCapturing(true);
    setTimeout(() => {
      const dataUrl = rendererRef.current?.domElement.toDataURL("image/png");
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `${garmentId}-3d-mockup.png`;
        link.href = dataUrl;
        link.click();
      }
      setIsCapturing(false);
    }, 200);
  };

  // 9. Reset Camera View
  const handleResetView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 0.2, 2.9);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    setIsRotating(true);
  };

  return (
    <div
      className={`${
        expanded ? "flex-1 min-w-[360px]" : "w-[295px] xl:w-[315px]"
      } bg-white flex flex-col h-full select-none shrink-0 relative transition-all`}
    >
      {/* Aligned Column Header with 3D View / Render tabs matching mockup */}
      <div className="h-11 border-b border-gray-100 px-4 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-6 h-full">
          {expanded && onExitExpanded && (
            <button
              type="button"
              onClick={onExitExpanded}
              className="h-full flex items-center text-xs font-semibold text-gray-400 hover:text-gray-800 border-b-2 border-transparent transition"
            >
              2D Design
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("view")}
            className={`h-full flex items-center text-xs font-bold border-b-2 transition ${
              activeTab === "view"
                ? "text-[#0E6E55] border-[#0E6E55]"
                : "text-gray-400 hover:text-gray-700 border-transparent"
            }`}
          >
            {expanded ? "3D Preview" : "3D View"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("render")}
            className={`h-full flex items-center text-xs font-semibold border-b-2 transition ${
              activeTab === "render"
                ? "text-[#0E6E55] border-[#0E6E55] font-bold"
                : "text-gray-400 hover:text-gray-700 border-transparent"
            }`}
          >
            Render
          </button>
        </div>
      </div>

      {/* Main 3D Viewport */}
      <div className="flex-1 relative bg-[#F4F6F8] overflow-hidden">
        {/* Three.js Canvas Container */}
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top-Left Vertical Pill Strip matching mockup */}
        <div className="absolute left-3 top-3 bg-white/95 backdrop-blur-xs border border-gray-200/80 rounded-xl p-1 flex flex-col gap-1 shadow-2xs z-10">
          <button
            type="button"
            onClick={handleResetView}
            title="Fit 3D View"
            className="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? "Pause Turntable" : "Auto-Rotate Turntable"}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              isRotating
                ? "bg-[#ECFDF5] text-[#0E6E55]"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleLighting}
            title={`Studio Lighting (${lightingMode})`}
            className="w-7 h-7 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsWireframe(!isWireframe);
              if (garmentMeshGroupRef.current) {
                garmentMeshGroupRef.current.traverse((child) => {
                  if ((child as THREE.Mesh).isMesh) {
                    const m = (child as THREE.Mesh).material;
                    if (Array.isArray(m)) m.forEach((mat) => ((mat as any).wireframe = !isWireframe));
                    else if (m) (m as any).wireframe = !isWireframe;
                  }
                });
              }
            }}
            title="Toggle Wireframe Mesh"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              isWireframe
                ? "bg-[#ECFDF5] text-[#0E6E55]"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top-Right 3D Cube Badge matching mockup */}
        <button
          type="button"
          onClick={() => setCameraAngle("perspective")}
          title="3D Perspective View"
          className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-white/95 border border-gray-200/80 shadow-2xs flex items-center justify-center text-gray-700 hover:text-[#0E6E55] transition z-10"
        >
          <Box className="w-4 h-4" />
        </button>

        {/* Centered Bottom 5-Icon Dock matching mockup */}
        <div className="absolute inset-x-3 bottom-3 bg-white/95 backdrop-blur-xs border border-gray-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between shadow-2xs z-10">
          <button
            type="button"
            onClick={() => setCameraAngle("front")}
            title="Front Camera"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition text-[10px] font-bold"
          >
            1P
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle("perspective")}
            title="¾ Studio Angle"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition text-[10px] font-bold"
          >
            ¾
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle("back")}
            title="Back Camera"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition text-[10px] font-bold"
          >
            BK
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="Reset Turntable"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCaptureSnapshot}
            disabled={isCapturing}
            title="Capture 3D Render Snapshot"
            className="w-7 h-7 rounded-lg bg-[#0E6E55] hover:bg-[#09503E] text-white flex items-center justify-center shadow-2xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Render Showroom Modal Drawer if activeTab === "render" */}
      {activeTab === "render" && (
        <div className="absolute inset-0 top-11 bg-white/95 backdrop-blur-md p-5 flex flex-col justify-between z-20 animate-in fade-in">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-[#0E6E55]" />
                Showroom Studio
              </h4>
              <p className="text-xs text-gray-500">
                Generate high-resolution product photography with raytraced lighting presets.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-700">Lighting Setup</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "softbox", name: "Softbox Studio", icon: "💡" },
                  { id: "runway", name: "Runway Catwalk", icon: "✨" },
                  { id: "cyber", name: "High Contrast", icon: "⚡" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setRenderPreset(p.id as any);
                      toggleLighting();
                    }}
                    className={`p-2 rounded-xl border text-center transition ${
                      renderPreset === p.id
                        ? "border-[#0E6E55] bg-[#ECFDF5] text-[#0E6E55] font-bold ring-2 ring-[#0E6E55]/20"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-base mb-0.5">{p.icon}</div>
                    <div className="text-[10px] leading-tight">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Render details */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Output Resolution</span>
                <span className="font-bold text-gray-800">4096 x 4096 (4K)</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Color Space</span>
                <span className="font-bold text-gray-800">ACES Filmic</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Format</span>
                <span className="font-bold text-gray-800">PNG with Alpha</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="w-full bg-[#0E6E55] hover:bg-[#09503E] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Showroom Render</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("view")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-semibold transition"
            >
              Return to 3D Viewport
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
