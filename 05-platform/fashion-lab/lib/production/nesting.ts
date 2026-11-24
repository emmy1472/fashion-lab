/**
 * FASHION-LAB: FABRIC LAYOUT & 2D NESTING CUTTING PREPARATION ENGINE
 * 
 * Computes optimized marker layout on standard fabric roll widths:
 * 1. Strict grainline preservation (limits rotation to 0° or 180° to maintain warp orientation)
 * 2. Incorporates cutting seam allowances (SA)
 * 3. Calculates total fabric length required, occupied area, waste %, and marker efficiency
 * 4. Generates optimal sequential cutting path
 */

import { PatternPiece, CuttingPlan, FabricNestingItem, Point2D } from './types';
import { polygonArea, polygonBoundingBox } from './geometry2d';

export interface NestingOptions {
  fabricWidthMm?: number; // Standard roll width (default: 1400mm = 1.4m)
  marginMm?: number; // Minimum gap between pieces and selvage (default: 15mm)
  allow180Rotation?: boolean; // Default: true for symmetric fabrics (cotton/denim), false for napped fabrics (velvet)
}

export function computeCuttingPlan(
  pieces: PatternPiece[],
  options: NestingOptions = {}
): CuttingPlan {
  const fabricWidth = options.fabricWidthMm ?? 1400;
  const margin = options.marginMm ?? 15;
  const allow180 = options.allow180Rotation ?? true;

  // 1. Calculate occupied cutline area of all pieces
  let totalPatternArea = 0;
  const itemsToNest: Array<{
    piece: PatternPiece;
    poly: Point2D[];
    bbox: { width: number; height: number };
  }> = [];

  for (const piece of pieces) {
    const cutPoly = piece.cutLine && piece.cutLine.length > 2 ? piece.cutLine : piece.seamLine;
    const area = polygonArea(cutPoly);
    totalPatternArea += area;

    const bbox = polygonBoundingBox(cutPoly);
    itemsToNest.push({
      piece,
      poly: cutPoly,
      bbox: {
        width: bbox.width + margin,
        height: bbox.height + margin,
      },
    });
  }

  // 2. Sort items descending by height (First-Fit Decreasing Height strip packing algorithm)
  itemsToNest.sort((a, b) => b.bbox.height - a.bbox.height);

  // 3. Place pieces on fabric roll
  const nestedPieces: FabricNestingItem[] = [];
  let currentX = margin;
  let currentY = margin;
  let rowHeight = 0;
  let maxFabricLength = 0;

  for (const item of itemsToNest) {
    const w = item.bbox.width;
    const h = item.bbox.height;

    // Check if item fits in current row along fabric width
    if (currentX + w > fabricWidth - margin) {
      // Advance to next row
      currentX = margin;
      currentY += rowHeight + margin;
      rowHeight = 0;
    }

    // Place piece
    const placedX = currentX;
    const placedY = currentY;

    // Translate polygon to placed coordinates
    const origBbox = polygonBoundingBox(item.poly);
    const translatedPoly: Point2D[] = item.poly.map((p) => ({
      x: p.x - origBbox.minX + placedX,
      y: p.y - origBbox.minY + placedY,
    }));

    nestedPieces.push({
      pieceId: item.piece.id,
      pieceName: item.piece.name,
      x: placedX,
      y: placedY,
      width: origBbox.width,
      height: origBbox.height,
      rotation: 0, // 0 deg preserves vertical warp grainline
      polygon: translatedPoly,
    });

    currentX += w + margin;
    if (h > rowHeight) {
      rowHeight = h;
    }

    const itemBottom = placedY + origBbox.height + margin;
    if (itemBottom > maxFabricLength) {
      maxFabricLength = itemBottom;
    }
  }

  // Total fabric roll length in millimeters (rounded up to nearest 10cm)
  const totalLengthMm = Math.ceil(maxFabricLength / 100) * 100;
  const totalFabricAreaMm2 = fabricWidth * totalLengthMm;
  const wasteAreaMm2 = Math.max(0, totalFabricAreaMm2 - totalPatternArea);
  const efficiencyPercentage = Math.min(100, Math.round((totalPatternArea / totalFabricAreaMm2) * 100));
  const wastePercentage = 100 - efficiencyPercentage;

  // Ordered cutting sequence: top to bottom, left to right
  const cuttingSequence = [...nestedPieces]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((p) => p.pieceId);

  return {
    fabricWidthMm: fabricWidth,
    totalLengthMm,
    nestedPieces,
    totalFabricAreaMm2,
    occupiedPatternAreaMm2: totalPatternArea,
    wastePercentage,
    efficiencyPercentage,
    cuttingSequence,
  };
}
