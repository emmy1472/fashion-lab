/**
 * FASHION-LAB: DXF-AAMA / ASTM D6673 INDUSTRIAL APPAREL CAD EXPORTER
 * 
 * Generates standards-compliant DXF-AAMA (ASTM D6673) files compatible with:
 * - Gerber AccuMark, Lectra Modaris, Optitex, Browzwear, Clo3D, and Assyst
 * - CNC Fabric Cutters (Eastman, Lectra, Gerber, Zünd, Bullmer)
 * 
 * Standard Layer Mapping (ASTM D6673):
 * - Layer 1: Cut boundary (finished perimeter with seam allowances applied)
 * - Layer 2: Sew line (internal stitch line / true seamline)
 * - Layer 4: Piece annotations (style name, piece description, cut count, size)
 * - Layer 8: Grainline (orientation vector)
 * - Layer 13: Slit notches and balance alignment marks
 */

import { GarmentProject, PatternPiece, Point2D } from './types';
import { computeNotchTicks } from './geometry2d';
import { polygonBoundingBox } from './geometry2d';

export interface DxfExportOptions {
  includeSeamLine?: boolean;
  includeCutLine?: boolean;
  includeGrainline?: boolean;
  includeNotches?: boolean;
  includeAnnotations?: boolean;
  sizeLabel?: string;
  unit?: 'mm' | 'in';
}

/**
 * Generates an ASTM D6673 / AAMA-DXF string for all pattern pieces in a GarmentProject
 */
export function generateDxfAama(
  project: GarmentProject,
  options: DxfExportOptions = {}
): string {
  const {
    includeSeamLine = true,
    includeCutLine = true,
    includeGrainline = true,
    includeNotches = true,
    includeAnnotations = true,
    sizeLabel = 'M',
  } = options;

  let dxf = '';

  // -------------------------------------------------------------------------
  // 1. HEADER SECTION
  // -------------------------------------------------------------------------
  dxf += '0\nSECTION\n';
  dxf += '2\nHEADER\n';
  dxf += '9\n$ACADVER\n1\nAC1009\n'; // AutoCAD R11/R12 standard compatible with all CAD plotters
  dxf += '9\n$INSUNITS\n70\n4\n';     // 4 = Millimeters
  dxf += '9\n$MEASUREMENT\n70\n1\n';  // 1 = Metric
  dxf += '0\nENDSEC\n';

  // -------------------------------------------------------------------------
  // 2. TABLES SECTION (Standard AAMA Layers)
  // -------------------------------------------------------------------------
  dxf += '0\nSECTION\n';
  dxf += '2\nTABLES\n';
  dxf += '0\nTABLE\n2\nLAYER\n70\n5\n';

  // Layer 1: Cut boundary
  dxf += '0\nLAYER\n2\n1\n70\n0\n62\n7\n6\nCONTINUOUS\n';
  // Layer 2: Seam / Sew line
  dxf += '0\nLAYER\n2\n2\n70\n0\n62\n1\n6\nDASHED\n';
  // Layer 4: Text Annotation
  dxf += '0\nLAYER\n2\n4\n70\n0\n62\n4\n6\nCONTINUOUS\n';
  // Layer 8: Grainline
  dxf += '0\nLAYER\n2\n8\n70\n0\n62\n2\n6\nCONTINUOUS\n';
  // Layer 13: Notches
  dxf += '0\nLAYER\n2\n13\n70\n0\n62\n3\n6\nCONTINUOUS\n';

  dxf += '0\nENDTAB\n';
  dxf += '0\nENDSEC\n';

  // -------------------------------------------------------------------------
  // 3. BLOCKS SECTION
  // -------------------------------------------------------------------------
  dxf += '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n';

  // -------------------------------------------------------------------------
  // 4. ENTITIES SECTION
  // -------------------------------------------------------------------------
  dxf += '0\nSECTION\n';
  dxf += '2\nENTITIES\n';

  // Arrange pieces horizontally if needed or use position2D
  for (const piece of project.patternPieces) {
    const offsetX = piece.position2D.x;
    const offsetY = -piece.position2D.y; // Standard CAD Cartesian coordinates (Y up)

    const transformPt = (p: Point2D) => ({
      x: (p.x + offsetX).toFixed(3),
      y: (-p.y + offsetY).toFixed(3),
    });

    // --- Entity: Cut Line (Layer 1) ---
    if (includeCutLine && piece.cutLine && piece.cutLine.length >= 3) {
      dxf += '0\nPOLYLINE\n';
      dxf += '8\n1\n'; // Layer 1
      dxf += '66\n1\n'; // Entities follow
      dxf += '70\n1\n'; // Closed polyline

      for (const p of piece.cutLine) {
        const t = transformPt(p);
        dxf += `0\nVERTEX\n8\n1\n10\n${t.x}\n20\n${t.y}\n30\n0.0\n`;
      }
      dxf += '0\nSEQEND\n';
    }

    // --- Entity: Seam Line (Layer 2) ---
    if (includeSeamLine && piece.seamLine && piece.seamLine.length >= 3) {
      dxf += '0\nPOLYLINE\n';
      dxf += '8\n2\n'; // Layer 2
      dxf += '66\n1\n';
      dxf += '70\n1\n';

      for (const p of piece.seamLine) {
        const t = transformPt(p);
        dxf += `0\nVERTEX\n8\n2\n10\n${t.x}\n20\n${t.y}\n30\n0.0\n`;
      }
      dxf += '0\nSEQEND\n';
    }

    // --- Entity: Grainline (Layer 8) ---
    if (includeGrainline && piece.grainline) {
      const g0 = transformPt(piece.grainline.start);
      const g1 = transformPt(piece.grainline.end);

      dxf += '0\nLINE\n';
      dxf += '8\n8\n'; // Layer 8
      dxf += `10\n${g0.x}\n20\n${g0.y}\n30\n0.0\n`;
      dxf += `11\n${g1.x}\n21\n${g1.y}\n31\n0.0\n`;
    }

    // --- Entity: Notches (Layer 13) ---
    if (includeNotches && piece.boundary) {
      for (const edge of piece.boundary) {
        const ticks = computeNotchTicks(edge, 7);
        for (const tick of ticks) {
          const t0 = transformPt(tick.p0);
          const t1 = transformPt(tick.p1);

          dxf += '0\nLINE\n';
          dxf += '8\n13\n'; // Layer 13
          dxf += `10\n${t0.x}\n20\n${t0.y}\n30\n0.0\n`;
          dxf += `11\n${t1.x}\n21\n${t1.y}\n31\n0.0\n`;

          if (tick.isDouble && tick.secondTick) {
            const st0 = transformPt(tick.secondTick.p0);
            const st1 = transformPt(tick.secondTick.p1);
            dxf += '0\nLINE\n';
            dxf += '8\n13\n';
            dxf += `10\n${st0.x}\n20\n${st0.y}\n30\n0.0\n`;
            dxf += `11\n${st1.x}\n21\n${st1.y}\n31\n0.0\n`;
          }
        }
      }
    }

    // --- Entity: Annotations (Layer 4) ---
    if (includeAnnotations) {
      const bbox = polygonBoundingBox(piece.seamLine);
      const centerPt = transformPt({
        x: bbox.minX + bbox.width * 0.5,
        y: bbox.minY + bbox.height * 0.5,
      });

      const cutDesc = piece.cutCount === 1 ? 'CUT 1 ON FOLD' : `CUT ${piece.cutCount} PAIR`;
      const labelText = `${piece.name.toUpperCase()} | ${project.name} | SIZE: ${sizeLabel} | ${cutDesc}`;

      dxf += '0\nTEXT\n';
      dxf += '8\n4\n'; // Layer 4
      dxf += `10\n${centerPt.x}\n20\n${centerPt.y}\n30\n0.0\n`;
      dxf += '40\n14.0\n'; // Text height 14mm
      dxf += `1\n${labelText}\n`;
      dxf += '72\n1\n'; // Center aligned horizontally
      dxf += `11\n${centerPt.x}\n21\n${centerPt.y}\n31\n0.0\n`;
    }
  }

  dxf += '0\nENDSEC\n';
  dxf += '0\nEOF\n';

  return dxf;
}

/**
 * Client-side helper to trigger browser download of the DXF-AAMA file
 */
export function downloadDxfAamaFile(
  project: GarmentProject,
  sizeLabel: string = 'M',
  customFilename?: string
): void {
  if (typeof window === 'undefined') return;

  const dxfContent = generateDxfAama(project, { sizeLabel });
  const filename = customFilename || `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_size_${sizeLabel}_aama.dxf`;

  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
