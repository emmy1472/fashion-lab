/* cloPRO — Library tab: every built-in graphic, pattern, palette and typeface. */

import { el, $, clear, toast } from './common.js';
import { allArt, buildArt, ART_GROUPS } from '../data/graphics.js';
import { STYLES, buildPaint } from '../data/patterns.js';
import { PALETTES, FONTS } from '../data/library.js';
import { project, commit, selectedLayer, solid, addLayer, newTextLayer } from '../state.js';
import * as studio from './studio.js';

const SECTIONS = ['All', 'Graphics', 'Patterns', 'Palettes', 'Typefaces'];
let section = 'All';
let query = '';

function artSVG(item, size = 200) {
  const parts = buildArt(item.id);
  return `<svg viewBox="0 0 ${size} ${size}">${parts
    .map((p) => (p.stroke
      ? `<path d="${p.d}" fill="none" stroke="${p.role === 'primary' ? '#e6eaf2' : '#8f9cb5'}" stroke-width="${p.stroke}" stroke-linecap="round"/>`
      : `<path d="${p.d}" fill="${p.role === 'primary' ? '#e6eaf2' : p.role === 'secondary' ? '#8f9cb5' : '#5a6478'}" fill-rule="evenodd"/>`))
    .join('')}</svg>`;
}

let uidn = 0;
function styleSVG(style) {
  const colors = project().palette.length >= 3 ? project().palette : ['#12233f', '#f2c14e', '#ffffff'];
  const built = buildPaint(`lib${uidn++}`, { style: style.id, colors, params: {} });
  return `<svg viewBox="0 0 100 70" preserveAspectRatio="none"><defs>${built.defs}</defs>
    <rect width="100" height="70" fill="${built.fill}"/></svg>`;
}

function matches(text) {
  return !query || String(text).toLowerCase().includes(query);
}

export function renderLibrary() {
  const chips = clear($('#libTabs'));
  for (const s of SECTIONS) {
    chips.appendChild(el('button', {
      class: `chip${section === s ? ' is-active' : ''}`, text: s,
      onclick: () => { section = s; renderLibrary(); },
    }));
  }

  const body = clear($('#libraryBody'));
  const show = (name) => section === 'All' || section === name;

  if (show('Graphics')) {
    const items = allArt().filter((a) => matches(a.name) || matches(a.group) || (a.tags || []).some(matches));
    if (items.length) {
      body.appendChild(el('h3', { class: 'lib-section-title', text: `Graphics — ${items.length}` }));
      for (const group of ART_GROUPS) {
        for (const item of items.filter((i) => i.group === group)) {
          const card = el('div', {
            class: 'art-card', title: `${item.name} · ${item.group}`,
            onclick: () => {
              studio.addArtToDesign(item.id);
              toast(`${item.name} added to the design`);
            },
          });
          card.innerHTML = `${artSVG(item)}<span>${item.name}</span>`;
          body.appendChild(card);
        }
      }
    }
  }

  if (show('Patterns')) {
    const items = STYLES.filter((s) => matches(s.name) || matches(s.group));
    if (items.length) {
      body.appendChild(el('h3', { class: 'lib-section-title', text: `Fill styles — ${items.length}` }));
      for (const s of items) {
        const card = el('div', {
          class: 'art-card', title: `Apply ${s.name} to the selected garment part`,
          onclick: () => {
            studio.applyStyleToActiveZone(s.id);
            toast(`${s.name} applied`);
          },
        });
        card.innerHTML = `${styleSVG(s)}<span>${s.name}</span>`;
        body.appendChild(card);
      }
    }
  }

  if (show('Palettes')) {
    const items = PALETTES.filter((p) => matches(p.name) || matches(p.group));
    if (items.length) {
      body.appendChild(el('h3', { class: 'lib-section-title', text: `Palettes — ${items.length}` }));
      for (const p of items) {
        const card = el('div', { class: 'art-card', onclick: () => { studio.applyPaletteFromLibrary(p.colors); toast(`${p.name} applied`); } });
        card.innerHTML = `<div style="display:flex;height:82px;border-radius:7px;overflow:hidden">
          ${p.colors.map((c) => `<i style="flex:1;background:${c}"></i>`).join('')}</div><span>${p.name}</span>`;
        body.appendChild(card);
      }
    }
  }

  if (show('Typefaces')) {
    const items = FONTS.filter((f) => matches(f.name) || matches(f.group));
    if (items.length) {
      body.appendChild(el('h3', { class: 'lib-section-title', text: `Typefaces — ${items.length}` }));
      for (const f of items) {
        const card = el('div', {
          class: 'font-card', title: 'Apply to the selected text, or add new text',
          onclick: () => {
            const l = selectedLayer();
            if (l && l.type !== 'image' && l.type !== 'art') {
              l.font = f.id;
              commit('font');
              studio.renderCanvas();
              studio.renderRails();
              toast(`${f.name} applied to “${l.name}”`);
            } else {
              addLayer(newTextLayer({ font: f.id, text: 'TEAM', fill: solid(project().palette[2] || '#ffffff') }));
              studio.renderCanvas();
              studio.renderRails();
              toast(`Added text in ${f.name}`);
            }
          },
        });
        card.innerHTML = `<b style="font-family:${f.css}">Aa 23</b><span>${f.name} · ${f.group}${f.num ? ' · numbers' : ''}</span>`;
        body.appendChild(card);
      }
    }
  }

  if (!body.children.length) body.appendChild(el('div', { class: 'empty', text: 'Nothing matched that search.' }));
}

export function initLibrary() {
  $('#libSearch').addEventListener('input', (e) => { query = e.target.value.toLowerCase(); renderLibrary(); });
  renderLibrary();
}
