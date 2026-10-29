/* cloPRO — export pipeline.
 * Produces: mockup PNG, print-ready artwork PNG (300 DPI, transparent),
 * vector SVG, a real PDF spec sheet, roster CSV, the .clopro project file
 * and a ZIP "handoff kit" shaped for Custom Ink / team jersey builders.
 */

import { renderSVG, renderArtworkSVG, layerBounds } from './render.js';
import { getGarment, PX_PER_INCH, inches, VB } from './data/garments.js';
import { FONTS, fontCss, nearestName, SIZE_CHART, DECORATION_METHODS } from './data/library.js';

/* ------------------------------------------------------------ font inline */

const fontCache = new Map();

function familiesIn(svg) {
  const out = new Set();
  const re = /font-family="([^"]+)"/g;
  let m;
  while ((m = re.exec(svg))) {
    const first = m[1].split(',')[0].replace(/['"]/g, '').trim();
    if (first) out.add(first);
  }
  return [...out];
}

async function faceFor(family) {
  if (fontCache.has(family)) return fontCache.get(family);
  const meta = FONTS.find((f) => f.id === family);
  const promise = (async () => {
    try {
      const w = meta?.weight ? `:wght@${meta.weight}` : '';
      const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}${w}`;
      const css = await fetch(url).then((r) => (r.ok ? r.text() : ''));
      const urls = [...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
      if (!urls.length) return '';
      const chunks = [];
      // latin subsets last in Google's CSS; take the final few for coverage
      for (const u of urls.slice(-2)) {
        const buf = await fetch(u).then((r) => r.arrayBuffer());
        let bin = '';
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        chunks.push(`@font-face{font-family:'${family}';font-style:normal;font-weight:${meta?.weight || 400};
          src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2');}`);
      }
      return chunks.join('\n');
    } catch (e) {
      console.warn('cloPRO: could not embed font', family, e);
      return '';
    }
  })();
  fontCache.set(family, promise);
  return promise;
}

export async function embedFonts(svg) {
  const fams = familiesIn(svg).filter((f) => FONTS.some((x) => x.id === f));
  if (!fams.length) return svg;
  const faces = (await Promise.all(fams.map(faceFor))).filter(Boolean).join('\n');
  if (!faces) return svg;
  return svg.replace('<defs>', `<defs><style type="text/css"><![CDATA[\n${faces}\n]]></style>`);
}

/* -------------------------------------------------------------- rasterise */

export function svgToImage(svg) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function rasterise(svg, width, height, { background = null, embed = true } = {}) {
  const src = embed ? await embedFonts(svg) : svg;
  const img = await svgToImage(src);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  const ctx = c.getContext('2d');
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((res) => canvas.toBlob(res, type, quality));
}

/* ------------------------------------------------------------- downloads */

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const slug = (s) =>
  String(s || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'design';

/* ------------------------------------------------------------- mockup PNG */

export async function mockupCanvas(project, view, scale = 2, background = null) {
  const svg = renderSVG(project, { view, guides: false });
  return rasterise(svg, VB.w * scale, VB.h * scale, { background });
}

export async function exportMockupPNG(project, view, scale = 3) {
  const c = await mockupCanvas(project, view, scale, '#ffffff');
  const blob = await canvasToBlob(c);
  download(blob, `${slug(project.name)}-${view}-mockup.png`);
}

/* --------------------------------------------------- artwork (print) PNG */

/** Tight bounds around every visible decoration, in canvas units. */
export function artworkBox(project, view, pad = 12) {
  const layers = (project.layers[view] || []).filter((l) => l.visible !== false);
  if (!layers.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const l of layers) {
    const b = layerBounds(l, project);
    const r = Math.abs(Math.sin(((l.rotation || 0) * Math.PI) / 180));
    const w = b.w * (1 - r) + b.h * r;
    const h = b.h * (1 - r) + b.w * r;
    x0 = Math.min(x0, b.x - w / 2);
    x1 = Math.max(x1, b.x + w / 2);
    y0 = Math.min(y0, b.y - h / 2);
    y1 = Math.max(y1, b.y + h / 2);
  }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}

export async function artworkCanvas(project, view, dpi = 300) {
  const box = artworkBox(project, view);
  if (!box) return null;
  const svg = renderArtworkSVG(project, view, { box });
  const wIn = box.w / PX_PER_INCH;
  const hIn = box.h / PX_PER_INCH;
  return rasterise(svg, wIn * dpi, hIn * dpi, { background: null });
}

export async function exportArtworkPNG(project, view, dpi = 300) {
  const c = await artworkCanvas(project, view, dpi);
  if (!c) throw new Error('No artwork on this view yet.');
  const blob = await canvasToBlob(c);
  download(blob, `${slug(project.name)}-${view}-artwork-${dpi}dpi.png`);
}

/* -------------------------------------------------------------- vector SVG */

export async function exportSVG(project, view, { artworkOnly = false, embed = true } = {}) {
  const box = artworkOnly ? artworkBox(project, view) : null;
  let svg = artworkOnly ? renderArtworkSVG(project, view, { box }) : renderSVG(project, { view, guides: false });
  if (embed) svg = await embedFonts(svg);
  download(new Blob([svg], { type: 'image/svg+xml' }), `${slug(project.name)}-${view}${artworkOnly ? '-artwork' : ''}.svg`);
}

/* ------------------------------------------------------------ project file */

export function exportProject(project) {
  const data = JSON.stringify({ ...project, exported: new Date().toISOString(), app: 'cloPRO' }, null, 2);
  download(new Blob([data], { type: 'application/json' }), `${slug(project.name)}.clopro.json`);
}

/* ------------------------------------------------------------------ roster */

export function rosterCSV(project) {
  const rows = [['Name', 'Number', 'Size', 'Qty', 'Garment', 'Chest (in)', 'Body Length (in)']];
  const g = getGarment(project.garment);
  for (const r of project.roster || []) {
    const sz = SIZE_CHART[r.size] || {};
    rows.push([r.name, r.number, r.size, r.qty || 1, g.name, sz.chest || '', sz.length || '']);
  }
  return rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

export function exportRosterCSV(project) {
  download(new Blob([rosterCSV(project)], { type: 'text/csv' }), `${slug(project.name)}-roster.csv`);
}

/* ------------------------------------------------------------- colour list */

export function colorReport(project) {
  const used = new Map();
  const push = (hex, where) => {
    if (!hex || !/^#/.test(hex)) return;
    const k = hex.toLowerCase();
    if (!used.has(k)) used.set(k, { hex: k, name: nearestName(k), where: new Set() });
    used.get(k).where.add(where);
  };
  const g = getGarment(project.garment);
  for (const view of g.views) {
    for (const z of g.zones(view)) {
      const p = project.zones[z.id];
      (p?.colors || []).forEach((c) => push(c, z.label));
    }
    for (const l of project.layers[view] || []) {
      (l.fill?.colors || []).forEach((c) => push(c, l.name));
      Object.values(l.roleFills || {}).forEach((f) => (f.colors || []).forEach((c) => push(c, l.name)));
      (l.outlines || []).forEach((o) => push(o.color, `${l.name} outline`));
    }
  }
  return [...used.values()].map((u) => ({ ...u, where: [...u.where].join(', ') }));
}

/* ----------------------------------------------------------- transfer spec */

/** The machine-readable handoff other builders can ingest. */
export function transferSpec(project) {
  const g = getGarment(project.garment);
  const method = DECORATION_METHODS.find((m) => m.id === project.method) || DECORATION_METHODS[0];
  const placements = [];
  for (const view of g.views) {
    const areas = g.areas(view) || [];
    for (const l of project.layers[view] || []) {
      if (l.visible === false) continue;
      const b = layerBounds(l, project);
      const area = areas.find((a) => b.x >= a.x - 40 && b.x <= a.x + a.w + 40 && b.y >= a.y - 60 && b.y <= a.y + a.h + 60);
      placements.push({
        view,
        layer: l.name,
        type: l.type,
        text: l.type === 'image' || l.type === 'art' ? undefined : l.text,
        artwork: l.type === 'art' ? l.art : undefined,
        font: l.type === 'art' || l.type === 'image' ? undefined : l.font,
        area: area?.label || 'Custom placement',
        widthInches: inches(b.w),
        heightInches: inches(b.h),
        centerFromLeftInches: inches(b.x),
        centerFromTopInches: inches(b.y),
        rotation: l.rotation || 0,
      });
    }
  }
  return {
    format: 'clopro-transfer',
    version: 1,
    generated: new Date().toISOString(),
    design: { name: project.name, id: project.id },
    contact: project.meta,
    garment: {
      id: g.id, name: g.name, category: g.category, sport: g.sport,
      fabric: g.fabric, sizes: g.sizes,
      canvas: { width: VB.w, height: VB.h, pxPerInch: PX_PER_INCH },
    },
    decoration: { method: method.id, methodName: method.name, maxColors: method.maxColors },
    colors: colorReport(project).map((c) => ({ hex: c.hex, name: c.name, usedOn: c.where })),
    fabricZones: Object.entries(project.zones).map(([id, p]) => ({ zone: id, style: p.style, colors: p.colors })),
    placements,
    roster: (project.roster || []).map((r) => ({ ...r, qty: r.qty || 1 })),
    totalPieces: (project.roster || []).reduce((s, r) => s + (Number(r.qty) || 1), 0),
    files: {
      'mockup-front.png': 'Colour mockup, front',
      'mockup-back.png': 'Colour mockup, back',
      'artwork-front-300dpi.png': 'Transparent print file, front — upload this to Custom Ink',
      'artwork-back-300dpi.png': 'Transparent print file, back',
      'artwork-front.svg': 'Vector artwork, front',
      'spec-sheet.pdf': 'Printable specification sheet',
      'roster.csv': 'Names, numbers and sizes',
    },
  };
}

/* --------------------------------------------------------------- spec HTML */

export function specSheetHTML(project) {
  const g = getGarment(project.garment);
  const spec = transferSpec(project);
  const rows = (arr, cells) => arr.map((r) => `<tr>${cells(r).map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>${project.name} — cloPRO spec</title>
<style>
 body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:32px;max-width:900px}
 h1{margin:0 0 4px;font-size:26px} h2{margin:26px 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:.1em;color:#555}
 table{border-collapse:collapse;width:100%;margin-top:6px} td,th{border:1px solid #ddd;padding:6px 9px;text-align:left;font-size:13px}
 th{background:#f4f4f5} .sw{display:inline-block;width:14px;height:14px;border:1px solid #0002;vertical-align:-2px;margin-right:6px;border-radius:3px}
 .muted{color:#666} .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #111;padding-bottom:10px}
</style>
<div class="head"><div><h1>${project.name}</h1>
<div class="muted">${g.name} · ${spec.decoration.methodName} · ${spec.totalPieces} pieces</div></div>
<div class="muted">cloPRO spec · ${new Date().toLocaleDateString()}</div></div>
<h2>Garment</h2><table>
<tr><th>Style</th><td>${g.name}</td><th>Category</th><td>${g.category}</td></tr>
<tr><th>Fabric</th><td>${g.fabric}</td><th>Sizes</th><td>${g.sizes.join(', ')}</td></tr></table>
<h2>Colours</h2><table><tr><th>Swatch</th><th>Hex</th><th>Closest stock colour</th><th>Used on</th></tr>
${rows(spec.colors, (c) => [`<span class="sw" style="background:${c.hex}"></span>`, c.hex.toUpperCase(), c.name, c.usedOn])}</table>
<h2>Placements</h2><table><tr><th>View</th><th>Element</th><th>Area</th><th>Size (in)</th><th>Detail</th></tr>
${rows(spec.placements, (p) => [p.view, p.layer, p.area, `${p.widthInches} × ${p.heightInches}`, p.text || p.artwork || p.type])}</table>
<h2>Roster</h2><table><tr><th>Name</th><th>Number</th><th>Size</th><th>Qty</th></tr>
${rows(spec.roster, (r) => [r.name, r.number, r.size, r.qty])}</table>
<h2>Notes</h2><p>${(project.meta.notes || '—').replace(/</g, '&lt;')}</p>`;
}

/* ------------------------------------------------------------------- PDF */
/* Minimal writer: Helvetica text + JPEG XObjects (DCTDecode). */

class PDF {
  constructor() { this.objs = ['']; }
  add(body) { this.objs.push(body); return this.objs.length - 1; }
  build() {
    const parts = [];
    let out = '%PDF-1.4\n';
    const enc = new TextEncoder();
    const chunks = [];
    let len = enc.encode(out).length;
    const offsets = [0];
    chunks.push(enc.encode(out));
    for (let i = 1; i < this.objs.length; i++) {
      offsets[i] = len;
      const o = this.objs[i];
      if (o instanceof Uint8Array) { chunks.push(o); len += o.length; }
      else { const b = enc.encode(o); chunks.push(b); len += b.length; }
    }
    const xrefPos = len;
    let xref = `xref\n0 ${this.objs.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < this.objs.length; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    xref += `trailer\n<< /Size ${this.objs.length} /Root ${this.rootRef} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    chunks.push(enc.encode(xref));
    void parts;
    return new Blob(chunks, { type: 'application/pdf' });
  }
}

function pdfObj(n, body) {
  return `${n} 0 obj\n${body}\nendobj\n`;
}

function pdfStreamBytes(n, dict, bytes) {
  const enc = new TextEncoder();
  const head = enc.encode(`${n} 0 obj\n<< ${dict} /Length ${bytes.length} >>\nstream\n`);
  const tail = enc.encode('\nendstream\nendobj\n');
  const out = new Uint8Array(head.length + bytes.length + tail.length);
  out.set(head, 0);
  out.set(bytes, head.length);
  out.set(tail, head.length + bytes.length);
  return out;
}

const pdfEsc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '');

export async function exportSpecPDF(project) {
  const g = getGarment(project.garment);
  const spec = transferSpec(project);
  const W = 612, H = 792;

  // page 1 imagery
  const imgs = [];
  for (const view of g.views.slice(0, 2)) {
    const c = await mockupCanvas(project, view, 2, '#ffffff');
    const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
    imgs.push({ bytes: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height, view });
  }

  const pdf = new PDF();
  const objs = [];
  const push = (body) => { objs.push(body); return objs.length; };

  // reserve: 1 catalog, 2 pages, 3 page1, 4 content1, 5 font, 6 fontB, images…
  const catalog = push('');
  const pagesObj = push('');
  const page1 = push('');
  const content1 = push('');
  const fontR = push(pdfObj(0, '')); // placeholder replaced below
  const fontB = push(pdfObj(0, ''));
  const imgRefs = imgs.map(() => push(''));

  // text content
  const L = [];
  let y = H - 56;
  const line = (txt, size = 10, bold = false, dy = 15) => {
    L.push(`BT /${bold ? 'FB' : 'FR'} ${size} Tf 48 ${y} Td (${pdfEsc(txt)}) Tj ET`);
    y -= dy;
  };
  line(project.name, 22, true, 26);
  line(`${g.name}  ·  ${spec.decoration.methodName}  ·  ${spec.totalPieces} pieces`, 11, false, 22);
  L.push(`0.1 w 48 ${y + 8} m ${W - 48} ${y + 8} l S`);
  y -= 8;

  const imgW = 210;
  const imgTop = y;
  imgs.forEach((im, i) => {
    const h = (imgW * im.h) / im.w;
    L.push(`q ${imgW} 0 0 ${h} ${48 + i * (imgW + 20)} ${imgTop - h} cm /IM${i} Do Q`);
  });
  const maxH = Math.max(...imgs.map((im) => (imgW * im.h) / im.w));
  y = imgTop - maxH - 26;

  line('GARMENT', 10, true, 16);
  line(`Style: ${g.name}     Fabric: ${g.fabric}`, 9, false, 13);
  line(`Sizes: ${g.sizes.join(', ')}`, 9, false, 20);

  line('COLOURS', 10, true, 16);
  for (const c of spec.colors.slice(0, 12)) {
    const rgb = [1, 3, 5].map((i) => parseInt(c.hex.slice(i, i + 2), 16) / 255);
    L.push(`${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg 48 ${y - 2} 10 10 re f 0 g`);
    L.push(`BT /FR 9 Tf 64 ${y} Td (${pdfEsc(`${c.hex.toUpperCase()}  ${c.name}  —  ${c.usedOn}`)}) Tj ET`);
    y -= 13;
  }
  y -= 8;

  line('PLACEMENTS', 10, true, 16);
  for (const p of spec.placements.slice(0, 14)) {
    line(`${p.view.toUpperCase().padEnd(6)} ${p.area} — ${p.text || p.artwork || p.type} · ${p.widthInches}in x ${p.heightInches}in`, 9, false, 12);
  }
  y -= 8;
  line('ROSTER', 10, true, 16);
  for (const r of spec.roster.slice(0, 16)) line(`${r.number}  ${r.name}  ${r.size} x${r.qty}`, 9, false, 12);

  const enc = new TextEncoder();
  const contentBytes = enc.encode(L.join('\n'));

  const xobj = imgs.map((_, i) => `/IM${i} ${imgRefs[i]} 0 R`).join(' ');
  objs[catalog - 1] = pdfObj(catalog, `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);
  objs[pagesObj - 1] = pdfObj(pagesObj, `<< /Type /Pages /Kids [${page1} 0 R] /Count 1 >>`);
  objs[page1 - 1] = pdfObj(
    page1,
    `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${content1} 0 R
       /Resources << /Font << /FR ${fontR} 0 R /FB ${fontB} 0 R >> /XObject << ${xobj} >> >> >>`
  );
  objs[content1 - 1] = pdfStreamBytes(content1, '', contentBytes);
  objs[fontR - 1] = pdfObj(fontR, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objs[fontB - 1] = pdfObj(fontB, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  imgs.forEach((im, i) => {
    objs[imgRefs[i] - 1] = pdfStreamBytes(
      imgRefs[i],
      `/Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,
      im.bytes
    );
  });

  pdf.objs = ['', ...objs];
  pdf.rootRef = catalog;
  download(pdf.build(), `${slug(project.name)}-spec-sheet.pdf`);
}

/* ------------------------------------------------------------------- ZIP */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Store-only ZIP (no deflate) — universally readable and dependency free. */
export function makeZip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  const u16 = (v) => new Uint8Array([v & 255, (v >> 8) & 255]);
  const u32 = (v) => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);
  const cat = (...arrs) => {
    const total = arrs.reduce((s, a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const a of arrs) { out.set(a, o); o += a.length; }
    return out;
  };

  const now = new Date();
  const time = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const date = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = f.data instanceof Uint8Array ? f.data : enc.encode(String(f.data));
    const crc = crc32(data);
    const local = cat(
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(time), u16(date),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes
    );
    chunks.push(local, data);
    central.push(
      cat(
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(time), u16(date),
        u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length),
        u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes
      )
    );
    offset += local.length + data.length;
  }

  const centralBytes = cat(...central);
  const end = cat(
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralBytes.length), u32(offset), u16(0)
  );
  return new Blob([...chunks, centralBytes, end], { type: 'application/zip' });
}

/* ------------------------------------------------------------- handoff kit */

const README = (project, spec) => `cloPRO HANDOFF KIT — ${project.name}
================================================================
Generated ${new Date().toLocaleString()}

WHAT'S INSIDE
  mockup-front.png / mockup-back.png
      Colour mockups. Send these to your team or supplier for approval.
  artwork-*-300dpi.png
      Transparent, 300 DPI print files, cropped to the artwork.
      >> These are the files you upload to Custom Ink, Printful, Printify,
         or any "upload your own art" designer.
  artwork-*.svg
      Vector versions with fonts embedded. Use for screen printing,
      tackle twill cutting, embroidery digitising or vinyl.
  spec-sheet.html
      Full specification: colours, placements, sizes, roster.
  transfer.json
      Machine-readable spec (format: clopro-transfer v1) for jersey
      builders that accept a design import.
  roster.csv
      Names / numbers / sizes for team stores and name-and-number runs.
  ${slug(project.name)}.clopro.json
      The editable project. Re-open it any time in cloPRO.

HOW TO UPLOAD TO CUSTOM INK (or similar)
  1. Pick the same garment style: ${spec.garment.name}.
  2. Set the garment colour to ${spec.colors[0]?.name || 'your base colour'} (${spec.colors[0]?.hex || ''}).
  3. Choose "Add Art" > "Upload Your Own", and pick artwork-front-300dpi.png.
  4. Scale the art to ${spec.placements[0]?.widthInches || 10} inches wide and centre it in the
     ${spec.placements[0]?.area || 'front'} placement.
  5. Repeat for the back file, then add names/numbers from roster.csv.

DECORATION
  Method: ${spec.decoration.methodName} (max ${spec.decoration.maxColors} colours)
  Colours used: ${spec.colors.length}
  Total pieces: ${spec.totalPieces}
`;

export async function exportKit(project, onProgress = () => {}) {
  const g = getGarment(project.garment);
  const files = [];
  const name = slug(project.name);
  const spec = transferSpec(project);

  onProgress('Rendering mockups…');
  for (const view of g.views) {
    const c = await mockupCanvas(project, view, 3, '#ffffff');
    const blob = await canvasToBlob(c, 'image/png');
    files.push({ name: `mockup-${view}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
  }

  onProgress('Building print files…');
  for (const view of g.views) {
    const c = await artworkCanvas(project, view, 300);
    if (c) {
      const blob = await canvasToBlob(c, 'image/png');
      files.push({ name: `artwork-${view}-300dpi.png`, data: new Uint8Array(await blob.arrayBuffer()) });
      const box = artworkBox(project, view);
      const svg = await embedFonts(renderArtworkSVG(project, view, { box }));
      files.push({ name: `artwork-${view}.svg`, data: svg });
    }
  }

  onProgress('Writing spec sheet…');
  files.push({ name: 'spec-sheet.html', data: specSheetHTML(project) });
  files.push({ name: 'transfer.json', data: JSON.stringify(spec, null, 2) });
  files.push({ name: 'roster.csv', data: rosterCSV(project) });
  files.push({ name: `${name}.clopro.json`, data: JSON.stringify(project, null, 2) });
  files.push({ name: 'README.txt', data: README(project, spec) });

  onProgress('Zipping…');
  const zip = makeZip(files);
  download(zip, `${name}-clopro-kit.zip`);
  onProgress('Done');
}

/* ---------------------------------------------------------------- thumbs */

export async function thumbnail(project, size = 220) {
  try {
    const c = await mockupCanvas(project, project.view || 'front', size / VB.w, null);
    return c.toDataURL('image/webp', 0.7);
  } catch {
    return '';
  }
}

export { fontCss };
