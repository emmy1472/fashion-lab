/* cloPRO — Forge: a layered raster editor for logos, badges and artwork.
 * Layers are individual canvases composited onto the visible canvas, so blend
 * modes, opacity and non-destructive reordering all behave like you expect.
 */

import { el, $, $$, clear, toast, pickFile, readImage, openModal, closeModal } from './common.js';
import { FONTS, fontCss, PALETTES } from '../data/library.js';
import { allArt, buildArt } from '../data/graphics.js';
import { addAsset, addLayer, newImageLayer, project, uid, emit, on } from '../state.js';

const BLENDS = ['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion',
  'hue', 'saturation', 'color', 'luminosity'];

const TOOLS = [
  { id: 'move', icon: '✥', name: 'Move layer' },
  { id: 'select', icon: '▭', name: 'Rectangular select' },
  { id: 'brush', icon: '🖌', name: 'Brush' },
  { id: 'eraser', icon: '🧽', name: 'Eraser' },
  { id: 'fill', icon: '🪣', name: 'Paint bucket' },
  { id: 'gradient', icon: '◨', name: 'Gradient' },
  { id: 'picker', icon: '💧', name: 'Eyedropper' },
  { sep: true },
  { id: 'line', icon: '╱', name: 'Line' },
  { id: 'rect', icon: '■', name: 'Rectangle' },
  { id: 'ellipse', icon: '●', name: 'Ellipse' },
  { id: 'poly', icon: '★', name: 'Polygon / star' },
  { id: 'text', icon: 'T', name: 'Text' },
];

export const forge = {
  w: 900,
  h: 900,
  layers: [],
  active: 0,
  tool: 'brush',
  zoom: 1,
  fit: 1,
  selection: null,
  history: [],
  future: [],
  opts: {
    size: 28, color: '#4ea1ff', color2: '#0b1120', opacity: 1, hardness: 80,
    tolerance: 32, font: 'Anton', fontSize: 120, text: 'CLUB',
    fill: true, stroke: false, strokeWidth: 6, points: 5, inner: 42,
    gradient: 'linear', antialias: true,
  },
};

let canvas, ctx, overlay, octx, host;
let drawing = null;

/* ---------------------------------------------------------------- layers */

function makeLayer(name = 'Layer') {
  const c = document.createElement('canvas');
  c.width = forge.w;
  c.height = forge.h;
  return { id: uid('fl'), name, canvas: c, ctx: c.getContext('2d', { willReadFrequently: true }), visible: true, opacity: 1, blend: 'source-over', locked: false };
}

export function activeLayer() {
  return forge.layers[forge.active] || null;
}

function resizeAll(w, h, keep = true) {
  for (const l of forge.layers) {
    const old = l.canvas;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d', { willReadFrequently: true });
    if (keep) cx.drawImage(old, 0, 0);
    l.canvas = c;
    l.ctx = cx;
  }
  forge.w = w; forge.h = h;
  canvas.width = w; canvas.height = h;
  overlay.width = w; overlay.height = h;
  fitCanvas();
  compose();
}

/* --------------------------------------------------------------- history */

const HISTORY_CAP = 22;

function snapshotStack() {
  return forge.layers.map((l) => ({
    id: l.id, name: l.name, visible: l.visible, opacity: l.opacity, blend: l.blend, locked: l.locked,
    data: l.canvas.toDataURL('image/png'),
  }));
}

export function pushPixels(layer) {
  if (!layer) return;
  forge.history.push({ type: 'pixels', id: layer.id, data: layer.ctx.getImageData(0, 0, forge.w, forge.h) });
  trimHistory();
}

export function pushStack() {
  forge.history.push({ type: 'stack', data: snapshotStack() });
  trimHistory();
}

function trimHistory() {
  while (forge.history.length > HISTORY_CAP) forge.history.shift();
  forge.future.length = 0;
}

async function applyEntry(entry) {
  if (entry.type === 'pixels') {
    const l = forge.layers.find((x) => x.id === entry.id);
    if (!l) return null;
    const redo = { type: 'pixels', id: l.id, data: l.ctx.getImageData(0, 0, forge.w, forge.h) };
    l.ctx.putImageData(entry.data, 0, 0);
    return redo;
  }
  const redo = { type: 'stack', data: snapshotStack() };
  const restored = [];
  for (const s of entry.data) {
    const l = makeLayer(s.name);
    Object.assign(l, { id: s.id, visible: s.visible, opacity: s.opacity, blend: s.blend, locked: s.locked });
    await new Promise((res) => {
      const img = new Image();
      img.onload = () => { l.ctx.drawImage(img, 0, 0); res(); };
      img.onerror = res;
      img.src = s.data;
    });
    restored.push(l);
  }
  forge.layers = restored;
  forge.active = Math.min(forge.active, forge.layers.length - 1);
  return redo;
}

export async function forgeUndo() {
  const entry = forge.history.pop();
  if (!entry) return toast('Nothing to undo');
  const redo = await applyEntry(entry);
  if (redo) forge.future.push(redo);
  compose(); renderLayersPanel();
}

export async function forgeRedo() {
  const entry = forge.future.pop();
  if (!entry) return toast('Nothing to redo');
  const undo = await applyEntry(entry);
  if (undo) forge.history.push(undo);
  compose(); renderLayersPanel();
}

/* --------------------------------------------------------------- compose */

export function compose() {
  ctx.clearRect(0, 0, forge.w, forge.h);
  for (const l of forge.layers) {
    if (!l.visible) continue;
    ctx.globalAlpha = l.opacity;
    ctx.globalCompositeOperation = l.blend;
    ctx.drawImage(l.canvas, 0, 0);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  drawOverlay();
}

function drawOverlay() {
  octx.clearRect(0, 0, forge.w, forge.h);
  if (forge.selection) {
    const s = forge.selection;
    octx.save();
    octx.strokeStyle = '#4ea1ff';
    octx.lineWidth = 2 / (forge.fit * forge.zoom);
    octx.setLineDash([7 / (forge.fit * forge.zoom), 5 / (forge.fit * forge.zoom)]);
    octx.strokeRect(s.x, s.y, s.w, s.h);
    octx.restore();
  }
}

/* ------------------------------------------------------------- geometry */

function pos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * forge.w,
    y: ((e.clientY - r.top) / r.height) * forge.h,
  };
}

function clipToSelection(c) {
  if (!forge.selection) return;
  c.beginPath();
  c.rect(forge.selection.x, forge.selection.y, forge.selection.w, forge.selection.h);
  c.clip();
}

/* ---------------------------------------------------------------- brush */

function stamp(c, x, y) {
  const o = forge.opts;
  const r = o.size / 2;
  const hard = o.hardness / 100;
  if (hard >= 0.99) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    return;
  }
  const g = c.createRadialGradient(x, y, r * hard * 0.9, x, y, r);
  const col = c.fillStyle;
  g.addColorStop(0, col);
  g.addColorStop(1, `${col}00`.length === 9 ? `${col}00` : col);
  c.save();
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function strokeSegment(c, from, to) {
  const o = forge.opts;
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const step = Math.max(1, o.size * 0.16);
  const n = Math.max(1, Math.ceil(dist / step));
  for (let i = 0; i <= n; i++) {
    stamp(c, from.x + ((to.x - from.x) * i) / n, from.y + ((to.y - from.y) * i) / n);
  }
}

/* ------------------------------------------------------------ flood fill */

function floodFill(layer, sx, sy, hex, tolerance) {
  const w = forge.w, h = forge.h;
  const img = layer.ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const at = (x, y) => (y * w + x) * 4;
  const start = at(Math.floor(sx), Math.floor(sy));
  const target = [d[start], d[start + 1], d[start + 2], d[start + 3]];
  const rgb = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
  if (target.every((v, i) => v === rgb[i])) return;
  const tol = tolerance * tolerance * 4;
  const match = (i) =>
    (d[i] - target[0]) ** 2 + (d[i + 1] - target[1]) ** 2 + (d[i + 2] - target[2]) ** 2 + (d[i + 3] - target[3]) ** 2 <= tol;

  const stack = [[Math.floor(sx), Math.floor(sy)]];
  const seen = new Uint8Array(w * h);
  const sel = forge.selection;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    if (sel && (x < sel.x || y < sel.y || x > sel.x + sel.w || y > sel.y + sel.h)) continue;
    const k = y * w + x;
    if (seen[k]) continue;
    const i = k * 4;
    if (!match(i)) continue;
    seen[k] = 1;
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  layer.ctx.putImageData(img, 0, 0);
}

/* --------------------------------------------------------------- shapes */

function polyPoints(cx, cy, r, n, inner, star) {
  const pts = [];
  const total = star ? n * 2 : n;
  for (let i = 0; i < total; i++) {
    const a = (Math.PI * 2 * i) / total - Math.PI / 2;
    const rr = star && i % 2 ? r * inner : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}

function drawShape(c, kind, a, b, preview) {
  const o = forge.opts;
  c.save();
  clipToSelection(c);
  c.globalAlpha = o.opacity;
  c.fillStyle = o.color;
  c.strokeStyle = o.color2;
  c.lineWidth = o.strokeWidth;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  if (preview) { c.globalAlpha = 0.75; }

  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);

  c.beginPath();
  if (kind === 'line') {
    c.moveTo(a.x, a.y); c.lineTo(b.x, b.y);
    c.strokeStyle = o.color;
    c.lineWidth = o.size;
    c.stroke();
    c.restore();
    return;
  }
  if (kind === 'rect') c.rect(x, y, w, h);
  else if (kind === 'ellipse') c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (kind === 'poly') {
    const r = Math.hypot(b.x - a.x, b.y - a.y);
    const pts = polyPoints(a.x, a.y, r, o.points, o.inner / 100, o.points >= 3 && o.starMode !== false);
    pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
    c.closePath();
  }
  if (o.fill) c.fill();
  if (o.stroke) c.stroke();
  c.restore();
}

/* --------------------------------------------------------------- pointer */

function onDown(e) {
  const layer = activeLayer();
  if (!layer || layer.locked) { toast('Layer is locked'); return; }
  const p = pos(e);
  const t = forge.tool;
  const o = forge.opts;
  canvas.setPointerCapture(e.pointerId);

  if (t === 'picker') {
    const d = ctx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
    o.color = `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    renderOptions();
    toast(`Picked ${o.color}`);
    return;
  }

  if (t === 'text') {
    pushPixels(layer);
    const c = layer.ctx;
    c.save();
    clipToSelection(c);
    c.globalAlpha = o.opacity;
    c.fillStyle = o.color;
    c.strokeStyle = o.color2;
    c.lineWidth = o.strokeWidth;
    c.font = `${o.fontSize}px ${fontCss(o.font)}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    if (o.stroke) { c.lineJoin = 'round'; c.strokeText(o.text, p.x, p.y); }
    if (o.fill) c.fillText(o.text, p.x, p.y);
    c.restore();
    compose(); renderLayersPanel();
    return;
  }

  if (t === 'fill') {
    pushPixels(layer);
    floodFill(layer, p.x, p.y, o.color, o.tolerance);
    compose(); renderLayersPanel();
    return;
  }

  if (t === 'brush' || t === 'eraser') {
    pushPixels(layer);
    const c = layer.ctx;
    c.save();
    clipToSelection(c);
    c.globalAlpha = o.opacity;
    c.globalCompositeOperation = t === 'eraser' ? 'destination-out' : 'source-over';
    c.fillStyle = t === 'eraser' ? '#000000' : o.color;
    stamp(c, p.x, p.y);
    drawing = { kind: t, last: p, c };
    compose();
    return;
  }

  if (t === 'move') {
    pushPixels(layer);
    drawing = { kind: 'move', start: p, snapshot: layer.ctx.getImageData(0, 0, forge.w, forge.h) };
    return;
  }

  if (t === 'select') {
    drawing = { kind: 'select', start: p };
    return;
  }

  if (t === 'gradient') {
    pushPixels(layer);
    drawing = { kind: 'gradient', start: p };
    return;
  }

  pushPixels(layer);
  drawing = { kind: 'shape', shape: t, start: p, before: layer.ctx.getImageData(0, 0, forge.w, forge.h) };
}

function onMove(e) {
  if (!drawing) return;
  const p = pos(e);
  const layer = activeLayer();

  if (drawing.kind === 'brush' || drawing.kind === 'eraser') {
    strokeSegment(drawing.c, drawing.last, p);
    drawing.last = p;
    compose();
    return;
  }
  if (drawing.kind === 'move') {
    layer.ctx.clearRect(0, 0, forge.w, forge.h);
    const tmp = document.createElement('canvas');
    tmp.width = forge.w; tmp.height = forge.h;
    tmp.getContext('2d').putImageData(drawing.snapshot, 0, 0);
    layer.ctx.drawImage(tmp, Math.round(p.x - drawing.start.x), Math.round(p.y - drawing.start.y));
    compose();
    return;
  }
  if (drawing.kind === 'select') {
    forge.selection = {
      x: Math.min(drawing.start.x, p.x), y: Math.min(drawing.start.y, p.y),
      w: Math.abs(p.x - drawing.start.x), h: Math.abs(p.y - drawing.start.y),
    };
    drawOverlay();
    return;
  }
  if (drawing.kind === 'gradient') {
    octx.clearRect(0, 0, forge.w, forge.h);
    octx.strokeStyle = '#4ea1ff';
    octx.lineWidth = 2;
    octx.beginPath();
    octx.moveTo(drawing.start.x, drawing.start.y);
    octx.lineTo(p.x, p.y);
    octx.stroke();
    return;
  }
  if (drawing.kind === 'shape') {
    layer.ctx.putImageData(drawing.before, 0, 0);
    drawShape(layer.ctx, drawing.shape, drawing.start, p, false);
    compose();
  }
}

function onUp(e) {
  if (!drawing) return;
  const p = pos(e);
  const layer = activeLayer();

  if (drawing.kind === 'brush' || drawing.kind === 'eraser') drawing.c.restore();
  if (drawing.kind === 'select' && forge.selection && forge.selection.w < 4) forge.selection = null;
  if (drawing.kind === 'gradient') {
    const o = forge.opts;
    const c = layer.ctx;
    c.save();
    clipToSelection(c);
    c.globalAlpha = o.opacity;
    const g = o.gradient === 'radial'
      ? c.createRadialGradient(drawing.start.x, drawing.start.y, 0, drawing.start.x, drawing.start.y,
        Math.max(4, Math.hypot(p.x - drawing.start.x, p.y - drawing.start.y)))
      : c.createLinearGradient(drawing.start.x, drawing.start.y, p.x, p.y);
    g.addColorStop(0, o.color);
    g.addColorStop(1, o.color2);
    c.fillStyle = g;
    c.fillRect(0, 0, forge.w, forge.h);
    c.restore();
    octx.clearRect(0, 0, forge.w, forge.h);
  }
  drawing = null;
  compose();
  renderLayersPanel();
  try { canvas.releasePointerCapture(e.pointerId); } catch { /* noop */ }
}

/* ------------------------------------------------------------ adjustments */

function withPixels(fn) {
  const l = activeLayer();
  if (!l) return;
  pushPixels(l);
  const img = l.ctx.getImageData(0, 0, forge.w, forge.h);
  fn(img.data, img);
  l.ctx.putImageData(img, 0, 0);
  compose();
  renderLayersPanel();
}

function filterLayer(filter) {
  const l = activeLayer();
  if (!l) return;
  pushPixels(l);
  const tmp = document.createElement('canvas');
  tmp.width = forge.w; tmp.height = forge.h;
  const tc = tmp.getContext('2d');
  tc.filter = filter;
  tc.drawImage(l.canvas, 0, 0);
  l.ctx.clearRect(0, 0, forge.w, forge.h);
  l.ctx.drawImage(tmp, 0, 0);
  compose();
  renderLayersPanel();
}

function effectOutline(color, width) {
  const l = activeLayer();
  if (!l) return;
  pushPixels(l);
  const tmp = document.createElement('canvas');
  tmp.width = forge.w; tmp.height = forge.h;
  const tc = tmp.getContext('2d');
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const a = (Math.PI * 2 * i) / steps;
    tc.drawImage(l.canvas, Math.cos(a) * width, Math.sin(a) * width);
  }
  tc.globalCompositeOperation = 'source-in';
  tc.fillStyle = color;
  tc.fillRect(0, 0, forge.w, forge.h);
  tc.globalCompositeOperation = 'source-over';
  tc.drawImage(l.canvas, 0, 0);
  l.ctx.clearRect(0, 0, forge.w, forge.h);
  l.ctx.drawImage(tmp, 0, 0);
  compose();
}

function effectShadow(color, dx, dy, blur) {
  const l = activeLayer();
  if (!l) return;
  pushPixels(l);
  const tmp = document.createElement('canvas');
  tmp.width = forge.w; tmp.height = forge.h;
  const tc = tmp.getContext('2d');
  tc.filter = `blur(${blur}px)`;
  tc.drawImage(l.canvas, dx, dy);
  tc.filter = 'none';
  tc.globalCompositeOperation = 'source-in';
  tc.fillStyle = color;
  tc.fillRect(0, 0, forge.w, forge.h);
  tc.globalCompositeOperation = 'destination-over';
  tc.drawImage(l.canvas, 0, 0);
  // shadow underneath
  l.ctx.clearRect(0, 0, forge.w, forge.h);
  l.ctx.drawImage(tmp, 0, 0);
  compose();
}

function trimToContent() {
  const l = activeLayer();
  if (!l) return;
  const img = l.ctx.getImageData(0, 0, forge.w, forge.h).data;
  let x0 = forge.w, y0 = forge.h, x1 = 0, y1 = 0, found = false;
  for (let y = 0; y < forge.h; y++) {
    for (let x = 0; x < forge.w; x++) {
      if (img[(y * forge.w + x) * 4 + 3] > 8) {
        found = true;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  return found ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null;
}

/* ------------------------------------------------------------------ view */

function fitCanvas() {
  const stage = $('#forgeStage');
  const pad = 56;
  forge.fit = Math.min((stage.clientWidth - pad) / forge.w, (stage.clientHeight - pad) / forge.h);
  applyForgeZoom();
}

function applyForgeZoom() {
  const s = Math.max(0.05, forge.fit * forge.zoom);
  host.style.width = `${forge.w * s}px`;
  host.style.height = `${forge.h * s}px`;
  $('#forgeZoom').textContent = `${Math.round(s * 100)}%`;
}

/* ---------------------------------------------------------------- panels */

function renderTools() {
  const rail = clear($('#forgeTools'));
  for (const t of TOOLS) {
    if (t.sep) { rail.appendChild(el('div', { class: 'tool-sep' })); continue; }
    rail.appendChild(el('button', {
      class: `tool${forge.tool === t.id ? ' is-active' : ''}`, title: t.name, text: t.icon,
      onclick: () => { forge.tool = t.id; renderTools(); renderOptions(); },
    }));
  }
  rail.appendChild(el('div', { class: 'tool-sep' }));
  rail.appendChild(el('button', { class: 'tool', title: 'Undo (Ctrl+Z)', text: '↶', onclick: forgeUndo }));
  rail.appendChild(el('button', { class: 'tool', title: 'Redo', text: '↷', onclick: forgeRedo }));
  rail.appendChild(el('button', {
    class: 'tool', title: 'Deselect', text: '⌫',
    onclick: () => { forge.selection = null; drawOverlay(); },
  }));
}

function num(label, key, min, max, step = 1) {
  return el('label', {}, label,
    el('input', {
      type: 'range', min, max, step, value: forge.opts[key],
      oninput: (e) => { forge.opts[key] = parseFloat(e.target.value); const o = e.target.nextSibling; if (o) o.textContent = forge.opts[key]; },
    }),
    el('span', { text: String(forge.opts[key]), style: { minWidth: '30px', fontVariantNumeric: 'tabular-nums' } }));
}

function renderOptions() {
  const bar = clear($('#forgeOptions'));
  const o = forge.opts;
  const t = forge.tool;

  bar.append(
    el('label', {}, 'Colour',
      el('input', { type: 'color', value: o.color, oninput: (e) => { o.color = e.target.value; } })),
    el('label', {}, 'Alt',
      el('input', { type: 'color', value: o.color2, oninput: (e) => { o.color2 = e.target.value; } })),
    el('button', {
      class: 'chip-btn', text: '⇄', title: 'Swap colours',
      onclick: () => { const a = o.color; o.color = o.color2; o.color2 = a; renderOptions(); },
    }));

  if (['brush', 'eraser', 'line'].includes(t)) bar.appendChild(num('Size', 'size', 1, 300));
  if (['brush', 'eraser'].includes(t)) bar.appendChild(num('Hardness', 'hardness', 1, 100));
  if (t === 'fill') bar.appendChild(num('Tolerance', 'tolerance', 0, 160));
  if (['rect', 'ellipse', 'poly', 'text'].includes(t)) {
    bar.append(
      el('label', {}, el('input', {
        type: 'checkbox', checked: o.fill, onchange: (e) => { o.fill = e.target.checked; },
      }), 'Fill'),
      el('label', {}, el('input', {
        type: 'checkbox', checked: o.stroke, onchange: (e) => { o.stroke = e.target.checked; },
      }), 'Stroke'),
      num('Weight', 'strokeWidth', 1, 60));
  }
  if (t === 'poly') { bar.appendChild(num('Points', 'points', 3, 24)); bar.appendChild(num('Depth', 'inner', 10, 100)); }
  if (t === 'gradient') {
    bar.appendChild(el('label', {}, 'Type',
      el('select', { onchange: (e) => { o.gradient = e.target.value; } },
        el('option', { value: 'linear', selected: o.gradient === 'linear' }, 'Linear'),
        el('option', { value: 'radial', selected: o.gradient === 'radial' }, 'Radial'))));
  }
  if (t === 'text') {
    bar.append(
      el('input', { type: 'text', value: o.text, placeholder: 'Type text…', style: { width: '150px' }, oninput: (e) => { o.text = e.target.value; } }),
      el('label', {}, 'Font',
        el('select', { onchange: (e) => { o.font = e.target.value; } },
          ...FONTS.map((f) => el('option', { value: f.id, selected: f.id === o.font }, f.name)))),
      num('Size', 'fontSize', 10, 460));
  }
  bar.appendChild(num('Opacity', 'opacity', 0.05, 1, 0.05));

  bar.appendChild(el('span', { class: 'spacer', style: { flex: '1' } }));
  bar.appendChild(el('div', { class: 'swatch-strip' },
    ...PALETTES[0].colors.concat(PALETTES[8].colors, ['#ffffff', '#000000']).map((c) =>
      el('i', { style: { background: c }, title: c, onclick: () => { o.color = c; renderOptions(); } }))));
}

function renderLayersPanel() {
  const page = clear($('#fp-layers'));

  page.appendChild(el('div', { class: 'row', style: { marginBottom: '10px' } },
    el('button', { class: 'btn', text: '+ Layer', onclick: () => { pushStack(); forge.layers.push(makeLayer(`Layer ${forge.layers.length + 1}`)); forge.active = forge.layers.length - 1; compose(); renderLayersPanel(); } }),
    el('button', { class: 'btn', text: 'Duplicate', onclick: () => {
      const l = activeLayer(); if (!l) return;
      pushStack();
      const c = makeLayer(`${l.name} copy`);
      c.ctx.drawImage(l.canvas, 0, 0);
      c.opacity = l.opacity; c.blend = l.blend;
      forge.layers.splice(forge.active + 1, 0, c);
      forge.active++; compose(); renderLayersPanel();
    } }),
    el('button', { class: 'btn', text: 'Merge ↓', onclick: () => {
      if (forge.active === 0) return toast('Nothing below to merge into');
      pushStack();
      const top = forge.layers[forge.active];
      const below = forge.layers[forge.active - 1];
      below.ctx.globalAlpha = top.opacity;
      below.ctx.globalCompositeOperation = top.blend;
      below.ctx.drawImage(top.canvas, 0, 0);
      below.ctx.globalAlpha = 1;
      below.ctx.globalCompositeOperation = 'source-over';
      forge.layers.splice(forge.active, 1);
      forge.active--; compose(); renderLayersPanel();
    } })));

  const list = el('div', { class: 'layer-list' });
  for (let i = forge.layers.length - 1; i >= 0; i--) {
    const l = forge.layers[i];
    const row = el('div', {
      class: `layer-row${forge.active === i ? ' is-active' : ''}`,
      onclick: () => { forge.active = i; renderLayersPanel(); },
    });
    const prev = el('div', { class: 'lp' });
    const img = el('img', { src: l.canvas.toDataURL(), style: { width: '100%', height: '100%', objectFit: 'contain' } });
    prev.appendChild(img);
    row.append(prev, el('b', { text: l.name }),
      el('button', { class: 'mini', text: l.visible ? '●' : '◌', title: 'Visibility', onclick: (e) => { e.stopPropagation(); l.visible = !l.visible; compose(); renderLayersPanel(); } }),
      el('button', { class: 'mini', text: '↑', title: 'Up', onclick: (e) => { e.stopPropagation(); if (i < forge.layers.length - 1) { pushStack(); forge.layers.splice(i + 1, 0, forge.layers.splice(i, 1)[0]); forge.active = i + 1; compose(); renderLayersPanel(); } } }),
      el('button', { class: 'mini', text: '↓', title: 'Down', onclick: (e) => { e.stopPropagation(); if (i > 0) { pushStack(); forge.layers.splice(i - 1, 0, forge.layers.splice(i, 1)[0]); forge.active = i - 1; compose(); renderLayersPanel(); } } }),
      el('button', { class: 'mini', text: '✕', title: 'Delete', onclick: (e) => {
        e.stopPropagation();
        if (forge.layers.length === 1) return toast('Keep at least one layer');
        pushStack(); forge.layers.splice(i, 1); forge.active = Math.max(0, forge.active - 1); compose(); renderLayersPanel();
      } }));
    list.appendChild(row);
  }
  page.appendChild(list);

  const l = activeLayer();
  if (l) {
    page.appendChild(el('div', { class: 'field', style: { marginTop: '12px' } },
      el('label', { text: 'Layer name' }),
      el('input', { type: 'text', value: l.name, oninput: (e) => { l.name = e.target.value; } })));
    page.appendChild(el('div', { class: 'field' },
      el('label', { text: `Opacity ${Math.round(l.opacity * 100)}%` }),
      el('input', {
        type: 'range', min: 0, max: 1, step: 0.01, value: l.opacity, style: { width: '100%' },
        oninput: (e) => { l.opacity = parseFloat(e.target.value); compose(); },
      })));
    page.appendChild(el('div', { class: 'field' },
      el('label', { text: 'Blend mode' }),
      el('select', { onchange: (e) => { l.blend = e.target.value; compose(); } },
        ...BLENDS.map((b) => el('option', { value: b, selected: b === l.blend }, b === 'source-over' ? 'normal' : b)))));
    page.appendChild(el('button', {
      class: 'btn wide', text: 'Clear layer',
      onclick: () => { pushPixels(l); l.ctx.clearRect(0, 0, forge.w, forge.h); compose(); renderLayersPanel(); },
    }));
  }
}

function renderAdjustPanel() {
  const page = clear($('#fp-adjust'));
  const mk = (label, fn) => el('button', { class: 'btn wide', text: label, onclick: fn, style: { marginBottom: '6px' } });

  page.appendChild(el('div', { class: 'block-title' }, 'Adjust'));
  const state = { brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0 };
  const mkRange = (label, key, min, max, unit, suffix = '') => {
    const out = el('output', { text: `${state[key]}${suffix}` });
    return el('div', { class: 'field' }, el('label', { text: label }),
      el('div', { class: 'range-row' },
        el('input', {
          type: 'range', min, max, value: state[key],
          oninput: (e) => { state[key] = +e.target.value; out.textContent = `${state[key]}${suffix}`; },
        }), out),
      el('button', {
        class: 'btn', text: 'Apply', style: { marginTop: '4px' },
        onclick: () => filterLayer(`${unit}(${state[key]}${suffix || (unit === 'hue-rotate' ? 'deg' : unit === 'blur' ? 'px' : '%')})`),
      }));
  };
  page.append(
    mkRange('Brightness', 'brightness', 0, 250, 'brightness'),
    mkRange('Contrast', 'contrast', 0, 250, 'contrast'),
    mkRange('Saturation', 'saturate', 0, 300, 'saturate'),
    mkRange('Hue rotate', 'hue', -180, 180, 'hue-rotate'),
    mkRange('Blur', 'blur', 0, 40, 'blur'));

  page.appendChild(el('div', { class: 'block-title', style: { marginTop: '14px' } }, 'One-click'));
  page.append(
    mk('Grayscale', () => filterLayer('grayscale(1)')),
    mk('Invert', () => filterLayer('invert(1)')),
    mk('Sepia', () => filterLayer('sepia(0.85)')),
    mk('Threshold (2 colour)', () => withPixels((d) => {
      for (let i = 0; i < d.length; i += 4) {
        const v = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) > 128 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    })),
    mk('Posterise', () => withPixels((d) => {
      const step = 255 / 3;
      for (let i = 0; i < d.length; i += 4) {
        for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / step) * step;
      }
    })),
    mk('Recolour to brush colour', () => {
      const o = forge.opts;
      const rgb = [1, 3, 5].map((i) => parseInt(o.color.slice(i, i + 2), 16));
      withPixels((d) => {
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 0) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; }
        }
      });
    }));

  page.appendChild(el('div', { class: 'block-title', style: { marginTop: '14px' } }, 'Layer effects'));
  const fx = { color: '#0b1120', width: 8, dx: 6, dy: 8, blur: 6 };
  page.append(
    el('div', { class: 'row', style: { marginBottom: '8px' } },
      el('input', { type: 'color', value: fx.color, oninput: (e) => { fx.color = e.target.value; } }),
      el('input', { type: 'number', class: 'inp', value: fx.width, min: 1, max: 60, style: { width: '70px' }, oninput: (e) => { fx.width = +e.target.value; } }),
      el('button', { class: 'btn', text: 'Outline', onclick: () => effectOutline(fx.color, fx.width) })),
    el('div', { class: 'row', style: { marginBottom: '8px' } },
      el('input', { type: 'number', class: 'inp', value: fx.dx, style: { width: '60px' }, oninput: (e) => { fx.dx = +e.target.value; } }),
      el('input', { type: 'number', class: 'inp', value: fx.dy, style: { width: '60px' }, oninput: (e) => { fx.dy = +e.target.value; } }),
      el('input', { type: 'number', class: 'inp', value: fx.blur, style: { width: '60px' }, oninput: (e) => { fx.blur = +e.target.value; } }),
      el('button', { class: 'btn', text: 'Shadow', onclick: () => effectShadow(fx.color, fx.dx, fx.dy, fx.blur) })),
    mk('Glow', () => effectShadow(forge.opts.color, 0, 0, 16)));

  page.appendChild(el('div', { class: 'block-title', style: { marginTop: '14px' } }, 'Transform'));
  page.append(
    mk('Flip horizontal', () => transformLayer((c, l) => { c.translate(forge.w, 0); c.scale(-1, 1); c.drawImage(l.canvas, 0, 0); })),
    mk('Flip vertical', () => transformLayer((c, l) => { c.translate(0, forge.h); c.scale(1, -1); c.drawImage(l.canvas, 0, 0); })),
    mk('Rotate 90°', () => transformLayer((c, l) => {
      c.translate(forge.w / 2, forge.h / 2); c.rotate(Math.PI / 2);
      c.drawImage(l.canvas, -forge.w / 2, -forge.h / 2);
    })),
    mk('Centre content', () => {
      const l = activeLayer();
      const box = trimToContent();
      if (!box) return toast('Layer is empty');
      pushPixels(l);
      const tmp = document.createElement('canvas');
      tmp.width = box.w; tmp.height = box.h;
      tmp.getContext('2d').drawImage(l.canvas, -box.x, -box.y);
      l.ctx.clearRect(0, 0, forge.w, forge.h);
      l.ctx.drawImage(tmp, (forge.w - box.w) / 2, (forge.h - box.h) / 2);
      compose(); renderLayersPanel();
    }));
}

function transformLayer(fn) {
  const l = activeLayer();
  if (!l) return;
  pushPixels(l);
  const tmp = document.createElement('canvas');
  tmp.width = forge.w; tmp.height = forge.h;
  const c = tmp.getContext('2d');
  c.save();
  fn(c, l);
  c.restore();
  l.ctx.clearRect(0, 0, forge.w, forge.h);
  l.ctx.drawImage(tmp, 0, 0);
  compose();
  renderLayersPanel();
}

function renderAssetsPanel() {
  const page = clear($('#fp-assets'));

  page.appendChild(el('div', { class: 'block-title' }, 'Bring in'));
  page.append(
    el('button', {
      class: 'btn wide', text: 'Import image…', style: { marginBottom: '6px' },
      onclick: async () => {
        const f = await pickFile('image/*');
        if (!f) return;
        const img = await readImage(f);
        pushStack();
        const l = makeLayer(img.name || 'Image');
        const im = new Image();
        im.onload = () => {
          const k = Math.min(forge.w / im.width, forge.h / im.height, 1);
          l.ctx.drawImage(im, (forge.w - im.width * k) / 2, (forge.h - im.height * k) / 2, im.width * k, im.height * k);
          forge.layers.push(l);
          forge.active = forge.layers.length - 1;
          compose(); renderLayersPanel();
        };
        im.src = img.src;
      },
    }),
    el('button', {
      class: 'btn wide', text: 'Insert library graphic…', style: { marginBottom: '6px' },
      onclick: () => openGraphicPicker(),
    }),
    el('button', {
      class: 'btn wide', text: 'Import current garment art', style: { marginBottom: '6px' },
      onclick: () => { emit('forge:pullFromStudio'); },
    }));

  page.appendChild(el('div', { class: 'block-title', style: { marginTop: '14px' } }, 'Canvas'));
  const sizes = [[900, 900, 'Square 900'], [1200, 800, 'Wide 1200×800'], [800, 1200, 'Tall 800×1200'], [1500, 1500, 'Large 1500']];
  page.appendChild(el('div', { class: 'grid2' }, ...sizes.map(([w, h, label]) =>
    el('button', { class: 'btn', text: label, onclick: () => { pushStack(); resizeAll(w, h); renderLayersPanel(); } }))));

  page.appendChild(el('div', { class: 'block-title', style: { marginTop: '14px' } }, 'Send it out'));
  page.append(
    el('button', {
      class: 'btn primary wide', text: 'Send to Studio →', style: { marginBottom: '6px' },
      onclick: sendToStudio,
    }),
    el('button', {
      class: 'btn wide', text: 'Download PNG', style: { marginBottom: '6px' },
      onclick: () => {
        canvas.toBlob((b) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b);
          a.download = 'clopro-artwork.png';
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        });
      },
    }));

  page.appendChild(el('p', { class: 'small muted', style: { marginTop: '10px' },
    text: 'Sending to Studio adds the flattened artwork as an image layer on the current garment view.' }));
}

function openGraphicPicker() {
  const wrap = el('div');
  const grid = el('div', { class: 'library-body', style: { maxHeight: '60vh', overflow: 'auto' } });
  for (const item of allArt()) {
    const parts = buildArt(item.id);
    const card = el('div', { class: 'art-card', onclick: () => { closeModal(); stampGraphic(item.id); } });
    card.innerHTML = `<svg viewBox="0 0 200 200">${parts
      .map((p) => `<path d="${p.d}" fill="${p.role === 'primary' ? '#e6eaf2' : p.role === 'secondary' ? '#8f9cb5' : '#5a6478'}" fill-rule="evenodd"/>`)
      .join('')}</svg><span>${item.name}</span>`;
    grid.appendChild(card);
  }
  wrap.appendChild(grid);
  openModal('Insert a graphic', wrap);
}

function stampGraphic(id) {
  const parts = buildArt(id);
  const o = forge.opts;
  const colors = { primary: o.color, secondary: o.color2, accent: '#ffffff' };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="600" height="600">${parts
    .map((p) => (p.stroke
      ? `<path d="${p.d}" fill="none" stroke="${colors[p.role] || o.color}" stroke-width="${p.stroke}" stroke-linecap="round"/>`
      : `<path d="${p.d}" fill="${colors[p.role] || o.color}" fill-rule="evenodd"/>`))
    .join('')}</svg>`;
  const img = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    pushStack();
    const l = makeLayer('Graphic');
    const s = Math.min(forge.w, forge.h) * 0.7;
    l.ctx.drawImage(img, (forge.w - s) / 2, (forge.h - s) / 2, s, s);
    forge.layers.push(l);
    forge.active = forge.layers.length - 1;
    compose();
    renderLayersPanel();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function sendToStudio() {
  const box = (() => {
    // trim the composite so the Studio layer sits tight around the art
    const d = ctx.getImageData(0, 0, forge.w, forge.h).data;
    let x0 = forge.w, y0 = forge.h, x1 = 0, y1 = 0, found = false;
    for (let y = 0; y < forge.h; y++) {
      for (let x = 0; x < forge.w; x++) {
        if (d[(y * forge.w + x) * 4 + 3] > 6) {
          found = true;
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    return found ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null;
  })();
  if (!box) { toast('Canvas is empty', 'err'); return; }
  const out = document.createElement('canvas');
  out.width = box.w;
  out.height = box.h;
  out.getContext('2d').drawImage(canvas, -box.x, -box.y);
  const src = out.toDataURL('image/png');
  const asset = addAsset({ name: 'Forge artwork', src, w: box.w, h: box.h });
  addLayer(newImageLayer(asset.id, { name: 'Forge artwork', size: 240, x: 300, y: 380 }));
  emit('studio:refresh');
  emit('tab', 'studio');
  toast('Artwork sent to the Studio');
}

/* ------------------------------------------------------------------ init */

export function initForge() {
  canvas = $('#forgeCanvas');
  overlay = $('#forgeOverlay');
  host = $('#forgeHost');
  ctx = canvas.getContext('2d', { willReadFrequently: true });
  octx = overlay.getContext('2d');

  const base = makeLayer('Background');
  forge.layers = [base];
  forge.active = 0;

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  $('#forgeZoomIn').addEventListener('click', () => { forge.zoom = Math.min(6, forge.zoom * 1.25); applyForgeZoom(); });
  $('#forgeZoomOut').addEventListener('click', () => { forge.zoom = Math.max(0.1, forge.zoom / 1.25); applyForgeZoom(); });
  $('#forgeFit').addEventListener('click', () => { forge.zoom = 1; fitCanvas(); });

  $$('#tab-forge .rail-tab').forEach((t) => t.addEventListener('click', () => {
    $$('#tab-forge .rail-tab').forEach((x) => x.classList.toggle('is-active', x === t));
    $$('#tab-forge .rail-page').forEach((p) => p.classList.toggle('is-active', p.id === `fp-${t.dataset.ft}`));
  }));

  window.addEventListener('resize', () => { if ($('#tab-forge').classList.contains('is-active')) fitCanvas(); });

  on('forge:pullFromStudio', () => {
    const assets = project().assets;
    if (!assets.length) { toast('No uploaded artwork yet'); return; }
    const a = assets[assets.length - 1];
    const im = new Image();
    im.onload = () => {
      pushStack();
      const l = makeLayer(a.name);
      const k = Math.min(forge.w / im.width, forge.h / im.height, 1);
      l.ctx.drawImage(im, (forge.w - im.width * k) / 2, (forge.h - im.height * k) / 2, im.width * k, im.height * k);
      forge.layers.push(l);
      forge.active = forge.layers.length - 1;
      compose(); renderLayersPanel();
    };
    im.src = a.src;
  });

  renderTools();
  renderOptions();
  renderLayersPanel();
  renderAdjustPanel();
  renderAssetsPanel();
  compose();
  requestAnimationFrame(fitCanvas);
}

export function forgeResizeIfVisible() {
  if ($('#tab-forge').classList.contains('is-active')) fitCanvas();
}

export { renderLayersPanel as forgeRenderLayers };
