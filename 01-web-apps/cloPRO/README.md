# cloPRO — Custom Apparel Studio

A complete, browser-based apparel design studio. Design jerseys, hoodies, tees, shorts,
caps and more; build your own logos in a built-in layered image editor; then export
print-ready files you can hand straight to Custom Ink, Printful, a screen printer, or a
team jersey builder.

**Live:** https://chezburgar.github.io/cloPRO/

No build step, no dependencies, no accounts. Everything runs in the browser and your work
autosaves to local storage.

---

## What's in it

### Studio — the garment designer
- **31 garment styles** across jerseys (basketball, baseball, football, hockey, soccer,
  volleyball, cycling, rugby, esports), tops (tee, long sleeve, v-neck, tank, polo,
  hoodie, full-zip, crewneck, quarter-zip), outerwear (windbreaker, varsity, coaches
  jacket), bottoms (basketball/soccer/training shorts, joggers, leggings), headwear
  (snapback, beanie) and accessories (socks, tote).
- Every garment is generated from a parameter block, so silhouettes stay consistent and
  print areas map to **real inches** (1 in = 21.5 canvas units).
- **Per-part colouring** — body, sleeves, collar, cuffs, side panels, yokes, plackets,
  hoods, waistbands, sleeve stripes. Click any part on the garment to recolour it.
- **24 fill styles** beyond flat colour: stripes, pinstripe, triple stripe, chevron,
  halftone, grid, hex, carbon weave, camo, digital camo, plaid, waves, speed lines, geo
  triangles, splatter, heather, tie dye, animal, stars, circuit, faded stripes and
  gradients — each with its own parameters.
- **Front and back views**, fabric shading, knit/mesh/fabric textures and four backdrops.
- Drag, scale and rotate artwork directly on the garment, or snap it into a named print
  area (front centre, left chest, name bar, back number, sleeves…).

### Forge — the built-in image editor
A layered raster editor for building logos and badges without leaving the app.
- Tools: move, rectangular select, brush (size + hardness), eraser, paint bucket with
  tolerance, gradient (linear/radial), eyedropper, line, rectangle, ellipse,
  polygon/star, and text.
- Layers with **16 blend modes**, opacity, reordering, duplication and merge-down.
- Adjustments: brightness, contrast, saturation, hue, blur, grayscale, invert, sepia,
  threshold, posterise, recolour.
- Layer effects: outline, drop shadow, glow. Transforms: flip, rotate, centre content.
- Undo/redo, canvas size presets, image import, and **Send to Studio** to drop your
  artwork straight onto the garment.

### Library — the parts bin
82 built-in graphics: parametric generators (stars, polygons, shields, badges,
sunbursts, gears, ribbons, chevrons, wings, laurels, arches, bolts, flames, diamonds,
number plates) plus authored emblems — wolf, eagle, bear, bull, shark, tiger, ram,
spartan, knight, viking, skull, dragon, paw, claws — sport icons, and general icons.
Plus 34 curated palettes, colour-harmony generation, and 26 typefaces tuned for
athletic lettering (block, collegiate, display, tech, vintage, script).

### Team — roster management
Names, numbers, sizes and quantities, with a **live per-player preview** of every jersey
back. Paste a roster from a spreadsheet and it parses names/numbers/sizes automatically.

### Export — the handoff
| File | What it's for |
| --- | --- |
| `mockup-front/back.png` | 1800 × 2100 colour mockups for approval |
| `artwork-*-300dpi.png` | **Transparent 300 DPI print files** — upload these to Custom Ink, Printful, Printify |
| `artwork-*.svg` | True vector with fonts embedded — screen print, tackle twill, vinyl, embroidery digitising |
| `spec-sheet.pdf` | One-page spec: mockups, ink colours, placements in inches, roster |
| `transfer.json` | `clopro-transfer v1` — machine-readable design import for jersey builders |
| `roster.csv` | Names / numbers / sizes / quantities |
| `*.clopro.json` | The editable project file |
| `*-clopro-kit.zip` | All of the above in one archive with an upload guide |

The exporter also checks your colour count against the selected decoration method
(screen print, DTG, sublimation, tackle twill, vinyl, embroidery) and warns when you
exceed it, and names the nearest stock apparel colour for every hex you've used.

---

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Ctrl/⌘ + Z` / `Ctrl/⌘ + Shift + Z` | Undo / redo (works in Studio and Forge) |
| `Ctrl/⌘ + S` | Save to My Designs |
| `Ctrl/⌘ + D` | Duplicate selected artwork |
| `Delete` | Delete selected artwork |
| `[` / `]` | Send back / bring forward |
| Arrow keys | Nudge 1px (`Shift` for 10px) |
| `Shift` + drag | Constrain move to one axis; snap rotation to 15° |

---

## Running it locally

It's a static site — any web server works:

```bash
npx serve .
```

Then open the printed URL. Opening `index.html` directly from disk will not work, because
the app uses ES modules (which browsers block on `file://`).

## How it's built

Vanilla JavaScript, ES modules, no framework and no build step.

```
index.html
styles/app.css
src/
  data/garments.js   parametric garment engine — silhouettes, zones, print areas
  data/patterns.js   fill styles as SVG pattern/gradient generators
  data/graphics.js   artwork library: procedural generators + authored emblems
  data/library.js    palettes, typefaces, size charts, presets, colour maths
  state.js           project schema, history (undo/redo), autosave, gallery
  render.js          project → SVG (drives the canvas, thumbnails and every export)
  export.js          PNG/SVG rasterising, font embedding, ZIP writer, PDF writer
  ui/                studio, forge, library, team, exporter, shared helpers
  main.js            bootstrap, tabs, shortcuts
```

Two pieces worth calling out: `export.js` embeds the Google Fonts used in a design as
base64 `@font-face` rules inside the exported SVG, so rasterised print files and vector
handoffs keep their lettering; and it contains a small dependency-free ZIP writer and
PDF writer so the whole kit is produced client-side.

Designed for desktop-sized screens — it's a studio tool with three working rails.

## Licence

MIT
