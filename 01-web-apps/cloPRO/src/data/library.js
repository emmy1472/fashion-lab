/* cloPRO — palettes, typefaces, size charts and starter presets. */

/* ------------------------------------------------------------------ fonts */
/* `weight` values are what we request from Google Fonts; `num` marks faces
   that read well as jersey numbers. */
export const FONTS = [
  { id: 'Anton', name: 'Anton', css: "'Anton', Impact, sans-serif", group: 'Block', num: true },
  { id: 'Archivo Black', name: 'Archivo Black', css: "'Archivo Black', sans-serif", group: 'Block', num: true },
  { id: 'Bebas Neue', name: 'Bebas Neue', css: "'Bebas Neue', Impact, sans-serif", group: 'Block', num: true },
  { id: 'Oswald', name: 'Oswald', css: "'Oswald', sans-serif", group: 'Block', num: true, weight: '700' },
  { id: 'Teko', name: 'Teko', css: "'Teko', sans-serif", group: 'Block', num: true, weight: '700' },
  { id: 'Staatliches', name: 'Staatliches', css: "'Staatliches', sans-serif", group: 'Block', num: true },
  { id: 'Graduate', name: 'Graduate', css: "'Graduate', serif", group: 'Collegiate', num: true },
  { id: 'Alfa Slab One', name: 'Alfa Slab', css: "'Alfa Slab One', serif", group: 'Collegiate', num: true },
  { id: 'Bungee', name: 'Bungee', css: "'Bungee', sans-serif", group: 'Display', num: true },
  { id: 'Bungee Shade', name: 'Bungee Shade', css: "'Bungee Shade', sans-serif", group: 'Display' },
  { id: 'Righteous', name: 'Righteous', css: "'Righteous', sans-serif", group: 'Display' },
  { id: 'Russo One', name: 'Russo One', css: "'Russo One', sans-serif", group: 'Tech', num: true },
  { id: 'Orbitron', name: 'Orbitron', css: "'Orbitron', sans-serif", group: 'Tech', num: true, weight: '900' },
  { id: 'Black Ops One', name: 'Black Ops', css: "'Black Ops One', sans-serif", group: 'Tech', num: true },
  { id: 'Press Start 2P', name: 'Pixel', css: "'Press Start 2P', monospace", group: 'Tech' },
  { id: 'Monoton', name: 'Monoton', css: "'Monoton', sans-serif", group: 'Display' },
  { id: 'Rye', name: 'Rye', css: "'Rye', serif", group: 'Vintage' },
  { id: 'Special Elite', name: 'Typewriter', css: "'Special Elite', serif", group: 'Vintage' },
  { id: 'Creepster', name: 'Creepster', css: "'Creepster', cursive", group: 'Display' },
  { id: 'Permanent Marker', name: 'Marker', css: "'Permanent Marker', cursive", group: 'Script' },
  { id: 'Pacifico', name: 'Pacifico', css: "'Pacifico', cursive", group: 'Script' },
  { id: 'Lobster', name: 'Lobster', css: "'Lobster', cursive", group: 'Script' },
  { id: 'Yellowtail', name: 'Yellowtail', css: "'Yellowtail', cursive", group: 'Script' },
  { id: 'Playfair Display', name: 'Playfair', css: "'Playfair Display', serif", group: 'Classic', weight: '900' },
  { id: 'Roboto Condensed', name: 'Roboto Cond', css: "'Roboto Condensed', sans-serif", group: 'Classic', weight: '700', num: true },
  { id: 'Inter', name: 'Inter', css: "'Inter', system-ui, sans-serif", group: 'Classic', weight: '700' },
];

export const FONT_GROUPS = [...new Set(FONTS.map((f) => f.group))];
export const NUMBER_FONTS = FONTS.filter((f) => f.num);

export function googleFontHref() {
  const fams = FONTS.map((f) => {
    const w = f.weight ? `:wght@${f.weight}` : '';
    return `family=${f.id.replace(/ /g, '+')}${w}`;
  });
  return `https://fonts.googleapis.com/css2?${fams.join('&')}&display=swap`;
}

export function fontCss(id) {
  return (FONTS.find((f) => f.id === id) || FONTS[0]).css;
}

/* --------------------------------------------------------------- palettes */

const pal = (name, group, colors) => ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, group, colors });

export const PALETTES = [
  pal('Midnight Gold', 'Classic', ['#0b1120', '#f2c14e', '#ffffff', '#5a6474']),
  pal('Crimson Steel', 'Classic', ['#8b1a1a', '#2b2f36', '#ffffff', '#c9ced6']),
  pal('Forest Cream', 'Classic', ['#14452f', '#f4efe1', '#c8a24a', '#0a2a1c']),
  pal('Navy Scarlet', 'Classic', ['#141f43', '#d32f2f', '#ffffff', '#9aa4bd']),
  pal('Royal Silver', 'Classic', ['#1e40af', '#d1d5db', '#ffffff', '#111827']),
  pal('Black Vegas Gold', 'Classic', ['#0a0a0a', '#c5b358', '#ffffff', '#3d3d3d']),
  pal('Maroon White', 'Classic', ['#6d1a2f', '#ffffff', '#e8c547', '#3b0d19']),
  pal('Carolina Navy', 'Classic', ['#5aa9e6', '#0b2545', '#ffffff', '#8ecae6']),

  pal('Neon Court', 'Modern', ['#0f0f12', '#c6ff00', '#00e5ff', '#ffffff']),
  pal('Sunset Fade', 'Modern', ['#2b1055', '#ff5f6d', '#ffc371', '#ffffff']),
  pal('Miami Heat Wave', 'Modern', ['#00c2c7', '#ff5ea8', '#111827', '#ffffff']),
  pal('Electric Violet', 'Modern', ['#2d0b52', '#a259ff', '#00f5d4', '#ffffff']),
  pal('Volt Black', 'Modern', ['#101010', '#d7ff2e', '#4b4b4b', '#ffffff']),
  pal('Ice Blue', 'Modern', ['#e8f4fb', '#0a7fbd', '#052a44', '#9fd3ef']),
  pal('Coral Reef', 'Modern', ['#ff6b6b', '#ffe66d', '#1a535c', '#f7fff7']),
  pal('Cyber Lime', 'Modern', ['#0b141a', '#39ff14', '#00b4d8', '#e5e5e5']),

  pal('Desert Camo', 'Tactical', ['#c2b280', '#8b7d5b', '#4b4535', '#e6dcc0']),
  pal('Woodland', 'Tactical', ['#3b4a2f', '#6b7a4a', '#252b1d', '#c3c9a6']),
  pal('Urban Grey', 'Tactical', ['#2f3438', '#6b7278', '#a8b0b6', '#0f1114']),
  pal('Blackout', 'Tactical', ['#0d0d0d', '#1f1f1f', '#3a3a3a', '#8a8a8a']),
  pal('Blood Orange Ops', 'Tactical', ['#1a1a1a', '#ff6a00', '#4a4a4a', '#f2f2f2']),

  pal('Vintage Cream', 'Retro', ['#f2e8d5', '#8c4a2f', '#2f4858', '#c19a6b']),
  pal('70s Sunset', 'Retro', ['#f2a65a', '#772f1a', '#f7c548', '#294936']),
  pal('Varsity Classic', 'Retro', ['#122447', '#f4d35e', '#faf3dd', '#8a1c1c']),
  pal('Malt Shop', 'Retro', ['#e63946', '#f1faee', '#a8dadc', '#1d3557']),
  pal('Bowling Alley', 'Retro', ['#2b2d42', '#ef233c', '#edf2f4', '#8d99ae']),

  pal('Pastel Pop', 'Bright', ['#ffd6e0', '#a0e7e5', '#b4f8c8', '#fbe7c6']),
  pal('Candy Court', 'Bright', ['#ff007f', '#00d9ff', '#fff200', '#ffffff']),
  pal('Tropical', 'Bright', ['#06d6a0', '#ffd166', '#ef476f', '#118ab2']),
  pal('Mono White', 'Bright', ['#ffffff', '#111111', '#dcdcdc', '#8a8a8a']),

  pal('Deep Sea', 'Nature', ['#03256c', '#2541b2', '#06bee1', '#ffffff']),
  pal('Canyon', 'Nature', ['#9c3d16', '#e0a458', '#2e2b1f', '#f0e2d0']),
  pal('Glacier', 'Nature', ['#dff3f7', '#3aa6b9', '#0b3c49', '#a5d8e6']),
  pal('Moss Stone', 'Nature', ['#4a5d23', '#a3b18a', '#344e41', '#dad7cd']),
];

export const PALETTE_GROUPS = [...new Set(PALETTES.map((p) => p.group))];

/* --------------------------------------------------------- colour helpers */

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(v, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function harmony(hex, kind) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const mk = (dh, ds = 0, dl = 0) => hslToHex(h + dh, Math.min(100, Math.max(0, s + ds)), Math.min(96, Math.max(6, l + dl)));
  switch (kind) {
    case 'complement': return [hex, mk(180), mk(0, -30, 34), mk(180, -20, -20)];
    case 'triad': return [hex, mk(120), mk(240), mk(0, -40, 40)];
    case 'analogous': return [hex, mk(30), mk(-30), mk(0, -25, 38)];
    case 'split': return [hex, mk(150), mk(210), mk(0, -20, -28)];
    case 'shades': return [hex, mk(0, 0, -22), mk(0, 0, 22), mk(0, -35, 40)];
    default: return [hex, mk(180), mk(120), mk(60)];
  }
}

export function contrastRatio(a, b) {
  const lum = (hex) => {
    const { r, g, b: bb } = hexToRgb(hex);
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb);
  };
  const l1 = lum(a), l2 = lum(b);
  return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
}

/* Nearest thread/ink reference so the spec sheet can name a colour. */
const NAMED = [
  ['Black', '#000000'], ['Jet', '#1c1c1c'], ['Charcoal', '#36454f'], ['Graphite', '#4b4f54'],
  ['Silver', '#c0c0c0'], ['Ash Grey', '#b2beb5'], ['White', '#ffffff'], ['Natural', '#f5f0e1'],
  ['Cardinal', '#c41e3a'], ['Scarlet', '#ff2400'], ['Maroon', '#800000'], ['Burgundy', '#800020'],
  ['Orange', '#ff7f00'], ['Texas Orange', '#bf5700'], ['Gold', '#ffd700'], ['Vegas Gold', '#c5b358'],
  ['Athletic Gold', '#f2c14e'], ['Yellow', '#ffef00'], ['Volt', '#d7ff2e'], ['Kelly Green', '#4cbb17'],
  ['Forest Green', '#228b22'], ['Dark Green', '#14452f'], ['Teal', '#008080'], ['Aqua', '#00ffff'],
  ['Columbia Blue', '#9bddff'], ['Royal Blue', '#4169e1'], ['Navy', '#000080'], ['Midnight Navy', '#0b1120'],
  ['Purple', '#5a2d82'], ['Violet', '#8f00ff'], ['Pink', '#ff69b4'], ['Magenta', '#ff00ff'],
  ['Brown', '#7b3f00'], ['Tan', '#d2b48c'], ['Cream', '#f2e8d5'], ['Coral', '#ff6b6b'],
];

export function nearestName(hex) {
  const { r, g, b } = hexToRgb(hex);
  let best = NAMED[0];
  let bd = Infinity;
  for (const [name, h] of NAMED) {
    const c = hexToRgb(h);
    const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
    if (d < bd) { bd = d; best = [name, h]; }
  }
  return best[0];
}

/* ------------------------------------------------------------ size charts */

export const SIZE_CHART = {
  YS: { chest: 28, length: 22 }, YM: { chest: 30, length: 24 }, YL: { chest: 32, length: 26 },
  S: { chest: 36, length: 28 }, M: { chest: 40, length: 29 }, L: { chest: 44, length: 30 },
  XL: { chest: 48, length: 31 }, '2XL': { chest: 52, length: 32 }, '3XL': { chest: 56, length: 33 },
  'One Size': { chest: 0, length: 0 }, 'S/M': { chest: 0, length: 0 }, 'L/XL': { chest: 0, length: 0 },
  '15" x 16"': { chest: 0, length: 0 },
};

/* --------------------------------------------------------- decoration ops */

export const DECORATION_METHODS = [
  { id: 'screen', name: 'Screen Print', maxColors: 6, note: 'Best value at 24+ pieces. Flat spot colours.' },
  { id: 'dtg', name: 'Direct-to-Garment', maxColors: 99, note: 'Full colour, cotton garments, small runs.' },
  { id: 'sublimation', name: 'Dye Sublimation', maxColors: 99, note: 'All-over print. Polyester only, white base.' },
  { id: 'twill', name: 'Tackle Twill', maxColors: 3, note: 'Stitched layered fabric. Premium jersey look.' },
  { id: 'vinyl', name: 'Heat Transfer Vinyl', maxColors: 3, note: 'Names and numbers, low minimums.' },
  { id: 'embroidery', name: 'Embroidery', maxColors: 12, note: 'Left chest and caps. Min 0.25" detail.' },
];

/* ------------------------------------------------------------- name/number */

export const TEXT_ARCS = [
  { id: 'straight', name: 'Straight' },
  { id: 'arch', name: 'Arch Up' },
  { id: 'arch-down', name: 'Arch Down' },
  { id: 'bridge', name: 'Bridge' },
  { id: 'slant-up', name: 'Slant Up' },
  { id: 'slant-down', name: 'Slant Down' },
];

/* -------------------------------------------------------------- presets */
/* A preset seeds zone paints + starter layers for a garment. */

export const PRESETS = [
  {
    id: 'classic-home',
    name: 'Classic Home',
    tags: ['clean', 'traditional'],
    palette: ['#ffffff', '#141f43', '#d32f2f'],
    zones: { body: { style: 'solid', colors: ['#ffffff'] }, collar: { style: 'triple-stripe', colors: ['#141f43', '#d32f2f', '#ffffff'] }, cuffL: { style: 'triple-stripe', colors: ['#141f43', '#d32f2f', '#ffffff'] }, cuffR: { style: 'triple-stripe', colors: ['#141f43', '#d32f2f', '#ffffff'] } },
  },
  {
    id: 'road-dark',
    name: 'Road Dark',
    tags: ['away', 'bold'],
    palette: ['#0b1120', '#f2c14e', '#ffffff'],
    zones: { body: { style: 'solid', colors: ['#0b1120'] }, sleeveL: { style: 'solid', colors: ['#f2c14e'] }, sleeveR: { style: 'solid', colors: ['#f2c14e'] }, collar: { style: 'solid', colors: ['#f2c14e'] } },
  },
  {
    id: 'gradient-fade',
    name: 'Gradient Fade',
    tags: ['modern', 'sublimated'],
    palette: ['#2b1055', '#ff5f6d', '#ffc371'],
    zones: { body: { style: 'linear', colors: ['#2b1055', '#ff5f6d'], params: { angle: 150, mid: 20 } }, sleeveL: { style: 'linear', colors: ['#ff5f6d', '#ffc371'] }, sleeveR: { style: 'linear', colors: ['#ff5f6d', '#ffc371'] } },
  },
  {
    id: 'pinstripe-pro',
    name: 'Pinstripe Pro',
    tags: ['baseball', 'classic'],
    palette: ['#ffffff', '#141f43', '#c41e3a'],
    zones: { body: { style: 'pinstripe', colors: ['#ffffff', '#141f43'], params: { gap: 22, width: 3 } }, placket: { style: 'solid', colors: ['#ffffff'] }, collar: { style: 'solid', colors: ['#141f43'] } },
  },
  {
    id: 'camo-ops',
    name: 'Camo Ops',
    tags: ['military', 'tribute'],
    palette: ['#3b4a2f', '#6b7a4a', '#252b1d'],
    zones: { body: { style: 'camo', colors: ['#3b4a2f', '#6b7a4a', '#252b1d'] }, sleeveL: { style: 'camo', colors: ['#3b4a2f', '#6b7a4a', '#252b1d'] }, sleeveR: { style: 'camo', colors: ['#3b4a2f', '#6b7a4a', '#252b1d'] }, collar: { style: 'solid', colors: ['#252b1d'] } },
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    tags: ['esports', 'modern'],
    palette: ['#0f0f12', '#c6ff00', '#00e5ff'],
    zones: { body: { style: 'circuit', colors: ['#0f0f12', '#1b2a1a'] }, panelL: { style: 'solid', colors: ['#c6ff00'] }, panelR: { style: 'solid', colors: ['#c6ff00'] }, collar: { style: 'solid', colors: ['#00e5ff'] } },
  },
  {
    id: 'retro-fade',
    name: 'Retro Sun',
    tags: ['vintage', 'summer'],
    palette: ['#f2e8d5', '#8c4a2f', '#f2a65a'],
    zones: { body: { style: 'fade-stripes', colors: ['#f2e8d5', '#f2a65a'], params: { width: 14 } }, collar: { style: 'solid', colors: ['#8c4a2f'] } },
  },
  {
    id: 'blackout',
    name: 'Blackout',
    tags: ['stealth'],
    palette: ['#0d0d0d', '#1f1f1f', '#3a3a3a'],
    zones: { body: { style: 'solid', colors: ['#0d0d0d'] }, sleeveL: { style: 'carbon', colors: ['#0d0d0d', '#1f1f1f'] }, sleeveR: { style: 'carbon', colors: ['#0d0d0d', '#1f1f1f'] }, collar: { style: 'solid', colors: ['#1f1f1f'] } },
  },
  {
    id: 'court-split',
    name: 'Court Split',
    tags: ['basketball', 'bold'],
    palette: ['#8b1a1a', '#2b2f36', '#ffffff'],
    zones: { body: { style: 'solid', colors: ['#8b1a1a'] }, panelL: { style: 'triple-stripe', colors: ['#2b2f36', '#ffffff', '#8b1a1a'], params: { angle: 90 } }, panelR: { style: 'triple-stripe', colors: ['#2b2f36', '#ffffff', '#8b1a1a'], params: { angle: 90 } }, collar: { style: 'solid', colors: ['#ffffff'] } },
  },
  {
    id: 'ice-chevron',
    name: 'Ice Chevron',
    tags: ['hockey'],
    palette: ['#e8f4fb', '#0a7fbd', '#052a44'],
    zones: { body: { style: 'solid', colors: ['#e8f4fb'] }, yoke: { style: 'chevron', colors: ['#052a44', '#0a7fbd'] }, sleeveStripe: { style: 'solid', colors: ['#0a7fbd'] }, collar: { style: 'solid', colors: ['#052a44'] } },
  },
];

/* ------------------------------------------------- ready-made text blocks */

export const SAMPLE_TEXTS = [
  'TITANS', 'WILDCATS', 'RAPTORS', 'THUNDER', 'UNITED', 'ACADEMY',
  'EST. 2026', 'CHAMPIONS', 'ALL CITY', 'VARSITY', 'DISTRICT', 'CLUB',
];
