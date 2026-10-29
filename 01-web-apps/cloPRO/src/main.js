/* cloPRO — bootstrap and app-level wiring. */

import {
  store, project, load, save, commit, undo, redo, on, emit, newProject, loadProject,
  gallery, saveToGallery, deleteFromGallery, garment, selectedLayer, removeLayer, duplicateLayer, moveLayer,
} from './state.js';
import { $, $$, el, clear, toast, initModal, openModal, closeModal, pickFile } from './ui/common.js';
import * as studio from './ui/studio.js';
import { initForge, forgeResizeIfVisible, forgeUndo, forgeRedo } from './ui/forge.js';
import { initLibrary, renderLibrary } from './ui/library.js';
import { initTeam, renderTeam } from './ui/team.js';
import { initExport, renderExport } from './ui/exporter.js';
import { thumbnail, exportKit } from './export.js';
import { garmentList, CATEGORIES } from './data/garments.js';

let activeTab = 'studio';

/* ------------------------------------------------------------------ tabs */

function setTab(name) {
  activeTab = name;
  $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
  $$('.panel').forEach((p) => p.classList.toggle('is-active', p.id === `tab-${name}`));
  if (name === 'forge') forgeResizeIfVisible();
  if (name === 'library') renderLibrary();
  if (name === 'team') renderTeam();
  if (name === 'export') renderExport();
  if (name === 'studio') studio.renderCanvas();
}

/* ---------------------------------------------------------------- dialogs */

function newProjectDialog() {
  const box = el('div');
  box.appendChild(el('p', { class: 'muted', text: 'Pick a starting garment. Your current design is autosaved — save it to My Designs first if you want to keep it.' }));
  const grid = el('div', { class: 'library-body', style: { maxHeight: '58vh', overflow: 'auto' } });
  for (const cat of CATEGORIES) {
    const items = garmentList().filter((g) => g.category === cat);
    if (!items.length) continue;
    grid.appendChild(el('h3', { class: 'lib-section-title', text: cat }));
    for (const g of items) {
      const card = el('div', {
        class: 'art-card',
        onclick: () => {
          newProject(g.id);
          closeModal();
          studio.render();
          setTab('studio');
          toast(`New ${g.name} started`);
        },
      });
      card.innerHTML = `<div style="height:82px">${(() => {
        const zones = g.zones('front');
        const colors = { primary: '#59657e', secondary: '#7d8aa4', accent: '#aab4c8', tertiary: '#48536a' };
        return `<svg viewBox="0 0 600 700" style="height:100%;width:100%">${zones.map((z) => (z.strokeOnly
          ? `<path d="${z.d}" fill="none" stroke="${colors[z.role]}" stroke-width="${z.width || 5}"/>`
          : `<path d="${z.d}" fill="${colors[z.role] || '#666'}"/>`)).join('')}</svg>`;
      })()}</div><span>${g.name}</span>`;
      grid.appendChild(card);
    }
  }
  box.appendChild(grid);
  openModal('Start a new design', box);
}

async function myDesignsDialog() {
  const box = el('div');
  const actions = el('div', { class: 'row', style: { marginBottom: '14px' } },
    el('button', {
      class: 'btn primary', text: 'Save current design',
      onclick: async () => {
        const thumb = await thumbnail(project());
        saveToGallery(thumb);
        toast('Saved to My Designs');
        draw();
      },
    }),
    el('button', {
      class: 'btn', text: 'Open .clopro.json…',
      onclick: async () => {
        const f = await pickFile('.json,application/json');
        if (!f) return;
        try {
          const text = await f.text();
          loadProject(JSON.parse(text));
          closeModal();
          studio.render();
          setTab('studio');
          toast('Project loaded');
        } catch {
          toast('That file could not be read', 'err');
        }
      },
    }));
  const grid = el('div', { class: 'gallery-grid' });
  function draw() {
    clear(grid);
    const list = gallery();
    if (!list.length) {
      grid.appendChild(el('div', { class: 'empty', text: 'Nothing saved yet. Save the current design to start your library.' }));
      return;
    }
    for (const entry of list) {
      const card = el('div', {
        class: 'gallery-card',
        onclick: () => {
          loadProject(entry.project);
          closeModal();
          studio.render();
          setTab('studio');
          toast(`Opened “${entry.project.name}”`);
        },
      });
      card.innerHTML = `${entry.thumb ? `<img src="${entry.thumb}" alt=""/>` : '<div class="empty">no preview</div>'}
        <b>${entry.project.name}</b><span>${new Date(entry.updated).toLocaleDateString()}</span>`;
      card.appendChild(el('button', {
        class: 'btn danger', text: 'Delete', style: { marginTop: '6px', width: '100%' },
        onclick: (e) => { e.stopPropagation(); deleteFromGallery(entry.project.id); draw(); },
      }));
      grid.appendChild(card);
    }
  }
  draw();
  box.append(actions, grid);
  openModal('My Designs', box);
}

/* ------------------------------------------------------------- shortcuts */

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

function bindShortcuts() {
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (activeTab === 'forge') { e.shiftKey ? forgeRedo() : forgeUndo(); return; }
      if (e.shiftKey ? redo() : undo()) { studio.render(); }
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      if (activeTab === 'forge') forgeRedo();
      else if (redo()) studio.render();
      return;
    }
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      thumbnail(project()).then((t) => { saveToGallery(t); toast('Saved to My Designs'); });
      return;
    }
    if (isTyping(e)) return;

    if (activeTab !== 'studio') return;
    const l = selectedLayer();

    if (mod && e.key.toLowerCase() === 'd' && l) { e.preventDefault(); duplicateLayer(l.id); studio.renderCanvas(); studio.renderRails(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && l) { e.preventDefault(); removeLayer(l.id); studio.renderCanvas(); studio.renderRails(); return; }
    if (e.key === '[' && l) { moveLayer(l.id, -1); studio.renderCanvas(); studio.renderRails(); return; }
    if (e.key === ']' && l) { moveLayer(l.id, 1); studio.renderCanvas(); studio.renderRails(); return; }

    if (l && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') l.y -= step;
      if (e.key === 'ArrowDown') l.y += step;
      if (e.key === 'ArrowLeft') l.x -= step;
      if (e.key === 'ArrowRight') l.x += step;
      commit('nudge', true);
      studio.renderCanvas();
    }
  });
}

/* ------------------------------------------------------------------ boot */

function boot() {
  initModal();

  const restored = load();
  studio.initStudio();
  initForge();
  initLibrary();
  initTeam();
  initExport();

  $$('.tab').forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));

  $('#projectName').addEventListener('input', (e) => { project().name = e.target.value; save(); });
  $('#btnUndo').addEventListener('click', () => { if (activeTab === 'forge') forgeUndo(); else if (undo()) studio.render(); });
  $('#btnRedo').addEventListener('click', () => { if (activeTab === 'forge') forgeRedo(); else if (redo()) studio.render(); });
  $('#btnNew').addEventListener('click', newProjectDialog);
  $('#btnMyDesigns').addEventListener('click', myDesignsDialog);
  $('#btnQuickExport').addEventListener('click', () => {
    setTab('export');
    toast('Pick a format — the ZIP kit has everything');
  });

  on('tab', (name) => setTab(name));
  on('studio:refresh', () => { studio.render(); });
  on('forge:import', () => { setTab('forge'); toast('Build your artwork, then “Send to Studio”'); });

  bindShortcuts();

  window.addEventListener('beforeunload', () => save());

  $('#projectName').value = project().name;
  if (restored) toast('Picked up where you left off');

  // expose a tiny console API for power users
  window.cloPRO = {
    project, store, exportKit: () => exportKit(project(), (m) => toast(m)),
    garments: () => garmentList().map((g) => g.id),
  };

  void garment;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
