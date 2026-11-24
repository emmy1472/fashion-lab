/**
 * FASHION-LAB: PATTERN-DRIVEN 3D CLOTH VIEWER & XPBD SIMULATOR
 * 
 * Luxury Studio Viewport:
 * - Real-time XPBD virtual stitching and cloth drape
 * - Physically Calibrated PBR Fabric Material Engine (Micro-Knit normal maps & roughness variance)
 * - Selectable Mannequin Presentation (Atelier Linen Dress Form, Alabaster Sculpt, Studio Charcoal, Garment Only)
 * - Calibrated 3-Point Studio Lighting and Soft Shadow Floor
 * - Non-obstructive collapsible Fit & Tension inspector
 * - Perspective Camera Presets (Front, Back, Left, Right, 3/4 Angle, Fit to Viewport)
 * - Turntable rotation and interactive simulation control
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Maximize2,
  Check,
  Play,
  Pause,
  Sliders,
  ShieldCheck,
  User,
  Compass,
  Eye,
  EyeOff,
  Sun,
  Video,
  X,
  ChevronDown,
} from 'lucide-react';
import { useGarmentProject } from '@/lib/production/store';
import { generatePatternMesh } from '@/lib/production/meshing';
import { createClothSimulation, AvatarCollider } from '@/lib/production/clothSolver';
import { createHumanMannequin } from '@/components/studio/garment3DBuilder';
import { createCalibratedFabricMaterial } from '@/lib/production/fabricTextureEngine';

type MannequinFinishOption = 'linen' | 'alabaster' | 'charcoal' | 'none';

function disposeMaterial(mat: THREE.Material) {
  const m = mat as any;
  if (m.map) m.map.dispose();
  if (m.normalMap) m.normalMap.dispose();
  if (m.roughnessMap) m.roughnessMap.dispose();
  if (m.metalnessMap) m.metalnessMap.dispose();
  if (m.bumpMap) m.bumpMap.dispose();
  mat.dispose();
}

function disposeHierarchy(node: THREE.Object3D) {
  node.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(disposeMaterial);
        } else {
          disposeMaterial(mesh.material);
        }
      }
    }
  });
}

export function PatternDriven3DViewer() {
  const project = useGarmentProject();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'fabric' | 'strain' | 'wireframe'>('fabric');
  const [isSimulating, setIsSimulating] = useState(true);
  const [mannequinFinish, setMannequinFinish] = useState<MannequinFinishOption>('linen');
  const [autoRotate, setAutoRotate] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(1.0);
  const [avgTension, setAvgTension] = useState(1.2);
  const [maxTension, setMaxTension] = useState(3.4);
  const [isFitDrawerOpen, setIsFitDrawerOpen] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mannequinGroupRef = useRef<THREE.Group | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | null>(null);
  const simRef = useRef<any>(null);

  // Initialize Three.js Scene, Camera, OrbitControls, and Studio Lighting
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F7F5F0'); // Digital Atelier Warm Ivory Studio
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
    camera.position.set(0, 0.90, 2.25);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.LinearToneMapping;
    rendererRef.current = renderer;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.85, 0);
    controls.minDistance = 0.8;
    controls.maxDistance = 3.6;
    controlsRef.current = controls;

    // Calibrated Atelier Studio Lighting (Photographic 3-Point System)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbf5, 0.72);
    keyLight.position.set(2.2, 3.8, 2.6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.00012;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe9e5dc, 0.42);
    fillLight.position.set(-2.8, 1.8, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
    rimLight.position.set(0, 3.2, -3.2);
    scene.add(rimLight);

    // Floor Shadow Catcher & Atelier Circular Pedestal
    const floorGeo = new THREE.PlaneGeometry(6, 6);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.14 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.55;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle Muted Brass Atelier Pedestal Ring
    const pedestalGeo = new THREE.RingGeometry(0.35, 0.365, 64);
    const pedestalMat = new THREE.MeshBasicMaterial({ color: 0xB99B70, opacity: 0.45, transparent: true, side: THREE.DoubleSide });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.rotation.x = -Math.PI / 2;
    pedestal.position.y = -0.548;
    scene.add(pedestal);

    // Create Mannequin Container Group
    const mannequinContainer = new THREE.Group();
    mannequinContainer.name = 'mannequin_container';
    scene.add(mannequinContainer);
    mannequinGroupRef.current = mannequinContainer;

    // ResizeObserver for dynamic split-panel resizing and initialization
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth || 400;
      const h = containerRef.current.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (sceneRef.current) {
        disposeHierarchy(sceneRef.current);
      }
      renderer.dispose();
    };
  }, []);

  // Update Mannequin Presentation (Linen Dress Form / Alabaster / Charcoal / None)
  useEffect(() => {
    if (!mannequinGroupRef.current || !sceneRef.current) return;
    const container = mannequinGroupRef.current;

    while (container.children.length > 0) {
      const child = container.children[0];
      disposeHierarchy(child);
      container.remove(child);
    }

    if (mannequinFinish === 'none') {
      container.visible = false;
      return;
    }

    container.visible = true;
    const mannequin = createHumanMannequin("male", "Tops", mannequinFinish);
    container.add(mannequin);
  }, [mannequinFinish]);

  // Update auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // Camera preset switcher
  const setCameraView = (view: 'front' | 'back' | 'left' | 'right' | 'iso') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    switch (view) {
      case 'front':
        camera.position.set(0, 0.90, 2.25);
        break;
      case 'back':
        camera.position.set(0, 0.90, -2.25);
        break;
      case 'left':
        camera.position.set(-2.25, 0.90, 0);
        break;
      case 'right':
        camera.position.set(2.25, 0.90, 0);
        break;
      case 'iso':
        camera.position.set(1.5, 0.95, 1.85);
        break;
    }
    controls.target.set(0, 0.85, 0);
    controls.update();
  };

  // Fit Garment & Mannequin to Viewport (Auto-Framing)
  const fitGarmentToViewport = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 0.90, 2.25);
    controlsRef.current.target.set(0, 0.85, 0);
    cameraRef.current.updateProjectionMatrix();
    controlsRef.current.update();
  }, []);

  // Build & Re-Build Pattern-Driven Cloth Simulation whenever pattern or fabric updates
  useEffect(() => {
    if (!sceneRef.current) return;

    // 1. Generate 2D-to-3D Meshes for all pattern pieces
    const pieceMeshes = project.patternPieces.map((piece) => ({
      pieceId: piece.id,
      mesh: generatePatternMesh(piece, 22),
    }));

    // 2. Set up Anatomical Avatar Colliders matching measurements
    const chestR = (project.bodyProfile.chestGirth / (2 * Math.PI)) * 0.01;
    const halfShoulder = (project.bodyProfile.shoulderWidth * 0.5) * 0.01;

    const colliders: AvatarCollider[] = [
      {
        type: 'capsule',
        name: 'torso_chest',
        p0: [0, 1.06, 0],
        p1: [0, 0.15, 0], // Anatomical torso from clavicles down to hips
        radius: Math.max(0.13, chestR * 0.92),
      },
      {
        type: 'capsule',
        name: 'shoulder_bridge',
        p0: [-halfShoulder, 1.025, 0],
        p1: [halfShoulder, 1.025, 0],
        radius: 0.065,
      },
      {
        type: 'capsule',
        name: 'neck',
        p0: [0, 1.06, 0],
        p1: [0, 1.25, 0],
        radius: 0.062,
      },
      {
        type: 'capsule',
        name: 'arm_left',
        p0: [-halfShoulder, 1.01, 0],
        p1: [-halfShoulder - 0.08, 0.65, 0.02],
        radius: 0.055,
      },
      {
        type: 'capsule',
        name: 'arm_right',
        p0: [halfShoulder, 1.01, 0],
        p1: [halfShoulder + 0.08, 0.65, 0.02],
        radius: 0.055,
      },
    ];

    // 3. Create XPBD Solver
    const sim = createClothSimulation(
      pieceMeshes,
      project.sewingRelationships,
      project.fabric,
      colliders
    );
    simRef.current = sim;

    // 4. Create Three.js BufferGeometry
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(sim.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(sim.normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(sim.uvs, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(sim.strainColors, 3));
    geo.setIndex(new THREE.BufferAttribute(sim.indices, 1));

    // Calibrated PBR Fabric Material with micro-structure normal map & roughness map
    const fabricMat = createCalibratedFabricMaterial(project.fabric, {
      uvRepeat: 32,
      wireframe: viewMode === 'wireframe',
      useStrainColors: viewMode === 'strain',
    });

    if (garmentMeshRef.current) {
      sceneRef.current.remove(garmentMeshRef.current);
      disposeHierarchy(garmentMeshRef.current);
      garmentMeshRef.current = null;
    }

    const mesh = new THREE.Mesh(geo, fabricMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRef.current.add(mesh);
    garmentMeshRef.current = mesh;

    // Pre-settle simulation for 60 steps so seams are pulled completely closed and fabric rests naturally
    for (let i = 0; i < 60; i++) {
      sim.stepSimulation(0.016, 1.0);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    setAvgTension(Number(sim.getAverageTensionKPa().toFixed(1)));
    setMaxTension(Number(sim.getMaxTensionKPa().toFixed(1)));
  }, [project.patternPieces, project.fabric, project.bodyProfile]);

  // View Mode Updates (Fabric PBR vs Strain Heatmap vs Wireframe Mesh)
  useEffect(() => {
    if (!garmentMeshRef.current) return;
    const oldMat = garmentMeshRef.current.material;
    const newMat = createCalibratedFabricMaterial(project.fabric, {
      uvRepeat: 32,
      wireframe: viewMode === 'wireframe',
      useStrainColors: viewMode === 'strain',
    });
    garmentMeshRef.current.material = newMat;
    if (Array.isArray(oldMat)) {
      oldMat.forEach(disposeMaterial);
    } else if (oldMat) {
      disposeMaterial(oldMat);
    }
  }, [viewMode, project.fabric]);

  // Main Render & Simulation Loop
  useEffect(() => {
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (isSimulating && simRef.current && garmentMeshRef.current) {
        simRef.current.stepSimulation(0.016, stitchProgress);
        const geo = garmentMeshRef.current.geometry;
        geo.attributes.position.needsUpdate = true;
        geo.attributes.normal.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;

        setAvgTension(Number(simRef.current.getAverageTensionKPa().toFixed(1)));
        setMaxTension(Number(simRef.current.getMaxTensionKPa().toFixed(1)));
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, stitchProgress]);

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink select-none relative overflow-hidden">
      {/* Floating Top Control Bar (Cleanly Grouped) */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-line shadow-sm text-xs">
        <div className="flex items-center gap-1.5 font-bold text-brand mr-1 border-r border-line pr-2.5">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span>3D Viewport</span>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center bg-surface p-0.5 rounded-xl border border-line">
          <button
            onClick={() => setViewMode('fabric')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'fabric'
                ? 'bg-white text-ink shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Fabric PBR
          </button>
          <button
            onClick={() => setViewMode('strain')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'strain'
                ? 'bg-white text-ink shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Activity className="w-3 h-3 text-brand" />
            <span>Heatmap</span>
          </button>
          <button
            onClick={() => setViewMode('wireframe')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'wireframe'
                ? 'bg-white text-ink shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Mesh
          </button>
        </div>

        {/* Camera Preset Pills */}
        <div className="flex items-center bg-surface p-0.5 rounded-xl border border-line ml-1">
          <button
            onClick={() => setCameraView('front')}
            title="Front View"
            className="px-2 py-1 text-[11px] font-semibold text-ink-2 hover:text-ink hover:bg-white rounded-lg transition"
          >
            Front
          </button>
          <button
            onClick={() => setCameraView('back')}
            title="Back View"
            className="px-2 py-1 text-[11px] font-semibold text-ink-2 hover:text-ink hover:bg-white rounded-lg transition"
          >
            Back
          </button>
          <button
            onClick={() => setCameraView('left')}
            title="Side View"
            className="px-2 py-1 text-[11px] font-semibold text-ink-2 hover:text-ink hover:bg-white rounded-lg transition"
          >
            Side
          </button>
          <button
            onClick={() => setCameraView('iso')}
            title="3/4 Perspective"
            className="px-2 py-1 text-[11px] font-semibold text-ink-2 hover:text-ink hover:bg-white rounded-lg transition"
          >
            3/4
          </button>
          <button
            onClick={fitGarmentToViewport}
            title="Auto-Fit Garment to Viewport"
            className="p-1 text-ink-2 hover:text-brand hover:bg-white rounded-lg transition"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Mannequin Presentation Selector */}
        <div className="flex items-center bg-surface p-0.5 rounded-xl border border-line">
          <button
            onClick={() => setMannequinFinish('linen')}
            title="Atelier Linen Dress Form"
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition ${
              mannequinFinish === 'linen'
                ? 'bg-white text-brand shadow-2xs font-bold'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Dress Form
          </button>
          <button
            onClick={() => setMannequinFinish('alabaster')}
            title="Clean Alabaster Sculpt"
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition ${
              mannequinFinish === 'alabaster'
                ? 'bg-white text-brand shadow-2xs font-bold'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Alabaster
          </button>
          <button
            onClick={() => setMannequinFinish('charcoal')}
            title="Studio Charcoal Finish"
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition ${
              mannequinFinish === 'charcoal'
                ? 'bg-white text-brand shadow-2xs font-bold'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Charcoal
          </button>
          <button
            onClick={() => setMannequinFinish('none')}
            title="Garment Only (Invisible Mannequin)"
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition ${
              mannequinFinish === 'none'
                ? 'bg-white text-brand shadow-2xs font-bold'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Off
          </button>
        </div>

        {/* Turntable Auto-rotate */}
        <button
          onClick={() => setAutoRotate((r) => !r)}
          title={autoRotate ? "Pause Turntable" : "Start 360° Turntable"}
          className={`p-1.5 rounded-xl border transition cursor-pointer ${
            autoRotate
              ? 'bg-brand-soft border-brand/40 text-brand'
              : 'bg-white border-line text-muted'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>

        {/* Pause/Play Simulation */}
        <button
          onClick={() => setIsSimulating((s) => !s)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            isSimulating
              ? 'bg-brand-soft text-brand border border-brand/30'
              : 'bg-warning-soft text-warning border border-warning/30'
          }`}
        >
          {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span className="hidden sm:inline">{isSimulating ? 'Simulating' : 'Paused'}</span>
        </button>

        <button
          onClick={() => {
            if (simRef.current) simRef.current.resetToArrangement();
          }}
          className="p-1.5 rounded-xl bg-white border border-line text-ink-2 hover:text-ink transition cursor-pointer"
          title="Reset to 2D Arranged Rest State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Collapsible Fit & Strain Drawer Toggle (Replaces obstructive floating box) */}
        <button
          onClick={() => setIsFitDrawerOpen(!isFitDrawerOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            isFitDrawerOpen
              ? 'bg-brand text-white border-brand'
              : 'bg-white border-line text-ink-2 hover:text-ink'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Fit Stats</span>
          <span className="text-[10px] font-mono font-bold px-1 rounded-md bg-black/10">
            {avgTension} kPa
          </span>
        </button>
      </div>

      {/* Non-Obstructive Slide-Down Fit & Tension Inspector (Only open on demand) */}
      {isFitDrawerOpen && (
        <div className="absolute top-14 right-3 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-line shadow-lg text-xs space-y-2.5 min-w-[220px] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-brand" /> Real-Time Fit & Tension
            </span>
            <button
              onClick={() => setIsFitDrawerOpen(false)}
              className="p-0.5 text-muted hover:text-ink rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-ink-2 font-medium">Mean Surface Tension:</span>
            <span className="font-mono text-ink font-bold">{avgTension} kPa</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-ink-2 font-medium">Peak Seam Stress:</span>
            <span className="font-mono text-accent font-bold">{maxTension} kPa</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-ink-2 font-medium">Anatomical Fit:</span>
            <span className="inline-flex items-center gap-1 font-bold text-brand">
              <Check className="w-3 h-3 stroke-[3]" /> Tailored Ease
            </span>
          </div>

          <div className="pt-2 border-t border-line space-y-1">
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500" />
            <div className="flex justify-between text-[9px] text-muted font-mono font-semibold">
              <span>Loose (-5%)</span>
              <span>Nominal (0%)</span>
              <span>Tight (+12%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Three.js Canvas Container (Clean, unobstructed garment view) */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom Production Spec Bar */}
      <div className="h-10 bg-white border-t border-line px-4 flex items-center justify-between text-xs text-ink-2 z-20 shadow-2xs">
        <div className="flex items-center gap-3 truncate">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border border-line-strong shadow-2xs shrink-0"
              style={{ backgroundColor: project.fabric.baseColor }}
            />
            <span className="font-semibold text-ink truncate">{project.fabric.name}</span>
          </div>
          <span>·</span>
          <span className="hidden sm:inline">Weight: <strong className="text-ink font-mono">{project.fabric.weightGSM} GSM</strong></span>
          <span>·</span>
          <span className="hidden sm:inline">Thickness: <strong className="text-ink font-mono">{project.fabric.thicknessMm} mm</strong></span>
          <span>·</span>
          <span className="hidden sm:inline">Texture: <strong className="text-ink capitalize font-mono">{project.fabric.category} Micro-PBR</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-brand font-bold text-[11px] shrink-0">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden md:inline">Synchronized 1:1 with 2D Pattern Geometry</span>
          <span className="md:hidden">Live 1:1 CAD</span>
        </div>
      </div>
    </div>
  );
}
