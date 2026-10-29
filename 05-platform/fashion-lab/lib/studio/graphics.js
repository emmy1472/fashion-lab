/* cloPRO — built-in artwork library.
 * Two sources feed the same shape format:
 *   1. GENERATORS  — parametric shapes (stars, shields, bursts, gears, wings…)
 *   2. GRAPHICS    — hand-authored emblems, mascots and sport icons
 * A shape is { vb, parts:[{ d, role, opacity?, stroke? }] } drawn in a 200x200 box.
 */

const T = (v) => Math.round(v * 10) / 10;
const poly = (pts) => `M ${pts.map(([x, y]) => `${T(x)} ${T(y)}`).join(' L ')} Z`;

/* ------------------------------------------------------------- generators */

function starPath(cx, cy, r, points, inner, rot = -90) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = ((Math.PI * i) / points) + (rot * Math.PI) / 180;
    const rr = i % 2 ? r * inner : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return poly(pts);
}

function ngonPath(cx, cy, r, sides, rot = -90) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = ((Math.PI * 2 * i) / sides) + (rot * Math.PI) / 180;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return poly(pts);
}

function shieldPath(style = 0, w = 76, top = 22, bot = 186) {
  const cx = 100;
  const l = cx - w;
  const r = cx + w;
  if (style === 1) {
    // pointed / heater
    return `M ${l} ${top} L ${r} ${top} L ${r} ${top + 66} C ${r} ${bot - 34} ${cx + 26} ${bot - 10} ${cx} ${bot}
            C ${cx - 26} ${bot - 10} ${l} ${bot - 34} ${l} ${top + 66} Z`;
  }
  if (style === 2) {
    // banner shield with notch
    return `M ${l} ${top} L ${r} ${top} L ${r} ${bot - 60} L ${cx} ${bot} L ${l} ${bot - 60} Z`;
  }
  if (style === 3) {
    // rounded crest
    return `M ${cx} ${top} C ${cx + 46} ${top} ${r} ${top + 14} ${r} ${top + 40}
            L ${r} ${top + 78} C ${r} ${bot - 40} ${cx + 34} ${bot - 8} ${cx} ${bot}
            C ${cx - 34} ${bot - 8} ${l} ${bot - 40} ${l} ${top + 78}
            L ${l} ${top + 40} C ${l} ${top + 14} ${cx - 46} ${top} ${cx} ${top} Z`;
  }
  // classic
  return `M ${l} ${top} L ${r} ${top} L ${r} ${top + 74} C ${r} ${bot - 28} ${cx + 30} ${bot - 12} ${cx} ${bot}
          C ${cx - 30} ${bot - 12} ${l} ${bot - 28} ${l} ${top + 74} Z`;
}

function ribbonPath(y = 118, h = 40, w = 92, tail = 22) {
  const cx = 100;
  return `M ${cx - w} ${y} L ${cx + w} ${y} L ${cx + w - tail} ${y + h / 2} L ${cx + w} ${y + h}
          L ${cx - w} ${y + h} L ${cx - w + tail} ${y + h / 2} Z`;
}

function burstPath(cx, cy, r, spikes, inner) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return poly(pts);
}

function gearPath(cx, cy, r, teeth) {
  const inner = r * 0.78;
  let d = '';
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.28;
    const a2 = a0 + step * 0.5;
    const a3 = a0 + step * 0.78;
    const p = (ang, rr) => `${T(cx + Math.cos(ang) * rr)} ${T(cy + Math.sin(ang) * rr)}`;
    d += `${i ? 'L' : 'M'} ${p(a0, r)} L ${p(a1, r)} L ${p(a2, inner)} L ${p(a3, inner)} `;
  }
  return `${d} Z`;
}

function lightningPath(w = 1) {
  const s = w;
  return `M ${100 + 18 * s} 14 L ${58} ${106} L ${94} ${106} L ${76} ${190} L ${146} ${86} L ${106} ${86} Z`;
}

function flamePath() {
  return `M 100 16 C 128 58 118 74 132 92 C 146 110 150 132 140 152
          C 128 176 108 188 100 188 C 92 188 60 178 54 150
          C 48 122 66 108 72 88 C 78 68 84 44 100 16 Z`;
}

function wingPath(dir = 1) {
  // feathered wing sweeping from centre outward
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x0 = 100 + dir * (18 + t * 8);
    const y0 = 66 + i * 14;
    const len = 74 - i * 8;
    const drop = 12 + i * 6;
    parts.push(
      `M ${T(x0)} ${T(y0)} C ${T(x0 + dir * len * 0.5)} ${T(y0 - 6)} ${T(x0 + dir * len)} ${T(y0 + drop * 0.4)} ${T(x0 + dir * len)} ${T(y0 + drop)}
       C ${T(x0 + dir * len * 0.5)} ${T(y0 + drop + 6)} ${T(x0 + dir * 20)} ${T(y0 + 16)} ${T(x0)} ${T(y0 + 15)} Z`
    );
  }
  return parts.join(' ');
}

function laurelPath(dir = 1) {
  const parts = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const a = (-70 + t * 120) * (Math.PI / 180);
    const cx = 100 + dir * (62 * Math.cos(a) * 0.75 + 10);
    const cy = 104 + 74 * Math.sin(a);
    const rot = (a * 180) / Math.PI + (dir > 0 ? 20 : 160);
    parts.push(
      `M ${T(cx)} ${T(cy)} q ${T(dir * 24)} ${-12} ${T(dir * 30)} ${4} q ${T(-dir * 12)} ${16} ${T(-dir * 30)} ${-4} Z`
    );
    void rot;
  }
  return parts.join(' ');
}

function archPath() {
  return `M 34 186 L 34 88 C 34 40 62 18 100 18 C 138 18 166 40 166 88 L 166 186 Z`;
}

function dropPath() {
  return `M 100 14 C 130 62 156 96 156 124 C 156 158 131 184 100 184 C 69 184 44 158 44 124 C 44 96 70 62 100 14 Z`;
}

function spiralHorn(dir = 1) {
  let d = `M ${100 + dir * 8} 60 `;
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const a = t * Math.PI * 2.4;
    const r = 46 * (1 - t * 0.78);
    const x = 100 + dir * (30 + Math.cos(a) * r);
    const y = 80 + Math.sin(a) * r * 0.9;
    d += `L ${T(x)} ${T(y)} `;
  }
  return d;
}

export const GENERATORS = [
  {
    id: 'gen-star', name: 'Star', group: 'Shapes',
    params: [{ k: 'points', label: 'Points', min: 3, max: 16, val: 5 }, { k: 'inner', label: 'Depth', min: 20, max: 90, val: 42 }],
    build: (p) => [{ d: starPath(100, 100, 88, p.points, p.inner / 100), role: 'primary' }],
  },
  {
    id: 'gen-star-outline', name: 'Ringed Star', group: 'Shapes',
    params: [{ k: 'points', label: 'Points', min: 3, max: 16, val: 5 }, { k: 'inner', label: 'Depth', min: 20, max: 90, val: 42 }],
    build: (p) => [
      { d: starPath(100, 100, 96, p.points, p.inner / 100), role: 'secondary' },
      { d: starPath(100, 100, 74, p.points, p.inner / 100), role: 'primary' },
    ],
  },
  {
    id: 'gen-poly', name: 'Polygon', group: 'Shapes',
    params: [{ k: 'sides', label: 'Sides', min: 3, max: 12, val: 6 }, { k: 'rot', label: 'Rotate', min: -180, max: 180, val: -90 }],
    build: (p) => [{ d: ngonPath(100, 100, 92, p.sides, p.rot), role: 'primary' }],
  },
  {
    id: 'gen-poly-ring', name: 'Polygon Frame', group: 'Frames',
    params: [{ k: 'sides', label: 'Sides', min: 3, max: 12, val: 6 }, { k: 'weight', label: 'Weight', min: 4, max: 40, val: 14 }],
    build: (p) => [
      { d: ngonPath(100, 100, 96, p.sides), role: 'primary' },
      { d: ngonPath(100, 100, 96 - p.weight, p.sides), role: 'secondary' },
    ],
  },
  {
    id: 'gen-shield', name: 'Shield', group: 'Frames',
    params: [{ k: 'style', label: 'Style', min: 0, max: 3, val: 0 }, { k: 'inset', label: 'Border', min: 0, max: 30, val: 12 }],
    build: (p) => {
      const out = [{ d: shieldPath(p.style), role: 'primary' }];
      if (p.inset > 0) out.push({ d: shieldPath(p.style, 76 - p.inset, 22 + p.inset, 186 - p.inset * 1.4), role: 'secondary' });
      return out;
    },
  },
  {
    id: 'gen-badge', name: 'Circle Badge', group: 'Frames',
    params: [{ k: 'rings', label: 'Rings', min: 1, max: 3, val: 2 }, { k: 'weight', label: 'Weight', min: 4, max: 30, val: 12 }],
    build: (p) => {
      const out = [];
      let r = 96;
      for (let i = 0; i < p.rings; i++) {
        out.push({ d: circle(100, 100, r), role: i % 2 ? 'secondary' : 'primary' });
        r -= p.weight;
        if (i < p.rings - 1) { out.push({ d: circle(100, 100, r), role: i % 2 ? 'primary' : 'secondary' }); r -= 6; }
      }
      return out;
    },
  },
  {
    id: 'gen-burst', name: 'Sunburst', group: 'Shapes',
    params: [{ k: 'spikes', label: 'Rays', min: 6, max: 40, val: 16 }, { k: 'inner', label: 'Depth', min: 30, max: 95, val: 70 }],
    build: (p) => [{ d: burstPath(100, 100, 96, p.spikes, p.inner / 100), role: 'primary' }],
  },
  {
    id: 'gen-gear', name: 'Gear', group: 'Shapes',
    params: [{ k: 'teeth', label: 'Teeth', min: 6, max: 24, val: 12 }],
    build: (p) => [
      { d: gearPath(100, 100, 94, p.teeth), role: 'primary' },
      { d: circle(100, 100, 34), role: 'secondary' },
    ],
  },
  {
    id: 'gen-ribbon', name: 'Ribbon Banner', group: 'Frames',
    params: [{ k: 'h', label: 'Height', min: 24, max: 80, val: 44 }, { k: 'tail', label: 'Notch', min: 0, max: 46, val: 24 }],
    build: (p) => [
      { d: ribbonPath(100 - p.h / 2, p.h, 94, p.tail), role: 'primary' },
      { d: ribbonPath(100 - p.h / 2 + 6, p.h - 12, 88, p.tail), role: 'secondary' },
    ],
  },
  {
    id: 'gen-chevrons', name: 'Chevron Stack', group: 'Shapes',
    params: [{ k: 'count', label: 'Count', min: 1, max: 6, val: 3 }, { k: 'weight', label: 'Weight', min: 8, max: 40, val: 22 }],
    build: (p) => {
      const out = [];
      for (let i = 0; i < p.count; i++) {
        const y = 40 + i * (p.weight + 12);
        out.push({
          d: `M 14 ${y + 40} L 100 ${y} L 186 ${y + 40} L 186 ${y + 40 + p.weight} L 100 ${y + p.weight} L 14 ${y + 40 + p.weight} Z`,
          role: i % 2 ? 'secondary' : 'primary',
        });
      }
      return out;
    },
  },
  {
    id: 'gen-wings', name: 'Wings', group: 'Shapes',
    params: [],
    build: () => [
      { d: wingPath(1), role: 'primary' },
      { d: wingPath(-1), role: 'primary' },
      { d: starPath(100, 96, 30, 5, 0.42), role: 'secondary' },
    ],
  },
  {
    id: 'gen-laurel', name: 'Laurel Wreath', group: 'Frames',
    params: [],
    build: () => [
      { d: laurelPath(1), role: 'primary' },
      { d: laurelPath(-1), role: 'primary' },
    ],
  },
  {
    id: 'gen-arch', name: 'Arch Frame', group: 'Frames',
    params: [{ k: 'inset', label: 'Border', min: 0, max: 30, val: 12 }],
    build: (p) => [
      { d: archPath(), role: 'primary' },
      ...(p.inset ? [{ d: `M ${34 + p.inset} ${186 - p.inset} L ${34 + p.inset} ${88} C ${34 + p.inset} ${40 + p.inset} ${62 + p.inset * 0.6} ${18 + p.inset} 100 ${18 + p.inset} C ${138 - p.inset * 0.6} ${18 + p.inset} ${166 - p.inset} ${40 + p.inset} ${166 - p.inset} 88 L ${166 - p.inset} ${186 - p.inset} Z`, role: 'secondary' }] : []),
    ],
  },
  {
    id: 'gen-bolt', name: 'Lightning Bolt', group: 'Icons',
    params: [{ k: 'w', label: 'Width', min: 60, max: 160, val: 100 }],
    build: (p) => [{ d: lightningPath(p.w / 100), role: 'primary' }],
  },
  {
    id: 'gen-flame', name: 'Flame', group: 'Icons',
    params: [],
    build: () => [
      { d: flamePath(), role: 'primary' },
      { d: `M 100 74 C 112 100 108 112 114 124 C 120 138 118 152 110 164 C 104 172 96 176 92 172 C 82 162 80 148 84 134 C 88 118 94 104 100 74 Z`, role: 'secondary' },
    ],
  },
  {
    id: 'gen-drop', name: 'Droplet', group: 'Icons', params: [],
    build: () => [{ d: dropPath(), role: 'primary' }],
  },
  {
    id: 'gen-diamond', name: 'Diamond', group: 'Shapes',
    params: [{ k: 'facets', label: 'Facets', min: 0, max: 1, val: 1 }],
    build: (p) => {
      const out = [{ d: poly([[100, 12], [180, 100], [100, 188], [20, 100]]), role: 'primary' }];
      if (p.facets) out.push({ d: poly([[100, 42], [156, 100], [100, 158], [44, 100]]), role: 'secondary' });
      return out;
    },
  },
  {
    id: 'gen-grid-num', name: 'Number Plate', group: 'Frames',
    params: [{ k: 'skew', label: 'Slant', min: -30, max: 30, val: 0 }],
    build: (p) => {
      const s = p.skew * 0.6;
      return [
        { d: poly([[26 + s, 40], [174 + s, 40], [174 - s, 160], [26 - s, 160]]), role: 'primary' },
        { d: poly([[38 + s, 52], [162 + s, 52], [162 - s, 148], [38 - s, 148]]), role: 'secondary' },
      ];
    },
  },
];

function circle(cx, cy, r) {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
}

/* ------------------------------------------------------ authored artwork */

const G = (id, name, group, tags, parts) => ({ id, name, group, tags, parts });

export const GRAPHICS = [
  /* ---- mascots ---- */
  G('wolf', 'Wolf Head', 'Mascots', ['wolf', 'dog', 'husky', 'animal'], [
    { d: poly([[30, 6], [64, 76], [16, 62]]), role: 'primary' },
    { d: poly([[170, 6], [136, 76], [184, 62]]), role: 'primary' },
    { d: poly([[16, 62], [54, 80], [100, 62], [146, 80], [184, 62], [172, 116], [140, 142], [100, 190], [60, 142], [28, 116]]), role: 'primary' },
    { d: poly([[52, 100], [86, 110], [78, 126], [46, 114]]), role: 'accent' },
    { d: poly([[148, 100], [114, 110], [122, 126], [154, 114]]), role: 'accent' },
    { d: poly([[100, 78], [124, 122], [100, 136], [76, 122]]), role: 'secondary' },
    { d: poly([[86, 134], [114, 134], [100, 154]]), role: 'accent' },
    { d: poly([[80, 152], [92, 150], [88, 172]]), role: 'secondary' },
    { d: poly([[120, 152], [108, 150], [112, 172]]), role: 'secondary' },
  ]),

  G('eagle', 'Eagle Head', 'Mascots', ['eagle', 'hawk', 'bird', 'falcon'], [
    { d: `M 34 100 C 34 46 82 24 122 42 L 190 74 L 120 98 C 118 132 74 146 42 126 Z`, role: 'primary' },
    { d: `M 122 42 L 190 74 L 120 98 L 118 70 Z`, role: 'accent' },
    { d: poly([[46, 60], [96, 52], [92, 74], [48, 78]]), role: 'secondary' },
    { d: circle(88, 68, 9), role: 'primary' },
    { d: `M 40 118 C 66 138 104 132 118 108 L 96 148 C 68 156 46 142 40 118 Z`, role: 'secondary' },
  ]),

  G('bear', 'Bear Head', 'Mascots', ['bear', 'grizzly', 'animal'], [
    { d: circle(48, 56, 26), role: 'primary' },
    { d: circle(152, 56, 26), role: 'primary' },
    { d: circle(48, 56, 13), role: 'secondary' },
    { d: circle(152, 56, 13), role: 'secondary' },
    { d: `M 100 24 C 148 24 176 60 176 108 C 176 156 144 186 100 186 C 56 186 24 156 24 108 C 24 60 52 24 100 24 Z`, role: 'primary' },
    { d: `M 100 118 C 128 118 140 134 140 150 C 140 168 122 180 100 180 C 78 180 60 168 60 150 C 60 134 72 118 100 118 Z`, role: 'secondary' },
    { d: `M 100 128 C 112 128 118 136 118 142 C 118 150 110 154 100 154 C 90 154 82 150 82 142 C 82 136 88 128 100 128 Z`, role: 'accent' },
    { d: poly([[58, 88], [82, 94], [76, 108], [54, 102]]), role: 'accent' },
    { d: poly([[142, 88], [118, 94], [124, 108], [146, 102]]), role: 'accent' },
  ]),

  G('bull', 'Bull Head', 'Mascots', ['bull', 'longhorn', 'ox', 'buffalo'], [
    { d: `M 18 78 C 2 42 34 18 66 34 L 74 58 C 52 50 34 58 40 82 Z`, role: 'secondary' },
    { d: `M 182 78 C 198 42 166 18 134 34 L 126 58 C 148 50 166 58 160 82 Z`, role: 'secondary' },
    { d: poly([[58, 44], [142, 44], [156, 96], [136, 130], [100, 190], [64, 130], [44, 96]]), role: 'primary' },
    { d: poly([[64, 84], [92, 92], [86, 108], [58, 100]]), role: 'accent' },
    { d: poly([[136, 84], [108, 92], [114, 108], [142, 100]]), role: 'accent' },
    { d: `M 76 128 C 88 122 112 122 124 128 C 130 146 118 160 100 160 C 82 160 70 146 76 128 Z`, role: 'secondary' },
    { d: circle(88, 138, 6), role: 'primary' },
    { d: circle(112, 138, 6), role: 'primary' },
  ]),

  G('shark', 'Shark', 'Mascots', ['shark', 'fish', 'ocean'], [
    { d: `M 10 118 C 46 78 96 62 148 66 L 138 30 C 176 52 190 86 190 112 C 190 140 172 166 140 178 C 96 194 40 168 10 118 Z`, role: 'primary' },
    { d: `M 10 118 C 46 96 100 92 150 108 C 130 152 84 168 40 148 Z`, role: 'secondary' },
    { d: poly([[46, 122], [70, 122], [62, 140], [52, 140]]), role: 'accent' },
    { d: poly([[78, 124], [102, 124], [94, 142], [84, 142]]), role: 'accent' },
    { d: circle(138, 92, 9), role: 'accent' },
  ]),

  G('tiger', 'Tiger Head', 'Mascots', ['tiger', 'cat', 'panther', 'lion'], [
    { d: poly([[34, 30], [76, 62], [26, 76]]), role: 'primary' },
    { d: poly([[166, 30], [124, 62], [174, 76]]), role: 'primary' },
    { d: `M 100 36 C 152 36 178 74 172 122 C 166 168 138 190 100 190 C 62 190 34 168 28 122 C 22 74 48 36 100 36 Z`, role: 'primary' },
    { d: poly([[44, 92], [86, 104], [80, 120], [40, 110]]), role: 'accent' },
    { d: poly([[156, 92], [114, 104], [120, 120], [160, 110]]), role: 'accent' },
    { d: poly([[46, 56], [78, 76], [66, 84], [38, 68]]), role: 'secondary' },
    { d: poly([[154, 56], [122, 76], [134, 84], [162, 68]]), role: 'secondary' },
    { d: `M 78 134 C 90 128 110 128 122 134 C 126 152 114 166 100 166 C 86 166 74 152 78 134 Z`, role: 'secondary' },
    { d: poly([[88, 140], [112, 140], [100, 154]]), role: 'accent' },
  ]),

  G('ram', 'Ram Head', 'Mascots', ['ram', 'goat', 'horns'], [
    { d: spiralHorn(1), role: 'secondary', stroke: 16 },
    { d: spiralHorn(-1), role: 'secondary', stroke: 16 },
    { d: poly([[74, 52], [126, 52], [136, 118], [100, 186], [64, 118]]), role: 'primary' },
    { d: poly([[76, 92], [96, 100], [92, 112], [72, 104]]), role: 'accent' },
    { d: poly([[124, 92], [104, 100], [108, 112], [128, 104]]), role: 'accent' },
  ]),

  G('spartan', 'Spartan Helmet', 'Mascots', ['spartan', 'warrior', 'helmet', 'greek'], [
    { d: `M 100 26 C 60 26 44 60 44 96 L 44 150 C 44 174 62 190 82 190 L 82 150 L 118 150 L 118 190 C 138 190 156 174 156 150 L 156 96 C 156 60 140 26 100 26 Z`, role: 'primary' },
    { d: `M 100 12 C 118 12 132 26 132 44 L 132 78 L 112 78 L 112 44 C 112 34 106 28 100 28 C 94 28 88 34 88 44 L 88 78 L 68 78 L 68 44 C 68 26 82 12 100 12 Z`, role: 'accent' },
    { d: poly([[92, 60], [108, 60], [108, 150], [92, 150]]), role: 'secondary' },
    { d: poly([[52, 84], [86, 84], [86, 112], [56, 112]]), role: 'secondary' },
    { d: poly([[148, 84], [114, 84], [114, 112], [144, 112]]), role: 'secondary' },
  ]),

  G('knight', 'Knight Helm', 'Mascots', ['knight', 'crusader', 'medieval'], [
    { d: `M 62 22 L 138 22 C 152 22 158 34 158 52 L 158 140 C 158 170 132 190 100 190 C 68 190 42 170 42 140 L 42 52 C 42 34 48 22 62 22 Z`, role: 'primary' },
    { d: poly([[54, 70], [146, 70], [146, 92], [54, 92]]), role: 'secondary' },
    { d: poly([[88, 92], [112, 92], [112, 150], [88, 150]]), role: 'secondary' },
    { d: poly([[56, 116], [88, 116], [88, 132], [56, 132]]), role: 'secondary' },
    { d: poly([[144, 116], [112, 116], [112, 132], [144, 132]]), role: 'secondary' },
    { d: poly([[92, 4], [108, 4], [116, 24], [84, 24]]), role: 'accent' },
  ]),

  G('viking', 'Viking Helmet', 'Mascots', ['viking', 'norse', 'horns'], [
    { d: `M 100 44 C 138 44 162 72 162 112 L 162 140 L 38 140 L 38 112 C 38 72 62 44 100 44 Z`, role: 'primary' },
    { d: poly([[92, 74], [108, 74], [108, 140], [92, 140]]), role: 'secondary' },
    { d: poly([[38, 140], [162, 140], [162, 162], [38, 162]]), role: 'secondary' },
    { d: `M 44 112 C 10 106 -2 70 12 40 C 30 62 38 74 60 82 Z`, role: 'accent' },
    { d: `M 156 112 C 190 106 202 70 188 40 C 170 62 162 74 140 82 Z`, role: 'accent' },
  ]),

  G('skull', 'Skull', 'Mascots', ['skull', 'pirate', 'bones'], [
    { d: `M 100 18 C 148 18 178 52 178 100 C 178 128 164 146 148 156 L 144 182 L 56 182 L 52 156 C 36 146 22 128 22 100 C 22 52 52 18 100 18 Z`, role: 'primary' },
    { d: `M 62 88 C 76 88 86 100 86 114 C 86 128 76 138 62 138 C 48 138 38 128 38 114 C 38 100 48 88 62 88 Z`, role: 'accent' },
    { d: `M 138 88 C 152 88 162 100 162 114 C 162 128 152 138 138 138 C 124 138 114 128 114 114 C 114 100 124 88 138 88 Z`, role: 'accent' },
    { d: poly([[100, 122], [112, 148], [88, 148]]), role: 'accent' },
    { d: poly([[70, 160], [82, 160], [82, 182], [70, 182]]), role: 'accent' },
    { d: poly([[94, 160], [106, 160], [106, 182], [94, 182]]), role: 'accent' },
    { d: poly([[118, 160], [130, 160], [130, 182], [118, 182]]), role: 'accent' },
  ]),

  G('dragon', 'Dragon Head', 'Mascots', ['dragon', 'fantasy', 'fire'], [
    { d: `M 24 128 C 20 84 52 52 96 50 L 100 24 L 124 48 C 166 56 186 92 176 128 L 148 122 C 152 96 132 76 106 78 C 78 80 62 104 68 130 Z`, role: 'primary' },
    { d: `M 60 130 C 84 118 132 118 158 132 C 176 142 178 168 156 176 C 122 190 74 186 52 170 C 36 158 44 138 60 130 Z`, role: 'secondary' },
    { d: poly([[84, 142], [104, 142], [96, 166], [82, 166]]), role: 'accent' },
    { d: poly([[116, 142], [136, 142], [130, 166], [114, 166]]), role: 'accent' },
    { d: circle(84, 92, 11), role: 'accent' },
    { d: poly([[150, 34], [186, 12], [178, 52]]), role: 'accent' },
  ]),

  G('paw', 'Paw Print', 'Mascots', ['paw', 'claw', 'animal'], [
    { d: `M 100 92 C 130 92 156 116 156 142 C 156 166 132 178 100 178 C 68 178 44 166 44 142 C 44 116 70 92 100 92 Z`, role: 'primary' },
    { d: circle(48, 66, 22), role: 'primary' },
    { d: circle(82, 40, 22), role: 'primary' },
    { d: circle(118, 40, 22), role: 'primary' },
    { d: circle(152, 66, 22), role: 'primary' },
  ]),

  G('claw', 'Claw Marks', 'Mascots', ['claw', 'scratch', 'slash'], [
    { d: `M 30 22 C 52 78 66 130 62 186 L 40 178 C 44 126 36 74 22 30 Z`, role: 'primary' },
    { d: `M 78 12 C 100 72 112 128 108 190 L 84 182 C 90 126 84 68 68 20 Z`, role: 'primary' },
    { d: `M 126 20 C 148 76 158 130 154 186 L 132 178 C 138 126 130 74 116 28 Z`, role: 'primary' },
  ]),

  /* ---- sport equipment ---- */
  G('basketball', 'Basketball', 'Sports', ['basketball', 'ball', 'hoops'], [
    { d: circle(100, 100, 88), role: 'primary' },
    { d: `M 12 100 H 188 M 100 12 V 188`, role: 'accent', stroke: 7 },
    { d: `M 34 34 C 78 78 78 122 34 166 M 166 34 C 122 78 122 122 166 166`, role: 'accent', stroke: 7 },
  ]),

  G('football', 'Football', 'Sports', ['football', 'gridiron', 'ball'], [
    { d: `M 100 34 C 152 34 188 66 188 100 C 188 134 152 166 100 166 C 48 166 12 134 12 100 C 12 66 48 34 100 34 Z`, role: 'primary' },
    { d: `M 74 100 H 126`, role: 'accent', stroke: 8 },
    { d: `M 84 88 V 112 M 96 88 V 112 M 108 88 V 112 M 120 88 V 112`, role: 'accent', stroke: 6 },
    { d: `M 34 78 C 30 92 30 108 34 122 M 166 78 C 170 92 170 108 166 122`, role: 'accent', stroke: 7 },
  ]),

  G('baseball', 'Baseball', 'Sports', ['baseball', 'softball', 'ball'], [
    { d: circle(100, 100, 88), role: 'primary' },
    { d: `M 44 32 C 68 68 68 132 44 168 M 156 32 C 132 68 132 132 156 168`, role: 'accent', stroke: 6 },
    { d: `M 52 52 l 12 8 M 50 74 l 14 6 M 50 96 l 14 4 M 50 118 l 14 -2 M 52 140 l 13 -6
           M 148 52 l -12 8 M 150 74 l -14 6 M 150 96 l -14 4 M 150 118 l -14 -2 M 148 140 l -13 -6`, role: 'accent', stroke: 5 },
  ]),

  G('soccer', 'Soccer Ball', 'Sports', ['soccer', 'football', 'ball'], [
    { d: circle(100, 100, 88), role: 'primary' },
    { d: poly([[100, 56], [136, 82], [122, 124], [78, 124], [64, 82]]), role: 'secondary' },
    { d: poly([[100, 12], [124, 30], [116, 54], [84, 54], [76, 30]]), role: 'secondary' },
    { d: poly([[26, 84], [58, 66], [70, 96], [48, 124], [22, 112]]), role: 'secondary' },
    { d: poly([[174, 84], [142, 66], [130, 96], [152, 124], [178, 112]]), role: 'secondary' },
    { d: poly([[78, 138], [122, 138], [130, 168], [100, 186], [70, 168]]), role: 'secondary' },
  ]),

  G('hockey', 'Hockey Sticks', 'Sports', ['hockey', 'stick', 'puck', 'ice'], [
    { d: `M 26 24 L 44 16 L 128 150 L 176 168 L 168 186 L 112 164 Z`, role: 'primary' },
    { d: `M 174 24 L 156 16 L 72 150 L 24 168 L 32 186 L 88 164 Z`, role: 'secondary' },
    { d: `M 100 128 C 122 128 138 136 138 148 C 138 160 122 168 100 168 C 78 168 62 160 62 148 C 62 136 78 128 100 128 Z`, role: 'accent' },
  ]),

  G('volleyball', 'Volleyball', 'Sports', ['volleyball', 'ball'], [
    { d: circle(100, 100, 88), role: 'primary' },
    { d: `M 100 12 C 60 60 54 140 82 186 M 100 12 C 148 44 172 108 160 160 M 12 100 C 68 84 140 100 178 140`, role: 'accent', stroke: 8 },
  ]),

  G('tennis', 'Racket', 'Sports', ['tennis', 'racket', 'badminton'], [
    { d: `M 100 12 C 142 12 168 48 168 92 C 168 132 140 160 100 160 C 60 160 32 132 32 92 C 32 48 58 12 100 12 Z`, role: 'primary' },
    { d: `M 100 30 C 132 30 150 56 150 92 C 150 122 130 142 100 142 C 70 142 50 122 50 92 C 50 56 68 30 100 30 Z`, role: 'secondary' },
    { d: `M 88 158 L 112 158 L 108 192 L 92 192 Z`, role: 'accent' },
  ]),

  G('bat', 'Bat & Ball', 'Sports', ['baseball', 'bat', 'softball'], [
    { d: `M 168 20 C 178 30 178 42 168 52 L 92 128 L 60 96 L 136 20 C 146 10 158 10 168 20 Z`, role: 'primary' },
    { d: `M 56 100 L 88 132 L 52 168 C 44 176 30 176 22 168 C 14 160 14 146 22 138 Z`, role: 'secondary' },
    { d: circle(50, 50, 30), role: 'accent' },
  ]),

  G('trophy', 'Trophy', 'Sports', ['trophy', 'cup', 'champion', 'award'], [
    { d: `M 56 22 L 144 22 L 140 84 C 140 116 122 136 100 136 C 78 136 60 116 60 84 Z`, role: 'primary' },
    { d: `M 56 34 L 30 34 C 22 62 34 92 60 96 L 58 76 C 44 72 40 56 44 48 L 56 48 Z`, role: 'secondary' },
    { d: `M 144 34 L 170 34 C 178 62 166 92 140 96 L 142 76 C 156 72 160 56 156 48 L 144 48 Z`, role: 'secondary' },
    { d: poly([[88, 136], [112, 136], [112, 160], [88, 160]]), role: 'secondary' },
    { d: poly([[60, 160], [140, 160], [148, 184], [52, 184]]), role: 'accent' },
  ]),

  G('medal', 'Medal', 'Sports', ['medal', 'award', 'champion'], [
    { d: poly([[64, 10], [96, 10], [116, 72], [84, 82]]), role: 'secondary' },
    { d: poly([[136, 10], [104, 10], [84, 72], [116, 82]]), role: 'secondary' },
    { d: circle(100, 132, 56), role: 'primary' },
    { d: circle(100, 132, 42), role: 'accent' },
    { d: starPath(100, 132, 30, 5, 0.42), role: 'secondary' },
  ]),

  G('whistle', 'Whistle', 'Sports', ['coach', 'whistle', 'referee'], [
    { d: `M 20 82 L 108 82 C 140 82 164 100 164 124 C 164 150 140 168 108 168 C 76 168 52 150 52 124 L 20 124 Z`, role: 'primary' },
    { d: circle(112, 124, 20), role: 'accent' },
    { d: `M 20 82 L 20 124 L 6 118 L 6 88 Z`, role: 'secondary' },
  ]),

  G('flag', 'Checkered Flag', 'Sports', ['racing', 'flag', 'finish'], [
    { d: poly([[30, 18], [42, 18], [42, 188], [30, 188]]), role: 'accent' },
    { d: poly([[42, 24], [178, 24], [178, 118], [42, 118]]), role: 'primary' },
    { d: `M 42 24 h 34 v 24 h -34 Z M 110 24 h 34 v 24 h -34 Z M 76 48 h 34 v 24 h -34 Z M 144 48 h 34 v 24 h -34 Z
           M 42 72 h 34 v 23 h -34 Z M 110 72 h 34 v 23 h -34 Z M 76 95 h 34 v 23 h -34 Z M 144 95 h 34 v 23 h -34 Z`, role: 'secondary' },
  ]),

  G('dumbbell', 'Dumbbell', 'Sports', ['gym', 'fitness', 'weights'], [
    { d: poly([[60, 88], [140, 88], [140, 112], [60, 112]]), role: 'primary' },
    { d: poly([[30, 62], [58, 62], [58, 138], [30, 138]]), role: 'secondary' },
    { d: poly([[142, 62], [170, 62], [170, 138], [142, 138]]), role: 'secondary' },
    { d: poly([[12, 78], [30, 78], [30, 122], [12, 122]]), role: 'accent' },
    { d: poly([[170, 78], [188, 78], [188, 122], [170, 122]]), role: 'accent' },
  ]),

  /* ---- icons ---- */
  G('crown', 'Crown', 'Icons', ['crown', 'king', 'royal'], [
    { d: poly([[16, 60], [58, 108], [100, 34], [142, 108], [184, 60], [170, 156], [30, 156]]), role: 'primary' },
    { d: poly([[30, 160], [170, 160], [170, 184], [30, 184]]), role: 'secondary' },
    { d: circle(16, 52, 12), role: 'accent' },
    { d: circle(184, 52, 12), role: 'accent' },
    { d: circle(100, 26, 12), role: 'accent' },
  ]),

  G('anchor', 'Anchor', 'Icons', ['anchor', 'nautical', 'sail'], [
    { d: poly([[92, 46], [108, 46], [108, 176], [92, 176]]), role: 'primary' },
    { d: circle(100, 32, 20), role: 'primary' },
    { d: circle(100, 32, 9), role: 'secondary' },
    { d: poly([[56, 62], [144, 62], [144, 80], [56, 80]]), role: 'primary' },
    { d: `M 22 108 C 22 158 58 186 100 186 C 142 186 178 158 178 108 L 158 108 C 158 146 132 166 100 166 C 68 166 42 146 42 108 Z`, role: 'primary' },
  ]),

  G('compass', 'Compass Rose', 'Icons', ['compass', 'north', 'explore'], [
    { d: circle(100, 100, 92), role: 'primary' },
    { d: circle(100, 100, 78), role: 'secondary' },
    { d: poly([[100, 18], [118, 92], [100, 110], [82, 92]]), role: 'accent' },
    { d: poly([[100, 182], [82, 108], [100, 90], [118, 108]]), role: 'primary' },
    { d: poly([[18, 100], [92, 82], [110, 100], [92, 118]]), role: 'primary' },
    { d: poly([[182, 100], [108, 118], [90, 100], [108, 82]]), role: 'accent' },
  ]),

  G('mountain', 'Mountain', 'Icons', ['mountain', 'peak', 'outdoor'], [
    { d: poly([[10, 168], [72, 62], [110, 122], [134, 88], [190, 168]]), role: 'primary' },
    { d: poly([[46, 118], [72, 62], [98, 118], [84, 108], [72, 122], [58, 106]]), role: 'secondary' },
    { d: poly([[10, 168], [190, 168], [190, 184], [10, 184]]), role: 'accent' },
  ]),

  G('wave', 'Wave', 'Icons', ['wave', 'surf', 'ocean'], [
    { d: `M 8 138 C 42 108 66 152 100 128 C 134 104 158 148 192 118 L 192 156 C 158 186 134 142 100 166 C 66 190 42 146 8 176 Z`, role: 'primary' },
    { d: `M 8 90 C 42 60 66 104 100 80 C 134 56 158 100 192 70 L 192 100 C 158 130 134 86 100 110 C 66 134 42 90 8 120 Z`, role: 'secondary' },
  ]),

  G('rocket', 'Rocket', 'Icons', ['rocket', 'space', 'launch'], [
    { d: `M 100 8 C 128 40 142 82 142 122 L 58 122 C 58 82 72 40 100 8 Z`, role: 'primary' },
    { d: circle(100, 74, 20), role: 'accent' },
    { d: poly([[58, 96], [30, 150], [58, 142]]), role: 'secondary' },
    { d: poly([[142, 96], [170, 150], [142, 142]]), role: 'secondary' },
    { d: poly([[76, 122], [124, 122], [116, 152], [84, 152]]), role: 'secondary' },
    { d: `M 84 156 C 92 178 92 188 100 196 C 108 188 108 178 116 156 Z`, role: 'accent' },
  ]),

  G('shield-cross', 'Shield & Bolt', 'Icons', ['shield', 'power', 'energy'], [
    { d: shieldPath(0), role: 'primary' },
    { d: shieldPath(0, 62, 38, 168), role: 'secondary' },
    { d: `M 112 52 L 76 112 L 100 112 L 88 162 L 128 98 L 102 98 Z`, role: 'accent' },
  ]),

  G('target', 'Target', 'Icons', ['target', 'aim', 'bullseye'], [
    { d: circle(100, 100, 92), role: 'primary' },
    { d: circle(100, 100, 68), role: 'secondary' },
    { d: circle(100, 100, 44), role: 'primary' },
    { d: circle(100, 100, 20), role: 'accent' },
  ]),

  G('music', 'Music Note', 'Icons', ['music', 'band', 'note'], [
    { d: `M 78 24 L 168 8 L 168 44 L 78 60 Z`, role: 'primary' },
    { d: poly([[78, 24], [94, 24], [94, 142], [78, 142]]), role: 'primary' },
    { d: poly([[152, 8], [168, 8], [168, 122], [152, 122]]), role: 'primary' },
    { d: `M 60 120 C 78 120 94 130 94 144 C 94 160 78 172 58 172 C 40 172 26 160 26 146 C 26 132 42 120 60 120 Z`, role: 'secondary' },
    { d: `M 134 100 C 152 100 168 110 168 124 C 168 140 152 152 132 152 C 114 152 100 140 100 126 C 100 112 116 100 134 100 Z`, role: 'secondary' },
  ]),

  G('code', 'Code Brackets', 'Icons', ['code', 'dev', 'esports', 'tech'], [
    { d: `M 70 34 L 92 50 L 46 100 L 92 150 L 70 166 L 8 100 Z`, role: 'primary' },
    { d: `M 130 34 L 108 50 L 154 100 L 108 150 L 130 166 L 192 100 Z`, role: 'primary' },
    { d: poly([[104, 26], [124, 30], [96, 174], [76, 170]]), role: 'accent' },
  ]),

  G('controller', 'Controller', 'Icons', ['gaming', 'esports', 'controller'], [
    { d: `M 56 62 L 144 62 C 176 62 194 104 190 138 C 186 168 156 176 140 156 L 122 132 L 78 132 L 60 156 C 44 176 14 168 10 138 C 6 104 24 62 56 62 Z`, role: 'primary' },
    { d: poly([[40, 90], [54, 90], [54, 118], [40, 118]]), role: 'accent' },
    { d: poly([[33, 97], [61, 97], [61, 111], [33, 111]]), role: 'accent' },
    { d: circle(146, 96, 11), role: 'accent' },
    { d: circle(166, 116, 11), role: 'accent' },
    { d: circle(126, 116, 11), role: 'accent' },
  ]),

  G('heart', 'Heart', 'Icons', ['heart', 'love', 'health'], [
    { d: `M 100 178 C 40 134 12 104 12 70 C 12 42 34 22 60 22 C 78 22 92 32 100 46 C 108 32 122 22 140 22 C 166 22 188 42 188 70 C 188 104 160 134 100 178 Z`, role: 'primary' },
  ]),

  G('cross', 'Medical Cross', 'Icons', ['medical', 'health', 'first aid'], [
    { d: poly([[76, 16], [124, 16], [124, 76], [184, 76], [184, 124], [124, 124], [124, 184], [76, 184], [76, 124], [16, 124], [16, 76], [76, 76]]), role: 'primary' },
  ]),

  G('leaf', 'Leaf', 'Icons', ['leaf', 'nature', 'eco'], [
    { d: `M 176 20 C 176 100 130 176 34 180 C 24 116 62 36 176 20 Z`, role: 'primary' },
    { d: `M 34 180 C 76 128 122 82 176 20`, role: 'accent', stroke: 8 },
  ]),

  G('sun', 'Sun', 'Icons', ['sun', 'summer', 'beach'], [
    { d: circle(100, 100, 54), role: 'primary' },
    { d: burstPath(100, 100, 96, 12, 0.68), role: 'accent' },
  ]),

  G('arrow-up', 'Arrow', 'Icons', ['arrow', 'up', 'growth'], [
    { d: poly([[100, 10], [180, 96], [134, 96], [134, 190], [66, 190], [66, 96], [20, 96]]), role: 'primary' },
  ]),

  G('brush', 'Paint Stroke', 'Icons', ['brush', 'paint', 'art', 'grunge'], [
    { d: `M 10 84 C 60 58 110 106 160 74 C 176 64 190 70 190 86 C 190 104 176 108 158 116 C 108 138 62 100 24 120 C 10 128 4 96 10 84 Z`, role: 'primary' },
    { d: `M 22 132 C 60 118 96 146 136 134 L 132 152 C 96 164 58 140 26 150 Z`, role: 'secondary' },
  ]),
];

/* ------------------------------------------------------------------ index */

export const ART_GROUPS = ['Shapes', 'Frames', 'Mascots', 'Sports', 'Icons'];

export function generatorList() {
  return GENERATORS.map((g) => ({ ...g, kind: 'generator' }));
}

export function graphicList() {
  return GRAPHICS.map((g) => ({ ...g, kind: 'graphic' }));
}

export function allArt() {
  return [...generatorList(), ...graphicList()];
}

export function findArt(id) {
  return allArt().find((a) => a.id === id) || null;
}

export function buildArt(id, params) {
  const item = findArt(id);
  if (!item) return [];
  if (item.kind === 'generator') {
    const p = { ...Object.fromEntries((item.params || []).map((x) => [x.k, x.val])), ...(params || {}) };
    return item.build(p);
  }
  return item.parts;
}

export function defaultArtParams(id) {
  const item = findArt(id);
  if (!item || item.kind !== 'generator') return {};
  return Object.fromEntries((item.params || []).map((x) => [x.k, x.val]));
}

export { starPath, ngonPath, shieldPath, circle as circlePath };
