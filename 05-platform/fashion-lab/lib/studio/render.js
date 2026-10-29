/* cloPRO — project -> SVG.
 * The same function feeds the live canvas, the thumbnails and every export,
 * so what you see is exactly what ships.
 */

import { getGarment, VB } from './garments.js';
import { buildPaint } from './patterns.js';
import { buildArt } from './graphics.js';
import { fontCss } from './library.js';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ------------------------------------------------------------- measuring */

let mctx = null;
export function measureText(text, font, size, tracking = 0) {
  if (!mctx && typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 8;
    mctx = c.getContext('2d');
  }
  if (!mctx) {
    return String(text || '').length * (size * 0.6);
  }
  mctx.font = `${size}px ${fontCss(font)}`;
  const base = mctx.measureText(text || '').width;
  return base + Math.max(0, (String(text || '').length - 1)) * tracking;
}

/**
 * Computes exact bounding box { x, y, w, h, cx, cy } for any garment zone or cut piece
 * so CorelDRAW 8-handle bounding boxes and per-piece scaling/rotation pivot around the piece's true center.
 */
export function computeZoneBounds(z) {
  if (!z || !z.d) {
    return { x: 180, y: 140, w: 240, h: 440, cx: 300, cy: 360 };
  }
  const nums = String(z.d)
    .replace(/[A-Za-z]/g, ' ')
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !Number.isNaN(n));

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < nums.length - 1; i += 2) {
    const px = nums[i];
    const py = nums[i + 1];
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { x: 180, y: 140, w: 240, h: 440, cx: 300, cy: 360 };
  }

  // If this zone is clipped to the torso body (e.g. cutL, cutR, cutTop, cutBottom),
  // clamp its bounding box to the visible torso silhouette bounds so handles hug the piece tightly.
  if (z.clipToBody) {
    minX = Math.max(155, minX);
    maxX = Math.min(445, maxX);
    minY = Math.max(122, minY);
    maxY = Math.min(605, maxY);
  }

  const w = Math.max(24, maxX - minX);
  const h = Math.max(24, maxY - minY);
  return {
    x: minX,
    y: minY,
    w,
    h,
    cx: minX + w / 2,
    cy: minY + h / 2,
  };
}

/* ------------------------------------------------------------- text paths */

function arcPath(kind, x, y, width, amount) {
  const w = Math.max(20, width);
  if (kind === 'bridge') {
    const A = Math.max(4, amount * 0.35) * (Math.PI / 180);
    const R = w / (2 * A);
    const sx = x - R * Math.sin(A);
    const sy = y + R - R * Math.cos(A);
    const ex = x + R * Math.sin(A);
    return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 0 1 ${ex.toFixed(2)} ${sy.toFixed(2)}`;
  }
  const A = Math.max(3, amount) * (Math.PI / 180);
  const R = w / (2 * A);
  if (kind === 'arch-down') {
    const sx = x - R * Math.sin(A);
    const sy = y - R + R * Math.cos(A);
    const ex = x + R * Math.sin(A);
    return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 0 0 ${ex.toFixed(2)} ${sy.toFixed(2)}`;
  }
  const sx = x - R * Math.sin(A);
  const sy = y + R - R * Math.cos(A);
  const ex = x + R * Math.sin(A);
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 0 1 ${ex.toFixed(2)} ${sy.toFixed(2)}`;
}

/* ------------------------------------------------------------------ paint */

class Defs {
  constructor() { this.chunks = []; this.n = 0; }
  add(markup) { if (markup) this.chunks.push(markup); }
  paint(p) {
    const normalized = typeof p === 'string' ? { style: 'solid', colors: [p] } : p;
    const uid = `pf${this.n++}`;
    const built = buildPaint(uid, normalized);
    this.add(built.defs);
    return built.fill;
  }
  toString() { return this.chunks.join('\n'); }
}

/* ------------------------------------------------------------------ layers */

function textLayerSVG(l, defs) {
  const size = l.size || 60;
  const font = fontCss(l.font);
  const w = measureText(l.text, l.font, size, l.tracking || 0);
  const fill = defs.paint(l.fill || '#FFFFFF');
  const outlines = (l.outlines || []).slice().sort((a, b) => b.width - a.width);
  const skew = l.arc === 'slant-up' ? -8 : l.arc === 'slant-down' ? 8 : 0;
  const attrs = `font-family="${esc(font)}" font-size="${size}" font-weight="800" letter-spacing="${l.tracking || 0}"
    text-anchor="middle" dominant-baseline="middle" xml:space="preserve"`;

  const curved = ['arch', 'arch-down', 'bridge'].includes(l.arc);
  const pathId = `tp_${l.id}`;
  let body = '';

  const one = (paintFill, strokeAttr) => {
    if (curved) {
      return `<text ${attrs} ${strokeAttr} fill="${paintFill}">
        <textPath href="#${pathId}" xlink:href="#${pathId}" startOffset="50%">${esc(l.text)}</textPath></text>`;
    }
    const lines = String(l.text ?? '').split('\n');
    const lh = (l.lineHeight || 1.05) * size;
    const y0 = -((lines.length - 1) * lh) / 2;
    return `<text ${attrs} ${strokeAttr} fill="${paintFill}">${lines
      .map((ln, i) => `<tspan x="0" y="${(y0 + i * lh).toFixed(2)}">${esc(ln)}</tspan>`)
      .join('')}</text>`;
  };

  if (curved) defs.add(`<path id="${pathId}" d="${arcPath(l.arc, 0, 0, w, l.arcAmount || 30)}" fill="none"/>`);

  for (const o of outlines) {
    body += one(o.color, `stroke="${o.color}" stroke-width="${o.width * 2}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"`);
  }
  body += one(fill, '');

  const sk = skew ? ` skewY(${skew})` : '';
  return { body, extraTransform: sk };
}

function artLayerSVG(l, defs) {
  const artId = l.art || l.artId || 'gen-shield';
  const parts = buildArt(artId, l.artParams);
  const size = l.size || 130;
  const k = size / 200;
  const fills = {};
  const defaultRoleColors = {
    primary: '#10B981',
    secondary: '#FFFFFF',
    accent: '#0E6E55',
  };
  for (const role of ['primary', 'secondary', 'accent']) {
    fills[role] = defs.paint(
      l.roleFills?.[role] || { style: 'solid', colors: [defaultRoleColors[role]] }
    );
  }
  let body = '';
  const outlines = (l.outlines || []).slice().sort((a, b) => b.width - a.width);
  for (const o of outlines) {
    body += `<g fill="none" stroke="${o.color}" stroke-width="${(o.width * 2) / k}" stroke-linejoin="round">`;
    for (const p of parts) body += `<path d="${p.d}"/>`;
    body += '</g>';
  }
  for (const p of parts) {
    const f = fills[p.role] || fills.primary;
    if (p.stroke) body += `<path d="${p.d}" fill="none" stroke="${f}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
    else body += `<path d="${p.d}" fill="${f}" fill-rule="evenodd"/>`;
  }
  return { body: `<g transform="scale(${k.toFixed(4)}) translate(-100 -100)">${body}</g>`, extraTransform: '' };
}

function imageLayerSVG(l, project) {
  const asset = (project.assets || []).find((a) => a.id === l.assetId);
  const src = l.src || asset?.src;
  if (!src) return { body: '', extraTransform: '' };
  const ratio = asset?.h && asset?.w ? asset.h / asset.w : 1;
  const w = l.size || 160;
  const h = w * ratio;
  return {
    body: `<image href="${src}" xlink:href="${src}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`,
    extraTransform: '',
  };
}

export function nodesToSvgPath(nodes, closed = true, mirror = false) {
  if (!Array.isArray(nodes) || nodes.length < 2) return '';
  const tx = (x) => (mirror ? Number((600 - x).toFixed(1)) : Number(x.toFixed(1)));
  const ty = (y) => Number(y.toFixed(1));

  let d = `M ${tx(nodes[0].x)} ${ty(nodes[0].y)}`;
  const count = closed ? nodes.length : nodes.length - 1;
  for (let i = 0; i < count; i++) {
    const cur = nodes[i];
    const next = nodes[(i + 1) % nodes.length];
    if (cur.cx !== undefined && cur.cy !== undefined) {
      d += ` Q ${tx(cur.cx)} ${ty(cur.cy)} ${tx(next.x)} ${ty(next.y)}`;
    } else {
      d += ` L ${tx(next.x)} ${ty(next.y)}`;
    }
  }
  if (closed) d += ' Z';
  return d;
}

function pathLayerSVG(l) {
  const isClosedPanel = Boolean(l.closedPanel);
  const hasNodes = Array.isArray(l.nodes) && l.nodes.length >= 2;
  const computedD = hasNodes
    ? nodesToSvgPath(l.nodes, isClosedPanel, false)
    : l.d || '';
  if (!computedD) return { body: '', extraTransform: '', isWorldSpace: true };

  const computedMirrorD = hasNodes
    ? l.symmetry
      ? nodesToSvgPath(l.nodes, isClosedPanel, true)
      : ''
    : l.mirrorD || '';

  const stroke = esc(l.stroke || '#10B981');
  const sw = Number(l.strokeWidth) || 4;
  const dash = l.dash ? ` stroke-dasharray="${esc(l.dash)}"` : '';
  const fill = isClosedPanel
    ? esc(l.fillPath || l.stroke || '#10B981')
    : esc(l.fillPath || 'none');
  const dClosed =
    isClosedPanel && !computedD.trim().endsWith('Z') ? `${computedD} Z` : computedD;
  const mirrorClosed =
    computedMirrorD && isClosedPanel && !computedMirrorD.trim().endsWith('Z')
      ? `${computedMirrorD} Z`
      : computedMirrorD;

  const outlineStroke = l.outlineColor
    ? esc(l.outlineColor)
    : isClosedPanel
    ? '#FFFFFF'
    : stroke;

  let paths = `<path d="${dClosed}" fill="${fill}" fill-opacity="${isClosedPanel ? '0.92' : '1'}" stroke="${outlineStroke}" stroke-width="${isClosedPanel ? 2.2 : sw}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
  if (isClosedPanel) {
    paths += `<path d="${dClosed}" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="1.3" stroke-dasharray="5 3"/>`;
  }
  if (mirrorClosed) {
    paths += `<path d="${mirrorClosed}" fill="${fill}" fill-opacity="${isClosedPanel ? '0.92' : '1'}" stroke="${outlineStroke}" stroke-width="${isClosedPanel ? 2.2 : sw}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
    if (isClosedPanel) {
      paths += `<path d="${mirrorClosed}" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="1.3" stroke-dasharray="5 3"/>`;
    }
  }
  if (l.stitchStyle === 'join') {
    paths += `<path d="${computedD}" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="2 7" stroke-linecap="round"/>`;
    if (computedMirrorD) {
      paths += `<path d="${computedMirrorD}" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="2 7" stroke-linecap="round"/>`;
    }
  }

  // CorelDRAW PowerClip: Fit drawn shapes cleanly inside the human garment silhouette
  const clipAttr = l.clipToBody !== false ? ' clip-path="url(#cp_torso_clip)"' : '';
  return {
    body: `<g${clipAttr}>${paths}</g>`,
    extraTransform: '',
    isWorldSpace: true,
  };
}

function layerSVG(l, defs, project, opts) {
  if (l.visible === false) return '';
  const layerType = l.type || l.kind || 'text';
  let out;
  if (layerType === 'art') out = artLayerSVG(l, defs);
  else if (layerType === 'image') out = imageLayerSVG(l, project);
  else if (layerType === 'path') out = pathLayerSVG(l);
  else out = textLayerSVG(l, defs);
  if (!out.body) return '';

  let filter = '';
  if (l.shadow?.on) {
    const id = `sh_${l.id}`;
    defs.add(`<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="${l.shadow.dx}" dy="${l.shadow.dy}" stdDeviation="${l.shadow.blur || 0}"
        flood-color="${l.shadow.color}" flood-opacity="${l.shadow.opacity}"/></filter>`);
    filter = ` filter="url(#${id})"`;
  }

  const sel = opts?.selected === l.id ? ' data-selected="1"' : '';
  if (out.isWorldSpace) {
    const dx = (l.x || 300) - 300;
    const dy = (l.y || 350) - 350;
    const sc = l.scale ?? 1;
    const sx = l.flipX ? -sc : sc;
    const t = `translate(${300 + dx} ${350 + dy}) rotate(${l.rotation || 0}) scale(${sx} ${sc}) translate(-300 -350)`;
    return `<g class="cp-layer" data-layer="${l.id}"${sel} transform="${t}" opacity="${l.opacity ?? 1}"${filter}>${out.body}</g>`;
  }

  const sc = l.scale ?? 1;
  const sx = l.flipX ? -sc : sc;
  const t = `translate(${l.x} ${l.y}) rotate(${l.rotation || 0}) scale(${sx} ${sc})${out.extraTransform}`;
  const hitBox = `<rect x="-75" y="-55" width="150" height="110" fill="transparent" style="cursor:move"/>`;
  return `<g class="cp-layer" data-layer="${l.id}"${sel} transform="${t}" opacity="${l.opacity ?? 1}"${filter}>${hitBox}${out.body}</g>`;
}

/* ------------------------------------------- anatomical human clothing pattern guide */

function fashionCroquisUnderlaySVG(view, sc, forceShow = false) {
  if (!forceShow) {
    if (!sc) return '';
    if (sc.showCroquis === false && sc.baseMode !== 'croquis' && sc.baseMode !== 'exploded') {
      return '';
    }
  }

  let rulerTicks = '';
  for (let y = 120; y <= 620; y += 50) {
    const cm = Math.round((y - 120) / 5);
    rulerTicks += `<line x1="22" y1="${y}" x2="34" y2="${y}" stroke="#94a3b8" stroke-width="1.2"/>
      <text x="38" y="${y + 3}" font-family="Inter, sans-serif" font-size="9" font-weight="600" fill="#64748b">${cm}cm</text>`;
  }

  return `<g class="cp-croquis-underlay" pointer-events="none">
    <line x1="22" y1="110" x2="22" y2="635" stroke="#cbd5e1" stroke-width="1.2"/>
    ${rulerTicks}

    <ellipse cx="300" cy="64" rx="18" ry="6" fill="#0f172a" opacity="0.85"/>
    <rect x="294" y="64" width="12" height="14" rx="2" fill="#334155"/>
    <path d="M 272 80 C 282 76, 318 76, 328 80 L 336 138 C 316 148, 284 148, 264 138 Z"
      fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
    <path d="M 268 108 Q 300 115 332 108" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3"/>

    <path d="M 264 138 L 196 164 C 180 172, 174 195, 184 228 C 192 252, 204 268, 206 292 C 210 336, 222 368, 224 392 C 212 435, 192 482, 192 535 C 192 572, 206 604, 220 622 L 380 622 C 394 604, 408 572, 408 535 C 408 482, 388 435, 376 392 C 378 368, 390 336, 394 292 C 396 268, 408 252, 416 228 C 426 195, 420 172, 404 164 L 336 138 Z"
      fill="#f8fafc" stroke="#94a3b8" stroke-width="1.4" stroke-dasharray="5 3" opacity="0.78"/>

    <rect x="295" y="622" width="10" height="58" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>
    <path d="M 245 680 Q 300 668 355 680" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>

    <!-- Center Grainline & Anatomical Fit Lines -->
    <line x1="300" y1="68" x2="300" y2="665" stroke="#0E6E55" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.65"/>
    <path d="M 174 138 L 426 138" stroke="#0E6E55" stroke-width="1" stroke-dasharray="3 3" opacity="0.55"/>
    <path d="M 174 138 Q 196 208 152 268" fill="none" stroke="#0284c7" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.6"/>
    <path d="M 426 138 Q 404 208 448 268" fill="none" stroke="#0284c7" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.6"/>
    <path d="M 152 265 L 448 265" stroke="#0284c7" stroke-width="1.1" stroke-dasharray="4 4" opacity="0.6"/>
    <path d="M 164 392 L 436 392" stroke="#0E6E55" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.75"/>
    <path d="M 152 525 L 448 525" stroke="#0284c7" stroke-width="1.1" stroke-dasharray="4 4" opacity="0.6"/>
    <path d="M 150 590 L 450 590" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3" opacity="0.55"/>

    ${
      view === 'front'
        ? `<circle cx="252" cy="265" r="5" fill="none" stroke="#0284c7" stroke-width="1" opacity="0.6"/>
           <circle cx="348" cy="265" r="5" fill="none" stroke="#0284c7" stroke-width="1" opacity="0.6"/>`
        : ''
    }

    <text x="434" y="141" font-family="Inter, sans-serif" font-size="8" font-weight="700" fill="#0E6E55" opacity="0.85">SHOULDER</text>
    <text x="454" y="268" font-family="Inter, sans-serif" font-size="8.5" font-weight="700" fill="#0284c7" opacity="0.85">BUST</text>
    <text x="442" y="395" font-family="Inter, sans-serif" font-size="8.5" font-weight="700" fill="#0E6E55" opacity="0.9">WAIST</text>
    <text x="454" y="528" font-family="Inter, sans-serif" font-size="8.5" font-weight="700" fill="#0284c7" opacity="0.85">HIP</text>
    <text x="456" y="593" font-family="Inter, sans-serif" font-size="8" font-weight="700" fill="#64748b" opacity="0.85">HEM</text>
  </g>`;
}

/* ------------------------------------------- modern denim wash / fade */

/**
 * Vintage stone-wash fade for denim legs: lifted thighs, knees & seat, darker outseams,
 * crotch and hem. Works on any user-picked color (light wash, mid blue, washed black…)
 * because it only blends white highlights / dark shadows over the zone color.
 */
function denimWashSVG(view, defs, clipD, uid) {
  defs.add(`<radialGradient id="dw_hi_${uid}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.42"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <radialGradient id="dw_lo_${uid}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#0B1220" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#0B1220" stop-opacity="0"/></radialGradient>
    <linearGradient id="dw_leg_${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0B1220" stop-opacity="0.28"/>
      <stop offset="0.22" stop-color="#0B1220" stop-opacity="0.04"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.06"/>
      <stop offset="0.78" stop-color="#0B1220" stop-opacity="0.04"/>
      <stop offset="1" stop-color="#0B1220" stop-opacity="0.28"/></linearGradient>
    <linearGradient id="dw_vert_${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0B1220" stop-opacity="0.12"/>
      <stop offset="0.25" stop-color="#0B1220" stop-opacity="0"/>
      <stop offset="0.86" stop-color="#0B1220" stop-opacity="0"/>
      <stop offset="1" stop-color="#0B1220" stop-opacity="0.2"/></linearGradient>`);
  if (clipD) defs.add(`<clipPath id="dw_clip_${uid}"><path d="${clipD}"/></clipPath>`);
  const clip = clipD ? ` clip-path="url(#dw_clip_${uid})"` : '';

  const highlights =
    view === 'back'
      ? `<ellipse cx="226" cy="300" rx="70" ry="58" fill="url(#dw_hi_${uid})"/>
         <ellipse cx="374" cy="300" rx="70" ry="58" fill="url(#dw_hi_${uid})"/>
         <ellipse cx="220" cy="470" rx="58" ry="120" fill="url(#dw_hi_${uid})" opacity="0.7"/>
         <ellipse cx="380" cy="470" rx="58" ry="120" fill="url(#dw_hi_${uid})" opacity="0.7"/>`
      : `<ellipse cx="222" cy="330" rx="62" ry="150" fill="url(#dw_hi_${uid})"/>
         <ellipse cx="378" cy="330" rx="62" ry="150" fill="url(#dw_hi_${uid})"/>
         <ellipse cx="218" cy="510" rx="52" ry="80" fill="url(#dw_hi_${uid})" opacity="0.75"/>
         <ellipse cx="382" cy="510" rx="52" ry="80" fill="url(#dw_hi_${uid})" opacity="0.75"/>`;

  return `<g pointer-events="none"${clip}>
    <rect x="138" y="182" width="162" height="482" fill="url(#dw_leg_${uid})"/>
    <rect x="300" y="182" width="162" height="482" fill="url(#dw_leg_${uid})"/>
    <rect x="130" y="150" width="340" height="514" fill="url(#dw_vert_${uid})"/>
    ${highlights}
    <ellipse cx="300" cy="352" rx="34" ry="46" fill="url(#dw_lo_${uid})"/>
  </g>`;
}

/* ------------------------------------------- sewing join threads overlay */

function sewingThreadsOverlaySVG(sc) {
  if (!sc) return '';
  const explodeVal = sc.baseMode === 'exploded' ? Math.max(65, Number(sc.explodeAmount) || 85) : Number(sc.explodeAmount) || 0;
  const hasUnjoinedCustomCuts =
    Array.isArray(sc.customCuts) && sc.customCuts.some((c) => c.joined === false);

  if (explodeVal <= 2 && !hasUnjoinedCustomCuts) return '';

  const k = explodeVal / 100;
  let threads = '';

  const drawJoinStitches = (x1a, y1a, x1b, y1b, x2a, y2a, x2b, y2b, steps = 6) => {
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ax = x1a + (x1b - x1a) * t;
      const ay = y1a + (y1b - y1a) * t;
      const bx = x2a + (x2b - x2a) * t;
      const by = y2a + (y2b - y2a) * t;
      d += `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)} `;
      threads += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2" fill="#10B981"/>`;
      threads += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="2" fill="#0284c7"/>`;
    }
    threads += `<path d="${d}" fill="none" stroke="#10B981" stroke-width="1.4" stroke-dasharray="3 2" opacity="0.9"/>`;
  };

  if (k > 0.05) {
    if (sc.sleeveType !== 'sleeveless') {
      drawJoinStitches(
        418, 148, 435, 255,
        418 + 42 * k, 148 - 14 * k, 435 + 42 * k, 255 - 14 * k,
        5
      );
      drawJoinStitches(
        182, 148, 165, 255,
        182 - 42 * k, 148 - 14 * k, 165 - 42 * k, 255 - 14 * k,
        5
      );
    }

    drawJoinStitches(
      248, 134, 352, 134,
      248, 134 - 30 * k, 352, 134 - 30 * k,
      5
    );

    const cutY = Number(sc.cutY) || 345;
    if (sc.cutSplitMode === 'center-split' || sc.baseMode === 'croquis') {
      drawJoinStitches(
        300 - 18 * k, 175, 300 - 18 * k, 560,
        300 + 22 * k, 175, 300 + 22 * k, 560,
        7
      );
    } else if (sc.cutSplitMode === 'colorblock-h' || sc.cutSplitMode === 'diagonal-sash') {
      drawJoinStitches(
        175, cutY, 425, cutY,
        175, cutY + 26 * k, 425, cutY + 26 * k,
        6
      );
    } else if (sc.cutSplitMode === 'princess') {
      drawJoinStitches(242 - 24 * k, 180, 244 - 24 * k, 550, 242, 180, 244, 550, 5);
      drawJoinStitches(358, 180, 356, 550, 358 + 24 * k, 180, 356 + 24 * k, 550, 5);
    }
  }

  if (Array.isArray(sc.customCuts)) {
    for (const cut of sc.customCuts) {
      if (cut.joined === false || k > 0.05) {
        const gap = cut.joined === false ? 14 : 22 * k;
        drawJoinStitches(
          cut.x1, cut.y1, cut.x2, cut.y2,
          cut.x1, cut.y1 + gap, cut.x2, cut.y2 + gap,
          5
        );
      }
    }
  }

  return `<g class="cp-sewing-threads" pointer-events="none">${threads}</g>`;
}

/* ---------------------------------------------------------------- shading */

function shadingSVG(g, view, defs, project) {
  if (!project.mockup?.shading) return '';
  const clipId = 'cp_shade';
  const zones = g.zones(view).filter((z) => !z.strokeOnly);
  defs.add(`<clipPath id="${clipId}">${zones.map((z) => `<path d="${z.d}"/>`).join('')}</clipPath>`);
  defs.add(`<linearGradient id="sg_side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.34"/>
      <stop offset="0.16" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="0.42" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="0.58" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="0.84" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.34"/></linearGradient>
    <linearGradient id="sg_vert" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.16"/>
      <stop offset="0.35" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.20"/></linearGradient>`);

  let tex = '';
  if (project.mockup?.texture && project.mockup.texture !== 'none') {
    const freq = project.mockup.texture === 'knit' ? '0.9' : project.mockup.texture === 'mesh' ? '0.35' : '1.4';
    defs.add(`<filter id="fx_tex" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="8" result="n"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer></filter>`);
    tex = `<rect width="${VB.w}" height="${VB.h}" filter="url(#fx_tex)" opacity="0.13" style="mix-blend-mode:overlay"/>`;
  }

  const wrinkles = `
    <g stroke="#000" fill="none" opacity="0.13" stroke-linecap="round">
      <path d="M 190 300 q 40 34 26 92" stroke-width="9"/>
      <path d="M 412 300 q -40 34 -26 92" stroke-width="9"/>
      <path d="M 236 470 q 62 26 130 6" stroke-width="7"/>
      <path d="M 250 540 q 50 22 108 4" stroke-width="6"/>
    </g>
    <g stroke="#fff" fill="none" opacity="0.10" stroke-linecap="round">
      <path d="M 214 318 q 36 30 24 84" stroke-width="6"/>
      <path d="M 388 318 q -36 30 -24 84" stroke-width="6"/>
    </g>`;

  return `<g clip-path="url(#${clipId})" pointer-events="none">
    <rect width="${VB.w}" height="${VB.h}" fill="url(#sg_side)" style="mix-blend-mode:soft-light"/>
    <rect width="${VB.w}" height="${VB.h}" fill="url(#sg_vert)" style="mix-blend-mode:soft-light"/>
    ${wrinkles}${tex}</g>`;
}

/* ------------------------------------------------------------------ guides */

function guidesSVG(g, view) {
  const areas = g.areas(view) || [];
  return `<g class="cp-guides" pointer-events="none">${areas
    .map(
      (a) => `<g transform="translate(${a.x + a.w / 2} ${a.y + a.h / 2}) rotate(${a.rotate || 0})">
        <rect x="${-a.w / 2}" y="${-a.h / 2}" width="${a.w}" height="${a.h}" fill="none"
          stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 6" opacity="0.9"/>
        <text x="0" y="${-a.h / 2 - 8}" text-anchor="middle" font-family="Inter, sans-serif"
          font-size="14" fill="#38bdf8">${esc(a.label)}</text></g>`
    )
    .join('')}</g>`;
}

/* ------------------------------------------------------------------- main */

export function renderSVG(project, opts = {}) {
  const view = opts.view || project.view;
  const sc = project.scratchConfig;
  const isScratch = project.garment === 'custom-scratch';
  const isWireframe = Boolean(opts.wireframe || project.wireframe);
  const g = getGarment(project.garment, sc);
  const defs = new Defs();
  const zones = g.zones(view);

  const mainBodyZone = zones.find((z) => z.id === 'body');
  if (mainBodyZone?.d) {
    const bodyPt = project.pieceTransforms?.body;
    const bodyBounds = computeZoneBounds(mainBodyZone);
    let bodyClipTransform = '';
    if (bodyPt && (bodyPt.dx || bodyPt.dy || (bodyPt.scaleX && bodyPt.scaleX !== 1) || (bodyPt.scaleY && bodyPt.scaleY !== 1) || bodyPt.rotation)) {
      const sx = bodyPt.scaleX ?? 1;
      const sy = bodyPt.scaleY ?? 1;
      bodyClipTransform = ` transform="translate(${(bodyBounds.cx + (bodyPt.dx || 0)).toFixed(1)} ${(bodyBounds.cy + (bodyPt.dy || 0)).toFixed(1)}) rotate(${(bodyPt.rotation || 0).toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-bodyBounds.cx.toFixed(1)} ${-bodyBounds.cy.toFixed(1)})"`;
    }
    defs.add(`<clipPath id="cp_torso_clip"><path d="${mainBodyZone.d}"${bodyClipTransform}/></clipPath>`);
  }

  const rawExplode =
    isScratch && sc
      ? sc.baseMode === 'exploded'
        ? Math.max(65, Number(sc.explodeAmount) || 85)
        : Number(sc.explodeAmount) || 0
      : 0;
  const explodeFactor = rawExplode / 100;

  let body = '';

  for (const z of zones) {
    const p = project.zones[z.id] || { style: 'solid', colors: ['#062D24'] };
    const fill = isWireframe ? 'rgba(56, 189, 248, 0.08)' : defs.paint(p);
    const bounds = computeZoneBounds(z);

    // Combine Exploded Flat Sloper offset + CorelDRAW Per-Piece Transform (dx, dy, scaleX, scaleY, rotation)
    const pt = project.pieceTransforms?.[z.id] || {};
    const unjoinedCutOffset =
      z.cutMeta && z.cutMeta.joined === false ? { dx: 0, dy: 12, rot: 0 } : null;

    const expDx = (z.explodeOffset?.dx || 0) * explodeFactor + (unjoinedCutOffset?.dx || 0);
    const expDy = (z.explodeOffset?.dy || 0) * explodeFactor + (unjoinedCutOffset?.dy || 0);
    const expRot = (z.explodeOffset?.rot || 0) * explodeFactor + (unjoinedCutOffset?.rot || 0);

    const totalDx = expDx + (Number(pt.dx) || 0);
    const totalDy = expDy + (Number(pt.dy) || 0);
    const totalRot = expRot + (Number(pt.rotation) || 0);
    const sx = Number(pt.scaleX) || 1;
    const sy = Number(pt.scaleY) || 1;

    const hasTransform =
      Math.abs(totalDx) > 0.1 ||
      Math.abs(totalDy) > 0.1 ||
      Math.abs(totalRot) > 0.1 ||
      Math.abs(sx - 1) > 0.005 ||
      Math.abs(sy - 1) > 0.005;

    const pieceTransform = hasTransform
      ? ` transform="translate(${(bounds.cx + totalDx).toFixed(1)} ${(bounds.cy + totalDy).toFixed(1)}) rotate(${totalRot.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-bounds.cx.toFixed(1)} ${-bounds.cy.toFixed(1)})"`
      : '';

    const clipAttr =
      z.clipToBody && mainBodyZone?.d && explodeFactor <= 0.05 && !hasTransform
        ? ' clip-path="url(#cp_torso_clip)"'
        : '';

    const outlineStroke = pt.outlineColor || (isWireframe ? '#0284c7' : 'rgba(0,0,0,0.28)');
    const outlineWidth = pt.outlineColor ? '2.4' : isWireframe ? '1.8' : '1.6';

    let zoneChunk = '';
    if (z.strokeOnly) {
      zoneChunk += `<path d="${z.d}" fill="none" stroke="${fill}" stroke-width="${z.width || 5}"
        stroke-linecap="round" stroke-linejoin="round" data-zone="${z.id}" class="cp-zone"${z.dash ? ` stroke-dasharray="${z.dash}"` : ''}/>`;
    } else {
      // CorelDRAW Contour / Seam Allowance Offset when exploded or enabled on piece
      if (explodeFactor > 0.05 || pt.contourOffset) {
        zoneChunk += `<path d="${z.d}" fill="none" stroke="#38bdf8" stroke-width="5.5" stroke-dasharray="6 4" opacity="0.68"${clipAttr}/>`;
      }
      zoneChunk += `<path d="${z.d}" fill="${fill}" data-zone="${z.id}" class="cp-zone" style="cursor:pointer"${clipAttr}/>`;
      if (z.wash && !isWireframe) {
        zoneChunk += denimWashSVG(z.wash, defs, z.d, `${z.id}_${view}`);
      }
      zoneChunk += `<path d="${z.d}" fill="none" stroke="${outlineStroke}" stroke-width="${outlineWidth}" pointer-events="none"${clipAttr}/>`;
    }

    if (z.stitch) {
      const stitchStroke = isWireframe
        ? '#0284c7'
        : z.stitchColor || 'rgba(255,255,255,0.42)';
      zoneChunk += `<path d="${z.stitch}" fill="none" stroke="${stitchStroke}" stroke-width="${z.stitchColor ? 1.8 : 1.5}" stroke-dasharray="${z.stitchColor ? '4 2.5' : '5 4'}" pointer-events="none"${clipAttr}/>`;
    }

    if (z.seamLine) {
      const isJoined = !z.cutMeta || z.cutMeta.joined !== false;
      if (isJoined && explodeFactor <= 0.05) {
        zoneChunk += `<path d="${z.seamLine}" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2" stroke-dasharray="6 4" pointer-events="none"${clipAttr}/>`;
        zoneChunk += `<path d="${z.seamLine}" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="1" pointer-events="none"${clipAttr}/>`;
      } else {
        zoneChunk += `<path d="${z.seamLine}" fill="none" stroke="#10B981" stroke-width="2.5" stroke-dasharray="4 3" pointer-events="none"${clipAttr}/>`;
      }
    }

    if (z.rivets) {
      zoneChunk += z.rivets
        .map(
          (r) =>
            `<circle cx="${r.x}" cy="${r.y}" r="${r.r || 3.4}" fill="#B87333" stroke="#6B3F1D" stroke-width="0.8" pointer-events="none"/><circle cx="${r.x}" cy="${r.y}" r="${(r.r || 3.4) * 0.35}" fill="#F3D3A0" pointer-events="none"/>`
        )
        .join('');
    }

    if (z.buttons) {
      zoneChunk += z.buttons
        .map(
          (b) =>
            `<circle cx="${b.x}" cy="${b.y}" r="5.5" fill="${b.color || 'rgba(255,255,255,0.85)'}" stroke="rgba(0,0,0,0.45)" stroke-width="1.2" pointer-events="none"/>${
              b.color
                ? `<circle cx="${b.x}" cy="${b.y}" r="2.2" fill="#FDE68A" pointer-events="none"/>`
                : ''
            }`
        )
        .join('');
    }

    // Attach transformed bounding box metadata for CorelDRAW 8-handle selection box
    const bboxStr = `${(bounds.x + totalDx - (bounds.w * (sx - 1)) / 2).toFixed(1)},${(bounds.y + totalDy - (bounds.h * (sy - 1)) / 2).toFixed(1)},${(bounds.w * sx).toFixed(1)},${(bounds.h * sy).toFixed(1)},${(bounds.cx + totalDx).toFixed(1)},${(bounds.cy + totalDy).toFixed(1)},${totalRot.toFixed(1)}`;
    body += `<g class="cp-piece-group" data-piece="${z.id}" data-bbox="${bboxStr}"${pieceTransform}>${zoneChunk}</g>`;
  }

  const croquisUnderlay =
    isScratch || opts.patternGuide
      ? fashionCroquisUnderlaySVG(view, sc, Boolean(opts.patternGuide))
      : '';
  const sewingThreads = isScratch ? sewingThreadsOverlaySVG(sc) : '';
  const layers = (project.layers[view] || []).map((l) => layerSVG(l, defs, project, opts)).join('');
  const shade = isWireframe ? '' : shadingSVG(g, view, defs, project);
  const wantGuides = opts.guides ?? project.mockup?.showAreas;
  const guides = wantGuides ? guidesSVG(g, view) : '';

  const bg = opts.background || '';
  const w = opts.width ? ` width="${opts.width}"` : '';
  const h = opts.height ? ` height="${opts.height}"` : '';

  return `<svg xmlns="http://www.w3.org/1999/xlink" xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 ${VB.w} ${VB.h}"${w}${h} class="cp-svg">
<defs>${defs}${opts.extraDefs || ''}</defs>
${bg}
${croquisUnderlay}
<g class="cp-garment">${body}</g>
${sewingThreads}
<g class="cp-decor">${layers}</g>
${shade}
${guides}
</svg>`.replace('xmlns="http://www.w3.org/1999/xlink"', 'xmlns="http://www.w3.org/2000/svg"');
}

/**
 * Renders a 1:1 3D UV fabric texture map aligned directly to the 3D torso/bottoms UV space,
 * including every 2D torso zone, cut panel, hemBand, pocket, placket, zipper, seam line, and artwork layer.
 */
export function render3DTextureSVG(project, opts = {}) {
  const view = opts.view || project.view || 'front';
  const g = getGarment(project.garment, project.scratchConfig);
  const defs = new Defs();
  const zones = g.zones(view);

  const mainBodyZone = zones.find((z) => z.id === 'body');
  if (mainBodyZone?.d) {
    defs.add(`<clipPath id="cp_torso_clip"><path d="${mainBodyZone.d}"/></clipPath>`);
  }

  const bodyZonePaint = project.zones?.body || { style: 'solid', colors: ['#062D24'] };
  const baseFill = defs.paint(bodyZonePaint);

  // External 3D sleeve/hood meshes have their own dedicated 3D PBR materials (`mat_sleeve_l`, `mat_sleeve_r`, `mat_cuff_l`, `mat_cuff_r`, `mat_hood`).
  // Every other 2D zone belongs on the torso/legs texture so 100% of 2D color changes appear on the 3D model.
  const externalMeshZoneIds = new Set([
    'body',
    'sleeveL',
    'sleeveR',
    'cuffL',
    'cuffR',
    'sleeveStripe',
    'hood',
  ]);
  // Bottoms render their drawcord as real 3D tube geometry (`mat_drawstring`)
  if (g.kind === 'bottom') externalMeshZoneIds.add('drawstring');

  let accentPaths = '';
  for (const z of zones) {
    if (!z || !z.id || externalMeshZoneIds.has(z.id)) continue;
    const p = project.zones[z.id];
    if (!p) continue;
    const fill = defs.paint(p);
    const bounds = computeZoneBounds(z);
    const pt = project.pieceTransforms?.[z.id] || {};
    const dx = Number(pt.dx) || 0;
    const dy = Number(pt.dy) || 0;
    const rot = Number(pt.rotation) || 0;
    const sx = Number(pt.scaleX) || 1;
    const sy = Number(pt.scaleY) || 1;
    const tAttr =
      dx || dy || rot || sx !== 1 || sy !== 1
        ? ` transform="translate(${(bounds.cx + dx).toFixed(1)} ${(bounds.cy + dy).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-bounds.cx.toFixed(1)} ${-bounds.cy.toFixed(1)})"`
        : '';

    const strokeAttr = pt.outlineColor
      ? ` stroke="${esc(pt.outlineColor)}" stroke-width="3"`
      : '';

    if (z.strokeOnly) {
      const dashAttr = z.dash ? ` stroke-dasharray="${esc(z.dash)}"` : '';
      accentPaths += `<path d="${z.d}" fill="none" stroke="${fill}" stroke-width="${z.width || 6}" stroke-linecap="round"${dashAttr}${tAttr}/>`;
    } else {
      accentPaths += `<path d="${z.d}" fill="${fill}"${strokeAttr}${tAttr}/>`;
    }
    if (z.stitch) {
      const stitchStroke = z.stitchColor || 'rgba(255,255,255,0.45)';
      accentPaths += `<path d="${z.stitch}" fill="none" stroke="${stitchStroke}" stroke-width="${z.stitchColor ? 2.2 : 1.8}" stroke-dasharray="${z.stitchColor ? '4 2.5' : '5 4'}"${tAttr}/>`;
    }
    if (z.seamLine) {
      accentPaths += `<path d="${z.seamLine}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-dasharray="6 4"${tAttr}/>`;
    }
    if (z.rivets) {
      accentPaths += z.rivets
        .map(
          (r) =>
            `<circle cx="${r.x}" cy="${r.y}" r="${(r.r || 3.4) * 1.1}" fill="#B87333" stroke="#6B3F1D" stroke-width="0.9"/><circle cx="${r.x}" cy="${r.y}" r="${(r.r || 3.4) * 0.4}" fill="#F3D3A0"/>`
        )
        .join('');
    }
    if (z.buttons) {
      accentPaths += z.buttons
        .map(
          (b) =>
            `<circle cx="${b.x}" cy="${b.y}" r="5.8" fill="${b.color || 'rgba(255,255,255,0.9)'}" stroke="rgba(0,0,0,0.45)" stroke-width="1.2"/>${
              b.color ? `<circle cx="${b.x}" cy="${b.y}" r="2.3" fill="#FDE68A"/>` : ''
            }`
        )
        .join('');
    }
  }

  // Also include mainBodyZone topstitching (e.g. denim jeans outseam/inseam stitch), wash fade and outlineColor
  if (mainBodyZone?.wash) {
    // Unclipped in 3D so the fade wraps fully around the planar-projected legs
    accentPaths = denimWashSVG(mainBodyZone.wash, defs, null, `3d_${view}`) + accentPaths;
  }
  if (mainBodyZone?.stitch) {
    const bodyStitchStroke = mainBodyZone.stitchColor || 'rgba(255,255,255,0.45)';
    accentPaths =
      `<path d="${mainBodyZone.stitch}" fill="none" stroke="${bodyStitchStroke}" stroke-width="${mainBodyZone.stitchColor ? 2.2 : 1.8}" stroke-dasharray="${mainBodyZone.stitchColor ? '4 2.5' : '5 4'}"/>` +
      accentPaths;
  }
  const bodyPt = project.pieceTransforms?.body;
  if (bodyPt?.outlineColor && mainBodyZone?.d) {
    accentPaths += `<path d="${mainBodyZone.d}" fill="none" stroke="${esc(bodyPt.outlineColor)}" stroke-width="5"/>`;
  }

  const layers = (project.layers?.[view] || []).map((l) => layerSVG(l, defs, project, {})).join('');
  const isBottom = g.kind === 'bottom';
  const vb = isBottom ? '115 145 370 525' : '125 120 350 488';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="${vb}" width="1024" height="1024" preserveAspectRatio="none">
<defs>${defs}</defs>
<rect x="0" y="0" width="600" height="750" fill="${baseFill}"/>
<g>${accentPaths}</g>
<g>${layers}</g>
</svg>`;
}

export function renderArtworkSVG(project, view, opts = {}) {
  const defs = new Defs();
  const layers = (project.layers[view] || []).map((l) => layerSVG(l, defs, project, {})).join('');
  const box = opts.box || { x: 0, y: 0, w: VB.w, h: VB.h };
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="${box.x} ${box.y} ${box.w} ${box.h}">
<defs>${defs}</defs>
<g class="cp-decor">${layers}</g>
</svg>`;
}

export function layerBounds(l, project) {
  let w = 100;
  let h = 100;
  const layerType = l.type || l.kind || 'text';
  if (layerType === 'art') {
    w = l.size || 130;
    h = l.size || 130;
  } else if (layerType === 'image') {
    const a = (project.assets || []).find((x) => x.id === l.assetId);
    const ratio = a && a.w ? a.h / a.w : 1;
    w = l.size || 160;
    h = w * ratio;
  } else {
    const lines = String(l.text ?? '').split('\n');
    w = Math.max(...lines.map((ln) => measureText(ln, l.font, l.size || 60, l.tracking || 0)), 10);
    h = (l.size || 60) * (lines.length * (l.lineHeight || 1.05));
    if (['arch', 'arch-down'].includes(l.arc)) h += (l.arcAmount || 30) * 0.9;
  }
  const s = l.scale ?? 1;
  return { w: w * s, h: h * s, x: l.x, y: l.y };
}

export { esc as escapeXML };
