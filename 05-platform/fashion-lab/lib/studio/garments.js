/* cloPRO — parametric garment engine
 * Every garment is generated from a parameter block so silhouettes stay
 * consistent, print areas map to real inches, and colour zones are uniform.
 * Canvas space is 600 x 700 user units.  1 inch = 21.5 units (a 28" wide
 * garment laid flat spans ~600u), which keeps print-area maths honest.
 */

export const VB = { w: 600, h: 700 };
export const PX_PER_INCH = 21.5;
const CX = 300;
const RAD = Math.PI / 180;

const n = (v) => Math.round(v * 100) / 100;
const P = (x, y) => `${n(x)} ${n(y)}`;

/* ---------------------------------------------------------------- geometry */

function geom(p, side, view) {
  const s = side; // +1 right, -1 left
  const X = (o) => CX + s * o;
  const back = view === 'back';

  const shoulderY = p.shoulderY;
  const shoulder = { x: X(p.shoulder), y: shoulderY + p.shoulderSlope };
  const neckTop = { x: X(p.neck), y: shoulderY + p.neckRise };
  const armpit = { x: X(p.chest), y: p.armY };
  const waist = { x: X(p.waist), y: p.waistY };
  const hip = { x: X(p.hip), y: p.hemY };

  /* Sleeve axis lives in right-half space and is mirrored through X().
     `outer` is the top edge of the sleeve, `inner` the underarm edge. */
  const a = p.sleeveAngle * RAD;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = Math.sin(a);   // outward normal, x
  const ny = -Math.cos(a);  // outward normal, y
  const so = p.shoulder;
  const sy = shoulder.y;
  const w = p.cuffWidth;

  // keep the cuff on the canvas no matter what the parameters ask for
  const budget = VB.w / 2 - so - 10 - w * nx;
  const len = Math.min(p.sleeveLen, Math.max(24, budget / Math.max(0.12, dx)));

  const endO = so + dx * len;
  const endY = sy + dy * len;
  const cd = p.cuffDepth;

  const sleeve = {
    top: shoulder,
    length: len,
    endOuter: { x: X(endO + nx * w), y: endY + ny * w },
    endInner: { x: X(endO - nx * w), y: endY - ny * w },
    // cuff band edge, stepped back along the sleeve axis
    bandOuter: { x: X(endO + nx * w - dx * cd), y: endY + ny * w - dy * cd },
    bandInner: { x: X(endO - nx * w - dx * cd), y: endY - ny * w - dy * cd },
    // rounded cap: midpoint of the top seam pushed outwards
    capCtl: { x: X(so + dx * len * 0.45 + nx * p.capBulge), y: sy + dy * len * 0.45 + ny * p.capBulge },
    axis: { dx: s * dx, dy },
  };

  return { s, X, back, shoulder, neckTop, armpit, waist, hip, sleeve };
}

/* neckline segment: left neck point -> right neck point */
function neckline(p, view) {
  const back = view === 'back';
  const drop = back ? p.neckDropBack : p.neckDrop;
  const nw = p.neck;
  const y = p.shoulderY + p.neckRise;
  const L = CX - nw;
  const R = CX + nw;
  const bottom = y + drop;

  switch (back ? 'crew' : p.neckType) {
    case 'v':
      return `L ${P(CX, bottom)} L ${P(R, y)}`;
    case 'deepv':
      return `L ${P(CX - nw * 0.16, bottom)} L ${P(CX + nw * 0.16, bottom)} L ${P(R, y)}`;
    case 'scoop':
      return `C ${P(L + nw * 0.1, bottom * 0.62 + y * 0.38)} ${P(R - nw * 0.1, bottom * 0.62 + y * 0.38)} ${P(R, y)}`;
    case 'square':
      return `L ${P(L, bottom)} L ${P(R, bottom)} L ${P(R, y)}`;
    default: // crew
      return `C ${P(L + nw * 0.22, bottom)} ${P(R - nw * 0.22, bottom)} ${P(R, y)}`;
  }
}

/* Collar rib: the same neckline swept outwards by `band`.  The outer corners
   ride down the shoulder seam so the band never floats off the garment. */
function necklineBand(p, view, band) {
  const back = view === 'back';
  const drop = (back ? p.neckDropBack : p.neckDrop) + band;
  const nw = p.neck;
  const y = p.shoulderY + p.neckRise;
  const iy = y;

  // step out along the neck -> shoulder seam
  const sdx = p.shoulder - p.neck;
  const sdy = p.shoulderSlope - p.neckRise;
  const slen = Math.hypot(sdx, sdy) || 1;
  const ox = (sdx / slen) * band;
  const oy = (sdy / slen) * band;

  const oL = { x: CX - nw - ox, y: y + oy };
  const oR = { x: CX + nw + ox, y: y + oy };
  const ow = nw + ox;
  const bottom = y + drop;
  const type = back ? 'crew' : p.neckType;

  let outer;
  if (type === 'v') outer = `L ${P(CX, bottom)} L ${P(oR.x, oR.y)}`;
  else if (type === 'deepv') outer = `L ${P(CX - ow * 0.16, bottom)} L ${P(CX + ow * 0.16, bottom)} L ${P(oR.x, oR.y)}`;
  else if (type === 'square') outer = `L ${P(oL.x, bottom)} L ${P(oR.x, bottom)} L ${P(oR.x, oR.y)}`;
  else if (type === 'scoop') outer = `C ${P(oL.x + ow * 0.1, bottom * 0.62 + y * 0.38)} ${P(oR.x - ow * 0.1, bottom * 0.62 + y * 0.38)} ${P(oR.x, oR.y)}`;
  else outer = `C ${P(oL.x + ow * 0.22, bottom)} ${P(oR.x - ow * 0.22, bottom)} ${P(oR.x, oR.y)}`;

  return `M ${P(oL.x, oL.y)} ${outer} L ${P(CX + nw, iy)} ${reverseNeck(p, view)} L ${P(oL.x, oL.y)} Z`;
}

/* inner neckline traced right -> left so the band closes cleanly */
function reverseNeck(p, view) {
  const back = view === 'back';
  const drop = back ? p.neckDropBack : p.neckDrop;
  const nw = p.neck;
  const y = p.shoulderY + p.neckRise;
  const L = CX - nw;
  const R = CX + nw;
  const bottom = y + drop;
  switch (back ? 'crew' : p.neckType) {
    case 'v':
      return `L ${P(CX, bottom)} L ${P(L, y)}`;
    case 'deepv':
      return `L ${P(CX + nw * 0.16, bottom)} L ${P(CX - nw * 0.16, bottom)} L ${P(L, y)}`;
    case 'scoop':
      return `C ${P(R - nw * 0.1, bottom * 0.62 + y * 0.38)} ${P(L + nw * 0.1, bottom * 0.62 + y * 0.38)} ${P(L, y)}`;
    case 'square':
      return `L ${P(R, bottom)} L ${P(L, bottom)} L ${P(L, y)}`;
    default:
      return `C ${P(R - nw * 0.22, bottom)} ${P(L + nw * 0.22, bottom)} ${P(L, y)}`;
  }
}

/* --------------------------------------------------------------- fragments */

export function torsoPath(p, view) {
  const r = geom(p, 1, view);
  const l = geom(p, -1, view);
  const sleeveless = p.sleeveLen <= 0;

  // a sleeveless armhole scoops inwards; a sleeved one hides under the sleeve
  const armR = sleeveless
    ? `C ${P(r.shoulder.x - 10, r.shoulder.y + 58)} ${P(r.armpit.x - 18, r.armpit.y - 72)} ${P(r.armpit.x, r.armpit.y)}`
    : `L ${P(r.armpit.x, r.armpit.y)}`;
  const armL = sleeveless
    ? `C ${P(l.armpit.x + 18, l.armpit.y - 72)} ${P(l.shoulder.x + 10, l.shoulder.y + 58)} ${P(l.shoulder.x, l.shoulder.y)}`
    : `L ${P(l.shoulder.x, l.shoulder.y)}`;

  return [
    `M ${P(l.neckTop.x, l.neckTop.y)}`,
    neckline(p, view),
    `L ${P(r.shoulder.x, r.shoulder.y)}`,
    armR,
    `C ${P(r.waist.x, r.waist.y)} ${P(r.waist.x, r.waist.y + 40)} ${P(r.hip.x, r.hip.y)}`,
    `Q ${P(CX, r.hip.y + p.hemCurve)} ${P(l.hip.x, l.hip.y)}`,
    `C ${P(l.waist.x, l.waist.y + 40)} ${P(l.waist.x, l.waist.y)} ${P(l.armpit.x, l.armpit.y)}`,
    armL,
    'Z',
  ].join(' ');
}

export function sleevePath(p, view, side) {
  if (p.sleeveLen <= 0) return null;
  const g = geom(p, side, view);
  const sl = g.sleeve;
  return [
    `M ${P(g.shoulder.x, g.shoulder.y)}`,
    `Q ${P(sl.capCtl.x, sl.capCtl.y)} ${P(sl.endOuter.x, sl.endOuter.y)}`,
    `L ${P(sl.endInner.x, sl.endInner.y)}`,
    `Q ${P((sl.endInner.x + g.armpit.x) / 2 + side * 6, (sl.endInner.y + g.armpit.y) / 2)} ${P(g.armpit.x, g.armpit.y)}`,
    'Z',
  ].join(' ');
}

export function cuffPath(p, view, side) {
  if (p.sleeveLen <= 0 || p.cuffDepth <= 0) return null;
  const sl = geom(p, side, view).sleeve;
  return [
    `M ${P(sl.endOuter.x, sl.endOuter.y)}`,
    `L ${P(sl.endInner.x, sl.endInner.y)}`,
    `L ${P(sl.bandInner.x, sl.bandInner.y)}`,
    `L ${P(sl.bandOuter.x, sl.bandOuter.y)}`,
    'Z',
  ].join(' ');
}

export function hemBandPath(p, view) {
  if (!p.hemBand) return null;
  const r = geom(p, 1, view);
  const l = geom(p, -1, view);
  const h = p.hemBand;
  return [
    `M ${P(l.hip.x, l.hip.y)}`,
    `Q ${P(CX, r.hip.y + p.hemCurve)} ${P(r.hip.x, r.hip.y)}`,
    `L ${P(r.hip.x + 1, r.hip.y - h)}`,
    `Q ${P(CX, r.hip.y + p.hemCurve - h)} ${P(l.hip.x - 1, l.hip.y - h)}`,
    'Z',
  ].join(' ');
}

export function collarPath(p, view) {
  if (!p.collarBand) return null;
  return necklineBand(p, view, p.collarBand);
}

/* side panel — the classic athletic insert running armpit to hem */
export function sidePanelPath(p, view, side) {
  const g = geom(p, side, view);
  const w = p.panelWidth || 26;
  const s = side;
  return [
    `M ${P(g.armpit.x, g.armpit.y)}`,
    `C ${P(g.waist.x, g.waist.y)} ${P(g.waist.x, g.waist.y + 40)} ${P(g.hip.x, g.hip.y)}`,
    `L ${P(g.hip.x - s * w, g.hip.y - 2)}`,
    `C ${P(g.waist.x - s * w, g.waist.y + 40)} ${P(g.waist.x - s * w, g.waist.y)} ${P(g.armpit.x - s * w * 0.72, g.armpit.y + 4)}`,
    'Z',
  ].join(' ');
}

/* shoulder yoke — colour-block across the top of the garment */
export function yokePath(p, view) {
  const r = geom(p, 1, view);
  const l = geom(p, -1, view);
  const y = p.yokeY || p.armY - 40;
  return [
    `M ${P(l.neckTop.x, l.neckTop.y)}`,
    neckline(p, view),
    `L ${P(r.shoulder.x, r.shoulder.y)}`,
    `L ${P(r.armpit.x, Math.min(y, r.armpit.y))}`,
    `Q ${P(CX, y + 34)} ${P(l.armpit.x, Math.min(y, l.armpit.y))}`,
    `L ${P(l.shoulder.x, l.shoulder.y)}`,
    'Z',
  ].join(' ');
}

/* ------------------------------------------------------------------ extras */

const extras = {
  placket(p, view) {
    if (view === 'back') return null;
    const y = p.shoulderY + p.neckRise + p.neckDrop;
    const w = 15;
    const bottom = p.placketFull ? p.hemY - 6 : y + 150;
    return {
      id: 'placket',
      label: 'Placket',
      role: 'primary',
      d: `M ${P(CX - w, y - 4)} L ${P(CX + w, y - 4)} L ${P(CX + w, bottom)} L ${P(CX - w, bottom)} Z`,
      stitch: `M ${P(CX - w + 3, y)} L ${P(CX - w + 3, bottom - 3)} M ${P(CX + w - 3, y)} L ${P(CX + w - 3, bottom - 3)}`,
      buttons: (() => {
        const out = [];
        const count = p.placketFull ? 7 : 3;
        for (let i = 0; i < count; i++) out.push({ x: CX, y: y + 26 + i * ((bottom - y - 34) / Math.max(1, count - 1)) });
        return out;
      })(),
    };
  },

  pocket(p, view) {
    if (view === 'back') return null;
    const top = p.hemY - 170;
    const bot = p.hemY - (p.hemBand || 0) - 12;
    const w = 128;
    return {
      id: 'pocket',
      label: 'Kangaroo pocket',
      role: 'primary',
      d: `M ${P(CX - w, top + 26)} L ${P(CX - w + 34, top)} L ${P(CX + w - 34, top)} L ${P(CX + w, top + 26)}
          L ${P(CX + w - 6, bot)} L ${P(CX - w + 6, bot)} Z`,
      stitch: `M ${P(CX - w + 2, top + 26)} L ${P(CX - w + 34, top)} M ${P(CX + w - 2, top + 26)} L ${P(CX + w - 34, top)}`,
    };
  },

  hood(p, view) {
    const top = p.shoulderY - 74;
    const w = p.neck + 100;
    const y0 = p.shoulderY + p.neckRise + 6;
    if (view === 'back') {
      return {
        id: 'hood',
        label: 'Hood',
        role: 'primary',
        d: `M ${P(CX - w, y0 + 26)} C ${P(CX - w - 6, top + 24)} ${P(CX - w * 0.5, top)} ${P(CX, top)}
            C ${P(CX + w * 0.5, top)} ${P(CX + w + 6, top + 24)} ${P(CX + w, y0 + 26)} Z`,
        stitch: `M ${P(CX, top + 4)} L ${P(CX, y0 + 26)}`,
      };
    }
    return {
      id: 'hood',
      label: 'Hood',
      role: 'primary',
      behind: true,
      d: `M ${P(CX - w, y0 + 40)} C ${P(CX - w - 10, top + 30)} ${P(CX - w * 0.5, top - 6)} ${P(CX, top - 6)}
          C ${P(CX + w * 0.5, top - 6)} ${P(CX + w + 10, top + 30)} ${P(CX + w, y0 + 40)}
          C ${P(CX + w * 0.55, y0 + 78)} ${P(CX - w * 0.55, y0 + 78)} ${P(CX - w, y0 + 40)} Z`,
    };
  },

  hoodOpening(p, view) {
    if (view === 'back') return null;
    const y0 = p.shoulderY + p.neckRise + 10;
    const w = p.neck + 26;
    return {
      id: 'hoodLining',
      label: 'Hood lining',
      role: 'secondary',
      d: `M ${P(CX - w, y0)} C ${P(CX - w * 0.6, y0 + 74)} ${P(CX + w * 0.6, y0 + 74)} ${P(CX + w, y0)}
          C ${P(CX + w * 0.55, y0 + 40)} ${P(CX - w * 0.55, y0 + 40)} ${P(CX - w, y0)} Z`,
    };
  },

  drawstring(p, view) {
    if (view === 'back') return null;
    const y0 = p.shoulderY + p.neckRise + 44;
    return {
      id: 'drawstring',
      label: 'Drawcord',
      role: 'accent',
      strokeOnly: true,
      d: `M ${P(CX - 30, y0)} C ${P(CX - 40, y0 + 80)} ${P(CX - 26, y0 + 120)} ${P(CX - 34, y0 + 158)}
          M ${P(CX + 30, y0)} C ${P(CX + 40, y0 + 80)} ${P(CX + 26, y0 + 120)} ${P(CX + 34, y0 + 158)}`,
    };
  },

  laces(p, view) {
    if (view === 'back') return null;
    const y = p.shoulderY + p.neckRise + p.neckDrop;
    const seg = [];
    for (let i = 0; i < 4; i++) {
      const yy = y + 6 + i * 15;
      seg.push(`M ${P(CX - 17, yy)} L ${P(CX + 17, yy + 9)} M ${P(CX + 17, yy)} L ${P(CX - 17, yy + 9)}`);
    }
    return { id: 'laces', label: 'Lace-up', role: 'accent', strokeOnly: true, d: seg.join(' ') };
  },

  zipper(p, view) {
    if (view === 'back') return null;
    const y = p.shoulderY + p.neckRise;
    return {
      id: 'zipper',
      label: 'Zipper',
      role: 'accent',
      strokeOnly: true,
      dash: '6 5',
      d: `M ${P(CX, y)} L ${P(CX, p.hemY - 6)}`,
    };
  },

  sleeveStripes(p, view) {
    if (p.sleeveLen <= 0) return null;
    const out = [];
    for (const side of [1, -1]) {
      const g = geom(p, side, view);
      const sl = g.sleeve;
      const t = (f) => ({
        x: sl.endOuter.x + (g.shoulder.x - sl.endOuter.x) * f,
        y: sl.endOuter.y + (g.shoulder.y - sl.endOuter.y) * f,
      });
      const t2 = (f) => ({
        x: sl.endInner.x + (g.armpit.x - sl.endInner.x) * f,
        y: sl.endInner.y + (g.armpit.y - sl.endInner.y) * f,
      });
      for (const [a, b] of [[0.22, 0.34], [0.42, 0.54]]) {
        const o1 = t(a), o2 = t(b), i1 = t2(a), i2 = t2(b);
        out.push(`M ${P(o1.x, o1.y)} L ${P(o2.x, o2.y)} L ${P(i2.x, i2.y)} L ${P(i1.x, i1.y)} Z`);
      }
    }
    return { id: 'sleeveStripe', label: 'Sleeve stripes', role: 'secondary', d: out.join(' ') };
  },

  shoulderStripes(p, view) {
    const out = [];
    for (const side of [1, -1]) {
      const g = geom(p, side, view);
      const nx = CX + side * (p.neck + 8);
      const ny = p.shoulderY + p.neckRise + 6;
      const dx = g.shoulder.x - nx;
      const dy = g.shoulder.y - ny;
      const len = Math.hypot(dx, dy) || 1;
      const px = (-dy / len) * 9;
      const py = (dx / len) * 9;
      for (let i = -1; i <= 1; i++) {
        const off = i * 22;
        out.push(
          `M ${P(nx + (px * off) / 9, ny + (py * off) / 9)} L ${P(g.shoulder.x + (px * off) / 9, g.shoulder.y + (py * off) / 9)}`
        );
      }
    }
    return { id: 'shoulderStripe', label: 'Shoulder stripes', role: 'accent', strokeOnly: true, width: 8, d: out.join(' ') };
  },
};

/* --------------------------------------------------------------- bottoms */

function shortsPath(p, view) {
  const top = p.topY;
  const w = p.waistW;
  const hw = p.hipW;
  const len = p.legLen;
  const crotch = top + p.rise;
  const inseam = p.inseam || 26;
  return [
    `M ${P(CX - w, top)}`,
    `L ${P(CX + w, top)}`,
    `C ${P(CX + hw, top + 60)} ${P(CX + hw + 4, crotch)} ${P(CX + hw - 2, len)}`,
    `L ${P(CX + inseam, len)}`,
    `C ${P(CX + inseam + 6, crotch + 30)} ${P(CX + 4, crotch + 4)} ${P(CX, crotch)}`,
    `C ${P(CX - 4, crotch + 4)} ${P(CX - inseam - 6, crotch + 30)} ${P(CX - inseam, len)}`,
    `L ${P(CX - hw + 2, len)}`,
    `C ${P(CX - hw - 4, crotch)} ${P(CX - hw, top + 60)} ${P(CX - w, top)}`,
    'Z',
  ].join(' ');
}

function waistbandPath(p) {
  const top = p.topY;
  const w = p.waistW;
  const h = p.bandH || 30;
  return `M ${P(CX - w, top)} L ${P(CX + w, top)} L ${P(CX + w + 3, top + h)} L ${P(CX - w - 3, top + h)} Z`;
}

/* ------------------------------------------------------------------- caps */

function capPaths(p, view) {
  const cy = 300;
  if (view === 'back') {
    return {
      crown: `M ${P(CX - 170, cy + 92)} C ${P(CX - 176, cy - 60)} ${P(CX - 96, cy - 128)} ${P(CX, cy - 128)}
              C ${P(CX + 96, cy - 128)} ${P(CX + 176, cy - 60)} ${P(CX + 170, cy + 92)}
              C ${P(CX + 90, cy + 120)} ${P(CX - 90, cy + 120)} ${P(CX - 170, cy + 92)} Z`,
      brim: null,
      closure: `M ${P(CX - 40, cy + 60)} L ${P(CX + 40, cy + 60)} L ${P(CX + 40, cy + 112)} L ${P(CX - 40, cy + 112)} Z`,
    };
  }
  return {
    crown: `M ${P(CX - 172, cy + 86)} C ${P(CX - 178, cy - 62)} ${P(CX - 96, cy - 130)} ${P(CX, cy - 130)}
            C ${P(CX + 96, cy - 130)} ${P(CX + 178, cy - 62)} ${P(CX + 172, cy + 86)}
            C ${P(CX + 90, cy + 112)} ${P(CX - 90, cy + 112)} ${P(CX - 172, cy + 86)} Z`,
    brim: `M ${P(CX - 172, cy + 86)} C ${P(CX - 200, cy + 190)} ${P(CX + 200, cy + 190)} ${P(CX + 172, cy + 86)}
           C ${P(CX + 90, cy + 112)} ${P(CX - 90, cy + 112)} ${P(CX - 172, cy + 86)} Z`,
    seams: `M ${P(CX, cy - 130)} L ${P(CX, cy + 104)} M ${P(CX - 86, cy - 112)} C ${P(CX - 110, cy - 20)} ${P(CX - 116, cy + 40)} ${P(CX - 116, cy + 98)}
            M ${P(CX + 86, cy - 112)} C ${P(CX + 110, cy - 20)} ${P(CX + 116, cy + 40)} ${P(CX + 116, cy + 98)}`,
  };
}

function sockPaths() {
  const topY = 90;
  const w = 62;
  return {
    body: `M ${P(CX - w, topY)} L ${P(CX + w, topY)} L ${P(CX + w - 6, 430)}
           C ${P(CX + w - 4, 500)} ${P(CX + w + 10, 540)} ${P(CX + w + 30, 556)}
           L ${P(CX + w + 74, 566)} C ${P(CX + w + 100, 574)} ${P(CX + w + 96, 610)} ${P(CX + w + 60, 612)}
           L ${P(CX - w - 6, 612)} C ${P(CX - w - 34, 610)} ${P(CX - w - 38, 560)} ${P(CX - w - 20, 520)}
           C ${P(CX - w - 4, 486)} ${P(CX - w, 460)} ${P(CX - w, 420)} Z`,
    cuff: `M ${P(CX - w, topY)} L ${P(CX + w, topY)} L ${P(CX + w, topY + 46)} L ${P(CX - w, topY + 46)} Z`,
  };
}

function bagPaths() {
  return {
    body: `M ${P(CX - 165, 210)} L ${P(CX + 165, 210)} L ${P(CX + 150, 590)} L ${P(CX - 150, 590)} Z`,
    handles: `M ${P(CX - 92, 212)} C ${P(CX - 86, 90)} ${P(CX - 20, 84)} ${P(CX - 18, 212)}
              M ${P(CX + 92, 212)} C ${P(CX + 86, 90)} ${P(CX + 20, 84)} ${P(CX + 18, 212)}`,
  };
}

/* ------------------------------------------------------------- base params */

const base = {
  shoulderY: 122,
  shoulderSlope: 14,
  shoulder: 118,
  neck: 52,
  neckRise: 0,
  neckDrop: 40,
  neckDropBack: 16,
  neckType: 'crew',
  chest: 152,
  armY: 262,
  waist: 148,
  waistY: 430,
  hip: 152,
  hemY: 606,
  hemCurve: 16,
  hemBand: 0,
  collarBand: 15,
  sleeveAngle: 34,
  sleeveLen: 150,
  cuffWidth: 56,
  cuffDepth: 0,
  capBulge: 24,
  panelWidth: 26,
};

const mk = (o) => ({ ...base, ...o });

/* ------------------------------------------------------------ print areas */

const area = (id, label, x, y, w, h) => ({ id, label, x, y, w, h });

function topAreas(p, view) {
  const midY = p.armY + 40;
  if (view === 'back') {
    return [
      area('back-name', 'Name bar', CX - 150, p.armY - 8, 300, 52),
      area('back-number', 'Back number', CX - 130, p.armY + 58, 260, 250),
      area('back-lower', 'Lower back', CX - 120, p.hemY - 150, 240, 90),
    ];
  }
  return [
    area('front-center', 'Front centre', CX - 155, midY, 310, 300),
    area('left-chest', 'Left chest', CX + 34, p.armY - 40, 120, 120),
    area('right-chest', 'Right chest', CX - 154, p.armY - 40, 120, 120),
    area('front-number', 'Front number', CX - 90, midY + 20, 180, 180),
  ];
}

function sleeveAreas(p, view) {
  if (p.sleeveLen <= 0) return [];
  const out = [];
  for (const [side, id, label] of [[1, 'sleeve-left', 'Left sleeve'], [-1, 'sleeve-right', 'Right sleeve']]) {
    const g = geom(p, side, view);
    const sl = g.sleeve;
    const mx = (sl.endOuter.x + sl.endInner.x + g.shoulder.x + g.armpit.x) / 4;
    const my = (sl.endOuter.y + sl.endInner.y + g.shoulder.y + g.armpit.y) / 4;
    out.push({ ...area(id, label, mx - 42, my - 42, 84, 84), rotate: side * 18 });
  }
  return out;
}

/* ------------------------------------------------------------- definitions */

export const GARMENTS = {};

function def(g) {
  GARMENTS[g.id] = g;
  return g;
}

/* Builds the zone list for a top from its params + extra part names. */
function buildTop(p, view, parts) {
  const zones = [];
  const add = (z) => z && z.d && zones.push(z);

  if (parts.includes('hood')) {
    const h = extras.hood(p, view);
    if (h && h.behind) add(h);
  }

  add({ id: 'body', label: 'Body', role: 'primary', d: torsoPath(p, view) });

  if (parts.includes('yoke')) add({ id: 'yoke', label: 'Shoulder yoke', role: 'secondary', d: yokePath(p, view) });
  if (parts.includes('sidePanel')) {
    add({ id: 'panelL', label: 'Side panel L', role: 'secondary', d: sidePanelPath(p, view, 1) });
    add({ id: 'panelR', label: 'Side panel R', role: 'secondary', d: sidePanelPath(p, view, -1) });
  }

  add({ id: 'sleeveL', label: 'Left sleeve', role: p.sleeveRole || 'secondary', d: sleevePath(p, view, 1) });
  add({ id: 'sleeveR', label: 'Right sleeve', role: p.sleeveRole || 'secondary', d: sleevePath(p, view, -1) });

  if (parts.includes('sleeveStripes')) add(extras.sleeveStripes(p, view));
  if (parts.includes('shoulderStripes')) add(extras.shoulderStripes(p, view));

  if (parts.includes('pocket')) add(extras.pocket(p, view));
  if (parts.includes('placket')) add(extras.placket(p, view));
  if (parts.includes('laces')) add(extras.laces(p, view));
  if (parts.includes('zipper')) add(extras.zipper(p, view));

  add({ id: 'cuffL', label: 'Left cuff', role: 'accent', d: cuffPath(p, view, 1) });
  add({ id: 'cuffR', label: 'Right cuff', role: 'accent', d: cuffPath(p, view, -1) });
  add({ id: 'hemBand', label: 'Waistband', role: 'accent', d: hemBandPath(p, view) });
  add({ id: 'collar', label: 'Collar', role: 'accent', d: collarPath(p, view) });

  if (parts.includes('hood')) {
    const h = extras.hood(p, view);
    if (h && !h.behind) add(h);
    add(extras.hoodOpening(p, view));
    add(extras.drawstring(p, view));
  }

  return zones;
}

function topGarment(cfg) {
  const p = mk(cfg.params);
  return def({
    id: cfg.id,
    name: cfg.name,
    category: cfg.category,
    sport: cfg.sport || null,
    kind: 'top',
    params: p,
    parts: cfg.parts || [],
    tags: cfg.tags || [],
    sizes: cfg.sizes || ['YS', 'YM', 'YL', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    fabric: cfg.fabric || '100% polyester interlock, 145gsm',
    views: ['front', 'back'],
    zones: (view) => buildTop(p, view, cfg.parts || []),
    areas: (view) => [...topAreas(p, view), ...sleeveAreas(p, view)],
    outline: (view) => torsoPath(p, view),
  });
}

/* ============================ JERSEYS ============================ */

topGarment({
  id: 'basketball-jersey',
  name: 'Basketball Jersey',
  category: 'Jerseys',
  sport: 'Basketball',
  parts: ['sidePanel'],
  fabric: 'Dazzle knit polyester, 150gsm',
  params: {
    neckType: 'v', neck: 60, neckDrop: 66, neckDropBack: 26,
    shoulder: 108, shoulderSlope: 16, sleeveLen: 0,
    chest: 140, armY: 306, waist: 136, hip: 148, hemY: 620, hemCurve: 26,
    collarBand: 13, panelWidth: 30,
  },
});

topGarment({
  id: 'basketball-shooter',
  name: 'Shooting Shirt',
  category: 'Jerseys',
  sport: 'Basketball',
  parts: ['sidePanel', 'yoke'],
  params: {
    neckType: 'crew', neck: 56, neckDrop: 44, sleeveLen: 118, sleeveAngle: 40,
    cuffWidth: 48, chest: 152, armY: 274, hemY: 610,
  },
});

topGarment({
  id: 'baseball-jersey',
  name: 'Baseball Jersey',
  category: 'Jerseys',
  sport: 'Baseball',
  parts: ['placket', 'sleeveStripes'],
  fabric: 'Double-knit polyester, 200gsm',
  params: {
    neckType: 'crew', neck: 54, neckDrop: 22, collarBand: 14,
    sleeveLen: 150, sleeveAngle: 44, cuffWidth: 48, cuffDepth: 16, capBulge: 22,
    chest: 156, armY: 268, waist: 152, hip: 156, hemY: 600, hemCurve: 8,
    placketFull: true, sleeveRole: 'secondary',
  },
});

topGarment({
  id: 'football-jersey',
  name: 'Football Jersey',
  category: 'Jerseys',
  sport: 'Football',
  parts: ['sleeveStripes', 'shoulderStripes', 'sidePanel'],
  fabric: 'Stretch mesh polyester, 210gsm',
  params: {
    neckType: 'crew', neck: 58, neckDrop: 34, collarBand: 16,
    shoulder: 140, shoulderSlope: 8, sleeveLen: 96, sleeveAngle: 22, cuffWidth: 62,
    chest: 176, armY: 254, waist: 156, hip: 150, hemY: 566, hemCurve: 10,
  },
});

topGarment({
  id: 'hockey-jersey',
  name: 'Hockey Jersey',
  category: 'Jerseys',
  sport: 'Hockey',
  parts: ['laces', 'sleeveStripes', 'yoke'],
  fabric: 'Air-knit polyester, 220gsm',
  params: {
    neckType: 'crew', neck: 60, neckDrop: 46, collarBand: 18,
    shoulder: 136, shoulderSlope: 12, sleeveLen: 205, sleeveAngle: 60, cuffWidth: 58, cuffDepth: 24, capBulge: 24,
    chest: 186, armY: 276, waist: 184, hip: 188, hemY: 596, hemCurve: 22, yokeY: 250,
  },
});

topGarment({
  id: 'soccer-jersey',
  name: 'Soccer Jersey',
  category: 'Jerseys',
  sport: 'Soccer',
  parts: ['sidePanel', 'sleeveStripes'],
  fabric: 'Recycled poly piqué, 140gsm',
  params: {
    neckType: 'deepv', neck: 50, neckDrop: 42, collarBand: 12,
    shoulder: 112, shoulderSlope: 16, sleeveLen: 128, sleeveAngle: 36, cuffWidth: 46, cuffDepth: 10,
    chest: 146, armY: 262, waist: 138, hip: 142, hemY: 588, hemCurve: 10,
  },
});

topGarment({
  id: 'volleyball-jersey',
  name: 'Volleyball Jersey',
  category: 'Jerseys',
  sport: 'Volleyball',
  parts: ['sidePanel'],
  params: {
    neckType: 'scoop', neck: 58, neckDrop: 50, collarBand: 11,
    shoulder: 104, shoulderSlope: 18, sleeveLen: 88, sleeveAngle: 44, cuffWidth: 44,
    chest: 138, armY: 268, waist: 128, hip: 136, hemY: 578,
  },
});

topGarment({
  id: 'cycling-jersey',
  name: 'Cycling Jersey',
  category: 'Jerseys',
  sport: 'Cycling',
  parts: ['zipper', 'sidePanel'],
  fabric: 'Lycra-blend tech knit, 165gsm',
  params: {
    neckType: 'crew', neck: 46, neckDrop: 26, collarBand: 14,
    shoulder: 104, shoulderSlope: 16, sleeveLen: 136, sleeveAngle: 30, cuffWidth: 40, cuffDepth: 12,
    chest: 136, armY: 250, waist: 126, hip: 130, hemY: 580, hemBand: 20, hemCurve: 6,
  },
});

topGarment({
  id: 'rugby-jersey',
  name: 'Rugby Jersey',
  category: 'Jerseys',
  sport: 'Rugby',
  parts: ['placket', 'yoke'],
  params: {
    neckType: 'crew', neck: 54, neckDrop: 30, collarBand: 22,
    shoulder: 128, shoulderSlope: 12, sleeveLen: 215, sleeveAngle: 60, cuffWidth: 50, cuffDepth: 14, capBulge: 22,
    chest: 168, armY: 268, waist: 158, hip: 160, hemY: 592,
  },
});

topGarment({
  id: 'esports-jersey',
  name: 'Esports Jersey',
  category: 'Jerseys',
  sport: 'Esports',
  parts: ['sidePanel', 'shoulderStripes', 'zipper'],
  params: {
    neckType: 'crew', neck: 52, neckDrop: 34, collarBand: 16,
    shoulder: 124, shoulderSlope: 14, sleeveLen: 120, sleeveAngle: 34, cuffWidth: 52, cuffDepth: 12,
    chest: 158, armY: 262, waist: 150, hip: 154, hemY: 596,
  },
});

/* ============================ TOPS ============================ */

topGarment({
  id: 'tee',
  name: 'T-Shirt',
  category: 'Tops',
  parts: [],
  fabric: '100% ring-spun cotton, 4.3oz',
  params: {},
});

topGarment({
  id: 'tee-long',
  name: 'Long Sleeve Tee',
  category: 'Tops',
  parts: [],
  fabric: '100% ring-spun cotton, 5.3oz',
  params: { sleeveLen: 300, sleeveAngle: 66, cuffWidth: 40, cuffDepth: 16, capBulge: 22 },
});

topGarment({
  id: 'vneck-tee',
  name: 'V-Neck Tee',
  category: 'Tops',
  parts: [],
  params: { neckType: 'v', neck: 50, neckDrop: 78, collarBand: 11 },
});

topGarment({
  id: 'tank',
  name: 'Tank Top',
  category: 'Tops',
  parts: [],
  params: {
    neckType: 'scoop', neck: 56, neckDrop: 54, collarBand: 10,
    shoulder: 78, shoulderSlope: 20, sleeveLen: 0, chest: 132, armY: 300, hemY: 604,
  },
});

topGarment({
  id: 'polo',
  name: 'Polo Shirt',
  category: 'Tops',
  parts: ['placket'],
  fabric: 'Cotton piqué, 6.1oz',
  params: { neckType: 'square', neck: 44, neckDrop: 18, collarBand: 26, sleeveLen: 148, cuffDepth: 12 },
});

topGarment({
  id: 'hoodie',
  name: 'Pullover Hoodie',
  category: 'Tops',
  parts: ['hood', 'pocket'],
  fabric: '80/20 cotton-poly fleece, 8.5oz',
  params: {
    neck: 56, neckDrop: 30, collarBand: 0,
    shoulder: 134, shoulderSlope: 12, sleeveLen: 290, sleeveAngle: 68, cuffWidth: 44, cuffDepth: 30, capBulge: 24,
    chest: 172, armY: 276, waist: 168, hip: 170, hemY: 596, hemBand: 34, hemCurve: 4,
  },
});

topGarment({
  id: 'zip-hoodie',
  name: 'Full-Zip Hoodie',
  category: 'Tops',
  parts: ['hood', 'zipper'],
  params: {
    neck: 56, neckDrop: 30, collarBand: 0,
    shoulder: 134, shoulderSlope: 12, sleeveLen: 290, sleeveAngle: 68, cuffWidth: 44, cuffDepth: 30, capBulge: 24,
    chest: 172, armY: 276, waist: 168, hip: 170, hemY: 596, hemBand: 34, hemCurve: 4,
  },
});

topGarment({
  id: 'crewneck',
  name: 'Crewneck Sweatshirt',
  category: 'Tops',
  parts: [],
  fabric: '80/20 cotton-poly fleece, 8.5oz',
  params: {
    neck: 54, neckDrop: 26, collarBand: 22,
    shoulder: 132, shoulderSlope: 12, sleeveLen: 290, sleeveAngle: 68, cuffWidth: 44, cuffDepth: 30, capBulge: 24,
    chest: 170, armY: 274, waist: 166, hip: 168, hemY: 592, hemBand: 34, hemCurve: 4,
  },
});

topGarment({
  id: 'quarter-zip',
  name: 'Quarter-Zip',
  category: 'Tops',
  parts: ['placket'],
  params: {
    neckType: 'square', neck: 46, neckDrop: 12, collarBand: 34,
    shoulder: 128, sleeveLen: 290, sleeveAngle: 68, cuffWidth: 44, cuffDepth: 22, capBulge: 24,
    chest: 164, armY: 272, waist: 158, hip: 160, hemY: 592,
  },
});

topGarment({
  id: 'track-jacket',
  name: 'Urban Track Jacket',
  category: 'Outerwear',
  fabric: 'Double-knit performance poly-spandex with technical satin finish',
  parts: ['zipper', 'sidePanel', 'sleeveStripes'],
  params: {
    neckType: 'square', neck: 48, neckDrop: 12, collarBand: 28,
    shoulder: 138, shoulderSlope: 11, sleeveLen: 282, sleeveAngle: 68, cuffWidth: 46, cuffDepth: 22, capBulge: 24,
    chest: 176, armY: 278, waist: 168, hip: 172, hemY: 590, hemBand: 30, panelWidth: 32,
  },
});

topGarment({
  id: 'windbreaker',
  name: 'Windbreaker',
  category: 'Outerwear',
  parts: ['zipper', 'yoke', 'sidePanel'],
  fabric: 'Ripstop nylon shell, water repellent',
  params: {
    neckType: 'square', neck: 48, neckDrop: 10, collarBand: 30,
    shoulder: 140, shoulderSlope: 10, sleeveLen: 282, sleeveAngle: 68, cuffWidth: 46, cuffDepth: 20, capBulge: 24,
    chest: 178, armY: 280, waist: 172, hip: 176, hemY: 588, hemBand: 26, yokeY: 268,
  },
});

topGarment({
  id: 'varsity-jacket',
  name: 'Varsity Jacket',
  category: 'Outerwear',
  parts: ['placket', 'sleeveStripes'],
  fabric: 'Melton wool body, leather sleeves',
  params: {
    neckType: 'square', neck: 48, neckDrop: 14, collarBand: 30,
    shoulder: 138, shoulderSlope: 12, sleeveLen: 282, sleeveAngle: 68, cuffWidth: 46, cuffDepth: 30, capBulge: 24,
    chest: 176, armY: 278, waist: 170, hip: 172, hemY: 588, hemBand: 34,
    placketFull: true, sleeveRole: 'secondary',
  },
});

topGarment({
  id: 'coaches-jacket',
  name: 'Coaches Jacket',
  category: 'Outerwear',
  parts: ['placket', 'pocket'],
  params: {
    neckType: 'square', neck: 50, neckDrop: 12, collarBand: 28,
    shoulder: 140, sleeveLen: 282, sleeveAngle: 68, cuffWidth: 46, cuffDepth: 18, capBulge: 24,
    chest: 180, armY: 282, waist: 176, hip: 178, hemY: 592, hemBand: 22, placketFull: true,
  },
});

/* ============================ BOTTOMS ============================ */

function bottomGarment(cfg) {
  const p = { topY: 150, waistW: 130, hipW: 168, rise: 190, legLen: 400, inseam: 26, bandH: 30, ...cfg.params };
  return def({
    id: cfg.id,
    name: cfg.name,
    category: cfg.category || 'Bottoms',
    sport: cfg.sport || null,
    kind: 'bottom',
    params: p,
    parts: cfg.parts || [],
    sizes: cfg.sizes || ['YS', 'YM', 'YL', 'S', 'M', 'L', 'XL', '2XL'],
    fabric: cfg.fabric || 'Polyester tricot, 160gsm',
    views: ['front', 'back'],
    zones: (view) => {
      const z = [{ id: 'body', label: 'Body', role: 'primary', d: shortsPath(p, view) }];
      if ((cfg.parts || []).includes('sidePanel')) {
        const stripe = (side) =>
          `M ${P(CX + side * (p.hipW - 6), p.topY + 66)} L ${P(CX + side * (p.hipW + 2), p.topY + 66)}
           L ${P(CX + side * (p.hipW - 2), p.legLen)} L ${P(CX + side * (p.hipW - 26), p.legLen)} Z`;
        z.push({ id: 'stripeL', label: 'Side stripe L', role: 'secondary', d: stripe(1) });
        z.push({ id: 'stripeR', label: 'Side stripe R', role: 'secondary', d: stripe(-1) });
      }
      z.push({ id: 'waistband', label: 'Waistband', role: 'accent', d: waistbandPath(p) });
      return z;
    },
    areas: () => [
      area('left-hip', 'Left hip', CX + 34, p.topY + 70, 100, 100),
      area('right-hip', 'Right hip', CX - 134, p.topY + 70, 100, 100),
      area('center-front', 'Centre front', CX - 70, p.topY + 60, 140, 120),
    ],
    outline: (view) => shortsPath(p, view),
  });
}

bottomGarment({ id: 'basketball-shorts', name: 'Basketball Shorts', sport: 'Basketball', parts: ['sidePanel'], params: { legLen: 470, hipW: 182, rise: 210 } });
bottomGarment({ id: 'soccer-shorts', name: 'Soccer Shorts', sport: 'Soccer', parts: ['sidePanel'], params: { legLen: 400, hipW: 166 } });
bottomGarment({ id: 'training-shorts', name: 'Training Shorts', parts: [], params: { legLen: 380, hipW: 162 } });
bottomGarment({
  id: 'joggers', name: 'Joggers', category: 'Bottoms', parts: ['sidePanel'],
  fabric: 'Cotton-poly fleece, 8.5oz',
  params: { legLen: 668, hipW: 150, inseam: 16, rise: 210 },
});
bottomGarment({
  id: 'leggings', name: 'Leggings', category: 'Bottoms', parts: ['sidePanel'],
  fabric: 'Nylon-spandex, 240gsm',
  params: { legLen: 672, hipW: 128, waistW: 112, inseam: 10, rise: 200, bandH: 40 },
});

/* Modern Baggy Wide-Leg 5-Pocket Denim Jeans (light-wash / mid-wash / washed-black + drawstring variant)
 * Silhouette: relaxed seat, straight wide legs (no taper), full-length stacked hem over the shoe,
 * tonal tan topstitching, plain clean hem (no turn-up), vintage thigh/knee wash fade (`wash: true`).
 */
const DENIM_STITCH = '#C9A877';

const denimJeansBodyPath = [
  'M 168 150',
  'L 432 150',
  'C 448 200, 454 262, 452 330',
  'C 452 430, 458 560, 462 664',
  'L 308 664',
  'C 308 540, 308 420, 304 360',
  'C 302 348, 301 344, 300 344',
  'C 299 344, 298 348, 296 360',
  'C 292 420, 292 540, 292 664',
  'L 138 664',
  'C 142 560, 148 430, 148 330',
  'C 146 262, 152 200, 168 150',
  'Z',
].join(' ');

const denimLegStitch = [
  // Outseams (relaxed, straight to the hem)
  'M 152 186 C 148 262, 147 330, 148 380 C 148 470, 145 570, 142 652',
  'M 448 186 C 452 262, 453 330, 452 380 C 452 470, 455 570, 458 652',
  // Inseams
  'M 296 364 C 293 430, 293 540, 293 652',
  'M 304 364 C 307 430, 307 540, 307 652',
].join(' ');

const denimHemPath = [
  'M 142 652 L 293 652 L 292 664 L 138 664 Z',
  'M 307 652 L 458 652 L 462 664 L 308 664 Z',
].join(' ');

const denimHemStitch = 'M 141 657 L 292 657 M 308 657 L 459 657';

function modernJeansGarment({ id, name, drawstring = false, fabric }) {
  return def({
    id,
    name,
    category: 'Bottoms',
    kind: 'bottom',
    params: { topY: 150, waistW: 132, hipW: 152, rise: 194, legLen: 664, inseam: 8, bandH: 32 },
    parts: drawstring ? ['pocket', 'placket', 'yoke', 'cuff', 'drawstring'] : ['pocket', 'placket', 'yoke', 'cuff'],
    sizes: ['26', '28', '30', '32', '34', '36', '38', '40'],
    fabric: fabric || '13oz Rigid Cotton Denim, Light Stone Wash, Relaxed Wide-Leg Fit',
    views: ['front', 'back'],
    zones: (view) => {
      if (view === 'back') {
        return [
          {
            id: 'body',
            label: 'Main Denim Legs',
            role: 'primary',
            wash: 'back',
            d: denimJeansBodyPath,
            stitchColor: DENIM_STITCH,
            stitch: `${denimLegStitch} M 300 248 L 300 344`,
          },
          {
            id: 'yoke',
            label: 'Back Yoke',
            role: 'secondary',
            d: 'M 164 182 L 436 182 L 446 222 L 300 246 L 154 222 Z',
            stitchColor: DENIM_STITCH,
            stitch: 'M 155 218 L 300 242 L 445 218 M 155 223 L 300 247 L 445 223 M 300 182 L 300 246',
          },
          {
            id: 'pocket',
            label: 'Back Patch Pockets',
            role: 'secondary',
            d: [
              'M 182 254 L 272 254 L 270 334 L 227 356 L 184 334 Z',
              'M 328 254 L 418 254 L 416 334 L 373 356 L 330 334 Z',
            ].join(' '),
            stitchColor: DENIM_STITCH,
            stitch: [
              'M 187 259 L 267 259 L 265 331 L 227 351 L 189 331 Z',
              'M 333 259 L 413 259 L 411 331 L 373 351 L 335 331 Z',
            ].join(' '),
            rivets: [
              { x: 186, y: 258, r: 2.4 },
              { x: 268, y: 258, r: 2.4 },
              { x: 332, y: 258, r: 2.4 },
              { x: 414, y: 258, r: 2.4 },
            ],
          },
          {
            id: 'waistband',
            label: 'Waistband & Belt Loops',
            role: 'accent',
            d: [
              'M 168 150 L 432 150 L 436 182 L 164 182 Z',
              'M 176 148 L 185 148 L 185 188 L 176 188 Z',
              'M 232 148 L 241 148 L 241 188 L 232 188 Z',
              'M 295 148 L 305 148 L 305 190 L 295 190 Z',
              'M 359 148 L 368 148 L 368 188 L 359 188 Z',
              'M 415 148 L 424 148 L 424 188 L 415 188 Z',
            ].join(' '),
            stitchColor: DENIM_STITCH,
            stitch: 'M 168 155 L 432 155 M 165 177 L 435 177',
          },
          {
            id: 'collar',
            label: 'Brand Patch',
            role: 'tertiary',
            d: 'M 378 154 L 412 154 L 412 178 L 378 178 Z',
            stitchColor: DENIM_STITCH,
            stitch: 'M 381 157 L 409 157 L 409 175 L 381 175 Z',
          },
          {
            id: 'cuff',
            label: 'Clean Hem',
            role: 'accent',
            d: denimHemPath,
            stitchColor: DENIM_STITCH,
            stitch: denimHemStitch,
          },
        ];
      }

      const front = [
        {
          id: 'body',
          label: 'Main Denim Legs',
          role: 'primary',
          wash: 'front',
          d: denimJeansBodyPath,
          stitchColor: DENIM_STITCH,
          stitch: denimLegStitch,
        },
        {
          id: 'pocket',
          label: 'Front & Coin Pockets',
          role: 'secondary',
          d: [
            // Curved front pocket openings (relaxed, deep scoop)
            'M 164 182 L 236 182 C 232 222, 204 244, 151 250 Z',
            // Coin pocket
            'M 178 194 L 220 194 L 218 226 L 180 226 Z',
            'M 364 182 L 436 182 L 449 250 C 396 244, 368 222, 364 182 Z',
          ].join(' '),
          stitchColor: DENIM_STITCH,
          stitch: [
            'M 231 182 C 227 217, 201 238, 152 244',
            'M 178 199 L 220 199',
            'M 369 182 C 373 217, 399 238, 448 244',
          ].join(' '),
          rivets: [
            { x: 233, y: 186, r: 2.4 },
            { x: 154, y: 246, r: 2.4 },
            { x: 367, y: 186, r: 2.4 },
            { x: 446, y: 246, r: 2.4 },
          ],
        },
        {
          id: 'placket',
          label: drawstring ? 'Fly Placket' : 'Button / Zip Fly',
          role: 'secondary',
          d: 'M 276 182 L 304 182 L 304 312 C 284 310, 276 296, 276 276 Z',
          stitchColor: DENIM_STITCH,
          stitch: 'M 280 182 L 280 276 C 280 296, 287 306, 300 309 M 300 182 L 300 344',
        },
        {
          id: 'waistband',
          label: drawstring ? 'Drawcord Waistband' : 'Waistband & Belt Loops',
          role: 'accent',
          d: [
            'M 168 150 L 432 150 L 436 182 L 164 182 Z',
            'M 176 148 L 185 148 L 185 188 L 176 188 Z',
            'M 246 148 L 255 148 L 255 188 L 246 188 Z',
            'M 345 148 L 354 148 L 354 188 L 345 188 Z',
            'M 415 148 L 424 148 L 424 188 L 415 188 Z',
          ].join(' '),
          stitchColor: DENIM_STITCH,
          stitch: 'M 168 155 L 432 155 M 165 177 L 435 177',
          buttons: drawstring ? undefined : [{ x: 300, y: 166, color: '#9CA3AF' }],
        },
        {
          id: 'cuff',
          label: 'Clean Hem',
          role: 'accent',
          d: denimHemPath,
          stitchColor: DENIM_STITCH,
          stitch: denimHemStitch,
        },
      ];

      if (drawstring) {
        front.push({
          id: 'drawstring',
          label: 'Drawcord',
          role: 'tertiary',
          strokeOnly: true,
          width: 4,
          d: 'M 292 168 C 286 196, 280 222, 284 252 M 308 168 C 314 196, 320 222, 316 252',
        });
      }
      return front;
    },
    areas: () => [
      area('left-thigh', 'Left thigh', CX + 30, 270, 110, 170),
      area('right-thigh', 'Right thigh', CX - 140, 270, 110, 170),
      area('back-pocket-r', 'Right back pocket', CX + 30, 256, 86, 96),
    ],
    outline: () => denimJeansBodyPath,
  });
}

modernJeansGarment({ id: 'denim-jeans', name: 'Baggy Wide-Leg Jeans' });
modernJeansGarment({
  id: 'drawstring-jeans',
  name: 'Drawstring Wide-Leg Jeans',
  drawstring: true,
  fabric: '12oz Washed Black Cotton Denim, Elastic Drawcord Waist, Relaxed Wide-Leg Fit',
});

/* ============================ HEADWEAR & MORE ============================ */

def({
  id: 'cap',
  name: 'Snapback Cap',
  category: 'Headwear',
  kind: 'cap',
  params: {},
  parts: [],
  sizes: ['One Size', 'S/M', 'L/XL'],
  fabric: 'Structured 6-panel, cotton twill',
  views: ['front', 'back'],
  zones: (view) => {
    const c = capPaths({}, view);
    const z = [{ id: 'body', label: 'Crown', role: 'primary', d: c.crown }];
    if (c.brim) z.push({ id: 'brim', label: 'Brim', role: 'secondary', d: c.brim });
    if (c.closure) z.push({ id: 'closure', label: 'Closure', role: 'accent', d: c.closure });
    if (c.seams) z.push({ id: 'seams', label: 'Panel seams', role: 'accent', strokeOnly: true, width: 2, d: c.seams });
    return z;
  },
  areas: (view) =>
    view === 'back'
      ? [area('cap-back', 'Back panel', CX - 80, 250, 160, 80)]
      : [area('cap-front', 'Front panel', CX - 110, 215, 220, 120), area('cap-side', 'Side panel', CX + 110, 260, 60, 60)],
  outline: (view) => capPaths({}, view).crown,
});

def({
  id: 'beanie',
  name: 'Cuffed Beanie',
  category: 'Headwear',
  kind: 'cap',
  params: {},
  parts: [],
  sizes: ['One Size'],
  fabric: 'Acrylic rib knit',
  views: ['front', 'back'],
  zones: () => [
    {
      id: 'body', label: 'Body', role: 'primary',
      d: `M ${P(CX - 150, 460)} C ${P(CX - 160, 200)} ${P(CX - 90, 140)} ${P(CX, 140)}
          C ${P(CX + 90, 140)} ${P(CX + 160, 200)} ${P(CX + 150, 460)} Z`,
    },
    { id: 'cuff', label: 'Cuff', role: 'secondary', d: `M ${P(CX - 152, 452)} L ${P(CX + 152, 452)} L ${P(CX + 156, 556)} L ${P(CX - 156, 556)} Z` },
  ],
  areas: () => [area('beanie-cuff', 'Cuff patch', CX - 80, 468, 160, 72)],
  outline: () => `M ${P(CX - 152, 556)} L ${P(CX + 152, 556)} L ${P(CX + 150, 260)} C ${P(CX + 120, 140)} ${P(CX - 120, 140)} ${P(CX - 150, 260)} Z`,
});

def({
  id: 'socks',
  name: 'Team Socks',
  category: 'Accessories',
  kind: 'other',
  params: {},
  parts: [],
  sizes: ['S', 'M', 'L'],
  fabric: 'Combed cotton blend, cushioned sole',
  views: ['front'],
  zones: () => {
    const s = sockPaths();
    return [
      { id: 'body', label: 'Body', role: 'primary', d: s.body },
      { id: 'cuff', label: 'Cuff', role: 'secondary', d: s.cuff },
    ];
  },
  areas: () => [area('sock-calf', 'Calf', CX - 52, 170, 104, 160)],
  outline: () => sockPaths().body,
});

def({
  id: 'tote',
  name: 'Tote Bag',
  category: 'Accessories',
  kind: 'other',
  params: {},
  parts: [],
  sizes: ['15" x 16"'],
  fabric: '12oz cotton canvas',
  views: ['front', 'back'],
  zones: () => {
    const b = bagPaths();
    return [
      { id: 'body', label: 'Body', role: 'primary', d: b.body },
      { id: 'handles', label: 'Handles', role: 'accent', strokeOnly: true, width: 14, d: b.handles },
    ];
  },
  areas: () => [area('tote-front', 'Front panel', CX - 130, 260, 260, 260)],
  outline: () => bagPaths().body,
});


/* ============================ FORMALWEAR & DRESSES ============================ */

topGarment({
  id: 'blazer',
  name: 'Classic Tailored Blazer',
  category: 'Formalwear',
  fabric: 'Super 120s wool crepe with satin lapel facing',
  parts: ['pocket', 'yoke'],
  params: {
    neckType: 'v', neck: 48, neckDrop: 85, collarBand: 18,
    shoulder: 132, shoulderSlope: 14, sleeveLen: 230, sleeveAngle: 65, cuffWidth: 46, cuffDepth: 14,
    chest: 160, armY: 275, waist: 144, hip: 156, hemY: 620, hemCurve: 4,
  },
});

topGarment({
  id: 'suit-jacket',
  name: 'Notch-Lapel Suit Jacket',
  category: 'Formalwear',
  fabric: 'Worsted Italian wool, dual vent back',
  parts: ['placket', 'pocket'],
  params: {
    neckType: 'v', neck: 46, neckDrop: 90, collarBand: 20,
    shoulder: 134, shoulderSlope: 15, sleeveLen: 232, sleeveAngle: 65, cuffWidth: 46, cuffDepth: 16,
    chest: 162, armY: 275, waist: 146, hip: 158, hemY: 625, hemCurve: 6,
  },
});

topGarment({
  id: 'dress-shirt',
  name: 'Formal Dress Shirt',
  category: 'Formalwear',
  fabric: '100% 2-ply Egyptian cotton poplin',
  parts: ['placket', 'yoke'],
  params: {
    neckType: 'crew', neck: 44, neckDrop: 24, collarBand: 22,
    shoulder: 122, shoulderSlope: 12, sleeveLen: 225, sleeveAngle: 62, cuffWidth: 42, cuffDepth: 18,
    chest: 150, armY: 260, waist: 138, hip: 146, hemY: 610, hemCurve: 12,
  },
});

topGarment({
  id: 'trench',
  name: 'Heritage Trench Coat',
  category: 'Outerwear',
  fabric: 'Waterproof cotton gabardine, storm shield',
  parts: ['yoke', 'pocket', 'placket'],
  params: {
    neckType: 'v', neck: 52, neckDrop: 75, collarBand: 24,
    shoulder: 138, shoulderSlope: 16, sleeveLen: 240, sleeveAngle: 66, cuffWidth: 50, cuffDepth: 20,
    chest: 172, armY: 285, waist: 162, hip: 176, hemY: 685, hemCurve: 2,
  },
});

def({
  id: 'evening-gown',
  name: 'Evening Column Gown',
  category: 'Dresses',
  kind: 'other',
  params: {},
  parts: [],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  fabric: 'Heavy silk georgette with internal corset structure',
  views: ['front', 'back'],
  zones: () => [
    {
      id: 'body',
      label: 'Main Gown',
      role: 'primary',
      d: 'M 240 180 C 260 210, 270 240, 265 290 C 260 340, 250 420, 210 680 L 390 680 C 350 420, 340 340, 335 290 C 330 240, 340 210, 360 180 Z',
    },
    {
      id: 'bodice',
      label: 'Bodice Inset',
      role: 'secondary',
      d: 'M 240 180 C 270 215, 330 215, 360 180 C 350 240, 340 280, 300 290 C 260 280, 250 240, 240 180 Z',
    },
  ],
  areas: () => [
    area('gown-chest', 'Bodice artwork', CX - 60, 200, 120, 80),
    area('gown-skirt', 'Skirt print', CX - 90, 350, 180, 280),
  ],
  outline: () => 'M 240 180 C 260 210, 270 240, 265 290 C 260 340, 250 420, 210 680 L 390 680 C 350 420, 340 340, 335 290 C 330 240, 340 210, 360 180 Z',
});


/* ------------------------------------------------ custom scratch builder */

export const DEFAULT_SCRATCH_CONFIG = {
  baseMode: 'block', // 'block' | 'exploded' | 'croquis'
  neckType: 'crew',  // 'crew' | 'v' | 'deepv' | 'scoop' | 'square' | 'stand' | 'hood'
  sleeveType: 'short', // 'sleeveless' | 'cap' | 'short' | 'three-quarter' | 'long' | 'bell'
  shoulderWidth: 126,
  chestWidth: 148,
  waistWidth: 136,
  hipWidth: 148,
  garmentLength: 590,
  cutSplitMode: 'none', // 'none' | 'center-split' | 'princess' | 'colorblock-h' | 'diagonal-sash' | 'chevron-v' | 'empire-curve'
  cutY: 345,
  explodeAmount: 0, // 0 = Joined & Sewn, 100 = Exploded Flat Cut Pieces
  showCroquis: true,
  customCuts: [], // Array of { id, x1, y1, x2, y2, joined, stitchType }
  parts: {
    sidePanel: true,
    yoke: false,
    zipper: false,
    placket: false,
    pocket: false,
    hood: false,
    hemband: true,
    cuffs: true,
    sleeveStripes: false,
  },
};

export function buildScratchGarment(cfg = {}) {
  const sc = { ...DEFAULT_SCRATCH_CONFIG, ...cfg };

  // Normalize active parts from either array or boolean map
  const activeParts = [];
  if (Array.isArray(sc.parts)) {
    activeParts.push(...sc.parts);
  } else if (sc.parts && typeof sc.parts === 'object') {
    for (const [k, v] of Object.entries(sc.parts)) {
      if (v) activeParts.push(k);
    }
  }
  if (sc.neckType === 'hood' && !activeParts.includes('hood')) {
    activeParts.push('hood');
  }

  // Couture Muslin Sloper on Anatomical Dress Form when baseMode === 'croquis'
  if (sc.baseMode === 'croquis') {
    const croquisZones = (view) => [
      {
        id: 'body',
        label: 'Left Bodice Sloper (P1)',
        role: 'primary',
        pieceCode: 'P1 · BODICE L',
        explodeOffset: { dx: -24, dy: -8, rot: -2 },
        d: 'M 244 148 C 262 174, 282 182, 300 182 L 300 392 L 214 392 C 218 338, 198 295, 194 252 C 214 234, 224 196, 206 168 Z',
        stitch: 'M 248 160 C 254 248, 256 325, 252 390',
      },
      {
        id: 'cutR',
        label: 'Right Bodice Sloper (P2)',
        role: 'secondary',
        pieceCode: 'P2 · BODICE R',
        explodeOffset: { dx: 24, dy: -8, rot: 2 },
        d: 'M 300 182 C 318 182, 338 174, 356 148 L 394 168 C 376 196, 386 234, 406 252 C 402 295, 382 338, 386 392 L 300 392 Z',
        stitch: 'M 352 160 C 346 248, 344 325, 348 390',
      },
      {
        id: 'cutBottom',
        label: 'Lower Hip Skirt Block (P3)',
        role: 'primary',
        pieceCode: 'P3 · SKIRT BLOCK',
        explodeOffset: { dx: 0, dy: 30, rot: 0 },
        d: 'M 214 392 L 386 392 C 402 442, 418 512, 414 602 Q 300 618 186 602 C 182 512, 198 442, 214 392 Z',
        stitch: 'M 300 392 L 300 608 M 252 392 C 246 465, 238 535, 234 602 M 348 392 C 354 465, 362 535, 366 602',
      },
      {
        id: 'collar',
        label: 'Neckline Basting Tape',
        role: 'accent',
        pieceCode: 'P4 · NECK TAPE',
        explodeOffset: { dx: 0, dy: -28, rot: 0 },
        strokeOnly: true,
        width: 4,
        dash: '6 4',
        d:
          view === 'front'
            ? 'M 244 148 C 265 186, 335 186, 356 148'
            : 'M 244 148 C 268 164, 332 164, 356 148',
      },
    ];
    return {
      id: 'custom-scratch',
      name: 'Couture Croquis Sloper',
      category: 'Custom',
      kind: 'top',
      params: sc,
      scratchConfig: sc,
      parts: activeParts,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'Bespoke'],
      fabric: 'Unbleached Tailor Muslin / Custom Spec',
      views: ['front', 'back'],
      zones: croquisZones,
      areas: () => [
        area('scratch-full', 'Full Pattern Drafting Area', CX - 135, 155, 270, 445),
      ],
      outline: () =>
        'M 244 148 C 262 174, 338 174, 356 148 L 394 168 C 376 196, 386 234, 406 252 C 402 295, 382 338, 386 392 C 402 442, 418 512, 414 602 Q 300 618 186 602 C 182 512, 198 442, 214 392 C 218 338, 198 295, 194 252 C 214 234, 224 196, 206 168 Z',
    };
  }

  const sleeveMap = {
    sleeveless: { sleeveLen: 0, sleeveAngle: 45, cuffWidth: 44, cuffDepth: 0 },
    cap: { sleeveLen: 58, sleeveAngle: 36, cuffWidth: 48, cuffDepth: 10 },
    short: { sleeveLen: 122, sleeveAngle: 46, cuffWidth: 46, cuffDepth: 14 },
    'three-quarter': { sleeveLen: 178, sleeveAngle: 56, cuffWidth: 43, cuffDepth: 15 },
    long: { sleeveLen: 232, sleeveAngle: 63, cuffWidth: 42, cuffDepth: 18 },
    bell: { sleeveLen: 230, sleeveAngle: 56, cuffWidth: 68, cuffDepth: 8 },
  };
  const sl = sleeveMap[sc.sleeveType] || sleeveMap.short;

  const neckMap = {
    crew: { neckType: 'crew', neck: 52, neckDrop: 36, collarBand: 14 },
    v: { neckType: 'v', neck: 54, neckDrop: 68, collarBand: 14 },
    deepv: { neckType: 'deepv', neck: 56, neckDrop: 105, collarBand: 12 },
    scoop: { neckType: 'scoop', neck: 68, neckDrop: 58, collarBand: 10 },
    square: { neckType: 'square', neck: 62, neckDrop: 62, collarBand: 12 },
    stand: { neckType: 'crew', neck: 44, neckDrop: 22, collarBand: 24 },
    hood: { neckType: 'crew', neck: 52, neckDrop: 38, collarBand: 14 },
  };
  const nk = neckMap[sc.neckType] || neckMap.crew;

  const p = mk({
    ...nk,
    ...sl,
    hemBand: activeParts.includes('hemband') ? 22 : 0,
    cuffDepth: activeParts.includes('cuffs') ? sl.cuffDepth : 0,
    shoulder: Number(sc.shoulderWidth) || 126,
    shoulderSlope: 16,
    chest: Number(sc.chestWidth) || 148,
    armY: 268,
    waist: Number(sc.waistWidth) || 136,
    hip: Number(sc.hipWidth) || 148,
    hemY: Number(sc.garmentLength) || 590,
    hemCurve: sc.garmentLength > 640 ? 18 : 8,
  });

  const buildScratchZones = (view) => {
    const baseZones = buildTop(p, view, activeParts);
    const bodyPath = torsoPath(p, view);
    const cutY = Number(sc.cutY) || 345;
    const splitMode = sc.cutSplitMode || 'none';

    // Attach explode metadata to standard zones so Exploded Cut & Join Table works seamlessly
    const decorated = [];
    for (const z of baseZones) {
      if (z.id === 'body') {
        z.pieceCode = 'P1 · MAIN BODICE';
        z.explodeOffset = { dx: 0, dy: 0, rot: 0 };
        decorated.push(z);

        // 1. Apply Parametric Tailor Cut Splits (clipped to exact torso silhouette)
        if (splitMode === 'center-split') {
          decorated.push({
            id: 'cutR',
            label: 'Right Split Panel (Cut)',
            role: 'secondary',
            clipToBody: true,
            pieceCode: 'P1B · RIGHT SPLIT',
            explodeOffset: { dx: 24, dy: 0, rot: 1.5 },
            d: 'M 300 60 L 560 60 L 560 695 L 300 695 Z',
            seamLine: `M 300 ${p.shoulderY + p.neckDrop} L 300 ${p.hemY}`,
          });
        } else if (splitMode === 'princess') {
          decorated.push({
            id: 'cutL',
            label: 'Left Princess Panel (Cut)',
            role: 'secondary',
            clipToBody: true,
            pieceCode: 'P1L · PRINCESS L',
            explodeOffset: { dx: -26, dy: 2, rot: -2 },
            d: 'M 60 60 L 238 60 C 254 250, 256 385, 242 695 L 60 695 Z',
            seamLine: 'M 238 145 C 254 250, 256 385, 242 620',
          });
          decorated.push({
            id: 'cutR',
            label: 'Right Princess Panel (Cut)',
            role: 'secondary',
            clipToBody: true,
            pieceCode: 'P1R · PRINCESS R',
            explodeOffset: { dx: 26, dy: 2, rot: 2 },
            d: 'M 362 60 L 540 60 L 540 695 L 358 695 C 344 385, 346 250, 362 60 Z',
            seamLine: 'M 362 145 C 346 250, 344 385, 358 620',
          });
        } else if (splitMode === 'colorblock-h') {
          decorated.push({
            id: 'cutBottom',
            label: 'Lower Cut Block',
            role: 'secondary',
            clipToBody: true,
            pieceCode: 'P1B · LOWER CUT',
            explodeOffset: { dx: 0, dy: 28, rot: 0 },
            d: `M 60 ${cutY} L 540 ${cutY} L 540 695 L 60 695 Z`,
            seamLine: `M 140 ${cutY} L 460 ${cutY}`,
          });
        } else if (splitMode === 'diagonal-sash') {
          decorated.push({
            id: 'cutBottom',
            label: 'Lower Diagonal Cut Panel',
            role: 'secondary',
            clipToBody: true,
            pieceCode: 'P1B · DIAGONAL CUT',
            explodeOffset: { dx: 16, dy: 24, rot: 2 },
            d: `M 60 ${cutY - 75} L 540 ${cutY + 75} L 540 695 L 60 695 Z`,
            seamLine: `M 145 ${cutY - 48} L 455 ${cutY + 48}`,
          });
        } else if (splitMode === 'chevron-v') {
          decorated.push({
            id: 'cutTop',
            label: 'Upper V-Chevron Cut Yoke',
            role: 'secondary',
            clipToBody: true,
            pieceCode: 'P1T · CHEVRON CUT',
            explodeOffset: { dx: 0, dy: -24, rot: 0 },
            d: `M 60 60 L 540 60 L 540 ${cutY - 55} L 300 ${cutY + 45} L 60 ${cutY - 55} Z`,
            seamLine: `M 145 ${cutY - 35} L 300 ${cutY + 45} L 455 ${cutY - 35}`,
          });
        } else if (splitMode === 'empire-curve') {
          decorated.push({
            id: 'cutTop',
            label: 'Empire Bust Cut Bodice',
            role: 'secondary',
            clipToBody: true,
            pieceCode: 'P1T · EMPIRE BODICE',
            explodeOffset: { dx: 0, dy: -22, rot: 0 },
            d: `M 60 60 L 540 60 L 540 ${cutY} Q 300 ${cutY - 48} 60 ${cutY} Z`,
            seamLine: `M 150 ${cutY - 6} Q 300 ${cutY - 48} 450 ${cutY - 6}`,
          });
        }

        // 2. Apply Interactive User-Drawn Knife Cuts (sc.customCuts)
        const customCuts = Array.isArray(sc.customCuts) ? sc.customCuts : [];
        customCuts.forEach((cut, idx) => {
          const x1 = Number(cut.x1) || 150;
          const y1 = Number(cut.y1) || 300;
          const x2 = Number(cut.x2) || 450;
          const y2 = Number(cut.y2) || 350;
          const isVertical = Math.abs(y2 - y1) > Math.abs(x2 - x1) * 1.35;
          // Extend line endpoints to bounding box edges so the polygon cleanly slices the torso
          const polyD = isVertical
            ? `M ${x1} 50 L 560 50 L 560 695 L ${x2} 695 Z`
            : `M 50 ${y1} L 550 ${y2} L 550 695 L 50 695 Z`;
          decorated.push({
            id: cut.id || `cutCustom_${idx + 1}`,
            label: `Knife Cut Panel #${idx + 1}`,
            role: idx % 2 === 0 ? 'secondary' : 'accent',
            clipToBody: true,
            cutMeta: cut,
            pieceCode: `CUT #${idx + 1}`,
            explodeOffset: isVertical
              ? { dx: 22, dy: 4, rot: 1.5 }
              : { dx: 0, dy: 24, rot: 0 },
            d: polyD,
            seamLine: `M ${x1} ${y1} L ${x2} ${y2}`,
          });
        });
      } else {
        if (z.id === 'sleeveL') {
          z.pieceCode = 'P2 · SLEEVE L';
          z.explodeOffset = { dx: 44, dy: -16, rot: -10 };
        } else if (z.id === 'sleeveR') {
          z.pieceCode = 'P3 · SLEEVE R';
          z.explodeOffset = { dx: -44, dy: -16, rot: 10 };
        } else if (z.id === 'cuffL') {
          z.explodeOffset = { dx: 56, dy: -8, rot: -10 };
        } else if (z.id === 'cuffR') {
          z.explodeOffset = { dx: -56, dy: -8, rot: 10 };
        } else if (z.id === 'collar' || z.id === 'hood' || z.id === 'hoodLining') {
          z.pieceCode = 'P4 · NECK / COLLAR';
          z.explodeOffset = { dx: 0, dy: -34, rot: 0 };
        } else if (z.id === 'yoke') {
          z.pieceCode = 'P5 · SHOULDER YOKE';
          z.explodeOffset = { dx: 0, dy: -20, rot: 0 };
        } else if (z.id === 'panelL') {
          z.pieceCode = 'P6 · SIDE PANEL L';
          z.explodeOffset = { dx: 26, dy: 6, rot: -3 };
        } else if (z.id === 'panelR') {
          z.pieceCode = 'P7 · SIDE PANEL R';
          z.explodeOffset = { dx: -26, dy: 6, rot: 3 };
        } else if (z.id === 'hemBand') {
          z.pieceCode = 'P8 · WAISTBAND';
          z.explodeOffset = { dx: 0, dy: 30, rot: 0 };
        } else if (z.id === 'pocket') {
          z.pieceCode = 'P9 · POCKET';
          z.explodeOffset = { dx: 0, dy: 18, rot: 0 };
        }
        decorated.push(z);
      }
    }

    return decorated;
  };

  return {
    id: 'custom-scratch',
    name:
      sc.baseMode === 'exploded'
        ? 'Cut & Join Pattern Sloper'
        : 'Custom Scratch Design',
    category: 'Custom',
    kind: 'top',
    params: p,
    scratchConfig: sc,
    parts: activeParts,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'Bespoke'],
    fabric: 'Bespoke Custom Block',
    views: ['front', 'back'],
    zones: buildScratchZones,
    areas: (view) => [...topAreas(p, view), ...sleeveAreas(p, view)],
    outline: (view) => torsoPath(p, view),
  };
}

GARMENTS['custom-scratch'] = buildScratchGarment(DEFAULT_SCRATCH_CONFIG);

/* --------------------------------------------------------------- helpers */

export const CATEGORIES = ['Jerseys', 'Tops', 'Outerwear', 'Formalwear', 'Dresses', 'Bottoms', 'Headwear', 'Accessories'];

export function garmentList() {
  return Object.values(GARMENTS);
}

export function getGarment(id, scratchConfig) {
  if (id === 'custom-scratch') {
    return buildScratchGarment(scratchConfig);
  }
  if (!id) return GARMENTS['track-jacket'] || GARMENTS['tee'];
  const aliasMap = {
    'jacket': 'track-jacket',
    'urban-jacket': 'track-jacket',
    'jeans': 'denim-jeans',
    'coat': 'blazer',
    'sweater': 'crewneck',
    't-shirt': 'tee',
  };
  const resolved = aliasMap[id] || id;
  return GARMENTS[resolved] || GARMENTS[id] || GARMENTS['track-jacket'] || GARMENTS['tee'];
}

export function inches(px) {
  return Math.round((px / PX_PER_INCH) * 10) / 10;
}
