/**
 * FASHION-LAB: CANONICAL GARMENT DOCUMENT MODEL (GDM) SPECIFICATION
 * Specification Version: 1.0.0
 * 
 * The single source of truth data contract unifying:
 * - 2D CAD vector artwork & colorway design state
 * - 9-stage digital garment production engineering:
 *   1. Body Measurements & Avatar Proportions
 *   2. 2D Pattern Drafting & Computational Geometry
 *   3. Fabric Materials & XPBD Cloth Physics
 *   4. Fabric Nesting & CNC Cutting Layout
 *   5. Component Trimming & Bill of Materials (BOM)
 *   6. Directed Sewing Topology & Assembly Sequence
 *   7. Ironing, Pressing & Finishing Specifications
 *   8. Virtual Dressing, Fitting & Tension Analysis
 *   9. Presentation, Tech Pack & Commerce
 */

export const GDM_SCHEMA_VERSION = "1.0.0" as const;

export type MeasurementUnit = 'cm' | 'in';

export type GarmentCategory = 
  | 't-shirt' 
  | 'shirt' 
  | 'trouser' 
  | 'dress' 
  | 'jacket' 
  | 'hoodie';

export type ProjectStatus = 
  | 'draft' 
  | 'in_review' 
  | 'sample_approved' 
  | 'production_ready' 
  | 'archived';

export interface Point2D {
  x: number;
  y: number;
}

export interface BezierCurve2D {
  p0: Point2D;
  cp1: Point2D;
  cp2: Point2D;
  p1: Point2D;
}

export interface BodyMeasurementProfile {
  id: string;
  name: string;
  gender: 'unisex' | 'female' | 'male';
  unit: MeasurementUnit;
  // Core Anthropometric Landmarks (Stored internally in cm, converted on UI)
  height: number;
  neckGirth: number;
  shoulderWidth: number;
  chestGirth: number;
  waistGirth: number;
  hipGirth: number;
  armholeCircumference: number;
  sleeveLength: number;
  bicepCircumference: number;
  wristCircumference: number;
  frontLength: number;
  backLength: number;
  inseam: number;
  outseam: number;
  thighCircumference: number;
  kneeCircumference: number;
  ankleCircumference: number;
  updatedAt: string;
}

export interface PatternEdge {
  id: string;
  name: string; // e.g. "shoulder_left", "armhole_front", "side_seam_l", "hem", "neckline"
  edgeType: 'straight' | 'curve' | 'hem' | 'neckline' | 'waistband';
  startPoint: Point2D;
  endPoint: Point2D;
  controlPoints?: Point2D[]; // For cubic Bezier curves
  arcLength: number; // Length along the curve in mm
  seamAllowance: number; // Seam allowance in mm (standard 10mm seams, 20-30mm hems)
  notches: number[]; // Normalized positions (0.0 to 1.0) along edge for alignment marks
}

export interface PatternPiece {
  id: string;
  name: string; // e.g. "Front Bodice", "Back Bodice", "Left Sleeve", "Collar Band"
  pieceKey: 'front' | 'back' | 'sleeve_l' | 'sleeve_r' | 'collar' | 'cuff_l' | 'cuff_r' | 'pocket';
  category: 'bodice' | 'sleeve' | 'collar' | 'pocket' | 'cuff' | 'waistband';
  boundary: PatternEdge[]; // Closed polygon boundary of raw cutline (or seam line)
  seamLine: Point2D[]; // Closed polygon of actual stitch line
  cutLine: Point2D[]; // Closed polygon with seam allowance applied
  grainline: {
    start: Point2D;
    end: Point2D;
    angle: number; // 0 = parallel to fabric warp (vertical)
  };
  cutCount: number; // e.g., 1 on fold, 2 mirrored
  isMirrored: boolean;
  position2D: Point2D; // Placement on the 2D CAD canvas
  rotation2D: number;
  // 3D Spatial Pre-Arrangement parameters around the digital avatar
  arrangement3D: {
    anchor: 'TORSO_FRONT' | 'TORSO_BACK' | 'ARM_L' | 'ARM_R' | 'COLLAR' | 'WAIST_FRONT' | 'WAIST_BACK';
    centerOffset: [number, number, number]; // [X, Y, Z] relative to avatar landmark in meters
    cylinderRadius: number; // Curvature wrapping radius in meters (0 for flat)
    cylinderAngleSpan: number; // Angular span in radians around the body axis
    spin: number; // Rotation offset around axis
  };
}

export interface SewingRelationship {
  id: string;
  name: string;
  edgeA: { pieceId: string; edgeId: string; reverse?: boolean };
  edgeB: { pieceId: string; edgeId: string; reverse?: boolean };
  seamType: 'plain' | 'flat-felled' | 'overlock' | 'french' | 'bound';
  seamAllowance: number;
  lengthDifference: number; // arcLength(A) - arcLength(B) in mm
  toleranceMm: number; // Allowed discrepancy before warning (default 4mm)
  isValid: boolean;
  warning?: string;
}

export interface FabricMaterial {
  id: string;
  name: string;
  category: 'cotton' | 'denim' | 'silk' | 'wool' | 'polyester' | 'linen' | 'leather' | 'velvet' | 'chiffon' | 'satin';
  description: string;
  weightGSM: number; // Grams per square meter (e.g. 180 for t-shirt jersey, 400 for denim)
  thicknessMm: number; // Thickness in mm (e.g. 0.45mm)
  // XPBD Simulation physical properties
  stretchStiffness: number; // Young's modulus analog (0.1 soft stretch to 0.99 rigid)
  bendingStiffness: number; // Resistance to crease / fold (0.01 drapey to 0.9 stiff)
  shearStiffness: number; // Resistance to diagonal distortion
  densityKgM3: number; // Material volumetric density
  friction: number; // Surface friction against skin/itself
  damping: number; // Kinetic damping
  // PBR Visual Shading parameters
  baseColor: string;
  roughness: number;
  metallic: number;
  sheen: number;
  bumpScale: number;
  textureScale: number;
}

export interface FabricNestingItem {
  pieceId: string;
  pieceName: string;
  x: number; // mm from top-left of fabric roll
  y: number; // mm from top-left of fabric roll
  width: number; // Bounding box width
  height: number; // Bounding box height
  rotation: number; // degrees (strictly restricted to 0 or 180 to preserve grainline)
  polygon: Point2D[];
}

export interface CuttingPlan {
  fabricWidthMm: number; // Standard fabric roll width (e.g., 1400mm or 1500mm)
  totalLengthMm: number; // Total length of fabric roll consumed
  nestedPieces: FabricNestingItem[];
  totalFabricAreaMm2: number;
  occupiedPatternAreaMm2: number;
  wastePercentage: number;
  efficiencyPercentage: number;
  cuttingSequence: string[]; // Ordered piece IDs for optimal cutting path
}

export interface GarmentComponent {
  id: string;
  name: string;
  type: 'trim' | 'collar-rib' | 'cuff-rib' | 'button' | 'zipper' | 'interfacing' | 'thread' | 'label';
  materialName: string;
  quantity: number;
  unit: string;
  targetPieceId?: string;
  prepInstructions: string;
  status: 'pending' | 'prepared' | 'ready';
}

export interface AssemblyStep {
  stepNumber: number;
  title: string;
  sewingRelationshipIds: string[];
  instruction: string;
  machineType: 'lockstitch' | 'overlock-4thread' | 'coverstitch' | 'blind-hem';
  stitchDensitySpi: number; // Stitches per inch
  threadType: string;
  completed: boolean;
}

export interface FinishingSpecification {
  ironingTemperatureC: number;
  steamLevel: 'none' | 'low' | 'medium' | 'high';
  pressDirections: Array<{
    seamName: string;
    direction: 'open' | 'towards-back' | 'towards-front' | 'downward' | 'upward';
    notes?: string;
  }>;
  hemFinishMethod: string;
  inspectionChecklist: Array<{
    id: string;
    label: string;
    critical: boolean;
    verified: boolean;
  }>;
}

export interface FitAnalysis {
  maxTensionKPa: number;
  averageTensionKPa: number;
  tightAreas: string[];
  looseAreas: string[];
  easeValues: {
    chestEaseCm: number;
    waistEaseCm: number;
    hipEaseCm: number;
    bicepEaseCm: number;
  };
  fitScore: number; // 0 to 100
  overallAssessment: 'tight' | 'tailored' | 'relaxed' | 'loose';
}

export interface ArtworkLayer {
  id: string;
  type: 'image' | 'text' | 'graphic' | 'art';
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scale: number;
  view: 'front' | 'back';
  visible: boolean;
  locked?: boolean;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  artId?: string;
  text?: string;
  font?: string;
  size?: number;
  flipX?: boolean;
}

export interface GarmentDesignState {
  garmentId: string;
  zoneColors: Record<string, string>;
  patternSettings: {
    patternId: string;
    scale: number;
    color1?: string;
    color2?: string;
  };
  layersByView: {
    front: ArtworkLayer[];
    back: ArtworkLayer[];
  };
  pieceTransforms?: Record<string, { x: number; y: number; scale: number; rotation: number }>;
}

export interface GDMProjectMetadata {
  id: string;
  name: string;
  garmentCategory: GarmentCategory;
  status: ProjectStatus;
  version: number;
  authorId?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * THE CANONICAL GARMENT DOCUMENT (GDM)
 * Fully serializable JSON-compatible document model.
 */
export interface GarmentDocument {
  schemaVersion: typeof GDM_SCHEMA_VERSION;
  metadata: GDMProjectMetadata;
  bodyProfile: BodyMeasurementProfile;
  design: GarmentDesignState;
  patterns: {
    pieces: PatternPiece[];
    sewingRelationships: SewingRelationship[];
    activeUnits: MeasurementUnit;
  };
  material: FabricMaterial;
  manufacturing: {
    cuttingPlan: CuttingPlan;
    components: GarmentComponent[];
    assemblySequence: AssemblyStep[];
    finishing: FinishingSpecification;
  };
  fit?: FitAnalysis;
  activeStage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

/**
 * Validation Result Structure
 */
export interface GDMValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a GDM document against integrity rules
 */
export function validateGDM(doc: unknown): GDMValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!doc || typeof doc !== 'object') {
    return { isValid: false, errors: ['Document must be a non-null object'], warnings: [] };
  }

  const gdm = doc as Partial<GarmentDocument>;

  if (gdm.schemaVersion !== GDM_SCHEMA_VERSION) {
    errors.push(`Invalid or missing schemaVersion: expected "${GDM_SCHEMA_VERSION}", received "${gdm.schemaVersion}"`);
  }

  if (!gdm.metadata?.id || typeof gdm.metadata.id !== 'string') {
    errors.push('Missing or invalid metadata.id');
  }

  if (!gdm.metadata?.name || typeof gdm.metadata.name !== 'string') {
    errors.push('Missing or invalid metadata.name');
  }

  if (!gdm.bodyProfile) {
    errors.push('Missing bodyProfile in GDM document');
  } else {
    if (gdm.bodyProfile.chestGirth <= 0) errors.push('bodyProfile.chestGirth must be positive');
    if (gdm.bodyProfile.height <= 0) errors.push('bodyProfile.height must be positive');
  }

  const pieces = gdm.patterns?.pieces;
  if (!Array.isArray(pieces) || pieces.length === 0) {
    errors.push('patterns.pieces must be a non-empty array');
  } else {
    const pieceIds = new Set<string>();
    for (const piece of pieces) {
      if (!piece.id) errors.push('Found pattern piece without an id');
      if (pieceIds.has(piece.id)) errors.push(`Duplicate pattern piece id: "${piece.id}"`);
      pieceIds.add(piece.id);

      if (!Array.isArray(piece.boundary) || piece.boundary.length < 3) {
        errors.push(`Pattern piece "${piece.id}" boundary must contain at least 3 edges`);
      }
    }

    // Validate sewing relationships
    const seams = gdm.patterns?.sewingRelationships;
    if (Array.isArray(seams)) {
      for (const seam of seams) {
        if (!pieceIds.has(seam.edgeA.pieceId)) {
          errors.push(`Seam "${seam.id}" references non-existent edgeA pieceId "${seam.edgeA.pieceId}"`);
        }
        if (!pieceIds.has(seam.edgeB.pieceId)) {
          errors.push(`Seam "${seam.id}" references non-existent edgeB pieceId "${seam.edgeB.pieceId}"`);
        }
        if (Math.abs(seam.lengthDifference) > seam.toleranceMm * 2) {
          warnings.push(`Seam "${seam.id}" has high edge length discrepancy (${seam.lengthDifference.toFixed(1)}mm)`);
        }
      }
    }
  }

  if (!gdm.material || typeof gdm.material !== 'object') {
    errors.push('Missing or invalid material definition');
  } else {
    if (gdm.material.weightGSM <= 0) errors.push('material.weightGSM must be positive');
    if (gdm.material.stretchStiffness < 0 || gdm.material.stretchStiffness > 1) {
      errors.push('material.stretchStiffness must be between 0 and 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
