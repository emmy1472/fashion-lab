# 01 - Workspace Inventory & Codebase Mapping

**Platform Project:** FASHION-LAB  
**Date:** October 2026  
**Auditor:** Principal Software Architect & Full-Stack Engineer  
**Workspace Root:** `c:\fashion-lab`  
**Execution Context:** Local Repository Deep Inspection (Antigravity Environment)

---

## 1. Executive Summary of Workspace Inspection

The workspace `c:\fashion-lab` contains seven independent open-source codebases organised across three functional categories, alongside dedicated research and notes directories:

- `01-web-apps/cloPRo` - Browser-based 2D garment customisation and graphics studio.
- `02-pattern-design/freesewing-v4` - Parametric made-to-measure pattern generation engine monorepo.
- `02-pattern-design/opensew-2` - Blender add-on for 2D pattern cutting, mesh landmarks, and 3D cloth physics.
- `02-pattern-design/seamly2d` - Professional desktop 2D patternmaking CAD suite (C++/Qt).
- `03-production-platform/feysefit` - Full-stack designer-client bespoke marketplace & project management MVP.
- `03-production-platform/LetDesign` - Custom apparel design canvas (Fabric.js) with 3D viewer (Three.js/R3F).
- `03-production-platform/medo` - Headless textile supply chain, artisanal commerce & partner production platform (MedusaJS v2).
- `04-research` - Research deliverables, architecture audits, and roadmaps.
- `05-notes` - Developer reference notes.

### Git Topography & Isolation Guarantee
Inspection verifies that **every single repository is an independent Git repository** with its own unique commit tree, remote pointers, and branch configurations:
- No repository is configured as a Git submodule of another.
- No repository is bound to a shared root monorepo.
- No cross-repository build scripts exist.
- Each repository's Git history and state must be strictly preserved without cross-contamination or accidental merging.

---

## 2. Comprehensive Inventory of Codebases

### 2.1 `01-web-apps/cloPRO`

* **Repository Root:** `c:\fashion-lab\01-web-apps\cloPRO`
* **Git Status:** 
  * Clean local branch. Commit: `e7f8987` (*cloPRO — custom apparel design studio*).
  * Remote Origin: `https://github.com/Chezburgar/cloPRO.git`.
* **Programming Languages & Frameworks:**
  * Vanilla ECMAScript (ES Modules / `.js`).
  * Native Browser DOM APIs: SVG 1.1/2.0 DOM, HTML5 Canvas 2D Context, `OffscreenCanvas`, Blob & URL APIs.
  * Zero runtime frameworks (No React, Vue, Svelte, Angular, or jQuery).
* **Application Entry Points:**
  * `index.html`: Core HTML shell containing studio workspace layout, modal systems, and Google Fonts references.
  * `src/main.js`: Bootstrap script initializing tab navigation, global keyboard listeners, and event hooks.
* **README & Installation Instructions:**
  * Highly detailed `README.md` covering all 31 garment models, print units (1 in = 21.5 canvas units), shortcuts, and architecture.
  * Zero build step required. Requires an HTTP server (`npx serve .`) due to ES Module CORS constraints under `file://`.
* **Dependency Manifests & Lockfiles:**
  * **None**. No `package.json`, no `node_modules`, no external build tooling.
* **Build Tools & Environment Requirements:**
  * Zero build tools. Standard modern browser (Chrome, Safari, Firefox, Edge).
* **Frontend & Backend Architecture:**
  * Pure client-side static web application.
  * **State Architecture:** Centralized reactive store in `src/state.js` managing garment colorways, artwork layer stack, undo/redo history (50 levels), and `localStorage` autosave.
  * **Render Architecture:** Pure functional SVG generation pipeline in `src/render.js`. Projects data state into an SVG DOM node representing the garment, shading overlays, textured knit/mesh patterns, and positioned artwork.
  * **Image Editor Subsystem:** Built-in raster graphic editor (`Forge`, `src/ui/forge.js`) featuring 16 canvas blend modes, layer stacks, adjustment filters, and vector rasterization.
  * **Backend Architecture:** Completely nonexistent; runs 100% offline in-browser.
* **Database Technology & Schema:**
  * Browser `localStorage` used for gallery persistence.
  * Proprietary `.project.json` (`.clopro.json`) schema representing complete garment configuration, graphic coordinates, scales, rotations, and roster data.
* **API Endpoints & Integrations:**
  * External DN font asset retrieval via Google Fonts API.
  * Zero backend REST or GraphQL endpoints.
* **License & Third-Party Dependencies:**
  * License: **MIT License** (`LICENSE`, Copyright 2026 Chezburgar).
  * Bundled / External Assets: Google Fonts (SIL Open Font License 1.1).
* **Tests, Example Data & Documentation:**
  * Zero automated unit tests.
  * Rich built-in library data: 31 garment geometry definitions (`src/data/garments.js`), 24 SVG procedural patterns (`src/data/patterns.js`), 82 vector graphics/emblems (`src/data/graphics.js`), 34 athletic palettes & 26 athletic fonts (`src/data/library.js`).

---

### 2.2 `02-pattern-design/freesewing-v4`

* **Repository Root:** `c:\fashion-lab\02-pattern-design\freesewing-v4`
* **Git Status:** 
  * Main branch of FreeSewing v4 upstream repository.
  * Remote Origin: `https://github.com/freesewing/freesewing.git`.
* **Programming Languages & Frameworks:**
  * TypeScript and Modern ECMAScript Modules (`.mjs`).
  * Monorepo Architecture managed with **Lerna 8**, **Nx 20**, and **npm workspaces**.
  * React 18/19 components in `packages/react`.
  * Next.js web platforms in `sites/org`, `sites/dev`, and `sites/studio`.
* **Application Entry Points:**
  * Root `package.json` configuring npm workspace packages (`designs/*`, `packages/*`, `plugins/*`, `sites/*`).
  * Core pattern library: `packages/core/src/index.mjs`.
  * React studio interface: `sites/studio/`.
* **README & Installation Instructions:**
  * Extensive documentation in root `README.md`, individual package docs, and online at `freesewing.dev`.
  * Requirements: Node.js `>= 20.0.0`, npm.
  * Setup: `npm run kickstart` (`npm install && husky && npm run reconfigure`).
* **Dependency Manifests & Lockfiles:**
  * Monorepo root `package.json`, over 80 independent child package manifests.
  * Core dependencies: `@freesewing/core-plugins`, `bezier-js`, `lodash.get`, `lodash.set`, `lodash.unset`, `lodash.clonedeep`, `hooks`.
  * Dev dependencies: Mocha, Chai, C8, ESLint 9, Prettier, Lerna, Nx.
* **Build Tools & Environment Requirements:**
  * Nx task runner, Babel, Lerna build pipeline.
  * Node.js 20+ required for ES module resolution and JSON module assertions.
* **Frontend & Backend Architecture:**
  * **Core Engine:** Isomorphic, headless computational geometry library (`packages/core`). Calculates 2D Bezier curves, offset curves, seam allowances, internal slash/spread, and generates mathematically pure SVG vector patterns.
  * **React Layer:** `@freesewing/react` provides visual components (`<Pattern />`, `<Draft />`), custom hooks (`useDesign`, `useControl`), and interactive pattern customizers.
  * **Backend Services:** Microservice backend in `backend/` managing remote accounts, cloud measurement vaults, and community patterns.
* **Database Technology & Schema:**
  * Backend utilizes MongoDB / Prisma, but the drafting core is purely stateless and in-memory.
  * Standalone body measurements schema defined in `measurements.yaml` (comprehensive anthropometric points: neck, chest, bust, waist, hips, inseam, etc.).
* **API Endpoints & Integrations:**
  * Strapi CMS localization and translation hooks (`scripts/strapi-*.mjs`).
  * CrowdIn i18n synchronization scripts.
* **License & Third-Party Dependencies:**
  * License: **MIT License** (`LICENSE`, Copyright 2022 Joost De Cock).
  * 100% commercially compatible permissive licensing.
* **Tests, Example Data & Documentation:**
  * World-class automated test suite. Exhaustive unit tests in `packages/core/tests/` testing curve offsets, intersections, boundary boxes, and clipping.
  * Over 60 complete parametric apparel designs bundled in `designs/` (e.g. `aaron`, `bella`, `brian`, `carlton`, `huey`, `jaeger`, `simon`, `titan`, `wahid`, `yuri`).
---

### 2.3 `02-pattern-design/opensew-2`

* **Repository Root:** `c:\fashion-lab\02-pattern-design\opensew-2`
* **Git Status:** 
  * Standalone codebase (Clothing Design for Blender).
  * Remote Origin: `https://github.com/opensew/opensew.git`.
* **Programming Languages & Frameworks:**
  * Pure Python 3.11+.
  * Blender Python API (`bpy`, `mathutils`, `bmesh`).
* **Application Entry Points:**
  * Blender Add-on package: `clothing_design/__init__.py`.
* **README & Installation Instructions:**
  * Detailed documentation in `README.md` and `clothing_design/README.md`.
  * Strictly requires desktop installation of **Blender 5.2** (unable to run under web/browser).
* **Dependency Manifests & Lockfiles:**
  * Zero pip manifests. Depends solely on Blender's built-in runtime and cloth physics solver.
* **Build Tools & Environment Requirements:**
  * Blender 5.2 executable runtime.
* **Frontend & Backend Architecture:**
  * Desktop 3D Viewport GUI inside Blender (`props.py`, `ui.py`, `workspace.py`).
  * Parametric 2D pattern block drafting (`build.py`), quad-grid remeshing (`props.py`), and 4-phase cloth simulation (`relax`, `weld`, sewing springs).
  * Animated verification via procedural walk and catwalk rigs.
* **Database Technology & Schema:**
  * Local files with bundled CC0 avatar meshes (`Nora`, `Theo` under `assets/`).
* **API Endpoints & Integrations:**
  * None. Fully desktop-bound.
* **License & Third-Party Dependencies:**
  * License: **GNU General Public License v3.0 (GPL-3.0)** (`LICENSE`, 35 KB).
  * Avatars: CC0 1.0 Universal Public Domain.
* **Tests, Example Data & Documentation:**
  * BLI-based tests: `test_bodies.py`, `test_fit.py`, `test_presets.py`.

---

### 2.4 `02-pattern-design/seamly2d`

* **Repository Root:** `c:\fashion-lab\02-pattern-design\seamly2d`
* *Git Status:** 
  * Seamly2D upstream Git clone.
  * Remote Origin: `https://github.com/Fashion-Freedom/Seamly2D.git`.
* **Programming Languages & Frameworks:**
  * C++ (C++17).
  * Qt 5 / Qt 6 GUI and Core toolkits.
  * Build system: `qmake` (`Seamly2D.pro`, `common.pri`).
* **Application Entry Points:**
  * `src/app/seamly2d/main.cpp`: Desktop 2D CAD drafting application.
  * `src/app/seamlyme/main.cpp`: Companion body measurement editor (SeamlyMe).
* **README & Installation Instructions:**
  * Developer readmes in `README.md` and `README-DEVELOPER.md`.
  * Requires local C++ toolchain (MSVC/GCC/Clang), Qt SDK, Xerces-C Library.
* **Dependency Manifests & Lockfiles:**
  * Qt project files (`.pro`, `.pri`).
  * Static libraries: `tools`, `vtools`, `vpatterndb`, `vgeometry`, `vformat`, `qmuparser`, `xerces-c`.
* **Build Tools & Environment Requirements:**
  * `qmake`, `make`/`nmake`, `windeployqt` / `macdeployqt`.
* **Frontend & Backend Architecture:**
  * Native Qt Graphics View Framework drafting platform. Zero browser compatibility.
* **Database Technology & Schema:**
  * XML-based file formats: `.sm2d` (patterns), `.smm` (individual measurements), `.smms` (multisize graded).
* **API Endpoints & Integrations:**
  * None. Desktop-only CAD.
* **License & Third-Party Dependencies:**
  * License: **GNU General Public License v3.0 (GPL-3.0)** (`LICENSE.md`).
* **Tests, Example Data & Documentation:**
  * Native C++ tests under `src/test/`. Samples in `share/samples/`.

---

### 2.5 `03-production-platform/feysefit`

* **Repository Root:** `c:\fashion-lab\03-production-platform\feysefit`
* **Git Status:** 
  * Clean git repository of designer-client platform MVP.
* **Programming Languages & Frameworks:**
  * **TypeScript 5.x** (Strict Mode).
  * **Next.js 16.3.1** (App Router architecture) hardened with `react-server` & `server-only`.
  * **React 19.2.4** / React DOM 19.
  * **Tailwind CSS v4** (`@tailwindcss/postcss`).
  * **Supabase Ecosystem** (`@supabase/supabase-js` v2.110.0, `@supabase/ssr` v0.12.0).
* **Application Entry Points:**
  * `src/app/layout.tsx`: Root application layout and global token definitions.
  * `src/app/page.tsx`: Landing portal.
  * `src/app/api/v1/`: Authenticated NEXT.JS Route Handlers.
* **README & Installation Instructions:**
  * Exhaustive `README.md` documenting Stitch design tokens, demo accounts (designer, customer, admin), and DB setup.
  * Setup: `npm install && cp .env.example .env && npm run db:push && npm run dev`.
* **Dependency Manifests & Lockfiles:**
  * `package.json`.
  * Key dependencies: `@prisma/client` ~6.19.0, `@supabase/ssr`, `@supabase/supabase-js`, `bcryptjs`, `jose`, `jsPDFdautotable`, `lucide-react`, `server-only`, `sharp`, `tailwind-merge`.
* **Build Tools & Environment Requirements:**
  * Node.js `>= 20.0.0`, Next.js compiler.
* **Frontend & Backend Architecture:**
  * Full-stack isomorphic Next.js 16 application.
  * **Security Layer:** Rate limiters (`rate-limit-core.ts`), HMAC signed states (`signed-state.ts`), Cloudflare Turnstile `captcha-policy.ts`, auth abuse guards (`auth-abuse.ts`), SSRF-safe outbound fetchers (`safe-outbound-fetch.ts`), and upload validators (`upload-bytes.ts`).
  * **Domain Services: 1*over 25 audited services under `src/lib/services/`: `authService`, `designerService`, `customerService`, `projectService`, `appointmentService`, `testimonialService`, `marketplaceService`, `measurementService`, `storageService`, etc.
* **Database Technology & Schema:**
  * Production: **Supabase PostgreSQL** with exhaustive Row Level Security (RLS). 60+ production sql patches (`schema.sql` 50 KB, `patch-rls-anti-poaching.sql` 19 KB, `patch-security-audit-followup.sql`, etc.).
  * Complete TypeScript DB contract in `src/lib/types/database.ts` (988 lines, 32 KB).
* **API Endpoints & Integrations:**
  * REST APIs: `/api/v1/projects`, `/api/v1/designers`, `/api/v1/customers`, `/api/v1/invites`, `/api/v1/marketplace`, `/api/v1/measurements`, `/api/v1/unlink-requests`.
  * Email provider: Resend API. Threat defense: Cloudflare Turnstile.
* **License & Third-Party Dependencies:**
  * Proprietary / Unlicensed (Internal MVP, no root LICENSE file).
* **Tests, Example Data & Documentation:**
  * 24 automated unit & security test suites run via `tsx --test` (auth security, RBAC matrix, Rate limits, Session binding, Turnstile, and Server-only guards).

---

### 2.6 `03-production-platform/LetDesign`

* **Repository Root:** `c:\fashion-lab\03-production-platform\LetDesign`
* **Git Status:** 
  * Standalone Git repository. Origin: `https://github.com/Kaimc2/LetDesign.git`.
* **Programming Languages & Frameworks:**
  * TypeScript 5.2, React 18.2, Vite 5.4.
  * **Fabric.js 5.3.0** (2 HTML5 canvas drawing & placement).
  * **Three.js 0.164** and **@react-three/fiber 8.16** / **@react-three/drei 9.109** (3D garment viewport).
  * Tailwind CSS 3.4.
* **Application Entry Points:**
  * `index.html`, `src/main.tsx`, `src/routes/routes.tsx`.
* **README & Installation Instructions:**
  * README.covers customization and tailor commissions. References external backend: `https://github.com/Kaimc2/CapstoneII-Backend`.
* **Dependency Manifests & Lockfiles:**
  * `package.json`, `package-lock.json`.
  * Key deps: `three`, `fabric`, `@react-three/fiber`, `@react-three/drei`, `axios`, `laravel-echo`, `pusher-js`, `react-router-dom`.
* **Build Tools & Environment Requirements:**
  * Vite 5.4.
* **Frontend & Backend Architecture:**
  * Single Page Application (SQA).
  * **CRITICAL GIPPING: Backend is Completely Missing.** The application depends entirely on an external PHP/Laravel api that does not exist in this workspace.
  * Valuable reusable frontend components: `fabricUtils.ts` (16 KB) and React Three Fiber viewer (`CanvasViewer.tsx`).
* **Database Technology & Schema:**
  * None in local workspace.
* **License & Third-Party Dependencies:**
  * Unlicensed / No LICENSE file. Bundled 3D mesh: `public/t_shirt_mod.glb@ (5.4 MB).
* **Tests, Example Data & Documentation:**
  * Zero automated tests.

---

### 2.7 `03-production-platform/medo`

* **Repository Root:** `c:\fashion-lab\03-production-platform\medo`
* **Git Status:** 
  * Monorepo tracking Jaal Yantra Textiles v2. Origin: `https://github.com/Jaal-Yantra-Textiles/v2`.
* **Programming Languages & Frameworks:**
  * TypeScript, **pnpm workspaces** + **Turborepo**.
  * **MedusaJS v2** (Textile commerce & production backend).
  * Next.js (web storefront), React (partner-ui), Expo React Native (mobile).
* **Application Entry Points:**
  * `apps/backend/` (MedusaJS server), `apps/storefront/` (Next.js storefront), `apps/partner-ui/` (Partner Portal).
* **README & Installation Instructions:**
  * Comprehensive documentation on textile traceability, craftsmanship, pre-production releases, and partner assignments.
  * Setup: `pnpm install && yarn medusa migrations run && yarn start`.
* **Dependency Manifests & Lockfiles:**
  * `pnpm-lock.yaml` (2 MB lockfile), `pnpm-workspace.yaml`, `package.json`.
* **Build Tools & Environment Requirements:**
  * pnpm, Node.js 18/20, Turborepo.
* **Frontend & Backend Architecture:**
  * Microservice / modular monolith architecture for textile manufacturing.
  * MedusaJS 2 custom modules: `designs`, `tasks`, `inventory_orders`, `partner`, `analytics`, `socials`.
* **Database Technology & Schema:**
  * PostgreSQL (Medusa MikroORM / TypeORM schemas).
* **API Endpoints & Integrations:**
  * MedusaJS REST APIs, Etsy sync, Faire sync, DTDC shipping.
* **License & Third-Party Dependencies:**
  * Dual **MIT License** (Medusa core MIT, Jaal Yantra Textiles MIT).
* **Tests, Example Data & Documentation:**
  * Playwright E2E tests under `e2e/`.

---

## 3. Comparative Synthesis & Architectural Observations

| Metric | cloPRO | freesewing-v4 | opensew-2 | seamly2d | feysefit | LetDesign | medo |
|---a|---|---|---|---|---|---|---|
| **Runtime Target** | Browser SPA | Node / Browser | Blender 5.2 | Desktop OS | Next.js / Node | Browser SPA | Node / Native |
| **Primary Language** | Vanilla JS | TypeScript | Python | C++ | TypeScript | TypeScript | TypeScript |
| **UI Canvas Tech** | SVG DOM + 2dCanvas | SVG Vectors | Blender 3D | Qt Graphics | React DOM | Fabric.js + R3F | React DOM |
| **Database Model** | localStorage / JSON | Stateless Core | .blend scenes | XML (.sm2d) | Supabase Postgres | MySQL (External) | Postgres (Medusa) |
| **License Status** | MIT (Permissive) | MIT (Permissive) | GLL-3.0 (Copyleft) | GLL-3.0 (Copyleft) | Unlicensed /Prop | Unlicensed / Capstone | MIT (Permissive) |
| **Proposed Role** | **Studio Engine** | **CAD Pattern Lib** | **External Desktop** | **External Desktop** | **Platform Backbone** | **Canvas/3D Ref only** | **Supply-Chain Ref** |
