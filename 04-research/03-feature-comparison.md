# 03 - Feature Comparison & Component Reusability Matrix

**Platform Project:** FASHION-LAB  
**Date:** October 2026  
**Auditor:** Principal Software Architect & Senior Full-Stack Engineer  
**Workspace Root:** c:\fashion-lab  
**Execution Context:** Evidence-Based Repository Feature & Architecture Audit

---

## 1. Feature Matrix Across Workspace Repositories

| Feature / Capability | cloPRO | FreeSewing v4 | opensew-2 | seamly2d | feysefit | LetDesign | medo |
|---|---|---|---|---|---|---|---|
| **Primary Language** | Modern JS (ESM) | TypeScript | Python 3.11+ | C++ (C++17) | TypeScript 5 | TypeScript 5 | TypeScript |
| **Runtime Target** | Browser (SPA) | Node.js / Browser | Blender 5.2 | Desktop OS (Qt) | Next.js 16 / Node | Browser (Vite) | Node.js (Medusa) |
| **Native Web Execution** | YES | YES | NO (Desktop) | NO (Desktop) | YES | YES | YES |
| **License Type** | MIT (Permissive) | MIT (Permissive) | GPL-3.0 (Copyleft) | GPL-3.0 (Copyleft) | Proprietary / MVP | Unlicensed | MIT (Dual) |
| **User Accounts & Auth** | NO | YES (Community) | NO | NO | YES (Supabase SSR) | PARTIAL (Laravel) | YES (Medusa) |
| **Multi-Factor Auth (MFA)** | NO | NO | NO | NO | YES (TOTP / AAL2) | NO | NO |
| **Role-Based Access Control** | NO | YES | NO | NO | YES (3+ Roles) | YES (3 Roles) | YES (Partner/Admin)|
| **Designer Discovery / Search** | NO | NO | NO | NO | YES (Filters/City) | NO | NO |
| **Marketplace Enquiries** | NO | NO | NO | NO | YES (Threaded) | NO | NO |
| **Anti-Poaching RLS Guards** | NO | NO | NO | NO | YES (Verified RLS) | NO | NO |
| **Appointment / Calendar Slots**| NO | NO | NO | NO | YES (Booking RPC) | NO | NO |
| **2D Garment Design Canvas** | YES (SVG DOM) | NO | NO | YES (Qt 2D CAD) | NO | YES (Fabric.js) | NO |
| **Parametric Garment Engine** | YES (31 styles) | YES (60+ designs)| YES (9 blocks) | YES (High-end CAD)| NO | NO (Flat PNG) | NO |
| **Per-Zone Coloring** | YES (Multi-part)| NO | NO | NO | NO | PARTIAL | NO |
| **Procedural Fills & Textures**| YES (24 patterns)| NO | YES (4 presets) | NO | NO | NO | NO |
| **Artwork & Logo Placement** | YES (Drag/Scale) | NO | NO | NO | NO | YES (Fabric) | NO |
| **Authored Graphic Library** | YES (82 emblems) | NO | NO | NO | NO | NO | NO |
| **Layered Raster Editor** | YES (Forge, 16 modes)| NO | NO | NO | NO | NO | NO |
| **Undo / Redo Stack** | YES (50 levels) | NO | YES (Blender) | YES (Qt Undo) | NO | NO | NO |
| **Real-world Print Units** | YES (1 in = 21.5) | YES (mm-level) | YES (metric) | YES (CAD units) | NO | NO | NO |
| **3D Garment Simulation** | NO | NO | YES (4-phase sim)| NO | NO | YES (Three.js/R3F)| NO |
| **Character Mesh Landmark Read**| NO | NO | YES (Mesh bounds)| NO | NO | NO | NO |
| **Animated Catwalk Drape Test**| NO | NO | YES (Walk/Catwalk)| NO | NO | NO | NO |
| **Made-to-Measure Pattern Gen** | NO | YES (Algorithmic)| YES (Basic) | YES (Graded CAD) | NO | NO | NO |
| **Anthropometric Measurements**| NO | YES (30+ points) | YES (9 points) | YES (SeamlyMe) | YES (Stored schema)| NO | NO |
| **Seam Allowances & Notches** | NO | YES (Parametric) | NO | YES (Full CAD) | NO | NO | NO |
| **Pattern Grading Rules** | NO | YES (Dynamic) | NO | YES (Multisize) | NO | NO | NO |
| **300 DPI Transparent PNG** | YES | NO | NO | NO | NO | NO | NO |
| **Vector SVG Export (Embedded)**| YES | YES | NO | YES | NO | NO | NO |
| **Printable / Spec PDF Export** | YES (One-page spec)| YES (Tiled) | NO | YES | YES (JsPDF) | NO | NO |
| **AAMA / ASTM DXF Export** | NO | DOCUMENTED (plugin)| NO | YES | NO | NO | NO |
| **Client-Side ZIP Generation** | YES (Non-dep ZIP) | NO | NO | NO | NO | NO | NO |
| **Project CRUD & State Mgmt** | NO | NO | NO | NO | YES (Full CRUD) | PARTIAL (Laravel) | YES (Medusa) |
| **Project Line Items / Fabrics**| NO | NO | NO | NO | YES | NO | YES (Inventory) |
| **Production Task Tracking** | NO | NO | NO | NO | PARTIAL (Delivery) | NO | YES (Workflows) |
| **Supply Chain & Raw Materials**| NO | NO | NO | NO | NO | NO | YES (Inventory) |
| **Team Roster (Names/Numbers)** | YES (CSV import) | NO | NO | NO | NO | NO | NO |
| **Threaded Messaging & Files** | NO | NO | NO | NO | YES (Realtime/Files)| NO | YES |
| **Row Level Security (RLS)** | NO | NO | NO | NO | YES (60+ patches) | NO | NO |
| **Automated Test Coverage** | NO | YES (Mocha/C8) | YES (CLI tests) | NO | YES (24 suites) | NO | YES (Playwright)|

---

## 2. In-Depth Reusability Assessment

### 2.1 cloPRO — Visual Fashion Studio Core (Grade: A)
* **Status:** Primary candidate for the interactive 2D design studio.
* **Key Assets to Extract:**
  * Parametric Garment Silhouettes (src/data/garments.js): 31 styles across sportswear, streetwear, outerwear, tops, and bottoms. Each model features defined anchor points and zones.
  * SVG Procedural Pattern Generators (src/data/patterns.js): 24 fill styles including stripes, pinstripes, carbon weave, camo, digital camo, halftone, hex, and gradients.
  * Vector Graphic Library (src/data/graphics.js): 82 procedural generators (stars, polygons, badges, ribbons) and authored emblems.
  * Pure SVG Render Pipeline (src/render.js): Deterministic state-to-DOM renderer.
  * Client-Side Exporter (src/export.js): Dependency-free 300 DPI rasterizer, SVG font embedder, PDF spec generator, and client-side ZIP packaging.
  * Forge Image Editor (src/ui/forge.js): Canvas-based graphics editor with layer blend modes and adjustments.
* **Required Adaptation:**
  * Wrap the imperative DOM rendering into React 19 Client Components (GarmentCanvas.tsx).
  * Replace localStorage with Supabase Storage (.clopro.json) and Supabase PostgreSQL.
  * Add fashion-forward silhouettes (blazers, evening gowns, tailored trousers) to expand beyond athletic apparel.

---

### 2.2 freesewing-v4 — Patternmaking CAD & Grading Library (Grade: A)
* **Status:** Primary candidate for technical made-to-measure pattern generation.
* **Key Assets to Extract:**
  * @freesewing/core (NPM package v4.2.0): Isomorphic computational geometry engine.
  * @freesewing/react: Ready-made React canvas and pattern preview components.
  * Bundled Pattern Catalog: Over 60 complete parametric apparel designs (e.g., breanna, carlton, huey, simon, titan, wahid).
* **Required Adaptation:**
  * Install as NPM dependencies rather than copying code from the monorepo.
  * Create Next.js Route Handlers (/api/patterns/draft) to generate patterns server-side or in Web Workers.
  * Connect FreeSewing anthropometric measurements to the platform customer measurement schema.

---

### 2.3 feysefit — Platform & Security Backbone (Grade: A+)
* **Status:** Primary foundation for authentication, database, security, and project workflows.
* **Key Assets to Extract:**
  * Complete Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 architecture.
  * Supabase PostgreSQL Schema: 50 KB schema.sql plus 60+ migration patches.
  * Industrial Security Suite: Rate limiting (rate-limit-core.ts), HMAC signed states (signed-state.ts), Cloudflare Turnstile CAPTCHA (turnstile.ts), SSRF-safe fetchers (safe-outbound-fetch.ts), upload byte filters (upload-bytes.ts), and session binding (session-binding.ts).
  * Complete Domain Services (src/lib/services/): Over 25 production services covering authentication, designer onboarding, customer onboarding, projects, appointments, messaging, marketplace, and admin controls.
  * 24 automated unit and security test suites.
* **Required Adaptation:**
  * Add the visual design studio and pattern drafting modules into the navigation and project views.
  * Replace custom UI components with standard shadcn/ui components for consistency.

---

### 2.4 LetDesign — 3D Viewer & Canvas Reference (Grade: C)
* **Status:** Reference only.
* **Key Assets to Extract:**
  * React Three Fiber 3D Canvas component (CanvasViewer.tsx).
  * Fabric.js canvas helper functions (fabricUtils.ts, 16 KB).
* **Barriers:**
  * Backend is completely missing from the workspace (requires unavailable Laravel/PHP repository).
  * Bundled 3D mesh (t_shirt_mod.glb) lacks clear licensing provenance.
  * Unlicensed codebase.
* **Recommendation:** Extract only the R3F viewport pattern. Source a properly licensed CC0/MIT 3D apparel mesh.

---

### 2.5 medo — Supply Chain & Production Reference (Grade: B)
* **Status:** Domain model reference for Phase 8 (Production & Manufacturing).
* **Key Assets to Extract:**
  * Data model concepts for pre-production, task assignment, inventory tracking, and artisan partner coordination.
* **Barriers:**
  * Built on MedusaJS v2; running a separate Medusa daemon conflicts with the unified Supabase PostgreSQL architecture.
* **Recommendation:** Translate MedusaJS production models into native PostgreSQL tables during the production milestone.

---

### 2.6 opensew-2 & seamly2d — Desktop Applications (Grade: C-)
* **Status:** Standalone external tools.
* **Barriers:**
  * Desktop runtimes: opensew-2 requires Blender 5.2; seamly2d requires C++/Qt desktop OS.
  * Both are licensed under **GPL-3.0** (Copyleft), which creates legal risks if embedded into a commercial SaaS.
* **Recommendation:** Keep strictly outside the web application. Provide file exchange support (importing/exporting .sm2d XML or DXF files).

---

## 3. Component Reuse Plan

| Target Platform Module | Reused Component / Source | Target File in Fashion-Lab | Integration Mode |
|---|---|---|---|
| Visual Design Studio | cloPRO/src/render.js & garments.js | components/studio/GarmentCanvas.tsx | Adapted React 19 Client Component |
| Studio Color & Fill System | cloPRO/src/data/patterns.js | lib/studio/patterns.ts | Extracted TypeScript Module |
| Artwork Placement & Library | cloPRO/src/data/graphics.js | components/studio/ArtworkPanel.tsx | Extracted & UI Adapted |
| Layered Raster Editor | cloPRO/src/ui/forge.js | components/studio/ForgeEditor.tsx | Canvas 2D React Component |
| Studio Export Engine | cloPRO/src/export.js | lib/studio/exporter.ts | Extracted Client Utility |
| Pattern Generation Core | freesewing-v4 (@freesewing/core) | lib/patterns/generator.ts | Imported via NPM Dependency |
| Pattern Catalog | freesewing-v4 (@freesewing/*) | lib/patterns/designs/* | Imported via NPM Dependencies |
| Platform Architecture | feysefit/src/app/* | app/* (Next.js 16 App Router) | Migrated Platform Core |
| Security & Threat Defense | feysefit/src/lib/security/* | lib/security/* | Migrated Security Suite |
| Business Domain Services | feysefit/src/lib/services/* | lib/services/* | Migrated Service Layer |
| Database & RLS Schema | feysefit/schema.sql + patches | supabase/migrations/* | Primary PostgreSQL Migrations |
| 3D Garment Viewport | LetDesign/CanvasViewer.tsx (Concept) | components/studio/3D/GarmentViewer3D.tsx | Rewritten with new licensed GLB |
