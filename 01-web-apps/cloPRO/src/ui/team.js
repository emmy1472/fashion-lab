/* cloPRO — Team tab: roster management and per-player previews. */

import { el, $, clear, toast, openModal, closeModal } from './common.js';
import { project, commit, garment } from '../state.js';
import { renderSVG } from '../render.js';
import { VB } from '../data/garments.js';
import { exportRosterCSV } from '../export.js';

/** Swap name/number text for a player, without touching the live project. */
export function projectForPlayer(player) {
  const p = JSON.parse(JSON.stringify(project()));
  for (const view of Object.keys(p.layers)) {
    for (const l of p.layers[view]) {
      if (l.type === 'name') l.text = String(player.name || '').toUpperCase();
      if (l.type === 'number') l.text = String(player.number ?? '');
    }
  }
  return p;
}

function renderRoster() {
  const wrap = clear($('#rosterTable'));
  const g = garment();
  const roster = project().roster;

  wrap.appendChild(el('div', { class: 'roster-head' },
    el('span', { text: 'Player' }), el('span', { text: 'No.' }),
    el('span', { text: 'Size' }), el('span', { text: 'Qty' }), el('span')));

  roster.forEach((r, i) => {
    const row = el('div', { class: 'roster-row' },
      el('input', {
        type: 'text', value: r.name, placeholder: 'SURNAME',
        oninput: (e) => { r.name = e.target.value.toUpperCase(); e.target.value = r.name; commit('roster', true); schedulePreview(); },
      }),
      el('input', {
        type: 'text', value: r.number, placeholder: '00', maxlength: 3,
        oninput: (e) => { r.number = e.target.value.replace(/[^0-9]/g, ''); e.target.value = r.number; commit('roster', true); schedulePreview(); },
      }),
      el('select', { onchange: (e) => { r.size = e.target.value; commit('roster'); } },
        ...g.sizes.map((s) => el('option', { value: s, selected: s === r.size }, s))),
      el('input', {
        type: 'number', min: 1, max: 99, value: r.qty || 1,
        oninput: (e) => { r.qty = Math.max(1, +e.target.value || 1); commit('roster', true); },
      }),
      el('button', {
        class: 'mini', text: '✕', title: 'Remove',
        onclick: () => { roster.splice(i, 1); commit('roster'); renderTeam(); },
      }));
    wrap.appendChild(row);
  });

  if (!roster.length) wrap.appendChild(el('div', { class: 'empty', text: 'No players yet. Add one, or paste a list.' }));

  const total = roster.reduce((s, r) => s + (Number(r.qty) || 1), 0);
  wrap.appendChild(el('p', { class: 'small muted', style: { marginTop: '10px' }, text: `${roster.length} players · ${total} pieces` }));
}

function renderMeta() {
  const wrap = clear($('#teamMeta'));
  const m = project().meta;
  const field = (label, key, ph = '') => el('div', { class: 'field' },
    el('label', { text: label }),
    el('input', { type: 'text', value: m[key] || '', placeholder: ph, oninput: (e) => { m[key] = e.target.value; commit('meta', true); } }));
  wrap.append(
    field('Team name', 'team', 'Riverside Titans'),
    field('Organisation', 'org', 'Riverside High'),
    field('Contact email', 'contact', 'coach@example.com'),
    field('Needed by', 'dueDate', '2026-10-01'));
  const notes = el('div', { class: 'field', style: { gridColumn: '1 / -1' } },
    el('label', { text: 'Notes for the printer' }),
    el('textarea', { oninput: (e) => { m.notes = e.target.value; commit('meta', true); } }));
  notes.querySelector('textarea').value = m.notes || '';
  wrap.appendChild(notes);
}

let previewTimer = null;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreviews, 320);
}

function renderPreviews() {
  const wrap = clear($('#rosterPreview'));
  const g = garment();
  const view = g.views.includes('back') ? 'back' : g.views[0];
  const roster = project().roster.slice(0, 24);
  if (!roster.length) {
    wrap.appendChild(el('div', { class: 'empty', text: 'Add players to preview their jerseys.' }));
    return;
  }
  for (const r of roster) {
    const fig = el('figure');
    fig.innerHTML = renderSVG(projectForPlayer(r), { view, guides: false, width: 130, height: (130 * VB.h) / VB.w })
      + `<figcaption>${r.number || '—'} · ${r.name || 'unnamed'} · ${r.size}</figcaption>`;
    wrap.appendChild(fig);
  }
}

function pasteList() {
  const box = el('div');
  const ta = el('textarea', {
    class: 'inp', style: { width: '100%', minHeight: '220px', fontFamily: 'var(--mono)' },
    placeholder: 'SMITH, 23, L\nGARCIA, 7, M\nOKAFOR 11 XL',
  });
  box.append(
    el('p', { class: 'muted small', text: 'One player per line: name, number, size. Commas, tabs or spaces all work.' }),
    ta,
    el('div', { class: 'row', style: { marginTop: '12px' } },
      el('button', {
        class: 'btn primary', text: 'Import players',
        onclick: () => {
          const g = garment();
          const lines = ta.value.split('\n').map((l) => l.trim()).filter(Boolean);
          let added = 0;
          for (const line of lines) {
            const parts = line.split(/[,\t]+|\s{2,}|\s(?=\d)|\s(?=[A-Z0-9]{1,3}$)/).map((s) => s.trim()).filter(Boolean);
            const name = (parts[0] || '').toUpperCase();
            const number = (parts.find((p) => /^\d{1,3}$/.test(p)) || '').trim();
            const size = parts.find((p) => g.sizes.includes(p.toUpperCase())) || 'L';
            if (!name) continue;
            project().roster.push({ name, number, size: size.toUpperCase(), qty: 1 });
            added++;
          }
          commit('roster');
          closeModal();
          renderTeam();
          toast(`${added} player${added === 1 ? '' : 's'} imported`);
        },
      }),
      el('button', { class: 'btn', text: 'Cancel', onclick: closeModal })));
  openModal('Paste a roster', box);
}

export function renderTeam() {
  renderRoster();
  renderMeta();
  renderPreviews();
}

export function initTeam() {
  $('#rosterAdd').addEventListener('click', () => {
    project().roster.push({ name: '', number: '', size: 'L', qty: 1 });
    commit('roster');
    renderTeam();
  });
  $('#rosterPaste').addEventListener('click', pasteList);
  $('#rosterCsv').addEventListener('click', () => { exportRosterCSV(project()); toast('roster.csv downloaded'); });
}
