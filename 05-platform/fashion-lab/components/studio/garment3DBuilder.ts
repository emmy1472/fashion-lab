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

export type MannequinGender = "female" | "male" | "none";
export type MannequinFinish = "slate" | "white" | "charcoal" | "linen" | "alabaster";

export interface MannequinOptions {
  gender?: MannequinGender;
  category?: string;
  finish?: MannequinFinish;
  showTapes?: boolean;
}

/**
 * Builds a seamless sculpted boutique mannequin head and neck.
 * Single continuous parametric surface from cranial crown (y = 1.54) down to clavicles (y = 1.08),
 * eliminating disjointed cylinder seams.
 */
function createSeamlessHeadAndNeck(isFemale: boolean, mat: THREE.Material): THREE.Mesh {
  const uSegs = 36;
  const vSegs = 32;
  const yTop = 1.54; // cranial crown
  const yBot = 1.08; // clavicular base

  const geom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    const y = yTop - v * (yTop - yBot);

    let rx = 0.082;
    let rz = 0.098;
    let zCenter = 0.0;

    if (y > 1.44) {
      // 1. Cranium vault apex
      const t = (1.54 - y) / 0.10;
      const arc = Math.sqrt(Math.max(0.001, 1 - Math.pow(1 - t, 2)));
      rx = (isFemale ? 0.074 : 0.082) * arc;
      rz = (isFemale ? 0.090 : 0.098) * arc;
      zCenter = -0.015 * (1 - t);
    } else if (y > 1.34) {
      // 2. Forehead, temples, and brow
      const t = (1.44 - y) / 0.10;
      rx = (isFemale ? 0.076 : 0.085) - 0.002 * t;
      rz = (isFemale ? 0.092 : 0.102) + 0.003 * Math.sin(t * Math.PI);
      zCenter = 0.004 * t;
    } else if (y > 1.25) {
      // 3. Cheekbones and jaw angle
      const t = (1.34 - y) / 0.09;
      rx = (isFemale ? 0.074 : 0.083) - (isFemale ? 0.018 : 0.014) * t;
      rz = (isFemale ? 0.090 : 0.098) - (isFemale ? 0.016 : 0.012) * t;
      zCenter = 0.012 * t;
    } else if (y > 1.20) {
      // 4. Tapered chin & submental jawline
      const t = (1.25 - y) / 0.05;
      rx = (isFemale ? 0.056 : 0.069) - (isFemale ? 0.014 : 0.016) * t;
      rz = (isFemale ? 0.074 : 0.086) - (isFemale ? 0.018 : 0.018) * t;
      zCenter = 0.016 + 0.004 * (1 - t);
    } else {
      // 5. Throat and anatomical neck flowing down into clavicles (y = 1.20 down to 1.08)
      const t = (1.20 - y) / 0.12;
      rx = (isFemale ? 0.042 : 0.053) + (isFemale ? 0.014 : 0.018) * Math.pow(t, 1.4);
      rz = (isFemale ? 0.052 : 0.064) + (isFemale ? 0.012 : 0.016) * Math.pow(t, 1.4);
      zCenter = 0.008 * (1 - t);
    }

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Subtle planar styling for modern boutique mannequin (Images 1 & 3)
      let facet = 1.0;
      if (y >= 1.22 && y <= 1.40 && cosT > 0.25) {
        // Front facial plane
        facet = 0.965 + 0.035 * Math.pow(Math.abs(sinT), 1.2);
      }

      // Sternocleidomastoid subtle neck muscle ridges
      let neckRidge = 0;
      if (y >= 1.08 && y <= 1.20 && cosT > 0.2 && Math.abs(sinT) > 0.3) {
        neckRidge = 0.0025 * Math.sin(((1.20 - y) / 0.12) * Math.PI);
      }

      const px = sinT * (rx + neckRidge) * facet;
      const pz = cosT * (rz + neckRidge) + zCenter;
      const py = y;

      positions.push(px, py, pz);
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

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Builds a seamless, continuous, anatomically sculpted arm (shoulder -> bicep -> elbow -> forearm -> wrist).
 * Modeled as a single continuous lofted surface with smooth vertex normals to eliminate disjointed sphere joints.
 */
function createSeamlessSculptedArm(
  side: number,
  isFemale: boolean,
  mat: THREE.Material
): THREE.Mesh {
  const rings = 28;
  const radSegs = 20;
  const geom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const shoulderX = side * (isFemale ? 0.178 : 0.205);
  const wristX = side * (isFemale ? 0.205 : 0.235);

  const yTop = 1.02; // shoulder deltoid
  const yBot = 0.44; // wrist

  for (let iv = 0; iv <= rings; iv++) {
    const v = iv / rings;
    const y = yTop - v * (yTop - yBot);

    // Lateral curve along arm length
    const cx = shoulderX + (wristX - shoulderX) * Math.pow(v, 1.15);
    // Natural slight forward carrying angle and relaxed elbow flexion (Images 1 & 3)
    const cz = 0.005 + 0.022 * Math.sin(v * Math.PI);

    let rx = 0.034;
    let rz = 0.035;

    if (v < 0.20) {
      // 1. Deltoid shoulder cap (broad, curved round)
      const t = v / 0.20;
      rx = (isFemale ? 0.033 : 0.038) - 0.004 * t;
      rz = (isFemale ? 0.034 : 0.040) - 0.005 * t;
    } else if (v < 0.50) {
      // 2. Biceps & Triceps upper arm
      const t = (v - 0.20) / 0.30;
      rx = (isFemale ? 0.029 : 0.034) - 0.004 * t;
      rz = (isFemale ? 0.030 : 0.035) - 0.005 * t;
    } else if (v < 0.60) {
      // 3. Elbow with olecranon definition
      rx = isFemale ? 0.025 : 0.029;
      rz = isFemale ? 0.026 : 0.030;
    } else if (v < 0.82) {
      // 4. Forearm (brachioradialis muscle belly)
      const t = (v - 0.60) / 0.22;
      rx = (isFemale ? 0.024 : 0.027) - 0.004 * t;
      rz = (isFemale ? 0.024 : 0.027) - 0.005 * t;
    } else {
      // 5. Wrist taper
      const t = (v - 0.82) / 0.18;
      rx = (isFemale ? 0.020 : 0.023) - 0.003 * t;
      rz = (isFemale ? 0.016 : 0.019) - 0.003 * t;
    }

    for (let iu = 0; iu <= radSegs; iu++) {
      const u = iu / radSegs;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Tricep posterior bulge & elbow tip
      let muscle = 0;
      if (v >= 0.20 && v <= 0.45 && cosT < -0.3) {
        muscle = 0.003 * Math.pow(-cosT, 1.2) * Math.sin(((v - 0.20) / 0.25) * Math.PI);
      }
      if (v >= 0.48 && v <= 0.58 && cosT < -0.4) {
        // Olecranon elbow bone tip
        muscle += 0.004 * Math.pow(-cosT, 1.5) * Math.sin(((v - 0.48) / 0.10) * Math.PI);
      }

      const px = cx + sinT * rx;
      const pz = cz + cosT * (rz + muscle);
      const py = y;

      positions.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < rings; iv++) {
    for (let iu = 0; iu < radSegs; iu++) {
      const a = iv * (radSegs + 1) + iu;
      const b = a + 1;
      const c = a + (radSegs + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  geom.setIndex(indices);
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const armMesh = new THREE.Mesh(geom, mat);
  armMesh.castShadow = true;
  armMesh.receiveShadow = true;
  return armMesh;
}

/**
 * Builds a continuous lofted boutique finger with smooth rounded fingertip dome
 * and natural curvature, eliminating robotic sphere knuckles (Images 1 & 3).
 */
function createSculptedFinger(
  baseR: number,
  tipR: number,
  length: number,
  curlX: number,
  curlZ: number,
  mat: THREE.Material
): THREE.Mesh {
  const rings = 12;
  const radSegs = 12;
  const geom = new THREE.BufferGeometry();
  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];

  for (let iv = 0; iv <= rings; iv++) {
    const v = iv / rings; // 0 (base) to 1 (tip)
    const y = -v * length;
    const zOffset = Math.sin(v * Math.PI * 0.5) * Math.sin(curlX) * length * 0.55;
    const xOffset = Math.sin(v * Math.PI * 0.5) * Math.sin(curlZ) * length * 0.35;

    let r = baseR - (baseR - tipR) * v;
    if (v > 0.82) {
      // Smoothly rounded anatomical fingertip dome
      const dt = (v - 0.82) / 0.18;
      r *= Math.sqrt(Math.max(0.01, 1 - dt * dt));
    }

    for (let iu = 0; iu <= radSegs; iu++) {
      const u = iu / radSegs;
      const theta = u * Math.PI * 2;
      const px = xOffset + Math.sin(theta) * r;
      const pz = zOffset + Math.cos(theta) * r;
      pos.push(px, y, pz);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < rings; iv++) {
    for (let iu = 0; iu < radSegs; iu++) {
      const a = iv * (radSegs + 1) + iu;
      const b = a + 1;
      const c = a + (radSegs + 1);
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }

  geom.setIndex(idx);
  geom.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  return mesh;
}

/**
 * Builds realistic boutique sculpted mannequin hands with distinct fingers in a natural relaxed pose (Images 1 & 3).
 */
function createBoutiqueSculptedHand(
  side: number,
  isFemale: boolean,
  mat: THREE.Material
): THREE.Group {
  const handGroup = new THREE.Group();
  const wristX = side * (isFemale ? 0.205 : 0.235);
  handGroup.position.set(wristX, 0.44, 0.008);

  // 1. Sculpted Palm with natural fashion taper & thenar pad
  const palmGeom = new THREE.BufferGeometry();
  const pRows = 8;
  const pCols = 12;
  const pPos: number[] = [];
  const pIdx: number[] = [];

  for (let r = 0; r <= pRows; r++) {
    const t = r / pRows;
    const y = -t * 0.076; // wrist (0) down to knuckles (-0.076)
    const palmWidth = (isFemale ? 0.028 : 0.034) + 0.004 * Math.sin(t * Math.PI);
    const palmThick = (isFemale ? 0.014 : 0.018) * (1 - 0.22 * t);

    for (let c = 0; c <= pCols; c++) {
      const u = c / pCols;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Thenar thumb eminence
      let thenar = 0;
      if (t > 0.15 && t < 0.65 && side * sinT < -0.2 && cosT > 0) {
        thenar = 0.004 * Math.sin(((t - 0.15) / 0.50) * Math.PI);
      }

      const px = sinT * (palmWidth * 0.5) + (side * thenar);
      const pz = cosT * (palmThick * 0.5) + (thenar * 0.5);
      pPos.push(px, y, pz);
    }
  }

  for (let r = 0; r < pRows; r++) {
    for (let c = 0; c < pCols; c++) {
      const a = r * (pCols + 1) + c;
      const b = a + 1;
      const c0 = a + (pCols + 1);
      const d = c0 + 1;
      pIdx.push(a, c0, b, b, c0, d);
    }
  }

  palmGeom.setIndex(pIdx);
  palmGeom.setAttribute("position", new THREE.Float32BufferAttribute(pPos, 3));
  palmGeom.computeVertexNormals();

  const palmMesh = new THREE.Mesh(palmGeom, mat);
  palmMesh.castShadow = true;
  handGroup.add(palmMesh);

  // 2. Sculpted Natural Thumb (curved loft from thenar pad, angling forward/lateral)
  const thumbBaseR = isFemale ? 0.0055 : 0.0068;
  const thumbTipR = isFemale ? 0.0042 : 0.0050;
  const thumbMesh = createSculptedFinger(thumbBaseR, thumbTipR, 0.044, 0.35, side * 0.25, mat);
  thumbMesh.position.set(-side * (isFemale ? 0.012 : 0.015), -0.026, 0.006);
  thumbMesh.rotation.x = 0.25;
  thumbMesh.rotation.z = side * 0.28;
  handGroup.add(thumbMesh);

  // 3. Four Sculpted Boutique Relaxed Fingers (Index, Middle, Ring, Pinky)
  const fingerSpecs = [
    { offset: -0.010, len: 0.060, baseR: 0.0045, tipR: 0.0033, curlX: -0.08, curlZ: -0.02 },
    { offset: -0.003, len: 0.066, baseR: 0.0048, tipR: 0.0035, curlX: -0.11, curlZ: 0.0 },
    { offset: 0.004, len: 0.062, baseR: 0.0045, tipR: 0.0033, curlX: -0.13, curlZ: 0.02 },
    { offset: 0.010, len: 0.050, baseR: 0.0038, tipR: 0.0028, curlX: -0.16, curlZ: 0.04 },
  ];

  for (const f of fingerSpecs) {
    const scale = isFemale ? 0.88 : 1.0;
    const fMesh = createSculptedFinger(
      f.baseR * scale,
      f.tipR * scale,
      f.len * scale,
      f.curlX,
      side * f.curlZ,
      mat
    );
    fMesh.position.set(side * f.offset, -0.076, 0);
    handGroup.add(fMesh);
  }

  return handGroup;
}

/**
 * Builds a seamless, continuous, anatomically sculpted leg (hip -> quad -> patella knee -> calf -> ankle).
 * Modeled as a single continuous lofted 3D parametric surface with 36 rings and 28 radial segments,
 * producing zero joint seams and natural human muscle curves.
 */
function createSeamlessSculptedLeg(
  side: number,
  isFemale: boolean,
  mat: THREE.Material
): THREE.Mesh {
  const rings = 36;
  const radSegs = 28;
  const geom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const lPosX = side * (isFemale ? 0.088 : 0.095);
  const yTop = 0.10;  // pelvic crotch root
  const yBot = -1.15; // ankle level

  for (let iv = 0; iv <= rings; iv++) {
    const v = iv / rings;
    const y = yTop - v * (yTop - yBot);

    // Natural subtle fashion leg stance
    const cx = lPosX;
    const cz = 0.002;

    let rx = 0.065;
    let rz = 0.068;

    if (v < 0.28) {
      // 1. Upper Thigh & Quadriceps curve
      const t = v / 0.28;
      rx = (isFemale ? 0.062 : 0.068) - 0.010 * t;
      rz = (isFemale ? 0.066 : 0.072) - 0.011 * t;
    } else if (v < 0.44) {
      // 2. Lower Thigh tapering into knee
      const t = (v - 0.28) / 0.16;
      rx = (isFemale ? 0.052 : 0.058) - 0.007 * t;
      rz = (isFemale ? 0.055 : 0.061) - 0.008 * t;
    } else if (v < 0.56) {
      // 3. Patella Knee joint & patellar tendon
      const t = (v - 0.44) / 0.12;
      rx = (isFemale ? 0.042 : 0.046) + 0.002 * Math.sin(t * Math.PI);
      rz = (isFemale ? 0.044 : 0.048) + 0.006 * Math.sin(t * Math.PI);
    } else if (v < 0.80) {
      // 4. Calf (Gastrocnemius & Soleus muscle curve)
      const t = (v - 0.56) / 0.24;
      rx = (isFemale ? 0.040 : 0.044) + 0.005 * Math.sin(t * Math.PI);
      rz = (isFemale ? 0.044 : 0.048) + 0.012 * Math.sin(t * Math.PI);
    } else {
      // 5. Lower Leg & Ankle taper (Achilles tendon back)
      const t = (v - 0.80) / 0.20;
      rx = (isFemale ? 0.040 : 0.044) - (isFemale ? 0.015 : 0.016) * t;
      rz = (isFemale ? 0.044 : 0.048) - (isFemale ? 0.017 : 0.018) * t;
    }

    for (let iu = 0; iu <= radSegs; iu++) {
      const u = iu / radSegs;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      let muscle = 0;

      // Anterior Quadriceps rectus femoris bulge
      if (v >= 0.06 && v <= 0.35 && cosT > 0.2) {
        muscle = 0.005 * Math.pow(cosT, 1.4) * Math.sin(((v - 0.06) / 0.29) * Math.PI);
      }
      // Patella Knee Cap plate
      if (v >= 0.45 && v <= 0.55 && cosT > 0.3) {
        muscle += 0.007 * Math.pow(cosT, 1.6) * Math.sin(((v - 0.45) / 0.10) * Math.PI);
      }
      // Posterior Gastrocnemius Calf Belly
      if (v >= 0.58 && v <= 0.80 && cosT < -0.2) {
        muscle += 0.012 * Math.pow(-cosT, 1.3) * Math.sin(((v - 0.58) / 0.22) * Math.PI);
      }
      // Lateral & Medial Ankle Malleolus bones at the hem
      if (v >= 0.94 && Math.abs(sinT) > 0.7) {
        muscle += 0.004 * Math.pow(Math.abs(sinT), 1.5) * ((v - 0.94) / 0.06);
      }

      const px = cx + sinT * rx;
      const pz = cz + cosT * (rz + muscle);
      const py = y;

      positions.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < rings; iv++) {
    for (let iu = 0; iu < radSegs; iu++) {
      const a = iv * (radSegs + 1) + iu;
      const b = a + 1;
      const c = a + (radSegs + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  geom.setIndex(indices);
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const legMesh = new THREE.Mesh(geom, mat);
  legMesh.castShadow = true;
  legMesh.receiveShadow = true;
  return legMesh;
}

/**
 * Builds realistic modern boutique footwear (luxury sneaker for male, sleek fashion pump for female)
 * resting flat on the turntable plinth.
 */
function createBoutiqueFootwear(
  posX: number,
  isFemale: boolean,
  mat: THREE.Material,
  soleMat: THREE.Material
): THREE.Group {
  const shoeGroup = new THREE.Group();

  if (!isFemale) {
    // Male: Modern Minimalist Luxury Boutique Sneaker (Images 1 & 3)
    // 1. Contoured Leather Upper
    const upperGeom = new THREE.BoxGeometry(0.068, 0.10, 0.20);
    const upperMesh = new THREE.Mesh(upperGeom, mat);
    upperMesh.position.set(posX, -1.215, 0.035);
    upperMesh.castShadow = true;
    shoeGroup.add(upperMesh);

    // 2. Sculpted Rubber Cupsole resting on the turntable at y = -1.30
    const soleGeom = new THREE.BoxGeometry(0.072, 0.030, 0.21);
    const soleMesh = new THREE.Mesh(soleGeom, soleMat);
    soleMesh.position.set(posX, -1.285, 0.038);
    soleMesh.castShadow = true;
    shoeGroup.add(soleMesh);

    // 3. Rounded Toe Spring Cap
    const toeGeom = new THREE.SphereGeometry(0.034, 16, 12);
    const toeMesh = new THREE.Mesh(toeGeom, mat);
    toeMesh.position.set(posX, -1.242, 0.125);
    toeMesh.scale.set(1.0, 0.65, 1.15);
    toeMesh.castShadow = true;
    shoeGroup.add(toeMesh);

    // 4. Sneaker Tongue & Lacing Throat Ridge
    const tongueGeom = new THREE.BoxGeometry(0.032, 0.040, 0.08);
    const tongueMesh = new THREE.Mesh(tongueGeom, mat);
    tongueMesh.position.set(posX, -1.18, 0.05);
    tongueMesh.rotation.x = -0.35;
    tongueMesh.castShadow = true;
    shoeGroup.add(tongueMesh);
  } else {
    // Female: Sleek Fashion Boutique Pump / Low-Profile Wedge (Image 3)
    // 1. Contoured Fashion Upper
    const upperGeom = new THREE.BoxGeometry(0.058, 0.090, 0.18);
    const upperMesh = new THREE.Mesh(upperGeom, mat);
    upperMesh.position.set(posX, -1.22, 0.030);
    upperMesh.castShadow = true;
    shoeGroup.add(upperMesh);

    // 2. Sleek fashion sole
    const soleGeom = new THREE.BoxGeometry(0.062, 0.026, 0.19);
    const soleMesh = new THREE.Mesh(soleGeom, soleMat);
    soleMesh.position.set(posX, -1.287, 0.032);
    soleMesh.castShadow = true;
    shoeGroup.add(soleMesh);

    // 3. Tapered Almond Toe
    const toeGeom = new THREE.ConeGeometry(0.029, 0.068, 16);
    const toeMesh = new THREE.Mesh(toeGeom, mat);
    toeMesh.rotation.x = Math.PI / 2;
    toeMesh.position.set(posX, -1.250, 0.128);
    toeMesh.scale.set(0.95, 1.0, 0.55);
    toeMesh.castShadow = true;
    shoeGroup.add(toeMesh);
  }

  return shoeGroup;
}

/**
 * Procedural Anatomical 3D Human Boutique Mannequin (Male & Female).
 * True continuous organic surface modeling (Zero joint seams):
 * - Seamless Head & Neck (y = 1.54 .. 1.08)
 * - Sculpted Anatomical Torso (y = 1.08 .. 0.10)
 * - Seamless Continuous Arms (y = 1.05 .. 0.44)
 * - Sculpted Boutique Hands with distinct relaxed fingers
 * - Seamless Continuous Legs (y = 0.10 .. -1.15)
 * - Minimalist Boutique Footwear & Turntable Plinth (y = -1.15 .. -1.30)
 */
export function createHumanMannequin(
  gender: MannequinGender = "female",
  _category: string = "Tops",
  skinFinish: MannequinFinish = "slate"
): THREE.Group {
  const group = new THREE.Group();
  group.name = "human_mannequin";

  // Pure garment mesh display: zero mannequin, zero rods, zero collision/interference
  if (gender === "none") {
    return group;
  }

  const isFemale = gender === "female";

  // Base materials
  const brushedMetal = new THREE.MeshStandardMaterial({
    name: "mat_mannequin_base",
    color: 0xcbd5e1,
    roughness: 0.25,
    metalness: 0.82,
  });

  const accentRingMat = new THREE.MeshStandardMaterial({
    name: "mat_mannequin_accent",
    color: isFemale ? 0x10b981 : 0x0284c7,
    roughness: 0.3,
    metalness: 0.5,
    emissive: new THREE.Color(isFemale ? 0x064e3b : 0x0369a1),
    emissiveIntensity: 0.2,
  });

  // Architectural turntable plinth disc sitting at floor level y = -1.30
  const baseGeom = new THREE.CylinderGeometry(0.44, 0.46, 0.024, 48);
  const baseMesh = new THREE.Mesh(baseGeom, brushedMetal);
  baseMesh.position.set(0, -1.312, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Accent ring around the plinth edge
  const ringGeom = new THREE.TorusGeometry(0.442, 0.005, 12, 64);
  const ringMesh = new THREE.Mesh(ringGeom, accentRingMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.set(0, -1.302, 0);
  group.add(ringMesh);

  // Boutique showroom polished chrome calf fitting rod (Images 1 & 3)
  const chromeRodMat = new THREE.MeshStandardMaterial({
    name: "mat_fitting_rod",
    color: 0xe2e8f0,
    roughness: 0.12,
    metalness: 0.95,
  });

  const rodGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.58, 16);
  const rodMesh = new THREE.Mesh(rodGeom, chromeRodMat);
  rodMesh.position.set(isFemale ? 0.088 : 0.095, -1.01, -0.075);
  rodMesh.castShadow = true;
  group.add(rodMesh);

  const flangeGeom = new THREE.CylinderGeometry(0.022, 0.026, 0.012, 24);
  const flangeMesh = new THREE.Mesh(flangeGeom, chromeRodMat);
  flangeMesh.position.set(isFemale ? 0.088 : 0.095, -1.294, -0.075);
  group.add(flangeMesh);

  const pinGeom = new THREE.CylinderGeometry(0.0055, 0.0055, 0.05, 12);
  const pinMesh = new THREE.Mesh(pinGeom, chromeRodMat);
  pinMesh.rotation.x = Math.PI / 2;
  pinMesh.position.set(isFemale ? 0.088 : 0.095, -0.72, -0.05);
  group.add(pinMesh);

  // Grounded contact shadow discs under shoe soles
  const contactShadowMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  for (const side of [-1, 1]) {
    const lPosX = side * (isFemale ? 0.088 : 0.095);
    const shadowGeom = new THREE.CircleGeometry(0.062, 24);
    const shadowMesh = new THREE.Mesh(shadowGeom, contactShadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.scale.set(0.65, 1.45, 1.0);
    shadowMesh.position.set(lPosX, -1.298, 0.038);
    group.add(shadowMesh);
  }


  // --- Real-World Boutique Mannequin Materials (Images 1, 2, 3) ---
  const bodyColor =
    skinFinish === "white" || skinFinish === "alabaster"
      ? 0xf1f5f9 // Clean Matte Gallery Alabaster
      : skinFinish === "charcoal"
      ? 0x181c24 // Deep Satin Obsidian/Charcoal (Image 3 right)
      : skinFinish === "linen"
      ? 0xe2ddd5 // Atelier Linen Form (Image 2)
      : 0x2b3340; // Understated Studio Charcoal/Slate - allows clothing to dominate

  const mannequinMat = new THREE.MeshPhysicalMaterial({
    name: "mat_mannequin_body",
    color: bodyColor,
    roughness:
      skinFinish === "linen"
        ? 0.76
        : skinFinish === "white" || skinFinish === "alabaster"
        ? 0.48
        : 0.54,
    metalness: 0.01,
    clearcoat: skinFinish === "linen" ? 0.0 : 0.08,
    clearcoatRoughness: 0.38,
    reflectivity: 0.3,
    side: THREE.DoubleSide,
  });

  const soleMat = new THREE.MeshStandardMaterial({
    name: "mat_mannequin_sole",
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.08,
  });

  // 1. Seamless Head & Neck (y = 1.54 down to y = 1.08)
  const headAndNeckMesh = createSeamlessHeadAndNeck(isFemale, mannequinMat);
  group.add(headAndNeckMesh);

  // 2. Parametric Sculpted Anatomical Torso (y = 1.08 down to y = 0.10)
  // Modeled with realistic boutique retail proportions (Zara / Mango / Nike)
  // so all tops and bottoms drape with guaranteed positive clearance and zero clipping.
  const segsU = 48;
  const segsV = 28;
  const yTop = 1.08; // clavicles
  const yBot = 0.10; // crotch fork base
  const torsoGeom = new THREE.BufferGeometry();
  const tPos: number[] = [];
  const tUvs: number[] = [];
  const tIdx: number[] = [];

  for (let iv = 0; iv <= segsV; iv++) {
    const v = iv / segsV;
    const y = yTop - v * (yTop - yBot);

    let rx = 0.16;
    let rz = 0.11;

    if (isFemale) {
      // Female boutique proportions: elegant shoulders, sculpted bust, slender waist, graceful hips
      if (y > 1.00) {
        // Clavicle to shoulder slope (y = 1.08 -> 1.00)
        const t = (1.08 - y) / 0.08;
        rx = 0.056 + 0.122 * t; // reaches 0.178 shoulder
        rz = 0.064 + 0.018 * t; // reaches 0.082
      } else if (y > 0.85) {
        // Shoulder to bust (y = 1.00 -> 0.85)
        const t = (1.00 - y) / 0.15;
        rx = 0.178 - 0.028 * t; // reaches 0.150
        rz = 0.082 + 0.022 * t; // reaches 0.104
      } else if (y > 0.52) {
        // Bust to natural waist (y = 0.85 -> 0.52)
        const t = (0.85 - y) / 0.33;
        rx = 0.150 - 0.030 * Math.sin(t * Math.PI * 0.5); // reaches 0.120 slender waist
        rz = 0.104 - 0.020 * Math.sin(t * Math.PI * 0.5); // reaches 0.084
      } else if (y > 0.25) {
        // Waist to full hip / pelvis flare (y = 0.52 -> 0.25)
        const t = (0.52 - y) / 0.27;
        rx = 0.120 + 0.050 * Math.sin(t * Math.PI * 0.5); // flares to 0.170 hips
        rz = 0.084 + 0.044 * Math.sin(t * Math.PI * 0.5); // flares to 0.128
      } else {
        // Pelvis to crotch fork base (y = 0.25 -> 0.10)
        const t = (0.25 - y) / 0.15;
        rx = 0.170 - 0.020 * t; // to 0.150
        rz = 0.128 - 0.018 * t; // to 0.110
      }
    } else {
      // Male boutique proportions: broad shoulders, athletic chest, slim V-taper waist
      if (y > 1.00) {
        // Clavicle to shoulder slope (y = 1.08 -> 1.00)
        const t = (1.08 - y) / 0.08;
        rx = 0.071 + 0.134 * t; // slopes out to 0.205 shoulder line
        rz = 0.080 + 0.016 * t; // reaches 0.096
      } else if (y > 0.85) {
        // Shoulder to chest pecs (y = 1.00 -> 0.85)
        const t = (1.00 - y) / 0.15;
        rx = 0.205 - 0.035 * t; // reaches 0.170
        rz = 0.096 + 0.024 * t; // reaches 0.120
      } else if (y > 0.52) {
        // Chest to natural waist (y = 0.85 -> 0.52)
        const t = (0.85 - y) / 0.33;
        rx = 0.170 - 0.032 * Math.sin(t * Math.PI * 0.5); // reaches 0.138 waist
        rz = 0.120 - 0.022 * Math.sin(t * Math.PI * 0.5); // reaches 0.098
      } else if (y > 0.25) {
        // Waist to hips (y = 0.52 -> 0.25)
        const t = (0.52 - y) / 0.27;
        rx = 0.138 + 0.027 * Math.sin(t * Math.PI * 0.5); // flares to 0.165
        rz = 0.098 + 0.028 * Math.sin(t * Math.PI * 0.5); // flares to 0.126
      } else {
        // Pelvis to crotch fork (y = 0.25 -> 0.10)
        const t = (0.25 - y) / 0.15;
        rx = 0.165 - 0.010 * t; // to 0.155
        rz = 0.126 - 0.011 * t; // to 0.115
      }
    }

    for (let iu = 0; iu <= segsU; iu++) {
      const u = iu / segsU;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      let bustBulge = 0;
      let pecBulge = 0;
      let gluteBulge = 0;

      if (isFemale) {
        // High shapely bust curves with natural apexes
        if (y >= 0.76 && y <= 0.92) {
          const bustV = Math.max(0, 1 - Math.pow((y - 0.84) / 0.08, 2));
          const leftDist = Math.hypot(sinT - 0.40, cosT - 0.88);
          const rightDist = Math.hypot(sinT + 0.40, cosT - 0.88);
          bustBulge =
            bustV *
            (Math.exp(-Math.pow(leftDist / 0.36, 2)) +
              Math.exp(-Math.pow(rightDist / 0.36, 2))) *
            0.024;
        }
        // Glute curve in back
        if (y >= 0.15 && y <= 0.38 && cosT < -0.2) {
          const gluteV = Math.max(0, 1 - Math.pow((y - 0.26) / 0.11, 2));
          gluteBulge = gluteV * Math.pow(-cosT, 1.4) * 0.018;
        }
      } else {
        // Male athletic pectoral chest plates
        if (y >= 0.78 && y <= 0.94 && cosT > 0.3) {
          const pecV = Math.max(0, 1 - Math.pow((y - 0.86) / 0.075, 2));
          pecBulge = pecV * Math.pow(cosT, 1.2) * 0.012;
        }
        // Athletic glutes in back
        if (y >= 0.15 && y <= 0.38 && cosT < -0.25) {
          const gluteV = Math.max(0, 1 - Math.pow((y - 0.26) / 0.11, 2));
          gluteBulge = gluteV * Math.pow(-cosT, 1.3) * 0.014;
        }
      }

      const px = sinT * rx;
      const pz = cosT * rz + (bustBulge || pecBulge || 0) - gluteBulge;
      const py = y;

      tPos.push(px, py, pz);
      tUvs.push(u, v);
    }
  }

  for (let iv = 0; iv < segsV; iv++) {
    for (let iu = 0; iu < segsU; iu++) {
      const a = iv * (segsU + 1) + iu;
      const b = a + 1;
      const c = a + (segsU + 1);
      const d = c + 1;
      tIdx.push(a, c, b, b, c, d);
    }
  }

  torsoGeom.setIndex(tIdx);
  torsoGeom.setAttribute("position", new THREE.Float32BufferAttribute(tPos, 3));
  torsoGeom.setAttribute("uv", new THREE.Float32BufferAttribute(tUvs, 2));
  torsoGeom.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeom, mannequinMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // 3. Seamless Continuous Sculpted Arms & Hands (Images 1 & 3)
  for (const side of [-1, 1]) {
    const armMesh = createSeamlessSculptedArm(side, isFemale, mannequinMat);
    group.add(armMesh);

    const handGroup = createBoutiqueSculptedHand(side, isFemale, mannequinMat);
    group.add(handGroup);
  }

  // 4. Seamless Continuous Sculpted Legs & Boutique Footwear (Images 1 & 3)
  const legOffsetX = isFemale ? 0.088 : 0.095;
  for (const side of [-1, 1]) {
    const lPosX = side * legOffsetX;

    // Seamless continuous leg from pelvic root down to ankle
    const legMesh = createSeamlessSculptedLeg(side, isFemale, mannequinMat);
    group.add(legMesh);

    // Boutique shoe / footwear resting on the turntable plinth
    const shoe = createBoutiqueFootwear(lPosX, isFemale, mannequinMat, soleMat);
    group.add(shoe);
  }

  return group;
}

export function createMannequinPedestal(
  category: string = "Outerwear",
  gender: MannequinGender = "female"
): THREE.Group {
  return createHumanMannequin(gender, category);
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

  // Anatomical fit multipliers per garment silhouette - generous ease so clothes dominate
  const torsoScaleX = isScratch
    ? (scratchConfig?.chestWidth || 148) / 148
    : isHoodie
    ? 1.08
    : isSweater
    ? 1.06
    : isTrackJacket
    ? 1.05
    : isBlazer
    ? 1.07
    : isGown
    ? 0.96
    : 1.03;
  const torsoScaleZ = isHoodie
    ? 1.12
    : isSweater
    ? 1.08
    : isTrackJacket
    ? 1.06
    : isBlazer
    ? 1.08
    : isGown
    ? 0.96
    : 1.04;

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

      // Project exact 1:1 planar UV coordinates onto Front & Back Torso AND Sleeves
      // so the entire 2D mesh design (torso, arms, cuffs, sleeve stripes, artwork) maps continuously across the 3D model
      if (!isInside && uvAttr) {
        const isBack = isBackTorso || (isSleeve && z < -0.035);
        const uCoord = isBack
          ? Math.max(0.005, Math.min(0.995, 0.5 - origX / 0.70))
          : Math.max(0.005, Math.min(0.995, 0.5 + origX / 0.70));
        const vCoord = Math.max(0.005, Math.min(0.995, (1.635 - origY) / 0.70));
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

          // New central axis extending naturally down along the sculpted arm to wrist level
          const newAbsX =
            seamX * torsoScaleX +
            distFromSeam * 0.25 +
            0.045 * sleeveExtensionRatio * Math.pow(t, 0.92) +
            Math.max(0, dyLocal) * 0.15 * Math.min(1, t);
          const newCenterY = origCenterY - 0.545 * sleeveExtensionRatio * Math.pow(t, 1.05);
          const newCenterZ =
            origCenterZ + 0.022 * sleeveExtensionRatio * Math.sin(Math.min(1, t) * Math.PI * 0.88);

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

  // Center and scale `Cloth_1` (raw Y bounds: 0.936..1.629)
  // so it drapes over the boutique mannequin with generous volume that dominates the silhouette
  const scale = isGown ? 1.02 : isBlazer ? 1.07 : isHoodie ? 1.06 : isTrackJacket ? 1.05 : 1.04;
  const targetTopY = isTrackJacket ? 1.115 : isGown ? 1.095 : isBlazer ? 1.108 : 1.100;
  const rawTopY = 1.629;
  const yOffset = targetTopY - rawTopY * scale;
  morphedWrapper.scale.set(scale, scale, scale);
  morphedWrapper.position.set(0, yOffset, 0.005);

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

  const yWaistTop = 0.46;
  const yWaistBot = 0.38;
  // Modern baggy jeans & tailored trousers run full-length and drape cleanly over shoes
  const yAnkle = isShorts ? -0.22 : isJeans ? -1.18 : -1.15;

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
      ? 0.0006 * Math.sin(theta * 8)
      : 0.0035 * Math.sin(theta * 24) * Math.sin(v * Math.PI);
    const rx = (isJeans ? 0.158 : 0.162) + 0.007 * v + gather;
    const rz = (isJeans ? 0.118 : 0.122) + 0.007 * v + gather;
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
    const legSplit = Math.pow(Math.min(1, v / 0.18), 0.75);
    const centerX = side * (0.095 * legSplit);
    const centerZ =
      !isShorts && v > 0.35 && v < 0.75
        ? (isJeans ? 0.006 : 0.008) * Math.sin(((v - 0.35) / 0.4) * Math.PI)
        : 0;

    let rx = isJeans
      ? 0.093 * (1 - 0.03 * Math.pow(v, 0.9))
      : 0.089 * (1 - 0.04 * Math.pow(v, 0.9));
    let rz = isJeans
      ? 0.095 * (1 - 0.04 * Math.pow(v, 0.9))
      : 0.091 * (1 - 0.05 * Math.pow(v, 0.9));

    if (isShorts) {
      rx = 0.098 + 0.008 * v;
      rz = 0.100 + 0.006 * v;
    } else if (isJoggers && v > 0.82) {
      if (v < 0.93) {
        const puff = 0.012 * Math.sin(((v - 0.82) / 0.11) * Math.PI);
        rx += puff;
        rz += puff;
      } else {
        rx = 0.042;
        rz = 0.044;
      }
    } else if (isJeans && v > 0.88) {
      const flare = 0.006 * Math.pow((v - 0.88) / 0.12, 1.4);
      rx += flare;
      rz += flare * 0.6;
    }

    const hipBlend = Math.pow(Math.max(0, 1 - v / 0.20), 1.6);
    const hipRxTarget = (isJeans ? 0.186 : 0.190) - 0.036;
    const hipRzTarget = isJeans ? 0.149 : 0.153;
    rx += Math.max(0, hipRxTarget - rx) * hipBlend;
    rz += Math.max(0, hipRzTarget - rz) * hipBlend;

    let totalOffset = radialOffset;
    if (isJeans) {
      // Long vertical drape folds of heavy relaxed denim (grow toward the hem)
      const verticalFolds =
        (0.0020 + 0.0065 * Math.pow(v, 1.2)) *
        Math.sin(theta * 4 + side * 1.1 + v * 1.8) *
        (v > 0.05 ? 1 : v / 0.05);
      // Soft crotch/upper-thigh pull lines on the front
      const thighPull =
        !isBack && v > 0.16 && v < 0.34
          ? 0.0025 * Math.sin((v - 0.16) * 60 + Math.cos(theta) * 2) *
            Math.sin(((v - 0.16) / 0.18) * Math.PI) *
            Math.max(0, -side * Math.sin(theta))
          : 0;
      // Stacked hem: horizontal compression rings where the length breaks over the shoe
      const stack =
        v > 0.8
          ? 0.0085 *
            Math.sin((v - 0.8) * 88 + theta * 1.3 + side) *
            Math.pow((v - 0.8) / 0.2, 0.9) *
            (v > 0.985 ? (1 - v) / 0.015 : 1)
          : 0;
      totalOffset += verticalFolds + thighPull + stack;
    } else {
      // Knee articulation & ankle breaks for joggers / leggings / shorts
      const kneeFold =
        !isShorts && v > 0.38 && v < 0.65
          ? 0.0052 *
            Math.sin((v - 0.38) * 44 + Math.cos(theta * 2) * 1.4) *
            Math.sin(((v - 0.38) / 0.27) * Math.PI)
          : 0;
      const ankleFold =
        !isShorts && v > 0.72 && v < 0.93
          ? 0.0038 * Math.sin(v * 56 + theta * 2) * Math.sin(((v - 0.72) / 0.21) * Math.PI)
          : 0;
      const verticalDrape = 0.0024 * Math.sin(theta * 6 + v * 3);
      totalOffset += kneeFold + ankleFold + verticalDrape;
    }

    let x = centerX + Math.sin(theta) * (rx + totalOffset);
    const z = centerZ + Math.cos(theta) * (rz + totalOffset);

    // Fuse inner pelvic rise seam above the crotch (v < 0.18) so front & back seat are seamless
    if (v < 0.18 && side * x < 0.025) {
      const blend = 1 - v / 0.18;
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
          const svgX = 300 + (planarX / 0.22) * 145;
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
      const btnPos = new THREE.Vector3(Math.sin(0.04) * rx, 0.43, Math.cos(0.04) * rz);

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

  // 1:1 scale for precise fit on the mannequin
  group.scale.set(1.0, 1.0, 1.0);
  group.position.set(0, 0, 0);
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
      const y = 1.100 - v * 0.69;
      const rx = 0.224 - 0.036 * v;
      const rz = 0.158 - 0.024 * v;

      for (let iu = 0; iu <= uSegs; iu++) {
        const u = iu / uSegs;
        const theta = isBack
          ? Math.PI / 2 + u * Math.PI
          : -Math.PI / 2 + u * Math.PI;
        const wrinkle = 0.006 * Math.sin(theta * 8 + v * 6) * Math.sin(v * Math.PI);
        positions.push(
          Math.sin(theta) * (rx + wrinkle),
          y,
          Math.cos(theta) * (rz + wrinkle) + 0.005
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

  // 3D Draped Sleeves for Procedural Fallback so arms are immediately displayed
  for (const side of [-1, 1]) {
    const sleeveGeom = new THREE.BufferGeometry();
    const sPositions: number[] = [];
    const sUvs: number[] = [];
    const sIndices: number[] = [];
    const sRings = 16;
    const sRadSegs = 20;

    for (let iv = 0; iv <= sRings; iv++) {
      const v = iv / sRings;
      const y = 1.05 - v * 0.22;
      const cx = side * (0.205 + v * 0.085);
      const cz = 0.005 + v * 0.012;
      const rx = 0.046 - v * 0.006;
      const rz = 0.048 - v * 0.006;

      for (let iu = 0; iu <= sRadSegs; iu++) {
        const u = iu / sRadSegs;
        const theta = u * Math.PI * 2;
        const px = cx + Math.sin(theta) * rx;
        const py = y;
        const pz = cz + Math.cos(theta) * rz;
        sPositions.push(px, py, pz);

        const isBack = Math.cos(theta) < -0.2;
        const uCoord = isBack
          ? Math.max(0.005, Math.min(0.995, 0.5 - px / 0.70))
          : Math.max(0.005, Math.min(0.995, 0.5 + px / 0.70));
        const vCoord = Math.max(0.005, Math.min(0.995, (1.635 - py) / 0.70));
        sUvs.push(uCoord, vCoord);
      }
    }

    for (let iv = 0; iv < sRings; iv++) {
      for (let iu = 0; iu < sRadSegs; iu++) {
        const a = iv * (sRadSegs + 1) + iu;
        const b = a + 1;
        const c = a + (sRadSegs + 1);
        const d = c + 1;
        sIndices.push(a, c, b, b, c, d);
      }
    }

    sleeveGeom.setIndex(sIndices);
    sleeveGeom.setAttribute("position", new THREE.Float32BufferAttribute(sPositions, 3));
    sleeveGeom.setAttribute("uv", new THREE.Float32BufferAttribute(sUvs, 2));
    sleeveGeom.computeVertexNormals();
    group.add(new THREE.Mesh(sleeveGeom, frontMat));
  }

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.082, 0.014, 16, 48),
    collarMat
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.095, 0.005);
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
  const baseRoughness = isJeans ? 0.70 : isSilk ? 0.32 : isTechWoven ? 0.52 : 0.62;
  const activeClothBump = isJeans ? denimBump : wovenBump;
  const activeBumpScale = isJeans ? 0.0022 : 0.0012;

  // Real-world physical cloth micro-fiber sheen properties
  // Pure cotton, twill, fleece, denim, and performance woven fabrics have ZERO sheen (0.0)
  // so the pure pigment color is not washed out by specular glare or milky fog!
  const makeSheenColor = (hex: string) =>
    new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.15);

  const fabricSheen = isSilk ? 0.35 : 0.0;
  const fabricSheenColor = makeSheenColor(primaryColor);
  const fabricSheenRoughness = isSilk ? 0.25 : 0.50;

  // Front & Back Torso/Legs Cloth Materials with Woven/Denim Micro-Bump & 1:1 UV Projection
  const frontMat = new THREE.MeshPhysicalMaterial({
    name: "mat_front_body",
    map: frontTexture || null,
    color: frontTexture ? 0xffffff : new THREE.Color(primaryColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: fabricSheenColor,
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  const backMat = new THREE.MeshPhysicalMaterial({
    name: "mat_back_body",
    map: backTexture || null,
    color: backTexture ? 0xffffff : new THREE.Color(primaryColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: fabricSheenColor,
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  // Interior Cloth Lining Material (slightly darker shade of body color for realistic depth inside neck/hem)
  const insideColor = new THREE.Color(primaryColor).multiplyScalar(0.62);
  const insideMat = new THREE.MeshPhysicalMaterial({
    name: "mat_inside_lining",
    color: insideColor,
    bumpMap: wovenBump,
    bumpScale: 0.002,
    roughness: 0.82,
    metalness: 0.0,
    sheen: 0.0,
    sheenColor: makeSheenColor(primaryColor),
    sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });

  // Collar Rib Material
  const collarMat = new THREE.MeshPhysicalMaterial({
    name: "mat_collar",
    map: frontTexture || null,
    color: frontTexture ? 0xffffff : new THREE.Color(collarColor),
    bumpMap: ribbedBump,
    bumpScale: 0.003,
    roughness: 0.75,
    metalness: 0.0,
    sheen: 0.0,
    sheenColor: makeSheenColor(collarColor),
    sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });

  // Hood Cloth Material
  const hoodMat = new THREE.MeshPhysicalMaterial({
    name: "mat_hood",
    color: new THREE.Color(hoodColor),
    bumpMap: wovenBump,
    bumpScale: 0.002,
    roughness: baseRoughness,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: makeSheenColor(hoodColor),
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  // Independent Left & Right Sleeve Materials (mapped with 2D texture so arms display full artwork, patterns & colors)
  const sleeveLMat = new THREE.MeshPhysicalMaterial({
    name: "mat_sleeve_l",
    map: frontTexture || null,
    color: frontTexture ? 0xffffff : new THREE.Color(sleeveLColor),
    bumpMap: wovenBump,
    bumpScale: 0.002,
    roughness: baseRoughness,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: makeSheenColor(sleeveLColor),
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  const sleeveRMat = new THREE.MeshPhysicalMaterial({
    name: "mat_sleeve_r",
    map: frontTexture || null,
    color: frontTexture ? 0xffffff : new THREE.Color(sleeveRColor),
    bumpMap: wovenBump,
    bumpScale: 0.002,
    roughness: baseRoughness,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: makeSheenColor(sleeveRColor),
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  // Independent Left & Right Wrist Cuff Materials
  const cuffLMat = new THREE.MeshPhysicalMaterial({
    name: "mat_cuff_l",
    map: frontTexture || null,
    color: frontTexture ? 0xffffff : new THREE.Color(cuffLColor),
    bumpMap: ribbedBump,
    bumpScale: 0.003,
    roughness: 0.72,
    metalness: 0.0,
    sheen: 0.0,
    sheenColor: makeSheenColor(cuffLColor),
    sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });

  const cuffRMat = new THREE.MeshPhysicalMaterial({
    name: "mat_cuff_r",
    map: frontTexture || null,
    color: frontTexture ? 0xffffff : new THREE.Color(cuffRColor),
    bumpMap: ribbedBump,
    bumpScale: 0.003,
    roughness: 0.72,
    metalness: 0.0,
    sheen: 0.0,
    sheenColor: makeSheenColor(cuffRColor),
    sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });

  // Sleeve Stripes Material
  const sleeveStripeMat = new THREE.MeshPhysicalMaterial({
    name: "mat_sleeve_stripe",
    map: frontTexture || null,
    color: frontTexture ? 0xffffff : new THREE.Color(sleeveStripeColor),
    bumpMap: wovenBump,
    bumpScale: 0.002,
    roughness: 0.65,
    metalness: 0.0,
    sheen: 0.0,
    sheenColor: makeSheenColor(sleeveStripeColor),
    sheenRoughness: 0.4,
    side: THREE.DoubleSide,
  });

  // Kangaroo / Scoop / Spade Pocket Material
  const pocketMat = new THREE.MeshPhysicalMaterial({
    name: "mat_pocket",
    color: new THREE.Color(pocketColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: makeSheenColor(pocketColor),
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  // Placket / J-Fly Material
  const placketMat = new THREE.MeshPhysicalMaterial({
    name: "mat_placket",
    color: new THREE.Color(placketColor),
    bumpMap: isJeans ? activeClothBump : ribbedBump,
    bumpScale: isJeans ? activeBumpScale : 0.003,
    roughness: isJeans ? baseRoughness : 0.55,
    metalness: 0.05,
    sheen: fabricSheen,
    sheenColor: makeSheenColor(placketColor),
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  // Drawstring / Laces Material
  const drawstringMat = new THREE.MeshPhysicalMaterial({
    name: "mat_drawstring",
    color: new THREE.Color(drawstringColor),
    bumpMap: ribbedBump,
    bumpScale: 0.004,
    roughness: 0.6,
    metalness: 0.0,
    sheen: 0.40,
    sheenColor: makeSheenColor(drawstringColor),
    sheenRoughness: 0.45,
    side: THREE.DoubleSide,
  });

  // Waistband Material for Bottoms
  const waistbandMat = new THREE.MeshPhysicalMaterial({
    name: "mat_waistband",
    color: new THREE.Color(waistbandColor),
    bumpMap: isJeans ? activeClothBump : ribbedBump,
    bumpScale: isJeans ? activeBumpScale : 0.004,
    roughness: isJeans ? baseRoughness : 0.68,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: makeSheenColor(waistbandColor),
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  // Yoke Material (Western Back V-Yoke on Jeans)
  const yokeMat = new THREE.MeshPhysicalMaterial({
    name: "mat_yoke",
    color: new THREE.Color(yokeColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: makeSheenColor(yokeColor),
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  //Selvedge Turn-Up Cuff Material for Bottoms
  const cuffMat = new THREE.MeshPhysicalMaterial({
    name: "mat_cuff",
    color: new THREE.Color(cuffColor),
    bumpMap: activeClothBump,
    bumpScale: activeBumpScale,
    roughness: baseRoughness,
    metalness: 0.0,
    sheen: fabricSheen,
    sheenColor: makeSheenColor(cuffColor),
    sheenRoughness: fabricSheenRoughness,
    side: THREE.DoubleSide,
  });

  // Zipper Hardware & Welt Material (updates with zoneColors.zipper)
  const zipperMat = new THREE.MeshStandardMaterial({
    name: "mat_zipper",
    color: new THREE.Color(zipperColor),
    metalness: 0.85,
    roughness: 0.22,
    side: THREE.DoubleSide,
  });

  // 1. Bottoms (Original 5-Pocket Denim Jeans, Joggers, Basketball Shorts, Leggings)
  const isBottom =
    category === "Bottoms" ||
    id.includes("joggers") ||
    id.includes("jeans") ||
    id.includes("denim") ||
    id.includes("shorts") ||
    id.includes("leggings") ||
    id.includes("trouser") ||
    id.includes("pants") ||
    id.includes("slacks");

  if (isBottom) {
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

/**
 * Builds complementary studio apparel so mannequins are never half-dressed:
 * - When designing Tops/Outerwear: builds neutral dark studio tailored trousers
 * - When designing Bottoms: builds neutral studio crew tee
 * - When designing Dresses: returns null (full-body garment)
 */
export function buildComplementaryStudioGarment(
  category: string,
  gltfShirtModel?: THREE.Group | null
): THREE.Group | null {
  const cat = category.toLowerCase();
  const isBottom = cat === "bottoms";
  const isDress = cat === "dresses";
  if (isDress) return null;

  if (isBottom) {
    // When customizing Bottoms, provide a sleek neutral studio tee on top (Images 1 & 3)
    const neutralTeeColors: Record<string, string> = {
      body: "#334155",
      collar: "#1e293b",
      sleeveL: "#334155",
      sleeveR: "#334155",
    };
    return buildGarment3DModel({
      garmentId: "tee",
      category: "Tops",
      frontTexture: null,
      backTexture: null,
      zoneColors: neutralTeeColors,
      gltfShirtModel,
    });
  } else {
    // When customizing Tops/Outerwear/etc., provide sleek dark studio tailored trousers (Images 1 & 3)
    const neutralPantsColors: Record<string, string> = {
      body: "#1e293b",
      waistband: "#0f172a",
      pocket: "#1e293b",
      yoke: "#1e293b",
      cuff: "#0f172a",
    };
    return buildGarment3DModel({
      garmentId: "tailored-trousers",
      category: "Bottoms",
      frontTexture: null,
      backTexture: null,
      zoneColors: neutralPantsColors,
      gltfShirtModel,
    });
  }
}
