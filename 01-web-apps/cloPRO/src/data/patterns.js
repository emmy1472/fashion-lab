/* cloPRO — fill styles: patterns, gradients and textures.
 * Every style is a pure function of (uid, colors, params) that returns SVG
 * <defs> markup plus the paint reference to use as a `fill`.
 */

const R = (seed) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/* Each style: {id, name, group, colors: n, params: [...], build(uid, c, p)} */
export const STYLES = [
  {
    id: 'solid', name: 'Solid', group: 'Basic', colors: 1, params: [],
    build: (uid, c) => ({ defs: '', fill: c[0] }),
  },

  {
    id: 'linear', name: 'Linear Fade', group: 'Basic', colors: 2,
    params: [{ k: 'angle', label: 'Angle', min: 0, max: 360, val: 90 }, { k: 'mid', label: 'Blend', min: 5, max: 95, val: 50 }],
    build: (uid, c, p) => {
      const a = (p.angle - 90) * (Math.PI / 180);
      const x1 = 50 - Math.cos(a) * 50, y1 = 50 - Math.sin(a) * 50;
      const x2 = 50 + Math.cos(a) * 50, y2 = 50 + Math.sin(a) * 50;
      return {
        defs: `<linearGradient id="${uid}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          <stop offset="0" stop-color="${esc(c[0])}"/>
          <stop offset="${p.mid / 100}" stop-color="${esc(c[0])}"/>
          <stop offset="1" stop-color="${esc(c[1])}"/></linearGradient>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'radial', name: 'Radial Burst', group: 'Basic', colors: 2,
    params: [{ k: 'size', label: 'Spread', min: 20, max: 140, val: 75 }, { k: 'cy', label: 'Height', min: 0, max: 100, val: 42 }],
    build: (uid, c, p) => ({
      defs: `<radialGradient id="${uid}" cx="50%" cy="${p.cy}%" r="${p.size}%">
        <stop offset="0" stop-color="${esc(c[1])}"/><stop offset="1" stop-color="${esc(c[0])}"/></radialGradient>`,
      fill: `url(#${uid})`,
    }),
  },

  {
    id: 'stripes', name: 'Stripes', group: 'Stripes', colors: 2,
    params: [
      { k: 'width', label: 'Width', min: 4, max: 90, val: 26 },
      { k: 'gap', label: 'Gap', min: 4, max: 90, val: 26 },
      { k: 'angle', label: 'Angle', min: 0, max: 180, val: 0 },
    ],
    build: (uid, c, p) => {
      const w = p.width + p.gap;
      return {
        defs: `<pattern id="${uid}" width="${w}" height="${w}" patternUnits="userSpaceOnUse" patternTransform="rotate(${p.angle})">
          <rect width="${w}" height="${w}" fill="${esc(c[0])}"/>
          <rect width="${p.width}" height="${w}" fill="${esc(c[1])}"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'pinstripe', name: 'Pinstripe', group: 'Stripes', colors: 2,
    params: [{ k: 'gap', label: 'Spacing', min: 8, max: 80, val: 26 }, { k: 'width', label: 'Weight', min: 1, max: 10, val: 3 }, { k: 'angle', label: 'Angle', min: 0, max: 180, val: 0 }],
    build: (uid, c, p) => ({
      defs: `<pattern id="${uid}" width="${p.gap}" height="${p.gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${p.angle})">
        <rect width="${p.gap}" height="${p.gap}" fill="${esc(c[0])}"/>
        <rect width="${p.width}" height="${p.gap}" fill="${esc(c[1])}"/></pattern>`,
      fill: `url(#${uid})`,
    }),
  },

  {
    id: 'triple-stripe', name: 'Triple Stripe', group: 'Stripes', colors: 3,
    params: [{ k: 'scale', label: 'Scale', min: 20, max: 160, val: 70 }, { k: 'angle', label: 'Angle', min: 0, max: 180, val: 0 }],
    build: (uid, c, p) => {
      const u = p.scale;
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse" patternTransform="rotate(${p.angle})">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>
          <rect y="0" width="${u}" height="${u * 0.16}" fill="${esc(c[1])}"/>
          <rect y="${u * 0.2}" width="${u}" height="${u * 0.08}" fill="${esc(c[2])}"/>
          <rect y="${u * 0.32}" width="${u}" height="${u * 0.16}" fill="${esc(c[1])}"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'chevron', name: 'Chevron', group: 'Stripes', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 16, max: 140, val: 54 }, { k: 'weight', label: 'Weight', min: 10, max: 80, val: 45 }],
    build: (uid, c, p) => {
      const u = p.scale;
      const t = (u * p.weight) / 100;
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>
          <path d="M0 ${u * 0.5} L${u * 0.5} 0 L${u} ${u * 0.5} L${u} ${u * 0.5 + t} L${u * 0.5} ${t} L0 ${u * 0.5 + t} Z" fill="${esc(c[1])}"/>
          <path d="M0 ${-u * 0.5} L${u * 0.5} ${-u} L${u} ${-u * 0.5} L${u} ${-u * 0.5 + t} L${u * 0.5} ${-u + t} L0 ${-u * 0.5 + t} Z" fill="${esc(c[1])}"/>
          </pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'dots', name: 'Halftone Dots', group: 'Texture', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 8, max: 80, val: 24 }, { k: 'size', label: 'Dot size', min: 5, max: 50, val: 26 }],
    build: (uid, c, p) => {
      const u = p.scale;
      const r = (u * p.size) / 100;
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>
          <circle cx="${u * 0.25}" cy="${u * 0.25}" r="${r}" fill="${esc(c[1])}"/>
          <circle cx="${u * 0.75}" cy="${u * 0.75}" r="${r}" fill="${esc(c[1])}"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'grid', name: 'Grid Mesh', group: 'Texture', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 8, max: 90, val: 28 }, { k: 'weight', label: 'Line', min: 1, max: 14, val: 3 }],
    build: (uid, c, p) => ({
      defs: `<pattern id="${uid}" width="${p.scale}" height="${p.scale}" patternUnits="userSpaceOnUse">
        <rect width="${p.scale}" height="${p.scale}" fill="${esc(c[0])}"/>
        <path d="M0 0 H${p.scale} M0 0 V${p.scale}" stroke="${esc(c[1])}" stroke-width="${p.weight}" fill="none"/></pattern>`,
      fill: `url(#${uid})`,
    }),
  },

  {
    id: 'hex', name: 'Hex Cells', group: 'Texture', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 12, max: 90, val: 32 }, { k: 'weight', label: 'Line', min: 1, max: 10, val: 2.5 }],
    build: (uid, c, p) => {
      const s = p.scale;
      const h = s * Math.sqrt(3);
      const hex = (cx, cy) => {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 180) * (60 * i - 30);
          pts.push(`${(cx + s * 0.5 * Math.cos(a)).toFixed(2)},${(cy + s * 0.5 * Math.sin(a)).toFixed(2)}`);
        }
        return `<polygon points="${pts.join(' ')}" fill="none" stroke="${esc(c[1])}" stroke-width="${p.weight}"/>`;
      };
      const w = s * 1.5;
      return {
        defs: `<pattern id="${uid}" width="${w}" height="${h * 0.5}" patternUnits="userSpaceOnUse">
          <rect width="${w}" height="${h * 0.5}" fill="${esc(c[0])}"/>
          ${hex(0, 0)}${hex(w, 0)}${hex(w * 0.5, h * 0.25)}${hex(0, h * 0.5)}${hex(w, h * 0.5)}</pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'carbon', name: 'Carbon Weave', group: 'Texture', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 6, max: 50, val: 16 }],
    build: (uid, c, p) => {
      const u = p.scale;
      return {
        defs: `<pattern id="${uid}" width="${u * 2}" height="${u * 2}" patternUnits="userSpaceOnUse">
          <rect width="${u * 2}" height="${u * 2}" fill="${esc(c[0])}"/>
          <rect width="${u}" height="${u}" fill="${esc(c[1])}" opacity="0.85"/>
          <rect x="${u}" y="${u}" width="${u}" height="${u}" fill="${esc(c[1])}" opacity="0.85"/>
          <rect x="${u}" width="${u}" height="${u}" fill="${esc(c[1])}" opacity="0.35"/>
          <rect y="${u}" width="${u}" height="${u}" fill="${esc(c[1])}" opacity="0.35"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'camo', name: 'Camo', group: 'Camo', colors: 3,
    params: [{ k: 'scale', label: 'Scale', min: 60, max: 400, val: 190 }, { k: 'seed', label: 'Variant', min: 1, max: 40, val: 7 }],
    build: (uid, c, p) => {
      const u = p.scale;
      const rnd = R(p.seed * 9176 + 13);
      const blob = (col, count, rad) => {
        let d = '';
        for (let i = 0; i < count; i++) {
          const cx = rnd() * u;
          const cy = rnd() * u;
          const pts = [];
          const lobes = 7 + Math.floor(rnd() * 4);
          for (let j = 0; j < lobes; j++) {
            const a = (j / lobes) * Math.PI * 2;
            const rr = rad * (0.55 + rnd() * 0.75);
            pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
          }
          d += `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
          for (let j = 0; j < pts.length; j++) {
            const a1 = pts[(j + 1) % pts.length];
            const a2 = pts[(j + 2) % pts.length];
            d += `Q ${a1[0].toFixed(1)} ${a1[1].toFixed(1)} ${((a1[0] + a2[0]) / 2).toFixed(1)} ${((a1[1] + a2[1]) / 2).toFixed(1)} `;
          }
          d += 'Z ';
        }
        return `<path d="${d}" fill="${esc(col)}"/>`;
      };
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>
          ${blob(c[1], 6, u * 0.19)}${blob(c[2], 5, u * 0.13)}</pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'digicamo', name: 'Digital Camo', group: 'Camo', colors: 3,
    params: [{ k: 'scale', label: 'Pixel', min: 6, max: 40, val: 14 }, { k: 'seed', label: 'Variant', min: 1, max: 40, val: 3 }],
    build: (uid, c, p) => {
      const u = p.scale;
      const cells = 10;
      const rnd = R(p.seed * 7717 + 31);
      let rects = '';
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          const v = rnd();
          const col = v < 0.42 ? null : v < 0.72 ? c[1] : c[2];
          if (col) rects += `<rect x="${x * u}" y="${y * u}" width="${u}" height="${u}" fill="${esc(col)}"/>`;
        }
      }
      return {
        defs: `<pattern id="${uid}" width="${u * cells}" height="${u * cells}" patternUnits="userSpaceOnUse">
          <rect width="${u * cells}" height="${u * cells}" fill="${esc(c[0])}"/>${rects}</pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'plaid', name: 'Plaid', group: 'Texture', colors: 3,
    params: [{ k: 'scale', label: 'Scale', min: 20, max: 160, val: 66 }],
    build: (uid, c, p) => {
      const u = p.scale;
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>
          <rect width="${u}" height="${u * 0.34}" fill="${esc(c[1])}" opacity="0.75"/>
          <rect width="${u * 0.34}" height="${u}" fill="${esc(c[1])}" opacity="0.75"/>
          <rect y="${u * 0.6}" width="${u}" height="${u * 0.08}" fill="${esc(c[2])}"/>
          <rect x="${u * 0.6}" width="${u * 0.08}" height="${u}" fill="${esc(c[2])}"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'waves', name: 'Waves', group: 'Motion', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 20, max: 160, val: 60 }, { k: 'weight', label: 'Weight', min: 2, max: 30, val: 9 }],
    build: (uid, c, p) => {
      const u = p.scale;
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u * 0.5}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u * 0.5}" fill="${esc(c[0])}"/>
          <path d="M0 ${u * 0.25} Q ${u * 0.25} 0 ${u * 0.5} ${u * 0.25} T ${u} ${u * 0.25}"
            stroke="${esc(c[1])}" stroke-width="${p.weight}" fill="none"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'speed', name: 'Speed Lines', group: 'Motion', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 20, max: 160, val: 70 }, { k: 'angle', label: 'Angle', min: 0, max: 180, val: 20 }],
    build: (uid, c, p) => {
      const u = p.scale;
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse" patternTransform="rotate(${p.angle})">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>
          <rect width="${u * 0.5}" height="${u * 0.07}" y="${u * 0.1}" fill="${esc(c[1])}"/>
          <rect width="${u * 0.8}" height="${u * 0.05}" y="${u * 0.3}" x="${u * 0.15}" fill="${esc(c[1])}" opacity="0.7"/>
          <rect width="${u * 0.35}" height="${u * 0.09}" y="${u * 0.52}" x="${u * 0.4}" fill="${esc(c[1])}"/>
          <rect width="${u * 0.6}" height="${u * 0.04}" y="${u * 0.75}" fill="${esc(c[1])}" opacity="0.6"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'geo', name: 'Geo Triangles', group: 'Motion', colors: 3,
    params: [{ k: 'scale', label: 'Scale', min: 20, max: 140, val: 52 }],
    build: (uid, c, p) => {
      const u = p.scale;
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>
          <path d="M0 0 L${u * 0.5} 0 L0 ${u * 0.5} Z" fill="${esc(c[1])}"/>
          <path d="M${u} ${u} L${u * 0.5} ${u} L${u} ${u * 0.5} Z" fill="${esc(c[1])}"/>
          <path d="M${u * 0.5} 0 L${u} ${u * 0.5} L${u} 0 Z" fill="${esc(c[2])}"/>
          <path d="M0 ${u * 0.5} L${u * 0.5} ${u} L0 ${u} Z" fill="${esc(c[2])}"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'splatter', name: 'Splatter', group: 'Grunge', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 60, max: 400, val: 180 }, { k: 'seed', label: 'Variant', min: 1, max: 40, val: 5 }],
    build: (uid, c, p) => {
      const u = p.scale;
      const rnd = R(p.seed * 3313 + 7);
      let dots = '';
      for (let i = 0; i < 90; i++) {
        const r = 1 + rnd() * rnd() * u * 0.05;
        dots += `<circle cx="${(rnd() * u).toFixed(1)}" cy="${(rnd() * u).toFixed(1)}" r="${r.toFixed(1)}" fill="${esc(c[1])}"/>`;
      }
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>${dots}</pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'heather', name: 'Heather', group: 'Grunge', colors: 2,
    params: [{ k: 'grain', label: 'Grain', min: 10, max: 90, val: 45 }],
    build: (uid, c, p) => ({
      defs: `<filter id="${uid}-f" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="${(p.grain / 100).toFixed(3)}" numOctaves="3" seed="4"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
        </filter>
        <pattern id="${uid}" width="240" height="240" patternUnits="userSpaceOnUse">
          <rect width="240" height="240" fill="${esc(c[0])}"/>
          <rect width="240" height="240" fill="${esc(c[1])}" filter="url(#${uid}-f)" opacity="0.55"/></pattern>`,
      fill: `url(#${uid})`,
    }),
  },

  {
    id: 'tiedye', name: 'Tie Dye', group: 'Grunge', colors: 3,
    params: [{ k: 'scale', label: 'Scale', min: 80, max: 400, val: 220 }],
    build: (uid, c, p) => ({
      defs: `<radialGradient id="${uid}-g">
          <stop offset="0" stop-color="${esc(c[2])}"/>
          <stop offset="0.35" stop-color="${esc(c[1])}"/>
          <stop offset="0.62" stop-color="${esc(c[0])}"/>
          <stop offset="0.8" stop-color="${esc(c[1])}"/>
          <stop offset="1" stop-color="${esc(c[2])}"/></radialGradient>
        <filter id="${uid}-w"><feTurbulence type="turbulence" baseFrequency="0.012" numOctaves="3" seed="9"/>
          <feDisplacementMap in="SourceGraphic" scale="46" xChannelSelector="R" yChannelSelector="G"/></filter>
        <pattern id="${uid}" width="${p.scale}" height="${p.scale}" patternUnits="userSpaceOnUse">
          <rect width="${p.scale}" height="${p.scale}" fill="url(#${uid}-g)" filter="url(#${uid}-w)"/></pattern>`,
      fill: `url(#${uid})`,
    }),
  },

  {
    id: 'leopard', name: 'Animal', group: 'Grunge', colors: 3,
    params: [{ k: 'scale', label: 'Scale', min: 40, max: 220, val: 100 }, { k: 'seed', label: 'Variant', min: 1, max: 40, val: 11 }],
    build: (uid, c, p) => {
      const u = p.scale;
      const rnd = R(p.seed * 5051 + 3);
      let s = '';
      for (let i = 0; i < 14; i++) {
        const cx = rnd() * u, cy = rnd() * u, rx = u * (0.05 + rnd() * 0.05), ry = rx * (0.7 + rnd() * 0.6);
        const rot = rnd() * 180;
        s += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(rx * 1.5).toFixed(1)}" ry="${(ry * 1.5).toFixed(1)}" fill="${esc(c[1])}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>
             <ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${esc(c[2])}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
      }
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>${s}</pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'stars', name: 'Stars', group: 'Icons', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 20, max: 160, val: 56 }, { k: 'size', label: 'Size', min: 10, max: 60, val: 30 }],
    build: (uid, c, p) => {
      const u = p.scale;
      const r = (u * p.size) / 100;
      const star = (cx, cy) => {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI / 5) * i - Math.PI / 2;
          const rr = i % 2 ? r * 0.42 : r;
          pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
        }
        return `<polygon points="${pts.join(' ')}" fill="${esc(c[1])}"/>`;
      };
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>${star(u * 0.25, u * 0.25)}${star(u * 0.75, u * 0.75)}</pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'circuit', name: 'Circuit', group: 'Icons', colors: 2,
    params: [{ k: 'scale', label: 'Scale', min: 30, max: 160, val: 64 }, { k: 'weight', label: 'Weight', min: 1, max: 10, val: 3 }],
    build: (uid, c, p) => {
      const u = p.scale;
      return {
        defs: `<pattern id="${uid}" width="${u}" height="${u}" patternUnits="userSpaceOnUse">
          <rect width="${u}" height="${u}" fill="${esc(c[0])}"/>
          <g stroke="${esc(c[1])}" stroke-width="${p.weight}" fill="none">
            <path d="M0 ${u * 0.3} H${u * 0.35} V${u * 0.7} H${u}"/>
            <path d="M${u * 0.65} 0 V${u * 0.25} H${u}"/>
            <path d="M${u * 0.2} ${u} V${u * 0.8}"/></g>
          <g fill="${esc(c[1])}">
            <circle cx="${u * 0.35}" cy="${u * 0.3}" r="${p.weight * 1.6}"/>
            <circle cx="${u * 0.65}" cy="${u * 0.25}" r="${p.weight * 1.6}"/>
            <circle cx="${u * 0.2}" cy="${u * 0.8}" r="${p.weight * 1.6}"/></g></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },

  {
    id: 'fade-stripes', name: 'Faded Stripes', group: 'Stripes', colors: 2,
    params: [{ k: 'width', label: 'Width', min: 4, max: 60, val: 16 }, { k: 'angle', label: 'Angle', min: 0, max: 180, val: 0 }],
    build: (uid, c, p) => {
      const w = p.width * 2;
      return {
        defs: `<linearGradient id="${uid}-m" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <mask id="${uid}-mk"><rect x="-300" y="-300" width="1200" height="1400" fill="url(#${uid}-m)"/></mask>
          <pattern id="${uid}-p" width="${w}" height="${w}" patternUnits="userSpaceOnUse" patternTransform="rotate(${p.angle})">
            <rect width="${w}" height="${w}" fill="${esc(c[0])}"/>
            <rect width="${p.width}" height="${w}" fill="${esc(c[1])}"/></pattern>
          <pattern id="${uid}" width="1200" height="1400" patternUnits="userSpaceOnUse" x="-300" y="-300">
            <rect x="-300" y="-300" width="1200" height="1400" fill="${esc(c[0])}"/>
            <rect x="-300" y="-300" width="1200" height="1400" fill="url(#${uid}-p)" mask="url(#${uid}-mk)"/></pattern>`,
        fill: `url(#${uid})`,
      };
    },
  },
];

export const STYLE_MAP = Object.fromEntries(STYLES.map((s) => [s.id, s]));

export function defaultStyleParams(styleId) {
  const s = STYLE_MAP[styleId];
  if (!s) return {};
  return Object.fromEntries(s.params.map((p) => [p.k, p.val]));
}

/** Build one fill. `paint` = {style, colors:[], params:{}} */
export function buildPaint(uid, paint) {
  const style = STYLE_MAP[paint?.style] || STYLE_MAP.solid;
  const colors = [...(paint?.colors || [])];
  while (colors.length < style.colors) colors.push(['#101418', '#ffffff', '#d62828'][colors.length] || '#888888');
  const params = { ...defaultStyleParams(style.id), ...(paint?.params || {}) };
  return style.build(uid, colors, params);
}

export const STYLE_GROUPS = [...new Set(STYLES.map((s) => s.group))];
