/**
 * FASHION-LAB: 2D-TO-3D GRAIN-ALIGNED PATTERN MESHING ENGINE
 * 
 * Transforms flat 2D pattern boundary polygons into grain-aligned 3D meshes:
 * 1. Generates regular internal grid aligned with fabric warp & weft (grainline)
 * 2. Constrains boundary vertices to exact 2D pattern edges with semantic seam tags
 * 3. Maps 2D planar coordinates to UV space (1:1 distortion-free texture mapping)
 * 4. Pre-arranges flat panels in 3D world space around the avatar's body landmarks
 */

import { PatternPiece, Point2D, PatternEdge } from './types';
import { pointInPolygon, polygonBoundingBox, dist } from './geometry2d';

export interface MeshData {
  positions: Float32Array; // [x, y, z, x, y, z...] in meters
  normals: Float32Array;
  uvs: Float32Array; // [u, v, u, v...]
  indices: Uint32Array;
  boundaryVertexIndices: number[];
  seamEdgeVertexMap: Record<string, number[]>; // maps edge.id -> array of vertex indices along that edge
  flat2DPositions: Float32Array; // [x, y, x, y...] in mm for rest-length calculations
}

/**
 * Generates a grain-aligned triangle mesh from a 2D PatternPiece.
 * @param piece The pattern piece containing seamline boundary and 3D arrangement specs
 * @param gridStepMm Grid resolution in millimeters (default: 20mm for crisp real-time simulation)
 */
export function generatePatternMesh(piece: PatternPiece, gridStepMm = 20): MeshData {
  const poly = piece.seamLine;
  const bbox = polygonBoundingBox(poly);

  const verts2D: Point2D[] = [];
  const edgeVertexMap: Record<string, number[]> = {};

  // Initialize edge vertex arrays
  for (const edge of piece.boundary) {
    edgeVertexMap[edge.id] = [];
  }

  // 1. Discretize the boundary edges and tag them with their edge IDs
  const boundaryIndices: number[] = [];

  for (const edge of piece.boundary) {
    const numEdgePts = Math.max(2, Math.round(edge.arcLength / gridStepMm));
    for (let k = 0; k < numEdgePts; k++) {
      const t = k / numEdgePts;
      const x = edge.startPoint.x + (edge.endPoint.x - edge.startPoint.x) * t;
      const y = edge.startPoint.y + (edge.endPoint.y - edge.startPoint.y) * t;
      const vIdx = verts2D.length;
      verts2D.push({ x, y });
      boundaryIndices.push(vIdx);
      edgeVertexMap[edge.id].push(vIdx);
    }
  }

  // 2. Generate regular interior grid aligned with grainline
  const gridVertMap = new Map<string, number>();
  const nx = Math.ceil(bbox.width / gridStepMm) + 1;
  const ny = Math.ceil(bbox.height / gridStepMm) + 1;

  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const gx = bbox.minX + ix * gridStepMm;
      const gy = bbox.minY + iy * gridStepMm;
      const p = { x: gx, y: gy };

      // Keep only vertices that are cleanly inside the pattern (inset by 0.5 * gridStep to prevent boundary overlaps)
      if (pointInPolygon(p, poly)) {
        let tooClose = false;
        for (const bIdx of boundaryIndices) {
          if (dist(p, verts2D[bIdx]) < gridStepMm * 0.65) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) {
          const vIdx = verts2D.length;
          verts2D.push(p);
          gridVertMap.set(`${ix},${iy}`, vIdx);
        }
      }
    }
  }

  // 3. Connect grid cells into regular quad-derived triangles
  const indices: number[] = [];

  for (let iy = 0; iy < ny - 1; iy++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const v00 = gridVertMap.get(`${ix},${iy}`);
      const v10 = gridVertMap.get(`${ix + 1},${iy}`);
      const v01 = gridVertMap.get(`${ix},${iy + 1}`);
      const v11 = gridVertMap.get(`${ix + 1},${iy + 1}`);

      if (v00 !== undefined && v10 !== undefined && v01 !== undefined && v11 !== undefined) {
        // Quad -> Two triangles (grainline diagonal alternating)
        indices.push(v00, v10, v11);
        indices.push(v00, v11, v01);
      } else if (v00 !== undefined && v10 !== undefined && v11 !== undefined) {
        indices.push(v00, v10, v11);
      } else if (v00 !== undefined && v01 !== undefined && v11 !== undefined) {
        indices.push(v00, v11, v01);
      } else if (v00 !== undefined && v10 !== undefined && v01 !== undefined) {
        indices.push(v00, v10, v01);
      } else if (v10 !== undefined && v11 !== undefined && v01 !== undefined) {
        indices.push(v10, v11, v01);
      }
    }
  }

  // 4. Stitch boundary vertices to nearby interior vertices using Delaunay proximity
  for (let b = 0; b < boundaryIndices.length; b++) {
    const bCurr = boundaryIndices[b];
    const bNext = boundaryIndices[(b + 1) % boundaryIndices.length];

    // Find nearest interior or boundary vertex
    let nearestIdx = -1;
    let nearestDist = gridStepMm * 1.8;

    for (let i = 0; i < verts2D.length; i++) {
      if (i === bCurr || i === bNext) continue;
      const d = dist(verts2D[bCurr], verts2D[i]);
      if (d < nearestDist) {
        // verify midpoint is inside polygon
        const mid = {
          x: (verts2D[bCurr].x + verts2D[i].x) * 0.5,
          y: (verts2D[bCurr].y + verts2D[i].y) * 0.5,
        };
        if (pointInPolygon(mid, poly)) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
    }

    if (nearestIdx !== -1) {
      indices.push(bCurr, bNext, nearestIdx);
    }
  }

  // Fallback: If interior points were sparse, build simple fan triangulation from centroid
  if (indices.length < 6) {
    const cx = (bbox.minX + bbox.maxX) * 0.5;
    const cy = (bbox.minY + bbox.maxY) * 0.5;
    const cIdx = verts2D.length;
    verts2D.push({ x: cx, y: cy });
    for (let b = 0; b < boundaryIndices.length; b++) {
      const bCurr = boundaryIndices[b];
      const bNext = boundaryIndices[(b + 1) % boundaryIndices.length];
      indices.push(bCurr, bNext, cIdx);
    }
  }

  // 5. Pre-arrange in 3D world space (meters)
  const numVerts = verts2D.length;
  const positions = new Float32Array(numVerts * 3);
  const normals = new Float32Array(numVerts * 3);
  const uvs = new Float32Array(numVerts * 2);
  const flat2DPositions = new Float32Array(numVerts * 2);

  const arr = piece.arrangement3D;
  const [ox, oy, oz] = arr.centerOffset;
  const R = arr.cylinderRadius;
  const span = arr.cylinderAngleSpan;

  for (let i = 0; i < numVerts; i++) {
    const p2 = verts2D[i];
    flat2DPositions[i * 2 + 0] = p2.x;
    flat2DPositions[i * 2 + 1] = p2.y;

    // UVs normalized across bounding box
    uvs[i * 2 + 0] = (p2.x - bbox.minX) / Math.max(1, bbox.width);
    uvs[i * 2 + 1] = 1.0 - (p2.y - bbox.minY) / Math.max(1, bbox.height);

    // Convert pattern coords (mm) to 3D world space (meters)
    const lx = p2.x / 1000;
    const ly = -p2.y / 1000; // Invert Y so down is negative in 3D

    let wx = ox + lx;
    const wy = oy + ly;
    let wz = oz;

    if (R > 0) {
      // Cylindrical wrapping around anatomical axis
      const theta = (p2.x / (bbox.width * 0.5)) * (span * 0.5) + arr.spin;
      wx = ox + Math.sin(theta) * R;
      wz = oz + (arr.anchor === 'TORSO_BACK' ? -Math.cos(theta) * R : Math.cos(theta) * R);
    }

    positions[i * 3 + 0] = wx;
    positions[i * 3 + 1] = wy;
    positions[i * 3 + 2] = wz;

    // Default upward/forward normal
    normals[i * 3 + 0] = 0;
    normals[i * 3 + 1] = 0;
    normals[i * 3 + 2] = arr.anchor === 'TORSO_BACK' ? -1 : 1;
  }

  // Compute smooth surface vertex normals from triangle cross products
  for (let idx = 0; idx < indices.length; idx += 3) {
    const i0 = indices[idx];
    const i1 = indices[idx + 1];
    const i2 = indices[idx + 2];

    const v0x = positions[i0 * 3], v0y = positions[i0 * 3 + 1], v0z = positions[i0 * 3 + 2];
    const v1x = positions[i1 * 3], v1y = positions[i1 * 3 + 1], v1z = positions[i1 * 3 + 2];
    const v2x = positions[i2 * 3], v2y = positions[i2 * 3 + 1], v2z = positions[i2 * 3 + 2];

    const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
    const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;

    const fnx = e1y * e2z - e1z * e2y;
    const fny = e1z * e2x - e1x * e2z;
    const fnz = e1x * e2y - e1y * e2x;

    normals[i0 * 3] += fnx; normals[i0 * 3 + 1] += fny; normals[i0 * 3 + 2] += fnz;
    normals[i1 * 3] += fnx; normals[i1 * 3 + 1] += fny; normals[i1 * 3 + 2] += fnz;
    normals[i2 * 3] += fnx; normals[i2 * 3 + 1] += fny; normals[i2 * 3 + 2] += fnz;
  }

  // Normalize normals
  for (let i = 0; i < numVerts; i++) {
    const nx = normals[i * 3];
    const ny = normals[i * 3 + 1];
    const nz = normals[i * 3 + 2];
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 1e-6) {
      normals[i * 3] = nx / len;
      normals[i * 3 + 1] = ny / len;
      normals[i * 3 + 2] = nz / len;
    }
  }

  return {
    positions,
    normals,
    uvs,
    indices: new Uint32Array(indices),
    boundaryVertexIndices: boundaryIndices,
    seamEdgeVertexMap: edgeVertexMap,
    flat2DPositions,
  };
}
