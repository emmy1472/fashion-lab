/**
 * FASHION-LAB: CANONICAL PRODUCTION DATA CONTRACTS
 * 
 * Strict, type-safe data architecture unifying all 9 stages of digital garment production:
 * 1. Body Measurements & Avatar Proportions
 * 2. 2D Pattern Drafting & Computational Geometry
 * 3. Fabric Materials & Cloth Physics
 * 4. Fabric Layout & Cutting Preparation
 * 5. Component Trimming & Bill of Materials
 * 6. Sewing Relationships & Garment Assembly
 * 7. Ironing, Pressing & Finishing Specifications
 * 8. Virtual Dressing, Fitting & Strain Heatmaps
 * 9. Presentation, Tech Pack & Commerce
 */

export type MeasurementUnit = 'cm' | 'in';

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

export interface GarmentMeshBuffer {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  strainColors: Float32Array; // RGB per vertex for fit heatmap
  pieceOffsets: Record<string, { startVertex: number; vertexCount: number; startIndex: number; indexCount: number }>;
}

import type { GarmentDesignState, GarmentCategory } from '@/lib/contracts/gdm';
export type { GarmentDesignState, GarmentCategory } from '@/lib/contracts/gdm';
export type { GarmentDocument, GDMValidationResult } from '@/lib/contracts/gdm';

export interface GarmentProject {
  id: string;
  name: string;
  garmentCategory: 't-shirt' | 'shirt' | 'trouser' | 'dress' | 'jacket' | 'hoodie';
  bodyProfile: BodyMeasurementProfile;
  patternPieces: PatternPiece[];
  sewingRelationships: SewingRelationship[];
  fabric: FabricMaterial;
  cuttingPlan: CuttingPlan;
  components: GarmentComponent[];
  assemblySequence: AssemblyStep[];
  finishing: FinishingSpecification;
  fitAnalysis?: FitAnalysis;
  design?: GarmentDesignState;
  activeStage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  version: number;
  createdAt: string;
  updatedAt: string;
}
