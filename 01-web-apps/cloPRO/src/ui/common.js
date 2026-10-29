/* cloPRO — shared UI helpers: DOM building, toasts, modals, paint editor. */

import { STYLES, STYLE_GROUPS, buildPaint, defaultStyleParams, STYLE_MAP } from '../data/patterns.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/* ------------------------------------------------------------------ toast */

export function toast(msg, kind = '') {
  const wrap = $('#toasts');
  const t = el('div', { class: `toast ${kind}`, text: msg });
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
    setTimeout(() => t.remove(), 320);
  }, kind === 'err' ? 4200 : 2400);
}

/* ------------------------------------------------------------------ modal */

let modalOnClose = null;

export function openModal(title, content, onClose) {
  $('#modalTitle').textContent = title;
  const body = clear($('#modalBody'));
  if (typeof content === 'string') body.innerHTML = content;
  else body.appendChild(content);
  $('#modalBack').hidden = false;
  modalOnClose = onClose || null;
}

export function closeModal() {
  $('#modalBack').hidden = true;
  if (modalOnClose) { const f = modalOnClose; modalOnClose = null; f(); }
}

export function initModal() {
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBack').addEventListener('mousedown', (e) => { if (e.target.id === 'modalBack') closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#modalBack').hidden) closeModal();
  });
}

/* ---------------------------------------------------------------- fields */

export function slider(label, value, min, max, step, oninput, format = (v) => v) {
  const out = el('output', { text: format(value) });
  const input = el('input', {
    type: 'range', min, max, step, value,
    oninput: (e) => {
      const v = parseFloat(e.target.value);
      out.textContent = format(v);
      oninput(v);
    },
  });
  return el('div', { class: 'field' },
    el('label', { text: label }),
    el('div', { class: 'range-row' }, input, out));
}

export function selectField(label, value, options, onchange) {
  const sel = el('select', { onchange: (e) => onchange(e.target.value) },
    ...options.map((o) => el('option', { value: o.value ?? o, selected: (o.value ?? o) === value }, o.label ?? o)));
  return el('div', { class: 'field' }, el('label', { text: label }), sel);
}

export function textField(label, value, oninput, opts = {}) {
  const tag = opts.multiline ? 'textarea' : 'input';
  const input = el(tag, { type: 'text', value, oninput: (e) => oninput(e.target.value), placeholder: opts.placeholder || '' });
  if (opts.multiline) input.value = value;
  return el('div', { class: 'field' }, el('label', { text: label }), input);
}

export function colorField(label, value, onchange) {
  return el('div', { class: 'field' },
    el('label', { text: label }),
    el('input', { type: 'color', value, oninput: (e) => onchange(e.target.value) }));
}

export function buttonRow(...buttons) {
  return el('div', { class: 'row', style: { marginBottom: '10px' } }, ...buttons);
}

/* ------------------------------------------------------------ swatch preview */

let swatchUid = 0;
export function paintSwatchSVG(p, w = 60, h = 34) {
  const built = buildPaint(`sw${swatchUid++}`, p);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs>${built.defs}</defs>
    <rect width="${w}" height="${h}" fill="${built.fill}"/></svg>`;
}

export function paintCss(p) {
  // quick approximation for HTML swatches
  if (!p) return '#888';
  if (p.style === 'solid') return p.colors[0];
  if (p.style === 'linear') return `linear-gradient(${(p.params?.angle ?? 90)}deg, ${p.colors[0]}, ${p.colors[1]})`;
  if (p.style === 'radial') return `radial-gradient(circle, ${p.colors[1]}, ${p.colors[0]})`;
  const c = p.colors;
  return `repeating-linear-gradient(45deg, ${c[0]} 0 6px, ${c[1] || c[0]} 6px 12px)`;
}

/* -------------------------------------------------------------- paint editor */

/**
 * Full fill editor: style picker, colour slots and per-style parameters.
 * `onChange(paint)` fires on every tweak; `live` marks continuous edits.
 */
export function paintEditor(paint, onChange, opts = {}) {
  const wrap = el('div', { class: 'paint-editor' });
  const state = JSON.parse(JSON.stringify(paint || { style: 'solid', colors: ['#ffffff'], params: {} }));

  const fire = (live) => onChange(JSON.parse(JSON.stringify(state)), live);

  const groupChips = el('div', { class: 'chips' });
  const grid = el('div', { class: 'style-grid' });
  const params = el('div');
  const colors = el('div', { class: 'color-slots' });

  let activeGroup = STYLE_MAP[state.style]?.group || 'Basic';

  function renderColors() {
    clear(colors);
    const need = STYLE_MAP[state.style]?.colors || 1;
    const fallback = ['#101418', '#ffffff', '#d62828'];
    while (state.colors.length < need) state.colors.push(fallback[state.colors.length] || '#888888');
    for (let i = 0; i < need; i++) {
      colors.appendChild(el('input', {
        type: 'color', value: state.colors[i], title: `Colour ${i + 1}`,
        oninput: (e) => { state.colors[i] = e.target.value; renderGrid(); fire(true); },
      }));
    }
  }

  function renderParams() {
    clear(params);
    const style = STYLE_MAP[state.style];
    if (!style) return;
    state.params = { ...defaultStyleParams(state.style), ...state.params };
    for (const p of style.params) {
      params.appendChild(slider(p.label, state.params[p.k] ?? p.val, p.min, p.max, (p.max - p.min) > 20 ? 1 : 0.5,
        (v) => { state.params[p.k] = v; renderGrid(); fire(true); }));
    }
  }

  function renderGrid() {
    clear(grid);
    for (const s of STYLES.filter((x) => x.group === activeGroup)) {
      const preview = { style: s.id, colors: state.colors, params: state.style === s.id ? state.params : {} };
      const cell = el('div', {
        class: `style-cell${state.style === s.id ? ' is-active' : ''}`,
        title: s.name,
        onclick: () => {
          state.style = s.id;
          state.params = defaultStyleParams(s.id);
          renderColors(); renderParams(); renderGrid(); fire(false);
        },
      });
      cell.innerHTML = paintSwatchSVG(preview, 60, 34) + `<span>${s.name}</span>`;
      grid.appendChild(cell);
    }
  }

  for (const g of STYLE_GROUPS) {
    groupChips.appendChild(el('button', {
      class: `chip${g === activeGroup ? ' is-active' : ''}`, text: g,
      onclick: (e) => {
        activeGroup = g;
        [...groupChips.children].forEach((c) => c.classList.toggle('is-active', c === e.target));
        renderGrid();
      },
    }));
  }

  renderColors(); renderParams(); renderGrid();
  wrap.append(groupChips, grid, colors, params);
  if (opts.footer) wrap.appendChild(opts.footer);
  return wrap;
}

/* ------------------------------------------------------------------ files */

export function pickFile(accept = 'image/*') {
  return new Promise((resolve) => {
    const input = el('input', { type: 'file', accept, style: { display: 'none' } });
    input.addEventListener('change', () => { resolve(input.files[0] || null); input.remove(); });
    document.body.appendChild(input);
    input.click();
  });
}

export function readImage(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ src: fr.result, w: img.naturalWidth, h: img.naturalHeight, name: file.name });
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export function readText(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsText(file);
  });
}
