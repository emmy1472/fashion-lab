/* cloPRO — project state, history and persistence. */

import { getGarment } from './data/garments.js';
import { defaultStyleParams } from './data/patterns.js';
import { defaultArtParams } from './data/graphics.js';

export const SCHEMA = 2;
const LS_KEY = 'clopro.project.v2';
const LS_GALLERY = 'clopro.gallery.v2';

/* ------------------------------------------------------------ tiny events */

const listeners = new Map();
export function on(evt, fn) {
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(fn);
  return () => listeners.get(evt).delete(fn);
}
export function emit(evt, data) {
  (listeners.get(evt) || []).forEach((fn) => fn(data));
  if (evt !== '*') (listeners.get('*') || []).forEach((fn) => fn(evt, data));
}

/* ------------------------------------------------------------------ paint */

export const paint = (style, colors, params) => ({
  style,
  colors: colors.slice(),
  params: { ...defaultStyleParams(style), ...(params || {}) },
});

export const solid = (c) => paint('solid', [c]);

/* --------------------------------------------------------------- defaults */

export function blankProject(garmentId = 'basketball-jersey') {
  const g = getGarment(garmentId);
  const zones = {};
  const roleColor = { primary: '#12233f', secondary: '#f2c14e', accent: '#ffffff', tertiary: '#c9ced6' };
  for (const view of g.views) {
    for (const z of g.zones(view)) {
      if (!zones[z.id]) zones[z.id] = solid(roleColor[z.role] || '#cccccc');
    }
  }
  return {
    schema: SCHEMA,
    id: uid('proj'),
    name: 'Untitled Design',
    created: Date.now(),
    updated: Date.now(),
    garment: garmentId,
    view: 'front',
    method: 'screen',
    palette: ['#12233f', '#f2c14e', '#ffffff', '#c9ced6'],
    zones,
    layers: { front: [], back: [] },
    roster: [
      { name: 'SMITH', number: '23', size: 'L', qty: 1 },
      { name: 'GARCIA', number: '7', size: 'M', qty: 1 },
    ],
    assets: [],
    meta: { team: '', org: '', contact: '', dueDate: '', notes: '' },
    mockup: { shading: true, texture: 'fabric', background: 'studio', showAreas: false },
  };
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/* ------------------------------------------------------------------ layers */

export function newTextLayer(over = {}) {
  return {
    id: uid('l'),
    type: 'text',
    name: over.text || 'Text',
    visible: true,
    locked: false,
    x: 300,
    y: 380,
    scale: 1,
    rotation: 0,
    opacity: 1,
    text: 'TITANS',
    font: 'Anton',
    size: 64,
    tracking: 2,
    lineHeight: 1.05,
    arc: 'straight',
    arcAmount: 40,
    skew: 0,
    fill: solid('#ffffff'),
    outlines: [{ color: '#0b1120', width: 6 }],
    shadow: { on: false, dx: 4, dy: 6, blur: 0, color: '#000000', opacity: 0.45 },
    ...over,
  };
}

export function newArtLayer(artId, over = {}) {
  return {
    id: uid('l'),
    type: 'art',
    name: 'Graphic',
    visible: true,
    locked: false,
    x: 300,
    y: 340,
    scale: 1,
    rotation: 0,
    opacity: 1,
    art: artId,
    artParams: defaultArtParams(artId),
    size: 180,
    roleFills: {
      primary: solid('#f2c14e'),
      secondary: solid('#ffffff'),
      accent: solid('#12233f'),
    },
    outlines: [],
    shadow: { on: false, dx: 4, dy: 6, blur: 0, color: '#000000', opacity: 0.4 },
    ...over,
  };
}

export function newImageLayer(assetId, over = {}) {
  return {
    id: uid('l'),
    type: 'image',
    name: 'Artwork',
    visible: true,
    locked: false,
    x: 300,
    y: 360,
    scale: 1,
    rotation: 0,
    opacity: 1,
    assetId,
    size: 200,
    shadow: { on: false, dx: 4, dy: 6, blur: 0, color: '#000000', opacity: 0.4 },
    ...over,
  };
}

export function newNumberLayer(over = {}) {
  return newTextLayer({
    type: 'number',
    name: 'Number',
    text: '23',
    size: 150,
    font: 'Anton',
    tracking: -2,
    y: 420,
    outlines: [{ color: '#0b1120', width: 8 }],
    ...over,
  });
}

export function newNameLayer(over = {}) {
  return newTextLayer({
    type: 'name',
    name: 'Player Name',
    text: 'SMITH',
    size: 46,
    font: 'Bebas Neue',
    tracking: 6,
    arc: 'arch',
    arcAmount: 26,
    y: 300,
    ...over,
  });
}

/* ------------------------------------------------------------------ store */

export const store = {
  project: blankProject(),
  selection: null,        // layer id
  tab: 'studio',
  history: [],
  future: [],
  dirty: false,
};

let squashTimer = null;
let pendingLabel = null;
/* The state as of the last checkpoint. Callers mutate the project and *then*
   call commit(), so this — not the current state — is what undo restores to. */
let baseline = JSON.stringify(store.project);

/** Push a history checkpoint. Rapid same-label edits collapse into one step. */
export function commit(label = 'edit', squash = false) {
  const continuing = squash && pendingLabel === label && squashTimer;
  if (!continuing) {
    store.history.push(baseline);
    if (store.history.length > 80) store.history.shift();
    store.future.length = 0;
    emit('history');
  }
  baseline = JSON.stringify(store.project);

  pendingLabel = label;
  clearTimeout(squashTimer);
  squashTimer = setTimeout(() => { pendingLabel = null; squashTimer = null; }, 500);

  store.project.updated = Date.now();
  store.dirty = true;
  emit('change', label);
  save();
}

export function undo() {
  if (!store.history.length) return false;
  store.future.push(JSON.stringify(store.project));
  const prev = store.history.pop();
  store.project = JSON.parse(prev);
  baseline = prev;
  pendingLabel = null;
  ensureSelectionValid();
  emit('change', 'undo');
  emit('history');
  save();
  return true;
}

export function redo() {
  if (!store.future.length) return false;
  store.history.push(JSON.stringify(store.project));
  const next = store.future.pop();
  store.project = JSON.parse(next);
  baseline = next;
  pendingLabel = null;
  ensureSelectionValid();
  emit('change', 'redo');
  emit('history');
  save();
  return true;
}

function resetHistory() {
  store.history.length = 0;
  store.future.length = 0;
  pendingLabel = null;
  baseline = JSON.stringify(store.project);
}

function ensureSelectionValid() {
  const ids = new Set(currentLayers().map((l) => l.id));
  if (store.selection && !ids.has(store.selection)) store.selection = null;
}

/* --------------------------------------------------------------- accessors */

export function project() { return store.project; }
export function garment() { return getGarment(store.project.garment); }
export function view() { return store.project.view; }
export function currentLayers() {
  const v = store.project.view;
  if (!store.project.layers[v]) store.project.layers[v] = [];
  return store.project.layers[v];
}
export function selectedLayer() {
  return currentLayers().find((l) => l.id === store.selection) || null;
}
export function select(id) {
  store.selection = id;
  emit('select', id);
}

export function addLayer(layer) {
  currentLayers().push(layer);
  store.selection = layer.id;
  commit('add layer');
  emit('select', layer.id);
  return layer;
}

export function removeLayer(id) {
  const arr = currentLayers();
  const i = arr.findIndex((l) => l.id === id);
  if (i < 0) return;
  arr.splice(i, 1);
  if (store.selection === id) store.selection = null;
  commit('delete layer');
  emit('select', store.selection);
}

export function moveLayer(id, dir) {
  const arr = currentLayers();
  const i = arr.findIndex((l) => l.id === id);
  if (i < 0) return;
  const j = Math.max(0, Math.min(arr.length - 1, i + dir));
  if (i === j) return;
  arr.splice(j, 0, arr.splice(i, 1)[0]);
  commit('reorder');
}

export function duplicateLayer(id) {
  const arr = currentLayers();
  const l = arr.find((x) => x.id === id);
  if (!l) return;
  const copy = JSON.parse(JSON.stringify(l));
  copy.id = uid('l');
  copy.x += 18;
  copy.y += 18;
  copy.name = `${l.name} copy`;
  arr.push(copy);
  store.selection = copy.id;
  commit('duplicate');
  emit('select', copy.id);
}

export function setZonePaint(zoneId, p) {
  store.project.zones[zoneId] = p;
}

export function zonePaint(zoneId) {
  return store.project.zones[zoneId] || solid('#cccccc');
}

/** Swap the garment, keeping compatible zone colours and all layers. */
export function setGarment(id) {
  const g = getGarment(id);
  const old = store.project.zones;
  const zones = {};
  const roleColor = {
    primary: store.project.palette[0] || '#12233f',
    secondary: store.project.palette[1] || '#f2c14e',
    accent: store.project.palette[2] || '#ffffff',
    tertiary: store.project.palette[3] || '#c9ced6',
  };
  for (const view of g.views) {
    for (const z of g.zones(view)) {
      zones[z.id] = old[z.id] || solid(roleColor[z.role] || '#cccccc');
    }
  }
  store.project.zones = zones;
  store.project.garment = id;
  if (!g.views.includes(store.project.view)) store.project.view = g.views[0];
  commit('garment');
}

/* ------------------------------------------------------------ persistence */

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(store.project));
    } catch (e) {
      console.warn('cloPRO: autosave failed (storage full?)', e);
    }
  }, 400);
}

export function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw);
    if (!p || !p.garment) return false;
    store.project = migrate(p);
    resetHistory();
    return true;
  } catch {
    return false;
  }
}

function migrate(p) {
  const b = blankProject(p.garment);
  const out = { ...b, ...p, schema: SCHEMA };
  out.layers = { front: [], back: [], ...(p.layers || {}) };
  out.mockup = { ...b.mockup, ...(p.mockup || {}) };
  out.meta = { ...b.meta, ...(p.meta || {}) };
  out.zones = { ...b.zones, ...(p.zones || {}) };
  return out;
}

export function loadProject(obj) {
  store.project = migrate(obj);
  store.selection = null;
  resetHistory();
  emit('change', 'load');
  emit('history');
  save();
}

export function newProject(garmentId) {
  loadProject(blankProject(garmentId));
}

/* ------------------------------------------------------------- my designs */

export function gallery() {
  try { return JSON.parse(localStorage.getItem(LS_GALLERY) || '[]'); } catch { return []; }
}

export function saveToGallery(thumb) {
  const list = gallery();
  const p = JSON.parse(JSON.stringify(store.project));
  p.updated = Date.now();
  const i = list.findIndex((x) => x.project.id === p.id);
  const entry = { project: p, thumb, updated: p.updated };
  if (i >= 0) list[i] = entry; else list.unshift(entry);
  while (list.length > 24) list.pop();
  try { localStorage.setItem(LS_GALLERY, JSON.stringify(list)); } catch (e) { console.warn('gallery full', e); }
  emit('gallery');
}

export function deleteFromGallery(id) {
  const list = gallery().filter((x) => x.project.id !== id);
  try { localStorage.setItem(LS_GALLERY, JSON.stringify(list)); } catch { /* noop */ }
  emit('gallery');
}

/* ---------------------------------------------------------------- assets */

export function addAsset(asset) {
  const a = { id: uid('a'), name: 'Artwork', ...asset };
  store.project.assets.push(a);
  commit('asset');
  return a;
}

export function getAsset(id) {
  return store.project.assets.find((a) => a.id === id) || null;
}
