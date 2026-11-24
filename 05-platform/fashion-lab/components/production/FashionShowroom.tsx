/**
 * FASHION-LAB: LUXURY FASHION SHOWROOM & COMMERCE SYSTEM
 * 
 * Module 9: Presentation, Tech Pack & Digital Fashion Commerce:
 * - Dual Interface: "Customer Boutique Experience" vs "Designer Publishing Studio"
 * - Interactive 3D Product Turntable with Editorial Studio Lighting
 * - Detailed garment specifications, fabric provenance, and Müller & Sohn block metrics
 * - Live Made-to-Measure customization (linked to avatar measurements)
 * - Atelier Shopping Bag & Zero-Waste Checkout Experience
 * - Designer publishing controls, wholesale pricing, marker margin analysis, and tech pack export
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ShoppingBag,
  Sparkles,
  Check,
  ChevronRight,
  ShieldCheck,
  Sliders,
  DollarSign,
  Layers,
  Ruler,
  Scissors,
  FileText,
  Compass,
  Heart,
  Share2,
  CheckCircle2,
  Package,
  TrendingUp,
  Tag,
  Palette,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useGarmentProject, garmentStore } from '@/lib/production/store';
import { generatePatternMesh } from '@/lib/production/meshing';
import { createClothSimulation, AvatarCollider } from '@/lib/production/clothSolver';
import { createHumanMannequin } from '@/components/studio/garment3DBuilder';
import { createCalibratedFabricMaterial } from '@/lib/production/fabricTextureEngine';
import { TechPackModal } from './TechPackModal';
import { projectHref } from '@/lib/production/stages';
import { PageHeader } from '@/components/ui/page-header';
import { SegmentedControl } from '@/components/ui/segmented-control';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Custom Fit'];

const COLORWAYS = [
  { name: 'Forest Green', hex: '#245C46' },
  { name: 'Deep Ink', hex: '#18251F' },
  { name: 'Warm Ivory', hex: '#F7F5F0' },
  { name: 'Muted Brass', hex: '#B99B70' },
  { name: 'Midnight Navy', hex: '#1E293B' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

export function FashionShowroom() {
  const project = useGarmentProject();
  const containerRef = useRef<HTMLDivElement>(null);

  // View state: 'boutique' (Customer) vs 'designer' (Designer Studio)
  const [viewRole, setViewRole] = useState<'boutique' | 'designer'>('boutique');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isTechPackOpen, setIsTechPackOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [bagItemsCount, setBagItemsCount] = useState(0);
  const [retailPrice, setRetailPrice] = useState(185);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Three.js Viewport
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | null>(null);
  const simRef = useRef<any>(null);

  // Cost & Production Analytics
  const fabricCostPerMeter = 14.50;
  const fabricMetersUsed = project.cuttingPlan.totalLengthMm / 1000;
  const estimatedFabricCost = Math.round(fabricCostPerMeter * fabricMetersUsed * 100) / 100;
  const trimsCost = 4.20;
  const cuttingSewingCost = 28.00;
  const totalProductionCost = Math.round((estimatedFabricCost + trimsCost + cuttingSewingCost) * 100) / 100;
  const grossMarginPercent = Math.round(((retailPrice - totalProductionCost) / retailPrice) * 100);

  // Initialize 3D Turntable
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 550;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F7F5F0'); // Atelier Warm Ivory
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 50);
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
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.4;
    controls.target.set(0, 0.85, 0);
    controls.minDistance = 1.2;
    controls.maxDistance = 3.8;
    controlsRef.current = controls;

    // Editorial Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.76);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbf5, 0.65);
    keyLight.position.set(2.2, 3.8, 2.6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe9e5dc, 0.35);
    fillLight.position.set(-2.8, 1.8, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
    rimLight.position.set(0, 3.2, -3.2);
    scene.add(rimLight);

    // Floor Shadow Catcher & Pedestal
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.55;
    floor.receiveShadow = true;
    scene.add(floor);

    const pedestalGeo = new THREE.RingGeometry(0.38, 0.395, 64);
    const pedestalMat = new THREE.MeshBasicMaterial({ color: 0xB99B70, opacity: 0.45, transparent: true, side: THREE.DoubleSide });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.rotation.x = -Math.PI / 2;
    pedestal.position.y = -0.548;
    scene.add(pedestal);

    // Add Mannequin (Atelier Linen Tailor's Form)
    const mannequin = createHumanMannequin("male", "Tops", "linen");
    scene.add(mannequin);

    // Dynamic ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth || 600;
      const h = containerRef.current.clientHeight || 520;
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

  // Build Cloth Simulation Mesh
  useEffect(() => {
    if (!sceneRef.current) return;

    const pieceMeshes = project.patternPieces.map((piece) => ({
      pieceId: piece.id,
      mesh: generatePatternMesh(piece, 22),
    }));

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

    const sim = createClothSimulation(
      pieceMeshes,
      project.sewingRelationships,
      project.fabric,
      colliders
    );
    simRef.current = sim;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(sim.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(sim.normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(sim.uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(sim.indices, 1));

    const fabricMat = createCalibratedFabricMaterial(project.fabric, {
      uvRepeat: 32,
    });

    if (garmentMeshRef.current) {
      sceneRef.current.remove(garmentMeshRef.current);
      garmentMeshRef.current.geometry.dispose();
    }

    const mesh = new THREE.Mesh(geo, fabricMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRef.current.add(mesh);
    garmentMeshRef.current = mesh;

    for (let i = 0; i < 60; i++) {
      sim.stepSimulation(0.016, 1.0);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
  }, [project.patternPieces, project.fabric, project.bodyProfile]);

  // Main Render Loop
  useEffect(() => {
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleColorChange = (hex: string) => {
    (project as any).fabric = {
      ...project.fabric,
      baseColor: hex,
    };
    garmentStore.setFabric(project.fabric.id);
  };

  const handleAddToBag = () => {
    setBagItemsCount((c) => c + 1);
    setIsBagOpen(true);
  };

  const handleCompleteOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      setOrderPlaced(false);
      setIsBagOpen(false);
      setBagItemsCount(0);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none">
      <PageHeader
        title="Showroom"
        description={
          viewRole === 'boutique'
            ? 'Preview the product page your customers will see.'
            : 'Set the price and publish this garment.'
        }
        actions={
          <>
            <SegmentedControl
              label="Showroom view"
              value={viewRole}
              onChange={setViewRole}
              options={[
                { value: 'boutique', label: 'Customer view', icon: ShoppingBag },
                { value: 'designer', label: 'Publishing', icon: TrendingUp },
              ]}
            />
          {/* Bag button */}
          <button
            onClick={() => setIsBagOpen(true)}
            aria-label={`Shopping bag (${bagItemsCount} items)`}
            className="relative size-9 inline-flex items-center justify-center rounded-lg border border-line bg-card text-ink hover:bg-surface transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {bagItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center shadow-xs">
                {bagItemsCount}
              </span>
            )}
          </button>
          </>
        }
      />

      {/* CUSTOMER BOUTIQUE EXPERIENCE */}
      {viewRole === 'boutique' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: 3D Editorial Turntable Display */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-line shadow-xs p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-line pb-4 gap-4">
              <div className="min-w-0 flex-1">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold">
                  Bespoke Collection · Ready-to-Wear
                </span>
                <h2 className="text-xl sm:text-2xl font-semibold text-ink mt-0.5 tracking-tight leading-snug">
                  {project.name}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-semibold font-mono text-ink">${retailPrice}.00</div>
                <div className="text-xs text-brand font-medium">Bespoke Made-to-Order</div>
              </div>
            </div>

            {/* Interactive 3D Turntable */}
            <div className="relative rounded-2xl overflow-hidden bg-surface border border-line h-[520px]">
              <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-mono text-ink-2 border border-line flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-brand animate-spin" />
                <span>360° Interactive Turntable</span>
              </div>

              <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>

            {/* Editorial Features Ribbon */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-surface border border-line text-center">
                <div className="text-xs font-semibold text-ink">{project.fabric.weightGSM} GSM</div>
                <div className="text-xs text-muted mt-0.5">{project.fabric.name}</div>
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-line text-center">
                <div className="text-xs font-semibold text-brand">Zero-Waste Pattern</div>
                <div className="text-xs text-muted mt-0.5">{project.cuttingPlan.efficiencyPercentage}% Marker Yield</div>
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-line text-center">
                <div className="text-xs font-semibold text-ink">Müller & Sohn</div>
                <div className="text-xs text-muted mt-0.5">Tailored CAD Block</div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Purchase, Made-to-Measure & Styling Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-line p-6 shadow-xs space-y-6">
              {/* Colorway Selection */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Selected Colorway
                  </label>
                  <span className="text-xs font-mono text-muted">
                    {COLORWAYS.find((c) => c.hex.toLowerCase() === project.fabric.baseColor.toLowerCase())?.name || 'Custom Shade'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {COLORWAYS.map((c) => {
                    const isSelected = project.fabric.baseColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        onClick={() => handleColorChange(c.hex)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                          isSelected
                            ? 'ring-2 ring-brand ring-offset-2 scale-110 shadow-sm'
                            : 'border-line hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && (
                          <Check
                            className={`w-3.5 h-3.5 stroke-[3] ${
                              c.hex === '#FFFFFF' || c.hex === '#F7F5F0' ? 'text-ink' : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}

                  {/* Interactive Custom Hex Color Picker */}
                  <label
                    className="w-8 h-8 rounded-full border-2 border-dashed border-accent/60 hover:border-brand bg-surface hover:bg-white transition-all cursor-pointer relative flex items-center justify-center shadow-2xs"
                    title="Select Custom Shade"
                  >
                    <Palette className="w-3.5 h-3.5 text-accent" />
                    <input
                      type="color"
                      value={project.fabric.baseColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Sizing & Custom Avatar Fit */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Size Selection
                  </label>
                  <Link
                    href={projectHref(project.id, 'measurements')}
                    className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
                  >
                    <Ruler className="w-3 h-3" />
                    <span>My Body Profile ({project.bodyProfile.chestGirth}cm)</span>
                  </Link>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        selectedSize === size
                          ? 'bg-brand border-brand text-white shadow-xs'
                          : 'bg-surface border-line text-ink hover:bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Garment Details & Provenance */}
              <div className="space-y-2 pt-2 border-t border-line">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Garment Construction & Material
                </h4>
                <p className="text-xs text-ink-2 leading-relaxed">
                  Precision-cut from <strong>{project.fabric.name}</strong> ({project.fabric.weightGSM} GSM). Featuring clear Mobilon elastic shoulder tape stabilization, 1x1 cotton rib mitered collar, and 2-needle coverstitched 25mm hem.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-ink-2">
                  <div>• 4-Thread Overlock Seams</div>
                  <div>• Preshrunk & Steamed Finish</div>
                  <div>• Carbon-neutral localized cutting</div>
                  <div>• Individual serial tech pack</div>
                </div>
              </div>

              {/* Add to Bag CTA */}
              <div className="space-y-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={handleAddToBag}
                  className="w-full bg-brand hover:bg-brand-hover active:scale-[0.99] text-white py-3.5 px-6 rounded-2xl font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Atelier Bag — ${retailPrice}.00</span>
                </button>

                <p className="text-center text-xs text-muted">
                  Complimentary carbon-neutral shipping on bespoke garments. Made in 5–7 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESIGNER PUBLISHING STUDIO INTERFACE */}
      {viewRole === 'designer' && (
        <div className="space-y-6">
          {/* Top Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-line shadow-xs space-y-1">
              <span className="text-xs uppercase text-muted">Total Production Cost</span>
              <div className="text-2xl font-semibold font-mono text-ink">${totalProductionCost}</div>
              <p className="text-xs text-ink-2">Fabric (${estimatedFabricCost}) + Trims (${trimsCost}) + Cut/Sew (${cuttingSewingCost})</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-line shadow-xs space-y-1">
              <span className="text-xs uppercase text-muted">Retail Price & Margin</span>
              <div className="text-2xl font-semibold font-mono text-brand">{grossMarginPercent}% Gross</div>
              <p className="text-xs text-ink-2">Based on current ${retailPrice} retail listing</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-line shadow-xs space-y-1">
              <span className="text-xs uppercase text-muted">Fabric Marker Efficiency</span>
              <div className="text-2xl font-semibold font-mono text-ink">{project.cuttingPlan.efficiencyPercentage}%</div>
              <p className="text-xs text-ink-2">Waste: {project.cuttingPlan.wastePercentage}% on 1500mm roll</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-line shadow-xs space-y-1">
              <span className="text-xs uppercase text-muted">Production Status</span>
              <div className="text-2xl font-semibold font-mono text-accent">Stage {project.activeStage}/9</div>
              <p className="text-xs text-ink-2">{isPublished ? 'Published to Marketplace' : 'Ready for Factory Release'}</p>
            </div>
          </div>

          {/* Publishing Controls Panel */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-5">
              <div>
                <h3 className="text-lg font-semibold text-ink">Marketplace & Production Release</h3>
                <p className="text-xs text-ink-2 mt-0.5">
                  Publish this style directly to the client commerce catalog or export the factory manufacturing bundle.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    isPublished
                      ? 'bg-brand-soft text-brand border border-brand'
                      : 'bg-brand text-white hover:bg-brand-hover shadow-xs'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{isPublished ? 'Published (Live)' : 'Publish to Showroom'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTechPackOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-accent/40 bg-accent-soft text-ink hover:bg-accent-soft-hover transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>Export Factory Spec</span>
                </button>
              </div>
            </div>

            {/* Pricing Adjuster */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-2">Direct-to-Consumer Retail ($):</label>
                <input
                  type="number"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(Number(e.target.value))}
                  className="w-full bg-surface border border-line rounded-xl px-3.5 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-2">Wholesale Margin (40%):</label>
                <div className="w-full bg-surface border border-line rounded-xl px-3.5 py-2 text-sm font-mono font-semibold text-muted">
                  ${Math.round(retailPrice * 0.40)}.00
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-2">Estimated Net Profit per Piece:</label>
                <div className="w-full bg-brand-soft border border-brand/30 rounded-xl px-3.5 py-2 text-sm font-mono font-semibold text-brand">
                  +${Math.round((retailPrice - totalProductionCost) * 100) / 100}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Atelier Shopping Bag Drawer */}
      {isBagOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right-full duration-300">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand" />
                  <h3 className="text-base font-semibold text-ink">Your Atelier Bag</h3>
                </div>
                <button
                  onClick={() => setIsBagOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface hover:bg-line text-ink flex items-center justify-center font-semibold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              <div className="py-6 space-y-4">
                <div className="p-4 rounded-2xl bg-surface border border-line flex gap-3">
                  <div
                    className="w-16 h-16 rounded-xl border border-line-strong shadow-2xs shrink-0 flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: project.fabric.baseColor }}
                  >
                    3D
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-ink truncate">{project.name}</h4>
                    <p className="text-xs text-ink-2 mt-0.5">
                      Size: {selectedSize} · {project.fabric.name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-mono font-semibold text-ink">${retailPrice}.00</span>
                      <span className="text-xs text-brand font-semibold bg-brand-soft px-2 py-0.5 rounded-full">
                        Made to Measure
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Summary & Order Action */}
            <div className="border-t border-line pt-4 space-y-3">
              <div className="flex justify-between text-xs text-ink-2">
                <span>Subtotal:</span>
                <span className="font-mono text-ink font-semibold">${retailPrice}.00</span>
              </div>
              <div className="flex justify-between text-xs text-ink-2">
                <span>Bespoke Tailoring & Nesting:</span>
                <span className="text-brand font-semibold">Included</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-ink pt-2 border-t border-line">
                <span>Total:</span>
                <span className="font-mono">${retailPrice}.00</span>
              </div>

              <button
                type="button"
                onClick={handleCompleteOrder}
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {orderPlaced ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Order Confirmed! Manufacturing Scheduled</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Zero-Waste Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tech Pack Modal */}
      <TechPackModal
        isOpen={isTechPackOpen}
        onClose={() => setIsTechPackOpen(false)}
      />
    </div>
  );
}
