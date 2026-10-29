import * as THREE from "three";

export type GarmentCategory3D =
  | "Outerwear"
  | "Tops"
  | "Formalwear"
  | "Dresses"
  | "Bottoms"
  | "Jerseys"
  | "Headwear"
  | "Accessories";

export interface ScratchConfig3D {
  baseMode?: "block" | "exploded" | "croquis";
  neckType?: "crew" | "v" | "deepv" | "scoop" | "square" | "stand" | "hood";
  sleeveType?: "sleeveless" | "cap" | "short" | "three-quarter" | "long" | "bell";
  shoulderWidth?: number;
  chestWidth?: number;
  waistWidth?: number;
  hipWidth?: number;
  garmentLength?: number;
  cutSplitMode?: string;
  cutY?: number;
  explodeAmount?: number;
  showCroquis?: boolean;
  customCuts?: any[];
  parts?: string[] | Record<string, boolean>;
}

interface BuildOptions {
  garmentId: string;
  category: string;
  frontTexture: THREE.CanvasTexture | null;
  backTexture: THREE.CanvasTexture | null;
  zoneColors: Record<string, string>;
  gltfShirtModel?: THREE.Group | null;
  scratchConfig?: ScratchConfig3D;
}

// Cached procedural textile bump maps for authentic cloth surface grain
let cachedWovenBumpMap: THREE.CanvasTexture | null = null;
let cachedRibbedBumpMap: THREE.CanvasTexture | null = null;
let cachedDenimTwillBumpMap: THREE.CanvasTexture | null = null;

function getDenimTwillBumpMap(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (cachedDenimTwillBumpMap) return cachedDenimTwillBumpMap;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#7c7c7c";
    ctx.fillRect(0, 0, 128, 128);

    // Authentic 3x1 Right-Hand Diagonal Selvedge Denim Twill + Slub Yarn Grain
    for (let y = 0; y < 128; y++) {
      const slubWarp = Math.sin(y * 0.45) * 8;
      for (let x = 0; x < 128; x++) {
        const slubWeft = Math.cos(x * 0.35) * 6;
        const diag = (x + y * 2) % 4;
        const isWarpRidge = diag < 3; // 3x1 twill: 3 warp floats over 1 weft
        const base = isWarpRidge ? 162 : 76;
        const v = Math.max(20, Math.min(240, Math.round(base + slubWarp + slubWeft)));
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 36);
  cachedDenimTwillBumpMap = tex;
  return tex;
}

function getWovenFabricBumpMap(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (cachedWovenBumpMap) return cachedWovenBumpMap;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 128, 128);

    // Fine twill/jersey warp & weft micro-weave
    for (let y = 0; y < 128; y += 2) {
      for (let x = 0; x < 128; x += 2) {
        const isWarp = ((x + y) >> 1) % 2 === 0;
        ctx.fillStyle = isWarp ? "#9a9a9a" : "#666666";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 28);
  cachedWovenBumpMap = tex;
  return tex;
}

function getRibbedKnitBumpMap(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (cachedRibbedBumpMap) return cachedRibbedBumpMap;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    for (let x = 0; x < 128; x++) {
      const v = Math.round(128 + 55 * Math.sin((x / 4) * Math.PI * 2));
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, 1, 128);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 4);
  cachedRibbedBumpMap = tex;
  return tex;
}

/**
 * Ghost-mannequin studio floor plinth.
 * Keeps the interior of all 3D garments completely unobstructed (zero cylinder clipping)
 * while grounding the 3D viewport with a sleek architectural turntable ring below the garment.
 */
export function createMannequinPedestal(_category: string = "Outerwear"): THREE.Group {
  const group = new THREE.Group();
  group.name = "mannequin_pedestal";

  const brushedMetal = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.25,
    metalness: 0.8,
  });

  const accentRingMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.3,
    metalness: 0.4,
    emissive: new THREE.Color(0x064e3b),
    emissiveIntensity: 0.25,
  });

  // Low-profile architectural turntable disc far below the garment hem
  const baseGeom = new THREE.CylinderGeometry(0.46, 0.50, 0.035, 48);
  const baseMesh = new THREE.Mesh(baseGeom, brushedMetal);
  baseMesh.position.set(0, -1.52, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Subtle emerald studio ring
  const ringGeom = new THREE.TorusGeometry(0.465, 0.006, 12, 64);
  const ringMesh = new THREE.Mesh(ringGeom, accentRingMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.set(0, -1.502, 0);
  group.add(ringMesh);

  return group;
}

/**
 * Evaluates the front chest centerline Z coordinate of `Object_10` in raw `Cloth_1` space
 * for any vertical coordinate `y` in `[0.94, 1.63]`.
 */
function sampleFrontChestZ(y: number, x: number = 0): number {
  const t = Math.max(0, Math.min(1, (y - 0.95) / 0.62));
  const centerZ = 0.160 - 0.098 * Math.pow(t, 1.18);
  // Chest curvature roll-off across X
  const xCurve = Math.max(0, 1 - Math.pow(x / 0.21, 2));
  return centerZ * (0.78 + 0.22 * xCurve);
}

/**
 * Builds a surface-conforming 3D zipper track + slider along the front chest profile of `Cloth_1`.
 */
function buildContouredZipper(
  yBottom: number,
  yTop: number,
  torsoScaleX: number,
  torsoScaleZ: number,
  zipperMat: THREE.Material,
  weltMat: THREE.Material
): THREE.Group {
  const zipGroup = new THREE.Group();
  const points: THREE.Vector3[] = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const y = yBottom + u * (yTop - yBottom);
    let z = sampleFrontChestZ(Math.min(1.56, y), 0) * torsoScaleZ;
    if (y > 1.56) {
      // Stand-up collar curve
      z = sampleFrontChestZ(1.56, 0) * torsoScaleZ - (y - 1.56) * 0.12;
    }
    points.push(new THREE.Vector3(0, y, z + 0.0035));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  // Metallic zipper teeth track
  const trackGeom = new THREE.TubeGeometry(curve, 32, 0.0032, 8, false);
  const trackMesh = new THREE.Mesh(trackGeom, zipperMat);
  trackMesh.castShadow = true;
  zipGroup.add(trackMesh);

  // Left & Right stitched fabric zipper welt tapes hugging the chest
  for (const side of [-1, 1]) {
    const weltPts = points.map(
      (p) => new THREE.Vector3(side * 0.0055 * torsoScaleX, p.y, p.z - 0.0012)
    );
    const weltCurve = new THREE.CatmullRomCurve3(weltPts);
    const weltGeom = new THREE.TubeGeometry(weltCurve, 28, 0.0024, 6, false);
    const weltMesh = new THREE.Mesh(weltGeom, weltMat);
    zipGroup.add(weltMesh);
  }

  // Zipper slider body & hanging pull tab near upper chest
  const sliderPt = curve.getPointAt(0.82);
  const sliderBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.011, 0.018, 0.007),
    zipperMat
  );
  sliderBody.position.copy(sliderPt).add(new THREE.Vector3(0, 0, 0.003));
  zipGroup.add(sliderBody);

  const pullTab = new THREE.Mesh(
    new THREE.BoxGeometry(0.007, 0.024, 0.0025),
    zipperMat
  );
  pullTab.position.copy(sliderPt).add(new THREE.Vector3(0, -0.016, 0.006));
  pullTab.rotation.x = 0.15;
  zipGroup.add(pullTab);

  return zipGroup;
}

/**
 * Builds a high-resolution draped cloth hood mesh that rises seamlessly from the collar seam
 * of `Cloth_1` (`y ≈ 1.57..1.63`) with realistic multi-harmonic fabric folds.
 */
function buildDrapedClothHood(material: THREE.Material): THREE.Group {
  const hoodGroup = new THREE.Group();
  const uSegs = 56;
  const vSegs = 36;
  const geom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // u in [0, 1] wraps from front-left collar (-0.78*PI) around the back (0) to front-right (+0.78*PI)
  // v in [0, 1] goes from the neck seam (v=0) up and over the crown of the hood (v=1)
  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      const theta = (u - 0.5) * Math.PI * 1.62; // Open front cowl

      // Base collar radius at v = 0 matching Cloth_1 collar
      const baseRx = 0.105;
      const baseRz = 0.088;

      // Drape expansion as hood rises and slouches backward
      const crownProfile = Math.sin(v * Math.PI * 0.92);
      const rx = baseRx + 0.075 * crownProfile + 0.012 * Math.sin(v * Math.PI * 2);
      const rz = baseRz + 0.085 * crownProfile;

      // Organic multi-frequency fabric folds along the hood drape
      const fold1 = 0.009 * Math.sin(v * Math.PI * 3.0 + Math.cos(theta * 2.0)) * Math.sin(v * Math.PI);
      const fold2 = 0.005 * Math.cos(theta * 5.0 + v * 4.0) * v;

      const x = Math.sin(theta) * (rx + fold2);
      // Neckline dips slightly toward the front and rises at the back
      const neckY = 1.595 - 0.032 * Math.max(0, -Math.cos(theta));
      // Slouched relaxed hood height + cowl fold
      const y = neckY + 0.195 * Math.pow(v, 0.82) * (0.65 + 0.35 * Math.cos(theta * 0.5)) + fold1;
      const z = -Math.cos(theta) * (rz + fold1) - 0.055 * Math.sin(v * Math.PI * 0.85) - 0.018;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * (uSegs + 1) + iu;
      const b = a + 1;
      const c = a + (uSegs + 1);
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  geom.setIndex(indices);
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const hoodMesh = new THREE.Mesh(geom, material);
  hoodMesh.castShadow = true;
  hoodMesh.receiveShadow = true;
  hoodGroup.add(hoodMesh);

  return hoodGroup;
}

/**
 * Builds curved 3D braided drawstrings with metallic aglet tips draped over the front chest.
 */
function buildHoodieDrawstrings(
  torsoScaleZ: number,
  cordMat: THREE.Material,
  agletMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const xBase = side * 0.044;
    const pts = [
      new THREE.Vector3(xBase, 1.565, sampleFrontChestZ(1.565, xBase) * torsoScaleZ + 0.005),
      new THREE.Vector3(
        xBase + side * 0.006,
        1.48,
        sampleFrontChestZ(1.48, xBase) * torsoScaleZ + 0.006
      ),
      new THREE.Vector3(
        xBase + side * 0.003,
        1.40,
        sampleFrontChestZ(1.40, xBase) * torsoScaleZ + 0.006
      ),
      new THREE.Vector3(
        xBase - side * 0.002,
        1.33,
        sampleFrontChestZ(1.33, xBase) * torsoScaleZ + 0.007
      ),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.0038, 8, false);
    const cordMesh = new THREE.Mesh(tubeGeom, cordMat);
    cordMesh.castShadow = true;
    group.add(cordMesh);

    // Metal aglet tip at end of drawstring
    const endPt = pts[pts.length - 1];
    const agletGeom = new THREE.CylinderGeometry(0.004, 0.0035, 0.018, 10);
    const agletMesh = new THREE.Mesh(agletGeom, agletMat);
    agletMesh.position.set(endPt.x, endPt.y - 0.008, endPt.z + 0.001);
    group.add(agletMesh);
  }
  return group;
}

/**
 * Builds a surface-conforming 3D Kangaroo Pouch Pocket on the front abdomen of `Cloth_1`.
 */
function buildContouredKangarooPocket(
  torsoScaleX: number,
  torsoScaleZ: number,
  pocketMat: THREE.Material
): THREE.Mesh {
  const uSegs = 36;
  const vSegs = 22;
  const geom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const yMin = 0.99;
  const yMax = 1.21;

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs; // 0 = bottom hem seam, 1 = top of pocket
    const y = yMin + v * (yMax - yMin);

    // Classic trapezoidal kangaroo pocket silhouette (narrower at top, angled hand openings)
    const halfWidth =
      v < 0.35
        ? 0.135 * torsoScaleX
        : (0.135 - ((v - 0.35) / 0.65) * 0.052) * torsoScaleX;

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      const x = (u - 0.5) * 2 * halfWidth;

      const baseZ = sampleFrontChestZ(y, x / torsoScaleX) * torsoScaleZ;
      // Smooth pouch bulge that kisses the torso at top/bottom seams and opens at the slanted sides
      const edgeU = Math.sin(u * Math.PI);
      const edgeV = Math.sin(v * Math.PI);
      const handOpeningLift =
        v > 0.32 && v < 0.92 && (u < 0.12 || u > 0.88)
          ? 0.009 * Math.sin(((v - 0.32) / 0.6) * Math.PI)
          : 0;
      const drapeWrinkle = 0.0025 * Math.sin(u * Math.PI * 5) * edgeV;
      const z = baseZ + 0.015 * Math.pow(edgeU, 0.55) * Math.pow(edgeV, 0.45) + handOpeningLift + drapeWrinkle + 0.002;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * (uSegs + 1) + iu;
      const b = a + 1;
      const c = a + (uSegs + 1);
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  geom.setIndex(indices);
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, pocketMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Builds surface-conforming 3D Tailored Notched Lapels + Horn Buttons for Blazers & Coats.
 */
function buildTailoredLapelsAndButtons(
  torsoScaleX: number,
  torsoScaleZ: number,
  lapelMat: THREE.Material,
  buttonMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();

  // Left and Right Notched Lapel Wings hugging the front chest curve
  for (const side of [-1, 1]) {
    const uSegs = 12;
    const vSegs = 28;
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];

    const yMin = 1.18; // Button stance point
    const yMax = 1.61; // Collar shoulder notch

    for (let iv = 0; iv <= vSegs; iv++) {
      const v = iv / vSegs;
      const y = yMin + v * (yMax - yMin);
      const innerX = side * (0.004 + v * 0.058) * torsoScaleX;
      // Lapel width flares out toward the upper chest and notches near v = 0.78
      const notchFactor = v > 0.76 && v < 0.84 ? 0.72 : 1.0;
      const width = (0.012 + Math.sin(v * Math.PI * 0.85) * 0.048 * notchFactor) * torsoScaleX;

      for (let iu = 0; iu <= uSegs; iu++) {
        const u = iu / uSegs;
        const x = innerX + side * u * width;
        const baseZ = sampleFrontChestZ(Math.min(1.56, y), x / torsoScaleX) * torsoScaleZ;
        // Subtle rolled lapel lift on outer edge
        const rollZ = 0.004 + 0.005 * Math.sin(u * Math.PI * 0.7) * Math.sin(v * Math.PI);
        positions.push(x, y, baseZ + rollZ);
      }
    }

    for (let iv = 0; iv < vSegs; iv++) {
      for (let iu = 0; iu < uSegs; iu++) {
        const a = iv * (uSegs + 1) + iu;
        const b = a + 1;
        const c = a + (uSegs + 1);
        const d = c + 1;
        if (side > 0) {
          indices.push(a, b, c, b, d, c);
        } else {
          indices.push(a, c, b, b, c, d);
        }
      }
    }

    geom.setIndex(indices);
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();

    const lapelMesh = new THREE.Mesh(geom, lapelMat);
    lapelMesh.castShadow = true;
    group.add(lapelMesh);
  }

  // Two tailored horn buttons along the front placket
  for (const btnY of [1.16, 1.04]) {
    const z = sampleFrontChestZ(btnY, 0) * torsoScaleZ + 0.006;
    const btnGeom = new THREE.CylinderGeometry(0.009, 0.009, 0.004, 20);
    const btnMesh = new THREE.Mesh(btnGeom, buttonMat);
    btnMesh.rotation.x = Math.PI / 2 - 0.12;
    btnMesh.position.set(0, btnY, z);
    btnMesh.castShadow = true;
    group.add(btnMesh);
  }

  return group;
}

/**
 * Builds a high-density pleated silk floor-length skirt mesh for Evening Gown / Dresses
 * that blends seamlessly into the cinched waist of `Cloth_1`.
 */
function buildDrapedSkirtMesh(
  frontMat: THREE.Material,
  backMat: THREE.Material,
  isShortSkirt: boolean = false
): THREE.Group {
  const group = new THREE.Group();
  const radialSegs = 96;
  const heightSegs = 56;

  const yTop = 1.16;
  const yBot = isShortSkirt ? 0.78 : 0.42;

  for (const isBack of [false, true]) {
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfSegs = radialSegs / 2;
    for (let iv = 0; iv <= heightSegs; iv++) {
      const v = iv / heightSegs; // 0 = waist, 1 = floor hem
      const y = yTop - v * (yTop - yBot);

      // Smooth A-line / column gown flare with organic S-curve drape
      const flare = Math.pow(v, 1.15);
      const rx = 0.165 + (isShortSkirt ? 0.09 : 0.175) * flare;
      const rz = 0.122 + (isShortSkirt ? 0.065 : 0.135) * flare;

      for (let iu = 0; iu <= halfSegs; iu++) {
        const u = iu / halfSegs;
        // Front spans theta in [-PI/2, +PI/2], Back spans [+PI/2, 3*PI/2]
        const theta = isBack
          ? Math.PI / 2 + u * Math.PI
          : -Math.PI / 2 + u * Math.PI;

        // Multi-harmonic vertical silk pleats that deepen toward the hem
        const pleatDepth = Math.pow(v, 0.85) * (isShortSkirt ? 0.012 : 0.022);
        const pleat =
          pleatDepth *
          (0.65 * Math.sin(theta * 10 + v * 1.4) +
            0.35 * Math.cos(theta * 18 - v * 2.1));

        const x = Math.sin(theta) * (rx + pleat);
        const z = Math.cos(theta) * (rz + pleat) + 0.012 * (1 - v);
        // Gentle hemline wave following the pleats
        const hemWave = v * 0.012 * Math.sin(theta * 10);

        positions.push(x, y + hemWave, z);
        // Align UVs with the torso UV island (u: 0.25..0.75, v: 0.55..0.90)
        uvs.push(0.25 + u * 0.5, 0.52 + v * 0.38);
      }
    }

    for (let iv = 0; iv < heightSegs; iv++) {
      for (let iu = 0; iu < halfSegs; iu++) {
        const a = iv * (halfSegs + 1) + iu;
        const b = a + 1;
        const c = a + (halfSegs + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    geom.setIndex(indices);
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(geom, isBack ? backMat : frontMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

/**
 * Extracts `Cloth_1` (123,500 vertices of simulated Marvelous Designer / CLO 3D cloth)
 * from `gltfShirtModel` and applies real-time anatomical vertex morphing for each garment type.
 */
function buildMorphedClothFromGLB(
  gltfShirtModel: THREE.Group,
  garmentId: string,
  category: string,
  materials: {
    frontMat: THREE.MeshStandardMaterial;
    backMat: THREE.MeshStandardMaterial;
    insideMat: THREE.MeshStandardMaterial;
    collarMat: THREE.MeshStandardMaterial;
    hoodMat: THREE.MeshStandardMaterial;
    sleeveLMat: THREE.MeshStandardMaterial;
    sleeveRMat: THREE.MeshStandardMaterial;
    cuffLMat: THREE.MeshStandardMaterial;
    cuffRMat: THREE.MeshStandardMaterial;
    sleeveStripeMat: THREE.MeshStandardMaterial;
    pocketMat: THREE.MeshStandardMaterial;
    placketMat: THREE.MeshStandardMaterial;
    drawstringMat: THREE.MeshStandardMaterial;
    zipperMat: THREE.MeshStandardMaterial;
  },
  scratchConfig?: ScratchConfig3D
): THREE.Group {
  const rootGroup = new THREE.Group();

  // Locate the upright, symmetrical Cloth_1 node directly
  const clothSource = gltfShirtModel.getObjectByName("Cloth_1") || gltfShirtModel;

  const id = garmentId.toLowerCase();
  const isScratch = id === "custom-scratch" && Boolean(scratchConfig);
  const rawParts = scratchConfig?.parts;
  const scParts: string[] = Array.isArray(rawParts)
    ? rawParts
    : rawParts && typeof rawParts === "object"
    ? Object.keys(rawParts).filter((k) => Boolean((rawParts as Record<string, boolean>)[k]))
    : [];

  const isTrackJacket =
    isScratch
      ? scratchConfig?.neckType === "stand" || scParts.includes("zipper")
      : category === "Outerwear" ||
        id.includes("jacket") ||
        id.includes("windbreaker") ||
        id.includes("varsity");
  const isHoodie =
    isScratch
      ? scratchConfig?.neckType === "hood" || scParts.includes("hood")
      : id.includes("hoodie");
  const isZipHoodie =
    isScratch
      ? scParts.includes("zipper")
      : id === "zip-hoodie";
  const isSweater = id === "crewneck" || id === "sweater";
  const isBlazer =
    isScratch
      ? scParts.includes("placket")
      : category === "Formalwear" ||
        id === "blazer" ||
        id === "suit-jacket" ||
        id === "trench";
  const isGown =
    isScratch
      ? (scratchConfig?.garmentLength || 605) >= 655 && (scratchConfig?.hipWidth || 148) >= 185
      : category === "Dresses" ||
        id.includes("gown") ||
        id.includes("dress") ||
        id === "skirt";
  const isLongSleeve =
    isScratch
      ? scratchConfig?.sleeveType === "long" ||
        scratchConfig?.sleeveType === "three-quarter" ||
        scratchConfig?.sleeveType === "bell"
      : isTrackJacket ||
        isHoodie ||
        isSweater ||
        isBlazer ||
        id === "tee-long" ||
        id === "hockey-jersey" ||
        id === "rugby-jersey" ||
        id === "quarter-zip" ||
        id === "dress-shirt";
  const isSleeveless =
    isScratch
      ? scratchConfig?.sleeveType === "sleeveless" || scratchConfig?.baseMode === "croquis"
      : id === "tank" ||
        id === "basketball-jersey" ||
        id === "slip-dress" ||
        id === "evening-gown";
  const isVNeck =
    isScratch
      ? scratchConfig?.neckType === "v" || scratchConfig?.neckType === "deepv"
      : id === "vneck-tee" || isBlazer || isGown;
  const isCropTop =
    isScratch
      ? (scratchConfig?.garmentLength || 605) <= 490
      : id === "crop-top";

  const hasSleeveStripes =
    isScratch
      ? scParts.includes("sleeveStripes")
      : id === "track-jacket" ||
        id === "varsity-jacket" ||
        id === "baseball-jersey" ||
        id === "football-jersey" ||
        id === "hockey-jersey" ||
        id === "soccer-jersey";

  const hasCuffs =
    isScratch
      ? scParts.includes("cuffs")
      : isTrackJacket ||
        isHoodie ||
        isSweater ||
        id === "tee-long" ||
        id === "polo" ||
        id === "baseball-jersey" ||
        id === "hockey-jersey" ||
        id === "soccer-jersey" ||
        id === "cycling-jersey" ||
        id === "rugby-jersey" ||
        id === "esports-jersey" ||
        id === "quarter-zip" ||
        isBlazer ||
        id === "dress-shirt";

  // Continuous sleeve extension multiplier for scratch designs (short=0, 3/4=0.55, long=1.0)
  const sleeveExtensionRatio = isScratch
    ? scratchConfig?.sleeveType === "three-quarter"
      ? 0.56
      : scratchConfig?.sleeveType === "cap"
      ? -0.35
      : 1.0
    : 1.0;
  const isBellSleeve = isScratch && scratchConfig?.sleeveType === "bell";

  // Anatomical fit multipliers per garment silhouette
  const torsoScaleX = isScratch
    ? (scratchConfig?.chestWidth || 148) / 148
    : isHoodie
    ? 1.06
    : isSweater
    ? 1.04
    : isGown
    ? 0.92
    : 1.0;
  const torsoScaleZ = isHoodie ? 1.08 : isSweater ? 1.05 : isGown ? 0.94 : 1.02;

  const morphedWrapper = new THREE.Group();

  clothSource.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const srcMesh = child as THREE.Mesh;
    const meshName = srcMesh.name;

    const isCollar = meshName === "Object_6" || meshName === "Object_8";
    const isFrontTorso =
      meshName === "Object_10" || meshName === "Object_11" || meshName === "Object_12";
    const isBackTorso =
      meshName === "Object_14" || meshName === "Object_15" || meshName === "Object_16";
    const isTorso = isFrontTorso || isBackTorso;
    const isSleeveL = meshName === "Object_18";
    const isSleeveR = meshName === "Object_20";
    const isSleeve = isSleeveL || isSleeveR;
    const isInside = meshName === "Object_11" || meshName === "Object_15";

    // Hide sleeves on sleeveless garments (Tank, Basketball Jersey, Evening Gown)
    if (isSleeve && isSleeveless) return;

    // Clone geometry for non-destructive real-time vertex morphing
    const geom = srcMesh.geometry.clone();
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const uvAttr = geom.attributes.uv as THREE.BufferAttribute | undefined;
    const count = posAttr.count;
    const vertexArmT = isSleeve ? new Float32Array(count) : null;

    // Track whether this vertex is in the wrist cuff zone (for track-jacket / hoodie / sweater)
    const hasRibbedCuff = isTrackJacket || isHoodie || isSweater;

    for (let i = 0; i < count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      const origX = x;
      const origY = y;
      const absX = Math.abs(x);
      const signX = x >= 0 ? 1 : -1;

      // Project exact 1:1 planar UV coordinates onto Front & Back Torso meshes
      // so every 2D zone color, cut panel, pocket, waistband, placket, and artwork layer maps accurately
      if (isTorso && !isInside && uvAttr) {
        const uCoord = isBackTorso
          ? Math.max(0.005, Math.min(0.995, 0.5 - origX / 0.416))
          : Math.max(0.005, Math.min(0.995, 0.5 + origX / 0.416));
        const vCoord = Math.max(0.005, Math.min(0.995, (1.629 - origY) / 0.693));
        uvAttr.setXY(i, uCoord, vCoord);
      }

      if (isSleeve && vertexArmT) {
        const seamX = 0.179 + 0.138 * Math.max(0, origY - 1.38);
        const distFromSeam = Math.max(0, absX - seamX);
        vertexArmT[i] = Math.min(1.12, distFromSeam / 0.112);
      }

      // ── A. SLEEVE VERTEX MORPHING (Short Sleeve -> Draped Long Cloth Sleeve) ──
      if (isSleeve && isLongSleeve) {
        // Exact armhole seam line on the shoulder: x_seam(y) = 0.179 + 0.138 * max(0, y - 1.380)
        const seamX = 0.179 + 0.138 * Math.max(0, y - 1.38);
        const distFromSeam = Math.max(0, absX - seamX);
        // Normalized parameter t along the arm from shoulder seam (t=0) to wrist cuff (t≈1)
        const t = Math.min(1.12, distFromSeam / 0.112);

        if (t > 0.001) {
          // Local offset from the original short-sleeve centerline
          const origCenterY = 1.485 - 0.075 * t;
          const origCenterZ = -0.028;
          const dyLocal = y - origCenterY;
          const dzLocal = z - origCenterZ;
          const angleAroundArm = Math.atan2(dzLocal, dyLocal);

          // Taper radius toward the wrist, with a soft blouson gather just above the cuff
          let radiusFactor = isBellSleeve
            ? 1.0 + 0.48 * Math.pow(Math.min(1, t), 1.35)
            : 1.0 - 0.22 * Math.pow(Math.min(1, t), 1.25);
          if (hasRibbedCuff && !isBellSleeve) {
            if (t > 0.78 && t <= 0.92) {
              // Soft fabric puff/blouson gather above ribbed wrist cuff
              radiusFactor += 0.09 * Math.sin(((t - 0.78) / 0.14) * Math.PI);
            } else if (t > 0.92) {
              // Snug elastic ribbed wrist cuff
              radiusFactor *= 0.82;
            }
          }

          // Multi-harmonic cloth folds at the elbow (t ≈ 0.5) and forearm
          const elbowFold =
            0.0055 *
            Math.sin(t * 19.0 + angleAroundArm * 2.0) *
            Math.sin(Math.min(1, t) * Math.PI);
          const sleeveLoft = isHoodie ? 1.12 : isSweater ? 1.08 : 1.0;

          // New central axis extending naturally down and outward to wrist level
          const newAbsX =
            seamX * torsoScaleX +
            distFromSeam +
            0.145 * sleeveExtensionRatio * Math.pow(t, 0.92) +
            Math.max(0, dyLocal) * 0.32 * Math.min(1, t);
          const newCenterY = origCenterY - 0.395 * sleeveExtensionRatio * Math.pow(t, 1.08);
          const newCenterZ =
            origCenterZ + 0.032 * sleeveExtensionRatio * Math.sin(Math.min(1, t) * Math.PI * 0.88);

          x = signX * newAbsX;
          y = newCenterY + dyLocal * radiusFactor * sleeveLoft + elbowFold;
          z = newCenterZ + dzLocal * radiusFactor * sleeveLoft + elbowFold * 0.7;
        } else {
          x *= torsoScaleX;
          z *= torsoScaleZ;
        }
      } else if (!isSleeve) {
        // ── B. TORSO & COLLAR ANATOMICAL MORPHING ──
        // Seam-aware horizontal scaling: keep armhole seam locked if long-sleeved
        const armholeLock =
          absX > 0.165 && y > 1.36 && y < 1.59
            ? 1.0
            : 1.0;
        x *= torsoScaleX * armholeLock;
        z *= torsoScaleZ;

        // 1. Track Jacket / Windbreaker Stand-Up Athletic Collar & Gathered Elastic Hem
        if (isTrackJacket) {
          if (isCollar || (y > 1.55 && absX < 0.13)) {
            const collarLift = isCollar
              ? 0.046
              : 0.046 * Math.max(0, (y - 1.55) / 0.08);
            y += collarLift;
            // Slight inward taper at top of stand collar
            const neckTaper = isCollar ? 0.93 : 1.0;
            x *= neckTaper;
            z *= neckTaper;
          }
          // Gathered blouson billow just above the elastic waistband hem (y in [0.94, 1.06])
          if (isTorso && y < 1.07) {
            const hemT = Math.max(0, (1.07 - y) / 0.13); // 0 at 1.07, 1 at 0.94 hem
            const gatherWave =
              0.004 * Math.sin( Math.atan2(z, x) * 14.0 ) * Math.sin(hemT * Math.PI);
            const blousonPuff = 0.011 * Math.sin(hemT * Math.PI);
            const waistSnug = hemT > 0.75 ? -0.012 * ((hemT - 0.75) / 0.25) : 0;
            const radialDelta = blousonPuff + gatherWave + waistSnug;
            const r = Math.hypot(x, z) || 1;
            x += (x / r) * radialDelta;
            z += (z / r) * radialDelta;
          }
          // Center-front stitched zipper welt channel along |x| < 0.014
          if (isFrontTorso && absX < 0.015 && z > 0) {
            if (absX < 0.0045) {
              z -= 0.003; // Recessed zipper teeth channel
            } else {
              z += 0.0032 * Math.sin(((absX - 0.0045) / 0.0105) * Math.PI); // Raised stitched welt lip
            }
          }
        }

        // 2. Hoodie Heavyweight Fleece Drape & Ribbed Hem Gather
        if (isHoodie && isTorso && y < 1.08) {
          const hemT = Math.max(0, (1.08 - y) / 0.14);
          const fleeceBillow = 0.014 * Math.sin(hemT * Math.PI);
          const cuffTaper = hemT > 0.72 ? -0.015 * ((hemT - 0.72) / 0.28) : 0;
          const r = Math.hypot(x, z) || 1;
          x += (x / r) * (fleeceBillow + cuffTaper);
          z += (z / r) * (fleeceBillow + cuffTaper);
        }

        // 3. Crewneck Sweater Thick Ribbed Collar & Knit Hem
        if (isSweater) {
          if (isCollar) {
            y += 0.016;
            x *= 0.95;
            z *= 0.95;
          }
          if (isTorso && y < 1.06) {
            const hemT = Math.max(0, (1.06 - y) / 0.12);
            const r = Math.hypot(x, z) || 1;
            const delta = 0.009 * Math.sin(hemT * Math.PI) - (hemT > 0.75 ? 0.01 : 0);
            x += (x / r) * delta;
            z += (z / r) * delta;
          }
        }

        // 4. Tailored Blazer / Coat Structured Shoulders, Waist Suppression & Elongated Skirt Hem
        if (isBlazer) {
          // Structured shoulder pad lift
          if (absX > 0.13 && y > 1.48) {
            y += 0.018 * ((absX - 0.13) / 0.08);
          }
          // Tailored waist suppression (y in [1.14, 1.36])
          if (y > 1.12 && y < 1.38) {
            const waistFactor = Math.sin(((y - 1.12) / 0.26) * Math.PI);
            x *= 1.0 - 0.065 * waistFactor;
          }
          // Elongated tailored jacket hem below waist (y < 1.15 stretched down to 0.84)
          if (y < 1.15) {
            const dropT = (1.15 - y) / 0.21;
            y -= 0.095 * dropT;
            // Subtle tailored hip flare
            x *= 1.0 + 0.04 * dropT;
            // Classic blazer center-front cutaway split below bottom button (y < 1.02)
            if (isFrontTorso && z > 0 && absX < 0.035 && dropT > 0.55) {
              y += 0.035 * (1 - absX / 0.035) * ((dropT - 0.55) / 0.45);
            }
          }
        }

        // 5. V-Neck Plunge (for vneck-tee, blazer, evening-gown)
        if (isVNeck && z > 0 && y > 1.44 && absX < 0.085) {
          const vFactor = 1.0 - absX / 0.085;
          const vDepth = isBlazer ? 0.11 : isGown ? 0.095 : 0.075;
          y -= vDepth * Math.pow(vFactor, 1.35) * Math.max(0, (y - 1.44) / 0.19);
        }

        // 6. Evening Gown / Dress Cinched Bodice Waist
        if (isGown) {
          if (y > 1.12 && y < 1.38) {
            const cinch = Math.sin(((y - 1.12) / 0.26) * Math.PI);
            x *= 1.0 - 0.14 * cinch;
            z *= 1.0 - 0.10 * cinch;
          }
          // Tuck lower bodice edge cleanly into the pleated skirt waist at y = 1.15
          if (y < 1.15) {
            const tSkirt = (1.15 - y) / 0.21;
            const rScale = 0.88 + 0.22 * tSkirt;
            x *= rScale;
            z *= rScale;
          }
        }

        // 7. Crop Top High Hemline
        if (isCropTop && y < 1.30) {
          const cropT = (1.30 - y) / 0.36;
          y = 1.30 - cropT * 0.14 + 0.005 * Math.sin(absX * 45);
        }

        // 8. Sleeveless Tank / Basketball Jersey Narrowed Shoulder Straps
        if (isSleeveless && y > 1.36 && absX > 0.13) {
          const strapInward = Math.min(0.045, (absX - 0.13) * 0.52);
          x -= signX * strapInward;
        }

        // 9. Parametric Custom Scratch Waist Taper, Hip Flare & Hem Length
        if (isScratch && scratchConfig) {
          const waistRatio = (scratchConfig.waistWidth || 136) / 136;
          const hipRatio = (scratchConfig.hipWidth || 148) / 148;
          const lenDelta = ((scratchConfig.garmentLength || 605) - 605) / 600;

          if (y > 1.10 && y < 1.38) {
            const wWeight = Math.sin(((y - 1.10) / 0.28) * Math.PI);
            const wFactor = 1.0 + (waistRatio - 1.0) * wWeight;
            x *= wFactor;
            z *= 1.0 + (waistRatio - 1.0) * 0.65 * wWeight;
          }
          if (y <= 1.18) {
            const hWeight = Math.max(0, (1.18 - y) / 0.24);
            const hFactor = 1.0 + (hipRatio - 1.0) * hWeight;
            x *= hFactor;
            z *= 1.0 + (hipRatio - 1.0) * 0.7 * hWeight;
            y -= lenDelta * hWeight * 0.55;
          }
          if (scratchConfig.neckType === "scoop" && y > 1.48 && absX < 0.11) {
            const scoop = Math.cos((absX / 0.11) * (Math.PI / 2));
            y -= 0.055 * scoop * Math.max(0, (y - 1.48) / 0.15);
          }
        }
      }

      posAttr.setXYZ(i, x, y, z);
    }

    posAttr.needsUpdate = true;
    if (uvAttr) uvAttr.needsUpdate = true;
    geom.computeVertexNormals();

    // Assign tactile PBR cloth material(s) by exact 2D anatomical zone
    let mat: THREE.Material | THREE.Material[] = materials.frontMat;
    if (isInside) {
      mat = materials.insideMat;
    } else if (meshName === "Object_10" || meshName === "Object_12") {
      mat = materials.frontMat;
    } else if (meshName === "Object_14" || meshName === "Object_16") {
      mat = materials.backMat;
    } else if (isCollar) {
      mat = materials.collarMat;
    } else if (isSleeve && vertexArmT && geom.index) {
      // Partition sleeve triangles into 3 material groups:
      // Group 0: Main Sleeve (`sleeveL` or `sleeveR`)
      // Group 1: Wrist Cuff (`cuffL` or `cuffR`)
      // Group 2: Athletic Sleeve Stripes (`sleeveStripe`)
      const idxArr = geom.index.array;
      const mainTris: number[] = [];
      const cuffTris: number[] = [];
      const stripeTris: number[] = [];

      for (let f = 0; f < idxArr.length; f += 3) {
        const a = idxArr[f];
        const b = idxArr[f + 1];
        const c = idxArr[f + 2];
        const tAvg = (vertexArmT[a] + vertexArmT[b] + vertexArmT[c]) / 3;

        if (hasCuffs && tAvg > 0.80) {
          cuffTris.push(a, b, c);
        } else if (
          hasSleeveStripes &&
          ((tAvg >= 0.24 && tAvg <= 0.36) || (tAvg >= 0.44 && tAvg <= 0.56))
        ) {
          stripeTris.push(a, b, c);
        } else {
          mainTris.push(a, b, c);
        }
      }

      const reordered = new Uint32Array(
        mainTris.length + cuffTris.length + stripeTris.length
      );
      reordered.set(mainTris, 0);
      reordered.set(cuffTris, mainTris.length);
      reordered.set(stripeTris, mainTris.length + cuffTris.length);
      geom.setIndex(new THREE.BufferAttribute(reordered, 1));
      geom.clearGroups();
      geom.addGroup(0, mainTris.length, 0);
      if (cuffTris.length > 0) {
        geom.addGroup(mainTris.length, cuffTris.length, 1);
      }
      if (stripeTris.length > 0) {
        geom.addGroup(
          mainTris.length + cuffTris.length,
          stripeTris.length,
          2
        );
      }

      mat = [
        isSleeveL ? materials.sleeveLMat : materials.sleeveRMat,
        isSleeveL ? materials.cuffLMat : materials.cuffRMat,
        materials.sleeveStripeMat,
      ];
    } else if (isSleeve) {
      mat = isSleeveL ? materials.sleeveLMat : materials.sleeveRMat;
    }

    const morphedMesh = new THREE.Mesh(geom, mat);
    morphedMesh.name = meshName;
    morphedMesh.castShadow = true;
    morphedMesh.receiveShadow = true;
    morphedWrapper.add(morphedMesh);
  });

  // ── C. ADD GARMENT-SPECIFIC CONTOURED 3D CLOTH DETAILS ──
  if (isTrackJacket || isZipHoodie) {
    const zipTop = isTrackJacket ? 1.645 : 1.565;
    const zipperGroup = buildContouredZipper(
      0.955,
      zipTop,
      torsoScaleX,
      torsoScaleZ,
      materials.zipperMat,
      materials.zipperMat
    );
    morphedWrapper.add(zipperGroup);
  }

  if (isHoodie) {
    // Draped cloth hood rising from the neckline
    const hoodGroup = buildDrapedClothHood(materials.hoodMat);
    morphedWrapper.add(hoodGroup);

    // Hanging braided drawstrings with metal aglets
    const cordsGroup = buildHoodieDrawstrings(
      torsoScaleZ,
      materials.drawstringMat,
      materials.zipperMat
    );
    morphedWrapper.add(cordsGroup);

    // Contoured kangaroo front pouch pocket
    if (!isScratch || scParts.includes("pocket")) {
      const pocketMesh = buildContouredKangarooPocket(
        torsoScaleX,
        torsoScaleZ,
        materials.pocketMat
      );
      morphedWrapper.add(pocketMesh);
    }
  } else if (isScratch && scParts.includes("pocket")) {
    const pocketMesh = buildContouredKangarooPocket(
      torsoScaleX,
      torsoScaleZ,
      materials.pocketMat
    );
    morphedWrapper.add(pocketMesh);
  }

  if (isBlazer) {
    const lapelsAndButtons = buildTailoredLapelsAndButtons(
      torsoScaleX,
      torsoScaleZ,
      materials.collarMat,
      materials.placketMat
    );
    morphedWrapper.add(lapelsAndButtons);
  }

  if (isGown) {
    const skirtGroup = buildDrapedSkirtMesh(
      materials.frontMat,
      materials.backMat,
      id === "skirt"
    );
    morphedWrapper.add(skirtGroup);
  }

  // Center and scale `Cloth_1` (raw Y bounds: 0.936..1.638, center Y = 1.287)
  // so it fills the 3D studio viewport with commanding presence
  const scale = isGown ? 1.85 : isBlazer ? 2.15 : 2.32;
  const centerY = isGown ? 1.05 : isBlazer ? 1.22 : 1.285;
  morphedWrapper.scale.set(scale, scale, scale);
  morphedWrapper.position.set(0, -centerY * scale + 0.05, 0);

  rootGroup.add(morphedWrapper);
  return rootGroup;
}

interface BottomMaterials {
  frontMat: THREE.Material;
  backMat: THREE.Material;
  insideMat: THREE.Material;
  waistMat: THREE.Material;
  pocketMat: THREE.Material;
  placketMat: THREE.Material;
  yokeMat: THREE.Material;
  cuffMat: THREE.Material;
  collarMat: THREE.Material;
  trimMat: THREE.Material;
  metalMat: THREE.Material;
}

/**
 * High-density 3D Draped Cloth Trousers / Original 5-Pocket Selvedge Denim Jeans / Joggers / Shorts Builder.
 * Features a dedicated 3D Original 5-Pocket Denim Jeans architecture with:
 * - 1:1 planar UV mapping (`viewBox="115 145 370 525"`) so every 2D piece & color maps accurately
 * - Tailored flat-felled denim waistband + 7 raised 3D belt loops + inner waistband lining
 * - Antique brass shank tack button + contoured 3D J-stitch zipper fly placket
 * - Curved front scoop pocket welts + 5th coin/watch pocket + 10 metallic copper burrs/rivets
 * - Back Western V-yoke panel + dual 3D 5-point spade patch pockets with double-arcuate gold stitching + red selvedge tab
 * - Saddle-tan leather Jacron brand patch on back-right waistband
 * - Raised 3D outseam selvedge welts + rolled chain-stitched selvedge turn-up ankle cuffs with red-line ID
 */
function buildDrapedBottomsMesh(
  garmentId: string,
  mats: BottomMaterials
): THREE.Group {
  const {
    frontMat,
    backMat,
    insideMat,
    waistMat,
    pocketMat,
    placketMat,
    yokeMat,
    cuffMat,
    collarMat,
    trimMat,
    metalMat,
  } = mats;

  const group = new THREE.Group();
  const id = garmentId.toLowerCase();
  const isJeans = id.includes("jeans") || id.includes("denim");
  const isShorts = id.includes("shorts");
  const isJoggers = id.includes("joggers");
  const hasDrawstring = id.includes("drawstring");

  const yWaistTop = 0.72;
  const yWaistBot = 0.58;
  // Modern baggy jeans run full-length and stack over the shoe
  const yAnkle = isShorts ? -0.18 : isJeans ? -1.04 : -0.92;

  // Modern tonal tan denim topstitching & antique hardware materials for Jeans
  const goldStitchMat = new THREE.MeshStandardMaterial({
    name: "mat_denim_stitch",
    color: new THREE.Color("#C9A877"),
    roughness: 0.7,
    metalness: 0.0,
  });

  const copperRivetMat = new THREE.MeshStandardMaterial({
    name: "mat_copper_rivet",
    color: new THREE.Color("#B87333"),
    roughness: 0.32,
    metalness: 0.8,
  });

  const brassButtonMat = new THREE.MeshStandardMaterial({
    name: "mat_brass_button",
    color: new THREE.Color("#A8A29E"),
    roughness: 0.3,
    metalness: 0.85,
  });

  const brandTabMat = new THREE.MeshStandardMaterial({
    name: "mat_brand_tab",
    color: new THREE.Color("#DC2626"),
    roughness: 0.5,
    metalness: 0.05,
  });

  // Helper to evaluate waist ellipse radius at angle theta and normalized waist vertical v in [0, 1]
  const evalWaistRadius = (theta: number, v: number) => {
    const gather = isJeans
      ? 0.0008 * Math.sin(theta * 8) // Crisp tailored flat-felled denim waistband
      : 0.0045 * Math.sin(theta * 24) * Math.sin(v * Math.PI); // Elastic gathered jogger waistband
    const rx = (isJeans ? 0.352 : 0.36) + 0.014 * v + gather;
    const rz = (isJeans ? 0.244 : 0.25) + 0.012 * v + gather;
    return { rx, rz };
  };

  // 1. Tailored Denim / Elastic Waistband + Interior Waistband Lining Ring
  const waistSegsU = 64;
  const waistSegsV = 14;
  const waistGeom = new THREE.BufferGeometry();
  const wPos: number[] = [];
  const wUvs: number[] = [];
  const wIdx: number[] = [];

  for (let iv = 0; iv <= waistSegsV; iv++) {
    const v = iv / waistSegsV;
    const y = yWaistTop - v * (yWaistTop - yWaistBot);
    for (let iu = 0; iu <= waistSegsU; iu++) {
      const u = iu / waistSegsU;
      const theta = u * Math.PI * 2;
      const { rx, rz } = evalWaistRadius(theta, v);
      wPos.push(Math.sin(theta) * rx, y, Math.cos(theta) * rz);
      wUvs.push(u, v);
    }
  }
  for (let iv = 0; iv < waistSegsV; iv++) {
    for (let iu = 0; iu < waistSegsU; iu++) {
      const a = iv * (waistSegsU + 1) + iu;
      const b = a + 1;
      const c = a + (waistSegsU + 1);
      const d = c + 1;
      wIdx.push(a, c, b, b, c, d);
    }
  }
  waistGeom.setIndex(wIdx);
  waistGeom.setAttribute("position", new THREE.Float32BufferAttribute(wPos, 3));
  waistGeom.setAttribute("uv", new THREE.Float32BufferAttribute(wUvs, 2));
  waistGeom.computeVertexNormals();
  const waistMesh = new THREE.Mesh(waistGeom, waistMat);
  waistMesh.castShadow = true;
  waistMesh.receiveShadow = true;
  group.add(waistMesh);

  // Inner waistband lining + upper folded lip so viewing from above looks like real heavy tailoring
  const innerWaistGeom = new THREE.BufferGeometry();
  const iwPos: number[] = [];
  const iwIdx: number[] = [];
  for (let iv = 0; iv <= 6; iv++) {
    const v = iv / 6;
    const y = yWaistTop - v * (yWaistTop - yWaistBot * 0.96);
    for (let iu = 0; iu <= waistSegsU; iu++) {
      const u = iu / waistSegsU;
      const theta = u * Math.PI * 2;
      const { rx, rz } = evalWaistRadius(theta, v);
      const inset = 0.008 * Math.sin(v * Math.PI * 0.85);
      iwPos.push(Math.sin(theta) * (rx - inset), y, Math.cos(theta) * (rz - inset));
    }
  }
  for (let iv = 0; iv < 6; iv++) {
    for (let iu = 0; iu < waistSegsU; iu++) {
      const a = iv * (waistSegsU + 1) + iu;
      const b = a + 1;
      const c = a + (waistSegsU + 1);
      const d = c + 1;
      iwIdx.push(a, b, c, b, d, c);
    }
  }
  innerWaistGeom.setIndex(iwIdx);
  innerWaistGeom.setAttribute("position", new THREE.Float32BufferAttribute(iwPos, 3));
  innerWaistGeom.computeVertexNormals();
  group.add(new THREE.Mesh(innerWaistGeom, insideMat));

  // Helper to evaluate a point on the leg/pelvic surface at (side, v, theta, isBack)
  const evalLegSurfacePoint = (
    side: number,
    v: number,
    theta: number,
    isBack: boolean,
    radialOffset: number = 0
  ) => {
    const y = yWaistBot - v * (yWaistBot - yAnkle);
    const legSplit = Math.pow(Math.min(1, v / 0.24), 0.75);
    // Wide-leg jeans splay slightly outward so the straight legs hang apart like the reference fits
    const centerX = side * (0.092 + 0.094 * legSplit + (isJeans ? 0.03 : 0.022) * v);
    const centerZ =
      !isShorts && v > 0.35 && v < 0.75
        ? (isJeans ? 0.01 : 0.018) * Math.sin(((v - 0.35) / 0.4) * Math.PI)
        : 0;

    // Baggy wide-leg: almost no taper from thigh to hem (vs. tapered joggers)
    let rx = isJeans
      ? 0.184 * (1 - 0.07 * Math.pow(v, 0.9))
      : 0.185 * (1 - 0.32 * Math.pow(v, 0.9));
    let rz = isJeans
      ? 0.214 * (1 - 0.14 * Math.pow(v, 0.9))
      : 0.215 * (1 - 0.36 * Math.pow(v, 0.9));

    if (isShorts) {
      rx = 0.195 + 0.015 * v;
      rz = 0.215 + 0.01 * v;
    } else if (isJoggers && v > 0.82) {
      if (v < 0.93) {
        const puff = 0.018 * Math.sin(((v - 0.82) / 0.11) * Math.PI);
        rx += puff;
        rz += puff;
      } else {
        rx *= 0.78;
        rz *= 0.78;
      }
    } else if (isJeans && v > 0.88) {
      // Hem flares a touch where the extra length pools on the shoe
      const flare = 0.012 * Math.pow((v - 0.88) / 0.12, 1.4);
      rx += flare;
      rz += flare * 0.6;
    }

    // Seat/hip fill: blend the upper legs out to the waistband ellipse so there is no ledge
    // under the waistband (relaxed seat → hips → straight legs).
    const hipBlend = Math.pow(Math.max(0, 1 - v / 0.27), 1.6);
    const hipRxTarget = (isJeans ? 0.366 : 0.372) - 0.092;
    const hipRzTarget = isJeans ? 0.262 : 0.266;
    rx += Math.max(0, hipRxTarget - rx) * hipBlend;
    rz += Math.max(0, hipRzTarget - rz) * hipBlend;

    let totalOffset = radialOffset;
    if (isJeans) {
      // Long vertical drape folds of heavy relaxed denim (grow toward the hem)
      const verticalFolds =
        (0.0025 + 0.0085 * Math.pow(v, 1.2)) *
        Math.sin(theta * 4 + side * 1.1 + v * 1.8) *
        (v > 0.05 ? 1 : v / 0.05);
      // Soft crotch/upper-thigh pull lines on the front
      const thighPull =
        !isBack && v > 0.16 && v < 0.34
          ? 0.0035 * Math.sin((v - 0.16) * 60 + Math.cos(theta) * 2) *
            Math.sin(((v - 0.16) / 0.18) * Math.PI) *
            Math.max(0, -side * Math.sin(theta))
          : 0;
      // Stacked hem: horizontal compression rings where the length breaks over the shoe
      const stack =
        v > 0.8
          ? 0.0105 *
            Math.sin((v - 0.8) * 88 + theta * 1.3 + side) *
            Math.pow((v - 0.8) / 0.2, 0.9) *
            (v > 0.985 ? (1 - v) / 0.015 : 1)
          : 0;
      totalOffset += verticalFolds + thighPull + stack;
    } else {
      // Knee articulation & ankle breaks for joggers / leggings / shorts
      const kneeFold =
        !isShorts && v > 0.38 && v < 0.65
          ? 0.0062 *
            Math.sin((v - 0.38) * 44 + Math.cos(theta * 2) * 1.4) *
            Math.sin(((v - 0.38) / 0.27) * Math.PI)
          : 0;
      const ankleFold =
        !isShorts && v > 0.72 && v < 0.93
          ? 0.0048 * Math.sin(v * 56 + theta * 2) * Math.sin(((v - 0.72) / 0.21) * Math.PI)
          : 0;
      const verticalDrape = 0.0028 * Math.sin(theta * 6 + v * 3);
      totalOffset += kneeFold + ankleFold + verticalDrape;
    }

    let x = centerX + Math.sin(theta) * (rx + totalOffset);
    const z = centerZ + Math.cos(theta) * (rz + totalOffset);

    // Fuse inner pelvic rise seam above the crotch (v < 0.24) so front & back seat are seamless
    if (v < 0.24 && side * x < 0.025) {
      const blend = 1 - v / 0.24;
      x = x * (1 - blend);
    }

    return new THREE.Vector3(x, y, z);
  };

  // 2. Left & Right Draped Cloth Legs with 1:1 Planar UV Projection (`viewBox="115 145 370 525"`)
  const uSegs = 56;
  const vSegs = 64;

  for (const side of [-1, 1]) {
    for (const isBack of [false, true]) {
      const geom = new THREE.BufferGeometry();
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      const halfSegs = uSegs / 2;
      for (let iv = 0; iv <= vSegs; iv++) {
        const v = iv / vSegs;
        for (let iu = 0; iu <= halfSegs; iu++) {
          const u = iu / halfSegs;
          const theta = isBack
            ? Math.PI / 2 + u * Math.PI
            : -Math.PI / 2 + u * Math.PI;

          const pt = evalLegSurfacePoint(side, v, theta, isBack, 0);
          positions.push(pt.x, pt.y, pt.z);

          // 1:1 Planar UV Mapping matching `render3DTextureSVG` (`viewBox="115 145 370 525"`)
          // 2D jeans: waistband bottom Y=182, crotch Y=344, hem Y=664 → piecewise map so the
          // pockets, fly, yoke, crotch and hem land exactly where they are drawn in 2D.
          // On the back view (`isBack`), mirror X so left/right back pockets & brand patch align properly.
          const planarX = isBack ? -pt.x : pt.x;
          const svgX = 300 + (planarX / 0.365) * 145;
          const svgY = isJeans
            ? v < 0.24
              ? 182 + (v / 0.24) * 162
              : 344 + ((v - 0.24) / 0.76) * 320
            : 180 + v * 478;
          const uvU = Math.max(0.01, Math.min(0.99, (svgX - 115) / 370));
          const uvV = Math.max(0.01, Math.min(0.99, (svgY - 145) / 525));
          uvs.push(uvU, uvV);
        }
      }

      for (let iv = 0; iv < vSegs; iv++) {
        for (let iu = 0; iu < halfSegs; iu++) {
          const a = iv * (halfSegs + 1) + iu;
          const b = a + 1;
          const c = a + (halfSegs + 1);
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }

      geom.setIndex(indices);
      geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geom.computeVertexNormals();

      const legMesh = new THREE.Mesh(geom, isBack ? backMat : frontMat);
      legMesh.castShadow = true;
      legMesh.receiveShadow = true;
      group.add(legMesh);
    }
  }

  // 3. Modern Baggy Wide-Leg 5-Pocket Denim Jeans Architecture & Hardware
  if (isJeans) {
    // Helper to add a small low-profile copper rivet at a surface position & normal
    const addCopperRivet = (pos: THREE.Vector3, normalDir: THREE.Vector3) => {
      const rivetGroup = new THREE.Group();
      const baseWasher = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0055, 0.006, 0.0025, 14),
        copperRivetMat
      );
      baseWasher.rotation.x = Math.PI / 2;
      rivetGroup.add(baseWasher);

      const centerBurr = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0024, 0.0028, 0.004, 10),
        copperRivetMat
      );
      centerBurr.rotation.x = Math.PI / 2;
      centerBurr.position.z = 0.001;
      rivetGroup.add(centerBurr);

      rivetGroup.position.copy(pos);
      rivetGroup.lookAt(pos.clone().add(normalDir));
      group.add(rivetGroup);
    };

    // Helper to build a conformal 3D tube stitch along a list of 3D points
    // (fine tonal thread: radii are scaled down for a clean modern finish)
    const addStitchTube = (
      pts: THREE.Vector3[],
      radius: number = 0.0022,
      mat: THREE.Material = goldStitchMat
    ) => {
      if (pts.length < 2) return;
      const curve = new THREE.CatmullRomCurve3(pts);
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(12, pts.length * 4), radius * 0.62, 5, false),
        mat
      );
      group.add(mesh);
    };

    // 3A. Top & Bottom Waistband Tobacco-Gold Chain-Stitching Rings
    for (const vRing of [0.08, 0.92]) {
      const ringPts: THREE.Vector3[] = [];
      const y = yWaistTop - vRing * (yWaistTop - yWaistBot);
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        const { rx, rz } = evalWaistRadius(theta, vRing);
        ringPts.push(
          new THREE.Vector3(
            Math.sin(theta) * (rx + 0.0022),
            y,
            Math.cos(theta) * (rz + 0.0022)
          )
        );
      }
      addStitchTube(ringPts, 0.002, goldStitchMat);
    }

    // 3B. 7 Raised 3D Denim Belt Loops around the Waistband (2 Front, 2 Side, 2 Back-Hip, 1 Center-Back)
    const beltLoopAngles = [-0.42, 0.42, -1.38, 1.38, -2.36, 2.36, Math.PI];
    for (const theta of beltLoopAngles) {
      const loopCurvePts: THREE.Vector3[] = [];
      const loopStitchLPts: THREE.Vector3[] = [];
      const loopStitchRPts: THREE.Vector3[] = [];

      for (let iv = 0; iv <= 8; iv++) {
        const t = iv / 8;
        const y = yWaistTop + 0.006 - t * (yWaistTop - yWaistBot + 0.022);
        const vClamped = Math.max(0, Math.min(1, t));
        const { rx, rz } = evalWaistRadius(theta, vClamped);
        // Arch outward in the middle so a belt can pass underneath
        const archOut = 0.004 + 0.0085 * Math.sin(t * Math.PI);
        loopCurvePts.push(
          new THREE.Vector3(
            Math.sin(theta) * (rx + archOut),
            y,
            Math.cos(theta) * (rz + archOut)
          )
        );
        loopStitchLPts.push(
          new THREE.Vector3(
            Math.sin(theta - 0.022) * (rx + archOut + 0.0015),
            y,
            Math.cos(theta - 0.022) * (rz + archOut + 0.0015)
          )
        );
        loopStitchRPts.push(
          new THREE.Vector3(
            Math.sin(theta + 0.022) * (rx + archOut + 0.0015),
            y,
            Math.cos(theta + 0.022) * (rz + archOut + 0.0015)
          )
        );
      }

      const loopCurve = new THREE.CatmullRomCurve3(loopCurvePts);
      const loopMesh = new THREE.Mesh(
        new THREE.TubeGeometry(loopCurve, 14, 0.0085, 8, false),
        waistMat
      );
      loopMesh.scale.set(1.15, 1.0, 0.65);
      loopMesh.castShadow = true;
      group.add(loopMesh);

      addStitchTube(loopStitchLPts, 0.0016, goldStitchMat);
      addStitchTube(loopStitchRPts, 0.0016, goldStitchMat);
    }

    // 3C. Center-Front Antique Brass Shank Tack Button (`theta = 0.05`, `y = 0.65`)
    {
      const { rx, rz } = evalWaistRadius(0.04, 0.5);
      const btnPos = new THREE.Vector3(Math.sin(0.04) * rx, 0.65, Math.cos(0.04) * rz);

      const shank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.012, 12),
        copperRivetMat
      );
      shank.rotation.x = Math.PI / 2;
      shank.position.copy(btnPos).add(new THREE.Vector3(0, 0, 0.004));
      group.add(shank);

      const buttonCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.019, 0.019, 0.0055, 24),
        brassButtonMat
      );
      buttonCap.rotation.x = Math.PI / 2;
      buttonCap.position.copy(btnPos).add(new THREE.Vector3(0, 0, 0.01));
      group.add(buttonCap);

      const buttonRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.0145, 0.0022, 10, 24),
        copperRivetMat
      );
      buttonRim.position.copy(btnPos).add(new THREE.Vector3(0, 0, 0.013));
      group.add(buttonRim);
    }

    // 3D. Contoured 3D Center-Front J-Stitch Zipper Fly Placket (`v = 0.0` to `0.21`)
    {
      const flyGeom = new THREE.BufferGeometry();
      const fPos: number[] = [];
      const fIdx: number[] = [];
      const rows = 16;
      const cols = 8;

      for (let r = 0; r <= rows; r++) {
        const t = r / rows;
        const v = t * 0.205;
        const y = yWaistBot - v * (yWaistBot - yAnkle);
        // J-curve width narrows at the bottom of the fly
        const jCurve = t > 0.72 ? Math.pow((t - 0.72) / 0.28, 1.6) : 0;
        const xLeft = -0.044 + 0.044 * jCurve;
        const xRight = 0.008;

        for (let c = 0; c <= cols; c++) {
          const u = c / cols;
          const x = xLeft + u * (xRight - xLeft);
          const zBase = 0.254 + 0.012 * (v / 0.22);
          const zBump = 0.0045 * Math.sin(u * Math.PI);
          fPos.push(x, y, zBase + zBump);
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = r * (cols + 1) + c;
          const b = a + 1;
          const c0 = a + (cols + 1);
          const d = c0 + 1;
          fIdx.push(a, c0, b, b, c0, d);
        }
      }
      flyGeom.setIndex(fIdx);
      flyGeom.setAttribute("position", new THREE.Float32BufferAttribute(fPos, 3));
      flyGeom.computeVertexNormals();
      group.add(new THREE.Mesh(flyGeom, placketMat));

      // Double-needle tobacco gold J-stitch lines + center rise seam
      for (const offset of [0, 0.0055]) {
        const jPts: THREE.Vector3[] = [];
        for (let r = 0; r <= 18; r++) {
          const t = r / 18;
          const v = t * 0.205;
          const y = yWaistBot - v * (yWaistBot - yAnkle);
          const jCurve = t > 0.68 ? Math.pow((t - 0.68) / 0.32, 1.8) : 0;
          const x = -0.042 + offset + (0.042 - offset) * jCurve;
          const z = 0.258 + 0.012 * (v / 0.22);
          jPts.push(new THREE.Vector3(x, y, z));
        }
        addStitchTube(jPts, 0.0019, goldStitchMat);
      }

      // Center-front rise seam from waist down to crotch
      const risePts: THREE.Vector3[] = [];
      for (let r = 0; r <= 16; r++) {
        const v = (r / 16) * 0.235;
        const y = yWaistBot - v * (yWaistBot - yAnkle);
        const z = 0.258 + 0.01 * (v / 0.24) - (v > 0.18 ? (v - 0.18) * 0.25 : 0);
        risePts.push(new THREE.Vector3(0.004, y, z));
      }
      addStitchTube(risePts, 0.002, goldStitchMat);
    }

    // 3E. 3D Front Curved Scoop Pocket Welts (Left & Right) + Right 5th Coin/Watch Pocket + 6 Copper Rivets
    for (const side of [-1, 1]) {
      const scoopPts1: THREE.Vector3[] = [];
      const scoopPts2: THREE.Vector3[] = [];
      const steps = 16;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Scoop curves from upper front waist (`v = 0.005`, inner hip) to outer hip (`v = 0.105`)
        const v1 = 0.005 + 0.098 * Math.pow(t, 1.35);
        const v2 = v1 + 0.009;
        const theta = side * (0.22 + t * 0.72);

        const p1 = evalLegSurfacePoint(side, v1, theta, false, 0.0055);
        const p2 = evalLegSurfacePoint(side, v2, theta, false, 0.0045);
        scoopPts1.push(p1);
        scoopPts2.push(p2);
      }

      // Raised denim pocket lip tube + double-needle gold scoop topstitching
      addStitchTube(scoopPts1, 0.0042, pocketMat);
      addStitchTube(scoopPts1, 0.0022, goldStitchMat);
      addStitchTube(scoopPts2, 0.0019, goldStitchMat);

      // Copper Rivets at inner-top and outer-bottom stress points of each front scoop pocket
      const topRivetPos = evalLegSurfacePoint(side, 0.012, side * 0.25, false, 0.006);
      const botRivetPos = evalLegSurfacePoint(side, 0.102, side * 0.92, false, 0.006);
      addCopperRivet(topRivetPos, new THREE.Vector3(side * 0.35, 0.1, 0.92).normalize());
      addCopperRivet(botRivetPos, new THREE.Vector3(side * 0.85, 0.05, 0.52).normalize());
    }

    // 5th Coin / Watch Pocket nested inside the Right-Front Scoop Pocket (`side = -1`)
    {
      const coinGeom = new THREE.BufferGeometry();
      const cPos: number[] = [];
      const cIdx: number[] = [];
      const rows = 8;
      const cols = 8;

      for (let r = 0; r <= rows; r++) {
        const v = 0.025 + (r / rows) * 0.058;
        for (let c = 0; c <= cols; c++) {
          const theta = -0.42 - (c / cols) * 0.36;
          const pt = evalLegSurfacePoint(-1, v, theta, false, 0.0055);
          cPos.push(pt.x, pt.y, pt.z);
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = r * (cols + 1) + c;
          const b = a + 1;
          const c0 = a + (cols + 1);
          const d = c0 + 1;
          cIdx.push(a, c0, b, b, c0, d);
        }
      }
      coinGeom.setIndex(cIdx);
      coinGeom.setAttribute("position", new THREE.Float32BufferAttribute(cPos, 3));
      coinGeom.computeVertexNormals();
      group.add(new THREE.Mesh(coinGeom, pocketMat));

      // Gold topstitch along the top edge of the 5th coin pocket + 2 copper corner rivets
      const coinTopPts: THREE.Vector3[] = [];
      for (let c = 0; c <= 8; c++) {
        const theta = -0.42 - (c / 8) * 0.36;
        coinTopPts.push(evalLegSurfacePoint(-1, 0.027, theta, false, 0.007));
      }
      addStitchTube(coinTopPts, 0.002, goldStitchMat);

      addCopperRivet(
        evalLegSurfacePoint(-1, 0.027, -0.43, false, 0.0075),
        new THREE.Vector3(-0.45, 0.05, 0.88).normalize()
      );
      addCopperRivet(
        evalLegSurfacePoint(-1, 0.027, -0.77, false, 0.0075),
        new THREE.Vector3(-0.72, 0.05, 0.68).normalize()
      );
    }

    // 3F. 3D Back Western V-Yoke Panel + Double-Needle Gold V-Yoke Topstitching
    {
      // Raised V-yoke cloth panel (`yokeMat`) so the 2D yoke color shows on the 3D seat
      const yokePanelGeom = new THREE.BufferGeometry();
      const ypPos: number[] = [];
      const ypIdx: number[] = [];
      const ypCols = 28;
      const ypRows = 6;
      for (let r = 0; r <= ypRows; r++) {
        const rt = r / ypRows;
        for (let c = 0; c <= ypCols; c++) {
          const u = c / ypCols;
          const sideY = u < 0.5 ? 1 : -1;
          const theta = Math.PI / 2 + u * Math.PI;
          const centerDist = 1 - Math.abs(u - 0.5) * 2;
          const vYokeEdge = 0.052 + 0.046 * Math.pow(centerDist, 1.15);
          const pt = evalLegSurfacePoint(sideY, rt * vYokeEdge, theta, true, 0.003);
          ypPos.push(pt.x, pt.y, pt.z);
        }
      }
      for (let r = 0; r < ypRows; r++) {
        for (let c = 0; c < ypCols; c++) {
          const a = r * (ypCols + 1) + c;
          const b = a + 1;
          const c0 = a + (ypCols + 1);
          const d = c0 + 1;
          ypIdx.push(a, b, c0, b, d, c0);
        }
      }
      yokePanelGeom.setIndex(ypIdx);
      yokePanelGeom.setAttribute("position", new THREE.Float32BufferAttribute(ypPos, 3));
      yokePanelGeom.computeVertexNormals();
      const yokePanel = new THREE.Mesh(yokePanelGeom, yokeMat);
      yokePanel.receiveShadow = true;
      group.add(yokePanel);
      const yokeV1: THREE.Vector3[] = [];
      const yokeV2: THREE.Vector3[] = [];
      const steps = 28;

      for (let i = 0; i <= steps; i++) {
        const u = i / steps; // 0 = left hip (+X), 0.5 = center-back (X=0), 1 = right hip (-X)
        const side = u < 0.5 ? 1 : -1;
        const theta = Math.PI / 2 + u * Math.PI;
        // Classic Western V-yoke dips from v=0.055 at the outer hips down to v=0.098 at center-back
        const centerDist = 1 - Math.abs(u - 0.5) * 2;
        const vYoke = 0.052 + 0.046 * Math.pow(centerDist, 1.15);

        yokeV1.push(evalLegSurfacePoint(side, vYoke, theta, true, 0.0045));
        yokeV2.push(evalLegSurfacePoint(side, vYoke + 0.0065, theta, true, 0.0045));
      }
      addStitchTube(yokeV1, 0.0022, goldStitchMat);
      addStitchTube(yokeV2, 0.002, goldStitchMat);

      // Center-back seat seam from waistband down through yoke to crotch
      const backSeatPts: THREE.Vector3[] = [];
      for (let r = 0; r <= 18; r++) {
        const v = (r / 18) * 0.23;
        backSeatPts.push(evalLegSurfacePoint(1, v, Math.PI, true, 0.004));
      }
      addStitchTube(backSeatPts, 0.0022, goldStitchMat);
    }

    // 3G. Dual 3D 5-Point Spade Back Patch Pockets + Double-Arcuate Gold Stitching + Copper Rivets + Red Tab
    for (const side of [-1, 1]) {
      const pGeom = new THREE.BufferGeometry();
      const pPos: number[] = [];
      const pIdx: number[] = [];
      const rows = 14;
      const cols = 12;

      const sampleSpadePocket = (ru: number, cu: number, offset: number = 0.006) => {
        // ru in [0..1] (top to bottom), cu in [0..1] (inner to outer)
        // Below ru = 0.72, the bottom tapers to a classic 5-point spade tip at cu = 0.5, ru = 1.0
        const vTop = 0.105;
        const vMid = 0.205;
        const vTip = 0.238;
        let v: number;
        let halfSpan = 0.31;

        if (ru <= 0.74) {
          const t = ru / 0.74;
          v = vTop + t * (vMid - vTop);
          halfSpan = 0.31 - 0.025 * t;
        } else {
          const t = (ru - 0.74) / 0.26;
          // At the bottom edge, v depends on distance from center of pocket (cu = 0.5)
          const centerPeak = 1 - Math.abs(cu - 0.5) * 2;
          v = vMid + t * (vTip - vMid) * (0.15 + 0.85 * centerPeak);
          halfSpan = 0.285 * (1 - 0.12 * t);
        }

        const centerTheta = Math.PI - side * 0.44;
        const theta = centerTheta + (cu - 0.5) * 2 * halfSpan;
        return evalLegSurfacePoint(side, v, theta, true, offset);
      };

      for (let r = 0; r <= rows; r++) {
        const ru = r / rows;
        for (let c = 0; c <= cols; c++) {
          const cu = c / cols;
          const pt = sampleSpadePocket(ru, cu, 0.006);
          pPos.push(pt.x, pt.y, pt.z);
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = r * (cols + 1) + c;
          const b = a + 1;
          const c0 = a + (cols + 1);
          const d = c0 + 1;
          pIdx.push(a, b, c0, b, d, c0);
        }
      }
      pGeom.setIndex(pIdx);
      pGeom.setAttribute("position", new THREE.Float32BufferAttribute(pPos, 3));
      pGeom.computeVertexNormals();
      const pocketMesh = new THREE.Mesh(pGeom, pocketMat);
      pocketMesh.castShadow = true;
      pocketMesh.receiveShadow = true;
      group.add(pocketMesh);

      // Gold perimeter topstitching around the 5-point spade pocket
      const perimPts: THREE.Vector3[] = [];
      for (let c = 0; c <= 8; c++) perimPts.push(sampleSpadePocket(0.04, c / 8, 0.0078));
      for (let r = 1; r <= 8; r++) perimPts.push(sampleSpadePocket((r / 8) * 0.74, 0.96, 0.0078));
      perimPts.push(sampleSpadePocket(0.98, 0.5, 0.0078));
      for (let r = 8; r >= 0; r--) perimPts.push(sampleSpadePocket((r / 8) * 0.74, 0.04, 0.0078));
      addStitchTube(perimPts, 0.0018, goldStitchMat);

      // Signature Double-Arcuate Seagull Wing Gold Stitching across each back pocket
      for (const arcRow of [0.36, 0.43]) {
        const arcPts: THREE.Vector3[] = [];
        for (let c = 0; c <= 14; c++) {
          const cu = 0.05 + (c / 14) * 0.9;
          // Classic double-arcuate dip to a central diamond peak at cu = 0.5
          const wingDip = 0.18 * Math.pow(1 - Math.abs(cu - 0.5) * 2, 1.5);
          arcPts.push(sampleSpadePocket(arcRow + wingDip, cu, 0.0082));
        }
        addStitchTube(arcPts, 0.0019, goldStitchMat);
      }

      // Copper rivets at the two top corners of each back spade pocket
      addCopperRivet(
        sampleSpadePocket(0.05, 0.06, 0.0082),
        new THREE.Vector3(side * 0.35, 0, -0.92).normalize()
      );
      addCopperRivet(
        sampleSpadePocket(0.05, 0.94, 0.0082),
        new THREE.Vector3(side * 0.55, 0, -0.82).normalize()
      );

      // Classic Red Woven Selvedge Tab on the inner edge of the Right Back Pocket (`side = -1`)
      if (side === -1) {
        const tabPos = sampleSpadePocket(0.32, 0.98, 0.0075);
        const redTab = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, 0.024, 0.005),
          brandTabMat
        );
        redTab.position.copy(tabPos);
        group.add(redTab);
      }
    }

    // 3H. 3D Saddle-Tan Leather Brand Jacron Patch on the Back-Right Waistband (`collarMat`)
    {
      const patchGeom = new THREE.BufferGeometry();
      const patchPos: number[] = [];
      const patchIdx: number[] = [];
      const rows = 6;
      const cols = 10;

      for (let r = 0; r <= rows; r++) {
        const v = 0.14 + (r / rows) * 0.72;
        const y = yWaistTop - v * (yWaistTop - yWaistBot);
        for (let c = 0; c <= cols; c++) {
          const u = c / cols;
          const theta = Math.PI + 0.48 + u * 0.42;
          const { rx, rz } = evalWaistRadius(theta, v);
          patchPos.push(
            Math.sin(theta) * (rx + 0.0055),
            y,
            Math.cos(theta) * (rz + 0.0055)
          );
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = r * (cols + 1) + c;
          const b = a + 1;
          const c0 = a + (cols + 1);
          const d = c0 + 1;
          patchIdx.push(a, c0, b, b, c0, d);
        }
      }
      patchGeom.setIndex(patchIdx);
      patchGeom.setAttribute("position", new THREE.Float32BufferAttribute(patchPos, 3));
      patchGeom.computeVertexNormals();
      const patchMesh = new THREE.Mesh(patchGeom, collarMat);
      patchMesh.castShadow = true;
      group.add(patchMesh);
    }

    // 3I. Raised 3D Outseams + Clean Finished Stacked Hem (`cuffMat`)
    for (const side of [-1, 1]) {
      // Raised outseam line from hip down to the hem
      const outseamPts: THREE.Vector3[] = [];
      for (let r = 0; r <= 32; r++) {
        const v = 0.02 + (r / 32) * 0.96;
        outseamPts.push(evalLegSurfacePoint(side, v, side * (Math.PI / 2), false, 0.0035));
      }
      addStitchTube(outseamPts, 0.002, goldStitchMat);

      // Clean modern hem band around each leg opening (`v = 0.96` to `1.0`)
      const cuffGeom = new THREE.BufferGeometry();
      const cPos: number[] = [];
      const cIdx: number[] = [];
      const cSegsU = 36;
      const cSegsV = 4;

      for (let iv = 0; iv <= cSegsV; iv++) {
        const t = iv / cSegsV;
        const v = 0.96 + t * 0.04;
        const hemFold = 0.0035 + 0.002 * Math.sin(t * Math.PI);
        for (let iu = 0; iu <= cSegsU; iu++) {
          const u = iu / cSegsU;
          const theta = u * Math.PI * 2;
          const isBack = theta > Math.PI / 2 && theta < (3 * Math.PI) / 2;
          const pt = evalLegSurfacePoint(side, v, theta, isBack, hemFold);
          cPos.push(pt.x, pt.y, pt.z);
        }
      }
      for (let iv = 0; iv < cSegsV; iv++) {
        for (let iu = 0; iu < cSegsU; iu++) {
          const a = iv * (cSegsU + 1) + iu;
          const b = a + 1;
          const c0 = a + (cSegsU + 1);
          const d = c0 + 1;
          cIdx.push(a, c0, b, b, c0, d);
        }
      }
      cuffGeom.setIndex(cIdx);
      cuffGeom.setAttribute("position", new THREE.Float32BufferAttribute(cPos, 3));
      cuffGeom.computeVertexNormals();
      const cuffMesh = new THREE.Mesh(cuffGeom, cuffMat);
      cuffMesh.castShadow = true;
      cuffMesh.receiveShadow = true;
      group.add(cuffMesh);

      // Tonal hem topstitch ring along the upper hem fold
      const hemStitchPts: THREE.Vector3[] = [];
      for (let iu = 0; iu <= 36; iu++) {
        const theta = (iu / 36) * Math.PI * 2;
        const isBack = theta > Math.PI / 2 && theta < (3 * Math.PI) / 2;
        hemStitchPts.push(evalLegSurfacePoint(side, 0.968, theta, isBack, 0.0055));
      }
      addStitchTube(hemStitchPts, 0.0018, goldStitchMat);
    }

    // 3J. Front Drawstring Cords for Drawstring Jeans (matching user's reference photo 3)
    if (hasDrawstring) {
      for (const side of [-1, 1]) {
        const pts = [
          new THREE.Vector3(side * 0.024, 0.655, 0.258),
          new THREE.Vector3(side * 0.038, 0.54, 0.272),
          new THREE.Vector3(side * 0.032, 0.42, 0.266),
          new THREE.Vector3(side * 0.044, 0.32, 0.262),
        ];
        const curve = new THREE.CatmullRomCurve3(pts);
        const cordMesh = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 20, 0.0048, 8, false),
          trimMat
        );
        group.add(cordMesh);
      }
    }
  } else if (isJoggers || isShorts) {
    // 4. Front Waistband Drawstring Cords (for Joggers & Shorts)
    for (const side of [-1, 1]) {
      const pts = [
        new THREE.Vector3(side * 0.032, 0.65, 0.258),
        new THREE.Vector3(side * 0.042, 0.56, 0.268),
        new THREE.Vector3(side * 0.036, 0.47, 0.264),
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const cordMesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 16, 0.0045, 8, false),
        trimMat
      );
      group.add(cordMesh);

      const endPt = pts[pts.length - 1];
      const aglet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0048, 0.0042, 0.02, 10),
        metalMat
      );
      aglet.position.set(endPt.x, endPt.y - 0.01, endPt.z);
      group.add(aglet);
    }
  }

  group.scale.set(1.18, 1.18, 1.18);
  group.position.set(0, 0.12, 0);
  return group;
}

/**
 * High-density parametric cloth-draped top fallback used only during the initial ~200ms
 * before `/models/t_shirt_mod.glb` completes loading.
 */
function buildProceduralDrapedTopFallback(
  frontMat: THREE.Material,
  backMat: THREE.Material,
  collarMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const uSegs = 48;
  const vSegs = 40;

  for (const isBack of [false, true]) {
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let iv = 0; iv <= vSegs; iv++) {
      const v = iv / vSegs;
      const y = 0.68 - v * 1.36;
      const rx = 0.43 - 0.04 * Math.sin(v * Math.PI);
      const rz = 0.25 - 0.02 * v;

      for (let iu = 0; iu <= uSegs; iu++) {
        const u = iu / uSegs;
        const theta = isBack
          ? Math.PI / 2 + u * Math.PI
          : -Math.PI / 2 + u * Math.PI;
        const wrinkle = 0.008 * Math.sin(theta * 8 + v * 6) * Math.sin(v * Math.PI);
        positions.push(
          Math.sin(theta) * (rx + wrinkle),
          y,
          Math.cos(theta) * (rz + wrinkle)
        );
        uvs.push(u, v);
      }
    }

    for (let iv = 0; iv < vSegs; iv++) {
      for (let iu = 0; iu < uSegs; iu++) {
        const a = iv * (uSegs + 1) + iu;
        const b = a + 1;
        const c = a + (uSegs + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    geom.setIndex(indices);
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();
    group.add(new THREE.Mesh(geom, isBack ? backMat : frontMat));
  }

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.028, 16, 48),
    collarMat
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.68, 0);
  group.add(collar);

  return group;
}

/**
 * Builds the realistic 3D draped cloth garment model for the selected garment.
 */
export function buildGarment3DModel({
  garmentId,
  category,
  frontTexture,
  backTexture,
  zoneColors,
  gltfShirtModel,
  scratchConfig,
}: BuildOptions): THREE.Group {
  const garmentGroup = new THREE.Group();
  garmentGroup.name = `garment_${garmentId}`;

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
  const cuffColor = zoneColors.cuff || zoneColors.cuffL || collarColor || primaryColor;

  const wovenBump = getWovenFabricBumpMap();
  const ribbedBump = getRibbedKnitBumpMap();
  const denimBump = getDenimTwillBumpMap();

  const id = garmentId.toLowerCase();
  const isJeans = id.includes("jeans") || id.includes("denim");
  const isSilk = category === "Dresses" || id.includes("gown") || id.includes("slip");
  const isTechWoven =
    category === "Outerwear" || id.includes("jacket") || id.includes("windbreaker");
  const baseRoughness = isJeans ? 0.78 : isSilk ? 0.38 : isTechWoven ? 0.56 : 0.74;
  const activeClothBump = isJeans ? denimBump : wovenBump;
  const activeBumpScale = isJeans ? 0.0085 : 0.0055;

  // Front & Back Torso/Legs Cloth Materials with Woven/Denim Micro-Bump & 1:1 UV Projection
  const frontMat = new THREE.MeshStandardMaterial({
    name: "mat_front_body",
    map: frontTexture || null,
    color: frontTexture ? 0xffffff : new THREE.Color(primaryColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const backMat = new THREE.MeshStandardMaterial({
    name: "mat_back_body",
    map: backTexture || null,
    color: backTexture ? 0xffffff : new THREE.Color(primaryColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Interior Cloth Lining Material (slightly darker shade of body color for realistic depth inside neck/hem)
  const insideColor = new THREE.Color(primaryColor).multiplyScalar(0.62);
  const insideMat = new THREE.MeshStandardMaterial({
    name: "mat_inside_lining",
    color: insideColor,
    bumpMap: wovenBump,
    bumpScale: 0.004,
    roughness: 0.82,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Collar Rib Material
  const collarMat = new THREE.MeshStandardMaterial({
    name: "mat_collar",
    color: new THREE.Color(collarColor),
    bumpMap: ribbedBump,
    bumpScale: 0.007,
    roughness: 0.72,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Hood Cloth Material
  const hoodMat = new THREE.MeshStandardMaterial({
    name: "mat_hood",
    color: new THREE.Color(hoodColor),
    bumpMap: wovenBump,
    bumpScale: 0.006,
    roughness: baseRoughness,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Independent Left & Right Sleeve Materials
  const sleeveLMat = new THREE.MeshStandardMaterial({
    name: "mat_sleeve_l",
    color: new THREE.Color(sleeveLColor),
    bumpMap: wovenBump,
    bumpScale: 0.0055,
    roughness: baseRoughness,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const sleeveRMat = new THREE.MeshStandardMaterial({
    name: "mat_sleeve_r",
    color: new THREE.Color(sleeveRColor),
    bumpMap: wovenBump,
    bumpScale: 0.0055,
    roughness: baseRoughness,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Independent Left & Right Wrist Cuff Materials
  const cuffLMat = new THREE.MeshStandardMaterial({
    name: "mat_cuff_l",
    color: new THREE.Color(cuffLColor),
    bumpMap: ribbedBump,
    bumpScale: 0.007,
    roughness: 0.68,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const cuffRMat = new THREE.MeshStandardMaterial({
    name: "mat_cuff_r",
    color: new THREE.Color(cuffRColor),
    bumpMap: ribbedBump,
    bumpScale: 0.007,
    roughness: 0.68,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Sleeve Stripes Material
  const sleeveStripeMat = new THREE.MeshStandardMaterial({
    name: "mat_sleeve_stripe",
    color: new THREE.Color(sleeveStripeColor),
    bumpMap: wovenBump,
    bumpScale: 0.005,
    roughness: 0.55,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Kangaroo / Scoop / Spade Pocket Material
  const pocketMat = new THREE.MeshStandardMaterial({
    name: "mat_pocket",
    color: new THREE.Color(pocketColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Placket / J-Fly Material
  const placketMat = new THREE.MeshStandardMaterial({
    name: "mat_placket",
    color: new THREE.Color(placketColor),
    bumpMap: isJeans ? activeClothBump : ribbedBump,
    bumpScale: isJeans ? activeBumpScale : 0.005,
    roughness: isJeans ? baseRoughness : 0.55,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // Drawstring / Laces Material
  const drawstringMat = new THREE.MeshStandardMaterial({
    name: "mat_drawstring",
    color: new THREE.Color(drawstringColor),
    bumpMap: ribbedBump,
    bumpScale: 0.006,
    roughness: 0.6,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Waistband Material for Bottoms
  const waistbandMat = new THREE.MeshStandardMaterial({
    name: "mat_waistband",
    color: new THREE.Color(waistbandColor),
    bumpMap: isJeans ? activeClothBump : ribbedBump,
    bumpScale: isJeans ? activeBumpScale : 0.007,
    roughness: isJeans ? baseRoughness : 0.72,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Yoke Material (Western Back V-Yoke on Jeans)
  const yokeMat = new THREE.MeshStandardMaterial({
    name: "mat_yoke",
    color: new THREE.Color(yokeColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  //Selvedge Turn-Up Cuff Material for Bottoms
  const cuffMat = new THREE.MeshStandardMaterial({
    name: "mat_cuff",
    color: new THREE.Color(cuffColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Zipper Hardware & Welt Material (updates with zoneColors.zipper)
  const zipperMat = new THREE.MeshStandardMaterial({
    name: "mat_zipper",
    color: new THREE.Color(zipperColor),
    metalness: 0.65,
    roughness: 0.28,
    side: THREE.DoubleSide,
  });

  // 1. Bottoms (Original 5-Pocket Denim Jeans, Joggers, Basketball Shorts, Leggings)
  if (
    category === "Bottoms" ||
    id.includes("joggers") ||
    id.includes("jeans") ||
    id.includes("denim") ||
    id.includes("shorts") ||
    id.includes("leggings")
  ) {
    return buildDrapedBottomsMesh(garmentId, {
      frontMat,
      backMat,
      insideMat,
      waistMat: waistbandMat,
      pocketMat,
      placketMat,
      yokeMat,
      cuffMat,
      collarMat,
      trimMat: drawstringMat,
      metalMat: zipperMat,
    });
  }

  // 2. All Tops, Outerwear, Hoodies, Sweaters, Blazers, Jerseys, and Evening Gowns
  // built from the 123,500-vertex simulated cloth mesh (`Cloth_1`) + real-time vertex morphing!
  if (gltfShirtModel) {
    return buildMorphedClothFromGLB(
      gltfShirtModel,
      garmentId,
      category,
      {
        frontMat,
        backMat,
        insideMat,
        collarMat,
        hoodMat,
        sleeveLMat,
        sleeveRMat,
        cuffLMat,
        cuffRMat,
        sleeveStripeMat,
        pocketMat,
        placketMat,
        drawstringMat,
        zipperMat,
      },
      scratchConfig
    );
  }

  // 3. High-density draped fallback for the ~200ms while the GLB finishes loading
  return buildProceduralDrapedTopFallback(frontMat, backMat, collarMat);
}
