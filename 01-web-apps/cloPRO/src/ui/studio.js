/* cloPRO — Studio: garment canvas, colourway, layers and properties. */

import {
  store, project, garment, currentLayers, selectedLayer, select, addLayer, removeLayer,
  moveLayer, duplicateLayer, commit, setGarment, on, emit, newTextLayer, newNumberLayer,
  newNameLayer, newArtLayer, newImageLayer, addAsset, solid,
} from '../state.js';
import { renderSVG, layerBounds, measureText } from '../render.js';
import { getGarment, garmentList, CATEGORIES, VB, inches } from '../data/garments.js';
import { PALETTES, PALETTE_GROUPS, PRESETS, FONTS, FONT_GROUPS, fontCss, TEXT_ARCS, harmony, contrastRatio } from '../data/library.js';
import { allArt, buildArt, defaultArtParams } from '../data/graphics.js';
import { $, $$, el, clear, toast, openModal, closeModal, slider, selectField, textField, paintEditor, paintCss, pickFile, readImage } from './common.js';

let zoom = 1;
let fitScale = 1;
let activeZone = null;
let catFilter = 'All';
let paletteGroup = PALETTE_GROUPS[0];
let railPage = 'colour';

/* ---------------------------------------------------------------- thumbs */

const thumbCache = new Map();
function garmentThumb(g) {
  if (thumbCache.has(g.id)) return thumbCache.get(g.id);
  const colors = { primary: '#59657e', secondary: '#7d8aa4', accent: '#aab4c8', tertiary: '#48536a' };
  const zones = g.zones('front');
  const body = zones
    .map((z) => (z.strokeOnly
      ? `<path d="${z.d}" fill="none" stroke="${colors[z.role] || '#666'}" stroke-width="${z.width || 5}" stroke-linecap="round"/>`
      : `<path d="${z.d}" fill="${colors[z.role] || '#666'}"/>`))
    .join('');
  const svg = `<svg viewBox="0 0 ${VB.w} ${VB.h}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
  thumbCache.set(g.id, svg);
  return svg;
}

/* ------------------------------------------------------------ left rail */

function buildGarmentPicker() {
  const chips = clear($('#catChips'));
  for (const c of ['All', ...CATEGORIES]) {
    chips.appendChild(el('button', {
      class: `chip${catFilter === c ? ' is-active' : ''}`, text: c,
      onclick: () => { catFilter = c; buildGarmentPicker(); },
    }));
  }
  const list = garmentList().filter((g) => catFilter === 'All' || g.category === catFilter);
  $('#garmentCount').textContent = `${list.length} styles`;
  const grid = clear($('#garmentGrid'));
  for (const g of list) {
    const card = el('div', {
      class: `garment-card${project().garment === g.id ? ' is-active' : ''}`,
      title: `${g.name} — ${g.fabric}`,
      onclick: () => { setGarment(g.id); buildGarmentPicker(); buildViewToggle(); render(); },
    });
    card.innerHTML = garmentThumb(g) + `<span>${g.name}</span>`;
    grid.appendChild(card);
  }
}

function buildPresets() {
  const grid = clear($('#presetGrid'));
  for (const p of PRESETS) {
    const card = el('div', { class: 'preset-card', onclick: () => applyPreset(p) },
      el('b', { text: p.name }),
      el('div', { class: 'preset-swatches' }, ...p.palette.map((c) => el('i', { style: { background: c } }))));
    grid.appendChild(card);
  }
}

function applyPreset(p) {
  const g = garment();
  const ids = new Set();
  for (const v of g.views) g.zones(v).forEach((z) => ids.add(z.id));
  for (const [zoneId, paint] of Object.entries(p.zones)) {
    if (ids.has(zoneId)) project().zones[zoneId] = JSON.parse(JSON.stringify({ params: {}, ...paint }));
  }
  project().palette = p.palette.slice();
  commit('preset');
  render();
  toast(`Applied “${p.name}”`);
}

function buildPalettes() {
  const groups = clear($('#paletteGroups'));
  for (const g of PALETTE_GROUPS) {
    groups.appendChild(el('button', {
      class: `chip${paletteGroup === g ? ' is-active' : ''}`, text: g,
      onclick: () => { paletteGroup = g; buildPalettes(); },
    }));
  }
  const list = clear($('#paletteList'));
  for (const p of PALETTES.filter((x) => x.group === paletteGroup)) {
    const row = el('div', { class: 'palette-row', title: 'Click to load into the design palette' },
      el('div', { class: 'palette-swatches' }, ...p.colors.map((c) =>
        el('i', { style: { background: c }, title: c, onclick: (e) => { e.stopPropagation(); applyColorToZone(c); } }))),
      el('span', { text: p.name }));
    row.addEventListener('click', () => {
      project().palette = p.colors.slice();
      commit('palette');
      applyPaletteToRoles(p.colors);
      render();
      toast(`${p.name} applied`);
    });
    list.appendChild(row);
  }
  buildHarmony();
}

function applyPaletteToRoles(colors) {
  const g = garment();
  const map = { primary: colors[0], secondary: colors[1], accent: colors[2], tertiary: colors[3] || colors[1] };
  for (const v of g.views) {
    for (const z of g.zones(v)) {
      const cur = project().zones[z.id];
      const next = map[z.role] || colors[0];
      if (!cur || cur.style === 'solid') project().zones[z.id] = solid(next);
      else project().zones[z.id] = { ...cur, colors: cur.colors.map((_, i) => colors[i % colors.length]) };
    }
  }
}

function applyColorToZone(hex) {
  if (!activeZone) { toast('Pick a garment part first'); return; }
  const cur = project().zones[activeZone];
  project().zones[activeZone] = cur && cur.style !== 'solid' ? { ...cur, colors: [hex, ...cur.colors.slice(1)] } : solid(hex);
  commit('zone colour');
  render();
}

function buildHarmony() {
  const seed = $('#harmonySeed');
  const kind = $('#harmonyKind');
  const out = clear($('#harmonyOut'));
  const colors = harmony(seed.value, kind.value);
  for (const c of colors) {
    out.appendChild(el('i', {
      style: { background: c }, title: `${c} — click to apply to the selected part`,
      onclick: () => applyColorToZone(c),
    }));
  }
  out.appendChild(el('button', {
    class: 'chip', text: 'Use all', style: { marginLeft: '6px' },
    onclick: () => { project().palette = colors; applyPaletteToRoles(colors); commit('harmony'); render(); },
  }));
}

/* ------------------------------------------------------------ stage bar */

function buildViewToggle() {
  const seg = clear($('#viewToggle'));
  for (const v of garment().views) {
    seg.appendChild(el('button', {
      class: project().view === v ? 'is-active' : '', text: v[0].toUpperCase() + v.slice(1),
      onclick: () => { project().view = v; select(null); commit('view'); render(); },
    }));
  }
}

/* ------------------------------------------------------------- canvas */

function computeFit() {
  const wrap = $('#canvasWrap');
  const pad = 48;
  const aw = wrap.clientWidth - pad;
  const ah = wrap.clientHeight - pad;
  fitScale = Math.max(0.2, Math.min(aw / VB.w, ah / VB.h));
}

function applyZoom() {
  const host = $('#canvasHost');
  const s = fitScale * zoom;
  host.style.width = `${VB.w * s}px`;
  host.style.height = `${VB.h * s}px`;
  $('#zoomLabel').textContent = `${Math.round(zoom * 100)}%`;
}

export function renderCanvas() {
  const host = $('#canvasHost');
  host.innerHTML = renderSVG(project(), { selected: store.selection, guides: project().mockup.showAreas });
  const svg = host.querySelector('svg');
  drawSelection(svg);
  attachStageEvents(svg);
  applyZoom();

  const wrap = $('#canvasWrap');
  wrap.className = `canvas-wrap bg-${project().mockup.background || 'studio'}`;
}

function drawSelection(svg) {
  const l = selectedLayer();
  if (!l) return;
  const b = layerBounds(l, project());
  const pad = 8;
  const w = b.w + pad * 2;
  const h = b.h + pad * 2;
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('transform', `translate(${l.x} ${l.y}) rotate(${l.rotation || 0})`);
  g.setAttribute('class', 'cp-select');

  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', -w / 2); rect.setAttribute('y', -h / 2);
  rect.setAttribute('width', w); rect.setAttribute('height', h);
  rect.setAttribute('class', 'sel-box');
  g.appendChild(rect);

  const hs = 7;
  for (const [hx, hy, id] of [[-1, -1, 'nw'], [1, -1, 'ne'], [1, 1, 'se'], [-1, 1, 'sw']]) {
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', (hx * w) / 2 - hs); r.setAttribute('y', (hy * h) / 2 - hs);
    r.setAttribute('width', hs * 2); r.setAttribute('height', hs * 2);
    r.setAttribute('class', 'sel-handle');
    r.dataset.handle = `scale-${id}`;
    g.appendChild(r);
  }
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', 0); line.setAttribute('y1', -h / 2);
  line.setAttribute('x2', 0); line.setAttribute('y2', -h / 2 - 26);
  line.setAttribute('class', 'sel-box');
  g.appendChild(line);
  const rot = document.createElementNS(ns, 'circle');
  rot.setAttribute('cx', 0); rot.setAttribute('cy', -h / 2 - 30); rot.setAttribute('r', 8);
  rot.setAttribute('class', 'sel-rot');
  rot.dataset.handle = 'rotate';
  g.appendChild(rot);

  svg.appendChild(g);
}

function svgPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = svg.getScreenCTM();
  return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
}

function attachStageEvents(svg) {
  let drag = null;

  svg.addEventListener('pointerdown', (e) => {
    const handle = e.target.dataset?.handle;
    const layerEl = e.target.closest('.cp-layer');
    const zoneEl = e.target.closest('.cp-zone');
    const p = svgPoint(svg, e);

    if (handle) {
      const l = selectedLayer();
      if (!l) return;
      const b = layerBounds(l, project());
      drag = {
        kind: handle.startsWith('scale') ? 'scale' : 'rotate',
        l,
        start: p,
        startScale: l.scale ?? 1,
        startRot: l.rotation || 0,
        dist: Math.hypot(p.x - l.x, p.y - l.y) || 1,
        ang: (Math.atan2(p.y - l.y, p.x - l.x) * 180) / Math.PI,
        b,
      };
    } else if (layerEl) {
      const id = layerEl.dataset.layer;
      const l = currentLayers().find((x) => x.id === id);
      if (!l || l.locked) return;
      if (store.selection !== id) { select(id); setRailPage('props'); renderCanvas(); renderRails(); }
      drag = { kind: 'move', l, start: p, ox: l.x, oy: l.y };
    } else if (zoneEl) {
      activeZone = zoneEl.dataset.zone;
      select(null);
      setRailPage('colour');
      renderCanvas();
      renderRails();
      return;
    } else {
      select(null);
      renderCanvas();
      renderRails();
      return;
    }
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  svg.addEventListener('pointermove', (e) => {
    if (!drag) {
      return;
    }
    const p = svgPoint(svg, e);
    const l = drag.l;
    if (drag.kind === 'move') {
      let nx = drag.ox + (p.x - drag.start.x);
      let ny = drag.oy + (p.y - drag.start.y);
      if (e.shiftKey) {
        if (Math.abs(p.x - drag.start.x) > Math.abs(p.y - drag.start.y)) ny = drag.oy; else nx = drag.ox;
      }
      l.x = Math.round(nx);
      l.y = Math.round(ny);
      updateStatus(`x ${l.x}  y ${l.y}  ·  ${inches(layerBounds(l, project()).w)}in wide`);
    } else if (drag.kind === 'scale') {
      const d = Math.hypot(p.x - l.x, p.y - l.y);
      l.scale = Math.max(0.08, Math.min(8, drag.startScale * (d / drag.dist)));
      updateStatus(`scale ${Math.round(l.scale * 100)}%  ·  ${inches(layerBounds(l, project()).w)}in wide`);
    } else {
      const a = (Math.atan2(p.y - l.y, p.x - l.x) * 180) / Math.PI;
      let r = drag.startRot + (a - drag.ang);
      if (e.shiftKey) r = Math.round(r / 15) * 15;
      l.rotation = Math.round(r);
      updateStatus(`rotation ${l.rotation}°`);
    }
    renderCanvas();
  });

  const end = (e) => {
    if (!drag) return;
    drag = null;
    try { svg.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    commit('transform', true);
    renderRails();
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
}

function updateStatus(msg) {
  $('#stageStatus').textContent = msg;
}

/* ------------------------------------------------------------ colourway */

function renderColourPage() {
  const page = clear($('#rp-colour'));
  const g = garment();
  const zones = g.zones(project().view);
  if (!activeZone || !zones.some((z) => z.id === activeZone)) activeZone = zones[0]?.id || null;

  page.appendChild(el('div', { class: 'block-title' }, 'Garment parts', el('span', { class: 'hint', text: `${zones.length}` })));

  const list = el('div', { class: 'zone-list' });
  for (const z of zones) {
    const p = project().zones[z.id];
    const row = el('div', {
      class: `zone-row${activeZone === z.id ? ' is-active' : ''}`,
      onclick: () => { activeZone = z.id; renderColourPage(); },
    },
      el('div', { class: 'zone-swatch', style: { background: paintCss(p) } }),
      el('b', { text: z.label }),
      el('em', { text: p?.style === 'solid' ? (p.colors[0] || '') : (p?.style || '') }));
    list.appendChild(row);
    if (activeZone === z.id) {
      list.appendChild(paintEditor(p, (next, live) => {
        project().zones[z.id] = next;
        commit('paint', live);
        renderCanvas();
        row.querySelector('.zone-swatch').style.background = paintCss(next);
      }));
    }
  }
  page.appendChild(list);

  page.appendChild(el('div', { class: 'block-title', style: { marginTop: '16px' } }, 'Quick actions'));
  page.appendChild(el('div', { class: 'row' },
    el('button', {
      class: 'btn', text: 'Copy fill to all', onclick: () => {
        const src = project().zones[activeZone];
        if (!src) return;
        for (const z of zones) project().zones[z.id] = JSON.parse(JSON.stringify(src));
        commit('fill all'); renderCanvas(); renderColourPage(); toast('Fill copied to every part');
      },
    }),
    el('button', {
      class: 'btn', text: 'Randomise', onclick: () => {
        const pal = project().palette;
        for (const z of zones) project().zones[z.id] = solid(pal[Math.floor(Math.random() * pal.length)]);
        commit('randomise'); renderCanvas(); renderColourPage();
      },
    }),
    el('button', {
      class: 'btn', text: 'Invert', onclick: () => {
        for (const z of zones) {
          const p = project().zones[z.id];
          if (p) p.colors = p.colors.map((c) => {
            const n = parseInt(c.slice(1), 16);
            return `#${(0xffffff ^ n).toString(16).padStart(6, '0')}`;
          });
        }
        commit('invert'); renderCanvas(); renderColourPage();
      },
    })));

  // contrast helper
  const base = project().zones.body?.colors?.[0];
  const l = selectedLayer();
  const front = l?.fill?.colors?.[0];
  if (base && front) {
    const ratio = contrastRatio(base, front);
    page.appendChild(el('p', {
      class: 'small muted', style: { marginTop: '12px' },
      text: `Artwork vs body contrast: ${ratio}:1 — ${ratio >= 4.5 ? 'reads well from the stands' : 'low, consider an outline'}`,
    }));
  }
}

/* --------------------------------------------------------------- layers */

function layerPreview(l) {
  if (l.type === 'art') {
    const parts = buildArt(l.art, l.artParams);
    return `<svg viewBox="0 0 200 200">${parts.map((p) => `<path d="${p.d}" fill="#cfd8e6"/>`).join('')}</svg>`;
  }
  if (l.type === 'image') {
    const a = project().assets.find((x) => x.id === l.assetId);
    return a ? `<img src="${a.src}" style="width:100%;height:100%;object-fit:contain"/>` : '';
  }
  return `<svg viewBox="0 0 40 40"><text x="20" y="27" text-anchor="middle" font-size="22"
    font-family="${fontCss(l.font)}" fill="#cfd8e6">${(l.text || '?').slice(0, 1)}</text></svg>`;
}

function renderLayersPage() {
  const page = clear($('#rp-layers'));
  const layers = currentLayers();

  page.appendChild(el('div', { class: 'row', style: { marginBottom: '10px' } },
    el('button', { class: 'btn', text: '+ Text', onclick: () => addLayerOfType('text') }),
    el('button', { class: 'btn', text: '+ Graphic', onclick: () => addLayerOfType('art') })));

  if (!layers.length) {
    page.appendChild(el('div', { class: 'empty', text: 'No artwork on this view yet. Add text, a number or a graphic below the canvas.' }));
    return;
  }

  const list = el('div', { class: 'layer-list' });
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    const row = el('div', {
      class: `layer-row${store.selection === l.id ? ' is-active' : ''}`,
      onclick: () => { select(l.id); setRailPage('props'); renderCanvas(); renderRails(); },
    });
    const prev = el('div', { class: 'lp' });
    prev.innerHTML = layerPreview(l);
    row.append(prev, el('b', { text: l.name || l.text || l.type }));
    row.append(
      el('button', {
        class: 'mini', title: 'Visibility', text: l.visible === false ? '◌' : '●',
        onclick: (e) => { e.stopPropagation(); l.visible = l.visible === false; commit('visibility'); renderCanvas(); renderLayersPage(); },
      }),
      el('button', {
        class: 'mini', title: 'Lock', text: l.locked ? '🔒' : '🔓',
        onclick: (e) => { e.stopPropagation(); l.locked = !l.locked; commit('lock'); renderLayersPage(); },
      }),
      el('button', {
        class: 'mini', title: 'Bring forward', text: '↑',
        onclick: (e) => { e.stopPropagation(); moveLayer(l.id, 1); renderCanvas(); renderLayersPage(); },
      }),
      el('button', {
        class: 'mini', title: 'Send back', text: '↓',
        onclick: (e) => { e.stopPropagation(); moveLayer(l.id, -1); renderCanvas(); renderLayersPage(); },
      }),
      el('button', {
        class: 'mini', title: 'Duplicate', text: '⧉',
        onclick: (e) => { e.stopPropagation(); duplicateLayer(l.id); renderCanvas(); renderRails(); },
      }),
      el('button', {
        class: 'mini', title: 'Delete', text: '✕',
        onclick: (e) => { e.stopPropagation(); removeLayer(l.id); renderCanvas(); renderRails(); },
      }));
    list.appendChild(row);
  }
  page.appendChild(list);
}

/* ------------------------------------------------------------ properties */

function fontPicker(current, onPick) {
  const wrap = el('div', { class: 'field' }, el('label', { text: 'Typeface' }));
  const groupSel = el('select', { onchange: () => renderList() },
    ...FONT_GROUPS.map((g) => el('option', { value: g, selected: (FONTS.find((f) => f.id === current)?.group === g) }, g)));
  const list = el('div', { class: 'style-grid', style: { gridTemplateColumns: 'repeat(2,1fr)', maxHeight: '190px' } });
  function renderList() {
    clear(list);
    for (const f of FONTS.filter((x) => x.group === groupSel.value)) {
      const cell = el('div', {
        class: `style-cell${f.id === current ? ' is-active' : ''}`,
        onclick: () => { current = f.id; onPick(f.id); renderList(); },
      });
      cell.innerHTML = `<div style="font-family:${f.css};font-size:19px;text-align:center;padding:7px 2px;color:#e6eaf2;
        white-space:nowrap;overflow:hidden">Aa 24</div><span>${f.name}</span>`;
      list.appendChild(cell);
    }
  }
  renderList();
  wrap.append(groupSel, list);
  return wrap;
}

function outlineEditor(l) {
  const wrap = el('div');
  const redraw = () => { clear(wrap); build(); renderCanvas(); };
  function build() {
    (l.outlines || []).forEach((o, i) => {
      wrap.appendChild(el('div', { class: 'outline-row' },
        el('input', { type: 'color', value: o.color, oninput: (e) => { o.color = e.target.value; commit('outline', true); renderCanvas(); } }),
        el('input', {
          type: 'range', min: 1, max: 26, step: 0.5, value: o.width,
          oninput: (e) => { o.width = parseFloat(e.target.value); commit('outline', true); renderCanvas(); },
        }),
        el('button', { class: 'mini', text: '✕', onclick: () => { l.outlines.splice(i, 1); commit('outline'); redraw(); } })));
    });
    wrap.appendChild(el('button', {
      class: 'btn wide', text: '+ Add outline',
      onclick: () => {
        l.outlines = l.outlines || [];
        const last = l.outlines[l.outlines.length - 1];
        l.outlines.push({ color: last ? '#ffffff' : '#0b1120', width: (last?.width || 4) + 5 });
        commit('outline'); redraw();
      },
    }));
  }
  build();
  return wrap;
}

function shadowEditor(l) {
  const s = l.shadow || (l.shadow = { on: false, dx: 4, dy: 6, blur: 0, color: '#000000', opacity: 0.45 });
  const box = el('div');
  box.append(
    el('label', { class: 'row', style: { marginBottom: '8px', fontSize: '12px' } },
      el('input', { type: 'checkbox', checked: s.on, onchange: (e) => { s.on = e.target.checked; commit('shadow'); renderCanvas(); } }),
      'Drop shadow'),
    el('div', { class: 'grid2' },
      el('input', { type: 'color', value: s.color, oninput: (e) => { s.color = e.target.value; commit('shadow', true); renderCanvas(); } }),
      el('input', {
        type: 'number', value: s.opacity, min: 0, max: 1, step: 0.05, class: 'inp',
        oninput: (e) => { s.opacity = parseFloat(e.target.value); commit('shadow', true); renderCanvas(); },
      })),
    slider('Offset X', s.dx, -30, 30, 1, (v) => { s.dx = v; commit('shadow', true); renderCanvas(); }),
    slider('Offset Y', s.dy, -30, 30, 1, (v) => { s.dy = v; commit('shadow', true); renderCanvas(); }),
    slider('Blur', s.blur, 0, 20, 0.5, (v) => { s.blur = v; commit('shadow', true); renderCanvas(); }));
  return box;
}

function acc(title, body, open = false) {
  const d = el('details', { class: 'acc', open });
  d.append(el('summary', { text: title }), el('div', { class: 'acc-body' }, body));
  return d;
}

function renderPropsPage() {
  const page = clear($('#rp-props'));
  const l = selectedLayer();
  if (!l) {
    page.appendChild(el('div', { class: 'empty', text: 'Select artwork on the garment to edit it.' }));
    page.appendChild(el('div', { class: 'block-title', style: { marginTop: '18px' } }, 'Mockup'));
    page.appendChild(selectField('Texture', project().mockup.texture, ['fabric', 'knit', 'mesh', 'none'],
      (v) => { project().mockup.texture = v; $('#textureSel').value = v; commit('mockup'); renderCanvas(); }));
    return;
  }

  page.appendChild(el('div', { class: 'row', style: { marginBottom: '10px' } },
    el('input', {
      class: 'inp', value: l.name, style: { flex: '1' },
      oninput: (e) => { l.name = e.target.value; commit('rename', true); renderLayersPage(); },
    }),
    el('button', { class: 'btn danger', text: 'Delete', onclick: () => { removeLayer(l.id); renderCanvas(); renderRails(); } })));

  if (l.type !== 'image' && l.type !== 'art') {
    page.appendChild(textField('Text', l.text, (v) => {
      l.text = l.type === 'number' ? v.replace(/[^0-9]/g, '').slice(0, 3) : v;
      if (l.name === 'Text' || l.name === 'Number' || l.name === 'Player Name') l.name = l.text || l.name;
      commit('text', true); renderCanvas(); renderLayersPage();
    }, { multiline: l.type === 'text' }));

    page.appendChild(fontPicker(l.font, (id) => { l.font = id; commit('font'); renderCanvas(); }));
    page.appendChild(slider('Size', l.size, 10, 320, 1, (v) => { l.size = v; commit('size', true); renderCanvas(); }));
    page.appendChild(slider('Letter spacing', l.tracking, -20, 60, 0.5, (v) => { l.tracking = v; commit('tracking', true); renderCanvas(); }));
    page.appendChild(selectField('Shape', l.arc, TEXT_ARCS.map((a) => ({ value: a.id, label: a.name })),
      (v) => { l.arc = v; commit('arc'); renderCanvas(); renderPropsPage(); }));
    if (['arch', 'arch-down', 'bridge'].includes(l.arc)) {
      page.appendChild(slider('Curve', l.arcAmount, 4, 110, 1, (v) => { l.arcAmount = v; commit('curve', true); renderCanvas(); }));
    }
    page.appendChild(acc('Fill', paintEditor(l.fill, (next, live) => { l.fill = next; commit('fill', live); renderCanvas(); }), true));
    page.appendChild(acc('Outlines', outlineEditor(l)));
  }

  if (l.type === 'art') {
    const item = allArt().find((a) => a.id === l.art);
    page.appendChild(el('div', { class: 'field' }, el('label', { text: 'Graphic' }),
      el('button', { class: 'btn wide', text: `${item?.name || l.art} — change`, onclick: () => openArtPicker((id) => {
        l.art = id; l.artParams = defaultArtParams(id); commit('art'); renderCanvas(); renderPropsPage();
      }) })));
    if (item?.kind === 'generator' && item.params?.length) {
      for (const p of item.params) {
        page.appendChild(slider(p.label, l.artParams[p.k] ?? p.val, p.min, p.max, 1,
          (v) => { l.artParams[p.k] = v; commit('artparam', true); renderCanvas(); }));
      }
    }
    page.appendChild(slider('Size', l.size, 20, 460, 1, (v) => { l.size = v; commit('size', true); renderCanvas(); }));
    for (const role of ['primary', 'secondary', 'accent']) {
      page.appendChild(acc(`${role[0].toUpperCase()}${role.slice(1)} fill`,
        paintEditor(l.roleFills[role], (next, live) => { l.roleFills[role] = next; commit('rolefill', live); renderCanvas(); })));
    }
    page.appendChild(acc('Outlines', outlineEditor(l)));
  }

  if (l.type === 'image') {
    page.appendChild(slider('Size', l.size, 20, 560, 1, (v) => { l.size = v; commit('size', true); renderCanvas(); }));
  }

  page.appendChild(acc('Transform', el('div', {},
    el('div', { class: 'grid2' },
      el('div', { class: 'field' }, el('label', { text: 'X' }),
        el('input', { type: 'number', value: Math.round(l.x), oninput: (e) => { l.x = +e.target.value; commit('pos', true); renderCanvas(); } })),
      el('div', { class: 'field' }, el('label', { text: 'Y' }),
        el('input', { type: 'number', value: Math.round(l.y), oninput: (e) => { l.y = +e.target.value; commit('pos', true); renderCanvas(); } }))),
    slider('Rotation', l.rotation || 0, -180, 180, 1, (v) => { l.rotation = v; commit('rot', true); renderCanvas(); }),
    slider('Scale', (l.scale ?? 1) * 100, 8, 400, 1, (v) => { l.scale = v / 100; commit('scale', true); renderCanvas(); }, (v) => `${Math.round(v)}%`),
    slider('Opacity', (l.opacity ?? 1) * 100, 0, 100, 1, (v) => { l.opacity = v / 100; commit('opacity', true); renderCanvas(); }, (v) => `${Math.round(v)}%`),
    el('div', { class: 'row' },
      el('button', { class: 'btn', text: 'Centre X', onclick: () => { l.x = VB.w / 2; commit('align'); renderCanvas(); renderPropsPage(); } }),
      el('button', { class: 'btn', text: 'Reset', onclick: () => { l.rotation = 0; l.scale = 1; commit('reset'); renderCanvas(); renderPropsPage(); } })),
    el('div', { class: 'field', style: { marginTop: '10px' } }, el('label', { text: 'Snap into print area' }),
      el('select', {
        onchange: (e) => {
          const a = (garment().areas(project().view) || []).find((x) => x.id === e.target.value);
          if (!a) return;
          const b = layerBounds(l, project());
          l.x = a.x + a.w / 2;
          l.y = a.y + a.h / 2;
          const k = Math.min(a.w / (b.w / (l.scale ?? 1)), a.h / (b.h / (l.scale ?? 1)));
          l.scale = Math.max(0.08, k * 0.94);
          commit('snap'); renderCanvas(); renderPropsPage();
        },
      }, el('option', { value: '' }, 'Choose an area…'),
        ...(garment().areas(project().view) || []).map((a) => el('option', { value: a.id }, a.label)))))));

  page.appendChild(acc('Effects', shadowEditor(l)));

  const b = layerBounds(l, project());
  page.appendChild(el('p', {
    class: 'small muted', style: { marginTop: '10px' },
    text: `Print size ≈ ${inches(b.w)}in × ${inches(b.h)}in`,
  }));
}

/* --------------------------------------------------------------- adding */

export function addLayerOfType(kind) {
  const view = project().view;
  const areas = garment().areas(view) || [];
  const centre = areas[0] ? { x: areas[0].x + areas[0].w / 2, y: areas[0].y + areas[0].h / 2 } : { x: 300, y: 380 };
  const pal = project().palette;

  if (kind === 'text') {
    addLayer(newTextLayer({ x: centre.x, y: centre.y, fill: solid(pal[2] || '#ffffff'), outlines: [{ color: pal[0], width: 6 }] }));
  } else if (kind === 'number') {
    const a = areas.find((x) => x.id.includes('number')) || areas[0];
    addLayer(newNumberLayer({
      x: a ? a.x + a.w / 2 : 300, y: a ? a.y + a.h / 2 : 400,
      fill: solid(pal[1] || '#f2c14e'), outlines: [{ color: pal[0], width: 8 }],
    }));
  } else if (kind === 'name') {
    const a = areas.find((x) => x.id.includes('name')) || areas[0];
    addLayer(newNameLayer({
      x: a ? a.x + a.w / 2 : 300, y: a ? a.y + a.h / 2 : 300,
      fill: solid(pal[2] || '#ffffff'), outlines: [{ color: pal[0], width: 4 }],
    }));
  } else if (kind === 'art') {
    openArtPicker((id) => {
      addLayer(newArtLayer(id, {
        x: centre.x, y: centre.y,
        roleFills: { primary: solid(pal[1] || '#f2c14e'), secondary: solid(pal[2] || '#ffffff'), accent: solid(pal[0] || '#12233f') },
      }));
      setRailPage('props'); renderCanvas(); renderRails();
    });
    return;
  }
  setRailPage('props');
  renderCanvas();
  renderRails();
}

export async function addUpload() {
  const file = await pickFile('image/png,image/jpeg,image/webp,image/svg+xml');
  if (!file) return;
  try {
    const img = await readImage(file);
    const asset = addAsset({ name: file.name.replace(/\.[^.]+$/, ''), src: img.src, w: img.w, h: img.h });
    const areas = garment().areas(project().view) || [];
    const a = areas[0];
    setRailPage('props');
    addLayer(newImageLayer(asset.id, {
      name: asset.name,
      x: a ? a.x + a.w / 2 : 300,
      y: a ? a.y + a.h / 2 : 380,
      size: a ? Math.min(a.w, a.h) * 0.9 : 220,
    }));
    renderCanvas(); renderRails();
    toast(`${asset.name} added`);
  } catch {
    toast('Could not read that image', 'err');
  }
}

export function openArtPicker(onPick) {
  const wrap = el('div');
  const search = el('input', { class: 'search', placeholder: 'Search graphics…' });
  const grid = el('div', { class: 'library-body', style: { maxHeight: '58vh', overflow: 'auto' } });
  const draw = () => {
    clear(grid);
    const q = search.value.toLowerCase();
    const items = allArt().filter((a) =>
      !q || a.name.toLowerCase().includes(q) || (a.tags || []).some((t) => t.includes(q)) || a.group.toLowerCase().includes(q));
    for (const item of items) {
      const parts = buildArt(item.id);
      const card = el('div', {
        class: 'art-card',
        onclick: () => { closeModal(); onPick(item.id); },
      });
      card.innerHTML = `<svg viewBox="0 0 200 200">${parts
        .map((p) => (p.stroke
          ? `<path d="${p.d}" fill="none" stroke="${p.role === 'primary' ? '#e6eaf2' : '#7f8ca4'}" stroke-width="${p.stroke}"/>`
          : `<path d="${p.d}" fill="${p.role === 'primary' ? '#e6eaf2' : p.role === 'secondary' ? '#8f9cb5' : '#5a6478'}" fill-rule="evenodd"/>`))
        .join('')}</svg><span>${item.name}</span>`;
      grid.appendChild(card);
    }
    if (!items.length) grid.appendChild(el('div', { class: 'empty', text: 'Nothing matched that search.' }));
  };
  search.addEventListener('input', draw);
  draw();
  wrap.append(search, grid);
  openModal('Choose a graphic', wrap);
}

/* ------------------------------------------------- calls from other tabs */

export function addArtToDesign(artId) {
  const pal = project().palette;
  const areas = garment().areas(project().view) || [];
  const a = areas[0];
  addLayer(newArtLayer(artId, {
    x: a ? a.x + a.w / 2 : 300,
    y: a ? a.y + a.h / 2 : 340,
    roleFills: {
      primary: solid(pal[1] || '#f2c14e'),
      secondary: solid(pal[2] || '#ffffff'),
      accent: solid(pal[0] || '#12233f'),
    },
  }));
  renderCanvas();
  renderRails();
}

export function applyStyleToActiveZone(styleId) {
  const zones = garment().zones(project().view);
  if (!activeZone || !zones.some((z) => z.id === activeZone)) activeZone = zones[0]?.id;
  if (!activeZone) return;
  const cur = project().zones[activeZone];
  const pal = project().palette;
  project().zones[activeZone] = {
    style: styleId,
    colors: cur?.colors?.length >= 3 ? cur.colors : [pal[0] || '#12233f', pal[1] || '#f2c14e', pal[2] || '#ffffff'],
    params: {},
  };
  commit('style');
  renderCanvas();
  renderColourPage();
}

export function applyPaletteFromLibrary(colors) {
  project().palette = colors.slice();
  applyPaletteToRoles(colors);
  commit('palette');
  renderCanvas();
  renderRails();
}

export function getActiveZone() { return activeZone; }

/* ----------------------------------------------------------------- rails */

function setRailPage(name) {
  railPage = name;
  $$('#railTabs .rail-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.rt === name));
  $$('#tab-studio .rail-right .rail-page').forEach((p) => p.classList.toggle('is-active', p.id === `rp-${name}`));
}

export function renderRails() {
  renderColourPage();
  renderLayersPage();
  renderPropsPage();
}

export function render() {
  buildViewToggle();
  renderCanvas();
  renderRails();
  buildGarmentPicker();
  $('#projectName').value = project().name;
}

/* ------------------------------------------------------------------ init */

export function initStudio() {
  buildGarmentPicker();
  buildPresets();
  buildPalettes();
  buildViewToggle();
  computeFit();

  $('#harmonySeed').addEventListener('input', buildHarmony);
  $('#harmonyKind').addEventListener('change', buildHarmony);

  $$('#railTabs .rail-tab').forEach((t) => t.addEventListener('click', () => setRailPage(t.dataset.rt)));

  $('#zoomIn').addEventListener('click', () => { zoom = Math.min(4, zoom * 1.2); applyZoom(); });
  $('#zoomOut').addEventListener('click', () => { zoom = Math.max(0.25, zoom / 1.2); applyZoom(); });
  $('#zoomFit').addEventListener('click', () => { zoom = 1; computeFit(); applyZoom(); });

  $('#toggleAreas').addEventListener('click', (e) => {
    project().mockup.showAreas = !project().mockup.showAreas;
    e.target.classList.toggle('is-active', project().mockup.showAreas);
    commit('areas'); renderCanvas();
  });
  $('#toggleShading').addEventListener('click', (e) => {
    project().mockup.shading = !project().mockup.shading;
    e.target.classList.toggle('is-active', project().mockup.shading);
    commit('shading'); renderCanvas();
  });
  $('#toggleShading').classList.toggle('is-active', project().mockup.shading);
  $('#textureSel').addEventListener('change', (e) => { project().mockup.texture = e.target.value; commit('texture'); renderCanvas(); });
  $('#bgSel').addEventListener('change', (e) => { project().mockup.background = e.target.value; commit('bg'); renderCanvas(); });

  $$('.add-btn').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.add;
    if (k === 'upload') addUpload();
    else if (k === 'forge') emit('forge:import');
    else addLayerOfType(k);
  }));

  window.addEventListener('resize', () => { computeFit(); applyZoom(); });

  on('change', () => { $('#projectName').value = project().name; });
  on('select', () => { /* handled inline */ });

  // fonts can land after first paint; re-measure once ready
  if (document.fonts?.ready) document.fonts.ready.then(() => { renderCanvas(); });

  render();
}

export { measureText };
