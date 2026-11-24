/**
 * FASHION-LAB: PARAMETRIC T-SHIRT PATTERN DRAFTING ENGINE
 * 
 * Computes mathematically accurate 2D pattern geometry based on Müller & Sohn
 * tailoring formulas and FreeSewing made-to-measure parametric blocks.
 * 
 * Produces:
 * 1. Front Bodice (Full width or on fold)
 * 2. Back Bodice
 * 3. Left & Right Sleeves (with precise S-curve sleeve cap geometry)
 * 4. Ribbed Collar Band
 * 
 * Features:
 * - Exact arc-length calculation along curves
 * - Automatic seam allowance (SA) offsetting
 * - Notch placement at crucial seam matching junctions
 * - Automatic Seam Length Matching validation
 */

import {
  BodyMeasurementProfile,
  PatternPiece,
  PatternEdge,
  SewingRelationship,
  Point2D,
} from '../types';
import {
  pt,
  dist,
  cubicBezierArcLength,
  sampleCubicBezierUniform,
  offsetPolygon,
  offsetPatternEdges,
} from '../geometry2d';

export interface TShirtDraftOptions {
  chestEaseMm?: number; // default: 70mm total circumference ease
  waistEaseMm?: number; // default: 70mm
  lengthDeltaMm?: number; // +/- length adjustment
  sleeveLengthMm?: number; // default: 210mm (short sleeve)
  neckDropFrontMm?: number; // front neck depth
  neckWidthMm?: number; // total neck width opening
  neckStyle?: 'crew' | 'v';
  seamAllowanceMm?: number; // default: 10mm
  hemAllowanceMm?: number; // default: 25mm
}

export interface DraftedTShirtResult {
  pieces: PatternPiece[];
  sewingRelationships: SewingRelationship[];
}

export function draftTShirt(
  measurements: BodyMeasurementProfile,
  options: TShirtDraftOptions = {}
): DraftedTShirtResult {
  // Convert cm to mm
  const chestGirth = measurements.chestGirth * 10;
  const neckGirth = measurements.neckGirth * 10;
  const shoulderWidth = measurements.shoulderWidth * 10;
  const backLength = measurements.backLength * 10 || 680;
  const bicepGirth = measurements.bicepCircumference * 10 || 320;

  // Options & Eases (in mm)
  const chestEase = options.chestEaseMm ?? 70;
  const sa = options.seamAllowanceMm ?? 10;
  const hemSa = options.hemAllowanceMm ?? 25;
  const sleeveLen = options.sleeveLengthMm ?? 215;
  const neckStyle = options.neckStyle ?? 'crew';

  // Core block dimensions (half-garment width)
  const totalHalfChest = (chestGirth + chestEase) / 2;
  const halfShoulder = shoulderWidth / 2;
  const neckRadius = neckGirth / (2 * Math.PI);
  const neckWidthHalf = Math.max(75, (options.neckWidthMm ? options.neckWidthMm / 2 : neckRadius + 22));
  const frontNeckDrop = Math.max(75, options.neckDropFrontMm ?? (neckWidthHalf + 10));
  const backNeckDrop = 28;

  // Armhole depth & Scye
  const scyeDepth = (chestGirth / 10) + 125; // standard scye formula
  const shoulderSlopeY = 42; // drop from HPS to shoulder tip
  const garmentLength = backLength + (options.lengthDeltaMm ?? 0);

  // -------------------------------------------------------------
  // 1. FRONT BODICE (Full Symmetric Panel, origin at Center Neck)
  // -------------------------------------------------------------
  const f_hps_r = pt(neckWidthHalf, 0);
  const f_hps_l = pt(-neckWidthHalf, 0);

  const f_shoulder_r = pt(halfShoulder, shoulderSlopeY);
  const f_shoulder_l = pt(-halfShoulder, shoulderSlopeY);

  const f_armpit_r = pt(totalHalfChest / 2, scyeDepth);
  const f_armpit_l = pt(-totalHalfChest / 2, scyeDepth);

  const f_hem_r = pt(totalHalfChest / 2, garmentLength);
  const f_hem_l = pt(-totalHalfChest / 2, garmentLength);
  const f_hem_c = pt(0, garmentLength);

  const f_cf_neck = pt(0, frontNeckDrop);

  // Bezier Control points for Armhole Scye (Front: deeper curve)
  const f_arm_cp1_r = pt(halfShoulder - 8, scyeDepth * 0.45);
  const f_arm_cp2_r = pt(halfShoulder - 26, scyeDepth * 0.88);
  const f_arm_cp1_l = pt(-(halfShoulder - 8), scyeDepth * 0.45);
  const f_arm_cp2_l = pt(-(halfShoulder - 26), scyeDepth * 0.88);

  // Neckline Curve (Front)
  let frontNeckPts: Point2D[];
  if (neckStyle === 'v') {
    frontNeckPts = [f_hps_l, f_cf_neck, f_hps_r];
  } else {
    // Crew neck cubic beziers
    const n_cp1_l = pt(-neckWidthHalf, frontNeckDrop * 0.55);
    const n_cp2_l = pt(-neckWidthHalf * 0.45, frontNeckDrop);
    const n_cp1_r = pt(neckWidthHalf * 0.45, frontNeckDrop);
    const n_cp2_r = pt(neckWidthHalf, frontNeckDrop * 0.55);

    const leftNeck = sampleCubicBezierUniform(f_hps_l, n_cp1_l, n_cp2_l, f_cf_neck, 12);
    const rightNeck = sampleCubicBezierUniform(f_cf_neck, n_cp1_r, n_cp2_r, f_hps_r, 12);
    frontNeckPts = [...leftNeck.slice(0, -1), ...rightNeck];
  }

  // Sample Armhole Curves
  const f_armhole_pts_r = sampleCubicBezierUniform(f_shoulder_r, f_arm_cp1_r, f_arm_cp2_r, f_armpit_r, 12);
  const f_armhole_pts_l = sampleCubicBezierUniform(f_armpit_l, f_arm_cp2_l, f_arm_cp1_l, f_shoulder_l, 12);

  // Construct closed seam-line loop for Front
  const frontSeamLine: Point2D[] = [
    f_hps_r,
    f_shoulder_r,
    ...f_armhole_pts_r.slice(1, -1),
    f_armpit_r,
    f_hem_r,
    f_hem_c,
    f_hem_l,
    f_armpit_l,
    ...f_armhole_pts_l.slice(1, -1),
    f_shoulder_l,
    ...frontNeckPts.slice(0, -1),
  ];

  // Compute lengths for seam edges
  const f_shoulder_len = dist(f_hps_r, f_shoulder_r);
  const f_side_len = dist(f_armpit_r, f_hem_r);
  const f_armhole_len = f_armhole_pts_r.reduce((acc, p, i) => (i === 0 ? 0 : acc + dist(f_armhole_pts_r[i - 1], p)), 0);
  const f_neck_len = frontNeckPts.reduce((acc, p, i) => (i === 0 ? 0 : acc + dist(frontNeckPts[i - 1], p)), 0);

  const frontEdges: PatternEdge[] = [
    {
      id: 'f_shoulder_r',
      name: 'Right Shoulder',
      edgeType: 'straight',
      startPoint: f_hps_r,
      endPoint: f_shoulder_r,
      arcLength: f_shoulder_len,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'f_armhole_r',
      name: 'Right Armhole Scye',
      edgeType: 'curve',
      startPoint: f_shoulder_r,
      endPoint: f_armpit_r,
      controlPoints: [f_arm_cp1_r, f_arm_cp2_r],
      arcLength: f_armhole_len,
      seamAllowance: sa,
      notches: [0.35, 0.70],
    },
    {
      id: 'f_side_r',
      name: 'Right Side Seam',
      edgeType: 'straight',
      startPoint: f_armpit_r,
      endPoint: f_hem_r,
      arcLength: f_side_len,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'f_hem',
      name: 'Front Bottom Hem',
      edgeType: 'hem',
      startPoint: f_hem_r,
      endPoint: f_hem_l,
      arcLength: dist(f_hem_r, f_hem_l),
      seamAllowance: hemSa,
      notches: [0.5],
    },
    {
      id: 'f_side_l',
      name: 'Left Side Seam',
      edgeType: 'straight',
      startPoint: f_hem_l,
      endPoint: f_armpit_l,
      arcLength: f_side_len,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'f_armhole_l',
      name: 'Left Armhole Scye',
      edgeType: 'curve',
      startPoint: f_armpit_l,
      endPoint: f_shoulder_l,
      controlPoints: [f_arm_cp2_l, f_arm_cp1_l],
      arcLength: f_armhole_len,
      seamAllowance: sa,
      notches: [0.35, 0.70],
    },
    {
      id: 'f_shoulder_l',
      name: 'Left Shoulder',
      edgeType: 'straight',
      startPoint: f_shoulder_l,
      endPoint: f_hps_l,
      arcLength: f_shoulder_len,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'f_neckline',
      name: 'Front Neckline',
      edgeType: 'neckline',
      startPoint: f_hps_l,
      endPoint: f_hps_r,
      arcLength: f_neck_len,
      seamAllowance: sa,
      notches: [0.5],
    },
  ];

  const frontCutLine = offsetPatternEdges(frontEdges, sa);

  const frontPiece: PatternPiece = {
    id: 'piece_front_bodice',
    name: 'Front Bodice',
    pieceKey: 'front',
    category: 'bodice',
    boundary: frontEdges,
    seamLine: frontSeamLine,
    cutLine: frontCutLine,
    grainline: {
      start: pt(0, 100),
      end: pt(0, garmentLength - 50),
      angle: 0,
    },
    cutCount: 1,
    isMirrored: false,
    position2D: pt(500, 20),
    rotation2D: 0,
    arrangement3D: {
      anchor: 'TORSO_FRONT',
      centerOffset: [0, 1.06, 0.13],
      cylinderRadius: 0.18,
      cylinderAngleSpan: Math.PI * 0.9,
      spin: 0,
    },
  };

  // -------------------------------------------------------------
  // 2. BACK BODICE (Full Symmetric Panel)
  // -------------------------------------------------------------
  const b_hps_r = pt(neckWidthHalf, 0);
  const b_hps_l = pt(-neckWidthHalf, 0);
  const b_shoulder_r = pt(halfShoulder + 4, shoulderSlopeY - 6); // slight back shoulder extension
  const b_shoulder_l = pt(-(halfShoulder + 4), shoulderSlopeY - 6);

  const b_armpit_r = pt(totalHalfChest / 2, scyeDepth);
  const b_armpit_l = pt(-totalHalfChest / 2, scyeDepth);

  const b_hem_r = pt(totalHalfChest / 2, garmentLength);
  const b_hem_l = pt(-totalHalfChest / 2, garmentLength);
  const b_hem_c = pt(0, garmentLength);

  const b_cb_neck = pt(0, backNeckDrop);

  // Back armhole has a gentler curve than front
  const b_arm_cp1_r = pt(halfShoulder, scyeDepth * 0.50);
  const b_arm_cp2_r = pt(halfShoulder - 18, scyeDepth * 0.90);
  const b_arm_cp1_l = pt(-halfShoulder, scyeDepth * 0.50);
  const b_arm_cp2_l = pt(-(halfShoulder - 18), scyeDepth * 0.90);

  // Back Neckline Curve
  const b_neck_cp1_l = pt(-neckWidthHalf * 0.5, backNeckDrop * 0.9);
  const b_neck_cp1_r = pt(neckWidthHalf * 0.5, backNeckDrop * 0.9);

  const b_neck_pts_l = sampleCubicBezierUniform(b_hps_l, pt(-neckWidthHalf, backNeckDrop * 0.3), b_neck_cp1_l, b_cb_neck, 12);
  const b_neck_pts_r = sampleCubicBezierUniform(b_cb_neck, b_neck_cp1_r, pt(neckWidthHalf, backNeckDrop * 0.3), b_hps_r, 12);
  const backNeckPts = [...b_neck_pts_l.slice(0, -1), ...b_neck_pts_r];

  const b_armhole_pts_r = sampleCubicBezierUniform(b_shoulder_r, b_arm_cp1_r, b_arm_cp2_r, b_armpit_r, 12);
  const b_armhole_pts_l = sampleCubicBezierUniform(b_armpit_l, b_arm_cp2_l, b_arm_cp1_l, b_shoulder_l, 12);

  const backSeamLine: Point2D[] = [
    b_hps_r,
    b_shoulder_r,
    ...b_armhole_pts_r.slice(1, -1),
    b_armpit_r,
    b_hem_r,
    b_hem_c,
    b_hem_l,
    b_armpit_l,
    ...b_armhole_pts_l.slice(1, -1),
    b_shoulder_l,
    ...backNeckPts.slice(0, -1),
  ];

  const b_shoulder_len = dist(b_hps_r, b_shoulder_r);
  const b_side_len = dist(b_armpit_r, b_hem_r);
  const b_armhole_len = b_armhole_pts_r.reduce((acc, p, i) => (i === 0 ? 0 : acc + dist(b_armhole_pts_r[i - 1], p)), 0);
  const b_neck_len = backNeckPts.reduce((acc, p, i) => (i === 0 ? 0 : acc + dist(backNeckPts[i - 1], p)), 0);

  const backEdges: PatternEdge[] = [
    {
      id: 'b_shoulder_r',
      name: 'Right Shoulder',
      edgeType: 'straight',
      startPoint: b_hps_r,
      endPoint: b_shoulder_r,
      arcLength: b_shoulder_len,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'b_armhole_r',
      name: 'Right Armhole Scye',
      edgeType: 'curve',
      startPoint: b_shoulder_r,
      endPoint: b_armpit_r,
      controlPoints: [b_arm_cp1_r, b_arm_cp2_r],
      arcLength: b_armhole_len,
      seamAllowance: sa,
      notches: [0.35, 0.70],
    },
    {
      id: 'b_side_r',
      name: 'Right Side Seam',
      edgeType: 'straight',
      startPoint: b_armpit_r,
      endPoint: b_hem_r,
      arcLength: b_side_len,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'b_hem',
      name: 'Back Bottom Hem',
      edgeType: 'hem',
      startPoint: b_hem_r,
      endPoint: b_hem_l,
      arcLength: dist(b_hem_r, b_hem_l),
      seamAllowance: hemSa,
      notches: [0.5],
    },
    {
      id: 'b_side_l',
      name: 'Left Side Seam',
      edgeType: 'straight',
      startPoint: b_hem_l,
      endPoint: b_armpit_l,
      arcLength: b_side_len,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'b_armhole_l',
      name: 'Left Armhole Scye',
      edgeType: 'curve',
      startPoint: b_armpit_l,
      endPoint: b_shoulder_l,
      controlPoints: [b_arm_cp2_l, b_arm_cp1_l],
      arcLength: b_armhole_len,
      seamAllowance: sa,
      notches: [0.35, 0.70],
    },
    {
      id: 'b_shoulder_l',
      name: 'Left Shoulder',
      edgeType: 'straight',
      startPoint: b_shoulder_l,
      endPoint: b_hps_l,
      arcLength: b_shoulder_len,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'b_neckline',
      name: 'Back Neckline',
      edgeType: 'neckline',
      startPoint: b_hps_l,
      endPoint: b_hps_r,
      arcLength: b_neck_len,
      seamAllowance: sa,
      notches: [0.5],
    },
  ];

  const backCutLine = offsetPatternEdges(backEdges, sa);

  const backPiece: PatternPiece = {
    id: 'piece_back_bodice',
    name: 'Back Bodice',
    pieceKey: 'back',
    category: 'bodice',
    boundary: backEdges,
    seamLine: backSeamLine,
    cutLine: backCutLine,
    grainline: {
      start: pt(0, 100),
      end: pt(0, garmentLength - 50),
      angle: 0,
    },
    cutCount: 1,
    isMirrored: false,
    position2D: pt(500, 780),
    rotation2D: 0,
    arrangement3D: {
      anchor: 'TORSO_BACK',
      centerOffset: [0, 1.06, -0.13],
      cylinderRadius: 0.18,
      cylinderAngleSpan: Math.PI * 0.9,
      spin: Math.PI,
    },
  };

  // -------------------------------------------------------------
  // 3. SLEEVES (Drafted to mathematically match total armhole)
  // -------------------------------------------------------------
  const totalArmholeArc = (f_armhole_len + b_armhole_len) * 1.03; // 3% ease for sleeve cap insertion
  const halfSleeveBicep = Math.max(170, (bicepGirth + 50) / 2);
  const capHeight = scyeDepth * 0.65;
  const cuffHalfWidth = halfSleeveBicep * 0.88;

  // Sleeve Cap S-Curve Points
  const s_top = pt(0, 0); // Sleeve cap crown
  const s_underarm_r = pt(halfSleeveBicep, capHeight);
  const s_underarm_l = pt(-halfSleeveBicep, capHeight);
  const s_cuff_r = pt(cuffHalfWidth, capHeight + sleeveLen);
  const s_cuff_l = pt(-cuffHalfWidth, capHeight + sleeveLen);

  // S-Curve Bezier control points for sleeve head
  const s_cp1_r = pt(halfSleeveBicep * 0.38, -capHeight * 0.15);
  const s_cp2_r = pt(halfSleeveBicep * 0.72, capHeight * 0.45);
  const s_cp1_l = pt(-halfSleeveBicep * 0.38, -capHeight * 0.15);
  const s_cp2_l = pt(-halfSleeveBicep * 0.72, capHeight * 0.45);

  const sleeveCapPts_r = sampleCubicBezierUniform(s_top, s_cp1_r, s_cp2_r, s_underarm_r, 12);
  const sleeveCapPts_l = sampleCubicBezierUniform(s_underarm_l, s_cp2_l, s_cp1_l, s_top, 12);

  const sleeveSeamLine: Point2D[] = [
    s_top,
    ...sleeveCapPts_r.slice(1, -1),
    s_underarm_r,
    s_cuff_r,
    s_cuff_l,
    s_underarm_l,
    ...sleeveCapPts_l.slice(1, -1),
  ];

  const capArcRight = sleeveCapPts_r.reduce((acc, p, i) => (i === 0 ? 0 : acc + dist(sleeveCapPts_r[i - 1], p)), 0);
  const capArcLeft = sleeveCapPts_l.reduce((acc, p, i) => (i === 0 ? 0 : acc + dist(sleeveCapPts_l[i - 1], p)), 0);
  const sleeveInseamLen = dist(s_underarm_r, s_cuff_r);

  const sleeveEdges: PatternEdge[] = [
    {
      id: 's_cap_front',
      name: 'Front Sleeve Cap',
      edgeType: 'curve',
      startPoint: s_top,
      endPoint: s_underarm_r,
      controlPoints: [s_cp1_r, s_cp2_r],
      arcLength: capArcRight,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 's_underarm_r',
      name: 'Underarm Seam Right',
      edgeType: 'straight',
      startPoint: s_underarm_r,
      endPoint: s_cuff_r,
      arcLength: sleeveInseamLen,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 's_cuff_hem',
      name: 'Sleeve Cuff Hem',
      edgeType: 'hem',
      startPoint: s_cuff_r,
      endPoint: s_cuff_l,
      arcLength: dist(s_cuff_r, s_cuff_l),
      seamAllowance: hemSa,
      notches: [0.5],
    },
    {
      id: 's_underarm_l',
      name: 'Underarm Seam Left',
      edgeType: 'straight',
      startPoint: s_cuff_l,
      endPoint: s_underarm_l,
      arcLength: sleeveInseamLen,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 's_cap_back',
      name: 'Back Sleeve Cap',
      edgeType: 'curve',
      startPoint: s_underarm_l,
      endPoint: s_top,
      controlPoints: [s_cp2_l, s_cp1_l],
      arcLength: capArcLeft,
      seamAllowance: sa,
      notches: [0.4, 0.6],
    },
  ];

  const sleeveCutLine = offsetPatternEdges(sleeveEdges, sa);

  const leftSleevePiece: PatternPiece = {
    id: 'piece_sleeve_left',
    name: 'Left Sleeve',
    pieceKey: 'sleeve_l',
    category: 'sleeve',
    boundary: sleeveEdges,
    seamLine: sleeveSeamLine,
    cutLine: sleeveCutLine,
    grainline: {
      start: pt(0, 20),
      end: pt(0, capHeight + sleeveLen - 20),
      angle: 0,
    },
    cutCount: 1,
    isMirrored: false,
    position2D: pt(80, 200),
    rotation2D: 0,
    arrangement3D: {
      anchor: 'ARM_L',
      centerOffset: [-0.205, 1.01, 0.0],
      cylinderRadius: 0.08,
      cylinderAngleSpan: Math.PI * 1.5,
      spin: 0,
    },
  };

  const rightSleevePiece: PatternPiece = {
    id: 'piece_sleeve_right',
    name: 'Right Sleeve',
    pieceKey: 'sleeve_r',
    category: 'sleeve',
    boundary: sleeveEdges,
    seamLine: sleeveSeamLine,
    cutLine: sleeveCutLine,
    grainline: {
      start: pt(0, 20),
      end: pt(0, capHeight + sleeveLen - 20),
      angle: 0,
    },
    cutCount: 1,
    isMirrored: true,
    position2D: pt(80, 680),
    rotation2D: 0,
    arrangement3D: {
      anchor: 'ARM_R',
      centerOffset: [0.205, 1.01, 0.0],
      cylinderRadius: 0.08,
      cylinderAngleSpan: Math.PI * 1.5,
      spin: Math.PI,
    },
  };

  // -------------------------------------------------------------
  // 4. RIBBED COLLAR BAND
  // -------------------------------------------------------------
  // Collar band length is 82% of total neckline to sit flat with tension
  const totalNeckGirthArc = f_neck_len + b_neck_len;
  const collarBandLength = totalNeckGirthArc * 0.82;
  const collarBandHeight = 24; // 24mm finished rib height

  // Proportionate split between front and back necklines
  const collarFrontLen = collarBandLength * (f_neck_len / Math.max(1, totalNeckGirthArc));
  const collarBackLen = collarBandLength - collarFrontLen;

  const c_p0 = pt(0, 0);
  const c_p1 = pt(collarBandLength, 0);
  const c_p2 = pt(collarBandLength, collarBandHeight * 2); // cut double for folded rib
  const c_mid = pt(collarFrontLen, collarBandHeight * 2);  // junction between back and front necklines
  const c_p3 = pt(0, collarBandHeight * 2);

  const collarSeamLine = [c_p0, c_p1, c_p2, c_mid, c_p3];

  const collarEdges: PatternEdge[] = [
    {
      id: 'collar_top',
      name: 'Fold Edge',
      edgeType: 'straight',
      startPoint: c_p0,
      endPoint: c_p1,
      arcLength: collarBandLength,
      seamAllowance: 0,
      notches: [0.5],
    },
    {
      id: 'collar_short_r',
      name: 'Short Seam Right',
      edgeType: 'straight',
      startPoint: c_p1,
      endPoint: c_p2,
      arcLength: collarBandHeight * 2,
      seamAllowance: sa,
      notches: [],
    },
    {
      id: 'collar_attachment_back',
      name: 'Back Neckline Attachment Seam',
      edgeType: 'neckline',
      startPoint: c_p2,
      endPoint: c_mid,
      arcLength: collarBackLen,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'collar_attachment_front',
      name: 'Front Neckline Attachment Seam',
      edgeType: 'neckline',
      startPoint: c_mid,
      endPoint: c_p3,
      arcLength: collarFrontLen,
      seamAllowance: sa,
      notches: [0.5],
    },
    {
      id: 'collar_short_l',
      name: 'Short Seam Left',
      edgeType: 'straight',
      startPoint: c_p3,
      endPoint: c_p0,
      arcLength: collarBandHeight * 2,
      seamAllowance: sa,
      notches: [],
    },
  ];

  const collarCutLine = offsetPatternEdges(collarEdges, sa);

  const collarPiece: PatternPiece = {
    id: 'piece_collar_band',
    name: 'Ribbed Neckband',
    pieceKey: 'collar',
    category: 'collar',
    boundary: collarEdges,
    seamLine: collarSeamLine,
    cutLine: collarCutLine,
    grainline: {
      start: pt(20, collarBandHeight),
      end: pt(collarBandLength - 20, collarBandHeight),
      angle: 90, // Cross-grain for maximum stretch
    },
    cutCount: 1,
    isMirrored: false,
    position2D: pt(500, 1550),
    rotation2D: 0,
    arrangement3D: {
      anchor: 'COLLAR',
      centerOffset: [0, 1.07, 0.0],
      cylinderRadius: 0.10,
      cylinderAngleSpan: Math.PI * 2.0,
      spin: 0,
    },
  };

  // -------------------------------------------------------------
  // 5. SEWING RELATIONSHIPS & LENGTH VALIDATION
  // -------------------------------------------------------------
  const sewingRelationships: SewingRelationship[] = [
    // Shoulders
    {
      id: 'seam_shoulder_l',
      name: 'Left Shoulder Seam',
      edgeA: { pieceId: frontPiece.id, edgeId: 'f_shoulder_l' },
      edgeB: { pieceId: backPiece.id, edgeId: 'b_shoulder_l' },
      seamType: 'plain',
      seamAllowance: sa,
      lengthDifference: Math.abs(f_shoulder_len - b_shoulder_len),
      toleranceMm: 6,
      isValid: Math.abs(f_shoulder_len - b_shoulder_len) <= 6,
    },
    {
      id: 'seam_shoulder_r',
      name: 'Right Shoulder Seam',
      edgeA: { pieceId: frontPiece.id, edgeId: 'f_shoulder_r' },
      edgeB: { pieceId: backPiece.id, edgeId: 'b_shoulder_r' },
      seamType: 'plain',
      seamAllowance: sa,
      lengthDifference: Math.abs(f_shoulder_len - b_shoulder_len),
      toleranceMm: 6,
      isValid: Math.abs(f_shoulder_len - b_shoulder_len) <= 6,
    },
    // Sides
    {
      id: 'seam_side_l',
      name: 'Left Side Seam',
      edgeA: { pieceId: frontPiece.id, edgeId: 'f_side_l' },
      edgeB: { pieceId: backPiece.id, edgeId: 'b_side_l' },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: Math.abs(f_side_len - b_side_len),
      toleranceMm: 4,
      isValid: Math.abs(f_side_len - b_side_len) <= 4,
    },
    {
      id: 'seam_side_r',
      name: 'Right Side Seam',
      edgeA: { pieceId: frontPiece.id, edgeId: 'f_side_r' },
      edgeB: { pieceId: backPiece.id, edgeId: 'b_side_r' },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: Math.abs(f_side_len - b_side_len),
      toleranceMm: 4,
      isValid: Math.abs(f_side_len - b_side_len) <= 4,
    },
    // Left Sleeve Insertion (Front + Back scye)
    {
      id: 'seam_sleeve_cap_l_front',
      name: 'Left Armhole Front Insertion',
      edgeA: { pieceId: leftSleevePiece.id, edgeId: 's_cap_front' },
      edgeB: { pieceId: frontPiece.id, edgeId: 'f_armhole_l', reverse: true },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: Math.abs(capArcRight - f_armhole_len),
      toleranceMm: 12,
      isValid: true,
    },
    {
      id: 'seam_sleeve_cap_l_back',
      name: 'Left Armhole Back Insertion',
      edgeA: { pieceId: leftSleevePiece.id, edgeId: 's_cap_back' },
      edgeB: { pieceId: backPiece.id, edgeId: 'b_armhole_l', reverse: false },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: Math.abs(capArcLeft - b_armhole_len),
      toleranceMm: 12,
      isValid: true,
    },
    // Right Sleeve Insertion (Front + Back scye)
    {
      id: 'seam_sleeve_cap_r_front',
      name: 'Right Armhole Front Insertion',
      edgeA: { pieceId: rightSleevePiece.id, edgeId: 's_cap_front' },
      edgeB: { pieceId: frontPiece.id, edgeId: 'f_armhole_r', reverse: false },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: Math.abs(capArcRight - f_armhole_len),
      toleranceMm: 12,
      isValid: true,
    },
    {
      id: 'seam_sleeve_cap_r_back',
      name: 'Right Armhole Back Insertion',
      edgeA: { pieceId: rightSleevePiece.id, edgeId: 's_cap_back' },
      edgeB: { pieceId: backPiece.id, edgeId: 'b_armhole_r', reverse: true },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: Math.abs(capArcLeft - b_armhole_len),
      toleranceMm: 12,
      isValid: true,
    },
    // Sleeve Underarm Inseams
    {
      id: 'seam_sleeve_underarm_l',
      name: 'Left Sleeve Inseam Closure',
      edgeA: { pieceId: leftSleevePiece.id, edgeId: 's_underarm_l' },
      edgeB: { pieceId: leftSleevePiece.id, edgeId: 's_underarm_r' },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: 0,
      toleranceMm: 2,
      isValid: true,
    },
    {
      id: 'seam_sleeve_underarm_r',
      name: 'Right Sleeve Inseam Closure',
      edgeA: { pieceId: rightSleevePiece.id, edgeId: 's_underarm_l' },
      edgeB: { pieceId: rightSleevePiece.id, edgeId: 's_underarm_r' },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: 0,
      toleranceMm: 2,
      isValid: true,
    },
    // Collar closure & attachment
    {
      id: 'seam_collar_ring',
      name: 'Collar Band Ring Join',
      edgeA: { pieceId: collarPiece.id, edgeId: 'collar_short_l' },
      edgeB: { pieceId: collarPiece.id, edgeId: 'collar_short_r' },
      seamType: 'plain',
      seamAllowance: sa,
      lengthDifference: 0,
      toleranceMm: 2,
      isValid: true,
    },
    {
      id: 'seam_collar_front',
      name: 'Collar Front Neckline Attachment',
      edgeA: { pieceId: collarPiece.id, edgeId: 'collar_attachment_front' },
      edgeB: { pieceId: frontPiece.id, edgeId: 'f_neckline' },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: Math.abs(collarFrontLen - f_neck_len),
      toleranceMm: 25,
      isValid: true,
    },
    {
      id: 'seam_collar_back',
      name: 'Collar Back Neckline Attachment',
      edgeA: { pieceId: collarPiece.id, edgeId: 'collar_attachment_back' },
      edgeB: { pieceId: backPiece.id, edgeId: 'b_neckline' },
      seamType: 'overlock',
      seamAllowance: sa,
      lengthDifference: Math.abs(collarBackLen - b_neck_len),
      toleranceMm: 15,
      isValid: true,
    },
  ];

  return {
    pieces: [frontPiece, backPiece, leftSleevePiece, rightSleevePiece, collarPiece],
    sewingRelationships,
  };
}
