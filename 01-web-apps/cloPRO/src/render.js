/* cloPRO — project -> SVG.
 * The same function feeds the live canvas, the thumbnails and every export,
 * so what you see is exactly what ships.
 */

import { getGarment, VB } from './data/garments.js';
import { buildPaint } from './data/patterns.js';
import { buildArt } from './data/graphics.js';
import { fontCss } from './data/library.js';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ------------------------------------------------------------- measuring */

let mctx = null;
export function measureText(text, font, size, tracking = 0) {
  if (!mctx) {
    const c = document.createElement('canvas');
    c.width = c.height = 8;
    mctx = c.getContext('2d');
  }
  mctx.font = `${size}px ${fontCss(font)}`;
  const base = mctx.measureText(text || '').width;
  return base + Math.max(0, (String(text || '').length - 1)) * tracking;
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
    const uid = `pf${this.n++}`;
    const built = buildPaint(uid, p);
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
  const fill = defs.paint(l.fill);
  const outlines = (l.outlines || []).slice().sort((a, b) => b.width - a.width);
  const skew = l.arc === 'slant-up' ? -8 : l.arc === 'slant-down' ? 8 : 0;
  const attrs = `font-family="${esc(font)}" font-size="${size}" letter-spacing="${l.tracking || 0}"
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
  const parts = buildArt(l.art, l.artParams);
  const size = l.size || 180;
  const k = size / 200;
  const fills = {};
  for (const role of ['primary', 'secondary', 'accent']) {
    fills[role] = defs.paint(l.roleFills?.[role] || { style: 'solid', colors: ['#ffffff'] });
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
  if (!asset) return { body: '', extraTransform: '' };
  const ratio = asset.h && asset.w ? asset.h / asset.w : 1;
  const w = l.size || 200;
  const h = w * ratio;
  return {
    body: `<image href="${asset.src}" xlink:href="${asset.src}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`,
    extraTransform: '',
  };
}

function layerSVG(l, defs, project, opts) {
  if (l.visible === false) return '';
  let out;
  if (l.type === 'art') out = artLayerSVG(l, defs);
  else if (l.type === 'image') out = imageLayerSVG(l, project);
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

  const t = `translate(${l.x} ${l.y}) rotate(${l.rotation || 0}) scale(${l.scale ?? 1})${out.extraTransform}`;
  const sel = opts?.selected === l.id ? ' data-selected="1"' : '';
  return `<g class="cp-layer" data-layer="${l.id}"${sel} transform="${t}" opacity="${l.opacity ?? 1}"${filter}>${out.body}</g>`;
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
  const g = getGarment(project.garment);
  const defs = new Defs();
  const zones = g.zones(view);

  let body = '';
  for (const z of zones) {
    const p = project.zones[z.id] || { style: 'solid', colors: ['#cccccc'] };
    const fill = defs.paint(p);
    if (z.strokeOnly) {
      body += `<path d="${z.d}" fill="none" stroke="${fill}" stroke-width="${z.width || 5}"
        stroke-linecap="round" stroke-linejoin="round"${z.dash ? ` stroke-dasharray="${z.dash}"` : ''}/>`;
    } else {
      body += `<path d="${z.d}" fill="${fill}" data-zone="${z.id}" class="cp-zone"/>`;
    }
    if (z.stitch) {
      body += `<path d="${z.stitch}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    }
    if (z.buttons) {
      body += z.buttons
        .map((b) => `<circle cx="${b.x}" cy="${b.y}" r="5" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>`)
        .join('');
    }
  }

  // seam outline for definition
  const outline = zones
    .filter((z) => !z.strokeOnly)
    .map((z) => `<path d="${z.d}" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.6"/>`)
    .join('');

  const layers = (project.layers[view] || []).map((l) => layerSVG(l, defs, project, opts)).join('');
  const shade = shadingSVG(g, view, defs, project);
  const wantGuides = opts.guides ?? project.mockup?.showAreas;
  const guides = wantGuides ? guidesSVG(g, view) : '';

  const bg = opts.background || '';
  const w = opts.width ? ` width="${opts.width}"` : '';
  const h = opts.height ? ` height="${opts.height}"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 ${VB.w} ${VB.h}"${w}${h} class="cp-svg">
<defs>${defs}${opts.extraDefs || ''}</defs>
${bg}
<g class="cp-garment">${body}${outline}</g>
<g class="cp-decor">${layers}</g>
${shade}
${guides}
</svg>`;
}

/* Artwork-only render: decorations on transparent ground, for print files. */
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

/* Bounding box of a layer in canvas units (approximate but good enough for
   print-area checks and marquee handles). */
export function layerBounds(l, project) {
  let w = 100;
  let h = 100;
  if (l.type === 'art') {
    w = l.size || 180;
    h = l.size || 180;
  } else if (l.type === 'image') {
    const a = (project.assets || []).find((x) => x.id === l.assetId);
    const ratio = a && a.w ? a.h / a.w : 1;
    w = l.size || 200;
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
