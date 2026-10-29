/* cloPRO — Export tab: mockups, print files and the handoff kit. */

import { el, $, clear, toast } from './common.js';
import { project, commit, garment } from '../state.js';
import { renderSVG } from '../render.js';
import { inches } from '../data/garments.js';
import { DECORATION_METHODS } from '../data/library.js';
import {
  exportMockupPNG, exportArtworkPNG, exportSVG, exportProject, exportRosterCSV,
  exportSpecPDF, exportKit, colorReport, transferSpec, specSheetHTML, artworkBox,
} from '../export.js';

function card(title, desc, ...kids) {
  return el('div', { class: 'export-card' },
    el('h3', { text: title }),
    desc ? el('p', { text: desc }) : null,
    ...kids);
}

function opt(title, sub, onclick) {
  return el('button', { class: 'export-opt', onclick },
    el('b', { text: title }),
    el('span', { text: sub }));
}

async function guard(fn, okMsg) {
  try {
    await fn();
    if (okMsg) toast(okMsg);
  } catch (e) {
    console.error(e);
    toast(e.message || 'Export failed', 'err');
  }
}

export function renderExport() {
  const wrap = clear($('#exportWrap'));
  const g = garment();
  const p = project();
  const spec = transferSpec(p);
  const colors = colorReport(p);
  const method = DECORATION_METHODS.find((m) => m.id === p.method) || DECORATION_METHODS[0];

  /* ---------------- previews ---------------- */
  const previews = el('div', { class: 'preview-pair' });
  for (const view of g.views) {
    const fig = el('figure');
    fig.innerHTML = renderSVG(p, { view, guides: false }) + `<figcaption class="small muted" style="text-align:center;margin-top:6px">${view}</figcaption>`;
    previews.appendChild(fig);
  }

  const main = el('div', { class: 'export-main' });

  main.appendChild(card('Mockups', 'What your team sees. Share these for approval before you order.',
    previews,
    el('div', { class: 'export-grid', style: { marginTop: '14px' } },
      ...g.views.map((v) => opt(`${v[0].toUpperCase() + v.slice(1)} mockup PNG`, '1800 × 2100 px, white background',
        () => guard(() => exportMockupPNG(p, v, 3), `${v} mockup downloaded`))))));

  main.appendChild(card('Print-ready artwork', 'Transparent 300 DPI files and true vector. These are what a printer needs.',
    el('div', { class: 'export-grid' },
      ...g.views.map((v) => {
        const box = artworkBox(p, v);
        const sub = box ? `${inches(box.w)}in × ${inches(box.h)}in at 300 DPI` : 'No artwork on this view yet';
        return opt(`${v[0].toUpperCase() + v.slice(1)} artwork PNG`, sub, () => guard(() => exportArtworkPNG(p, v, 300), `${v} print file downloaded`));
      }),
      ...g.views.map((v) => opt(`${v[0].toUpperCase() + v.slice(1)} artwork SVG`, 'Vector, fonts embedded — for twill, vinyl and screens',
        () => guard(() => exportSVG(p, v, { artworkOnly: true }), 'Vector artwork downloaded'))),
      opt('Full garment SVG', 'The complete mockup as editable vector',
        () => guard(() => exportSVG(p, p.view, { artworkOnly: false }), 'Garment SVG downloaded')))));

  main.appendChild(card('Hand off to a jersey builder',
    'cloPRO writes the spec the way an apparel decorator expects it: colours, placements in inches, sizes and a roster.',
    el('div', { class: 'field' },
      el('label', { text: 'Decoration method' }),
      el('select', {
        onchange: (e) => { p.method = e.target.value; commit('method'); renderExport(); },
      }, ...DECORATION_METHODS.map((m) => el('option', { value: m.id, selected: m.id === p.method }, m.name)))),
    el('p', { class: 'small muted', text: method.note }),
    colors.length > method.maxColors
      ? el('p', { class: 'small', style: { color: '#f4c04e' }, text: `Heads up: ${colors.length} colours used but ${method.name} allows ${method.maxColors}. Consolidate colours or switch method.` })
      : el('p', { class: 'small', style: { color: '#37e2b0' }, text: `${colors.length} colours — within the ${method.maxColors}-colour limit for ${method.name}.` }),
    el('div', { class: 'export-grid', style: { marginTop: '12px' } },
      opt('Complete handoff kit (.zip)', 'Mockups + 300 DPI print files + SVG + spec + roster + project',
        () => guard(() => exportKit(p, (msg) => toast(msg)), 'Kit downloaded')),
      opt('Spec sheet PDF', 'One page: mockups, colours, placements, roster',
        () => guard(() => exportSpecPDF(p), 'Spec sheet downloaded')),
      opt('Transfer JSON', 'clopro-transfer v1 — machine readable design import',
        () => {
          const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'clopro-transfer.json';
          a.click();
          toast('transfer.json downloaded');
        }),
      opt('Roster CSV', 'Names, numbers, sizes and quantities',
        () => { exportRosterCSV(p); toast('roster.csv downloaded'); }),
      opt('Preview spec sheet', 'Open the printable spec in a new tab',
        () => {
          const w = window.open('', '_blank');
          if (!w) return toast('Allow pop-ups to preview the spec', 'err');
          w.document.write(specSheetHTML(p));
          w.document.close();
        }),
      opt('Project file (.clopro.json)', 'Re-openable design — keep it or send it on',
        () => { exportProject(p); toast('Project file saved'); }))));

  main.appendChild(card('Upload guide',
    'Step-by-step for the big print-on-demand designers.',
    el('div', { class: 'spec-list' },
      ...[
        ['Custom Ink', 'Start a design → pick a similar style → “Add Art” → “Upload Your Own” → choose the 300 DPI artwork PNG → set the width from the spec sheet.'],
        ['Printful / Printify', 'Create product → upload artwork PNG → the file is already 300 DPI so the print-area warning stays green.'],
        ['Team jersey builders', 'Send the ZIP kit. transfer.json carries garment, colours, placements and the roster.'],
        ['Screen printer', 'Send the SVG plus the spec sheet PDF — it lists every ink colour and its placement size.'],
      ].map(([k, v]) => el('div', {}, el('b', { text: k }), el('span', { style: { maxWidth: '65%', textAlign: 'right' }, text: v }))))));

  /* ---------------- sidebar ---------------- */
  const side = el('div', { class: 'export-main' });

  side.appendChild(card('Summary', '',
    el('div', { class: 'spec-list' },
      el('div', {}, 'Garment', el('b', { text: g.name })),
      el('div', {}, 'Fabric', el('b', { text: g.fabric, style: { maxWidth: '60%', textAlign: 'right' } })),
      el('div', {}, 'Method', el('b', { text: method.name })),
      el('div', {}, 'Colours', el('b', { text: String(colors.length) })),
      el('div', {}, 'Artwork pieces', el('b', { text: String(spec.placements.length) })),
      el('div', {}, 'Players', el('b', { text: String(spec.roster.length) })),
      el('div', {}, 'Total pieces', el('b', { text: String(spec.totalPieces) })))));

  side.appendChild(card('Colour list', 'Nearest stock apparel colour for each hex.',
    el('div', { class: 'color-chips' },
      ...colors.map((c) => el('div', { class: 'color-chip' },
        el('i', { style: { background: c.hex } }),
        el('b', { text: c.name }),
        el('span', { text: c.hex.toUpperCase() }))))));

  side.appendChild(card('Placements', 'Measured from the flat garment, in inches.',
    spec.placements.length
      ? el('div', { class: 'spec-list' }, ...spec.placements.map((pl) =>
        el('div', {}, `${pl.view} · ${pl.area}`, el('b', { text: `${pl.widthInches}″ × ${pl.heightInches}″` }))))
      : el('div', { class: 'empty', text: 'No artwork placed yet.' })));

  wrap.append(main, side);
}

export function initExport() {
  renderExport();
}
