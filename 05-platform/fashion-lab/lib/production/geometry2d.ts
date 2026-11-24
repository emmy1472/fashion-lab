/**
 * FASHION-LAB: COMPUTATIONAL GEOMETRY ENGINE (2D)
 * 
 * High-precision algorithms for:
 * - Cubic & Quadratic Bezier curves, arc-length parameterization
 * - Seam allowance parallel curve offsetting
 * - Polygon area, centroid, bounding box, and winding order
 * - Uniform boundary resampling for grain-aligned meshing
 * - Line-line intersections, corner mitering, and notch placement
 */

import { Point2D, BezierCurve2D, PatternEdge } from './types';

export const EPSILON = 1e-7;

// --- Basic Vector Operations ---

export function pt(x: number, y: number): Point2D {
  return { x, y };
}

export function dist(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function addPt(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subPt(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scalePt(p: Point2D, s: number): Point2D {
  return { x: p.x * s, y: p.y * s };
}

export function lerpPt(a: Point2D, b: Point2D, t: number): Point2D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

export function normalizePt(p: Point2D): Point2D {
  const len = Math.sqrt(p.x * p.x + p.y * p.y);
  if (len < EPSILON) return { x: 0, y: 0 };
  return { x: p.x / len, y: p.y / len };
}

export function normalVector(a: Point2D, b: Point2D): Point2D {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < EPSILON) return { x: 0, y: 1 };
  // 90-degree counter-clockwise normal
  return { x: -dy / len, y: dx / len };
}

// --- Cubic Bezier Evaluation & Arc Length ---

export function evalCubicBezier(p0: Point2D, cp1: Point2D, cp2: Point2D, p1: Point2D, t: number): Point2D {
  const it = 1 - t;
  const it2 = it * it;
  const it3 = it2 * it;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: it3 * p0.x + 3 * it2 * t * cp1.x + 3 * it * t2 * cp2.x + t3 * p1.x,
    y: it3 * p0.y + 3 * it2 * t * cp1.y + 3 * it * t2 * cp2.y + t3 * p1.y,
  };
}

export function evalCubicTangent(p0: Point2D, cp1: Point2D, cp2: Point2D, p1: Point2D, t: number): Point2D {
  const it = 1 - t;
  const dx = 3 * it * it * (cp1.x - p0.x) + 6 * it * t * (cp2.x - cp1.x) + 3 * t * t * (p1.x - cp2.x);
  const dy = 3 * it * it * (cp1.y - p0.y) + 6 * it * t * (cp2.y - cp1.y) + 3 * t * t * (p1.y - cp2.y);
  return normalizePt({ x: dx, y: dy });
}

export function cubicBezierArcLength(p0: Point2D, cp1: Point2D, cp2: Point2D, p1: Point2D, samples = 32): number {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= samples; i++) {
    const curr = evalCubicBezier(p0, cp1, cp2, p1, i / samples);
    length += dist(prev, curr);
    prev = curr;
  }
  return length;
}

export function sampleCubicBezierUniform(
  p0: Point2D,
  cp1: Point2D,
  cp2: Point2D,
  p1: Point2D,
  stepLength: number
): Point2D[] {
  const totalLen = cubicBezierArcLength(p0, cp1, cp2, p1, 48);
  const numSteps = Math.max(2, Math.round(totalLen / stepLength));
  const points: Point2D[] = [p0];

  // Pre-sample cumulative distances
  const fineSamples = 96;
  const cumDists: number[] = [0];
  let acc = 0;
  let prev = p0;
  for (let i = 1; i <= fineSamples; i++) {
    const curr = evalCubicBezier(p0, cp1, cp2, p1, i / fineSamples);
    acc += dist(prev, curr);
    cumDists.push(acc);
    prev = curr;
  }

  for (let step = 1; step < numSteps; step++) {
    const targetDist = (step / numSteps) * totalLen;
    // Binary search for t
    let low = 0;
    let high = fineSamples;
    while (low < high - 1) {
      const mid = (low + high) >> 1;
      if (cumDists[mid] < targetDist) low = mid;
      else high = mid;
    }
    const d0 = cumDists[low];
    const d1 = cumDists[high];
    const f = (targetDist - d0) / Math.max(EPSILON, d1 - d0);
    const t = (low + f) / fineSamples;
    points.push(evalCubicBezier(p0, cp1, cp2, p1, t));
  }

  points.push(p1);
  return points;
}

// --- Polygon Algorithms ---

export function polygonArea(poly: Point2D[]): number {
  let area = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += poly[i].x * poly[j].y;
    area -= poly[j].x * poly[i].y;
  }
  return Math.abs(area) * 0.5;
}

export function isClockwise(poly: Point2D[]): boolean {
  let sum = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += (poly[j].x - poly[i].x) * (poly[j].y + poly[i].y);
  }
  return sum > 0;
}

export function polygonBoundingBox(poly: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (poly.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  let minX = poly[0].x;
  let maxX = poly[0].x;
  let minY = poly[0].y;
  let maxY = poly[0].y;

  for (let i = 1; i < poly.length; i++) {
    const p = poly[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function pointInPolygon(p: Point2D, poly: Point2D[]): boolean {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = poly[i];
    const pj = poly[j];
    if ((pi.y > p.y) !== (pj.y > p.y) && p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y) + pi.x) {
      inside = !inside;
    }
  }
  return inside;
}

// --- Seam Allowance Parallel Curve Offsetting ---

/**
 * Computes parallel outward polygon offset for seam allowances (SA).
 * Automatically miters or bevels convex corners and cleanly intersects concave corners.
 */
export function offsetPolygon(poly: Point2D[], distance: number): Point2D[] {
  if (poly.length < 3 || Math.abs(distance) < EPSILON) return poly.map((p) => ({ ...p }));

  // Ensure consistent CCW winding order so distance offsets outward
  const ccw = !isClockwise(poly);
  const pts = ccw ? poly : [...poly].reverse();
  const n = pts.length;
  const offsetSegments: Array<{ p0: Point2D; p1: Point2D }> = [];

  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const norm = normalVector(a, b);
    const off = scalePt(norm, distance);
    offsetSegments.push({
      p0: addPt(a, off),
      p1: addPt(b, off),
    });
  }

  const result: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const seg1 = offsetSegments[(i - 1 + n) % n];
    const seg2 = offsetSegments[i];

    // Intersect the two offset lines
    const intersection = lineIntersection(seg1.p0, seg1.p1, seg2.p0, seg2.p1);
    if (intersection) {
      // Limit extreme miter spikes on sharp corners
      const corner = pts[i];
      const miterDist = dist(corner, intersection);
      if (miterDist > Math.abs(distance) * 2.5) {
        // Bevel corner
        result.push(seg1.p1);
        result.push(seg2.p0);
      } else {
        result.push(intersection);
      }
    } else {
      result.push(seg2.p0);
    }
  }

  return ccw ? result : result.reverse();
}

export function lineIntersection(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): Point2D | null {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;

  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < EPSILON) return null; // Parallel or colinear

  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;
  const t = (dx * dby - dy * dbx) / denom;

  return {
    x: a1.x + t * dax,
    y: a1.y + t * day,
  };
}

// --- SVG Path Rendering Helpers ---

export function pathToSvgString(pts: Point2D[], closed = true): string {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  if (closed) d += ' Z';
  return d;
}

// --- Dynamic Notch & Curve Normal Evaluation ---

export interface NotchTick {
  p0: Point2D;
  p1: Point2D;
  isDouble?: boolean;
  secondTick?: { p0: Point2D; p1: Point2D };
}

/**
 * Evaluates the exact point, tangent, and outward normal along any straight or curved PatternEdge
 */
export function evalCurvePointAndNormal(
  edge: PatternEdge,
  t: number
): { point: Point2D; normal: Point2D; tangent: Point2D } {
  const clampedT = Math.max(0, Math.min(1, t));

  if (!edge.controlPoints || edge.controlPoints.length < 2) {
    // Straight line segment
    const point = lerpPt(edge.startPoint, edge.endPoint, clampedT);
    const tangent = normalizePt(subPt(edge.endPoint, edge.startPoint));
    const normal = normalVector(edge.startPoint, edge.endPoint);
    return { point, normal, tangent };
  }

  // Cubic Bezier curve
  const [cp1, cp2] = edge.controlPoints;
  const point = evalCubicBezier(edge.startPoint, cp1, cp2, edge.endPoint, clampedT);
  const tangent = evalCubicTangent(edge.startPoint, cp1, cp2, edge.endPoint, clampedT);
  // Normal pointing CCW (outward for CCW polygons)
  const normal = { x: -tangent.y, y: tangent.x };
  return { point, normal, tangent };
}

/**
 * Computes perpendicular tick lines for alignment notches across seam allowances
 */
export function computeNotchTicks(
  edge: PatternEdge,
  notchDepthMm = 6
): NotchTick[] {
  if (!edge.notches || edge.notches.length === 0) return [];

  const ticks: NotchTick[] = [];
  const isBackArmhole = edge.name.toLowerCase().includes('back') && edge.name.toLowerCase().includes('armhole');

  for (const t of edge.notches) {
    const { point, normal, tangent } = evalCurvePointAndNormal(edge, t);
    const depth = edge.seamAllowance > 0 ? Math.min(edge.seamAllowance, notchDepthMm) : notchDepthMm;
    const p1 = addPt(point, scalePt(normal, depth));

    if (isBackArmhole) {
      // Standard garment CAD back-scye double notch (two parallel marks 8mm apart)
      const offsetVec = scalePt(tangent, 4);
      const tick1_p0 = subPt(point, offsetVec);
      const tick1_p1 = addPt(tick1_p0, scalePt(normal, depth));
      const tick2_p0 = addPt(point, offsetVec);
      const tick2_p1 = addPt(tick2_p0, scalePt(normal, depth));

      ticks.push({
        p0: tick1_p0,
        p1: tick1_p1,
        isDouble: true,
        secondTick: { p0: tick2_p0, p1: tick2_p1 },
      });
    } else {
      ticks.push({
        p0: point,
        p1,
        isDouble: false,
      });
    }
  }

  return ticks;
}

/**
 * Offsets a closed pattern boundary polygon using each edge's individual seam allowance.
 * Hems (e.g. 25mm) expand wider than standard seams (10mm), with clean corner mitering.
 */
export function offsetPatternEdges(edges: PatternEdge[], defaultSa = 10): Point2D[] {
  if (edges.length < 3) return [];

  // Discretize each edge into sub-segments with its specific seam allowance
  interface OffsetSegment {
    p0: Point2D;
    p1: Point2D;
    allowance: number;
    normal: Point2D;
  }

  const offsetSegments: OffsetSegment[] = [];

  for (const edge of edges) {
    const sa = edge.seamAllowance ?? defaultSa;

    if (!edge.controlPoints || edge.controlPoints.length < 2) {
      // Straight edge
      const norm = normalVector(edge.startPoint, edge.endPoint);
      const off = scalePt(norm, sa);
      offsetSegments.push({
        p0: addPt(edge.startPoint, off),
        p1: addPt(edge.endPoint, off),
        allowance: sa,
        normal: norm,
      });
    } else {
      // Curved edge: sample finely and offset each segment
      const [cp1, cp2] = edge.controlPoints;
      const sampled = sampleCubicBezierUniform(edge.startPoint, cp1, cp2, edge.endPoint, 15);
      for (let i = 0; i < sampled.length - 1; i++) {
        const a = sampled[i];
        const b = sampled[i + 1];
        const norm = normalVector(a, b);
        const off = scalePt(norm, sa);
        offsetSegments.push({
          p0: addPt(a, off),
          p1: addPt(b, off),
          allowance: sa,
          normal: norm,
        });
      }
    }
  }

  const n = offsetSegments.length;
  const result: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    const prevSeg = offsetSegments[(i - 1 + n) % n];
    const currSeg = offsetSegments[i];

    const isect = lineIntersection(prevSeg.p0, prevSeg.p1, currSeg.p0, currSeg.p1);
    if (isect) {
      const origCorner = prevSeg.p1;
      const miterDist = dist(origCorner, isect);
      const maxDist = Math.max(prevSeg.allowance, currSeg.allowance) * 2.5;

      if (miterDist > maxDist) {
        // Bevel corner
        result.push(prevSeg.p1);
        result.push(currSeg.p0);
      } else {
        result.push(isect);
      }
    } else {
      result.push(currSeg.p0);
    }
  }

  return result;
}
