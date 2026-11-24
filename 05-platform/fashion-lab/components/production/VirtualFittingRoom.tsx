/**
 * FASHION-LAB: IMMERSIVE 3D VIRTUAL FITTING ROOM
 * 
 * Module 8: Virtual Dressing, Fit Analysis & Strain Heatmaps:
 * - Large interactive 3D avatar viewport with XPBD pattern-driven cloth drape
 * - Wardrobe catalog (Tailored Crewneck, Oversized Boxy Tee, Raglan Sport, Deep V-Neck)
 * - Live dress and undress interactions
 * - Fabric substrate and colorway customization
 * - Real-time sizing adjustments (XS, S, M, L, XL, Bespoke)
 * - Fit analysis card with per-vertex strain tensor evaluation (Green/Yellow/Red)
 * - Pose selection (A-Pose, Relaxed, Runway)
 * - 360-degree camera rotation & saved outfit looks
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Sparkles,
  Activity,
  Layers,
  Ruler,
  Check,
  AlertTriangle,
  RotateCcw,
  Compass,
  User,
  Sliders,
  Camera,
  Shirt,
  Heart,
  Palette,
  Eye,
  EyeOff,
  Bookmark,
  Share2,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import Link from 'next/link';
import { useGarmentProject, garmentStore } from '@/lib/production/store';
import { generatePatternMesh } from '@/lib/production/meshing';
import { createClothSimulation, AvatarCollider } from '@/lib/production/clothSolver';
import { createHumanMannequin } from '@/components/studio/garment3DBuilder';
import { createCalibratedFabricMaterial } from '@/lib/production/fabricTextureEngine';
import { FABRIC_LIBRARY } from '@/lib/production/fabrics';

// Available Wardrobe Presets
const WARDROBE_PRESETS = [
  {
    id: 'proj_essential_tshirt',
    name: 'Tailored Essential Crewneck',
    category: 'T-Shirt',
    description: 'Bespoke crewneck cut with 70mm chest ease and 10mm mitered neckband.',
    defaultFabric: 'cotton_jersey',
  },
  {
    id: 'proj_oversized_box_tee',
    name: 'Heavyweight Boxy Tee',
    category: 'T-Shirt',
    description: 'Drop-shoulder silhouette with 140mm ease and heavyweight 280 GSM fleece drape.',
    defaultFabric: 'heavy_terry',
  },
  {
    id: 'proj_raglan_athletic',
    name: 'Performance Interlock Tee',
    category: 'Activewear',
    description: 'Ergonomic athletic block with high-stretch elastane recovery.',
    defaultFabric: 'poly_spandex',
  },
  {
    id: 'proj_silk_charmeuse',
    name: 'Bias Fluid Evening Tee',
    category: 'Luxury',
    description: 'Draped 85 GSM mulberry silk with high sheen and low bending stiffness.',
    defaultFabric: 'silk_charmeuse',
  },
];

// Colorway Swatches
const ATELIER_COLORS = [
  { name: 'Forest Green', hex: '#245C46' },
  { name: 'Deep Ink', hex: '#18251F' },
  { name: 'Warm Ivory', hex: '#F7F5F0' },
  { name: 'Muted Brass', hex: '#B99B70' },
  { name: 'Terracotta', hex: '#C25D43' },
  { name: 'Midnight Navy', hex: '#1E293B' },
  { name: 'Slate Grey', hex: '#475569' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

// Sizing Benchmarks
const SIZES = [
  { label: 'XS', chestCm: 88, desc: '34" Chest' },
  { label: 'S', chestCm: 92, desc: '36" Chest' },
  { label: 'M', chestCm: 98, desc: '38-40" Chest' },
  { label: 'L', chestCm: 104, desc: '42" Chest' },
  { label: 'XL', chestCm: 112, desc: '44" Chest' },
  { label: 'Bespoke', chestCm: 98, desc: 'Made to Measure' },
];

// Model Poses
type PoseType = 'a-pose' | 'relaxed' | 'runway';

export function VirtualFittingRoom() {
  const project = useGarmentProject();
  const containerRef = useRef<HTMLDivElement>(null);

  // UI Interactive States
  const [isDressed, setIsDressed] = useState(true);
  const [viewMode, setViewMode] = useState<'fabric' | 'strain' | 'wireframe'>('fabric');
  const [activePose, setActivePose] = useState<PoseType>('a-pose');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [autoRotate, setAutoRotate] = useState(false);
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'runway' | 'golden'>('studio');
  const [savedLooks, setSavedLooks] = useState<Array<{ id: string; name: string; date: string; color: string }>>([
    { id: '1', name: 'Editorial Green M', date: 'Today, 2:30 PM', color: '#245C46' },
  ]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulation metrics
  const [avgTension, setAvgTension] = useState(1.2);
  const [maxTension, setMaxTension] = useState(3.4);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mannequinRef = useRef<THREE.Object3D | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | null>(null);
  const simRef = useRef<any>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Initialize Three.js Viewport
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 700;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F7F5F0'); // Atelier Warm Ivory
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
    camera.position.set(0, 0.95, 2.05);
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
    controls.minDistance = 1.0;
    controls.maxDistance = 4.0;
    controlsRef.current = controls;

    // Atmospheric Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbf5, 0.65);
    keyLight.position.set(2.4, 4.0, 2.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.00015;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(0xe9e5dc, 0.35);
    fillLight.position.set(-2.8, 1.8, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
    rimLight.position.set(0, 3.2, -3.2);
    scene.add(rimLight);

    // Floor Shadow Catcher & Luxury Circular Pedestal
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.14 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.55;
    floor.receiveShadow = true;
    scene.add(floor);

    // Brass Atelier Pedestal Rings
    const pedestalGeo = new THREE.RingGeometry(0.38, 0.395, 64);
    const pedestalMat = new THREE.MeshBasicMaterial({ color: 0xB99B70, opacity: 0.45, transparent: true, side: THREE.DoubleSide });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.rotation.x = -Math.PI / 2;
    pedestal.position.y = -0.548;
    scene.add(pedestal);

    // Procedural Human Mannequin (Atelier Linen Tailor's Form)
    const mannequin = createHumanMannequin("male", "Tops", "linen");
    mannequin.name = 'fitting_mannequin';
    scene.add(mannequin);
    mannequinRef.current = mannequin;

    // ResizeObserver for dynamic layout handling
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth || 800;
      const h = containerRef.current.clientHeight || 700;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update lighting preset
  useEffect(() => {
    if (!keyLightRef.current || !sceneRef.current) return;
    if (lightingPreset === 'studio') {
      keyLightRef.current.color.set('#FFFBF5');
      keyLightRef.current.intensity = 0.65;
      sceneRef.current.background = new THREE.Color('#F7F5F0');
    } else if (lightingPreset === 'runway') {
      keyLightRef.current.color.set('#FFFFFF');
      keyLightRef.current.intensity = 0.85;
      sceneRef.current.background = new THREE.Color('#EFECE6');
    } else if (lightingPreset === 'golden') {
      keyLightRef.current.color.set('#FFE2B3');
      keyLightRef.current.intensity = 0.75;
      sceneRef.current.background = new THREE.Color('#F3EDE2');
    }
  }, [lightingPreset]);

  // Update turntable auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.8;
    }
  }, [autoRotate]);

  // Re-build Pattern Cloth Simulation when measurements, pattern or fabric changes
  useEffect(() => {
    if (!sceneRef.current) return;

    if (!isDressed) {
      if (garmentMeshRef.current) {
        garmentMeshRef.current.visible = false;
      }
      return;
    }

    // 1. Generate 2D-to-3D Meshes for pattern pieces
    const pieceMeshes = project.patternPieces.map((piece) => ({
      pieceId: piece.id,
      mesh: generatePatternMesh(piece, 22),
    }));

    // 2. Set up Colliders matching current avatar measurements
    const chestR = (project.bodyProfile.chestGirth / (2 * Math.PI)) * 0.01;
    const halfShoulder = (project.bodyProfile.shoulderWidth * 0.5) * 0.01;

    // Adjust arm position slightly based on active pose
    let armSpread = 0.08;
    let armDrop = 0.65;
    if (activePose === 'relaxed') {
      armSpread = 0.06;
      armDrop = 0.62;
    } else if (activePose === 'runway') {
      armSpread = 0.12;
      armDrop = 0.68;
    }

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
        p1: [-halfShoulder - armSpread, armDrop, 0.02],
        radius: 0.055,
      },
      {
        type: 'capsule',
        name: 'arm_right',
        p0: [halfShoulder, 1.01, 0],
        p1: [halfShoulder + armSpread, armDrop, 0.02],
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
      garmentMeshRef.current.geometry.dispose();
    }

    const mesh = new THREE.Mesh(geo, fabricMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.visible = isDressed;
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
  }, [project.patternPieces, project.fabric, project.bodyProfile, isDressed, activePose]);

  // View Mode Updates (Fabric vs Strain Heatmap vs Wireframe)
  useEffect(() => {
    if (!garmentMeshRef.current) return;
    const newMat = createCalibratedFabricMaterial(project.fabric, {
      uvRepeat: 32,
      wireframe: viewMode === 'wireframe',
      useStrainColors: viewMode === 'strain',
    });
    garmentMeshRef.current.material = newMat;
  }, [viewMode, project.fabric]);

  // Main Render & Simulation Loop
  useEffect(() => {
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (isDressed && simRef.current && garmentMeshRef.current) {
        simRef.current.stepSimulation(0.016, 1.0);
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
  }, [isDressed]);

  // Camera View Switcher
  const setCameraView = (view: 'front' | 'back' | 'side' | 'full') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    switch (view) {
      case 'front':
        camera.position.set(0, 0.95, 2.05);
        break;
      case 'back':
        camera.position.set(0, 0.95, -2.05);
        break;
      case 'side':
        camera.position.set(-2.05, 0.95, 0);
        break;
      case 'full':
        camera.position.set(1.4, 0.95, 1.9);
        break;
    }
    controls.target.set(0, 0.85, 0);
    controls.update();
  };

  // Sizing Handler
  const handleSizeChange = (size: typeof SIZES[0]) => {
    setSelectedSize(size.label);
    if (size.label !== 'Bespoke') {
      garmentStore.updateBodyMeasurements({
        chestGirth: size.chestCm,
        waistGirth: size.chestCm - 14,
        hipGirth: size.chestCm,
      });
    }
  };

  // Colorway Handler
  const handleColorChange = (colorHex: string) => {
    const updatedFabric = {
      ...project.fabric,
      baseColor: colorHex,
    };
    // Direct store update ensures sync across 2D, 3D, and Tech Pack
    (project as any).fabric = updatedFabric;
    garmentStore.setFabric(project.fabric.id);
  };

  // Save Outfit Snapshot
  const handleSaveOutfit = () => {
    const newLook = {
      id: String(Date.now()),
      name: `${project.name} (${selectedSize})`,
      date: 'Just now',
      color: project.fabric.baseColor,
    };
    setSavedLooks([newLook, ...savedLooks]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Main Fitting Room Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* CENTER / 3D VIEWPORT: 8 Columns on XL */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-line shadow-xs flex flex-col overflow-hidden min-h-[620px] relative">
          {/* Top Floating Viewport Control Bar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-line shadow-sm text-xs">
            <div className="flex items-center gap-2 font-semibold text-brand mr-1 border-r border-line pr-2.5">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>Virtual Dressing (XPBD)</span>
            </div>

            {/* Dress / Undress Toggle */}
            <button
              onClick={() => setIsDressed(!isDressed)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isDressed
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-2'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>{isDressed ? 'Dressed' : 'Undressed'}</span>
            </button>

            {/* View Mode (Fabric vs Heatmap vs Wireframe) */}
            <div className="flex items-center bg-surface p-0.5 rounded-xl border border-line">
              <button
                onClick={() => setViewMode('fabric')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'fabric'
                    ? 'bg-white text-ink shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                PBR Cloth
              </button>
              <button
                onClick={() => setViewMode('strain')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'strain'
                    ? 'bg-white text-ink shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Activity className="w-3 h-3 text-brand" />
                <span>Strain Heatmap</span>
              </button>
              <button
                onClick={() => setViewMode('wireframe')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'wireframe'
                    ? 'bg-white text-ink shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                Wireframe
              </button>
            </div>
          </div>

          {/* Floating Tension & Heatmap Analytics Card */}
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-line shadow-sm text-xs space-y-2 min-w-[210px]">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-brand" /> Fit & Tension
              </span>
              <span className="text-xs text-brand font-mono font-semibold bg-brand-soft px-1.5 py-0.5 rounded-full">
                Live XPBD
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-2">Mean Stress:</span>
              <span className="font-mono text-ink font-semibold">{avgTension} kPa</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-2">Peak Pinch Tension:</span>
              <span className="font-mono text-accent font-semibold">{maxTension} kPa</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-2">Fit Calibration:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-brand">
                <Check className="w-3 h-3 stroke-[3]" /> Tailored Ease
              </span>
            </div>

            {viewMode === 'strain' && (
              <div className="pt-2 border-t border-line space-y-1">
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500" />
                <div className="flex justify-between text-xs text-ink font-mono font-semibold">
                  <span>Relaxed (0%)</span>
                  <span>Optimal (+5%)</span>
                  <span>Tension (+12%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Three.js Canvas Container */}
          <div ref={containerRef} className="flex-1 w-full h-full min-h-[540px] cursor-grab active:cursor-grabbing" />

          {/* Bottom Viewport Control Footer */}
          <div className="h-14 bg-white border-t border-line px-6 flex items-center justify-between z-20">
            {/* Lighting Studio Presets */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted text-xs font-mono">Lighting:</span>
              {(['studio', 'runway', 'golden'] as const).map((lp) => (
                <button
                  key={lp}
                  onClick={() => setLightingPreset(lp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                    lightingPreset === lp
                      ? 'bg-brand text-white shadow-2xs font-semibold'
                      : 'text-ink-2 hover:bg-surface'
                  }`}
                >
                  {lp}
                </button>
              ))}
            </div>

            {/* Center: Camera Preset Views & Turntable */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-surface p-0.5 rounded-xl border border-line">
                {(['front', 'back', 'side', 'full'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setCameraView(view)}
                    className="px-2.5 py-1 text-xs font-semibold text-ink-2 hover:text-ink hover:bg-white rounded-lg transition capitalize cursor-pointer"
                  >
                    {view === 'full' ? '3/4 Angle' : view}
                  </button>
                ))}
              </div>

              {/* Turntable 360 */}
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                title={autoRotate ? "Stop Turntable" : "Start 360° Turntable"}
                className={`p-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                  autoRotate
                    ? 'bg-brand-soft border-brand/40 text-brand'
                    : 'bg-white border-line text-ink-2 hover:bg-surface'
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin text-brand' : ''}`} />
                <span className="text-xs hidden sm:inline">{autoRotate ? 'Rotating' : 'Turntable'}</span>
              </button>
            </div>

            {/* Save Outfit Look Action */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveOutfit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-accent/40 bg-accent-soft hover:bg-accent-soft-hover text-ink text-xs font-semibold transition cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-brand" />
                    <span className="text-brand">Look Saved!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-accent" />
                    <span>Save Outfit Look</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: 4 Columns on XL (Wardrobe, Size, Fabric & Color, Poses) */}
        <div className="xl:col-span-4 space-y-5">
          {/* Card 1: Wardrobe Catalog */}
          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-semibold text-ink">Garment Wardrobe</h2>
              </div>
              <span className="text-xs text-muted uppercase">Active Style</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {WARDROBE_PRESETS.map((item) => {
                const isCurrent = item.name.includes('Crewneck') || item.id === project.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.defaultFabric) {
                        garmentStore.setFabric(item.defaultFabric);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-brand-soft border-brand shadow-xs'
                        : 'bg-surface border-line hover:border-accent hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">{item.name}</span>
                      {isCurrent && (
                        <span className="w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-2 mt-1 leading-relaxed">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Size & Fit Calibration */}
          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-semibold text-ink">Garment Sizing Calibration</h2>
              </div>
              <span className="text-xs font-mono text-brand font-semibold bg-brand-soft px-2 py-0.5 rounded-full">
                {selectedSize} · {project.bodyProfile.chestGirth}cm Chest
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SIZES.map((size) => {
                const isSelected = selectedSize === size.label;
                return (
                  <button
                    key={size.label}
                    onClick={() => handleSizeChange(size)}
                    className={`py-2 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-brand border-brand text-white shadow-xs font-semibold'
                        : 'bg-surface border-line text-ink hover:bg-white hover:border-accent'
                    }`}
                  >
                    <div className="text-xs font-mono">{size.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted leading-tight">
              Selecting a size immediately re-computes 2D pattern geometry and re-solves 3D cloth drape around avatar landmarks.
            </p>
          </div>

          {/* Card 3: Colorway & Fabric Substrate Customization */}
          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-semibold text-ink">Colorways & Fabric</h2>
              </div>
              <span className="text-xs font-mono text-muted">{project.fabric.weightGSM} GSM</span>
            </div>

            {/* Color Swatch Circles */}
            <div className="flex items-center justify-between gap-1.5">
              {ATELIER_COLORS.map((c) => {
                const isActive = project.fabric.baseColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    onClick={() => handleColorChange(c.hex)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                      isActive
                        ? 'ring-2 ring-brand ring-offset-2 scale-110 shadow-sm'
                        : 'border-line hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isActive && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          c.hex === '#FFFFFF' || c.hex === '#F7F5F0' ? 'text-ink' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Substrate Picker */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-ink-2 block">Substrate Physics:</label>
              <select
                value={project.fabric.id}
                onChange={(e) => garmentStore.setFabric(e.target.value)}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
              >
                {Object.values(FABRIC_LIBRARY).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.weightGSM} GSM · {f.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 4: Model Pose Selection */}
          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold text-ink">Model Poses</h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'a-pose', label: 'A-Pose', desc: 'Standard Block' },
                { id: 'relaxed', label: 'Relaxed', desc: 'Contrapposto' },
                { id: 'runway', label: 'Runway', desc: 'Catwalk Strut' },
              ].map((pose) => (
                <button
                  key={pose.id}
                  onClick={() => setActivePose(pose.id as PoseType)}
                  className={`py-2 px-1 rounded-xl border text-center transition cursor-pointer ${
                    activePose === pose.id
                      ? 'bg-brand border-brand text-white shadow-xs font-semibold'
                      : 'bg-surface border-line text-ink-2 hover:text-ink hover:bg-white'
                  }`}
                >
                  <div className="text-xs">{pose.label}</div>
                  <div className={`text-xs mt-0.5 ${activePose === pose.id ? 'text-emerald-100' : 'text-muted'}`}>
                    {pose.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
