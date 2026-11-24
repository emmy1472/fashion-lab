/**
 * FASHION-LAB: POSITION-BASED DYNAMICS (XPBD) CLOTH SIMULATION & VIRTUAL STITCHING
 * 
 * Physically-informed cloth solver that:
 * 1. Simulates fabric deformation using 2D-pattern rest lengths
 * 2. Pulls corresponding seam edges together via virtual sewing springs
 * 3. Handles avatar collision detection against anatomical capsule colliders
 * 4. Computes per-vertex tension/strain tensor for interactive fit heatmaps
 */

import { FabricMaterial, SewingRelationship } from './types';
import { MeshData } from './meshing';

export interface AvatarCollider {
  type: 'capsule';
  name: string;
  p0: [number, number, number];
  p1: [number, number, number];
  radius: number;
}

export interface AssembledGarmentSimulation {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  strainColors: Float32Array; // RGB per vertex (0.0 to 1.0)
  stepSimulation: (dt: number, stitchProgress?: number) => void;
  resetToArrangement: () => void;
  getAverageTensionKPa: () => number;
  getMaxTensionKPa: () => number;
}

export function createClothSimulation(
  pieceMeshes: Array<{ pieceId: string; mesh: MeshData }>,
  sewingRelationships: SewingRelationship[],
  fabric: FabricMaterial,
  colliders: AvatarCollider[]
): AssembledGarmentSimulation {
  // 1. Merge all piece meshes into a unified vertex buffer
  let totalVerts = 0;
  let totalIndices = 0;

  for (const { mesh } of pieceMeshes) {
    totalVerts += mesh.positions.length / 3;
    totalIndices += mesh.indices.length;
  }

  const positions = new Float32Array(totalVerts * 3);
  const prevPositions = new Float32Array(totalVerts * 3);
  const initialPositions = new Float32Array(totalVerts * 3);
  const velocities = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const strainColors = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);
  const invMasses = new Float32Array(totalVerts);

  // Track piece vertex offsets
  const pieceVertexOffset: Record<string, number> = {};
  let currentVOffset = 0;
  let currentIOffset = 0;

  for (const { pieceId, mesh } of pieceMeshes) {
    pieceVertexOffset[pieceId] = currentVOffset;
    const nV = mesh.positions.length / 3;

    // Copy initial arranged positions
    for (let i = 0; i < nV; i++) {
      const gIdx = currentVOffset + i;
      positions[gIdx * 3 + 0] = mesh.positions[i * 3 + 0];
      positions[gIdx * 3 + 1] = mesh.positions[i * 3 + 1];
      positions[gIdx * 3 + 2] = mesh.positions[i * 3 + 2];

      initialPositions[gIdx * 3 + 0] = mesh.positions[i * 3 + 0];
      initialPositions[gIdx * 3 + 1] = mesh.positions[i * 3 + 1];
      initialPositions[gIdx * 3 + 2] = mesh.positions[i * 3 + 2];

      prevPositions[gIdx * 3 + 0] = mesh.positions[i * 3 + 0];
      prevPositions[gIdx * 3 + 1] = mesh.positions[i * 3 + 1];
      prevPositions[gIdx * 3 + 2] = mesh.positions[i * 3 + 2];

      uvs[gIdx * 2 + 0] = mesh.uvs[i * 2 + 0];
      uvs[gIdx * 2 + 1] = mesh.uvs[i * 2 + 1];

      // Default relaxed strain color: gentle tailored green
      strainColors[gIdx * 3 + 0] = 0.1;
      strainColors[gIdx * 3 + 1] = 0.75;
      strainColors[gIdx * 3 + 2] = 0.35;

      invMasses[gIdx] = 1.0 / (fabric.densityKgM3 * fabric.thicknessMm * 0.001 + 0.1);
    }

    // Remap indices with global offset
    for (let i = 0; i < mesh.indices.length; i++) {
      indices[currentIOffset + i] = mesh.indices[i] + currentVOffset;
    }

    currentVOffset += nV;
    currentIOffset += mesh.indices.length;
  }

  // 2. Build Internal Distance Constraints (Rest lengths in meters from 2D pattern space)
  interface DistanceConstraint {
    i0: number;
    i1: number;
    restLength: number;
  }

  const distanceConstraints: DistanceConstraint[] = [];
  const edgeSet = new Set<string>();

  for (const { pieceId, mesh } of pieceMeshes) {
    const vOff = pieceVertexOffset[pieceId];
    const ind = mesh.indices;
    const flat2D = mesh.flat2DPositions;

    for (let k = 0; k < ind.length; k += 3) {
      const iA = ind[k], iB = ind[k + 1], iC = ind[k + 2];
      const triEdges = [
        [iA, iB],
        [iB, iC],
        [iC, iA],
      ];

      for (const [a, b] of triEdges) {
        const uA = Math.min(a, b);
        const uB = Math.max(a, b);
        const key = `${vOff + uA}_${vOff + uB}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          // 2D distance in millimeters converted to meters
          const dx = flat2D[uB * 2] - flat2D[uA * 2];
          const dy = flat2D[uB * 2 + 1] - flat2D[uA * 2 + 1];
          const restLenMeters = Math.max(0.005, Math.sqrt(dx * dx + dy * dy) / 1000);
          distanceConstraints.push({
            i0: vOff + uA,
            i1: vOff + uB,
            restLength: restLenMeters,
          });
        }
      }
    }
  }

  // 3. Build Virtual Sewing Spring Constraints
  interface SewingSpring {
    i0: number;
    i1: number;
    currentRestLen: number;
    targetRestLen: number;
  }

  const sewingSprings: SewingSpring[] = [];

  for (const rel of sewingRelationships) {
    const meshA = pieceMeshes.find((p) => p.pieceId === rel.edgeA.pieceId);
    const meshB = pieceMeshes.find((p) => p.pieceId === rel.edgeB.pieceId);

    if (!meshA || !meshB) continue;

    const vOffA = pieceVertexOffset[rel.edgeA.pieceId];
    const vOffB = pieceVertexOffset[rel.edgeB.pieceId];

    const vertsA = meshA.mesh.seamEdgeVertexMap[rel.edgeA.edgeId] || [];
    const vertsB = meshB.mesh.seamEdgeVertexMap[rel.edgeB.edgeId] || [];

    const revA = Boolean(rel.edgeA.reverse);
    const revB = Boolean(rel.edgeB.reverse);

    if (vertsA.length > 0 && vertsB.length > 0) {
      const count = Math.max(vertsA.length, vertsB.length);
      for (let k = 0; k < count; k++) {
        const t = count > 1 ? k / (count - 1) : 0;
        const posA = revA ? 1 - t : t;
        const posB = revB ? 1 - t : t;

        const idxA = vertsA[Math.min(vertsA.length - 1, Math.round(posA * (vertsA.length - 1)))];
        const idxB = vertsB[Math.min(vertsB.length - 1, Math.round(posB * (vertsB.length - 1)))];

        const gA = vOffA + idxA;
        const gB = vOffB + idxB;

        const dx = positions[gB * 3] - positions[gA * 3];
        const dy = positions[gB * 3 + 1] - positions[gA * 3 + 1];
        const dz = positions[gB * 3 + 2] - positions[gA * 3 + 2];
        const initialDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        sewingSprings.push({
          i0: gA,
          i1: gB,
          currentRestLen: initialDist,
          targetRestLen: 0.001, // pull to seamless junction
        });
      }
    }
  }

  // Metrics trackers
  let currentAvgTension = 1.2;
  let currentMaxTension = 3.5;

  // 4. XPBD Solver Execution Loop
  function stepSimulation(dt: number, stitchProgress = 1.0) {
    const clampedDt = Math.min(dt, 0.032);
    const subSteps = 3;
    const sDt = clampedDt / subSteps;
    const gravityY = -9.81 * 0.45; // Calibrated garment gravity
    const damping = 1.0 - fabric.damping * 2.5;

    // Advance sewing progress: gradually shrink sewing rest lengths
    for (const spring of sewingSprings) {
      spring.currentRestLen = Math.max(
        spring.targetRestLen,
        spring.currentRestLen * (1.0 - stitchProgress * 0.08)
      );
    }

    for (let sub = 0; sub < subSteps; sub++) {
      // Numerical integration (Verlet with explicit velocity prediction)
      for (let i = 0; i < totalVerts; i++) {
        const idx = i * 3;
        // Gravity & acceleration
        velocities[idx + 1] += gravityY * sDt;

        // Apply damping
        velocities[idx + 0] *= damping;
        velocities[idx + 1] *= damping;
        velocities[idx + 2] *= damping;

        // Store previous position
        prevPositions[idx + 0] = positions[idx + 0];
        prevPositions[idx + 1] = positions[idx + 1];
        prevPositions[idx + 2] = positions[idx + 2];

        // Predict next position
        positions[idx + 0] += velocities[idx + 0] * sDt;
        positions[idx + 1] += velocities[idx + 1] * sDt;
        positions[idx + 2] += velocities[idx + 2] * sDt;

        // Anatomical shoulder support tether: prevents garment from sliding down through avatar
        if (initialPositions[idx + 1] >= 0.96) {
          positions[idx + 1] = Math.max(positions[idx + 1], initialPositions[idx + 1] - 0.025);
        }
      }

      // Solve Sewing Spring Constraints
      for (const spring of sewingSprings) {
        const i0 = spring.i0 * 3;
        const i1 = spring.i1 * 3;

        const dx = positions[i1 + 0] - positions[i0 + 0];
        const dy = positions[i1 + 1] - positions[i0 + 1];
        const dz = positions[i1 + 2] - positions[i0 + 2];
        const currentLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (currentLen > 1e-6) {
          const diff = (currentLen - spring.currentRestLen) / currentLen;
          const correctionFactor = 0.55; // sewing pulling stiffness

          positions[i0 + 0] += dx * diff * correctionFactor;
          positions[i0 + 1] += dy * diff * correctionFactor;
          positions[i0 + 2] += dz * diff * correctionFactor;

          positions[i1 + 0] -= dx * diff * correctionFactor;
          positions[i1 + 1] -= dy * diff * correctionFactor;
          positions[i1 + 2] -= dz * diff * correctionFactor;
        }
      }

      // Solve Internal Cloth Distance Constraints
      const stretchCompliance = (1.0 - fabric.stretchStiffness) * 0.0005;
      for (const c of distanceConstraints) {
        const i0 = c.i0 * 3;
        const i1 = c.i1 * 3;

        const dx = positions[i1 + 0] - positions[i0 + 0];
        const dy = positions[i1 + 1] - positions[i0 + 1];
        const dz = positions[i1 + 2] - positions[i0 + 2];
        const currentLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (currentLen > 1e-6) {
          const deltaL = currentLen - c.restLength;
          const factor = (deltaL / (currentLen * (1.0 + stretchCompliance))) * 0.5;

          positions[i0 + 0] += dx * factor;
          positions[i0 + 1] += dy * factor;
          positions[i0 + 2] += dz * factor;

          positions[i1 + 0] -= dx * factor;
          positions[i1 + 1] -= dy * factor;
          positions[i1 + 2] -= dz * factor;
        }
      }

      // Solve Avatar Capsule Collisions
      for (const col of colliders) {
        const [ax, ay, az] = col.p0;
        const [bx, by, bz] = col.p1;
        const abx = bx - ax, aby = by - ay, abz = bz - az;
        const abLenSq = abx * abx + aby * aby + abz * abz;
        const rSkin = col.radius + fabric.thicknessMm * 0.001;

        for (let i = 0; i < totalVerts; i++) {
          const idx = i * 3;
          const px = positions[idx], py = positions[idx + 1], pz = positions[idx + 2];
          const apx = px - ax, apy = py - ay, apz = pz - az;

          let t = abLenSq > 1e-6 ? (apx * abx + apy * aby + apz * abz) / abLenSq : 0;
          t = Math.max(0, Math.min(1, t));

          const cx = ax + t * abx;
          const cy = ay + t * aby;
          const cz = az + t * abz;

          const cpx = px - cx, cpy = py - cy, cpz = pz - cz;
          const distSq = cpx * cpx + cpy * cpy + cpz * cpz;

          if (distSq < rSkin * rSkin) {
            const d = Math.sqrt(distSq);
            const pushDirX = d > 1e-6 ? cpx / d : 0;
            const pushDirY = d > 1e-6 ? cpy / d : 1;
            const pushDirZ = d > 1e-6 ? cpz / d : 0;

            positions[idx + 0] = cx + pushDirX * rSkin;
            positions[idx + 1] = cy + pushDirY * rSkin;
            positions[idx + 2] = cz + pushDirZ * rSkin;

            // Surface friction against skin
            velocities[idx + 1] *= Math.max(0.05, 1.0 - fabric.friction * 0.85);
          }
        }
      }

      // Update velocities from corrected positions
      for (let i = 0; i < totalVerts; i++) {
        const idx = i * 3;
        velocities[idx + 0] = (positions[idx + 0] - prevPositions[idx + 0]) / sDt;
        velocities[idx + 1] = (positions[idx + 1] - prevPositions[idx + 1]) / sDt;
        velocities[idx + 2] = (positions[idx + 2] - prevPositions[idx + 2]) / sDt;
      }
    }

    // Recompute Normals and Evaluate Tension Heatmap
    recomputeNormals();
    evaluateTensionHeatmap();
  }

  function recomputeNormals() {
    normals.fill(0);
    for (let k = 0; k < indices.length; k += 3) {
      const i0 = indices[k] * 3;
      const i1 = indices[k + 1] * 3;
      const i2 = indices[k + 2] * 3;

      const v0x = positions[i0], v0y = positions[i0 + 1], v0z = positions[i0 + 2];
      const v1x = positions[i1], v1y = positions[i1 + 1], v1z = positions[i1 + 2];
      const v2x = positions[i2], v2y = positions[i2 + 1], v2z = positions[i2 + 2];

      const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
      const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;

      const fnx = e1y * e2z - e1z * e2y;
      const fny = e1z * e2x - e1x * e2z;
      const fnz = e1x * e2y - e1y * e2x;

      normals[i0] += fnx; normals[i0 + 1] += fny; normals[i0 + 2] += fnz;
      normals[i1] += fnx; normals[i1 + 1] += fny; normals[i1 + 2] += fnz;
      normals[i2] += fnx; normals[i2 + 1] += fny; normals[i2 + 2] += fnz;
    }

    for (let i = 0; i < totalVerts; i++) {
      const idx = i * 3;
      const len = Math.sqrt(normals[idx] * normals[idx] + normals[idx + 1] * normals[idx + 1] + normals[idx + 2] * normals[idx + 2]);
      if (len > 1e-6) {
        normals[idx] /= len;
        normals[idx + 1] /= len;
        normals[idx + 2] /= len;
      }
    }
  }

  function evaluateTensionHeatmap() {
    let sumTension = 0;
    let maxTension = 0;

    for (const c of distanceConstraints) {
      const i0 = c.i0 * 3;
      const i1 = c.i1 * 3;
      const dx = positions[i1] - positions[i0];
      const dy = positions[i1 + 1] - positions[i0 + 1];
      const dz = positions[i1 + 2] - positions[i0 + 2];
      const currentLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const strain = (currentLen - c.restLength) / c.restLength;

      const tensionKPa = Math.max(0, strain * fabric.stretchStiffness * 45);
      sumTension += tensionKPa;
      if (tensionKPa > maxTension) maxTension = tensionKPa;

      // Color mapping:
      // Strain 0.0: Green (Comfortable)
      // Strain 0.08: Yellow (Snug fit)
      // Strain > 0.15: Red (High tension / tight)
      // Strain < -0.05: Blue (Loose drape / excess ease)
      let r = 0.1, g = 0.75, b = 0.35;
      if (strain > 0.12) {
        // Red
        r = 0.92; g = 0.22; b = 0.22;
      } else if (strain > 0.05) {
        // Yellow
        r = 0.95; g = 0.82; b = 0.15;
      } else if (strain < -0.04) {
        // Blue / Cyan
        r = 0.20; g = 0.65; b = 0.92;
      }

      strainColors[c.i0 * 3 + 0] = r;
      strainColors[c.i0 * 3 + 1] = g;
      strainColors[c.i0 * 3 + 2] = b;
      strainColors[c.i1 * 3 + 0] = r;
      strainColors[c.i1 * 3 + 1] = g;
      strainColors[c.i1 * 3 + 2] = b;
    }

    currentAvgTension = sumTension / Math.max(1, distanceConstraints.length);
    currentMaxTension = maxTension;
  }

  function resetToArrangement() {
    positions.set(initialPositions);
    prevPositions.set(initialPositions);
    velocities.fill(0);
    for (const spring of sewingSprings) {
      const gA = spring.i0 * 3;
      const gB = spring.i1 * 3;
      const dx = positions[gB] - positions[gA];
      const dy = positions[gB + 1] - positions[gA + 1];
      const dz = positions[gB + 2] - positions[gA + 2];
      spring.currentRestLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    recomputeNormals();
  }

  return {
    positions,
    normals,
    uvs,
    indices,
    strainColors,
    stepSimulation,
    resetToArrangement,
    getAverageTensionKPa: () => currentAvgTension,
    getMaxTensionKPa: () => currentMaxTension,
  };
}
