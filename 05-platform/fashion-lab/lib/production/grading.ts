/**
 * FASHION-LAB: MULTI-SIZE APPAREL PATTERN GRADING ENGINE
 * 
 * Mathematically accurate pattern grading following ISO 8559-1 and ASTM D5585 standards:
 * - Computes proportional growth deltas across chest, waist, hips, shoulder slope,
 *   scye depth, neck aperture, bicep circumference, and garment lengths.
 * - Produces nested multi-size overlays (XS through XXL) for professional CAD visualization.
 * - Dynamically regrades all 5 pattern pieces while maintaining strict sewing seam topology.
 */

import { BodyMeasurementProfile, PatternPiece, GarmentProject } from './types';
import { draftTShirt, TShirtDraftOptions } from './drafting/tshirt';
import { computeCuttingPlan } from './nesting';

export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export const STANDARD_SIZES: GarmentSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/**
 * Standard Anthropometric Grading Tables (ISO 8559-1 / ASTM D5585 Menswear/Unisex)
 * Values stored in centimeters (cm)
 */
export const SIZE_PROFILES: Record<GarmentSize, BodyMeasurementProfile> = {
  XS: {
    id: 'profile_xs',
    name: 'Standard Extra Small (XS / EU 44 / US 34)',
    gender: 'unisex',
    unit: 'cm',
    height: 172,
    neckGirth: 36.5,
    shoulderWidth: 41,
    chestGirth: 88,
    waistGirth: 74,
    hipGirth: 90,
    armholeCircumference: 39,
    sleeveLength: 20.5,
    bicepCircumference: 29.5,
    wristCircumference: 16.5,
    frontLength: 65,
    backLength: 67,
    inseam: 78,
    outseam: 100,
    thighCircumference: 52,
    kneeCircumference: 35,
    ankleCircumference: 22,
    updatedAt: new Date().toISOString(),
  },
  S: {
    id: 'profile_s',
    name: 'Standard Small (S / EU 46-48 / US 36-38)',
    gender: 'unisex',
    unit: 'cm',
    height: 175,
    neckGirth: 37.5,
    shoulderWidth: 42.5,
    chestGirth: 92,
    waistGirth: 78,
    hipGirth: 94,
    armholeCircumference: 41,
    sleeveLength: 21,
    bicepCircumference: 31,
    wristCircumference: 17,
    frontLength: 66.5,
    backLength: 68.5,
    inseam: 79.5,
    outseam: 102,
    thighCircumference: 54,
    kneeCircumference: 36.5,
    ankleCircumference: 23,
    updatedAt: new Date().toISOString(),
  },
  M: {
    id: 'profile_m',
    name: 'Standard Medium (M / EU 50-52 / US 40-42)',
    gender: 'unisex',
    unit: 'cm',
    height: 178,
    neckGirth: 39,
    shoulderWidth: 44,
    chestGirth: 98,
    waistGirth: 84,
    hipGirth: 98,
    armholeCircumference: 43,
    sleeveLength: 22,
    bicepCircumference: 33,
    wristCircumference: 18,
    frontLength: 68,
    backLength: 70,
    inseam: 81,
    outseam: 104,
    thighCircumference: 56,
    kneeCircumference: 38,
    ankleCircumference: 24,
    updatedAt: new Date().toISOString(),
  },
  L: {
    id: 'profile_l',
    name: 'Standard Large (L / EU 54-56 / US 44-46)',
    gender: 'unisex',
    unit: 'cm',
    height: 181,
    neckGirth: 40.5,
    shoulderWidth: 46,
    chestGirth: 104,
    waistGirth: 90,
    hipGirth: 104,
    armholeCircumference: 45,
    sleeveLength: 23,
    bicepCircumference: 35,
    wristCircumference: 19,
    frontLength: 70,
    backLength: 72,
    inseam: 82.5,
    outseam: 106,
    thighCircumference: 59,
    kneeCircumference: 40,
    ankleCircumference: 25,
    updatedAt: new Date().toISOString(),
  },
  XL: {
    id: 'profile_xl',
    name: 'Standard Extra Large (XL / EU 58-60 / US 48-50)',
    gender: 'unisex',
    unit: 'cm',
    height: 184,
    neckGirth: 42,
    shoulderWidth: 48,
    chestGirth: 112,
    waistGirth: 98,
    hipGirth: 110,
    armholeCircumference: 47.5,
    sleeveLength: 24,
    bicepCircumference: 37.5,
    wristCircumference: 20,
    frontLength: 72,
    backLength: 74,
    inseam: 83.5,
    outseam: 108,
    thighCircumference: 62,
    kneeCircumference: 42,
    ankleCircumference: 26,
    updatedAt: new Date().toISOString(),
  },
  XXL: {
    id: 'profile_xxl',
    name: 'Standard Double Extra Large (XXL / EU 62-64 / US 52-54)',
    gender: 'unisex',
    unit: 'cm',
    height: 186,
    neckGirth: 43.5,
    shoulderWidth: 50,
    chestGirth: 120,
    waistGirth: 106,
    hipGirth: 116,
    armholeCircumference: 50,
    sleeveLength: 25,
    bicepCircumference: 40,
    wristCircumference: 21,
    frontLength: 74,
    backLength: 76,
    inseam: 84.5,
    outseam: 110,
    thighCircumference: 65,
    kneeCircumference: 44,
    ankleCircumference: 27,
    updatedAt: new Date().toISOString(),
  },
};

/**
 * Standardized High-Contrast Palette for Nested Size Grading Lines (as seen in Gerber/Lectra/Clo3D)
 */
export const SIZE_NEST_COLORS: Record<GarmentSize, string> = {
  XS: '#8B5CF6', // Royal Violet
  S: '#0284C7',  // Technical Cyan
  M: '#059669',  // Base Emerald (Production Master)
  L: '#D97706',  // Amber Gold
  XL: '#EA580C', // Precision Orange
  XXL: '#DC2626',// Crimson Red
};

/**
 * Grades all pattern pieces across all requested standard sizes simultaneously.
 * Used to render the CAD multi-size nested inspection overlay.
 */
export function gradePatternNest(
  sizes: GarmentSize[] = STANDARD_SIZES,
  draftOptions?: TShirtDraftOptions
): Record<GarmentSize, PatternPiece[]> {
  const nest: Partial<Record<GarmentSize, PatternPiece[]>> = {};

  for (const size of sizes) {
    const profile = SIZE_PROFILES[size];
    const drafted = draftTShirt(profile, draftOptions);
    nest[size] = drafted.pieces;
  }

  return nest as Record<GarmentSize, PatternPiece[]>;
}

/**
 * Computes dimensional growth deltas from a base size (default 'M') to target size
 */
export function computeGradeDeltas(
  baseSize: GarmentSize = 'M',
  targetSize: GarmentSize
): Record<string, number> {
  const base = SIZE_PROFILES[baseSize];
  const target = SIZE_PROFILES[targetSize];

  return {
    chestGirthDeltaCm: target.chestGirth - base.chestGirth,
    waistGirthDeltaCm: target.waistGirth - base.waistGirth,
    shoulderWidthDeltaCm: target.shoulderWidth - base.shoulderWidth,
    neckGirthDeltaCm: target.neckGirth - base.neckGirth,
    backLengthDeltaCm: target.backLength - base.backLength,
    sleeveLengthDeltaCm: target.sleeveLength - base.sleeveLength,
    bicepGirthDeltaCm: target.bicepCircumference - base.bicepCircumference,
  };
}

/**
 * Applies a target size grade to a working GarmentProject, recalculating
 * 2D pieces, sewing graph arc-lengths, and cutting layout while maintaining project metadata.
 */
export function gradeProject(
  project: GarmentProject,
  targetSize: GarmentSize,
  options?: TShirtDraftOptions
): GarmentProject {
  const newProfile = SIZE_PROFILES[targetSize];
  const drafted = draftTShirt(newProfile, options);
  const cutting = computeCuttingPlan(drafted.pieces);

  return {
    ...project,
    bodyProfile: newProfile,
    patternPieces: drafted.pieces,
    sewingRelationships: drafted.sewingRelationships,
    cuttingPlan: cutting,
    version: project.version + 1,
    updatedAt: new Date().toISOString(),
  };
}
